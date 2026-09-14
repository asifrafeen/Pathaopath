import { useQuery } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { data } from "../../lib/pathaopoth/data";

/** Care's own queue: tasks awaiting investigation, across every hub. */
export function CareQueuePage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const tasks = useQuery({
    queryKey: ["pathaopoth", "care", "open"],
    queryFn: () => data.openCareTasks()
  });

  const items = tasks.data?.items ?? [];

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Care queue</h2>
          <p>{tasks.isLoading ? "Loading…" : `${items.length} awaiting care`}</p>
        </div>
      </div>

      {tasks.isLoading ? (
        <div className="grid gap-sm" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-md bg-surface-sunken" />)}
        </div>
      ) : null}

      {tasks.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load the care queue. {(tasks.error as Error)?.message}
        </div>
      ) : null}

      {!tasks.isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center gap-md py-xxxl text-center">
          <LifeBuoy size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-md text-ink">Nothing is waiting on care.</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-hairline bg-surface">
          <ul>
            {items.map((t) => (
              <li key={t.ItemId}>
                <button
                  type="button"
                  onClick={() => onNavigate(`/cases/${t.caseId}`)}
                  className="flex w-full items-center gap-base border-b border-hairline px-cell-x py-cell-y text-left transition-colors duration-instant hover:bg-surface-hover"
                >
                  <span className={`rounded-pill px-sm py-xxs text-caption ${
                    t.status === "in_progress" ? "bg-transit-soft text-transit-text" : "bg-attention-soft text-attention-text"
                  }`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <span className="text-body-sm text-ink">{t.reason ?? "Care review requested"}</span>
                  <span className="ml-auto text-body-sm text-ink-muted">
                    {t.assignedCareUser?.name ?? "Unassigned"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
