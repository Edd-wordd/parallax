import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LocationInsertSchema,
  LocationSchema,
  LocationUpdateSchema,
  type LocationInsert,
  type LocationRow,
  type LocationUpdate,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

export async function listLocations(
  client: SupabaseClient,
): Promise<LocationRow[]> {
  const { data, error } = await client
    .from("locations")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  assertNoError(error, "listLocations");
  return (data ?? []).map((row) => LocationSchema.parse(normalizeTimestamps(row)));
}

export async function createLocation(
  client: SupabaseClient,
  input: LocationInsert,
): Promise<LocationRow> {
  const parsed = LocationInsertSchema.parse(input);
  const { data, error } = await client
    .from("locations")
    .insert(parsed)
    .select("*")
    .single();
  assertNoError(error, "createLocation");
  return LocationSchema.parse(normalizeTimestamps(data));
}

export async function updateLocation(
  client: SupabaseClient,
  id: string,
  input: LocationUpdate,
): Promise<LocationRow> {
  const parsed = LocationUpdateSchema.parse(input);
  const { data, error } = await client
    .from("locations")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();
  assertNoError(error, "updateLocation");
  return LocationSchema.parse(normalizeTimestamps(data));
}

/** Soft-delete when not referenced by missions or sessions. */
export async function softDeleteLocationIfUnused(
  client: SupabaseClient,
  id: string,
): Promise<{ deleted: boolean; reason?: string }> {
  const refs = await countLocationRefs(client, id);
  if (refs > 0) {
    return {
      deleted: false,
      reason: "In use — edit this site or create a new one",
    };
  }
  const { error } = await client
    .from("locations")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);
  assertNoError(error, "softDeleteLocationIfUnused");
  return { deleted: true };
}

export async function countLocationRefs(
  client: SupabaseClient,
  locationId: string,
): Promise<number> {
  const [
    { count: missionCount, error: mErr },
    { count: sessionCount, error: sErr },
  ] = await Promise.all([
    client
      .from("missions")
      .select("id", { count: "exact", head: true })
      .eq("location_id", locationId)
      .is("deleted_at", null),
    client
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("location_id", locationId)
      .is("deleted_at", null),
  ]);
  assertNoError(mErr, "countLocationRefs.missions");
  assertNoError(sErr, "countLocationRefs.sessions");
  return (missionCount ?? 0) + (sessionCount ?? 0);
}

function normalizeTimestamps(row: Record<string, unknown>) {
  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    deleted_at: row.deleted_at == null ? null : toIso(row.deleted_at),
  };
}

function toIso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}
