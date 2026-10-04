import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MissionInsertSchema,
  MissionSchema,
  MissionTargetSchema,
  type MissionInsert,
  type MissionRow,
  type MissionTargetRow,
} from "@/lib/schemas";
import { assertNoError } from "../errors";

export type MissionTargetWrite = {
  catalog_id: string;
  target_name: string;
  target_type: string;
  planned_window_start?: string | null;
  planned_window_end?: string | null;
  score: number;
  sequence_index?: number | null;
  role_label?: string | null;
  is_fallback?: boolean;
  captured?: boolean;
  result?: "success" | "partial" | "failed" | null;
  sub_length?: number | null;
  frames?: number | null;
  notes?: string | null;
  planned_iso_gain?: string | null;
  altitude_score?: number | null;
  moon_separation_score?: number | null;
  rig_framing_score?: number | null;
  why_included?: string | null;
};

/** Persist mission + replace targets. Call when entering Setup or later. */
export async function upsertMissionWithTargets(
  client: SupabaseClient,
  mission: MissionInsert & { id?: string },
  targets: MissionTargetWrite[],
): Promise<{ mission: MissionRow; targets: MissionTargetRow[] }> {
  const parsedMission = MissionInsertSchema.parse(mission);
  const id = mission.id;

  let missionRow: Record<string, unknown>;
  if (id) {
    const { data, error } = await client
      .from("missions")
      .upsert({ id, ...parsedMission }, { onConflict: "id" })
      .select("*")
      .single();
    assertNoError(error, "upsertMission");
    missionRow = data as Record<string, unknown>;
  } else {
    const { data, error } = await client
      .from("missions")
      .insert(parsedMission)
      .select("*")
      .single();
    assertNoError(error, "insertMission");
    missionRow = data as Record<string, unknown>;
  }

  const missionId = String(missionRow.id);

  const { error: delError } = await client
    .from("mission_targets")
    .delete()
    .eq("mission_id", missionId);
  assertNoError(delError, "replaceMissionTargets.delete");

  let targetRows: MissionTargetRow[] = [];
  if (targets.length > 0) {
    const { data, error } = await client
      .from("mission_targets")
      .insert(
        targets.map((t) => ({
          mission_id: missionId,
          catalog_id: t.catalog_id,
          target_name: t.target_name,
          target_type: t.target_type,
          planned_window_start: t.planned_window_start ?? null,
          planned_window_end: t.planned_window_end ?? null,
          score: t.score,
          sequence_index: t.sequence_index ?? null,
          role_label: t.role_label ?? null,
          is_fallback: t.is_fallback ?? false,
          captured: t.captured ?? false,
          result: t.result ?? null,
          sub_length: t.sub_length ?? null,
          frames: t.frames ?? null,
          notes: t.notes ?? null,
          planned_iso_gain: t.planned_iso_gain ?? null,
          altitude_score: t.altitude_score ?? null,
          moon_separation_score: t.moon_separation_score ?? null,
          rig_framing_score: t.rig_framing_score ?? null,
          why_included: t.why_included ?? null,
        })),
      )
      .select("*");
    assertNoError(error, "replaceMissionTargets.insert");
    targetRows = (data ?? []).map((row) =>
      MissionTargetSchema.parse(normalizeTimestamps(row)),
    );
  }

  return {
    mission: MissionSchema.parse(normalizeTimestamps(missionRow)),
    targets: targetRows,
  };
}

export async function updateMissionPhase(
  client: SupabaseClient,
  missionId: string,
  patch: Partial<{
    status: string;
    phase: string;
    log_locked: boolean;
    notes: string | null;
    cancelled_reason: string | null;
    current_target_catalog_id: string | null;
  }>,
): Promise<void> {
  const { error } = await client
    .from("missions")
    .update(patch)
    .eq("id", missionId);
  assertNoError(error, "updateMissionPhase");
}

function normalizeTimestamps(row: Record<string, unknown>) {
  return {
    ...row,
    date_time: row.date_time != null ? toIso(row.date_time) : undefined,
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
