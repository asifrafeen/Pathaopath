import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { data } from "../../lib/pathaopoth/data";

/**
 * Hub directory.
 *
 * A hub is two things kept in step: a Blocks Organization, which supplies the
 * `organization_id` token claim the row policies match on, and this operational record
 * holding code, address, service areas and connections. The organisation id is shown
 * because when hub scoping misbehaves, a mismatch between the two is the first thing
 * to check.
 */
export function HubsPage() {
  const hubs = useQuery({ queryKey: ["pathaopoth", "hubs"], queryFn: () => data.hubs() });
  const rows = hubs.data?.items ?? [];

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Hubs</h2>
          <p>{hubs.isLoading ? "Loading…" : `${rows.length} hub${rows.length === 1 ? "" : "s"}`}</p>
        </div>
      </div>

      {hubs.isLoading ? (
        <div className="grid gap-sm" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md bg-surface-sunken" />)}
        </div>
      ) : null}

      {hubs.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load hubs. {(hubs.error as Error)?.message}
        </div>
      ) : null}

      {!hubs.isLoading && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-md py-xxxl text-center">
          <Building2 size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-md text-ink">No hubs are configured.</p>
        </div>
      ) : null}

      <div className="grid gap-base md:grid-cols-2">
        {rows.map((h) => (
          <article key={h.ItemId} className="rounded-md border border-hairline bg-surface p-base">
            <div className="flex items-center gap-sm">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-sunken text-ink-secondary">
                <Building2 size={16} aria-hidden />
              </span>
              <div>
                <h3 className="text-heading-sm text-ink">{h.name}</h3>
                <p className="pp-mono text-caption text-ink-muted">{h.code}</p>
              </div>
              {h.isActive === false ? (
                <span className="ml-auto rounded-pill bg-queued-soft px-sm py-xxs text-caption text-queued-text">inactive</span>
              ) : (
                <span className="ml-auto rounded-pill bg-settled-soft px-sm py-xxs text-caption text-settled-text">active</span>
              )}
            </div>

            {h.address ? <p className="mt-md text-body-sm text-ink-secondary">{h.address}</p> : null}

            <dl className="mt-md border-t border-hairline pt-md">
              <dt className="text-overline uppercase text-ink-muted">Organization id</dt>
              <dd className="pp-mono mt-xxs break-all text-caption text-ink-secondary">
                {h.organizationId || <span className="text-breach-text">not linked — hub scoping will not work</span>}
              </dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
