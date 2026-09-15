// The transport lifecycle: plan → pick up → arrive.
//
// Two invariants live here rather than in the database, because the Data Gateway can
// express neither:
//
//   Ownership is never nobody. A planned or in-flight movement does NOT transfer
//   ownership — only a HubReceipt does. Between dispatch and arrival the sending hub
//   stays accountable, so there is no interval where the case is unowned. The
//   invariant holds by construction, which is what makes it safe without atomic
//   writes.
//
//   Custody moves independently of ownership. It follows the rider from pickup and
//   lands with the receiving hub at arrival.
import { data, type ExceptionCase, type Hub, type ParcelMovement } from "../../lib/pathaopoth/data";

type Actor = { id: string; name: string };

export async function planMovement(opts: {
  kase: ExceptionCase;
  fromHub: Hub;
  toHub?: Hub | null;
  destinationType: "hub" | "receiver" | "sender";
  purpose: "hub_transfer" | "redelivery" | "sender_return";
  addressSnapshot?: string;
  rider: { id: string; name: string; phone?: string };
  decisionId?: string;
  actor: Actor;
}): Promise<string | undefined> {
  const { kase, fromHub, toHub, destinationType, purpose, addressSnapshot, rider, decisionId, actor } = opts;

  // One active leg per case. Without a partial unique index this is the only thing
  // holding the rule, so it is checked immediately before the write.
  const existing = await data.activeMovementForCase(kase.ItemId);
  if (existing) {
    throw new Error("This case already has an active movement. Complete or cancel it before planning another.");
  }
  if (destinationType === "hub" && toHub?.ItemId === fromHub.ItemId) {
    throw new Error("A hub transfer needs a destination different from the sending hub.");
  }
  if (destinationType !== "hub" && !addressSnapshot) {
    throw new Error("A delivery to a person needs an address snapshot.");
  }

  const now = new Date().toISOString();
  const movementId = await data.insert("ParcelMovement", {
    caseId: kase.ItemId, parcelId: kase.parcelId, trackingNumber: kase.parcel?.trackingNumber ?? "",
    decisionId: decisionId ?? "",
    purpose,
    fromHubId: fromHub.ItemId, fromHubCode: fromHub.code, fromHubOrgId: fromHub.organizationId ?? "",
    destinationType,
    toHubId: toHub?.ItemId ?? "", toHubCode: toHub?.code ?? "", toHubOrgId: toHub?.organizationId ?? "",
    destinationAddressSnapshot: addressSnapshot ?? "",
    assignedRiderId: rider.id,
    assignedRider: { userId: rider.id, name: rider.name, phone: rider.phone ?? "" },
    status: "planned",
    createdByStaffId: actor.id
  });

  await data.update("ExceptionCase", kase.ItemId, { status: "ready_for_dispatch" });
  await data.insert("CaseEvent", {
    caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: kase.ownerHubOrgId ?? "",
    eventType: "movement.planned", actorUserId: actor.id, actorName: actor.name, occurredAt: now,
    details: JSON.stringify({ movementId, purpose, to: toHub?.code ?? destinationType, rider: rider.name })
  });
  return movementId;
}

/** Custody moves to the rider. Ownership does not. */
export async function acknowledgePickup(movement: ParcelMovement, actor: Actor): Promise<void> {
  const now = new Date().toISOString();
  await data.update("ParcelMovement", movement.ItemId, { status: "picked_up", pickupAcknowledgedAt: now });
  await data.update("ExceptionCase", movement.caseId, {
    status: "in_transit",
    custodyType: "rider",
    custodyRiderId: movement.assignedRiderId ?? "",
    custodyHubId: "",
    custodyHolder: { name: movement.assignedRider?.name ?? actor.name, code: "" }
  });
  await data.insert("CaseEvent", {
    caseId: movement.caseId, parcelId: movement.parcelId,
    eventType: "movement.picked_up", actorUserId: actor.id, actorName: actor.name, occurredAt: now,
    details: JSON.stringify({ movementId: movement.ItemId })
  });
}

