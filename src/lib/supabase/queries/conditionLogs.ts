import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ConditionLogInsertSchema,
  ConditionLogSchema,
  type ConditionLogInsert,
  type ConditionLogRow,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

export type ManualFieldReadingPayload = {
  seeing: number;
  transparency: number;
  cloudsPct: number;
  wind: "low" | "med" | "high";
  moonGlare: boolean;
  notes?: string;
  /** When set, this stamp corrects a prior field_reading event (append-only). */
  correctsEventId?: string;
};

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

export async function listConditionLogsForMission(
  client: SupabaseClient,
  missionId: string,
): Promise<ConditionLogRow[]> {
  const { data, error } = await client
    .from("condition_logs")
    .select("*")
    .eq("mission_id", missionId)
    .order("recorded_at", { ascending: true });
  assertNoError(error, "listConditionLogsForMission");
  return (data ?? []).map((row) =>
    ConditionLogSchema.parse(normalize(row as Record<string, unknown>)),
  );
}

export async function insertConditionLog(
  client: SupabaseClient,
  input: ConditionLogInsert,
): Promise<ConditionLogRow> {
  const parsed = ConditionLogInsertSchema.parse(input);
  const { data, error } = await client
    .from("condition_logs")
    .insert({
      mission_id: parsed.mission_id ?? null,
      session_id: parsed.session_id ?? null,
      recorded_at: parsed.recorded_at,
      source: parsed.source,
      event_type: parsed.event_type ?? null,
      payload: parsed.payload ?? {},
    })
    .select("*")
    .single();
  assertNoError(error, "insertConditionLog");
  return ConditionLogSchema.parse(normalize(data as Record<string, unknown>));
}

export async function insertManualFieldReading(
  client: SupabaseClient,
  missionId: string,
  reading: ManualFieldReadingPayload,
  recordedAt: Date = new Date(),
): Promise<ConditionLogRow> {
  return insertConditionLog(client, {
    mission_id: missionId,
    recorded_at: recordedAt.toISOString(),
    source: "manual",
    payload: {
      seeing: reading.seeing,
      transparency: reading.transparency,
      cloudsPct: reading.cloudsPct,
      wind: reading.wind,
      moonGlare: reading.moonGlare,
      notes: reading.notes ?? "",
    },
  });
}

/** Attach session_id to all condition logs for a mission that lack one. */
export async function attachConditionLogsToSession(
  client: SupabaseClient,
  missionId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await client
    .from("condition_logs")
    .update({ session_id: sessionId })
    .eq("mission_id", missionId)
    .is("session_id", null);
  assertNoError(error, "attachConditionLogsToSession");
}

export function latestManualReading(
  logs: ConditionLogRow[],
): ConditionLogRow | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const row = logs[i]!;
    if (row.source === "manual") return row;
  }
  return null;
}
