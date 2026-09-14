# PathaoPoth — Project Workflow and Design Record

This document defines how the PathaoPoth project is version-controlled, tracked, and delivered, and
records the design decisions reached so far. It is the process contract: read it before starting
work, and update it when the process itself changes.

Nothing described here has been executed yet. This document is for review first.

---

## Part 1 — Repository

### 1.1 Remote

```
git@github.com:asifrafeen/Pathaopath.git
```

Note the remote spells the project **Pathaopath**; the local folder and the Blocks project are
**PathaoPoth**. Harmless, but worth knowing before someone greps for the wrong spelling.

### 1.2 Repository root

The repository root is the **`Pathaopoth/` folder**, not the app folder. It has to be, because the
agent scaffolding that must be ignored (`.codex/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`) lives at
that level.

```
Pathaopoth/                       <- repository root
├── .codex/                       ignored
├── .claude/                      ignored
├── AGENTS.md                     ignored
├── CLAUDE.md                     ignored
├── docs/                         TRACKED  (see 1.4)
│   ├── DESIGN.md
│   ├── WORKFLOW.md               (this document, moved here)
│   └── IMPLEMENTATION_LOG.md
└── pathaopoth-web/               TRACKED  (the application)
    ├── blocks/data/schemas/      TRACKED  (the data model is source)
    ├── blocks/data/rules.json    TRACKED  (access policies are source)
    ├── blocks.json               TRACKED
    ├── src/
    ├── .env                      ignored (already, by the app's own .gitignore)
    └── .cert/                    ignored
```

### 1.3 `.gitignore`

```gitignore
# Agent scaffolding — not part of the product
.codex/
.claude/
AGENTS.md
CLAUDE.md

# Node / build
node_modules/
dist/

# Local environment and certificates
.env
.env.local
.env.*.local
env.*
.cert/

# OS noise
Thumbs.db
.DS_Store
```

### 1.4 The one deviation from your instruction — please confirm

You asked for **md files** to be gitignored. Taken literally (`*.md`), that would also ignore the
implementation log you asked me to maintain, the design record, and this document — so the tracking
artefact would never appear on GitHub, where the team reads it.

**Proposed instead:** ignore the agent-scaffolding markdown specifically (`AGENTS.md`, `CLAUDE.md`)
and keep project documentation tracked under `docs/`. That satisfies the intent — no agent noise in
the repo — without hiding the record the workflow exists to produce.

If you did mean all markdown, say so and I will ignore `*.md` with a `!docs/` exception, or drop the
tracked docs entirely and keep the log outside the repo.

### 1.5 Branch and commit conventions

- `main` is the integration branch. No direct commits once the first issues are open.
- One branch per issue: `feat/12-rls-policies`, `fix/29-arrival-idempotency`, `chore/3-docs`.
- Commit subject references the issue: `feat: author RLS policies for hub scoping (#12)`.
- Squash-merge to `main` so one issue is one commit, keeping the log readable.
- Every merge to `main` must update `docs/IMPLEMENTATION_LOG.md` in the same PR. A ticket is not
  done until the log records it.

---

## Part 2 — Task breakdown

Work is grouped into twelve sequential epics. Epics run in order; issues inside an epic may run in
parallel unless a dependency is noted. Dependencies are listed because several tickets fail
confusingly if run early — schema before policy, policy before verification, verification before app
code.

Estimated: **40 issues.**

### Epic 0 — Repository and process (4)

| # | Issue | Depends on |
|---|---|---|
| 1 | Initialise git, add `.gitignore`, first commit of current state | — |
| 2 | Add remote, push `main`, set branch conventions | 1 |
| 3 | Move design and workflow docs into `docs/`, create `IMPLEMENTATION_LOG.md` skeleton | 1 |
| 4 | Create all GitHub issues from this backlog with labels and milestones | 2 |

### Epic 1 — Data model: core spine (2)

Already authored locally and validating clean; not yet pushed.

