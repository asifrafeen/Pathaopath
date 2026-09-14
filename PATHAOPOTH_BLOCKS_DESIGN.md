# PathaoPoth on SELISE Blocks — Schema, Flow, and Flow-to-Schema Mapping

This document adapts the agreed PathaoPoth design (`SCHEMA_AND_WORKFLOW.md`) to the SELISE Blocks
platform. The business workflow is unchanged. What changes is the storage model: the original design
targets a relational database with foreign keys, transactions, and partial unique indexes; Blocks
Data Gateway is a document store with none of those. This document records the patches applied, the
resulting collections, the access model, and — in Section 6 — exactly which collections each step of
the flow reads and writes.

Status: proposed implementation design. Nothing in here has been pushed to the tenant.

---

## 1. Patch record

Seven differences between the relational design and what Blocks provides. Each is listed with the
decision taken.

| # | Constraint | Decision |
|---|---|---|
| P1 | `decimal(12,2)` unavailable. Gateway scalars are `String, Int, Float, Boolean, DateTime, ID`; the schema validator explicitly rejects `Decimal` and `Long` with *"Use 'Float' instead."* | **Use `Float`.** Accepted: binary floating point can drift on repeated addition, so COD totals and reversing entries may not net exactly to zero. Mitigated by rounding at the edge and by treating `money_transactions` as an operational log, not a ledger. |
| P2 | No partial or sparse unique indexes. `IsUnique` exists but takes no filter expression. | **Indexes dropped.** "One open case per parcel", "one active movement per case", and "one current ownership period" are enforced in the write path only. They are conventions, not constraints. |
| P3 | No multi-document transactions. Hub arrival must update five things at once. | **Commit-point pattern.** The `HubReceipt` write is the single commit point; everything else is derived state repaired forward. A scheduled reconciliation workflow completes half-applied arrivals. |
| P4 | No foreign keys, no triggers, no cross-collection constraints. Joins are expensive. | **Denormalised for NoSQL.** Bounded child data is embedded; unbounded history stays in its own collection with denormalised lookup fields so queues render without joins. |
| P5 | Duplicate identity store. | **`users` collection removed.** Blocks IAM is the identity source. Records carry `userId` plus a denormalised `name` snapshot for display. |
| P6 | Hub-to-hub transfer needs to be traceable per parcel. | **`ParcelMovement` carries `parcelId`** (in addition to `caseId`), so a parcel's full transport history is one query with no case join. |
| P7 | No `Time` or date-only scalar type. | Local calendar dates and times of day are `String` (`"2026-09-16"`, `"18:00"`) with an explicit `timezone`; true instants are `DateTime` stored UTC. |

### Platform-managed fields — never declare these

Blocks adds these to every entity automatically. Declaring them breaks the push:

`ItemId`, `CreatedDate`, `CreatedBy`, `LastUpdatedDate`, `LastUpdatedBy`, `Language`, `OrganizationId`, `Tags`

Consequences: every `id PK` in the original design becomes the platform's `ItemId`, and every
`created_at` becomes `CreatedDate`. Both are dropped from the field tables below.

### The `OrganizationId` subtlety

`OrganizationId` is stamped from the caller's token **on insert and preserved on update**. It
therefore records the hub that *created* a record, permanently. Case ownership transfers between
hubs, so `OrganizationId` cannot be the ownership scope.

Every collection that needs hub-scoped access therefore carries an explicit, **mutable**
`ownerHubOrgId` (or `toHubOrgId` for incoming work), maintained by the write path and matched against
the `organization_id` token claim by row-level policies. `OrganizationId` is left alone and is useful
only as an audit trail of origin.

---

## 2. Naming and type conventions

- Collection names are PascalCase singular. Field names are camelCase.
- `*Id` fields hold the `ItemId` of the referenced record. Nothing enforces that the target exists.
- Embedded snapshots (`ownerHub`, `assignedRider`) are **copies taken at write time**. They are
  intentionally not kept in sync with the master record; they describe the state when the event
  happened.
- Enumerated values are `String` with a documented value list, enforced by a Data Gateway validation
  rule (`type 1`, Regex) rather than a database enum.
