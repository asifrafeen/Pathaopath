import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PackagePlus, Search } from "lucide-react";
import { data, type Hub } from "../../lib/pathaopoth/data";
import { CodAmount, HubTag, TrackingNumber } from "../../shared/ui/domain";
import { useCurrentUser } from "../profile/useCurrentUser";
import { hasRole } from "../../lib/pathaopoth/roles";

/**
 * Parcel administration.
 *
 * Creating a parcel is restricted to `parcel_admin`, and that restriction is enforced
 * by the Data Gateway — write, edit and delete on Parcel are Custom with a policy
 * naming that role. Hiding the form here is convenience; a rider calling the API
 * directly is refused with "No policy grants access to this resource".
 *
 * Parcels normally originate in the delivery system. Creating one here is a deliberate
 * administrative act, for a parcel that physically exists but is not yet on file.
 */
export function ParcelsPage() {
  const { data: profile } = useCurrentUser();
  const canCreate = hasRole(profile, "parcel_admin");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const parcels = useQuery({
    queryKey: ["pathaopoth", "parcels"],
    queryFn: () => data.parcels()
  });

  const rows = (parcels.data?.items ?? []).filter((p) =>
    !search.trim() || (p.trackingNumber ?? "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className="wide">
      <div className="page-header">
        <div>
          <h2>Parcels</h2>
          <p>{parcels.isLoading ? "Loading…" : `${rows.length} of ${parcels.data?.totalCount ?? 0}`}</p>
        </div>
        <div className="page-actions">
          {canCreate ? (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex h-control items-center gap-sm rounded-md bg-brand px-base text-button text-brand-on hover:bg-brand-hover active:bg-brand-pressed"
            >
              <PackagePlus size={16} aria-hidden />
              {showForm ? "Close" : "Create a parcel"}
            </button>
          ) : null}
        </div>
      </div>

      {!canCreate ? (
        // A control that is absent for a reason says so, rather than leaving the
        // reader wondering where it went.
        <p className="mb-base rounded-md border border-hairline bg-surface-sunken p-md text-body-sm text-ink-secondary">
          Only a parcel admin can create parcels. Parcels normally arrive from the delivery system —
          if a scan finds nothing, check the tracking number before assuming the record is missing.
        </p>
      ) : null}

      {canCreate && showForm ? <CreateParcelForm onCreated={() => { setShowForm(false); parcels.refetch(); }} /> : null}

      <div className="mb-base flex items-center gap-sm">
        <div className="relative flex-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by tracking number"
            aria-label="Filter parcels"
            className="h-control w-full rounded-md border border-hairline-strong bg-surface pl-[38px] pr-md text-body-md text-ink placeholder:text-ink-muted"
          />
        </div>
      </div>

      {parcels.isLoading ? (
        <div className="grid gap-sm" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-surface-sunken" />)}
        </div>
      ) : null}

      {parcels.isError ? (
        <div className="rounded-md border border-breach-solid/30 bg-breach-soft p-base text-body-sm text-breach-text">
          Could not load parcels. {(parcels.error as Error)?.message}
        </div>
      ) : null}

      {!parcels.isLoading && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-md py-xxxl text-center">
          <PackagePlus size={32} className="text-ink-muted" aria-hidden />
          <p className="text-body-md text-ink">{search ? "No parcel matches that number." : "No parcels yet."}</p>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
          <table className="w-full border-collapse text-body-sm">
            <thead className="bg-surface-sunken">
              <tr className="text-left">
                {["Tracking", "Receiver", "Address", "Origin", "Destination", "COD"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap border-b border-hairline px-cell-x py-sm text-overline uppercase text-ink-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.ItemId} className="border-b border-hairline hover:bg-surface-hover">
                  <td className="whitespace-nowrap px-cell-x py-cell-y"><TrackingNumber value={p.trackingNumber} /></td>
                  <td className="px-cell-x py-cell-y text-ink">{p.receiverName ?? "—"}</td>
                  <td className="px-cell-x py-cell-y text-ink-secondary">{p.currentDeliveryAddress ?? "—"}</td>
                  <td className="px-cell-x py-cell-y"><HubTag code={p.originHub?.code} name={p.originHub?.name} /></td>
                  <td className="px-cell-x py-cell-y"><HubTag code={p.destinationHub?.code} name={p.destinationHub?.name} /></td>
                  <td className="whitespace-nowrap px-cell-x py-cell-y text-right"><CodAmount amount={p.codAmount} currency={p.currency} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function CreateParcelForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const hubs = useQuery({ queryKey: ["pathaopoth", "hubs"], queryFn: () => data.hubs() });
  const senders = useQuery({ queryKey: ["pathaopoth", "senders"], queryFn: () => data.senders() });

  const [f, setF] = useState({
    trackingNumber: "", senderId: "",
    receiverName: "", receiverPhone: "",
    address: "", originHubCode: "", destinationHubCode: "",
    codAmount: "", currency: "BDT"
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const hubList: Hub[] = hubs.data?.items ?? [];
  const senderList = senders.data?.items ?? [];
  const byCode = (code: string) => hubList.find((h) => h.code === code);

  const create = useMutation({
    mutationFn: async () => {
      const sender = senderList.find((s) => s.ItemId === f.senderId);
      const origin = byCode(f.originHubCode);
      const destination = byCode(f.destinationHubCode);
      const id = await data.insert("Parcel", {
        trackingNumber: f.trackingNumber.trim(),
        senderId: f.senderId,
        sender: sender
          ? { senderId: sender.ItemId, name: sender.name, phone: sender.phone ?? "", returnAddress: sender.returnAddress ?? "" }
          : undefined,
        receiverName: f.receiverName.trim(),
        receiverPhone: f.receiverPhone.trim(),
        originalDeliveryAddress: f.address.trim(),
        currentDeliveryAddress: f.address.trim(),
        originHub: origin ? { hubId: origin.ItemId, code: origin.code, name: origin.name } : undefined,
        destinationHub: destination ? { hubId: destination.ItemId, code: destination.code, name: destination.name } : undefined,
        codAmount: Number(f.codAmount || 0),
        currency: f.currency
      });
      if (!id) throw new Error("The parcel was not created.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathaopoth", "parcels"] });
      onCreated();
    }
  });

  const ready = f.trackingNumber.trim() && f.senderId && f.receiverName.trim() && f.address.trim() && f.originHubCode;

  return (
    <form
      className="mb-base rounded-md border border-hairline bg-surface p-base"
      onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
    >
      <h3 className="text-heading-md text-ink">Create a parcel</h3>
      <p className="mt-xs text-body-sm text-ink-muted">
        For a parcel that physically exists but is not on file. Everything here is recorded as
        supplied — nothing is inferred.
      </p>

      <div className="mt-base grid gap-base sm:grid-cols-2">
        <Field label="Tracking number" required>
          <input value={f.trackingNumber} onChange={set("trackingNumber")} className={`${control} font-mono`} placeholder="PP2026090004" />
        </Field>
        <Field label="Sender" required>
          <select value={f.senderId} onChange={set("senderId")} className={control}>
            <option value="">Select a sender…</option>
            {senderList.map((s) => <option key={s.ItemId} value={s.ItemId}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Receiver name" required>
          <input value={f.receiverName} onChange={set("receiverName")} className={control} />
        </Field>
        <Field label="Receiver phone">
          <input value={f.receiverPhone} onChange={set("receiverPhone")} className={control} placeholder="+8801…" />
        </Field>
        <Field label="Delivery address" required className="sm:col-span-2">
          <input value={f.address} onChange={set("address")} className={control} />
        </Field>
        <Field label="Origin hub" required>
          <select value={f.originHubCode} onChange={set("originHubCode")} className={control}>
            <option value="">Select…</option>
            {hubList.map((h) => <option key={h.ItemId} value={h.code}>{h.name} ({h.code})</option>)}
          </select>
        </Field>
        <Field label="Destination hub">
          <select value={f.destinationHubCode} onChange={set("destinationHubCode")} className={control}>
            <option value="">Not yet confirmed</option>
            {hubList.map((h) => <option key={h.ItemId} value={h.code}>{h.name} ({h.code})</option>)}
          </select>
        </Field>
        <Field label="COD amount">
          <input type="number" min="0" step="1" value={f.codAmount} onChange={set("codAmount")} className={`${control} pp-num`} placeholder="0" />
        </Field>
        <Field label="Currency">
          <select value={f.currency} onChange={set("currency")} className={control}>
            {["BDT", "USD"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {create.isError ? <p className="mt-sm text-body-sm text-breach-text">{(create.error as Error)?.message}</p> : null}

      <div className="mt-base flex items-center gap-sm">
        <button
          type="submit"
          disabled={!ready || create.isPending}
          className="h-control rounded-md bg-brand px-xl text-button text-brand-on hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-55"
        >
          {create.isPending ? "Creating…" : "Create parcel"}
        </button>
        {!ready ? <span className="text-body-sm text-ink-muted">Tracking number, sender, receiver, address and origin hub are required.</span> : null}
      </div>
    </form>
  );
}

const control = "h-control w-full rounded-md border border-hairline-strong bg-surface px-md text-body-md text-ink placeholder:text-ink-muted";

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-xs block text-label text-ink-secondary">
        {label}{required ? <span className="text-breach-text"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
