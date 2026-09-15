import { useQuery } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { data } from "../../lib/pathaopoth/data";

/**
 * The sender's view — the one page in this product served without a login.
 *
 * It reads `SenderUpdate` and nothing else. That collection's read access level is
 * Public, which is safe precisely because it holds no sensitive field: no receiver
 * phone, no internal note, no AI evidence. Sender safety is structural, not a policy
 * that has to evaluate correctly for an anonymous caller.
 *
 * The token is the only thing gating access, so it is long and random.
 */
export function SenderTrackPage({ token }: { token: string }) {
  const query = useQuery({
    queryKey: ["pathaopoth", "sender", token],
    queryFn: () => data.senderUpdateByToken(token),
    retry: false
  });

  return (
    <div className="min-h-screen bg-canvas px-base py-xxxl">
      <div className="mx-auto w-full max-w-[560px]">
        <header className="mb-xl flex items-center gap-sm">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-on">
            <PackageCheck size={16} aria-hidden />
          </span>
          <span className="text-heading-md text-ink">PathaoPoth</span>
        </header>

        {query.isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-surface-sunken" aria-busy />
        ) : null}

        {/* A wrong or expired token reveals nothing — not even whether it ever existed. */}
        {!query.isLoading && !query.data ? (
          <div className="rounded-lg border border-hairline bg-surface p-xl">
            <h1 className="text-heading-lg text-ink">This link is not valid</h1>
            <p className="mt-sm text-body-md text-ink-secondary">
              It may have expired, or the address may have been mistyped. If you were sent this link
              by PathaoPoth, please contact the sender you shipped with.
            </p>
          </div>
        ) : null}

        {query.data ? (
          <article className="rounded-lg border border-hairline bg-surface p-xl">
            <p className="text-overline uppercase text-ink-muted">Parcel</p>
            <p className="pp-mono mt-xxs text-heading-md text-ink">{query.data.trackingNumber}</p>

            <div className="mt-xl">
              <span className="inline-flex items-center rounded-pill bg-transit-soft px-md py-xs text-body-sm text-transit-text">
                {query.data.statusLabel}
              </span>
            </div>

            <p className="mt-base text-body-lg text-ink">{query.data.publicMessage}</p>

            {query.data.expectedResolutionAt ? (
              <p className="mt-base border-t border-hairline pt-base text-body-sm text-ink-secondary">
                We expect to resolve this by{" "}
                <strong className="text-ink">
                  {new Date(query.data.expectedResolutionAt).toLocaleDateString(undefined, {
                    weekday: "long", day: "numeric", month: "long"
                  })}
                </strong>
                .
              </p>
            ) : null}

            <p className="mt-base text-caption text-ink-muted">
              Last updated{" "}
              {query.data.publishedAt ? new Date(query.data.publishedAt).toLocaleString() : "recently"}.
            </p>
          </article>
        ) : null}
      </div>
    </div>
  );
}
