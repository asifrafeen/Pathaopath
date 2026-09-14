# PathaoPoth — Implementation Log

The living delivery record. Updated in the same pull request as the work it describes, never
afterwards from memory.

- Process and backlog definition: [PROJECT_WORKFLOW.md](PROJECT_WORKFLOW.md)
- Data model and design rationale: [PATHAOPOTH_BLOCKS_DESIGN.md](PATHAOPOTH_BLOCKS_DESIGN.md)

**Rules.** Business logic is described in business terms, not as a restatement of the diff. Every
schema and policy touched is named. Deviations from the design are recorded with their reason — an
undocumented deviation is a defect. Verification is a command and its result, not an assertion. No
issue is marked Done without a verification line.

---

## Status

Statuses: `Not started` · `In progress` · `Blocked` · `Done`

| # | Title | Epic | Status | PR | Completed |
|---|---|---|---|---|---|
| 1 | Initialise git, `.gitignore`, first commit | 0 | Done | — | 2026-09-15 |
| 2 | Add remote, push `dev`, set default branch | 0 | Done | — | 2026-09-15 |
| 3 | Create `IMPLEMENTATION_LOG.md` | 0 | Done | — | 2026-09-15 |
| 4 | Create GitHub issues from the backlog | 0 | Done | — | 2026-09-15 |
| 5 | Push core spine — 8 entities + 9 Dto types | 1 | Done | — | 2026-09-15 |
| 6 | Verify live schema list and access-level aggregation | 1 | Done | — | 2026-09-15 |
| 7 | `CaseDecision`, `AiAnalysis` | 2 | Done | — | 2026-09-15 |
| 8 | `CareTask`, `CaseEvent` | 2 | Done | — | 2026-09-15 |
| 9 | `MoneyTransaction`, `LossReview` | 2 | Done | — | 2026-09-15 |
| 10 | `Attachment` + storage provider check | 2 | Done | — | 2026-09-15 |
| 11 | `SenderUpdate` — public read | 2 | Done | — | 2026-09-15 |
| 12 | `DailyVolume` — defined, unfed | 2 | Done | — | 2026-09-15 |
| 13 | Organizations per hub; seed `Hub` records | 3 | Not started | — | — |
| 14 | Roles: `hub_staff`, `rider`, `care`, `ops_manager` | 3 | Not started | — | — |
| 15 | Permissions incl. `DataProtection` for `receiverPhone` | 3 | Not started | — | — |
| 16 | RLS policies — hub, rider, care/ops scope | 3 | Not started | — | — |
| 17 | CLS policies — mask `receiverPhone`, `rawText` | 3 | Not started | — | — |
| 18 | Deploy rules and reload | 3 | Not started | — | — |
| 19 | One test user per role | 4 | Not started | — | — |
| 20 | Verify the visibility matrix | 4 | Not started | — | — |
| 21 | App shell, auth guard, role-aware navigation | 5 | Not started | — | — |
| 22 | Parcel scan and lookup; reuse open case | 5 | Not started | — | — |
| 23 | Open exception case in four fields | 5 | Not started | — | — |
| 24 | Record hub receipt and raw rider note | 5 | Not started | — | — |
| 25 | Decision confirmation UI, AI panel stubbed | 6 | Not started | — | — |
| 26 | Raise and resolve care tasks | 6 | Not started | — | — |
| 27 | Plan movement, assign rider | 7 | Not started | — | — |
| 28 | Rider pickup acknowledgement | 7 | Not started | — | — |
| 29 | Hub arrival — commit-point sequence | 7 | Not started | — | — |
| 30 | Outcomes: delivered, returned, loss write-off | 8 | Not started | — | — |
| 31 | Money transactions and reversing entries | 8 | Not started | — | — |
| 32 | Publish `SenderUpdate` with human review | 9 | Not started | — | — |
| 33 | Public token link page | 9 | Not started | — | — |
| 34 | Exception counts by hub, route, rider | 10 | Not started | — | — |
| 35 | Week-over-week trend | 10 | Not started | — | — |
| 36 | Arrival reconciliation workflow | 11 | Not started | — | — |
| 37 | SLA sweep and notification | 11 | Not started | — | — |
| 38 | Handoff escalation | 11 | Not started | — | — |
| 39 | Integrity check workflow | 11 | Not started | — | — |
| 40 | AI agent wiring and manual-review path | 12 | Not started | — | — |

---

## Entries

### #1 — Initialise git, `.gitignore`, first commit

**Status:** Done · **Date:** 2026-09-15

**Business logic implemented**
None — repository setup only.

**Schemas used or changed**
None changed. The core data model authored earlier is committed as source: 8 entities (`Hub`,
`Sender`, `Parcel`, `ExceptionCase`, `HubReceipt`, `CaseNote`, `OwnershipHistory`, `ParcelMovement`)
and 9 embedded Dto types, 136 fields total. The data model and access rules are tracked as code
under `pathaopoth-web/blocks/data/`, not as portal configuration.

