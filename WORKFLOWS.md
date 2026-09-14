# PathaoPoth — Workflow specifications

Build instructions for the four scheduled workflows and the AI agent node. These cover issues
**#36–#40**, which are blocked because the Blocks Logic module is not provisioned for this project
and no agent exists in Blocks Agents.

Nothing here needs design work. Each spec gives the trigger, the node sequence, the exact filters,
and how to tell it worked. Build them in the Logic visual builder in the order given — #36 first,
because it is the one the data model actually depends on.

## Before you start

Confirm the Logic module is available for project `Df6362bb5e9c04915a0994c87e0751bd5`. The node
palette you need:

| Category | Node | Used by |
|---|---|---|
| Trigger | `schedule` (interval or cron) | #36, #37, #38, #39 |
| Trigger | `dataGateway` (fires on record change) | #40 |
| Action | `dataAction` (read/write Data Gateway) | all |
| Action | `sendMail` | #37, #38 |
| Action | `aiAgent` | #40 |
| Logic | `if` | all |
| Transform | `code`, `setfield` | #36, #39, #40 |

**Editor test-mode caveat:** the `dataGateway` trigger only picks up records carrying a specific
`Tags` value while you are testing in the builder. It looks exactly like a broken trigger. It is not.

---

## #36 — Arrival reconciliation

**The one that matters.** The app writes a hub arrival as seven ordered steps with the `HubReceipt`
as the commit point (see `movementActions.ts`). If the browser dies midway, the receipt exists with
`appliedState: "pending"` and the case snapshot is stale. Without this workflow that case stays
wrong forever.

- **Trigger:** `schedule`, every **5 minutes**.
- **Step 1 — `dataAction` read** `HubReceipt` where `{"appliedState": "pending"}`, page size 100.
- **Step 2 — `if`** the result is empty → end.
- **Step 3 — for each receipt**, replay steps 2–6 of the arrival sequence. Every one is a
  set-to-target, never an increment, so replaying a step that already ran changes nothing:
  1. `dataAction` update `ParcelMovement` where `{"_id": <receipt.incomingMovementId>}` →
     `{"status": "received", "completedAt": <receipt.receivedAt>}`
  2. `dataAction` update `OwnershipHistory` where
     `{"caseId": <receipt.caseId>, "isCurrent": true, "hubCode": {"$ne": <receipt.hubCode>}}` →
     `{"endedAt": <receipt.receivedAt>, "isCurrent": false}`
  3. `dataAction` read `OwnershipHistory` where
     `{"caseId": <receipt.caseId>, "receiptId": <receipt.ItemId>}`. If absent, insert the receiving
     hub's period with `isCurrent: true`. **Check before inserting** — this is the only step that is
     not naturally idempotent.
  4. `dataAction` update `ExceptionCase` where `{"_id": <receipt.caseId>}` → owner hub, owner org,
     custody, `status: "awaiting_review"`.
  5. `dataAction` insert `CaseEvent` with `eventType: "movement.received.reconciled"`.
- **Step 4 — `dataAction` update** the receipt → `{"appliedState": "applied"}`.

**Verify:** open a case, start an arrival, kill the browser tab midway. The case shows the amber
stale banner (the UI already renders it from `appliedState`). Run the workflow. The banner clears and
ownership has moved.

---

## #37 — SLA sweep and notification

A breach is already computable at read time — the queue and `SlaChip` derive it from `slaDueAt`, so
the flag is not what this adds. This turns a passive flag into a push.

- **Trigger:** `schedule`, every **15 minutes**.
- **Step 1 — `dataAction` read** `ExceptionCase` where
  `{"status": {"$ne": "closed"}, "slaBreached": false, "slaDueAt": {"$lt": "<now ISO>"}}`.
- **Step 2 — for each:** update → `{"slaBreached": true}`, then insert a `CaseEvent` with
  `eventType: "sla.breached"`.
- **Step 3 — `sendMail`** to the owning hub, one message per sweep listing every newly breached case.

**Do not re-notify.** The `slaBreached: false` term in the filter is what stops it — a case is
notified once, when it crosses. Removing that term turns this into a mail loop every fifteen minutes.

**Threshold:** 72 hours, set at intake in `ScanPage.tsx`. It is the figure the case study's cost model
uses (৳120 plus 25 minutes of care time per parcel stuck past 72 hours). Changing it means changing
both places.

---

## #38 — Handoff escalation

Catches a dispatch nobody acknowledged. The parcel is with a rider and the clock is running, but no
hub is expecting it.

- **Trigger:** `schedule`, hourly.
- **Step 1 — `dataAction` read** `ParcelMovement` where
  `{"status": "planned", "createdDate": {"$lt": "<now minus 4 hours>"}}` — planned but never picked
  up.
