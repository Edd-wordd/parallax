/**
 * Mission phase transitions and labels.
 * TODO: Wire phase changes to backend when available.
 */

export type MissionPhase =
  | "planning"
  | "setup"
  | "capturing"
  | "logging"
  | "completed";

export const PHASE_LABELS: Record<MissionPhase, string> = {
  planning: "Planning",
  setup: "Setup",
  capturing: "Capturing",
  logging: "Logging",
  completed: "Completed",
};

export const PHASE_ORDER: MissionPhase[] = [
  "planning",
  "setup",
  "capturing",
  "logging",
  "completed",
];

export function getPhaseIndex(phase: MissionPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

export function getNextPhase(phase: MissionPhase): MissionPhase | null {
  const i = getPhaseIndex(phase);
  return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null;
}

export function phaseFromStatus(status: string): MissionPhase {
  switch (status) {
    case "draft":
    case "ready":
      return "planning";
    case "in_progress":
      return "capturing";
    case "completed":
    case "cancelled":
    case "aborted":
      return "completed";
    default:
      return "planning";
  }
}
