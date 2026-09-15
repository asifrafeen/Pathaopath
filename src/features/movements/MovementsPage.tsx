import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { data, type ParcelMovement } from "../../lib/pathaopoth/data";
import { HubTag, TrackingNumber } from "../../shared/ui/domain";
import { useCurrentUser, userDisplayName } from "../profile/useCurrentUser";
import { acknowledgePickup } from "./movementActions";

/**
 * A rider's runs. Field mode renders these as a card stack, never a table — a rider
 * never reads a twelve-column table, and the primary action sits low in the card
 * where a thumb reaches.
 */
export function MovementsPage() {
  const { data: profile } = useCurrentUser();
  const riderId = (profile as unknown as { itemId?: string })?.itemId ?? "";
  const queryClient = useQueryClient();

  const runs = useQuery({
    enabled: Boolean(riderId),
    queryKey: ["pathaopoth", "movements", riderId],
    queryFn: () => data.movementsForRider(riderId)
  });

  const pickup = useMutation({
    mutationFn: (m: ParcelMovement) =>
      acknowledgePickup(m, { id: riderId, name: userDisplayName(profile) || "Rider" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pathaopoth", "movements"] })
  });

  const items = runs.data?.items ?? [];

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>My runs</h2>
          <p>{runs.isLoading ? "Loading…" : `${items.length} assigned`}</p>
        </div>
      </div>

      {runs.isLoading ? (
        <div className="grid gap-md" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-sunken" />
          ))}
        </div>
      ) : null}

      {runs.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load your runs. {(runs.error as Error)?.message}
        </div>
      ) : null}

      {!runs.isLoading && items.length === 0 ? (
        <div className="flex flex-col items-center gap-md py-xxxl text-center">
          <Truck size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-md text-ink">Nothing assigned to you right now.</p>
        </div>
      ) : null}

      <div className="grid gap-md">
        {items.map((m) => (
          <article key={m.ItemId} className="rounded-lg border border-hairline bg-surface p-base">
            <div className="flex flex-wrap items-center gap-sm">
              <TrackingNumber value={m.trackingNumber} />
              <span className={`rounded-pill px-sm py-xxs text-caption ${
                m.status === "picked_up" ? "bg-transit-soft text-transit-text" : "bg-queued-soft text-queued-text"
              }`}>
                {m.status === "picked_up" ? "With you" : "Waiting for pickup"}
              </span>
            </div>

            <div className="mt-md flex flex-wrap items-center gap-sm text-body-md text-ink">
              <HubTag code={m.fromHubCode} />
              <span aria-hidden className="text-ink-muted">→</span>
              {m.destinationType === "hub"
                ? <HubTag code={m.toHubCode} />
                : <span className="text-ink">{m.destinationType === "sender" ? "Sender" : "Receiver"}</span>}
            </div>

            {m.destinationAddressSnapshot ? (
              <p className="mt-sm text-body-md text-ink">{m.destinationAddressSnapshot}</p>
            ) : null}

            {/* One primary action per card, in the thumb zone. */}
            {m.status === "planned" ? (
              <button
                type="button"
                onClick={() => pickup.mutate(m)}
                disabled={pickup.isPending}
                className="mt-base h-[56px] w-full rounded-md bg-brand text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed disabled:opacity-55"
              >
                {pickup.isPending ? "Confirming…" : "I have picked this up"}
              </button>
            ) : (
              <p className="mt-base rounded-md bg-surface-sunken p-md text-body-sm text-ink-secondary">
                In your custody. The receiving hub confirms arrival — you do not close this yourself.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
