import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { data, type ExceptionCase } from "../../lib/pathaopoth/data";
import { AiProposalCard, HubTag } from "../../shared/ui/domain";
import { useCurrentHub } from "../../lib/pathaopoth/useHub";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";

type DecisionAction = {
  value: "redeliver" | "transfer_hub" | "return_to_origin" | "return_to_sender" | "care_review" | "loss_review" | "hold";
  label: string;
  status: string;
  /** A hub destination needs a target; a redelivery needs a date and window. */
  needsHub?: boolean;
  needsDate?: boolean;
};

export const DECISION_ACTIONS: DecisionAction[] = [
  { value: "redeliver", label: "Redeliver", status: "redelivery_scheduled", needsDate: true },
  { value: "transfer_hub", label: "Transfer to another hub", status: "ready_for_dispatch", needsHub: true },
  { value: "return_to_origin", label: "Return toward origin hub", status: "ready_for_dispatch", needsHub: true },
  { value: "return_to_sender", label: "Return to sender", status: "ready_for_dispatch" },
  { value: "care_review", label: "Send to care review", status: "awaiting_care" },
  { value: "loss_review", label: "Request loss review", status: "loss_review" },
  { value: "hold", label: "Hold at current location", status: "on_hold" }
];

type ActionValue = DecisionAction["value"];

/**
 * Decisions are append-only: a replacement is written and the previous one marked
 * superseded, never overwritten. The case carries a snapshot of the current decision
 * so queues render without a join, but CaseDecision remains the authoritative record.
 */
