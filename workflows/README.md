# Importable Blocks Logic workflows

Import through **Workflow → Import** in the Logic builder.

## Before you import

Each `dataAction` node ships with `clientSecret: "__SELECT_CREDENTIAL_IN_UI__"`. A real secret is
never committed to this repository. After importing, open each data node and **re-pick the
`PathaoPoth` credential from the Authentication dropdown** — that repopulates both the id and the
secret. Six nodes, one click each.

## Why the workflow can read anything at all

A scheduled workflow runs as a machine identity with no user, no organization and no hub membership.
The row-level policies grant reads to `care`, `ops_manager`, or `hub_staff` plus a matching
organization — a client credential matches none of those and every read comes back **empty with no
error**, which looks exactly like "nothing to do".

The `PathaoPoth` client credential therefore carries the `service_automation` role, and every row
policy has an explicit branch for it. If you create a new credential for a workflow, grant it that
role or it will silently see nothing.

## The two execution facts that shape every one of these

Both read from the server executor, not guessed:

1. **`getData` in filter mode emits one item per row**, so downstream nodes iterate — that is why
   there is no loop node and none is needed. But its filter compiles to `key: { eq: value }` and
   supports **equality only** — no `$ne`, `$lt`, `$in`.
2. **Raw Query mode gives the full gateway query** (so `$ne`, `$lt`, `$in` all work) but emits **one
   item holding the whole response** — it does not fan out.

So anything needing a real filter *and* per-row writes uses:

```
rawQuery  ->  code node returning an array  ->  per-item dataAction
```

A code node in "Run Once for All Items" mode turns each element of a returned array into its own
output item. That is the bridge between the two.

## Import order

1. `integrity-check` — it backstops the others, so have it running first
2. `arrival-reconciliation`
3. `sla-sweep`
4. `handoff-escalation`

## arrival-reconciliation.workflow.json

Repairs hub arrivals interrupted midway. The app writes an arrival as ordered steps with the
`HubReceipt` as commit point; if the operator's browser dies, the receipt stays
`appliedState: "pending"` and the case snapshot is stale. The UI already shows that state as an
amber banner — this is what clears it.

Runs every 5 minutes. `getData` emits one item per pending receipt and the nodes downstream run once
per item, which is why there is no loop node.

**The ownership pair is the part to understand.** "Close open ownership" ends every current period on
the case, then "Reopen this receipt's period" reopens the one belonging to this receipt. Run
together they converge on exactly one current period — the receiving hub's — regardless of how far
the interrupted run got.

**The caveat:** the node filter compiles to `key: { eq: value }` and supports only equality — no
`$ne`, no `$in`. So if the interruption happened *before* the receiving hub's ownership period was
ever inserted, "Reopen" matches nothing and the case is left with no current owner. That is a worse
state than it started in, and the integrity check (#39) is what surfaces it. In practice the period
is written at step 4 of 7 and `appliedState: applied` is step 7, so a pending receipt almost always
has it — but "almost always" is why #39 matters.

**Test it deliberately:**

1. Open a case in the app and start a hub arrival.
2. Kill the browser tab midway.
3. Reload — the case shows the amber "still being applied" banner.
4. Run the workflow manually in the builder.
5. The banner clears, ownership has moved to the receiving hub, and the receipt reads `applied`.

If nothing happens, check the Authentication dropdown first. An empty result and a permission
mismatch are indistinguishable from the outside.


## sla-sweep.workflow.json

Every 15 minutes. Flags open cases past their deadline and records an `sla.breached` event.

The breach is already computable at read time and the queue shows it — this turns a passive flag
into something notifiable and reportable.

**Why the filter runs in two places.** The query fetches open, unflagged cases (`$ne` needs raw
mode); the code node then keeps only those actually past due. The date comparison lives in the code
node so "now" is evaluated at run time rather than depending on a server-side date expression.

**Do not remove `slaBreached: false` from the query.** It is the only thing stopping a re-notify
every 15 minutes forever — a case is flagged once, when it crosses.

**No mail node is included.** Your mail templates and configuration id are not known here, and a
guessed `sendMail` node fails at run time. Add one after "Record a breach event" when you want the
push; the event rows are durable and queryable in the meantime.

## handoff-escalation.workflow.json

Hourly. Escalates legs nobody acknowledged — dispatched but never collected after 4 hours, or
collected but never delivered after 12.

It writes a `movement.escalated` event and **changes nothing else**: not ownership, not custody, not
the movement status. The sending hub is still accountable either way, which is why it is also the
right recipient — ownership does not move until the destination acknowledges receipt.

## integrity-check.workflow.json

Daily at 02:00. Reports the four invariants the Data Gateway cannot enforce, because it has no
partial unique index:

1. More than one open case per parcel
2. More than one active movement per case
3. Overlapping current ownership periods
4. **An open case with no current owner** — the inverse, and the worse failure. This is the
   invariant the whole product rests on, and it is exactly what `arrival-reconciliation` can leave
   behind if an arrival was interrupted before the receiving hub's ownership period was written.

It **reports only, never repairs**, because every repair is a judgement about which record is real.

One raw query reads all three collections via GraphQL aliases rather than three separate reads that
could observe different moments.

## Verified before shipping

Every raw query in these files was executed against live project data:

```
handoff-escalation  Find legs in flight           getParcelMovements=0
integrity-check     Read the three collections    cases=2 movements=0 ownership=2
sla-sweep           Find open unflagged cases     getExceptionCases=1
```

The integrity numbers are the healthy baseline: two open cases, two current owners, no violations.
