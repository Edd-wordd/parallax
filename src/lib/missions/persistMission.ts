import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mission } from "@/lib/types";
import {
  MissionObjectiveSchema,
  type MissionObjective,
} from "@/lib/schemas";
import {
  upsertMissionWithTargets,
  type MissionTargetWrite,
} from "@/lib/supabase/queries/missions";

function normalizeObjective(value: unknown): MissionObjective | undefined {
  const parsed = MissionObjectiveSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export async function persistMissionToDb(
  client: SupabaseClient,
  mission: Mission,
): Promise<void> {
  if (!mission.locationId || !mission.gearId) {
    throw new Error("Mission needs a location and gear profile before saving");
  }

  const targets: MissionTargetWrite[] = mission.targets.map((t, index) => ({
    catalog_id: t.targetId,
    target_name: t.targetName,
    target_type: t.targetType,
    planned_window_start: t.plannedWindowStart,
    planned_window_end: t.plannedWindowEnd,
    score: t.score,
    sequence_index: t.sequenceIndex ?? index + 1,
    role_label: t.roleLabel ?? null,
    is_fallback: t.isFallback ?? false,
    captured: t.captured ?? false,
    result: t.result ?? null,
    sub_length: t.subLength ?? null,
    frames: t.frames ?? null,
    notes: t.notes ?? null,
    planned_iso_gain: t.isoGain ?? null,
    altitude_score: t.altitudeScore ?? null,
    moon_separation_score: t.moonSeparationScore ?? null,
    rig_framing_score: t.rigFramingScore ?? null,
    why_included: t.whyIncluded ?? null,
  }));

  await upsertMissionWithTargets(
    client,
    {
      id: mission.id,
      name: mission.name,
      date_time: new Date(mission.dateTime).toISOString(),
      location_id: mission.locationId,
      gear_id: mission.gearId,
      mission_type: mission.missionType ?? undefined,
      objective: normalizeObjective(mission.constraints.objective),
      status: mission.status,
      phase: mission.phase ?? "setup",
      current_target_catalog_id: mission.currentTargetId ?? undefined,
      notes: mission.notes,
    },
    targets,
  );
}
