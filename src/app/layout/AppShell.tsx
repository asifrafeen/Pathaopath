import { PackageCheck, PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { homeRouteFor, navItemsFor } from "./navItems";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { useT } from "../../lib/i18n/LocalizationProvider";
import type { TranslationKey } from "../../lib/i18n/dictionary";
import { useCurrentUser } from "../../features/profile/useCurrentUser";
import { densityFor, rolesOf, ROLE_LABEL } from "../../lib/pathaopoth/roles";

const COLLAPSED_KEY = "pathaopoth:sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 880px)";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

export function AppShell({ activePath, children, onNavigate }: { activePath: string; children: ReactNode; onNavigate: (path: string) => void }) {
  const isMobile = useIsMobile();
  const [collapsedPref, setCollapsedPref] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "true");
  const { t } = useT();
  const { data: profile } = useCurrentUser();

  // Below md the sidebar is always the icon rail — no overlay drawer, no scrim, and
  // no dead-end state where nothing on screen brings navigation back.
  const collapsed = collapsedPref || isMobile;
  const items = navItemsFor(profile);
  const activeItem = items.find((item) => item.href === activePath);
  const roles = rolesOf(profile);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsedPref));
  }, [collapsedPref]);

  // Field mode is role AND viewport together, never viewport alone.
  useEffect(() => {
    const density = densityFor(profile, isMobile);
    document.documentElement.setAttribute("data-density", density);
  }, [profile, isMobile]);

  const label = (key: TranslationKey, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <div className="shell">
      <aside className={collapsed ? "collapsed" : ""}>
        <div className="sidebar-header">
          {collapsed ? null : (
            <a
              className="brand"
              href={homeRouteFor(profile)}
              onClick={(event) => { event.preventDefault(); onNavigate(homeRouteFor(profile)); }}
            >
              <span className="brand-mark"><PackageCheck size={16} /></span>
              <span>PathaoPoth</span>
            </a>
          )}
          <button
            className="icon-button sidebar-collapse-toggle"
            onClick={() => setCollapsedPref((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={16} />
          </button>
        </div>

        <nav aria-label="Main">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-tooltip={label(item.labelKey, item.fallback)}
              className={activePath === item.href ? "active" : ""}
              aria-current={activePath === item.href ? "page" : undefined}
              onClick={(event) => { event.preventDefault(); onNavigate(item.href); }}
            >
              <item.icon size={18} />
              {collapsed ? null : <span>{label(item.labelKey, item.fallback)}</span>}
            </a>
          ))}
        </nav>

        {/* Which hat the operator is wearing drives what they can see, so it is
            stated rather than left to be inferred from which nav items appear. */}
        {collapsed || roles.length === 0 ? null : (
          <div className="sidebar-footer">
            <span className="text-overline uppercase text-ink-muted">Signed in as</span>
            <span className="text-body-sm text-ink-secondary">
              {roles.map((r) => ROLE_LABEL[r]).join(" · ")}
            </span>
          </div>
        )}
      </aside>

      <div className="content">
        <header className="topbar">
          {activeItem ? (
            <div className="breadcrumb">
              <activeItem.icon size={16} />
              <span>{label(activeItem.labelKey, activeItem.fallback)}</span>
            </div>
          ) : null}
          <div className="topbar-spacer" />
          <LanguageSwitcher />
          <NotificationsMenu />
          <UserMenu onNavigate={onNavigate} />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
