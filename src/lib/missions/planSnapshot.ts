/**
 * Build durable plan snapshots for mission_events (Planning Complete / Start).
 */

import type { Mission, MissionTarget } from "@/lib/types";
import { targetScheduleLabel } from "@/lib/schedule/display";

export type PlanSnapshotTarget = {
  catalogId: string;
  name: string;
  roleLabel: string | null;
  sequenceIndex: number | null;
  isFallback: boolean;
  scheduleLabel: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  plannedWindowStart: string;
  plannedWindowEnd: string;
  proposedFilter: string | null;
  proposedSubLengthSeconds: number | null;
  proposedIso: number | null;
  proposedGain: number | null;
  proposedIntegrationMinutes: number | null;
  frames: number | null;
};

export type PlanSnapshotPayload = {
  reason: string;
  missionName: string;
  sessionStart: string;
  sessionEndAt: string | null;
  transitionMinutes: number | null;
  currentTargetId: string | null;
  targetCount: number;
  targets: PlanSnapshotTarget[];
};

function mapTarget(t: MissionTarget): PlanSnapshotTarget {
  return {
    catalogId: t.targetId,
    name: t.targetName,
    roleLabel: t.roleLabel ?? null,
    sequenceIndex: t.sequenceIndex ?? null,
    isFallback: !!t.isFallback,
    scheduleLabel: targetScheduleLabel(t),
    scheduledStartAt: t.scheduledStartAt ?? null,
    scheduledEndAt: t.scheduledEndAt ?? null,
    plannedWindowStart: t.plannedWindowStart,
    plannedWindowEnd: t.plannedWindowEnd,
    proposedFilter: t.proposedFilter ?? null,
    proposedSubLengthSeconds: t.proposedSubLengthSeconds ?? null,
    proposedIso: t.proposedIso ?? null,
    proposedGain: t.proposedGain ?? null,
    proposedIntegrationMinutes: t.proposedIntegrationMinutes ?? null,
    frames: t.frames ?? null,
  };
}

export function buildPlanSnapshot(
  mission: Mission,
  reason: string,
): { summary: string; payload: PlanSnapshotPayload } {
  const targets = mission.targets.map(mapTarget);
  const names = targets
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");
  const more =
    targets.length > 3 ? ` (+${targets.length - 3} more)` : "";
  const summary =
    targets.length === 0
      ? `${reason} · no targets in queue`
      : `${reason} · ${targets.length} target${targets.length === 1 ? "" : "s"}: ${names}${more}`;

  return {
    summary,
    payload: {
      reason,
      missionName: mission.name,
      sessionStart: mission.dateTime,
      sessionEndAt: mission.sessionEndAt ?? null,
      transitionMinutes: mission.transitionMinutes ?? null,
      currentTargetId: mission.currentTargetId ?? null,
      targetCount: targets.length,
      targets,
    },
  };
}
