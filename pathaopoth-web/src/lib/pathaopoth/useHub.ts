import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "../../features/profile/useCurrentUser";
import { data, type Hub } from "./data";
import { orgIdsOf } from "./roles";

/**
 * Resolves the signed-in operator's hub.
 *
 * A hub is two things kept in step: a Blocks Organization (which supplies the
 * organization_id token claim the row policies match on) and a Hub record holding
 * code, address, service areas and connections. IAM gives us the organization id;
 * this maps it to the operational record.
 */
export function useHubs() {
  return useQuery({
    queryKey: ["pathaopoth", "hubs"],
    queryFn: () => data.hubs(),
    staleTime: 5 * 60_000
  });
}

export function useCurrentHub(): { hub: Hub | null; hubs: Hub[]; isLoading: boolean } {
  const { data: profile } = useCurrentUser();
  const { data: hubPage, isLoading } = useHubs();
  const hubs = hubPage?.items ?? [];
  const orgIds = orgIdsOf(profile);
  const hub = hubs.find((h) => h.organizationId && orgIds.includes(h.organizationId)) ?? null;
  return { hub, hubs, isLoading };
}
