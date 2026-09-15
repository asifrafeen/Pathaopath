import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Megaphone } from "lucide-react";
import { data, type ExceptionCase } from "../../lib/pathaopoth/data";
import { useCurrentUser } from "../profile/useCurrentUser";

/**
 * Sender-facing updates.
 *
 * This is the only thing a sender ever reads. `SenderUpdate` holds no receiver phone,
 * no internal note and no AI evidence — sender safety comes from the projection
 * containing nothing sensitive, not from a masking policy evaluating correctly for an
 * anonymous caller. Nothing here copies text from a rider note; the message is
 * written deliberately and reviewed before it is published.
 */
export function SenderUpdatePanel({ kase }: { kase: ExceptionCase }) {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentUser();
  const [message, setMessage] = useState("");
  const [statusLabel, setStatusLabel] = useState("Being reviewed");
  const [days, setDays] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  const updates = useQuery({
    queryKey: ["pathaopoth", "case", kase.ItemId, "sender"],
    queryFn: () => data.senderUpdatesForCase(kase.ItemId)
  });

  const publish = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const existing = updates.data?.items ?? [];
      // One durable link per case: the sender keeps the URL they were first given,
      // and later updates replace the message behind it.
      const token = existing[0]?.publicToken ?? crypto.randomUUID().replace(/-/g, "");
      await data.insert("SenderUpdate", {
        caseId: kase.ItemId, parcelId: kase.parcelId,
        trackingNumber: kase.parcel?.trackingNumber ?? "",
        publicToken: token,
        publicMessage: message.trim(),
        statusLabel,
        expectedResolutionAt: new Date(now.getTime() + days * 86_400_000).toISOString(),
        publishedByUserId: (profile as unknown as { itemId?: string })?.itemId ?? "",
        publishedAt: now.toISOString()
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["pathaopoth", "case", kase.ItemId, "sender"] });
    }
  });

  const items = updates.data?.items ?? [];
  const latest = items[0];
  const link = latest?.publicToken ? `${window.location.origin}/t/${latest.publicToken}` : null;

  return (
    <div className="rounded-md border border-hairline bg-surface p-base">
      <h3 className="mb-md flex items-center gap-sm text-overline uppercase text-ink-muted">
        <Megaphone size={14} aria-hidden /> Sender updates
      </h3>

      {latest ? (
        <div className="mb-base rounded-md border border-hairline bg-surface-sunken p-md">
          <p className="text-body-md text-ink">{latest.publicMessage}</p>
          <p className="mt-xs text-caption text-ink-muted">
            {latest.statusLabel} · published {latest.publishedAt ? new Date(latest.publishedAt).toLocaleString() : ""}
          </p>
          {link ? (
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(link); setCopied(link); }}
              className="mt-sm inline-flex items-center gap-xs text-caption text-brand-text underline"
            >
              <Copy size={12} aria-hidden /> {copied === link ? "Link copied" : "Copy the sender link"}
            </button>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={(e) => { e.preventDefault(); publish.mutate(); }}>
        <label className="block">
          <span className="mb-xs block text-label text-ink-secondary">Message the sender will see</span>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            placeholder="Plain, specific, and safe to read by someone outside the company."
            className="w-full rounded-md border border-hairline-strong bg-surface p-md text-body-md text-ink placeholder:text-ink-muted"
          />
        </label>
        <div className="mt-base grid gap-base sm:grid-cols-2">
          <label className="block">
            <span className="mb-xs block text-label text-ink-secondary">Status shown</span>
            <select value={statusLabel} onChange={(e) => setStatusLabel(e.target.value)} className={control}>
              {["Being reviewed", "Redelivery scheduled", "On its way back to you", "Resolved"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-xs block text-label text-ink-secondary">Expect resolution within</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={control}>
              {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
            </select>
          </label>
        </div>

        <p className="mt-sm text-caption text-ink-muted">
          Internal notes, receiver phone numbers and AI evidence are never included — this record has
          no field to put them in.
        </p>

        {publish.isError ? <p className="mt-sm text-body-sm text-breach-text">{(publish.error as Error)?.message}</p> : null}

        <button
          type="submit"
          disabled={publish.isPending || !message.trim()}
          className="mt-base h-control rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover disabled:opacity-55"
        >
          {publish.isPending ? "Publishing…" : latest ? "Publish an update" : "Publish the first update"}
        </button>
      </form>
    </div>
  );
}

const control = "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink";
