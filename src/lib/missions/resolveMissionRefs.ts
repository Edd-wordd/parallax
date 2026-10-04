import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Mission } from "@/lib/types";
import { ensureDefaultLocationAndGear } from "@/lib/supabase/queries/bootstrap";

const UuidSchema = z.string().uuid();

export function isUuid(value: string | null | undefined): boolean {
  return UuidSchema.safeParse(value).success;
}

/**
 * Map client/mock mission refs onto DB-safe UUIDs.
 * Old localStorage missions may still use loc1/gear1 or non-UUID ids.
 */
export async function resolveMissionRefs(
  client: SupabaseClient,
  mission: Mission,
): Promise<Mission> {
  const needsDefaults =
    !isUuid(mission.locationId) || !isUuid(mission.gearId);
  const defaults = needsDefaults
    ? await ensureDefaultLocationAndGear(client)
    : null;

  return {
    ...mission,
    id: isUuid(mission.id) ? mission.id : crypto.randomUUID(),
    locationId: isUuid(mission.locationId)
      ? mission.locationId
      : defaults!.locationId,
    gearId: isUuid(mission.gearId) ? mission.gearId : defaults!.gearId,
  };
}
