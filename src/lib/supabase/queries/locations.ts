import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LocationInsertSchema,
  LocationSchema,
  type LocationInsert,
  type LocationRow,
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
