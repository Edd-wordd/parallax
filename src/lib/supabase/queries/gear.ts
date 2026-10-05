import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GearProfileInsertSchema,
  GearProfileSchema,
  GearProfileUpdateSchema,
  type GearProfileInsert,
  type GearProfileRow,
  type GearProfileUpdate,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

function mapRow(row: Record<string, unknown>): GearProfileRow {
  return GearProfileSchema.parse(normalizeTimestamps(row));
}

export async function listGearProfiles(
  client: SupabaseClient,
): Promise<GearProfileRow[]> {
  const { data, error } = await client
    .from("gear_profiles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  assertNoError(error, "listGearProfiles");
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
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
  return mapRow(data as Record<string, unknown>);
}

export async function updateGearProfile(
  client: SupabaseClient,
  id: string,
  input: GearProfileUpdate,
): Promise<GearProfileRow> {
  const parsed = GearProfileUpdateSchema.parse(input);
  const { data, error } = await client
    .from("gear_profiles")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  assertNoError(error, "updateGearProfile");
  return mapRow(data as Record<string, unknown>);
}

/** Set one profile active and clear is_active on the user's other profiles. */
export async function setActiveGearProfile(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { data: rows, error: listErr } = await client
    .from("gear_profiles")
    .select("id")
    .is("deleted_at", null);
  assertNoError(listErr, "setActiveGearProfile.list");
  const ids = (rows ?? []).map((r) => r.id as string);
  if (!ids.includes(id)) {
    throw new Error("Gear profile not found");
  }
  const { error: clearErr } = await client
    .from("gear_profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("id", ids);
  assertNoError(clearErr, "setActiveGearProfile.clear");
  const { error: setErr } = await client
    .from("gear_profiles")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  assertNoError(setErr, "setActiveGearProfile.set");
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
