import { useEffect, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { RedirectIfAuthenticated, RequireAuth } from "./guards";
import { CallbackPage } from "../../features/auth/CallbackPage";
import { ErrorPage } from "../../features/auth/ErrorPage";
import { LoginPage } from "../../features/auth/LoginPage";
import { NotFoundPage } from "../../features/auth/NotFoundPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { QueuePage } from "../../features/cases/QueuePage";
import { CaseDetailPage } from "../../features/cases/CaseDetailPage";
import { ScanPage } from "../../features/scan/ScanPage";
import { MovementsPage } from "../../features/movements/MovementsPage";
import { CareQueuePage } from "../../features/care/CareQueuePage";
import { ReportsPage } from "../../features/reports/ReportsPage";
import { SenderTrackPage } from "../../features/sender/SenderTrackPage";
import { ParcelsPage } from "../../features/parcels/ParcelsPage";
import { CancelledParcelsPage } from "../../features/parcels/CancelledParcelsPage";
import { HubsPage } from "../../features/hubs/HubsPage";

type Navigate = (path: string) => void;

// Static routes render directly; anything parameterised is matched below.
const staticRoutes: Record<string, (nav: Navigate) => JSX.Element> = {
  "/": (nav) => <QueuePage onNavigate={nav} />,
  "/scan": (nav) => <ScanPage onNavigate={nav} />,
  "/cases": (nav) => <QueuePage onNavigate={nav} />,
  "/movements": () => <MovementsPage />,
  "/care": (nav) => <CareQueuePage onNavigate={nav} />,
  "/reports": () => <ReportsPage />,
  "/parcels": () => <ParcelsPage />,
  "/parcels/cancelled": (nav) => <CancelledParcelsPage onNavigate={nav} />,
  "/hubs": () => <HubsPage />,
  "/profile": () => <ProfilePage />,
  "/error": () => <ErrorPage />
};

export function AppRouter() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    const [nextPathname = "/", queryString = ""] = nextPath.split("?");
    window.history.pushState({}, "", nextPath);
    setPath(nextPathname);
    setSearch(queryString ? `?${queryString}` : "");
  }

  // The sender link is the one unauthenticated surface in the product, so it is
  // matched before the auth guards and renders outside the app shell.
  const trackMatch = /^\/t\/([^/]+)$/.exec(path);
  if (trackMatch) {
    return <SenderTrackPage token={trackMatch[1]!} />;
  }

  if (path === "/login/callback") {
    return <CallbackPage onNavigate={navigate} />;
  }

  if (path === "/login") {
    const returnTo = new URLSearchParams(search).get("returnTo") || undefined;
    return (
      <RedirectIfAuthenticated onNavigate={navigate}>
        <LoginPage returnTo={returnTo} />
      </RedirectIfAuthenticated>
    );
  }

  const caseMatch = /^\/cases\/([^/]+)$/.exec(path);
  const render = staticRoutes[path];

  if (!render && !caseMatch) {
    return <NotFoundPage onNavigate={navigate} />;
  }

  return (
    <RequireAuth currentPath={path} onNavigate={navigate}>
      <AppShell activePath={caseMatch ? "/cases" : path} onNavigate={navigate}>
        {caseMatch ? <CaseDetailPage caseId={caseMatch[1]!} onNavigate={navigate} /> : render!(navigate)}
      </AppShell>
    </RequireAuth>
  );
}
