// Access verification harness (issue #20).
//
// Proves each role sees exactly what it should. Nothing is filtered by default and a
// missing or inert policy fails OPEN, silently — so this is the only thing standing
// between "the policies are deployed" and "hub isolation actually works".
//
// THIS SCRIPT CREATES NO ACCOUNTS. It reuses existing ones, supplied through the
// environment, because accounts on this platform cannot be deleted — only deactivated —
// and an earlier version that minted a throwaway set per run left 23 dead users behind.
//
// Usage (PowerShell):
//   $env:PP_HUB_A="email:password"      # hub_staff in one hub
//   $env:PP_HUB_B="email:password"      # hub_staff in a different hub
//   $env:PP_RIDER="email:password"      # rider
//   $env:PP_CARE="email:password"       # care or ops_manager (cross-hub)
//   node scripts/verify-access.mjs
//
// Any actor left unset is skipped, so a single credential still gives a useful read.
//
// Gateway query facts, learned the hard way:
//   - list queries are get<SchemaName>s, e.g. getExceptionCases — not <Schema>s
//   - args are (input, where, order, paging); input is {filter, sort, pageNo, pageSize}
//   - the result type is <Schema>Result { items, totalCount, pageNo, pageSize,
//     totalPages, hasNextPage, hasPreviousPage }
//   - platform fields are PascalCase (ItemId); authored fields keep their authored casing
//   - policies only engage at access level Custom(3). User(1) means "any authenticated
//     caller, unfiltered" and silently ignores every policy attached to the schema.
import { createBlocksClient } from "@seliseblocks/client";

const TENANT = process.env.PP_TENANT ?? "Df6362bb5e9c04915a0994c87e0751bd5";
const API = process.env.PP_API ?? "https://blocksapi.slsblx.com";

const split = (v) => {
  if (!v) return null;
  const i = v.indexOf(":");
  return i < 0 ? null : { email: v.slice(0, i), password: v.slice(i + 1) };
};

const ACTORS = [
  { key: "hubA", env: "PP_HUB_A", expect: "only its own hub's rows" },
  { key: "hubB", env: "PP_HUB_B", expect: "only its own hub's rows, a different set from hubA" },
  { key: "rider", env: "PP_RIDER", expect: "only movements assigned to it; no cases" },
  { key: "care", env: "PP_CARE", expect: "every row, across all hubs" },
].map((a) => ({ ...a, cred: split(process.env[a.env]) })).filter((a) => a.cred);

if (!ACTORS.length) {
  console.log("No credentials supplied. Set at least one of PP_HUB_A, PP_HUB_B, PP_RIDER, PP_CARE");
  console.log('as "email:password". Anonymous checks still run below.\n');
}

const clientFor = (token) => createBlocksClient({
  apiUrl: API, xBlocksKey: TENANT, ...(token ? { accessToken: () => token } : {}),
});

for (const a of ACTORS) {
  try {
    const r = await clientFor().auth.login({ username: a.cred.email, password: a.cred.password, rememberMe: false });
    a.token = r?.access_token ?? r?.accessToken ?? r?.data?.access_token;
  } catch { /* reported below */ }
  console.log(`login ${a.key} (${a.cred.email}): ${a.token ? "ok" : "FAILED"}`);
}

const FIELD = {};
const probe = ACTORS.find((a) => a.token);
if (probe) {
  const r = await clientFor(probe.token).data.graphql({ query: "{ __schema { queryType { fields { name args { name } } } } }" });
  for (const f of r?.data?.__schema?.queryType?.fields ?? []) {
    FIELD[f.name.toLowerCase()] = { name: f.name, args: f.args.map((x) => x.name) };
  }
}
// Introspection needs a token, so fall back to the documented convention when running
// anonymously: get<SchemaName>s taking (input, where, order, paging).
const resolve = (s) =>
  FIELD[("get" + s + "s").toLowerCase()] ??
  FIELD[("get" + s).toLowerCase()] ??
  { name: "get" + s + "s", args: ["input", "where", "order", "paging"] };

const COLLECTIONS = [
  "ExceptionCase", "ParcelMovement", "HubReceipt", "CaseNote",
  "OwnershipHistory", "SenderUpdate", "Parcel", "Hub",
];

async function count(token, schema) {
  const f = resolve(schema);
  if (!f) return "?";
  const args = f.args.includes("input") ? "(input: {pageNo: 1, pageSize: 200})" : "";
  try {
    const r = await clientFor(token).data.graphql({ query: `{ ${f.name}${args} { totalCount } }` });
    if (r?.errors) return "ERR";
    return String(r?.data?.[f.name]?.totalCount ?? "null");
  } catch (e) {
    const b = JSON.stringify(e?.body ?? "");
    return /not authorized|AUTH_NOT_AUTHENTICATED|unauthor/i.test(b) ? "DENIED" : String(e?.status ?? "ERR");
  }
}

const live = ACTORS.filter((a) => a.token);
console.log("\n== visibility matrix (cell = rows returned) ==");
console.log("collection".padEnd(18) + live.map((a) => a.key.padEnd(10)).join("") + "ANON");
for (const schema of COLLECTIONS) {
  const cells = [];
  for (const a of live) cells.push(await count(a.token, schema));
  cells.push(await count(undefined, schema));
  console.log(schema.padEnd(18) + cells.map((c) => c.padEnd(10)).join(""));
}

console.log("\nExpected once policies engage:");
for (const a of live) console.log(`  ${a.key.padEnd(6)} ${a.expect}`);
console.log("  ANON   DENIED everywhere except SenderUpdate");
console.log("\nIf every column is identical, the policies are inert — check that the schema's");
console.log("read access level is Custom(3) via: blocks data schema aggregation --json");
