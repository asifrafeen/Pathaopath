// PathaoPoth domain components — pathaopoth.design.md "Domain" section.
//
// These are what make this a PathaoPoth system rather than a generic admin theme.
// Colour discipline: operational meaning comes from the six-channel status ramp only.
// Brand blue never appears here — it is reserved for navigation, primary action and
// selection.
import type { ReactNode } from "react";
import { AlertTriangle, Building2, Clock, Sparkles, Truck, User } from "lucide-react";

/* ---------------------------------------------------------------- status-pill */

export type CaseStatus =
  | "awaiting_review" | "awaiting_care" | "on_hold" | "redelivery_scheduled"
  | "ready_for_dispatch" | "in_transit" | "loss_review" | "closed";

type Channel = "queued" | "transit" | "attention" | "breach" | "settled" | "ai";

// Every status maps onto one of six channels. A new status maps onto an existing
// channel or the ramp gets argued about — it never gets a seventh hue.
const STATUS: Record<CaseStatus, { label: string; channel: Channel }> = {
  awaiting_review: { label: "Awaiting review", channel: "queued" },
  awaiting_care: { label: "Awaiting care", channel: "attention" },
  on_hold: { label: "On hold", channel: "attention" },
  redelivery_scheduled: { label: "Redelivery scheduled", channel: "transit" },
  ready_for_dispatch: { label: "Ready for dispatch", channel: "queued" },
  in_transit: { label: "In transit", channel: "transit" },
  loss_review: { label: "Loss review", channel: "breach" },
  closed: { label: "Closed", channel: "settled" }
};

const CHANNEL_CLASS: Record<Channel, string> = {
  queued: "bg-queued-soft text-queued-text",
  transit: "bg-transit-soft text-transit-text",
  attention: "bg-attention-soft text-attention-text",
  breach: "bg-breach-soft text-breach-text",
  settled: "bg-settled-soft text-settled-text",
  ai: "bg-ai-soft text-ai-text"
};

/** Colour is never the only channel: the pill always carries its label. */
export function StatusPill({ status }: { status: string }) {
  const meta = STATUS[status as CaseStatus] ?? { label: status, channel: "queued" as Channel };
  return (
    <span className={`inline-flex items-center rounded-pill px-sm py-xxs text-caption font-medium ${CHANNEL_CLASS[meta.channel]}`}>
      {meta.label}
    </span>
  );
}

/* ------------------------------------------------------------------- sla-chip */

/**
 * SLA carries a number, not just a hue — a reader under time pressure needs the
 * magnitude, and colour alone fails for a colour-blind operator in bad light.
 */
export function SlaChip({ dueAt, closed }: { dueAt?: string | null; closed?: boolean }) {
  if (closed) {
    return <span className="inline-flex items-center gap-xs rounded-sm bg-settled-soft px-sm py-xxs text-caption text-settled-text">Settled</span>;
  }
  if (!dueAt) {
    return <span className="inline-flex items-center gap-xs rounded-sm bg-queued-soft px-sm py-xxs text-caption text-queued-text">No SLA</span>;
  }
  const ms = new Date(dueAt).getTime() - Date.now();
  const breached = ms < 0;
  const hours = Math.round(Math.abs(ms) / 3_600_000);
  const text = hours >= 48 ? `${Math.round(hours / 24)}d` : `${hours}h`;
  const tone = breached
    ? "bg-breach-soft text-breach-text"
    : hours <= 12
      ? "bg-attention-soft text-attention-text"
      : "bg-queued-soft text-queued-text";
  return (
    <span className={`pp-num inline-flex items-center gap-xs rounded-sm px-sm py-xxs text-caption ${tone}`}>
      {breached ? <AlertTriangle size={12} aria-hidden /> : <Clock size={12} aria-hidden />}
      {breached ? `${text} over` : `${text} left`}
    </span>
  );
}

/* ------------------------------------------------------------ tracking-number */

/** Mono is for identifiers a human transcribes. Latin in every locale. */
export function TrackingNumber({ value }: { value?: string | null }) {
  if (!value) return <span className="text-ink-muted">—</span>;
  return <span className="pp-mono text-ink">{value}</span>;
}

/* ----------------------------------------------------------------- cod-amount */