- All monetary fields are `Float` with a sibling `currency` (`String`, default `BDT`).
- `timezone` defaults to `Asia/Dhaka`.

---

## 3. Collections

### 3.1 `Hub`

Operational hub record. Pairs 1:1 with a Blocks Organization, which is what supplies the
`organization_id` token claim used for access scoping.

| Field | Type | Meaning |
|---|---|---|
| `code` | String | Short unique code, e.g. `MIRPUR10` |
| `name` | String | Display name |
| `address` | String | Physical address |
| `organizationId` | String | Blocks Organization id for this hub — the access-scoping key |
| `isActive` | Boolean | Deactivate rather than delete |
| `serviceAreas` | Object[] | Embedded. `{ areaCode, areaName, isActive }` |
| `connections` | Object[] | Embedded. `{ toHubId, toHubCode, estimatedTravelMinutes, isActive }` — directed; the reverse link is its own entry |

`hub_service_areas` and `hub_connections` from the relational design are embedded here. Both are
small, bounded, and always read together with the hub, so they cost nothing to carry and remove two
joins from routing decisions.

### 3.2 `Sender`

Master sender record. Parcels embed a snapshot rather than joining.

| Field | Type |
|---|---|
| `name` | String |
| `phone` | String |
| `returnAddress` | String |

### 3.3 `Parcel`

| Field | Type | Meaning |
|---|---|---|
| `trackingNumber` | String | Scan/search identifier. Uniqueness is app-enforced |
| `senderId` | String | Master `Sender` record |
| `sender` | Object | Embedded snapshot `{ name, phone, returnAddress }` at shipment time |
| `receiverName` | String | Intended receiver |
| `receiverPhone` | String | **Restricted.** Never present in sender-facing data |
| `originalDeliveryAddress` | String | Address as accepted |
| `currentDeliveryAddress` | String | Latest confirmed address |
| `originHub` | Object | `{ hubId, code, name }` — the accepting hub, never changed by returns |
| `destinationHub` | Object | `{ hubId, code, name }`, nullable until a serving hub is confirmed |
| `codAmount` | Float | Expected collection. Not proof of receipt |
| `currency` | String | Default `BDT` |

### 3.4 `ExceptionCase`

The queue-driving document. Denormalised so hub, rider, and care queues render from this collection
alone.

| Field | Type | Meaning |
|---|---|---|
| `parcelId` | String | Related parcel |
| `parcel` | Object | Snapshot `{ trackingNumber, codAmount, currency, receiverName, currentDeliveryAddress }`. **No `receiverPhone`** |
| `caseType` | String | `refused_delivery`, `cancelled_delivery` |
| `status` | String | See status list below |
| `ownerHubId` | String | Responsible hub |
| `ownerHubOrgId` | String | **Mutable access key.** Organization id of the owner hub; matched against the token claim |
| `ownerHub` | Object | Snapshot `{ code, name }` |
| `accountableStaffId` | String | IAM user id |
| `accountableStaff` | Object | Snapshot `{ name }` |
| `custodyType` | String | `hub`, `rider`, `sender`, `receiver`, `unknown` |
| `custodyHubId` | String? | Set only when `custodyType = hub` |
| `custodyRiderId` | String? | Set only when `custodyType = rider` |
| `custodyHolder` | Object? | Snapshot `{ name, code }` for display |
| `latestDecision` | Object? | Snapshot of the current confirmed decision `{ decisionId, action, targetHubId, targetHubCode, redeliveryDateLocal, windowStart, windowEnd, timezone, confirmedAt }` |
| `originHubCode` | String | Denormalised for reporting |
| `destinationHubCode` | String? | Denormalised for reporting |
| `routeKey` | String | e.g. `MIRPUR10>CTG_GEC`. Precomputed so route aggregation needs no joins |
| `attemptCount` | Int | Delivery attempts recorded so far |
| `receiptCount` | Int | Hub receipts appended |
| `openedAt` | DateTime | Case opened |
| `slaDueAt` | DateTime? | Policy-derived deadline |
| `slaBreached` | Boolean | Maintained by the SLA workflow; also derivable from `slaDueAt` at read time |
| `closedAt` | DateTime? | Closure time |
| `resolution` | String? | `delivered`, `returned_to_sender`, `loss_writeoff` |

