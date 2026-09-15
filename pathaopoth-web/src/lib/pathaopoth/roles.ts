// Role model for PathaoPoth.
//
// Two shapes exist for the same idea, and mixing them up silently empties every role
// check:
//   - `iam.me()` returns the signed-in user with `roles` as a FLAT array of slugs and
//     `organizationId` as a single string. This is what the app uses.
//   - `iam.users.list()` returns `roles` as a MAP of organizationId -> slugs, because
//     an administrator can see a person's roles across several organizations.
//
// `rolesOf` accepts either, so a profile from a user list still works.
//
// Gating here is presentation only. The Data Gateway enforces the real rules through
// row- and column-level policies, and a user who defeats this UI still cannot read a
// row the gateway will not serve.
import type { BlocksUser } from "@seliseblocks/client";

export type Role = "hub_staff" | "rider" | "care" | "ops_manager" | "parcel_admin";

export const ROLE_LABEL: Record<Role, string> = {
  hub_staff: "Hub staff",
  rider: "Rider",
  care: "Care agent",
  ops_manager: "Ops manager",
  parcel_admin: "Parcel admin"
};

type Profileish = (BlocksUser & { roles?: unknown; organizationId?: unknown }) | null | undefined;

/** Every role the user holds, from either response shape. */
export function rolesOf(profile: Profileish): Role[] {
  const raw = profile?.roles;
  const slugs: string[] = Array.isArray(raw)
    ? raw.map(String)
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, string[]>).flatMap((list) => list ?? [])
      : [];
  return [...new Set(slugs)].filter((s): s is Role => s in ROLE_LABEL);
}

/**
 * The organization the signed-in user belongs to — their hub.
 * "default" means they are not attached to a hub; care and ops sit there.
 */
export function orgIdOf(profile: Profileish): string | null {
  const org = profile?.organizationId;
  if (typeof org !== "string" || !org || org === "default") return null;
  return org;
}

export function hasRole(profile: Profileish, ...roles: Role[]): boolean {
  const held = rolesOf(profile);
  return roles.some((r) => held.includes(r));
}

/** Care and ops read across every hub; hub staff and riders are scoped down. */
export function isCrossHub(profile: Profileish): boolean {
  return hasRole(profile, "care", "ops_manager");
}

/**
 * Field mode is chosen by role AND viewport together, never viewport alone —
 * a care agent on a tablet still gets the desk console.
 */
export function densityFor(profile: Profileish, isNarrow: boolean): "comfortable" | "field" {
  const held = rolesOf(profile);
  const riderOnly = held.length > 0 && held.every((r) => r === "rider");
  return riderOnly && isNarrow ? "field" : "comfortable";
}