export function DecisionPanel({ kase, onChanged }: { kase: ExceptionCase; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const { hubs } = useCurrentHub();
  const { data: profile } = useCurrentUser();
  const [action, setAction] = useState<ActionValue>("redeliver");
  const [targetHubCode, setTargetHubCode] = useState("");
  const [dateLocal, setDateLocal] = useState("");
  const [windowStart, setWindowStart] = useState("17:00");
  const [windowEnd, setWindowEnd] = useState("20:00");
  const [reason, setReason] = useState("");

  const decisions = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "decisions"],
    queryFn: () => data.decisionsForCase(kase.ItemId)
  });
  const analyses = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "analyses"],
    queryFn: () => data.analysesForCase(kase.ItemId)
  });

  const meta = DECISION_ACTIONS.find((a) => a.value === action)!;
  const current = (decisions.data?.items ?? []).find((d) => !d.isSuperseded);
  const proposal = (analyses.data?.items ?? []).find((a) => a.status === "completed");

  const confirm = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const staffId = (profile as unknown as { itemId?: string })?.itemId ?? "";
      const orgId = kase.ownerHubOrgId ?? "";

      // Supersede the standing decision first. A case has one current decision;
      // competing current decisions are how a parcel ends up on two routes.
      if (current) await data.update("CaseDecision", current.ItemId, { isSuperseded: true });

      const decisionId = await data.insert("CaseDecision", {
        caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
        aiAnalysisId: proposal?.ItemId ?? "",
        action,
        targetHubCode: meta.needsHub ? targetHubCode : "",
        redeliveryDateLocal: meta.needsDate ? dateLocal : "",
        windowStart: meta.needsDate ? windowStart : "",
        windowEnd: meta.needsDate ? windowEnd : "",
        timezone: "Asia/Dhaka",
        reason,
        confirmedByUserId: staffId,
        confirmedAt: now,
        isSuperseded: false,
        supersedesDecisionId: current?.ItemId ?? ""
      });

      await data.update("ExceptionCase", kase.ItemId, {
        status: meta.status,
        latestDecision: {
          decisionId: decisionId ?? "", action,
          targetHubCode: meta.needsHub ? targetHubCode : "",
          redeliveryDateLocal: meta.needsDate ? dateLocal : "",
          windowStart: meta.needsDate ? windowStart : "",
          windowEnd: meta.needsDate ? windowEnd : "",
          timezone: "Asia/Dhaka", confirmedAt: now
        }
      });

      // Care review is work for another team, so it becomes a real task rather than
      // just a status. Care investigates without taking custody or hub ownership.
      if (action === "care_review") {
        await data.insert("CareTask", {
          caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
          requestedByUserId: staffId, reason: reason || "Hub requested care review",
          status: "open"
        });
      }

      await data.insert("CaseEvent", {
        caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
        eventType: `decision.${action}`,
        actorUserId: staffId, actorName: userDisplayName(profile) || "Hub staff",
        occurredAt: now,
        details: JSON.stringify({ action, targetHubCode, reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathaopoth", "case", kase.ItemId] });
      queryClient.invalidateQueries({ queryKey: ["pathaopoth", "cases"] });
      setReason("");
      onChanged();
    }
  });

  return (
    <div className="grid gap-base">
      {/* AI provenance. Violet means proposed and unconfirmed; it disappears the
          moment a human confirms. */}
      {proposal ? (
        <AiProposalCard
          action={DECISION_ACTIONS.find((a) => a.value === proposal.recommendedAction)?.label ?? proposal.recommendedAction}
          confidence={proposal.confidence}
          requiresManualReview={proposal.requiresManualReview}
          onAccept={() => {
            if (proposal.recommendedAction) setAction(proposal.recommendedAction as ActionValue);
            if (proposal.proposedRedeliveryDateLocal) setDateLocal(proposal.proposedRedeliveryDateLocal);
            if (proposal.proposedWindowStart) setWindowStart(proposal.proposedWindowStart);
            if (proposal.proposedWindowEnd) setWindowEnd(proposal.proposedWindowEnd);
          }}
          onReject={() => setAction("care_review")}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-ai-border bg-surface p-base">
          <div className="flex items-center gap-sm">
            <Sparkles size={16} className="text-ink-disabled" aria-hidden />
            <span className="text-overline uppercase text-ink-muted">AI analysis</span>
          </div>
          <p className="mt-xs text-body-sm text-ink-muted">
            No agent is configured for this project yet, so notes are not being structured
            automatically. The decision below is entirely yours to make — nothing has been proposed.
          </p>
        </div>
      )}

      {current ? (
        <div className="rounded-md border border-hairline bg-surface p-base">
          <div className="flex items-center gap-sm">
            <CheckCircle2 size={16} className="text-settled-solid" aria-hidden />
            <span className="text-overline uppercase text-ink-muted">Current decision</span>
          </div>
          {/* Human-confirmed content is the unmarked default: plain ink, no violet. */}
          <p className="mt-xs text-heading-sm text-ink">
            {DECISION_ACTIONS.find((a) => a.value === current.action)?.label ?? current.action}
          </p>
          {current.targetHubCode ? <div className="mt-xs"><HubTag code={current.targetHubCode} /></div> : null}
          {current.redeliveryDateLocal ? (
            <p className="pp-num mt-xs text-body-sm text-ink-secondary">
              {current.redeliveryDateLocal} · {current.windowStart}–{current.windowEnd} {current.timezone}
            </p>
          ) : null}
          {current.reason ? <p className="mt-xs text-body-sm text-ink-muted">{current.reason}</p> : null}
        </div>
      ) : null}

      <form
        className="rounded-md border border-hairline bg-surface p-base"
        onSubmit={(e) => { e.preventDefault(); confirm.mutate(); }}
      >
        <h3 className="text-heading-md text-ink">{current ? "Change the decision" : "Confirm the next step"}</h3>
        {current ? (
          <p className="mt-xs text-body-sm text-ink-muted">
            The standing decision is kept and marked superseded — decisions are never overwritten.
          </p>
        ) : null}

        <label className="mt-base block">
          <span className="mb-xs block text-label text-ink-secondary">Action</span>
          <select value={action} onChange={(e) => setAction(e.target.value as ActionValue)} className={control}>
            {DECISION_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>

        {meta.needsHub ? (
          <label className="mt-base block">
            <span className="mb-xs block text-label text-ink-secondary">Target hub</span>
            <select value={targetHubCode} onChange={(e) => setTargetHubCode(e.target.value)} className={control}>
              <option value="">Select a hub…</option>
              {hubs.filter((h) => h.code !== kase.ownerHub?.code).map((h) => (
                <option key={h.ItemId} value={h.code}>{h.name} ({h.code})</option>
              ))}
            </select>
          </label>
        ) : null}

        {meta.needsDate ? (
          <div className="mt-base grid gap-base sm:grid-cols-3">
            <label className="block">
              <span className="mb-xs block text-label text-ink-secondary">Redelivery date</span>
              <input type="date" value={dateLocal} onChange={(e) => setDateLocal(e.target.value)} className={control} />
            </label>
            <label className="block">
              <span className="mb-xs block text-label text-ink-secondary">Window from</span>
              <input type="time" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} className={control} />
            </label>
            <label className="block">
              <span className="mb-xs block text-label text-ink-secondary">Window to</span>
              <input type="time" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} className={control} />
            </label>
          </div>
        ) : null}

        <label className="mt-base block">
          <span className="mb-xs block text-label text-ink-secondary">Why</span>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            placeholder="A sentence the next person will read."
            className="w-full rounded-md border border-hairline-strong bg-surface p-md text-body-md text-ink placeholder:text-ink-muted"
          />
        </label>

        {confirm.isError ? (
          <p className="mt-sm text-body-sm text-breach-text">{(confirm.error as Error)?.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={confirm.isPending || (meta.needsHub && !targetHubCode) || (meta.needsDate && !dateLocal)}
          aria-busy={confirm.isPending || undefined}
          className="mt-base h-control rounded-md bg-brand px-xl text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-55"
        >
          {confirm.isPending ? "Confirming…" : "Confirm decision"}
        </button>
        {meta.needsHub && !targetHubCode ? (
          <span className="ml-sm text-body-sm text-ink-muted">Choose a target hub first.</span>
        ) : null}
        {meta.needsDate && !dateLocal ? (
          <span className="ml-sm text-body-sm text-ink-muted">
            Pick a date — a redelivery window is never invented for you.
          </span>
        ) : null}
      </form>

      {(decisions.data?.items ?? []).length > 1 ? (
        <div className="rounded-md border border-hairline bg-surface p-base">
          <h3 className="mb-md text-overline uppercase text-ink-muted">Decision history</h3>
          <ul className="grid gap-sm">
            {decisions.data!.items.filter((d) => d.isSuperseded).map((d) => (
              <li key={d.ItemId} className="flex items-center gap-sm text-body-sm text-ink-muted">
                <span className="line-through">
                  {DECISION_ACTIONS.find((a) => a.value === d.action)?.label ?? d.action}
                </span>
                <span className="pp-num ml-auto text-caption">
                  {d.confirmedAt ? new Date(d.confirmedAt).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const control = "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink";
