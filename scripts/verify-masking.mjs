// Column-level masking check (issue #17).
//
// Reads the same three parcels as three different roles and prints receiverPhone.
// Expected: hub_staff and care see the number, rider sees null.
//
// A CLS policy only takes effect when the schema read access level is Custom(3);
// at User(1) the gateway ignores every policy and returns the field in full.
//
// Uses the shared test password. These are disposable yopmail accounts on a dev tenant.
import { createBlocksClient } from "@seliseblocks/client";
const TENANT = "Df6362bb5e9c04915a0994c87e0751bd5";
const API = "https://blocksapi.slsblx.com";
const PW = "1qazZAQ!r";

const ACTORS = [
  ["hub_staff", "test.pathaopoth.blocks2@yopmail.com"],
  ["rider", "test.pathaopoth.rider@yopmail.com"],
  ["care", "asif.rafeen@yopmail.com"],
];

for (const [label, email] of ACTORS) {
  let token;
  try {
    const r = await createBlocksClient({ apiUrl: API, xBlocksKey: TENANT })
      .auth.login({ username: email, password: PW, rememberMe: false });
    token = r?.access_token ?? r?.accessToken;
  } catch { /* below */ }
  if (!token) { console.log(`${label.padEnd(10)} login FAILED`); continue; }
  const c = createBlocksClient({ apiUrl: API, xBlocksKey: TENANT, accessToken: () => token });
  try {
    const res = await c.data.graphql({
      query: `{ getParcels(input: {pageNo: 1, pageSize: 3}) { totalCount items { trackingNumber receiverName receiverPhone } } }`,
    });
    if (res?.errors) { console.log(`${label.padEnd(10)} ERR ${JSON.stringify(res.errors).slice(0, 140)}`); continue; }
    const n = res.data.getParcels;
    const phones = n.items.map((i) => i.receiverPhone);
    console.log(`${label.padEnd(10)} rows=${n.totalCount}  receiverPhone=${JSON.stringify(phones)}`);
  } catch (e) {
    console.log(`${label.padEnd(10)} HTTP ${JSON.stringify(e?.body).slice(0, 160)}`);
  }
}
