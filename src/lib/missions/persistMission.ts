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
import { resolveMissionRefs } from "./resolveMissionRefs";

function normalizeObjective(value: unknown): MissionObjective | undefined {
  const parsed = MissionObjectiveSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/** Persist mission; returns the DB-safe mission (UUIDs remapped if needed). */
export async function persistMissionToDb(
  client: SupabaseClient,
  mission: Mission,
): Promise<Mission> {
  const resolved = await resolveMissionRefs(client, mission);
  if (!resolved.locationId || !resolved.gearId) {
    throw new Error("Mission needs a location and gear profile before saving");
  }

  const targets: MissionTargetWrite[] = resolved.targets.map((t, index) => ({
    catalog_id: t.targetId,
    target_name: t.targetName,
    target_type: t.targetType,
    planned_window_start: t.plannedWindowStart,
    planned_window_end: t.plannedWindowEnd,
    scheduled_start_at: t.scheduledStartAt ?? null,
    scheduled_end_at: t.scheduledEndAt ?? null,
    planned_imaging_minutes: t.plannedImagingMinutes ?? null,
    actual_start_at: t.actualStartAt ?? null,
    actual_end_at: t.actualEndAt ?? null,
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
    proposed_filter: t.proposedFilter ?? null,
    proposed_sub_length_seconds: t.proposedSubLengthSeconds ?? null,
    proposed_iso: t.proposedIso ?? null,
    proposed_gain: t.proposedGain ?? null,
    proposed_integration_minutes: t.proposedIntegrationMinutes ?? null,
    altitude_score: t.altitudeScore ?? null,
    moon_separation_score: t.moonSeparationScore ?? null,
    rig_framing_score: t.rigFramingScore ?? null,
    why_included: t.whyIncluded ?? null,
  }));

  await upsertMissionWithTargets(
    client,
    {
      id: resolved.id,
      name: resolved.name,
      date_time: new Date(resolved.dateTime).toISOString(),
      session_end_at: new Date(
        resolved.sessionEndAt ??
          new Date(resolved.dateTime).getTime() + 6 * 3_600_000,
      ).toISOString(),
      location_id: resolved.locationId,
      gear_id: resolved.gearId,
      mission_type: resolved.missionType ?? undefined,
      objective: normalizeObjective(resolved.constraints.objective),
      status: resolved.status,
      phase: resolved.phase ?? "setup",
      current_target_catalog_id: resolved.currentTargetId ?? undefined,
      notes: resolved.notes,
      transition_minutes: resolved.transitionMinutes ?? null,
      log_locked: resolved.logLocked ?? false,
    },
    targets,
  );

  return resolved;
}
