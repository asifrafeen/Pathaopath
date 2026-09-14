import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Banknote, CheckCircle2, RotateCcw } from "lucide-react";
import { data, type ExceptionCase, type MoneyTransaction } from "../../lib/pathaopoth/data";
import { CodAmount } from "../../shared/ui/domain";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";

const OUTCOMES = [
  { value: "delivered", label: "Delivered to receiver", verb: "Close as delivered" },
  { value: "returned_to_sender", label: "Returned to sender", verb: "Close as returned" },
  { value: "loss_writeoff", label: "Loss / write-off", verb: "Close as written off" }
] as const;

type Outcome = (typeof OUTCOMES)[number]["value"];

/**
 * Closure and the operational payment log.
 *
 * Money rules that hold here: amounts are positive, COD is expected money and never
 * proof of receipt, and a correction is a reversing entry — a posted amount is never
 * edited. This is a payment log, not an accounting ledger.
 *
 * A write-off is never automatic. It needs an approved LossReview first, because
 * "cancelled" is not "lost".
 */
export function ClosurePanel({ kase, onChanged }: { kase: ExceptionCase; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentUser();
  const [outcome, setOutcome] = useState<Outcome>("delivered");
  const [recipient, setRecipient] = useState("");
  const [proof, setProof] = useState("");
  const [collected, setCollected] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [reversing, setReversing] = useState<MoneyTransaction | null>(null);

  const money = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "money"],
    queryFn: () => data.moneyForCase(kase.ItemId)
  });
  const losses = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "loss"],
    queryFn: () => data.lossReviewsForCase(kase.ItemId)
  });

  const actor = {
    id: (profile as unknown as { itemId?: string })?.itemId ?? "",
    name: userDisplayName(profile) || "Hub staff"
  };
  const approvedLoss = (losses.data?.items ?? []).find((l) => l.status === "approved");
  const cod = kase.parcel?.codAmount ?? 0;
  const orgId = kase.ownerHubOrgId ?? "";

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "case", kase.ItemId] });
    queryClient.invalidateQueries({ queryKey: ["pathaopoth", "cases"] });
    onChanged();
  };

  const close = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      if (outcome === "loss_writeoff" && !approvedLoss) {
        throw new Error("A write-off needs an approved loss review first. A parcel is never written off automatically.");
      }

      // Zero collection means no transaction at all — an empty row is not a record
      // of nothing happening, it is noise.
      if (outcome === "delivered" && collected && cod > 0) {
        await data.insert("MoneyTransaction", {
          caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
          type: "customer_collection", amount: cod, currency: kase.parcel?.currency ?? "BDT",
          fromParty: { type: "receiver", parcelId: kase.parcelId, displayName: kase.parcel?.receiverName ?? "Receiver" },
          toParty: { type: "hub", hubId: kase.ownerHubId ?? "", displayName: kase.ownerHub?.code ?? "Hub" },
          occurredAt: now, recordedByUserId: actor.id, reference: proof
        });
      }
      if (outcome === "loss_writeoff" && approvedLoss?.approvedAmount) {
        await data.insert("MoneyTransaction", {
          caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
          type: "compensation", amount: approvedLoss.approvedAmount, currency: approvedLoss.currency ?? "BDT",
          fromParty: { type: "company", displayName: "PathaoPoth" },
          toParty: { type: "sender", displayName: "Sender" },
          occurredAt: now, recordedByUserId: actor.id, reference: `loss:${approvedLoss.ItemId}`
        });
      }

      await data.update("ExceptionCase", kase.ItemId, {
        status: "closed", resolution: outcome, closedAt: now
      });

      // Closure ends the active ownership period; the case keeps its last owner for
      // reporting.
      const periods = await data.ownershipForCase(kase.ItemId);
      const current = periods.items.find((p) => p.isCurrent);
      if (current) await data.update("OwnershipHistory", current.ItemId, { endedAt: now, isCurrent: false });

      await data.insert("CaseEvent", {
        caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
        eventType: `case.closed.${outcome}`, actorUserId: actor.id, actorName: actor.name,
        occurredAt: now, details: JSON.stringify({ outcome, recipient, proof })
      });
    },
    onSuccess: () => { setConfirming(false); refresh(); }
  });

  const reverse = useMutation({
    mutationFn: async (tx: MoneyTransaction) => {
      await data.insert("MoneyTransaction", {
        caseId: kase.ItemId, parcelId: kase.parcelId, ownerHubOrgId: orgId,
        type: tx.type, amount: tx.amount ?? 0, currency: tx.currency ?? "BDT",
        // The reversal swaps the counterparties rather than posting a negative.
        fromParty: tx.toParty ?? { type: "company", displayName: "PathaoPoth" },
        toParty: tx.fromParty ?? { type: "company", displayName: "PathaoPoth" },
        occurredAt: new Date().toISOString(), recordedByUserId: actor.id,
        reversesTransactionId: tx.ItemId, reference: `reversal of ${tx.ItemId}`
      });
    },
    onSuccess: () => { setReversing(null); refresh(); }
  });

  const txs = money.data?.items ?? [];
  const reversedIds = new Set(txs.map((t) => t.reversesTransactionId).filter(Boolean));

  return (
    <div className="grid gap-base">
      <div className="rounded-md border border-hairline bg-surface p-base">
        <h3 className="mb-md flex items-center gap-sm text-overline uppercase text-ink-muted">
          <Banknote size={14} aria-hidden /> Money
        </h3>
        {txs.length === 0 ? (
          <p className="text-body-sm text-ink-muted">
            No money has moved. COD of <CodAmount amount={cod} currency={kase.parcel?.currency} /> is
            expected, which is not the same as collected.
          </p>
        ) : (
          <ul className="grid gap-sm">
            {txs.map((t) => {
              const isReversal = Boolean(t.reversesTransactionId);
              const wasReversed = reversedIds.has(t.ItemId);
              return (
                <li key={t.ItemId} className="flex flex-wrap items-center gap-sm rounded-md border border-hairline p-md">
                  <span className="text-body-sm text-ink">{t.type.replace(/_/g, " ")}</span>
                  {isReversal ? <span className="rounded-pill bg-queued-soft px-sm py-xxs text-caption text-queued-text">reversal</span> : null}
                  {wasReversed ? <span className="rounded-pill bg-attention-soft px-sm py-xxs text-caption text-attention-text">reversed</span> : null}
                  <span className="text-caption text-ink-muted">
                    {t.fromParty?.displayName} → {t.toParty?.displayName}
                  </span>
                  <span className="ml-auto"><CodAmount amount={t.amount} currency={t.currency} /></span>
                  {!isReversal && !wasReversed ? (
                    <button
                      type="button"
                      onClick={() => setReversing(t)}
                      className="inline-flex items-center gap-xs text-caption text-ink-muted underline hover:text-ink"
                    >
                      <RotateCcw size={12} aria-hidden /> Reverse
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {kase.status !== "closed" ? (
        <form
          className="rounded-md border border-hairline bg-surface p-base"
          onSubmit={(e) => { e.preventDefault(); setConfirming(true); }}
        >
          <h3 className="text-heading-md text-ink">Close this case</h3>
          <p className="mt-xs text-body-sm text-ink-muted">
            Closure needs a resolution, no active movement, and any required proof and settlement.
          </p>

          <label className="mt-base block">
            <span className="mb-xs block text-label text-ink-secondary">Outcome</span>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)} className={control}>
              {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          {outcome !== "loss_writeoff" ? (
            <div className="mt-base grid gap-base sm:grid-cols-2">
              <label className="block">
                <span className="mb-xs block text-label text-ink-secondary">Who accepted it</span>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className={control} placeholder="Name of the person who signed" />
              </label>
              <label className="block">
                <span className="mb-xs block text-label text-ink-secondary">Proof reference</span>
                <input value={proof} onChange={(e) => setProof(e.target.value)} className={control} placeholder="Signature or photo reference" />
              </label>
            </div>
          ) : null}

          {outcome === "delivered" && cod > 0 ? (
            <label className="mt-base flex items-center gap-sm">
              <input type="checkbox" checked={collected} onChange={(e) => setCollected(e.target.checked)} />
              <span className="text-body-sm text-ink">
                COD of <CodAmount amount={cod} currency={kase.parcel?.currency} /> was collected
              </span>
            </label>
          ) : null}

          {outcome === "loss_writeoff" && !approvedLoss ? (
            <p className="mt-base rounded-md bg-attention-soft p-md text-body-sm text-attention-text">
              No approved loss review exists for this case. A parcel is never written off without
              authorisation — cancellation alone is not loss.
            </p>
          ) : null}

          {close.isError ? <p className="mt-sm text-body-sm text-breach-text">{(close.error as Error)?.message}</p> : null}

          <button
            type="submit"
            disabled={outcome === "loss_writeoff" && !approvedLoss}
            className="mt-base inline-flex h-control items-center gap-sm rounded-md bg-brand px-xl text-button text-brand-on hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-55"
          >
            <CheckCircle2 size={16} aria-hidden />
            {OUTCOMES.find((o) => o.value === outcome)!.verb}
          </button>
        </form>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={`Close case for ${kase.parcel?.trackingNumber ?? "this parcel"}?`}
        body={
          <>
            Closing records the resolution as{" "}
            <strong>{OUTCOMES.find((o) => o.value === outcome)!.label.toLowerCase()}</strong> and ends the
            current ownership period. A later exception on this parcel would open a new case.
          </>
        }
        confirmLabel={OUTCOMES.find((o) => o.value === outcome)!.verb}
        busy={close.isPending}
        onConfirm={() => close.mutate()}
        onCancel={() => setConfirming(false)}
      />

      <ConfirmDialog
        open={Boolean(reversing)}
        tone="danger"
        title="Reverse this transaction?"
        body={
          <>
            A reversing entry is posted against{" "}
            <strong>{reversing?.type.replace(/_/g, " ")}</strong> of{" "}
            <CodAmount amount={reversing?.amount} currency={reversing?.currency} />. The original row
            stays exactly as posted — amounts are never edited.
          </>
        }
        confirmLabel="Post the reversal"
        busy={reverse.isPending}
        onConfirm={() => reversing && reverse.mutate(reversing)}
        onCancel={() => setReversing(null)}
      />
    </div>
  );
}

const control = "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink";
