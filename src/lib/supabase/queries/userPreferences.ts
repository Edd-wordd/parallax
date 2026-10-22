import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UserPreferencesSchema,
  UserPreferencesUpsertSchema,
  type UserPreferencesRow,
  type UserPreferencesUpsert,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

export async function getUserPreferences(
  client: SupabaseClient,
): Promise<UserPreferencesRow | null> {
  const { data, error } = await client
    .from("user_preferences")
    .select("*")
    .maybeSingle();
  assertNoError(error, "getUserPreferences");
  if (!data) return null;
  return UserPreferencesSchema.parse(normalizePreferencesRow(data));
}

export async function upsertUserPreferences(
  client: SupabaseClient,
  userId: string,
  input: UserPreferencesUpsert,
): Promise<UserPreferencesRow> {
  const parsed = UserPreferencesUpsertSchema.parse(input);
  const { data, error } = await client
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        ...parsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  assertNoError(error, "upsertUserPreferences");
  return UserPreferencesSchema.parse(normalizePreferencesRow(data));
}

function normalizePreferencesRow(row: Record<string, unknown>) {
  return {
    ...row,
    default_min_altitude: Number(row.default_min_altitude),
    default_moon_tolerance: Number(row.default_moon_tolerance),
    updated_at:
      row.updated_at == null ? undefined : toIso(row.updated_at),
  };
}

function toIso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}
