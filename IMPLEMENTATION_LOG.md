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
| 2 | Add remote, push `dev`, set default branch | 0 | In progress | — | — |
| 3 | Create `IMPLEMENTATION_LOG.md` | 0 | Done | — | 2026-09-15 |
| 4 | Create GitHub issues from the backlog | 0 | Not started | — | — |
| 5 | Push core spine — 8 entities + 9 Dto types | 1 | Not started | — | — |
| 6 | Verify live schema list and access-level aggregation | 1 | Not started | — | — |
| 7 | `CaseDecision`, `AiAnalysis` | 2 | Not started | — | — |
| 8 | `CareTask`, `CaseEvent` | 2 | Not started | — | — |
| 9 | `MoneyTransaction`, `LossReview` | 2 | Not started | — | — |
| 10 | `Attachment` + storage provider check | 2 | Not started | — | — |
| 11 | `SenderUpdate` — public read | 2 | Not started | — | — |
| 12 | `DailyVolume` — defined, unfed | 2 | Not started | — | — |
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