**Status values:** `awaiting_review`, `awaiting_care`, `on_hold`, `redelivery_scheduled`,
`ready_for_dispatch`, `in_transit`, `loss_review`, `closed`.

Ownership and custody fields are a snapshot for fast queues. `OwnershipHistory` is the authoritative
record; when the two disagree, history wins and the snapshot is repaired.

### 3.5 `HubReceipt`

Append-only. **This is the commit point for every arrival** (see P3 and Section 5.2).

| Field | Type | Meaning |
|---|---|---|
| `caseId` | String | Related case |
| `parcelId` | String | Denormalised for per-parcel history |
| `trackingNumber` | String | Denormalised for scan lookup |
| `hubId` | String | Receiving hub |
| `hubOrgId` | String | Access key for the receiving hub |
| `hubCode` | String | Snapshot |
| `receivedByStaffId` | String | IAM user id of accepting staff |
| `receivedByStaff` | Object | Snapshot `{ name }` |
| `receivedFromRiderId` | String? | Handing-over rider; absent on first intake |
| `receivedFromRider` | Object? | Snapshot `{ name }` |
| `incomingMovementId` | String? | The movement this arrival completes. **Idempotency key** |
| `receivedAt` | DateTime | Actual handover time |
| `deliveryAttemptAt` | DateTime? | Most relevant delivery attempt |
| `reportedReason` | String | Staff-recorded reason code or free text |
| `parcelCondition` | String | `intact`, `opened`, `damaged` |
| `appliedState` | String | `pending`, `applied` — drives reconciliation (Section 5.2) |

### 3.6 `CaseNote`

Immutable. Corrections append a new note referencing the earlier one. All raw notes are internal and
never sender-visible.

| Field | Type |
|---|---|
| `caseId` | String |
| `parcelId` | String |
| `receiptId` | String? |
| `recordedByUserId` | String |
| `sourceRiderId` | String? |
| `rawText` | String — exact original wording, preserved verbatim including Banglish |
| `occurredAt` | DateTime? |
| `supersedesNoteId` | String? |

### 3.7 `AiAnalysis`

Written by the AI workflow. Deferred for now; the collection exists so adding AI later is inserting a
workflow node, not a schema change.

| Field | Type | Meaning |
|---|---|---|
| `noteId` | String | Analysed note |
| `caseId` | String | Denormalised |
| `parcelId` | String | Denormalised |
| `status` | String | `pending`, `completed`, `failed` |
| `structuredOutput` | String | Serialised JSON. `String`, not a typed object, because the shape evolves with the prompt |
| `recommendedAction` | String? | Same value set as `CaseDecision.action` |
| `proposedTargetHubId` | String? | Final target |
| `proposedNextHubId` | String? | Immediate next stop |
| `proposedRedeliveryDateLocal` | String? | `YYYY-MM-DD` |
| `proposedWindowStart` | String? | `HH:mm` |
| `proposedWindowEnd` | String? | `HH:mm` |
| `timezone` | String | Default `Asia/Dhaka` |
| `confidence` | Float? | 0–1 |
| `requiresManualReview` | Boolean | True when confidence is low or context is insufficient |
| `modelVersion` | String | |
| `promptVersion` | String | |
| `errorMessage` | String? | |

Unknown facts are `null`, never `false`. Multiple analyses may reference one note; none are
overwritten.

### 3.8 `CaseDecision`

Append-only. Only human-confirmed decisions land here.

| Field | Type | Meaning |
|---|---|---|
| `caseId`, `parcelId` | String | |
| `aiAnalysisId` | String? | The proposal this confirms, if any |
| `action` | String | `redeliver`, `transfer_hub`, `return_to_origin`, `return_to_sender`, `care_review`, `loss_review`, `hold` |
| `targetHubId` | String? | Final target |
| `targetHubCode` | String? | Snapshot |
| `confirmedDeliveryAddress` | String? | A requested address change is not a confirmed one |
| `redeliveryDateLocal` | String? | `YYYY-MM-DD` |
| `windowStart`, `windowEnd` | String? | `HH:mm` |
| `timezone` | String | Default `Asia/Dhaka` |
| `reason` | String | |
| `confirmedByUserId` | String | |
| `confirmedAt` | DateTime | |
| `supersedesDecisionId` | String? | Replacements append |
| `isSuperseded` | Boolean | Maintained when a replacement is written, so "current decision" is a single-field filter |

