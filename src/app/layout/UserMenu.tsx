import { useEffect, useRef, useState } from "react";
import { LogOut, UserRound, X } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useCurrentUser, userDisplayName, userInitials } from "../../features/profile/useCurrentUser";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { ROLE_LABEL, rolesOf } from "../../lib/pathaopoth/roles";

/**
 * Top-right account control: the avatar opens a panel carrying identity, the Profile
 * button and sign-out. Profile lives here rather than in the sidebar, which is
 * reserved for the operator's actual work.
 *
 * Focus is trapped while open and restored to the avatar on close; Escape closes it.
 */
export function UserMenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { logout } = useAuth();
  const { t } = useT();
  const me = useCurrentUser();
  const profile = me.data;
  const name = userDisplayName(profile) || (me.isLoading ? "Loading…" : "Guest");
  const roles = rolesOf(profile);

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  function go(path: string) {
    setOpen(false);
    onNavigate(path);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open account menu"
        className="user-menu-trigger"
      >
        <span className="avatar avatar-sm">{userInitials(profile)}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-modal flex items-start justify-end p-base pt-[64px]">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Account"
            className="relative w-full max-w-[320px] rounded-lg border border-hairline bg-surface p-base shadow-e3"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-md top-md text-ink-muted hover:text-ink"
            >
              <X size={16} aria-hidden />
            </button>

            <div className="flex items-center gap-md">
              <span className="avatar avatar-lg">{userInitials(profile)}</span>
              <div className="min-w-0">
                <p className="truncate text-heading-sm text-ink">{name}</p>
                {profile?.email ? <p className="truncate text-caption text-ink-muted">{profile.email}</p> : null}
              </div>
            </div>

            {roles.length > 0 ? (
              <div className="mt-md flex flex-wrap gap-xs">
                {roles.map((r) => (
                  <span key={r} className="rounded-pill bg-surface-sunken px-sm py-xxs text-caption text-ink-secondary">
                    {ROLE_LABEL[r]}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-base grid gap-sm border-t border-hairline pt-base">
              <button
                type="button"
                onClick={() => go("/profile")}
                className="inline-flex h-control items-center gap-sm rounded-md border border-hairline-strong bg-surface px-base text-button text-ink transition-colors duration-instant hover:bg-surface-hover"
              >
                <UserRound size={16} aria-hidden /> Profile
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); logout(); onNavigate("/login"); }}
                className="inline-flex h-control items-center gap-sm rounded-md px-base text-button text-breach-text transition-colors duration-instant hover:bg-breach-soft"
              >
                <LogOut size={16} aria-hidden /> {t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