/** Money is tabular and right-aligned; the sign is carried by a minus, not a hue. */
export function CodAmount({ amount, currency = "BDT" }: { amount?: number | null; currency?: string }) {
  if (amount === null || amount === undefined) return <span className="text-ink-muted">—</span>;
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(amount);
  return (
    <span className="pp-num tabular-nums text-ink">
      {currency === "BDT" ? "৳" : `${currency} `}
      {formatted}
    </span>
  );
}

/* --------------------------------------------------------------------- hub-tag */

export function HubTag({ code, name }: { code?: string | null; name?: string | null }) {
  if (!code) return <span className="text-ink-muted">—</span>;
  return (
    <span
      className="inline-flex items-center gap-xs rounded-sm bg-surface-sunken px-sm py-xxs text-caption text-ink-secondary"
      title={name ?? code}
    >
      <Building2 size={12} aria-hidden />
      {code}
    </span>
  );
}

/* -------------------------------------------------------------- custody-badge */

/**
 * Custody answers "who physically holds the parcel", which is deliberately
 * separate from ownership — during transport the rider has custody while the
 * sending hub stays accountable.
 */
export function CustodyBadge({ type, holder }: { type?: string | null; holder?: string | null }) {
  if (!type) return null;
  const icon = type === "rider" ? <Truck size={12} aria-hidden /> : type === "hub" ? <Building2 size={12} aria-hidden /> : <User size={12} aria-hidden />;
  const label = holder || type;
  const tone = type === "rider" ? "bg-transit-soft text-transit-text" : "bg-queued-soft text-queued-text";
  return (
    <span className={`inline-flex items-center gap-xs rounded-pill px-sm py-xxs text-caption ${tone}`} title={`Custody: ${type}`}>
      {icon}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ rider-chip */

export function RiderChip({ name }: { name?: string | null }) {
  if (!name) return <span className="text-ink-muted">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-xs text-body-sm text-ink-secondary">
      <Truck size={12} aria-hidden />
      {name}
    </span>
  );
}

/* ---------------------------------------------------------------- stale-banner */

/**
 * The commit-point pattern means a case snapshot can legitimately lag its
 * HubReceipt until reconciliation runs. Rather than silently showing stale data,
 * the UI says so.
 */
export function StaleBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-base flex items-start gap-sm rounded-md border border-attention-solid/30 bg-attention-soft px-base py-md text-body-sm text-attention-text">
      <AlertTriangle size={16} className="mt-xxs shrink-0" aria-hidden />
      <div>
        <strong className="font-semibold">This case is still being applied.</strong>{" "}
        An arrival was recorded but the case summary has not caught up yet. The receipt is
        authoritative; this page will settle once reconciliation runs.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- ai-proposal-card */

/**
 * Violet marks proposed-and-unconfirmed. The violet disappears the moment a human
 * confirms — confusing a proposal for a decision means a parcel moved because
 * nobody checked. Never auto-applied; always an explicit accept/reject pair.
 */
export function AiProposalCard({
  action, confidence, requiresManualReview, children, onAccept, onReject
}: {
  action?: string | null;
  confidence?: number | null;
  requiresManualReview?: boolean;
  children?: ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const pct = confidence === null || confidence === undefined ? null : Math.round(confidence * 100);
  return (
    <section className="rounded-lg border border-ai-border bg-ai-soft p-base" aria-label="AI proposal, not yet confirmed">
      <header className="mb-sm flex items-center gap-sm">
        <Sparkles size={16} className="text-ai-solid" aria-hidden />
        <span className="text-overline uppercase text-ai-text">AI proposed · not confirmed</span>
        {pct !== null ? <span className="pp-num ml-auto text-caption text-ai-text">{pct}% confidence</span> : null}
      </header>

      {requiresManualReview ? (
        <p className="mb-sm text-body-sm text-ai-text">
          Confidence is low. This needs a person to decide — the product will not guess.
        </p>
      ) : null}

      {action ? <p className="mb-sm text-heading-sm text-ink">{action}</p> : null}
      {children}

      <div className="mt-base flex gap-sm">
        <button
          type="button"
          onClick={onAccept}
          className="h-control rounded-md bg-brand px-base text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed disabled:opacity-55"
        >
          Confirm this step
        </button>
        <button
          type="button"
          onClick={onReject}
          className="h-control rounded-md border border-hairline-strong bg-surface px-base text-button text-ink transition-colors duration-instant hover:bg-surface-hover"
        >
          Decide manually
        </button>
      </div>
    </section>
  );
}
