import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MissionEventInsertSchema,
  MissionEventSchema,
  type MissionEventInsert,
  type MissionEventRow,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

function normalize(row: Record<string, unknown>) {
  return {
    ...row,
    recorded_at: toIso(row.recorded_at),
    created_at: toIso(row.created_at),
    payload:
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {},
  };
}

function toIso(value: unknown): string {
  if (typeof value === "string") return new Date(value).toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export async function listMissionEvents(
  client: SupabaseClient,
  missionId: string,
): Promise<MissionEventRow[]> {
  const { data, error } = await client
    .from("mission_events")
    .select("*")
    .eq("mission_id", missionId)
    .order("recorded_at", { ascending: true });
  assertNoError(error, "listMissionEvents");
  return (data ?? []).map((row) =>
    MissionEventSchema.parse(normalize(row as Record<string, unknown>)),
  );
}

export async function listMissionEventsForSession(
  client: SupabaseClient,
  sessionId: string,
): Promise<MissionEventRow[]> {
  const { data, error } = await client
    .from("mission_events")
    .select("*")
    .eq("session_id", sessionId)
    .order("recorded_at", { ascending: true });
  assertNoError(error, "listMissionEventsForSession");
  return (data ?? []).map((row) =>
    MissionEventSchema.parse(normalize(row as Record<string, unknown>)),
  );
}

/**
 * Append an event. If client_event_id collides, returns the existing row
 * (idempotent retry).
 */
export async function appendMissionEvent(
  client: SupabaseClient,
  input: MissionEventInsert,
): Promise<MissionEventRow> {
  const parsed = MissionEventInsertSchema.parse(input);
  const { data, error } = await client
    .from("mission_events")
    .insert({
      mission_id: parsed.mission_id,
      session_id: parsed.session_id ?? null,
      recorded_at: parsed.recorded_at,
      kind: parsed.kind,
      source: parsed.source,
      catalog_id: parsed.catalog_id ?? null,
      summary: parsed.summary,
      payload: parsed.payload ?? {},
      corrects_event_id: parsed.corrects_event_id ?? null,
      client_event_id: parsed.client_event_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // Unique violation on client_event_id → fetch existing
    if (
      parsed.client_event_id &&
      (error.code === "23505" || /duplicate|unique/i.test(error.message))
    ) {
      const { data: existing, error: fetchErr } = await client
        .from("mission_events")
        .select("*")
        .eq("client_event_id", parsed.client_event_id)
        .maybeSingle();
      assertNoError(fetchErr, "appendMissionEvent.idempotentFetch");
      if (existing) {
        return MissionEventSchema.parse(
          normalize(existing as Record<string, unknown>),
        );
      }
    }
    assertNoError(error, "appendMissionEvent");
  }

  return MissionEventSchema.parse(normalize(data as Record<string, unknown>));
}

export async function attachMissionEventsToSession(
  client: SupabaseClient,
  missionId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await client
    .from("mission_events")
    .update({ session_id: sessionId })
    .eq("mission_id", missionId)
    .is("session_id", null);
  assertNoError(error, "attachMissionEventsToSession");
}
