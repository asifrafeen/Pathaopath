import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, PackageCheck } from "lucide-react";
import { data } from "../../lib/pathaopoth/data";
import {
  CodAmount, CustodyBadge, HubTag, SlaChip, StaleBanner, StatusPill, TrackingNumber
} from "../../shared/ui/domain";

export function CaseDetailPage({ caseId, onNavigate }: { caseId: string; onNavigate: (p: string) => void }) {
  const caseQuery = useQuery({
    queryKey: ["pathaopoth", "case", caseId],
    queryFn: () => data.caseById(caseId)
  });
  const receipts = useQuery({
    queryKey: ["pathaopoth", "case", caseId, "receipts"],
    queryFn: () => data.receiptsForCase(caseId)
  });
  const notes = useQuery({
    queryKey: ["pathaopoth", "case", caseId, "notes"],
    queryFn: () => data.notesForCase(caseId)
  });

  const c = caseQuery.data;
  // A receipt still pending means the arrival landed but the case snapshot has not
  // caught up. The UI says so rather than quietly showing stale data.
  const pending = (receipts.data?.items ?? []).some((r) => r.appliedState === "pending");

  if (caseQuery.isLoading) {
    return <section><div className="h-48 animate-pulse rounded-md bg-surface-sunken" aria-busy /></section>;
  }

  if (caseQuery.isError || !c) {
    return (
      <section>
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          <strong className="font-semibold">This case could not be loaded.</strong>
          <p className="mt-xs">
            {(caseQuery.error as Error)?.message ?? "It may belong to another hub, in which case the gateway will not serve it to you."}
          </p>
          <button type="button" onClick={() => onNavigate("/")} className="mt-sm underline">Back to the queue</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => onNavigate("/")}
        className="mb-base inline-flex items-center gap-xs text-body-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden /> Queue
      </button>

      <StaleBanner show={pending} />

      <div className="page-header">
        <div>
          <div className="flex flex-wrap items-center gap-sm">
            <TrackingNumber value={c.parcel?.trackingNumber} />
            <StatusPill status={c.status} />
            <SlaChip dueAt={c.slaDueAt} closed={c.status === "closed"} />
          </div>
          <p className="mt-xs">{c.parcel?.receiverName} · {c.parcel?.currentDeliveryAddress}</p>
        </div>
        <div className="page-actions">
          <CodAmount amount={c.parcel?.codAmount} currency={c.parcel?.currency} />
        </div>
      </div>

      <div className="grid gap-base md:grid-cols-[2fr_1fr]">
        <div className="grid gap-base">
          <Panel title="Hub receipts" icon={<PackageCheck size={14} aria-hidden />}>
            {(receipts.data?.items ?? []).length === 0 ? (
              <p className="text-body-sm text-ink-muted">No receipts recorded.</p>
            ) : (
              <ul className="grid gap-sm">
                {receipts.data!.items.map((r) => (
                  <li key={r.ItemId} className="rounded-md border border-hairline p-md">
                    <div className="flex flex-wrap items-center gap-sm">
                      <HubTag code={r.hubCode} />
                      <span className="text-body-sm text-ink-secondary">{r.receivedByStaff?.name}</span>
                      {r.appliedState === "pending" ? (
                        <span className="rounded-pill bg-attention-soft px-sm py-xxs text-caption text-attention-text">applying…</span>
                      ) : null}
                      <span className="pp-num ml-auto text-caption text-ink-muted">
                        {r.receivedAt ? new Date(r.receivedAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="mt-xs text-body-sm text-ink">{r.reportedReason}</p>
                    <p className="text-caption text-ink-muted">Condition: {r.parcelCondition}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Rider notes" icon={<FileText size={14} aria-hidden />}>
            {(notes.data?.items ?? []).length === 0 ? (
              <p className="text-body-sm text-ink-muted">No notes recorded.</p>
            ) : (
              <ul className="grid gap-sm">
                {notes.data!.items.map((n) => (
                  <li key={n.ItemId} className="rounded-md border border-hairline bg-surface-sunken p-md">
                    {/* Stored verbatim. Notes are immutable; a correction appends a
                        new note referencing the earlier one. */}
                    <p className="text-body-md text-ink">{n.rawText}</p>
                    <p className="mt-xs text-caption text-ink-muted">
                      {n.occurredAt ? new Date(n.occurredAt).toLocaleString() : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Ownership">
          <dl className="grid gap-md">
            <Row label="Owner hub"><HubTag code={c.ownerHub?.code} name={c.ownerHub?.name} /></Row>
            <Row label="Accountable">{c.accountableStaff?.name ?? "—"}</Row>
            <Row label="Custody"><CustodyBadge type={c.custodyType} holder={c.custodyHolder?.name} /></Row>
            <Row label="Route">{c.routeKey ?? "—"}</Row>
            <Row label="Attempts"><span className="pp-num">{c.attemptCount ?? 0}</span></Row>
            <Row label="Opened">{c.openedAt ? new Date(c.openedAt).toLocaleString() : "—"}</Row>
          </dl>
          <p className="mt-base border-t border-hairline pt-sm text-caption text-ink-muted">
            Ownership moves only when a hub acknowledges receipt. Between dispatch and arrival the
            sending hub stays accountable, so the case is never owned by nobody.
          </p>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline bg-surface p-base">
      <h3 className="mb-md flex items-center gap-sm text-overline uppercase text-ink-muted">{icon}{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-overline uppercase text-ink-muted">{label}</dt>
      <dd className="mt-xxs text-body-md text-ink">{children}</dd>
    </div>
  );
}