| # | Issue | Depends on |
|---|---|---|
| 5 | Push core spine — 8 entities + 9 Dto types via `blocks data sync` | 4 |
| 6 | Verify live schema list and access-level aggregation | 5 |

### Epic 2 — Data model: supporting collections (6)

| # | Issue | Depends on |
|---|---|---|
| 7 | `CaseDecision`, `AiAnalysis` | 5 |
| 8 | `CareTask`, `CaseEvent` | 5 |
| 9 | `MoneyTransaction`, `LossReview` | 5 |
| 10 | `Attachment` + confirm storage provider configuration | 5 |
| 11 | `SenderUpdate` — public read access level | 5 |
| 12 | `DailyVolume` — defined but unfed (see Open Questions) | 5 |

### Epic 3 — Identity and access (6)

| # | Issue | Depends on |
|---|---|---|
| 13 | Create one Blocks Organization per hub; seed `Hub` records with `organizationId` | 6 |
| 14 | Create roles `hub_staff`, `rider`, `care`, `ops_manager` | 6 |
| 15 | Create permissions, including `DataProtection` (type 3) for `receiverPhone` | 14 |
| 16 | Author RLS policies — hub scope, rider scope, care/ops cross-hub | 13, 14 |
| 17 | Author CLS policies — mask `receiverPhone`, `CaseNote.rawText` | 15 |
| 18 | Deploy rules and reload | 16, 17 |

### Epic 4 — Access verification (2)

Not optional. Nothing is filtered by default, so a missing policy fails open silently.

| # | Issue | Depends on |
|---|---|---|
| 19 | Create one test user per role | 18 |
| 20 | Verify the visibility matrix — each role sees exactly what it should and nothing more | 19 |

### Epic 5 — Application: intake (4)

| # | Issue | Depends on |
|---|---|---|
| 21 | App shell, auth guard, role-aware navigation | 20 |
| 22 | Parcel scan and lookup; reuse open case rather than duplicating | 21 |
| 23 | Open exception case in four fields | 22 |
| 24 | Record hub receipt and raw rider note | 23 |

### Epic 6 — Decisions and care (2)

| # | Issue | Depends on |
|---|---|---|
| 25 | Decision confirmation UI, with the AI proposal panel stubbed | 24 |
| 26 | Raise and resolve care tasks | 25 |

### Epic 7 — Movements and custody (3)

| # | Issue | Depends on |
|---|---|---|
| 27 | Plan movement, assign rider | 25 |
| 28 | Rider pickup acknowledgement; custody moves to rider | 27 |
| 29 | Hub arrival acknowledgement — the commit-point sequence | 28 |

### Epic 8 — Closure and money (2)

| # | Issue | Depends on |
|---|---|---|
| 30 | Outcomes: delivered, returned to sender, loss write-off | 29 |
| 31 | Money transactions and reversing entries | 30 |

### Epic 9 — Sender view (2)

| # | Issue | Depends on |
|---|---|---|
| 32 | Publish `SenderUpdate` with human review before publish | 25 |
| 33 | Public token link page — reads `SenderUpdate` only | 32, 11 |

### Epic 10 — Ops reporting (2)

| # | Issue | Depends on |
|---|---|---|
| 34 | Exception counts by hub, route, rider using `routeKey` | 29 |
| 35 | Week-over-week trend; rates only if `DailyVolume` is fed | 34 |

### Epic 11 — Logic workflows (4)

All require the Blocks Logic module to be provisioned. Built against a sample configuration until
then; the app does not depend on them to function.

| # | Issue | Depends on |
|---|---|---|
| 36 | Arrival reconciliation — replay receipts stuck at `appliedState = pending` | 29 |
| 37 | SLA sweep and notification | 29 |
| 38 | Handoff escalation for unacknowledged dispatches | 29 |
| 39 | Integrity check — report violations of app-enforced invariants | 29 |

### Epic 12 — AI (1)

| # | Issue | Depends on |
|---|---|---|
| 40 | Configure agent, wire the `aiAgent` workflow node, implement the manual-review path | 25, 36 |

### Issue conventions