### 3.9 `ParcelMovement`

One transport leg, not a route. Carries `parcelId` so a parcel's transport history is one query
(P6).

| Field | Type | Meaning |
|---|---|---|
| `caseId`, `parcelId` | String | |
| `trackingNumber` | String | Denormalised |
| `decisionId` | String | Authorising decision |
| `purpose` | String | `hub_transfer`, `redelivery`, `sender_return` |
| `fromHubId`, `fromHubCode` | String | Sending hub |
| `destinationType` | String | `hub`, `receiver`, `sender` |
| `toHubId`, `toHubCode` | String? | Required when `destinationType = hub` |
| `toHubOrgId` | String? | **Access key** — lets the receiving hub see expected incoming work |
| `destinationAddressSnapshot` | String | Required for `receiver`/`sender` destinations |
| `assignedRiderId` | String | IAM user id |
| `assignedRider` | Object | Snapshot `{ name, phone }` |
| `status` | String | `planned`, `picked_up`, `received`, `failed`, `cancelled` |
| `createdByStaffId` | String | |
| `pickupAcknowledgedAt` | DateTime? | |
| `expectedArrivalAt` | DateTime? | |
| `completedAt` | DateTime? | |
| `recipientName` | String? | |
| `deliveryProofReference` | String? | |
| `failureReason` | String? | |

`received` means accepted at the intended endpoint. A failed delivery followed by a return to a hub
is recorded as a new receipt against the case — it must never mark the failed destination
`received`.

### 3.10 `OwnershipHistory`

Append-only. The authoritative answer to "who owned this case, when".

| Field | Type |
|---|---|
| `caseId`, `parcelId` | String |
| `hubId`, `hubCode` | String |
| `accountableStaffId` | String |
| `accountableStaff` | Object — `{ name }` |
| `startedAt` | DateTime |
| `endedAt` | DateTime? |
| `receiptId` | String? — the receipt that opened this period |
| `isCurrent` | Boolean — maintained on close so the open period is a single-field filter |

Staff reassignment within the same hub also ends one period and starts another. On closure the active
period is ended while the case retains the last owner for reporting.

### 3.11 Supporting collections

| Collection | Fields |
|---|---|
| `CareTask` | `caseId`, `parcelId`, `requestedByUserId`, `assignedCareUserId?`, `assignedCareUser?` (snapshot), `reason`, `status` (`open`, `in_progress`, `resolved`, `cancelled`), `outcome?`, `resolvedAt?` |
| `MoneyTransaction` | `caseId`, `parcelId`, `receiptId?`, `movementId?`, `type` (`customer_collection`, `rider_handover`, `refund`, `sender_settlement`, `compensation`), `amount` (Float), `currency`, `fromParty` (Object), `toParty` (Object), `occurredAt`, `recordedByUserId`, `reference?`, `reversesTransactionId?` |
| `LossReview` | `caseId`, `parcelId`, `reason`, `claimedAmount` (Float), `currency`, `status` (`pending`, `approved`, `rejected`), `requestedByUserId`, `approvedByUserId?`, `approvedAmount?` (Float), `decidedAt?`, `settlementTransactionId?` |
| `CaseEvent` | `caseId`, `parcelId`, `eventType`, `actorUserId?`, `actorName?`, `occurredAt`, `details` (String, serialised JSON). Append-only; null actor means automated |
| `Attachment` | `caseId`, `parcelId`, `receiptId?`, `noteId?`, `lossReviewId?`, `storageKey`, `mimeType`, `uploadedByUserId`. `storageKey` references Blocks Storage |
| `SenderUpdate` | `caseId`, `parcelId`, `trackingNumber`, `publicToken`, `publicMessage`, `statusLabel`, `expectedResolutionAt?`, `publishedByUserId`, `publishedAt`. **Sender-safe by construction** |

`money_parties` is gone. Counterparties are embedded typed objects
(`{ type, userId?, hubId?, senderId?, parcelId?, displayName }`) on the transaction, removing a join
from every money query. The type/field consistency rule is a write-path check.