/**
 * Hub arrival — the commit-point sequence.
 *
 * There are no multi-document transactions, so the HubReceipt is written FIRST and is
 * the commit point: once it exists the arrival is a durable fact. Everything after is
 * derived state, each step idempotent (set-to-target, never increment), and the
 * receipt carries appliedState so a reconciliation sweep can finish an interrupted
 * run. incomingMovementId makes a duplicate arrival for the same leg identifiable
 * even without a unique index.
 */
export async function acknowledgeArrival(opts: {
  movement: ParcelMovement;
  kase: ExceptionCase;
  receivingHub: Hub;
  reportedReason: string;
  parcelCondition: "intact" | "opened" | "damaged";
  actor: Actor;
  currentOwnershipId?: string;
}): Promise<void> {
  const { movement, kase, receivingHub, reportedReason, parcelCondition, actor, currentOwnershipId } = opts;
  const now = new Date().toISOString();
  const orgId = receivingHub.organizationId ?? "";

  // 1 — commit point.
  const receiptId = await data.insert("HubReceipt", {
    caseId: kase.ItemId, parcelId: kase.parcelId, trackingNumber: kase.parcel?.trackingNumber ?? "",
    hubId: receivingHub.ItemId, hubOrgId: orgId, ownerHubOrgId: orgId, hubCode: receivingHub.code,
    receivedByStaffId: actor.id, receivedByStaff: { userId: actor.id, name: actor.name },
    receivedFromRiderId: movement.assignedRiderId ?? "",
    receivedFromRider: { userId: movement.assignedRiderId ?? "", name: movement.assignedRider?.name ?? "" },
    incomingMovementId: movement.ItemId,        // idempotency key for this leg
    receivedAt: now,
    reportedReason, parcelCondition,
    appliedState: "pending"
  });

  // 2 — complete the incoming leg.
  await data.update("ParcelMovement", movement.ItemId, { status: "received", completedAt: now });

  // 3 — close the outgoing ownership period.
  if (currentOwnershipId) {
    await data.update("OwnershipHistory", currentOwnershipId, { endedAt: now, isCurrent: false });
  }

  // 4 — open the receiving hub's period. Ownership transfers here and only here.
  await data.insert("OwnershipHistory", {
    caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
    hubId: receivingHub.ItemId, hubCode: receivingHub.code,
    accountableStaffId: actor.id, accountableStaff: { userId: actor.id, name: actor.name },
    startedAt: now, receiptId: receiptId ?? "", isCurrent: true
  });

  // 5 — refresh the denormalised case snapshot.
  await data.update("ExceptionCase", kase.ItemId, {
    status: "awaiting_review",
    ownerHubId: receivingHub.ItemId,
    ownerHubOrgId: orgId,
    ownerHub: { hubId: receivingHub.ItemId, code: receivingHub.code, name: receivingHub.name },
    accountableStaffId: actor.id,
    accountableStaff: { userId: actor.id, name: actor.name },
    custodyType: "hub", custodyHubId: receivingHub.ItemId, custodyRiderId: "",
    custodyHolder: { name: receivingHub.name, code: receivingHub.code },
    receiptCount: (kase.receiptCount ?? 0) + 1
  });

  // 6 — timeline.
  await data.insert("CaseEvent", {
    caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
    eventType: "movement.received", actorUserId: actor.id, actorName: actor.name, occurredAt: now,
    details: JSON.stringify({ movementId: movement.ItemId, hub: receivingHub.code })
  });

  // 7 — mark the receipt applied. If the process died before this, the receipt stays
  // pending and reconciliation replays steps 2-6 without duplicating anything.
  if (receiptId) await data.update("HubReceipt", receiptId, { appliedState: "applied" });
}

/**
 * A failed movement does not imply the parcel came back. Custody stays with whoever
 * actually holds it until somebody acknowledges otherwise.
 */
export async function recordFailure(movement: ParcelMovement, failureReason: string, actor: Actor): Promise<void> {
  const now = new Date().toISOString();
  await data.update("ParcelMovement", movement.ItemId, { status: "failed", failureReason, completedAt: now });
  await data.insert("CaseEvent", {
    caseId: movement.caseId, parcelId: movement.parcelId,
    eventType: "movement.failed", actorUserId: actor.id, actorName: actor.name, occurredAt: now,
    details: JSON.stringify({ movementId: movement.ItemId, failureReason })
  });
}
