// Seeds demo data for PathaoPoth.
//
// NOT IDEMPOTENT: re-running inserts a second copy of every record and fails on the
// seed account, whose email already exists. Change EMAIL and clear the collections first.
//
// Org ids below are specific to this project and must be refreshed from
//   blocks iam organizations list --page 0 --page-size 50 --json
// if the project is rebuilt.
// There is no CLI record-write path, so this goes through the SDK's GraphQL gateway,
// which needs an authenticated user. A short-lived seed account is created, used, and
// deactivated at the end. Its password is generated here and never printed.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createBlocksClient } from "@seliseblocks/client";

const TENANT = "Df6362bb5e9c04915a0994c87e0751bd5";
const API = "https://blocksapi.slsblx.com";
const EMAIL = "rafeen1305099+pathaoseed2@gmail.com";

const ORG = {
  MIRPUR10: "7c182c85-dbc9-484a-bfab-6162603aefd1",
  MOGHBAZAR: "eeb8dacc-ba9b-4e38-bafa-26d00cbe128e",
  CTG_GEC: "a0f218a1-99c9-43f0-9644-c1917d7b9892",
  SHANKAR: "026fc8e8-f8f2-431b-bbb4-0c5742fc742a",
};

const gh = (args) => execFileSync(process.platform === "win32" ? "blocks.cmd" : "blocks", args, { encoding: "utf8", maxBuffer: 1 << 24, shell: process.platform === "win32" });
const pw = () => `Ab1${randomBytes(12).toString("base64url").replace(/[^A-Za-z0-9]/g, "x")}`;

// ---- 1. seed account -------------------------------------------------------
const password = pw();
let userItemId;
try {
  const out = gh(["iam", "users", "create", "--email", EMAIL, "--password", password,
    "--first-name", "Seed", "--last-name", "Bot", "--roles", "clouduser", "--yes", "--json"]);
  userItemId = (JSON.parse(out).itemId) || undefined;
  console.log("seed account created:", userItemId ?? "(no itemId returned)");
  // An admin-set password does not self-activate: the account lands active:false / isVerified:false
  // and AuthController login returns invalid_username_password until it is enabled.
  gh(["iam", "users", "activate", userItemId, "--reason", "Short-lived demo seeding account", "--yes", "--json"]);
  console.log("seed account activated");
} catch (e) {
  console.log("user create failed:", (e.stderr || e.stdout || String(e)).slice(0, 400));
  process.exit(1);
}

// ---- 2. sign in ------------------------------------------------------------
let token;
const boot = createBlocksClient({ apiUrl: API, xBlocksKey: TENANT });
try {
  const res = await boot.auth.login({ username: EMAIL, password, rememberMe: false });
  token = res?.access_token ?? res?.accessToken ?? res?.data?.access_token;
  console.log("login:", token ? "ok" : `no token in response -> ${JSON.stringify(res).slice(0, 300)}`);
} catch (e) {
  console.log("login failed:", String(e).slice(0, 400));
}
if (!token) process.exit(1);

const blocks = createBlocksClient({ apiUrl: API, xBlocksKey: TENANT, accessToken: () => token });

