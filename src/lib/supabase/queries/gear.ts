import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GearProfileInsertSchema,
  GearProfileSchema,
  type GearProfileInsert,
  type GearProfileRow,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

export async function listGearProfiles(
  client: SupabaseClient,
): Promise<GearProfileRow[]> {
  const { data, error } = await client
    .from("gear_profiles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  assertNoError(error, "listGearProfiles");
  return (data ?? []).map((row) =>
    GearProfileSchema.parse(normalizeTimestamps(row)),
  );
}

export async function createGearProfile(
  client: SupabaseClient,
  input: GearProfileInsert,
): Promise<GearProfileRow> {
  const parsed = GearProfileInsertSchema.parse(input);
  const { data, error } = await client
    .from("gear_profiles")
    .insert(parsed)
    .select("*")
    .single();
  assertNoError(error, "createGearProfile");
  return GearProfileSchema.parse(normalizeTimestamps(data));
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
