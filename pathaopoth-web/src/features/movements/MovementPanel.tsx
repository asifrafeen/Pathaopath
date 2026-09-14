import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Truck } from "lucide-react";
import { blocksClient } from "../../lib/blocks/client";
import { data, type ExceptionCase } from "../../lib/pathaopoth/data";
import { HubTag, RiderChip } from "../../shared/ui/domain";
import { useCurrentHub } from "../../lib/pathaopoth/useHub";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";
import { acknowledgeArrival, planMovement, recordFailure } from "./movementActions";

type Rider = { id: string; name: string; phone?: string };

function useRiders() {
  return useQuery({
    queryKey: ["pathaopoth", "riders"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Rider[]> => {
      const res = (await blocksClient.iam.users.list({ page: 1, pageSize: 100 } as never)) as unknown as {
        data?: Array<{ itemId: string; firstName?: string; lastName?: string; email?: string; active?: boolean; roles?: Record<string, string[]> }>;
      };
      return (res?.data ?? [])
        .filter((u) => u.active !== false)
        .filter((u) => Object.values(u.roles ?? {}).some((list) => (list ?? []).includes("rider")))
        .map((u) => ({
          id: u.itemId,
          name: [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "Rider"
        }));
    }
  });
}

export function MovementPanel({ kase, onChanged }: { kase: ExceptionCase; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const { hub, hubs } = useCurrentHub();
  const { data: profile } = useCurrentUser();
  const riders = useRiders();

  const [riderId, setRiderId] = useState("");
  const [reason, setReason] = useState("Arrived at hub");
  const [condition, setCondition] = useState<"intact" | "opened" | "damaged">("intact");
  const [failure, setFailure] = useState("");

  const movements = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "movements"],
    queryFn: () => data.movementsForCase(kase.ItemId)
  });
  const ownership = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "ownership"],
    queryFn: () => data.ownershipForCase(kase.ItemId)
  });

  const actor = {
    id: (profile as unknown as { itemId?: string })?.itemId ?? "",
    name: userDisplayName(profile) || "Hub staff"
  };

  const all = movements.data?.items ?? [];
  const active = all.find((m) => m.status === "planned" || m.status === "picked_up");
  const decision = kase.latestDecision?.action;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "case", kase.ItemId] });
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "cases"] });
    onChanged();
  };

  const plan = useMutation({
    mutationFn: async () => {
      if (!hub) throw new Error("No hub is associated with your account.");
      const rider = riders.data?.find((r) => r.id === riderId);
      if (!rider) throw new Error("Choose a rider for this leg.");

      const targetCode = kase.latestDecision?.targetHubCode;
      const toHub = hubs.find((h) => h.code === targetCode) ?? null;
      const destinationType = decision === "return_to_sender" ? "sender" : decision === "redeliver" ? "receiver" : "hub";
      const purpose = destinationType === "hub" ? "hub_transfer" : destinationType === "sender" ? "sender_return" : "redelivery";

      await planMovement({
        kase, fromHub: hub, toHub, destinationType, purpose,
        addressSnapshot: destinationType === "hub" ? undefined : (kase.parcel?.currentDeliveryAddress ?? "Address on file"),
        rider, actor
      });
    },
    onSuccess: refresh
  });

  const arrive = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("There is no leg in flight.");
      if (!hub) throw new Error("No hub is associated with your account.");
      const current = (ownership.data?.items ?? []).find((o) => o.isCurrent);
      await acknowledgeArrival({
        movement: active, kase, receivingHub: hub,
        reportedReason: reason, parcelCondition: condition,
        actor, currentOwnershipId: current?.ItemId
      });
    },
    onSuccess: refresh
  });

  const fail = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("There is no leg in flight.");
      await recordFailure(active, failure || "Delivery failed", actor);
    },
    onSuccess: refresh
  });

  const canPlan = kase.status === "ready_for_dispatch" || kase.status === "redelivery_scheduled";
  const isDestination = active?.destinationType === "hub" && active.toHubCode === hub?.code;

  return (
    <div className="rounded-md border border-hairline bg-surface p-base">
      <h3 className="mb-md flex items-center gap-sm text-overline uppercase text-ink-muted">
        <Truck size={14} aria-hidden /> Transport
      </h3>

      {all.length > 0 ? (
        <ul className="mb-base grid gap-sm">
          {all.map((m) => (
            <li key={m.ItemId} className="rounded-md border border-hairline p-md">
              <div className="flex flex-wrap items-center gap-sm">
                <HubTag code={m.fromHubCode} />
                <span aria-hidden className="text-ink-muted">→</span>
                {m.destinationType === "hub" ? <HubTag code={m.toHubCode} /> : <span className="text-body-sm text-ink">{m.destinationType}</span>}
                <span className={`ml-auto rounded-pill px-sm py-xxs text-caption ${
                  m.status === "received" ? "bg-settled-soft text-settled-text"
                  : m.status === "failed" ? "bg-breach-soft text-breach-text"
                  : m.status === "picked_up" ? "bg-transit-soft text-transit-text"
                  : "bg-queued-soft text-queued-text"}`}>
                  {m.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-xs"><RiderChip name={m.assignedRider?.name} /></div>
              {m.failureReason ? <p className="mt-xs text-body-sm text-breach-text">{m.failureReason}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Plan a leg only once a decision authorises one — a movement always cites the
          decision that permitted it. */}
      {!active && canPlan ? (
        <form onSubmit={(e) => { e.preventDefault(); plan.mutate(); }}>
          <label className="block">
            <span className="mb-xs block text-label text-ink-secondary">Assign a rider</span>
            <select value={riderId} onChange={(e) => setRiderId(e.target.value)} className={control}>
              <option value="">Select a rider…</option>
              {(riders.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          {riders.data && riders.data.length === 0 ? (
            <p className="mt-xs text-body-sm text-ink-muted">
              No active rider accounts exist yet, so there is nobody to assign.
            </p>
          ) : null}
          {plan.isError ? <p className="mt-sm text-body-sm text-breach-text">{(plan.error as Error)?.message}</p> : null}
          <button
            type="submit" disabled={plan.isPending || !riderId}
            className="mt-base h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover disabled:opacity-55"
          >
            {plan.isPending ? "Planning…" : "Plan this leg"}
          </button>
        </form>
      ) : null}

      {!active && !canPlan && all.length === 0 ? (
        <p className="text-body-sm text-ink-muted">
          Confirm a decision first — a leg is only planned once something authorises it.
        </p>
      ) : null}

      {/* The receiving hub acknowledges arrival. The rider never closes their own leg. */}
      {active?.status === "picked_up" && isDestination ? (
        <form className="border-t border-hairline pt-base" onSubmit={(e) => { e.preventDefault(); arrive.mutate(); }}>
          <p className="mb-sm text-body-sm text-ink">This parcel is on its way to you. Acknowledge it to take ownership.</p>
          <div className="grid gap-base sm:grid-cols-2">
            <label className="block">
              <span className="mb-xs block text-label text-ink-secondary">Reason recorded</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={control} />
            </label>
            <label className="block">
              <span className="mb-xs block text-label text-ink-secondary">Condition on arrival</span>
              <select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} className={control}>
                <option value="intact">Intact</option>
                <option value="opened">Opened</option>
                <option value="damaged">Damaged</option>
              </select>
            </label>
          </div>
          {arrive.isError ? <p className="mt-sm text-body-sm text-breach-text">{(arrive.error as Error)?.message}</p> : null}
          <button
            type="submit" disabled={arrive.isPending}
            className="mt-base h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover disabled:opacity-55"
          >
            {arrive.isPending ? "Recording arrival…" : "Acknowledge arrival"}
          </button>
        </form>
      ) : null}

      {active?.status === "picked_up" && !isDestination ? (
        <div className="border-t border-hairline pt-base">
          <p className="text-body-sm text-ink-secondary">
            In transit with {active.assignedRider?.name ?? "a rider"}. Ownership stays with{" "}
            <strong>{kase.ownerHub?.code}</strong> until the destination acknowledges receipt.
          </p>
          <form className="mt-sm" onSubmit={(e) => { e.preventDefault(); fail.mutate(); }}>
            <input
              value={failure} onChange={(e) => setFailure(e.target.value)}
              placeholder="If the leg failed, say what happened"
              className={control}
            />
            <button
              type="submit" disabled={fail.isPending || !failure.trim()}
              className="mt-sm h-control rounded-md border border-hairline-strong bg-surface px-base text-button text-ink hover:bg-surface-hover disabled:opacity-55"
            >
              Record a failed leg
            </button>
            <p className="mt-xs text-caption text-ink-muted">
              A failed leg does not mean the parcel came back. Custody stays with whoever holds it
              until somebody acknowledges otherwise.
            </p>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const control = "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink";
