import { useQuery } from "@tanstack/react-query";
import { Inbox, RefreshCw } from "lucide-react";
import { data, type ExceptionCase } from "../../lib/pathaopoth/data";
import { CodAmount, CustodyBadge, HubTag, SlaChip, StatusPill, TrackingNumber } from "../../shared/ui/domain";
import { useCurrentHub } from "../../lib/pathaopoth/useHub";

/**
 * The hub queue. Rows are scoped by the gateway, not here — a hub staff member and a
 * care agent run the same query and get different row counts, which is the row-level
 * policy doing its job.
 */
export function QueuePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { hub } = useCurrentHub();
  const query = useQuery({
    queryKey: ["pathaopoth", "cases", "open"],
    queryFn: () => data.cases({ pageSize: 100 })
  });

  const cases = (query.data?.items ?? []).filter((c) => c.status !== "closed");

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Exception queue</h2>
          <p>
            {hub ? `${hub.name} · ` : ""}
            {query.isLoading ? "Loading…" : `${cases.length} open ${cases.length === 1 ? "case" : "cases"}`}
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            aria-busy={query.isFetching || undefined}
            className="inline-flex h-control items-center gap-sm rounded-md border border-hairline-strong bg-surface px-base text-button text-ink transition-colors duration-instant hover:bg-surface-hover disabled:opacity-55"
          >
            <RefreshCw size={16} className={query.isFetching ? "animate-spin" : undefined} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/scan")}
            className="h-control rounded-md bg-brand px-base text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed"
          >
            Scan a parcel
          </button>
        </div>
      </div>

      {/* Every async surface renders four states, not just the loaded one. */}
      {query.isLoading ? <QueueSkeleton /> : null}

      {query.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          <strong className="font-semibold">Could not load the queue.</strong>
          <p className="mt-xs">{(query.error as Error)?.message}</p>
          <button type="button" onClick={() => query.refetch()} className="mt-sm underline">Try again</button>
        </div>
      ) : null}

      {!query.isLoading && !query.isError && cases.length === 0 ? (
        <div className="flex flex-col items-center gap-md rounded-md border border-hairline bg-surface py-xxxl text-center">
          <Inbox size={32} className="text-ink-muted" aria-hidden />
          <div>
            <p className="text-heading-sm text-ink">No open exceptions</p>
            <p className="text-body-sm text-ink-muted">Nothing is waiting on this hub right now.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/scan")}
            className="h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover"
          >
            Scan a parcel
          </button>
        </div>
      ) : null}

      {cases.length > 0 ? <QueueTable cases={cases} onNavigate={onNavigate} /> : null}
    </section>
  );
}

function QueueTable({ cases, onNavigate }: { cases: ExceptionCase[]; onNavigate: (p: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
      <table className="w-full border-collapse text-body-sm">
        <thead className="sticky top-0 z-sticky bg-surface-sunken">
          <tr className="text-left">
            {["Tracking", "Status", "SLA", "Owner hub", "Custody", "Route", "COD", ""].map((h, i) => (
              <th
                key={h || i}
                scope="col"
                className="whitespace-nowrap border-b border-hairline px-cell-x py-sm text-overline uppercase text-ink-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const breaching = c.slaBreached || (c.slaDueAt ? new Date(c.slaDueAt).getTime() < Date.now() : false);
            return (
              <tr
                key={c.ItemId}
                onClick={() => onNavigate(`/cases/${c.ItemId}`)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onNavigate(`/cases/${c.ItemId}`); }}
                // A breaching row gets a 2px red LEFT BORDER, never a red fill —
                // a filled row destroys the legibility of everything in it.
                className={`cursor-pointer border-b border-hairline transition-colors duration-instant hover:bg-surface-hover ${
                  breaching ? "border-l-2 border-l-breach-solid" : "border-l-2 border-l-transparent"
                }`}
              >
                <td className="whitespace-nowrap px-cell-x py-cell-y"><TrackingNumber value={c.parcel?.trackingNumber} /></td>
                <td className="px-cell-x py-cell-y"><StatusPill status={c.status} /></td>
                <td className="px-cell-x py-cell-y"><SlaChip dueAt={c.slaDueAt} closed={c.status === "closed"} /></td>
                <td className="px-cell-x py-cell-y"><HubTag code={c.ownerHub?.code} name={c.ownerHub?.name} /></td>
                <td className="px-cell-x py-cell-y"><CustodyBadge type={c.custodyType} holder={c.custodyHolder?.name} /></td>
                <td className="whitespace-nowrap px-cell-x py-cell-y text-ink-secondary">{c.routeKey ?? "—"}</td>
                <td className="whitespace-nowrap px-cell-x py-cell-y text-right">
                  <CodAmount amount={c.parcel?.codAmount} currency={c.parcel?.currency} />
                </td>
                <td className="px-cell-x py-cell-y text-right text-ink-muted">
                  <span aria-hidden>›</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Loading is shaped like the content, with a plausible row count. */
function QueueSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface" aria-busy>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-base border-b border-hairline px-cell-x" style={{ height: "var(--pp-row-h)" }}>
          <div className="h-3 w-32 animate-pulse rounded-xs bg-surface-sunken" />
          <div className="h-3 w-24 animate-pulse rounded-xs bg-surface-sunken" />
          <div className="h-3 w-20 animate-pulse rounded-xs bg-surface-sunken" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded-xs bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