Corrections to money records use reversing entries; posted amounts are never edited.

### 3.12 `DailyVolume` — optional, needed for rates

The original design correctly notes that exception **rates** need a denominator that exception-only
intake cannot supply. If rate reporting is required rather than counts and trends, this collection
supplies it:

| Field | Type |
|---|---|
| `dateLocal` | String — `YYYY-MM-DD` |
| `hubCode` | String |
| `routeKey` | String? |
| `riderId` | String? |
| `parcelCount` | Int |

Populated by a feed or import from the wider delivery system. Until it exists, the manager view shows
counts and week-over-week change, not rates. This is a business decision still open.

---

## 4. Access model

Nothing is filtered implicitly. The Data Gateway applies **no automatic organisation filter to
reads** — a collection with no policy is readable by every authenticated user. Access rules are
therefore load-bearing security and must be verified per role, not assumed.

Policies support row-level (RLS) and column-level (CLS) security, allow/deny with priority, nested
AND/OR groups, and comparison of `AUTH` token claims (`user_id`, `roles`, `permissions`,
`organization_id`, `tenant_id`) against record fields.

### Row-level

| Who | Collection | Rule |
|---|---|---|
| Hub staff | `ExceptionCase` | `ownerHubOrgId == AUTH.organization_id` |
| Hub staff — incoming work | `ParcelMovement` | `toHubOrgId == AUTH.organization_id` OR `fromHubId` matches their hub |
| Rider | `ParcelMovement` | `assignedRiderId == AUTH.user_id` |
| Care | `ExceptionCase`, `CareTask` | allow where `AUTH.roles CONTAIN care`, priority above the hub filter |
| Ops manager | reporting collections | allow where `AUTH.roles CONTAIN ops_manager` |

Care and ops are cross-hub by *not* being narrowed, since nothing is filtered by default. The work is
restricting hub staff and riders downward.

### Column-level

`Parcel.receiverPhone` and every `CaseNote.rawText` are internal. They are protected by CLS deny
policies and by withholding the corresponding `DataProtection` (`type 3`) permission, which causes
the gateway to return the field masked.

### The sender view

Senders are unauthenticated for now, reached by an open link. **Anonymous callers have no token
claims, so role-based masking has nothing to match against** — exposing `ExceptionCase` publicly
would silently defeat the very masking that protects receiver phone numbers and internal notes.

The open link therefore reads `SenderUpdate` only, matched on `publicToken`. That collection contains
no sensitive fields at all, so sender safety does not depend on a policy evaluating correctly. When
senders become authenticated users, add an RLS rule on `Parcel` (`senderId == AUTH.user_id`) and the
same `SenderUpdate` records continue to work unchanged.

---

## 5. Flow

The business workflow is unchanged from `SCHEMA_AND_WORKFLOW.md`. This section covers only what the
platform changes.

### 5.1 End to end

Receive parcel at hub → record handover and raw note → save receipt and assign hub ownership → AI
proposes action, destination and schedule → staff confirms or requests care review → prepare action →
assign rider if transport is needed → rider acknowledges pickup → track travel → acknowledge receipt
→ continue routing or record final resolution → settle money → close case.

### 5.2 Hub arrival without transactions

The original design requires receipt acknowledgement, movement completion, custody update, and
ownership transfer to be atomic. There is no transaction API, so the sequence becomes an idempotent,
ordered state transition with one commit point:

1. **Write `HubReceipt`** with `appliedState = pending` and `incomingMovementId` set. This is the
   commit point — the arrival is now a durable fact.
2. Complete the incoming `ParcelMovement` (`status = received`, `completedAt`).
3. End the current `OwnershipHistory` period (`endedAt`, `isCurrent = false`).
4. Start the new `OwnershipHistory` period for the receiving hub and named staff.
5. Update the `ExceptionCase` snapshot: `ownerHubId`, `ownerHubOrgId`, `ownerHub`, custody fields,
   `receiptCount`, `status`.
6. Append a `CaseEvent`.
7. Set the receipt's `appliedState = applied`.

