// Role model for PathaoPoth.
//
// IAM returns roles as a map of organizationId -> role slugs, because a person can
// hold different roles in different hubs. The app mostly wants "does this user hold
// role X anywhere", so flatten for gating and keep the map for hub context.
//
// Gating here is presentation only. The Data Gateway enforces the real rules through
// row- and column-level policies, and a user who defeats this UI still cannot read a
// row the gateway will not serve.
import type { BlocksUser } from "@seliseblocks/client";

export type Role = "hub_staff" | "rider" | "care" | "ops_manager";

export const ROLE_LABEL: Record<Role, string> = {
  hub_staff: "Hub staff",
  rider: "Rider",
  care: "Care agent",
  ops_manager: "Ops manager"
};

type RoleMap = Record<string, string[]>;

function roleMapOf(profile?: BlocksUser | null): RoleMap {
  const raw = (profile as unknown as { roles?: unknown })?.roles;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as RoleMap;
}

/** Every role the user holds, in any organization. */
export function rolesOf(profile?: BlocksUser | null): Role[] {
  const seen = new Set<string>();
  for (const list of Object.values(roleMapOf(profile))) {
    for (const slug of list ?? []) seen.add(slug);
  }
  return [...seen].filter((s): s is Role => s in ROLE_LABEL);
}

/** The organizations the user is a member of — their hubs. */
export function orgIdsOf(profile?: BlocksUser | null): string[] {
  return Object.keys(roleMapOf(profile)).filter((id) => id && id !== "default");
}

export function hasRole(profile: BlocksUser | null | undefined, ...roles: Role[]): boolean {
  const held = rolesOf(profile);
  return roles.some((r) => held.includes(r));
}

/** Care and ops read across every hub; hub staff and riders are scoped down. */
export function isCrossHub(profile?: BlocksUser | null): boolean {
  return hasRole(profile, "care", "ops_manager");
}

/**
 * Field mode is chosen by role AND viewport together, never viewport alone —
 * a care agent on a tablet still gets the desk console.
 */
export function densityFor(profile: BlocksUser | null | undefined, isNarrow: boolean): "comfortable" | "field" {
  const held = rolesOf(profile);
  const riderOnly = held.length > 0 && held.every((r) => r === "rider");
  return riderOnly && isNarrow ? "field" : "comfortable";
}
