import type { SupabaseClient } from "@supabase/supabase-js";
import { createLocation, listLocations } from "./locations";
import { createGearProfile, listGearProfiles } from "./gear";

let inFlight: Promise<{ locationId: string; gearId: string }> | null = null;

/**
 * Ensure the signed-in user has at least one location and gear profile
 * so the mission → session slice can run without empty FKs.
 * Single-flight + re-list before insert to avoid duplicate placeholder sites.
 */
export async function ensureDefaultLocationAndGear(
  client: SupabaseClient,
): Promise<{
  locationId: string;
  gearId: string;
}> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      return await ensureOnce(client);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

async function ensureOnce(client: SupabaseClient): Promise<{
  locationId: string;
  gearId: string;
}> {
  let locations = await listLocations(client);
  let gear = await listGearProfiles(client);

  let locationId = locations[0]?.id;
  if (!locationId) {
    locations = await listLocations(client);
    locationId = locations[0]?.id;
  }
  if (!locationId) {
    const loc = await createLocation(client, {
      name: "My observing site",
      lat: 37.7749,
      lon: -122.4194,
      bortle: 5,
      notes:
        "Auto-created placeholder — edit coordinates and Bortle before planning. GPS does not set Bortle.",
    });
    locationId = loc.id;
  }

  let gearId = gear.find((g) => g.is_active)?.id ?? gear[0]?.id;
  if (!gearId) {
    gear = await listGearProfiles(client);
    gearId = gear.find((g) => g.is_active)?.id ?? gear[0]?.id;
  }
  if (!gearId) {
    const profile = await createGearProfile(client, {
      name: "Main Rig",
      telescope_name: "Sky-Watcher 72ED",
      focal_length: 420,
      aperture: 72,
      camera_name: "ZWO ASI533MC",
      sensor_preset: "1inch",
      sensor_width_mm: 11.31,
      sensor_height_mm: 11.31,
      pixel_size: 3.76,
      mount_type: "equatorial",
      guiding: true,
      is_active: true,
    });
    gearId = profile.id;
  }

  return { locationId, gearId };
}
