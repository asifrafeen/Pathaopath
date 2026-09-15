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