**Access policies touched**
None. `rules.json` is empty, so every collection will be readable by any authenticated user until
Epic 3 closes. This is a known open gap, not an oversight.

**Decisions and deviations**
- Repository root is the `Pathaopoth/` folder rather than the app folder, because the ignored agent
  scaffolding sits at that level.
- Integration branch is `dev`, not `main`.
- Only `AGENTS.md` and `CLAUDE.md` are ignored among markdown; project documents are tracked.

**Verification**
```
git ls-files | wc -l           -> 78
git ls-files | grep -x 'pathaopoth-web/.env'   -> no match (ignored)
git ls-files | grep '\.cert/'                  -> no match (ignored)
git diff --cached | grep -iE 'blxsk_|client_?secret|PRIVATE KEY'  -> no match
```
Confirmed staged content carries the tenant id, public OIDC client id, and app domain — all
non-secret values a browser app transmits on every request — and no credentials.

### #3 — Create `IMPLEMENTATION_LOG.md`

**Status:** Done · **Date:** 2026-09-15

**Business logic implemented**
None — process artefact.

**Schemas used or changed**
None.

**Access policies touched**
None.

**Decisions and deviations**
Tracked at the repository root alongside the workflow and design documents rather than in a `docs/`
subdirectory, matching how those two files were already being referenced.

**Verification**
File present and linked from `PROJECT_WORKFLOW.md`.

### #2 — Add remote, push `dev`, set default branch

**Status:** Done · **Date:** 2026-09-15

**Decisions and deviations**
Added `.gitattributes` with `* text=auto eol=lf`, folded in here rather than given its own ticket.
Git had warned it would convert LF to CRLF, which would make every diff noisy for anyone on macOS or
Linux.

**Verification**
```
git push -u origin dev        -> [new branch] dev -> dev
gh repo view --json defaultBranchRef  -> {"defaultBranchRef":{"name":"dev"}}
```
The repository is public. Verified before pushing that `.env`, `.cert/`, and all credentials are
ignored. Public values now visible: tenant id, public OIDC client id, app domain — all transmitted
by the browser app on every request.

### #4 — Create GitHub issues from the backlog

**Status:** Done · **Date:** 2026-09-15

**Verification**
```
13 milestones, 20 labels, 40/40 issues created
gh issue list --state open  -> 36 open (1-4 closed)
```

### #5 — Push core spine schemas

**Status:** Done · **Date:** 2026-09-15

**Business logic implemented**
The storage foundation for exception handling: a parcel, the case tracking its exception, the hub
receipts that are the only thing which transfers ownership, the immutable rider notes, the ownership
periods proving the case always had exactly one accountable owner, and the transport legs.

**Schemas used or changed**
- Entities created (8): `Hub`, `Sender`, `Parcel`, `ExceptionCase`, `HubReceipt`, `CaseNote`,
  `OwnershipHistory`, `ParcelMovement`
- Dto types created (9): `HubRef`, `UserRef`, `RiderRef`, `SenderSnapshot`, `ParcelSnapshot`,
  `DecisionSnapshot`, `CustodyHolder`, `ServiceArea`, `HubConnection`
- Load-bearing fields: `ExceptionCase.ownerHubOrgId` and `ParcelMovement.toHubOrgId` are the mutable
  access keys, because the platform's `OrganizationId` records the creating hub permanently and
  ownership transfers. `HubReceipt.appliedState` and `incomingMovementId` drive the commit-point
  and idempotency behaviour. `OwnershipHistory.isCurrent` replaces the partial index that the
  Data Gateway cannot express.

**Access policies touched**
None. `rules.json` remains empty, so all 17 schemas are currently readable by any authenticated user.
Closes in Epic 3.

**Decisions and deviations**
Two platform constraints found during the push, neither anticipated in the design:

1. **`collectionName` is required on Entity schemas.** Dto types are exempt
   (`SchemaValidatorHelper`: `schemaType == Dto || (Entity && collectionName non-empty)`). The first
   push failed with `Collection_Name_Is_Required`. Generator now emits `collectionName = schemaName`
   for entities only.
2. **Schemas must be pushed in dependency order.** A field referencing a Dto is rejected unless that
   Dto already exists; `data schema push` sends files alphabetically and aborts on first failure, so
   `ExceptionCase` failed on the not-yet-created `ParcelSnapshot`. Resolved with a two-phase push —
   Dto types first, then all 17. Worth knowing for every future schema batch: **push Dto types
   before the entities that reference them.**

The partial first attempt created three schemas before aborting; the second phase updated them
rather than duplicating.

**Verification**
```
blocks data schema push --yes   -> results: 17 | ok: 17 | failed: 0
blocks data reload --yes        -> "Schema evicted successfully."
blocks data schema list --json  -> count: 17
```

### #6 — Verify live schema list and access levels

