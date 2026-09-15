import { useQuery } from "@tanstack/react-query";
import { BarChart3, Info } from "lucide-react";
import { data, type ExceptionCase } from "../../lib/pathaopoth/data";

const WEEK = 7 * 86_400_000;

type Row = { key: string; total: number; thisWeek: number; lastWeek: number; breaching: number };

function group(cases: ExceptionCase[], keyOf: (c: ExceptionCase) => string | undefined): Row[] {
  const now = Date.now();
  const map = new Map<string, Row>();
  for (const c of cases) {
    const key = keyOf(c);
    if (!key) continue;
    const row = map.get(key) ?? { key, total: 0, thisWeek: 0, lastWeek: 0, breaching: 0 };
    row.total += 1;
    const opened = c.openedAt ? new Date(c.openedAt).getTime() : 0;
    if (opened > now - WEEK) row.thisWeek += 1;
    else if (opened > now - 2 * WEEK) row.lastWeek += 1;
    if (c.slaBreached || (c.slaDueAt && new Date(c.slaDueAt).getTime() < now && c.status !== "closed")) {
      row.breaching += 1;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/**
 * Exception counts by hub, route and rider.
 *
 * These are COUNTS, not rates, and the page says so. A rate needs total parcel volume
 * per hub and route as a denominator, which exception-only intake cannot supply — the
 * `DailyVolume` collection exists to carry it but is not fed. Presenting counts as
 * rates would make "refused deliveries up 41%" a number nobody can act on.
 */
export function ReportsPage() {
  const query = useQuery({
    queryKey: ["pathaopoth", "reports", "cases"],
    queryFn: () => data.allCases()
  });

  const cases = query.data?.items ?? [];
  const byHub = group(cases, (c) => c.ownerHub?.code);
  const byRoute = group(cases, (c) => c.routeKey);
  const open = cases.filter((c) => c.status !== "closed");
  const breaching = open.filter(
    (c) => c.slaBreached || (c.slaDueAt ? new Date(c.slaDueAt).getTime() < Date.now() : false)
  );

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Exception reporting</h2>
          <p>{query.isLoading ? "Loading…" : `${cases.length} cases in scope`}</p>
        </div>
      </div>

      {/* The honest-denominator caveat sits above the numbers, not in a footnote. */}
      <div className="mb-base flex items-start gap-sm rounded-md border border-hairline bg-surface-sunken p-base text-body-sm text-ink-secondary">
        <Info size={16} className="mt-xxs shrink-0 text-ink-muted" aria-hidden />
        <p>
          These are <strong className="text-ink">counts and week-over-week change</strong>, not rates.
          A rate needs total parcel volume per hub and route, which exception intake alone cannot
          supply. Feed <code className="pp-mono">DailyVolume</code> and this view can switch to true
          rates without a migration.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-base" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-md bg-surface-sunken" />)}
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load reporting data. {(query.error as Error)?.message}
        </div>
      ) : null}

      {!query.isLoading && !query.isError ? (
        <>
          <div className="mb-base grid gap-md sm:grid-cols-3">
            <Tile label="Open exceptions" value={open.length} />
            <Tile label="Past SLA" value={breaching.length} tone={breaching.length > 0 ? "breach" : undefined} />
            <Tile label="Opened this week" value={byHub.reduce((n, r) => n + r.thisWeek, 0)} />
          </div>

          <Table title="By hub" rows={byHub} unit="hub" />
          <Table title="By route" rows={byRoute} unit="route" />
        </>
      ) : null}
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "breach" }) {
  return (
    <div className="rounded-md border border-hairline bg-surface p-base">
      <p className="text-overline uppercase text-ink-muted">{label}</p>
      <p className={`pp-num mt-xs text-numeric-lg ${tone === "breach" ? "text-breach-text" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Table({ title, rows, unit }: { title: string; rows: Row[]; unit: string }) {
  if (rows.length === 0) {
    return (
      <div className="mb-base rounded-md border border-hairline bg-surface p-base">
        <h3 className="text-overline uppercase text-ink-muted">{title}</h3>
        <div className="flex flex-col items-center gap-sm py-xl text-center">
          <BarChart3 size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-sm text-ink-muted">No {unit} data yet.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-base overflow-x-auto rounded-md border border-hairline bg-surface">
      <h3 className="border-b border-hairline px-cell-x py-sm text-overline uppercase text-ink-muted">{title}</h3>
      <table className="w-full border-collapse text-body-sm">
        <thead>
          <tr className="text-left">
            {[unit, "Total", "This week", "Last week", "Change", "Past SLA"].map((h) => (
              <th key={h} scope="col" className="border-b border-hairline px-cell-x py-sm text-overline uppercase text-ink-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.thisWeek - r.lastWeek;
            return (
              <tr key={r.key} className="border-b border-hairline">
                <td className="px-cell-x py-cell-y text-ink">{r.key}</td>
                <td className="pp-num px-cell-x py-cell-y">{r.total}</td>
                <td className="pp-num px-cell-x py-cell-y">{r.thisWeek}</td>
                <td className="pp-num px-cell-x py-cell-y">{r.lastWeek}</td>
                <td className="pp-num px-cell-x py-cell-y">
                  {/* The sign is carried by a minus, not by colour alone. */}
                  {r.lastWeek === 0 && r.thisWeek === 0 ? (
                    <span className="text-ink-muted">—</span>
                  ) : (
                    <span className={delta > 0 ? "text-breach-text" : delta < 0 ? "text-settled-text" : "text-ink-muted"}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </td>
                <td className="pp-num px-cell-x py-cell-y">
                  {r.breaching > 0 ? <span className="text-breach-text">{r.breaching}</span> : <span className="text-ink-muted">0</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
