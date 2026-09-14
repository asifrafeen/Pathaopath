import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, PackageSearch } from "lucide-react";
import { data, type ExceptionCase, type Parcel } from "../../lib/pathaopoth/data";
import { CodAmount, HubTag, StatusPill, TrackingNumber } from "../../shared/ui/domain";
import { ScanInput } from "../../shared/ui/ScanInput";
import { useCurrentHub } from "../../lib/pathaopoth/useHub";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";

type Lookup =
  | { state: "idle" }
  | { state: "missing"; tracking: string }
  | { state: "found"; parcel: Parcel; openCase: ExceptionCase | null };

export function ScanPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const { hub } = useCurrentHub();

  const scan = useMutation({
    mutationFn: async (tracking: string) => {
      const parcel = await data.parcelByTracking(tracking);
      if (!parcel) return { state: "missing", tracking } as Lookup;
      // Reuse before create: an open case is opened, never duplicated.
      const openCase = await data.openCaseForParcel(parcel.ItemId);
      return { state: "found", parcel, openCase } as Lookup;
    },
    onSuccess: setLookup
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Scan a parcel</h2>
          <p>{hub ? `Receiving at ${hub.name}` : "Scan or type a tracking number to begin."}</p>
        </div>
      </div>

      <ScanInput onScan={(v) => scan.mutate(v)} busy={scan.isPending} />

      {scan.isError ? (
        <div className="mt-base rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          <strong className="font-semibold">Lookup failed.</strong>
          <p className="mt-xs">{(scan.error as Error)?.message}</p>
        </div>
      ) : null}

      {lookup.state === "missing" ? (
        <div className="mt-base flex items-start gap-sm rounded-md border border-attention-solid/30 bg-attention-soft p-base text-body-sm text-attention-text">
          <AlertTriangle size={16} className="mt-xxs shrink-0" aria-hidden />
          <div>
            <strong className="font-semibold">No parcel matches {lookup.tracking}.</strong>
            <p className="mt-xs">
              Check the number, or confirm the parcel exists in the delivery system before opening a case
              against it. Cases are always opened on a real parcel.
            </p>
          </div>
        </div>
      ) : null}

      {lookup.state === "found" ? (
        <FoundParcel parcel={lookup.parcel} openCase={lookup.openCase} onNavigate={onNavigate} />
      ) : null}

      {lookup.state === "idle" && !scan.isPending ? (
        <div className="mt-xxl flex flex-col items-center gap-md py-xxxl text-center">
          <PackageSearch size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-sm text-ink-muted">
            The scanner is focused and ready. Scan a parcel to look it up.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function FoundParcel({ parcel, openCase, onNavigate }: { parcel: Parcel; openCase: ExceptionCase | null; onNavigate: (p: string) => void }) {
  return (
    <div className="mt-base">
      <div className="rounded-md border border-hairline bg-surface p-base">
        <div className="flex flex-wrap items-center gap-base">
          <TrackingNumber value={parcel.trackingNumber} />
          <HubTag code={parcel.originHub?.code} name={parcel.originHub?.name} />
          <span className="text-ink-muted" aria-hidden>→</span>
          <HubTag code={parcel.destinationHub?.code} name={parcel.destinationHub?.name} />
          <span className="ml-auto"><CodAmount amount={parcel.codAmount} currency={parcel.currency} /></span>
        </div>
        <dl className="mt-base grid gap-md sm:grid-cols-2">
          <div>
            <dt className="text-overline uppercase text-ink-muted">Receiver</dt>
            <dd className="text-body-md text-ink">{parcel.receiverName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-overline uppercase text-ink-muted">Phone</dt>
            {/* Masked for roles without the DataProtection permission. The component
                renders the mask, not an empty field, so the reader knows the data
                exists and they lack access. */}
            <dd className="text-body-md text-ink">
              {parcel.receiverPhone ?? <span className="text-ink-muted">•••• ••••• (restricted)</span>}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-overline uppercase text-ink-muted">Delivery address</dt>
            <dd className="text-body-md text-ink">{parcel.currentDeliveryAddress ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {openCase ? (
        <div className="mt-base rounded-md border border-attention-solid/30 bg-attention-soft p-base">
          <div className="flex flex-wrap items-center gap-sm">
            <AlertTriangle size={16} className="text-attention-text" aria-hidden />
            <strong className="text-body-md font-semibold text-attention-text">This parcel already has an open case.</strong>
            <StatusPill status={openCase.status} />
          </div>
          <p className="mt-xs text-body-sm text-attention-text">
            Append this arrival to the existing case rather than opening a second one — a parcel has at
            most one open case.
          </p>
          <button
            type="button"
            onClick={() => onNavigate(`/cases/${openCase.ItemId}`)}
            className="mt-sm h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover active:bg-brand-pressed"
          >
            Open the existing case
          </button>
        </div>
      ) : (
        <CaseIntakeForm parcel={parcel} onOpened={(id) => onNavigate(`/cases/${id}`)} />
      )}
    </div>
  );
}

const CASE_TYPES = [
  { value: "refused_delivery", label: "Refused delivery" },
  { value: "cancelled_delivery", label: "Cancelled delivery" }
];
const CONDITIONS = [
  { value: "intact", label: "Intact" },
  { value: "opened", label: "Opened" },
  { value: "damaged", label: "Damaged" }
];
const REASONS = [
  "Customer refused on arrival",
  "Customer cancelled before delivery",
  "Address could not be found",
  "Customer unreachable after attempts",
  "Building access denied"
];

/**
 * Four fields, because hub staff have minutes per parcel: what happened, why,
 * what condition it arrived in, and the rider's own words. Everything else —
 * owning hub, accountable staff, route, SLA — is derived.
 *
 * The case, its first receipt, its ownership period and the note are written
 * together. There are no multi-document transactions, so the receipt is the commit
 * point and the rest is repaired forward by reconciliation if this is interrupted.
 */
function CaseIntakeForm({ parcel, onOpened }: { parcel: Parcel; onOpened: (caseId: string) => void }) {
  const { hub } = useCurrentHub();
  const { data: profile } = useCurrentUser();
  const queryClient = useQueryClient();

  const [caseType, setCaseType] = useState(CASE_TYPES[0]!.value);
  const [reason, setReason] = useState(REASONS[0]!);
  const [condition, setCondition] = useState(CONDITIONS[0]!.value);
  const [note, setNote] = useState("");

  const open = useMutation({
    mutationFn: async () => {
      if (!hub) throw new Error("No hub is associated with your account, so ownership cannot be assigned.");
      const now = new Date();
      const staffId = (profile as unknown as { itemId?: string })?.itemId ?? "";
      const staffName = userDisplayName(profile) || "Hub staff";
      const originCode = parcel.originHub?.code ?? "";
      const destCode = parcel.destinationHub?.code ?? "";

      const caseId = await data.insert("ExceptionCase", {
        parcelId: parcel.ItemId,
        parcel: {
          trackingNumber: parcel.trackingNumber,
          codAmount: parcel.codAmount ?? 0,
          currency: parcel.currency ?? "BDT",
          receiverName: parcel.receiverName ?? "",
          currentDeliveryAddress: parcel.currentDeliveryAddress ?? ""
        },
        caseType,
        status: "awaiting_review",
        ownerHubId: hub.ItemId,
        ownerHubOrgId: hub.organizationId ?? "",
        ownerHub: { hubId: hub.ItemId, code: hub.code, name: hub.name },
        accountableStaffId: staffId,
        accountableStaff: { userId: staffId, name: staffName },
        custodyType: "hub",
        custodyHubId: hub.ItemId,
        custodyHolder: { name: hub.name, code: hub.code },
        originHubCode: originCode,
        destinationHubCode: destCode,
        routeKey: originCode && destCode ? `${originCode}>${destCode}` : "",
        attemptCount: caseType === "refused_delivery" ? 1 : 0,
        receiptCount: 1,
        openedAt: now.toISOString(),
        // 72 hours is the threshold the case study's cost model is built on.
        slaDueAt: new Date(now.getTime() + 72 * 3600_000).toISOString(),
        slaBreached: false
      });
      if (!caseId) throw new Error("The case was not created.");

      await data.insert("HubReceipt", {
        caseId, parcelId: parcel.ItemId, trackingNumber: parcel.trackingNumber,
        hubId: hub.ItemId, hubOrgId: hub.organizationId ?? "", ownerHubOrgId: hub.organizationId ?? "",
        hubCode: hub.code,
        receivedByStaffId: staffId, receivedByStaff: { userId: staffId, name: staffName },
        receivedAt: now.toISOString(),
        reportedReason: reason, parcelCondition: condition,
        appliedState: "applied"
      });

      await data.insert("OwnershipHistory", {
        caseId, parcelId: parcel.ItemId, ownerHubOrgId: hub.organizationId ?? "",
        hubId: hub.ItemId, hubCode: hub.code,
        accountableStaffId: staffId, accountableStaff: { userId: staffId, name: staffName },
        startedAt: now.toISOString(), isCurrent: true
      });

      if (note.trim()) {
        await data.insert("CaseNote", {
          caseId, parcelId: parcel.ItemId, ownerHubOrgId: hub.organizationId ?? "",
          recordedByUserId: staffId,
          rawText: note.trim(),          // stored verbatim, Banglish included
          occurredAt: now.toISOString()
        });
      }

      return caseId;
    },
    onSuccess: (caseId) => {
      queryClient.invalidateQueries({ queryKey: ["pathaopoth", "cases"] });
      onOpened(caseId);
    }
  });

  return (
    <form
      className="mt-base rounded-md border border-hairline bg-surface p-base"
      onSubmit={(e) => { e.preventDefault(); open.mutate(); }}
    >
      <h3 className="text-heading-md text-ink">Open an exception case</h3>
      <p className="mt-xs text-body-sm text-ink-muted">
        Owner hub, accountable staff, route and SLA are derived. You record what happened.
      </p>

      <div className="mt-base grid gap-base sm:grid-cols-2">
        <Field label="What happened">
          <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className={controlClass}>
            {CASE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Reported reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={controlClass}>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Parcel condition">
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className={controlClass}>
            {CONDITIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Accountable">
          <div className="flex h-control items-center rounded-md border border-hairline bg-surface-sunken px-md text-body-md text-ink-secondary">
            {hub ? `${userDisplayName(profile) || "You"} · ${hub.code}` : "No hub assigned"}
          </div>
        </Field>
      </div>

      <Field label="Rider's note, in their own words">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Type exactly what the rider said — Banglish is fine, it is preserved verbatim."
          className="w-full rounded-md border border-hairline-strong bg-surface p-md text-body-md text-ink placeholder:text-ink-muted"
        />
      </Field>

      {open.isError ? (
        <p className="mt-sm text-body-sm text-breach-text">{(open.error as Error)?.message}</p>
      ) : null}

      <div className="mt-base flex items-center gap-sm">
        <button
          type="submit"
          disabled={open.isPending || !hub}
          aria-busy={open.isPending || undefined}
          className="h-control rounded-md bg-brand px-xl text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-55"
        >
          {open.isPending ? "Opening…" : "Open case"}
        </button>
        {!hub ? (
          // A disabled control must explain itself.
          <span className="text-body-sm text-ink-muted">
            Your account is not a member of a hub, so there is nobody to hold ownership.
          </span>
        ) : null}
      </div>
    </form>
  );
}

const controlClass =
  "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-base block first:mt-0">
      <span className="mb-xs block text-label text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}