// ---- 3. seed ---------------------------------------------------------------
const lit = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(lit).join(", ")}]`;
  if (typeof v === "object") return `{${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(", ")}}`;
  return JSON.stringify(v);
};

async function insert(entity, input) {
  const q = `mutation { insert${entity}(input: ${lit(input)}) { itemId acknowledged } }`;
  const res = await blocks.data.graphql({ query: q });
  const err = res?.errors?.[0]?.message;
  if (err) throw new Error(`${entity}: ${err}`);
  const d = res?.data?.[`insert${entity}`];
  return d?.itemId;
}

const ids = {};
const step = async (label, fn) => {
  try { const r = await fn(); console.log(`  ok   ${label}${r ? " -> " + r : ""}`); return r; }
  catch (e) { console.log(`  FAIL ${label}: ${String(e.message || e).slice(0, 300)}`); return undefined; }
};

console.log("\n== hubs ==");
const hubDef = [
  ["MIRPUR10", "Mirpur 10", "Mirpur 10 Circle, Dhaka 1216", ORG.MIRPUR10,
    [{ areaCode: "DHK-MIRPUR", areaName: "Mirpur", isActive: true }],
    [{ toHubId: "", toHubCode: "MOGHBAZAR", estimatedTravelMinutes: 55, isActive: true },
     { toHubId: "", toHubCode: "CTG_GEC", estimatedTravelMinutes: 380, isActive: true }]],
  ["MOGHBAZAR", "Moghbazar", "Bara Moghbazar, Dhaka 1217", ORG.MOGHBAZAR,
    [{ areaCode: "DHK-MOGH", areaName: "Moghbazar", isActive: true }],
    [{ toHubId: "", toHubCode: "MIRPUR10", estimatedTravelMinutes: 55, isActive: true }]],
  ["CTG_GEC", "Chattogram GEC", "GEC Circle, Chattogram 4000", ORG.CTG_GEC,
    [{ areaCode: "CTG-GEC", areaName: "GEC", isActive: true }],
    [{ toHubId: "", toHubCode: "MIRPUR10", estimatedTravelMinutes: 380, isActive: true }]],
  ["SHANKAR", "Shankar", "Shankar, Dhanmondi, Dhaka 1209", ORG.SHANKAR,
    [{ areaCode: "DHK-SHANKAR", areaName: "Shankar", isActive: true }],
    [{ toHubId: "", toHubCode: "MIRPUR10", estimatedTravelMinutes: 40, isActive: true }]],
];
for (const [code, name, address, organizationId, serviceAreas, connections] of hubDef) {
  ids["hub_" + code] = await step(`Hub ${code}`, () =>
    insert("Hub", { code, name, address, organizationId, isActive: true, serviceAreas, connections }));
}

console.log("\n== senders ==");
ids.sender1 = await step("Sender Rahim Traders", () =>
  insert("Sender", { name: "Rahim Traders", phone: "+8801711000001", returnAddress: "Shop 14, New Market, Dhaka" }));
ids.sender2 = await step("Sender Nabila Crafts", () =>
  insert("Sender", { name: "Nabila Crafts", phone: "+8801711000002", returnAddress: "House 22, Road 5, Dhanmondi, Dhaka" }));

console.log("\n== parcels ==");
const parcels = [
  ["PP2026090001", ids.sender1, "Rahim Traders", "+8801711000001", "Shop 14, New Market, Dhaka",
   "Karim Hossain", "+8801822000001", "Flat 4B, House 9, Road 11, Banani, Dhaka", 2300, "MIRPUR10", "CTG_GEC"],
  ["PP2026090002", ids.sender2, "Nabila Crafts", "+8801711000002", "House 22, Road 5, Dhanmondi, Dhaka",
   "Shireen Akter", "+8801822000002", "Flat 2A, House 41, Mirpur 10, Dhaka", 1150, "MIRPUR10", "MIRPUR10"],
  ["PP2026090003", ids.sender1, "Rahim Traders", "+8801711000001", "Shop 14, New Market, Dhaka",
   "Tanvir Islam", "+8801822000003", "Hall Road, GEC, Chattogram", 4700, "MIRPUR10", "CTG_GEC"],
];
const parcelRows = [];
for (const [tn, senderId, sname, sphone, saddr, rname, rphone, raddr, cod, originCode, destCode] of parcels) {
  const id = await step(`Parcel ${tn}`, () => insert("Parcel", {
    trackingNumber: tn, senderId,
    sender: { senderId, name: sname, phone: sphone, returnAddress: saddr },
    receiverName: rname, receiverPhone: rphone,
    originalDeliveryAddress: raddr, currentDeliveryAddress: raddr,
    originHub: { hubId: ids["hub_" + originCode] ?? "", code: originCode, name: originCode },
    destinationHub: { hubId: ids["hub_" + destCode] ?? "", code: destCode, name: destCode },
    codAmount: cod, currency: "BDT",
  }));
  parcelRows.push({ id, tn, rname, raddr, cod, originCode, destCode });
}

console.log("\n== exception cases ==");
const now = new Date();
const iso = (h) => new Date(now.getTime() + h * 3600e3).toISOString();
const caseDef = [
  // The PDF's scripted demo: refused delivery, COD 2300, owned by Shankar after the rider returns it.
  [parcelRows[0], "refused_delivery", "awaiting_review", "SHANKAR", ORG.SHANKAR, "Jashim Uddin", -6, 66, false],
  [parcelRows[1], "cancelled_delivery", "awaiting_care", "MIRPUR10", ORG.MIRPUR10, "Sumi Akter", -80, -8, true],
  [parcelRows[2], "refused_delivery", "ready_for_dispatch", "MIRPUR10", ORG.MIRPUR10, "Rashed Khan", -30, 42, false],
];
const caseRows = [];
for (const [p, caseType, status, hubCode, hubOrg, staffName, openedH, dueH, breached] of caseDef) {
  const id = await step(`ExceptionCase ${p.tn} (${caseType})`, () => insert("ExceptionCase", {
    parcelId: p.id,
    parcel: { trackingNumber: p.tn, codAmount: p.cod, currency: "BDT", receiverName: p.rname, currentDeliveryAddress: p.raddr },
    caseType, status,
    ownerHubId: ids["hub_" + hubCode] ?? "", ownerHubOrgId: hubOrg,
    ownerHub: { hubId: ids["hub_" + hubCode] ?? "", code: hubCode, name: hubCode },
    accountableStaffId: "seed-" + hubCode.toLowerCase(),
    accountableStaff: { userId: "seed-" + hubCode.toLowerCase(), name: staffName },
    custodyType: "hub", custodyHubId: ids["hub_" + hubCode] ?? "",
    custodyHolder: { name: hubCode, code: hubCode },
    originHubCode: p.originCode, destinationHubCode: p.destCode,
    routeKey: `${p.originCode}>${p.destCode}`,
    attemptCount: caseType === "refused_delivery" ? 2 : 1, receiptCount: 1,
    openedAt: iso(openedH), slaDueAt: iso(dueH), slaBreached: breached,
  }));
  caseRows.push({ id, p, hubCode, hubOrg, staffName });
}

console.log("\n== receipts, notes, ownership ==");
for (const c of caseRows) {
  if (!c.id) continue;
  const rid = await step(`HubReceipt ${c.p.tn}`, () => insert("HubReceipt", {
    caseId: c.id, parcelId: c.p.id, trackingNumber: c.p.tn,
    hubId: ids["hub_" + c.hubCode] ?? "", hubOrgId: c.hubOrg, hubCode: c.hubCode,
    receivedByStaffId: "seed-" + c.hubCode.toLowerCase(),
    receivedByStaff: { userId: "seed-" + c.hubCode.toLowerCase(), name: c.staffName },
    receivedAt: iso(-5), reportedReason: "Returned by rider after refused delivery",
    parcelCondition: "intact", appliedState: "applied",
  }));
  await step(`CaseNote ${c.p.tn}`, () => insert("CaseNote", {
    caseId: c.id, parcelId: c.p.id, receiptId: rid ?? "",
    recordedByUserId: "seed-" + c.hubCode.toLowerCase(),
    rawText: "3 bar call disi, phone off. Guard dhukte dey nai. Customer parcel nibe na, bollo cancel korte. Bikaal 5tar por asle hoy toh pabo.",
    occurredAt: iso(-7),
  }));
  await step(`OwnershipHistory ${c.p.tn}`, () => insert("OwnershipHistory", {
    caseId: c.id, parcelId: c.p.id,
    hubId: ids["hub_" + c.hubCode] ?? "", hubCode: c.hubCode,
    accountableStaffId: "seed-" + c.hubCode.toLowerCase(),
    accountableStaff: { userId: "seed-" + c.hubCode.toLowerCase(), name: c.staffName },
    startedAt: iso(-5), isCurrent: true,
  }));
}

console.log("\n== sender-facing update ==");
if (caseRows[0]?.id) {
  await step("SenderUpdate", () => insert("SenderUpdate", {
    caseId: caseRows[0].id, parcelId: caseRows[0].p.id, trackingNumber: caseRows[0].p.tn,
    publicToken: randomBytes(24).toString("base64url"),
    publicMessage: "Your parcel was returned to our Shankar hub after the recipient declined delivery. Our team is arranging the next step and will update you within 24 hours.",
    statusLabel: "Being reviewed",
    expectedResolutionAt: iso(24),
    publishedByUserId: "seed-shankar", publishedAt: iso(-1),
  }));
}

// ---- 4. clean up -----------------------------------------------------------
console.log("\n== cleanup ==");
if (userItemId) {
  try {
    gh(["iam", "users", "deactivate", userItemId, "--yes", "--json"]);
    console.log("  seed account deactivated");
  } catch (e) {
    console.log("  deactivate failed:", (e.stderr || e.stdout || String(e)).slice(0, 200));
  }
}
console.log("\ndone");