If the process dies between any two steps, the receipt exists with `appliedState = pending`. A
**scheduled reconciliation workflow** finds those and replays steps 2–7, which are all idempotent
(each is a set-to-target-value, not an increment). `incomingMovementId` prevents a duplicate arrival
from being recorded for the same movement even without a unique index, because the reconciliation
sweep treats an existing receipt for that movement as authoritative.

This is a genuine weakening of the original atomicity requirement: there is a window during which the
case snapshot lags the receipt. The window is bounded by the reconciliation interval, and the
authoritative records (`HubReceipt`, `OwnershipHistory`) are always correct — only the denormalised
snapshot on `ExceptionCase` can be briefly stale.

### 5.3 Ownership is never "nobody"

The outgoing owner stays accountable until the incoming side acknowledges. A planned or in-flight
movement does not transfer ownership — only a `HubReceipt` does. So between dispatch and arrival the
sending hub remains the owner, and there is no interval where ownership is unassigned. The invariant
holds by construction rather than by transaction, which is what makes it safe without atomic writes.

Custody moves independently: it follows the rider at pickup while ownership stays with the sending
hub.

### 5.4 Automation

Workflows are authored in the Blocks Logic visual builder. The available building blocks are:

- **Triggers:** `schedule` (interval or cron), `dataGateway` (fires on record change), `webhook`,
  `email`
- **Actions:** `dataAction` (read/write Data Gateway), `httpRequest`, `sendMail`, `aiAgent`
- **Logic/transform:** `if`, `code`, `setfield`

Planned workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| SLA sweep | `schedule` | Flag cases past `slaDueAt` that are not closed; notify the owner hub |
| Arrival reconciliation | `schedule` | Replay steps 2–7 for receipts stuck at `appliedState = pending` |
| Handoff escalation | `schedule` | Escalate movements dispatched but not acknowledged past threshold |
| Integrity check | `schedule` | Report violations of the app-enforced invariants (multiple open cases per parcel, overlapping ownership periods) |
| AI analysis | `dataGateway` on `CaseNote` insert | Write `AiAnalysis`. **Deferred** — node exists, agent not yet configured |
| Sender update publish | `dataGateway` on `CaseDecision` insert | Draft a `SenderUpdate` for human review before publishing |

SLA flagging does not strictly require the scheduler: a breach is computable at read time from
`slaDueAt`. The workflow is what turns a passive flag into a push notification.

---

## 6. Flow-to-schema mapping

Which collections each step reads and writes. `W` = written, `R` = read.

