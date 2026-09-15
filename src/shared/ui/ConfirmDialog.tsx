import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Destructive actions — ownership transfer, dispatch, case close, money reversal —
 * name the specific record and the confirming button carries the verb, never "OK".
 *
 * Focus is trapped while open and restored to the trigger on close, and Escape
 * closes the topmost layer.
 */
export function ConfirmDialog({
  open, title, body, confirmLabel, tone = "primary", busy, onConfirm, onCancel
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-base">
      <div className="absolute inset-0 bg-ink/40" onClick={() => !busy && onCancel()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-[420px] rounded-lg border border-hairline bg-surface p-xl shadow-e3"
      >
        <h2 id="confirm-title" className="text-heading-md text-ink">{title}</h2>
        <div className="mt-sm text-body-md text-ink-secondary">{body}</div>
        <div className="mt-xl flex justify-end gap-sm">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-control rounded-md border border-hairline-strong bg-surface px-base text-button text-ink hover:bg-surface-hover disabled:opacity-55"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            className={`h-control rounded-md px-base text-button transition-colors duration-instant disabled:opacity-55 ${
              tone === "danger"
                ? "bg-breach-solid text-ink-inverse hover:brightness-110"
                : "bg-brand text-brand-on hover:bg-brand-hover active:bg-brand-pressed"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