**Status:** Done · **Date:** 2026-09-15

**Business logic implemented**
None — verification only.

**Schemas used or changed**
None.

**Decisions and deviations**
`data schema get-by-name` projects only `name`, `type`, and `description`, so field flags are
invisible through it. `data schema aggregation` exposes the full field record and is the correct
command for confirming what actually persisted.

**Settles the open question on unique indexes:** the Data Gateway **does** support them. Both
`isUniqueData` flags survived the push. What it does not support is *partial* unique indexes, which
is the separate constraint that forced "one open case per parcel" to become a write-path convention.
No fallback was needed.

**Verification**
```
blocks data schema aggregation --json
  schemas: 17 | total fields: 246 | requiredOn set: 37
  isUniqueData true: Hub.code, Parcel.trackingNumber
  isPIIData true   : Parcel.receiverPhone, Sender.phone, RiderRef.phone,
                     SenderSnapshot.phone, ParcelMovement.phone
  field-level policies: 0   (expected — Epic 3)
```
Nested Dto references resolved correctly: `ExceptionCase` carries `parcel:ParcelSnapshot`,
`ownerHub:HubRef`, `accountableStaff:UserRef`, `custodyHolder:CustodyHolder`,
`latestDecision:DecisionSnapshot`. 246 total fields = 136 authored + platform-managed fields added
to each schema.

### #7–#12 — Epic 2 supporting collections

**Status:** Done · **Date:** 2026-09-15

**Business logic implemented**
The records that carry a case beyond intake: the human-confirmed decision that authorises every
movement, the AI proposal kept separate from it, care work that investigates without taking custody,
the append-only timeline, the operational money log, authorised loss write-off, evidence, and the
sanitised sender-facing projection.

**Schemas used or changed**
- Entities created (9): `CaseDecision`, `AiAnalysis`, `CareTask`, `CaseEvent`, `MoneyTransaction`,
  `LossReview`, `Attachment`, `SenderUpdate`, `DailyVolume`
- Dto created (1): `MoneyParty`
- Project total: **27 schemas**
- `SenderUpdate.publicToken` carries `isUniqueData`, joining `Hub.code` and `Parcel.trackingNumber`.
- Every Epic 2 entity carries `ownerHubOrgId` so hub-scoped policies can reach it in Epic 3.
- `CaseDecision.isSuperseded` and `AiAnalysis.requiresManualReview` keep "current decision" and
  "needs a human" as single-field filters rather than derived queries.

**Access policies touched**
None authored. See the deviation below — the access levels are not what was intended, and Epic 3 now
has to correct them rather than merely add to them.

**Decisions and deviations**

1. **The CLI forces every new schema to Public on all four operations.** `makeSchemaPublic` in
   `blocks-cli/src/lib/data-gateway.ts` POSTs `accessLevel: 2` for READ, WRITE, EDIT and DELETE
   immediately after each schema is created, because the schema-create endpoint accepts no access
   level and the stored default (`User`) would make a schema unreadable to anonymous callers. The
   `readAccessLevel`/`writeAccessLevel` values authored in the local JSON are therefore **ignored on
   create**. All 27 schemas are currently `Public` on read, write, edit and delete.

   This corrects an earlier statement in this log (entries #1 and #5) that the collections were
   "readable by any authenticated user". They are in fact readable *and writable* by anyone,
   without authentication.

   The same CLI comment records the way out: update paths never touch access levels, so a level set
   after creation survives later pushes. `rules.json` supports a `security` array whose entries are
   POSTed to `/data/v4/data-access/security/change` with `{ accessLevel, fieldNames, operation,
   policyType, schemaId }`. Operations are READ 0, WRITE 1, EDIT 2, DELETE 3. Epic 3 must use this
   to set every schema to `User` (1), leaving only `SenderUpdate` READ at `Public` (2).

2. **`data schema aggregation` flattens nested Dto fields into the parent's field list.**
   `ExceptionCase` reports 53 fields there versus 32 from `get-by-name`, and `name`/`code` appear
   more than once because they arrive from `HubRef`, `UserRef` and `CustodyHolder`. This is a
   reporting shape, not duplication — `get-by-name` shows the true structure. Worth knowing before
   someone reads a flattened list as schema corruption.

3. Dependency order held without a two-phase push this time: the only new Dto, `MoneyParty`, sorts
   before `MoneyTransaction` alphabetically. That is luck, not design — the rule from #5 still
   applies to any future batch.

**Verification**
```
blocks data validate --json     -> ok: true, schemaCount: 27
blocks data schema push --yes   -> results: 27 | ok: 27 | failed: 0
blocks data reload --yes        -> "Schema evicted successfully."
blocks data schema aggregation  -> 27 schemas live
  unique: Hub.code, Parcel.trackingNumber, SenderUpdate.publicToken
  access: all 27 schemas read/write/edit/delete = Public (2)   <-- to be corrected in Epic 3
```