- **Labels:** `epic:<n>`, `area:data` / `area:iam` / `area:app` / `area:workflow`, `blocked`,
  `needs-decision`.
- **Milestones:** one per epic.
- **Body template:** context, acceptance criteria, dependencies, verification command or steps.
- An issue blocked on a decision gets `needs-decision` and names the question, rather than being
  worked around silently.

---

## Part 3 — `docs/IMPLEMENTATION_LOG.md`

The living record. Updated in the same pull request as the work it describes — never afterwards from
memory.

### Structure

**A. Status table** — every issue, refreshed on each merge:

| # | Title | Epic | Status | PR | Completed |
|---|---|---|---|---|---|
| 5 | Push core spine schemas | 1 | Done | #12 | 2026-09-16 |
| 6 | Verify live schema list | 1 | In progress | — | — |
| 7 | `CaseDecision`, `AiAnalysis` | 2 | Not started | — | — |

Status values: `Not started`, `In progress`, `Blocked`, `Done`.

**B. Per-issue entry** — appended when an issue closes. This is the part that makes the log worth
keeping:

```markdown
### #5 — Push core spine schemas

**Status:** Done · **PR:** #12 · **Date:** 2026-09-16

**Business logic implemented**
What rule from the design this realises, in business terms — not a restatement of the diff.

**Schemas used or changed**
- Created: `Hub`, `Sender`, `Parcel`, `ExceptionCase`, `HubReceipt`, `CaseNote`,
  `OwnershipHistory`, `ParcelMovement`
- Dto types: `HubRef`, `UserRef`, …
- Fields of note: `ExceptionCase.ownerHubOrgId` — mutable access key; the platform's
  `OrganizationId` records the creating hub and cannot scope ownership.

**Access policies touched**
None yet — `rules.json` is still empty, so these collections are readable by any authenticated user
until Epic 3 closes.

**Decisions and deviations**
Anything done differently from the design, and why.

**Verification**
The command run and what it returned.
```

### Rules for the log

1. Business logic is described in business terms. "Ownership transfers only on receipt" — not
   "set ownerHubId".
2. Every schema and policy touched is named. This is the index for "where does X live".
3. Deviations from the design are recorded with the reason. An undocumented deviation is a defect.
4. Verification is a command and its result, not an assertion that it works.
5. Never mark an issue Done without a verification line.

---

## Part 4 — Design record

Condensed from the design discussion. Full detail in `docs/DESIGN.md`.

### 4.1 What is being built

A delivery exception resolution desk for a courier moving 40,000 parcels a day, where 3–4% become
exceptions. The product must give every exception exactly one accountable owner at every moment, turn
rough rider notes into an actionable next step, show senders a sanitised status, flag SLA breaches,
and surface failing routes as patterns.

### 4.2 Platform

SELISE Blocks, project `PathaoPoth` (`Df6362bb5e9c04915a0994c87e0751bd5`, `dev`), app domain
`https://dbuajn.slsblx.com`. React + Vite app scaffolded via `blocks new web`, talking to Blocks only
through `@seliseblocks/client`.

Covered by CLI and SDK: data model and access policies, IAM, storage, localization, mail and
notifications, release. **Not covered by either:** workflow, scheduling, and AI — these live in the
Blocks Logic and Blocks Agents services, authored in their own UIs.

### 4.3 Storage-layer patches

The original relational design assumes foreign keys, transactions, and partial unique indexes. The
Data Gateway is a document store with none of them.

| # | Constraint | Decision |
|---|---|---|
| P1 | `Decimal` rejected; scalars are `String, Int, Float, Boolean, DateTime, ID` | Use `Float` for money. Accepted: repeated addition can drift, so reversing entries may not net exactly to zero |
| P2 | No partial or sparse unique indexes | Indexes dropped. "One open case per parcel", "one active movement", "one current ownership period" are write-path conventions, not constraints |
| P3 | No multi-document transactions | `HubReceipt` is the single commit point; everything else is repaired forward by a scheduled reconciliation sweep |
| P4 | No foreign keys or joins | Denormalised — bounded data embedded as Dto types, unbounded history in its own collection with denormalised lookup fields |
| P5 | Duplicate identity store | `users` removed; Blocks IAM is identity. Records carry `userId` plus a display-name snapshot |
| P6 | Per-parcel traceability | `parcelId` on every child collection, so a parcel's history is one query per collection with no joins |
| P7 | No `Time` or date-only type | Local dates and times of day are `String`; true instants are `DateTime` |

