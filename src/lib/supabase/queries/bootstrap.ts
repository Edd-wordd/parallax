import type { SupabaseClient } from "@supabase/supabase-js";
import { createLocation, listLocations } from "./locations";
import { createGearProfile, listGearProfiles } from "./gear";

/**
 * Ensure the signed-in user has at least one location and gear profile
 * so the mission → session slice can run without empty FKs.
 */
export async function ensureDefaultLocationAndGear(client: SupabaseClient): Promise<{
  locationId: string;
  gearId: string;
}> {
  const [locations, gear] = await Promise.all([
    listLocations(client),
    listGearProfiles(client),
  ]);

  let locationId = locations[0]?.id;
  if (!locationId) {
    const loc = await createLocation(client, {
      name: "Home site",
      lat: 37.7749,
      lon: -122.4194,
      bortle: 5,
      notes: "Created automatically for first mission",
    });
    locationId = loc.id;
  }

  let gearId = gear.find((g) => g.is_active)?.id ?? gear[0]?.id;
  if (!gearId) {
    const profile = await createGearProfile(client, {
      name: "Main Rig",
      telescope_name: "Sky-Watcher 72ED",
      focal_length: 420,
      aperture: 72,
      camera_name: "ZWO ASI533MC",
      sensor_preset: "1inch",
      pixel_size: 3.76,
      mount_type: "equatorial",
      guiding: true,
      is_active: true,
    });
    gearId = profile.id;
  }

  return { locationId, gearId };
}
