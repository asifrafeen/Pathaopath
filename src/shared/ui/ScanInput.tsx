import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";

/**
 * The single most-used control in a hub.
 *
 * Per pathaopoth.design.md: owns focus on mount, re-takes focus after every
 * successful scan, 56px tall with 18px mono text, and accepts a barcode-wedge
 * keystroke burst ending in Enter. Nothing may steal its focus — including a toast
 * confirming the previous scan — so the refocus runs on every completed submit and
 * again whenever the surrounding page stops being busy.
 */
export function ScanInput({
  onScan, busy, placeholder = "Scan or type a tracking number"
}: {
  onScan: (value: string) => void;
  busy?: boolean;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => { inputRef.current?.focus(); }, []);
  // Focus returns the moment the page is no longer working, so an operator can scan
  // the next parcel without reaching for the mouse.
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-sm">
      <div className="relative flex-1">
        <ScanLine
          size={18}
          aria-hidden
          className="pointer-events-none absolute left-base top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // A barcode wedge types fast and ends with Enter; treat that identically
            // to a human pressing Enter.
            if (e.key === "Enter") { e.preventDefault(); submit(); }
            if (e.key === "Escape") setValue("");
          }}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-label="Tracking number"
          placeholder={placeholder}
          disabled={busy}
          className="h-[56px] w-full rounded-md border border-hairline-strong bg-surface pl-[44px] pr-base font-mono text-[18px] text-ink placeholder:font-sans placeholder:text-[14px] placeholder:text-ink-muted disabled:opacity-55"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={busy || !value.trim()}
        aria-busy={busy || undefined}
        className="h-[56px] shrink-0 rounded-md bg-brand px-xl text-button text-brand-on transition-colors duration-instant hover:bg-brand-hover active:bg-brand-pressed disabled:cursor-not-allowed disabled:opacity-55"
      >
        {busy ? "Looking up…" : "Look up"}
      </button>
    </div>
  );
}
