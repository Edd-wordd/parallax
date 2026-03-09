/**
 * Dashboard mission status - single source of truth for what appears on Mission Control.
 * Derived from mission state; frontend-only, no backend.
 */
import type { Mission } from "@/lib/types";

export type DashboardMissionStatus =
  | "NONE"
  | "PLANNING"
  | "SETUP"
  | "CAPTURING"
  | "LOGGING"
  | "COMPLETED"
  | "ABORTED"
  | "CANCELLED";

/** Derive dashboard status from mission (or null). */
export function getMissionStatus(mission: Mission | null): DashboardMissionStatus {
  if (!mission) return "NONE";
  if (mission.status === "aborted") return "ABORTED";
  if (mission.status === "cancelled") return "CANCELLED";
  const phase = mission.phase ?? (mission.status === "completed" ? "completed" : "planning");
  if (phase === "completed" || mission.status === "completed") return "COMPLETED";
  switch (phase) {
    case "planning":
      return "PLANNING";
    case "setup":
      return "SETUP";
    case "capturing":
      return "CAPTURING";
    case "logging":
      return "LOGGING";
    default:
      return "PLANNING";
  }
}

/** Whether context chips (Site, Rig, Date) should be read-only. */
export function isContextLocked(status: DashboardMissionStatus): boolean {
  return status === "CAPTURING" || status === "LOGGING";
}
