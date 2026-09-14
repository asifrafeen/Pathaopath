import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { data, type CareTask } from "../../lib/pathaopoth/data";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";

const OPEN_STATES = ["open", "in_progress"];

/**
 * Care investigates and contacts customers. It never moves the parcel and never takes
 * hub ownership — resolving a task records an outcome and hands the decision back to
 * the owning hub, which is why nothing here touches custody or ownerHub.
 */
export function CarePanel({ caseId, parcelId, ownerHubOrgId }: { caseId: string; parcelId: string; ownerHubOrgId?: string }) {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentUser();
  const [outcome, setOutcome] = useState("");

  const tasks = useQuery({
    queryKey: ["pathaopoth", "case", caseId, "care"],
    queryFn: () => data.careTasksForCase(caseId)
  });

  const items = tasks.data?.items ?? [];
  const open = items.find((t) => OPEN_STATES.includes(t.status));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "care"] });
  };

  const claim = useMutation({
    mutationFn: async (task: CareTask) => {
      await data.update("CareTask", task.ItemId, {
        status: "in_progress",
        assignedCareUserId: (profile as unknown as { itemId?: string })?.itemId ?? "",
        assignedCareUser: { name: userDisplayName(profile) || "Care agent" }
      });
    },
    onSuccess: invalidate
  });

  const resolve = useMutation({
    mutationFn: async (task: CareTask) => {
      const now = new Date().toISOString();
      await data.update("CareTask", task.ItemId, {
        status: "resolved", outcome, resolvedAt: now
      });
      await data.insert("CaseEvent", {
        caseId, parcelId, ownerHubOrgId: ownerHubOrgId ?? "",
        eventType: "care.resolved",
        actorUserId: (profile as unknown as { itemId?: string })?.itemId ?? "",
        actorName: userDisplayName(profile) || "Care agent",
        occurredAt: now,
        details: JSON.stringify({ outcome })
      });
      // The hub decides what happens next; care records what it found and returns
      // the case to review rather than routing the parcel itself.
      await data.update("ExceptionCase", caseId, { status: "awaiting_review" });
    },
    onSuccess: () => { setOutcome(""); invalidate(); }
  });

  if (tasks.isLoading) return <div className="h-24 animate-pulse rounded-md bg-surface-sunken" aria-busy />;
  if (items.length === 0) return null;

  return (
    <div className="rounded-md border border-hairline bg-surface p-base">
      <h3 className="mb-md flex items-center gap-sm text-overline uppercase text-ink-muted">
        <LifeBuoy size={14} aria-hidden /> Care
      </h3>

      <ul className="grid gap-sm">
        {items.map((t) => (
          <li key={t.ItemId} className="rounded-md border border-hairline p-md">
            <div className="flex flex-wrap items-center gap-sm">
              <span className={`rounded-pill px-sm py-xxs text-caption ${
                t.status === "resolved" ? "bg-settled-soft text-settled-text" : "bg-attention-soft text-attention-text"
              }`}>
                {t.status.replace("_", " ")}
              </span>
              {t.assignedCareUser?.name ? (
                <span className="text-body-sm text-ink-secondary">{t.assignedCareUser.name}</span>
              ) : (
                <span className="text-body-sm text-ink-muted">Unassigned</span>
              )}
            </div>
            {t.reason ? <p className="mt-xs text-body-sm text-ink">{t.reason}</p> : null}
            {t.outcome ? <p className="mt-xs text-body-sm text-ink-secondary">Outcome: {t.outcome}</p> : null}
          </li>
        ))}
      </ul>

      {open ? (
        <div className="mt-base border-t border-hairline pt-base">
          {open.status === "open" ? (
            <button
              type="button"
              onClick={() => claim.mutate(open)}
              disabled={claim.isPending}
              className="h-control rounded-md border border-hairline-strong bg-surface px-base text-button text-ink hover:bg-surface-hover disabled:opacity-55"
            >
              {claim.isPending ? "Claiming…" : "Claim this task"}
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); resolve.mutate(open); }}>
              <label className="block">
                <span className="mb-xs block text-label text-ink-secondary">What did you find?</span>
                <textarea
                  value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2}
                  placeholder="The outcome the hub needs before it can act."
                  className="w-full rounded-md border border-hairline-strong bg-surface p-md text-body-md text-ink placeholder:text-ink-muted"
                />
              </label>
              <button
                type="submit"
                disabled={resolve.isPending || !outcome.trim()}
                className="mt-sm h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover disabled:opacity-55"
              >
                {resolve.isPending ? "Resolving…" : "Resolve and return to hub"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