### 4.4 Two findings that shaped the model

**`OrganizationId` cannot scope ownership.** It is stamped from the token on insert and preserved on
update, so it permanently records the *creating* hub. Case ownership transfers between hubs.
Therefore every access-scoped collection carries a mutable `ownerHubOrgId` (or `toHubOrgId`) that the
write path maintains and row-level policies match against the `organization_id` token claim.

**Nothing is filtered by default.** The Data Gateway applies no implicit organisation filter to
reads. A collection with no policy is readable by every authenticated user. Access policies are
therefore load-bearing security, and a missing one fails open silently — which is why Epic 4 exists
as its own verification gate rather than being folded into Epic 3.

### 4.5 Ownership invariant

The outgoing owner stays accountable until the incoming side acknowledges. A planned or in-flight
movement does not transfer ownership — only a `HubReceipt` does. Between dispatch and arrival the
sending hub remains owner, so there is no interval where ownership is unassigned. The invariant holds
by construction, which is what makes it safe without atomic writes. Custody moves independently and
follows the rider from pickup.

### 4.6 Sender safety

Senders are unauthenticated for now, reached by an open link. Anonymous callers carry no token
claims, so role-based masking has nothing to match against — exposing `ExceptionCase` publicly would
defeat the masking that protects receiver phone numbers and internal notes.

The open link therefore reads `SenderUpdate` only, matched on a long random `publicToken`. That
collection holds no sensitive fields, so sender safety does not depend on a policy evaluating
correctly for an anonymous caller. When senders become authenticated, an RLS rule on `Parcel` is
added and the same records keep working.

### 4.7 Current state

- App scaffolded, dependencies installed, typecheck clean, HTTPS cert generated.
- OIDC client and identity provider registered; `isOidcEnabled` true.
- Core spine authored locally: 8 entities, 9 Dto types, 136 fields, `blocks data validate` clean,
  `schema push --dry-run` clean. **Not pushed.**
- `rules.json` empty — no access policies exist yet.
- No users on the project.
- Hosts entry and cert trust still pending (both need Administrator).

---

## Part 5 — Open questions

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| 1 | Is `*.md` really to be ignored, or just agent scaffolding? (§1.4) | Epic 0 | Track `docs/`, ignore agent markdown |
| 2 | Should `SenderUpdate.readAccessLevel` be `Public`? | Issue 11, 33 | Public, guarded by a long random token |
| 3 | Will `DailyVolume` be fed? | Issue 35 | Not fed — manager view shows counts and trend, not rates |
| 4 | Keep the two plain unique indexes (`Hub.code`, `Parcel.trackingNumber`)? | Issue 5 | Keep — they are business rules, not the partial-index workaround that was dropped |
| 5 | Reconciliation interval | Issue 36 | 5 minutes, bounding how stale a case snapshot can be |
| 6 | Refusal reason list, SLA thresholds, escalation behaviour | Issues 23, 37 | — carried from the original design |
| 7 | Who approves address changes, write-offs, monetary adjustments | Issues 8, 30 | — carried from the original design |

---

## Part 6 — Execution order once approved

1. Confirm §1.4 and the Part 5 defaults.
2. `git init`, `.gitignore`, first commit, add remote, push `main`.
3. Move `PATHAOPOTH_BLOCKS_DESIGN.md` → `docs/DESIGN.md`, this file → `docs/WORKFLOW.md`, create
   `docs/IMPLEMENTATION_LOG.md`.
4. Create the 40 issues with labels and milestones via `gh`.
5. Begin Epic 1 — push the core spine, which is already authored and waiting.