- **Step 2 — `dataAction` read** `ParcelMovement` where
  `{"status": "picked_up", "pickupAcknowledgedAt": {"$lt": "<now minus 12 hours>"}}` — picked up but
  never delivered anywhere.
- **Step 3 — for each:** insert `CaseEvent` with `eventType: "movement.escalated"`, then `sendMail`
  to the **sending** hub.

The sending hub is the right recipient because it still owns the case — ownership does not move until
the destination acknowledges receipt. Escalation does not change ownership, custody, or the movement
status; it only tells a human.

---

## #39 — Integrity check

The invariants below are enforced only in the write path, because the Data Gateway has no partial
unique index. This reports violations; it does not repair them, because every repair is a judgement
about which record is real.

- **Trigger:** `schedule`, daily at 02:00 Asia/Dhaka.
- **Check 1 — more than one open case per parcel.** Read `ExceptionCase` where
  `{"status": {"$ne": "closed"}}`, group by `parcelId` in a `code` node, report any group larger
  than one.
- **Check 2 — more than one active movement per case.** Read `ParcelMovement` where
  `{"status": {"$in": ["planned", "picked_up"]}}`, group by `caseId`, report groups larger than one.
- **Check 3 — overlapping ownership.** Read `OwnershipHistory` where `{"isCurrent": true}`, group by
  `caseId`, report groups larger than one.
- **Check 4 — an open case with no current owner.** The inverse, and the worse failure: any open case
  with zero `isCurrent` periods means the invariant the whole product rests on has broken.
- **Step — `sendMail`** the findings to ops. Send nothing when all four are clean; a daily "all
  clear" mail trains people to ignore it.

---

## #40 — AI agent and the manual-review path

The schema and the UI are already in place. `AiAnalysis` exists, and `DecisionPanel` renders the
violet `AiProposalCard` the moment a completed analysis appears — today it shows an honest "no agent
configured" state instead. This is wiring, not building.

**First, in Blocks Agents:** create an agent for this project. The `aiAgent` node lists agents by
project key.

- **Trigger:** `dataGateway` on `CaseNote` **insert**.
- **Step 1 — `dataAction` insert** `AiAnalysis` with `status: "pending"`, `noteId`, `caseId`,
  `parcelId`, `ownerHubOrgId`. Write this **before** calling the agent, so a failed call leaves a
  record saying it failed rather than leaving no trace.
- **Step 2 — `dataAction` read** the parent `ExceptionCase` and the `Hub` connections, for routing
  context.
- **Step 3 — `aiAgent`** with the note's `rawText`. Ask for strict JSON:
  ```json
  {
    "attempt_count": 2,
    "failure_reason": "customer_cancelled",
    "address_quality": "unknown",
    "address_change_requested": false,
    "proposed_address": null,
    "availability_hint": "after 17:00",
    "recommended_action": "redeliver",
    "proposed_redelivery_date": "2026-09-16",
    "proposed_window_start": "17:00",
    "proposed_window_end": "20:00",
    "confidence": 0.82,
    "evidence": [{ "field": "failure_reason", "quote": "customer parcel nibe na" }]
  }
  ```
  `recommended_action` must be one of `redeliver`, `transfer_hub`, `return_to_origin`,
  `return_to_sender`, `care_review`, `loss_review`, `hold`.
- **Step 4 — `if` `confidence < 0.7`** → update the analysis with
  `{"requiresManualReview": true, "recommendedAction": "care_review", "status": "completed"}`.
  **The product says "manual review" rather than bluffing.** The UI already renders that state.
- **Step 5 — else** update with the structured output, `status: "completed"`.
- **On failure** → `{"status": "failed", "errorMessage": "<message>"}`. The case stays fully usable;
  AI failure never blocks a human.

**Rules the prompt must hold to**, from the design:
- Unknown facts are `null`, never `false`.
- A proposed redelivery date only when the note supports one. Resolve relative dates like "tomorrow"
  against the incident time in `Asia/Dhaka`; if context is insufficient, ask for review instead.
- A requested address change is **not** a confirmed address change. It goes in `proposed_address` and
  never touches `Parcel.currentDeliveryAddress`.
- Notes are Banglish. The agent reads them as-is; the raw text is never rewritten or translated in
  place, because `CaseNote.rawText` is immutable evidence.

**Never write a `CaseDecision` from a workflow.** A decision is what a human confirmed. The whole
violet provenance channel exists to keep those two apart, and the most expensive mistake available in
this product is a parcel that moved because nobody checked.

---

## After building

Re-run the verification harnesses — both failures found so far were silent:

```
node scripts/verify-access.mjs     # row scoping per role
node scripts/verify-masking.mjs    # receiverPhone by role
```

Then update `IMPLEMENTATION_LOG.md` with what each workflow does, which schemas it touches, and the
verification you ran — same shape as every other entry.
