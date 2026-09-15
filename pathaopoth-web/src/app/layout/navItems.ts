import {
  BarChart3, Building2, ClipboardList, Inbox, LifeBuoy, Package, PackageSearch, PackageX, Truck
} from "lucide-react";
import type { BlocksUser } from "@seliseblocks/client";
import { hasRole, type Role } from "../../lib/pathaopoth/roles";
import type { TranslationKey } from "../../lib/i18n/dictionary";

// Navigation is filtered by role, but this is presentation only: the Data Gateway
// enforces access through row- and column-level policies, so hiding a nav item is a
// convenience, never the security boundary.
export type NavItem = {
  href: string;
  labelKey: TranslationKey;
  fallback: string;
  icon: typeof Inbox;
  roles?: Role[];   // omitted means every signed-in user
};

export const navItems: NavItem[] = [
  { href: "/", labelKey: "nav.queue", fallback: "Queue", icon: Inbox, roles: ["hub_staff", "care", "ops_manager"] },
  { href: "/scan", labelKey: "nav.scan", fallback: "Scan parcel", icon: PackageSearch, roles: ["hub_staff"] },
  { href: "/cases", labelKey: "nav.cases", fallback: "Cases", icon: ClipboardList, roles: ["hub_staff", "care", "ops_manager"] },
  { href: "/movements", labelKey: "nav.movements", fallback: "My runs", icon: Truck, roles: ["rider"] },
  { href: "/care", labelKey: "nav.care", fallback: "Care queue", icon: LifeBuoy, roles: ["care", "ops_manager"] },
  { href: "/reports", labelKey: "nav.reports", fallback: "Reports", icon: BarChart3, roles: ["ops_manager", "care"] },

  // Parcel administration. Creating a parcel is restricted to parcel_admin and the
  // Data Gateway enforces it, so these entries are hidden rather than load-bearing.
  { href: "/parcels", labelKey: "nav.parcels", fallback: "Parcels", icon: Package, roles: ["parcel_admin"] },
  { href: "/parcels/cancelled", labelKey: "nav.cancelled", fallback: "Cancelled parcels", icon: PackageX, roles: ["parcel_admin"] },
  { href: "/hubs", labelKey: "nav.hubs", fallback: "Hubs", icon: Building2, roles: ["parcel_admin"] }
];

export function navItemsFor(profile?: BlocksUser | null): NavItem[] {
  return navItems.filter((item) => !item.roles || hasRole(profile, ...item.roles));
}

/** The landing route differs by role: a rider has no queue to land on. */
export function homeRouteFor(profile?: BlocksUser | null): string {
  if (hasRole(profile, "hub_staff", "care", "ops_manager")) return "/";
  if (hasRole(profile, "rider")) return "/movements";
  if (hasRole(profile, "parcel_admin")) return "/parcels";
  return "/profile";
}
