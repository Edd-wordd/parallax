import type { Mission, MissionConstraint, MissionTarget, TargetType } from "@/lib/types";
import type { MissionRow, MissionTargetRow } from "@/lib/schemas";

const DEFAULT_CONSTRAINTS: MissionConstraint = {
  minAltitude: 30,
  moonTolerance: 15,
  targetTypes: ["galaxy", "nebula", "open_cluster", "globular_cluster"],
  driveToDarker: false,
  driveRadius: 50,
};

function mapTarget(row: MissionTargetRow): MissionTarget {
  return {
    targetId: row.catalog_id,
    targetName: row.target_name,
    targetType: row.target_type as TargetType,
    plannedWindowStart: row.planned_window_start ?? "",
    plannedWindowEnd: row.planned_window_end ?? "",
    score: Number(row.score) || 0,
    captured: row.captured,
    result: row.result ?? undefined,
    subLength: row.sub_length ?? undefined,
    frames: row.frames ?? undefined,
    notes: row.notes ?? undefined,
    sequenceIndex: row.sequence_index ?? undefined,
    roleLabel: row.role_label ?? undefined,
    isFallback: row.is_fallback,
    altitudeScore: row.altitude_score ?? undefined,
    moonSeparationScore: row.moon_separation_score ?? undefined,
    rigFramingScore: row.rig_framing_score ?? undefined,
    whyIncluded: row.why_included ?? undefined,
    isoGain: row.planned_iso_gain ?? undefined,
  };
}

/** Map DB mission + targets → client Mission (constraints beyond objective use defaults). */
export function mapMissionFromDb(
  row: MissionRow,
  targets: MissionTargetRow[],
): Mission {
  const ordered = [...targets].sort((a, b) => {
    const ai = a.sequence_index ?? 999;
    const bi = b.sequence_index ?? 999;
    return ai - bi;
  });

  return {
    id: row.id,
    name: row.name,
    dateTime: row.date_time,
    locationId: row.location_id,
    gearId: row.gear_id,
    missionType: row.mission_type ?? null,
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      objective: row.objective ?? undefined,
    },
    targets: ordered.map(mapTarget),
    status: row.status,
    phase: row.phase,
    currentTargetId: row.current_target_catalog_id ?? null,
    notes: row.notes ?? undefined,
    noteLog: [],
    cancelledReason: row.cancelled_reason ?? undefined,
    logLocked: row.log_locked,
    createdAt: row.created_at ?? row.date_time,
  };
}
