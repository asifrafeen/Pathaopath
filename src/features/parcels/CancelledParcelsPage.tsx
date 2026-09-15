import { useQuery } from "@tanstack/react-query";
import { PackageX } from "lucide-react";
import { data } from "../../lib/pathaopoth/data";
import { CodAmount, CustodyBadge, HubTag, SlaChip, StatusPill, TrackingNumber } from "../../shared/ui/domain";

/**
 * Cancelled parcels waiting to be received.
 *
 * A cancellation is not a loss and not a return on its own — the parcel still has to
 * physically come back to a hub, be acknowledged, and be routed. This queue is what is
 * outstanding: cancelled cases that have not yet reached a terminal resolution.
 */
export function CancelledParcelsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const cases = useQuery({
    queryKey: ["pathaopoth", "cases", "cancelled"],
    queryFn: () => data.cancelledCases()
  });

  const all = cases.data?.items ?? [];
  const outstanding = all.filter((c) => c.status !== "closed");
  const settled = all.filter((c) => c.status === "closed");

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Cancelled parcels — receive</h2>
          <p>
            {cases.isLoading
              ? "Loading…"
              : `${outstanding.length} awaiting receipt or routing · ${settled.length} settled`}
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={() => onNavigate("/scan")}
            className="h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover active:bg-brand-pressed"
          >
            Scan an arrival
          </button>
        </div>
      </div>

      {cases.isLoading ? (
        <div className="grid gap-sm" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-surface-sunken" />)}
        </div>
      ) : null}

      {cases.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load cancelled parcels. {(cases.error as Error)?.message}
        </div>
      ) : null}

      {!cases.isLoading && outstanding.length === 0 ? (
        <div className="flex flex-col items-center gap-md py-xxxl text-center">
          <PackageX size={32} className="text-ink-muted" aria-hidden />
          <div>
            <p className="text-heading-sm text-ink">Nothing outstanding</p>
            <p className="text-body-sm text-ink-muted">
              Every cancelled parcel has been received and resolved.
            </p>
          </div>
        </div>
      ) : null}

      {outstanding.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
          <table className="w-full border-collapse text-body-sm">
            <thead className="bg-surface-sunken">
              <tr className="text-left">
                {["Tracking", "Status", "SLA", "Currently at", "Custody", "COD", ""].map((h, i) => (
                  <th key={h || i} scope="col" className="whitespace-nowrap border-b border-hairline px-cell-x py-sm text-overline uppercase text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outstanding.map((c) => {
                const breaching = c.slaBreached || (c.slaDueAt ? new Date(c.slaDueAt).getTime() < Date.now() : false);
                return (
                  <tr
                    key={c.ItemId}
                    onClick={() => onNavigate(`/cases/${c.ItemId}`)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onNavigate(`/cases/${c.ItemId}`); }}
                    className={`cursor-pointer border-b border-hairline hover:bg-surface-hover ${
                      breaching ? "border-l-2 border-l-breach-solid" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className="whitespace-nowrap px-cell-x py-cell-y"><TrackingNumber value={c.parcel?.trackingNumber} /></td>
                    <td className="px-cell-x py-cell-y"><StatusPill status={c.status} /></td>
                    <td className="px-cell-x py-cell-y"><SlaChip dueAt={c.slaDueAt} closed={false} /></td>
                    <td className="px-cell-x py-cell-y"><HubTag code={c.ownerHub?.code} name={c.ownerHub?.name} /></td>
                    <td className="px-cell-x py-cell-y"><CustodyBadge type={c.custodyType} holder={c.custodyHolder?.name} /></td>
                    <td className="whitespace-nowrap px-cell-x py-cell-y text-right"><CodAmount amount={c.parcel?.codAmount} currency={c.parcel?.currency} /></td>
                    <td className="px-cell-x py-cell-y text-right text-ink-muted"><span aria-hidden>›</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