| # | Step | Writes | Reads |
|---|---|---|---|
| 1 | Staff scans tracking number | — | `Parcel`, `ExceptionCase` (find open case) |
| 2 | Create case, or reuse the open one | `ExceptionCase` W, `OwnershipHistory` W (first period), `CaseEvent` W | `Parcel`, `Hub` |
| 3 | Record hub receipt | `HubReceipt` W (`pending`), `ExceptionCase` W (counts, custody), `CaseEvent` W | `Hub`, IAM user |
| 4 | Record raw rider note | `CaseNote` W | — |
| 5 | AI analysis *(deferred)* | `AiAnalysis` W | `CaseNote`, `ExceptionCase`, `Hub` (coverage/connections) |
| 6 | Staff reviews proposal | — | `AiAnalysis`, `CaseNote`, `ExceptionCase` |
| 7 | Staff confirms decision | `CaseDecision` W, `ExceptionCase` W (`latestDecision`, `status`), `CaseEvent` W | `AiAnalysis`, `Hub` |
| 7a | Staff requests care review | `CareTask` W, `ExceptionCase` W (`status = awaiting_care`) | — |
| 7b | Care records outcome | `CareTask` W (resolved), `CaseDecision` W | `ExceptionCase`, `CaseNote` |
| 8 | Confirmed address change | `Parcel` W (`currentDeliveryAddress`, `destinationHub`), `CaseEvent` W | `Hub` (service areas) |
| 9 | Plan movement, assign rider | `ParcelMovement` W (`planned`), `ExceptionCase` W (`status = ready_for_dispatch`), `CaseEvent` W | `CaseDecision`, `Hub` (connections), IAM user |
| 10 | Rider acknowledges pickup | `ParcelMovement` W (`picked_up`), `ExceptionCase` W (custody → rider), `CaseEvent` W | `ParcelMovement` |
| 11 | In transit | — | `ParcelMovement` |
| 12 | Hub arrival acknowledged | `HubReceipt` W (commit point), `ParcelMovement` W (`received`), `OwnershipHistory` W ×2 (end + start), `ExceptionCase` W (owner, custody), `CaseEvent` W | `ParcelMovement`, `Hub` |
| 13 | Movement fails | `ParcelMovement` W (`failed`), `CaseEvent` W; custody unchanged until acknowledged | — |
| 14 | Delivered to receiver | `ParcelMovement` W (`received`, proof), `MoneyTransaction` W (if COD), `ExceptionCase` W (`resolution = delivered`), `CaseEvent` W | `Parcel` |
| 15 | Returned to sender | `ParcelMovement` W, `MoneyTransaction` W (settlement), `ExceptionCase` W (`resolution = returned_to_sender`) | `Parcel`, `Sender` |
| 16 | Loss review requested | `LossReview` W (`pending`), `ExceptionCase` W (`status = loss_review`), `Attachment` W (evidence) | — |
| 17 | Loss approved | `LossReview` W (`approved`), `MoneyTransaction` W, `ExceptionCase` W (`resolution = loss_writeoff`) | — |
| 18 | Publish sender update | `SenderUpdate` W | `ExceptionCase`, `CaseDecision` |
| 19 | Close case | `ExceptionCase` W (`closedAt`, `status = closed`), `OwnershipHistory` W (end current), `CaseEvent` W | `MoneyTransaction`, `LossReview` |
| — | SLA sweep *(scheduled)* | `ExceptionCase` W (`slaBreached`), notification | `ExceptionCase` |
| — | Reconciliation *(scheduled)* | steps 2–7 of §5.2 | `HubReceipt` where `appliedState = pending` |
| — | Sender opens public link | — | `SenderUpdate` by `publicToken` only |

### Reading a parcel's full history

Because `parcelId` is denormalised onto every child collection (P6), a parcel's complete activity is
a set of independent single-collection queries with no joins:

`HubReceipt`, `ParcelMovement`, `CaseNote`, `CaseDecision`, `CaseEvent`, `MoneyTransaction`, all
filtered by `parcelId` and sorted by time.

---

## 7. Open items

Carried forward from the original design, still unresolved:

- Refusal reason list, SLA thresholds, escalation behaviour.
- Who approves address changes, loss write-offs, and monetary adjustments.
- How customer cancellation and final-recipient acceptance are verified.
- Whether redelivery scheduling needs capacity limits or fixed slots.
- Authoritative hub coverage and route selection rules.
- Source of parcel records, and when senders become authenticated users.
- Financial settlement and reconciliation rules.

Added by this document:

- Whether `DailyVolume` will be fed, which decides rates versus counts in the manager view.
- Confirmation that the Blocks Logic module is provisioned for this project. If it is not, the
  scheduled workflows in §5.4 are unavailable; SLA flagging falls back to read-time derivation and
  reconciliation becomes a manual admin action.
- Reconciliation interval, which bounds how stale an `ExceptionCase` snapshot can be.

---

## 8. Build order

1. `blocks init` inside the app directory to create `blocks/data/`.
2. Author the core spine: `Hub`, `Sender`, `Parcel`, `ExceptionCase`, `HubReceipt`, `CaseNote`,
   `OwnershipHistory`, `ParcelMovement`.
3. `blocks data sync --dry-run` and review the diff before pushing.
4. Add supporting collections: `CaseDecision`, `AiAnalysis`, `CareTask`, `MoneyTransaction`,
   `LossReview`, `CaseEvent`, `Attachment`, `SenderUpdate`.
5. Create one Blocks Organization per hub; record each `organizationId` on its `Hub` record.
6. Define roles `hub_staff`, `rider`, `care`, `ops_manager`; author the access policies in Section 4.
7. **Verify access per role** with one test user each, confirming every role sees exactly what it
   should and nothing more. Because nothing is filtered by default, a missing policy fails open and
   silently.
8. Author the workflows in Section 5.4, starting with reconciliation.
