// Access verification harness (issue #20).
//
// Creates one short-lived user per role, queries every collection as each plus anonymously,
// prints a row-count matrix, then deactivates the accounts. Re-run after any policy change.
//
// Change the email prefix before re-running: accounts cannot be deleted, only deactivated,
// and an existing address fails creation.
//
// Gateway query facts learned the hard way:
//   - list queries are named get<SchemaName>s, e.g. getExceptionCases
//   - args are (input, where, order, paging); input is {filter, sort, pageNo, pageSize}
//   - the result type is <Schema>Result { items, totalCount, pageNo, pageSize, totalPages,
//     hasNextPage, hasPreviousPage }
//   - platform fields are PascalCase (ItemId), authored fields keep their authored casing
// Nothing is filtered by default, so a missing policy fails OPEN and silently.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createBlocksClient } from "@seliseblocks/client";

const TENANT = "Df6362bb5e9c04915a0994c87e0751bd5";
const API = "https://blocksapi.slsblx.com";
const ORG_MIRPUR = "7c182c85-dbc9-484a-bfab-6162603aefd1";
const ORG_SHANKAR = "026fc8e8-f8f2-431b-bbb4-0c5742fc742a";

const gh = (a) => execFileSync(process.platform === "win32" ? "blocks.cmd" : "blocks", a,
  { encoding: "utf8", maxBuffer: 1 << 24, shell: process.platform === "win32" });
const pw = () => `Ab1${randomBytes(12).toString("base64url").replace(/[^A-Za-z0-9]/g, "x")}`;

const ACTORS = [
  { key: "hub@Mirpur", email: "pathaopoth.mx5.hub@yopmail.com", role: "hub_staff", org: ORG_MIRPUR },
  { key: "hub@Shankar", email: "pathaopoth.mx5.hub2@yopmail.com", role: "hub_staff", org: ORG_SHANKAR },
  { key: "rider@Mirpur", email: "pathaopoth.mx5.rider@yopmail.com", role: "rider", org: ORG_MIRPUR },
  { key: "care", email: "pathaopoth.mx5.care@yopmail.com", role: "care", org: "default" },
];

const made = [];
for (const a of ACTORS) {
  a.password = pw();
  try {
    a.id = JSON.parse(gh(["iam", "users", "create", "--email", a.email, "--password", a.password,
      "--first-name", "Matrix", "--last-name", a.role, "--organization-id", a.org,
      "--roles", a.role, "--yes", "--json"])).itemId;
    made.push(a.id);
    gh(["iam", "users", "activate", a.id, "--reason", "Short-lived access-verification account", "--yes", "--json"]);
    console.log(`created+activated ${a.key}`);
  } catch (e) {
    console.log(`setup failed ${a.key}:`, (e.stderr || e.stdout || String(e)).slice(0, 200));
  }
}

for (const a of ACTORS) {
  if (!a.id) continue;
  try {
    const r = await createBlocksClient({ apiUrl: API, xBlocksKey: TENANT })
      .auth.login({ username: a.email, password: a.password, rememberMe: false });
    a.token = r?.access_token ?? r?.accessToken ?? r?.data?.access_token;
  } catch { /* reported below */ }
  console.log(`login ${a.key}: ${a.token ? "ok" : "FAILED"}`);
}

const clientFor = (token) => createBlocksClient({
  apiUrl: API, xBlocksKey: TENANT, ...(token ? { accessToken: () => token } : {}),
});

const probe = ACTORS.find((a) => a.token);
const FIELD = {};
if (probe) {
  const r = await clientFor(probe.token).data.graphql({
    query: "{ __schema { queryType { fields { name args { name } } } } }",
  });
  const fields = r?.data?.__schema?.queryType?.fields ?? [];
  console.log("\n== query fields exposed by the gateway ==");
  for (const f of fields) {
    console.log("  " + f.name + "(" + f.args.map((x) => x.name).join(", ") + ")");
    FIELD[f.name.toLowerCase()] = { name: f.name, args: f.args.map((x) => x.name) };
  }
}

// The gateway exposes list queries as get<SchemaName>s — e.g. getExceptionCases, getHubs.
const resolve = (schema) =>
  FIELD[("get" + schema + "s").toLowerCase()] || FIELD[("get" + schema).toLowerCase()] ||
  FIELD[(schema + "s").toLowerCase()] || null;

const COLLECTIONS = [
  ["ExceptionCase", "itemId ownerHubOrgId status"],
  ["ParcelMovement", "itemId assignedRiderId"],
  ["Parcel", "itemId trackingNumber"],
  ["CaseNote", "itemId caseId"],
  ["SenderUpdate", "itemId trackingNumber statusLabel"],
  ["Hub", "itemId code"],
];

async function count(token, schema, fields) {
  const f = resolve(schema);
  if (!f) return "no-field";
  const args = f.args.includes("input") ? "(input: {pageNo: 1, pageSize: 100})" : "";
  try {
    const r = await clientFor(token).data.graphql({ query: `{ ${f.name}${args} { totalCount } }` });
    if (r?.errors) return "ERR";
    const node = r?.data?.[f.name];
    return node ? String(node.totalCount ?? (node.items || []).length) : "null";
  } catch (e) {
    const b = JSON.stringify(e?.body || "");
    if (/not authorized|AUTH_NOT_AUTHENTICATED|unauthor/i.test(b)) return "DENIED";
    return (e?.status ?? "ERR") + "";
  }
}

console.log("\n== visibility matrix (cell = rows returned) ==");
const live = ACTORS.filter((a) => a.token);
console.log("collection".padEnd(16) + live.map((a) => a.key.padEnd(14)).join("") + "ANON");
for (const [schema, fields] of COLLECTIONS) {
  const cells = [];
  for (const a of live) cells.push(await count(a.token, schema, fields));
  cells.push(await count(undefined, schema, fields));
  console.log(schema.padEnd(16) + cells.map((c) => String(c).padEnd(14)).join(""));
}

console.log("\n== cleanup ==");
for (const id of made) {
  try { gh(["iam", "users", "deactivate", id, "--yes", "--json"]); console.log("  deactivated", id); }
  catch { console.log("  deactivate FAILED", id); }
}
