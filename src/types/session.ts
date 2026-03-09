/**
 * Session History types.
 * TODO: Align with backend schema when wiring. Add userId, createdAt, etc.
 */

export type OutcomeRating = "A" | "B" | "C" | "D" | "F";

export interface SessionTargetResult {
  targetId: string;
  targetName: string;
  frames: number;
  exposure: number; // seconds
  iso?: number;
  integrationTime: number; // total minutes
  notes?: string;
}

export interface Session {
  id: string;
  missionId?: string;
  date: string;
  locationId: string;
  targetsCount: number;
  totalIntegrationMinutes: number;
  outcomeRating: OutcomeRating;
  targets: SessionTargetResult[];
  whatILearned?: string;
  startTime?: string;
  endTime?: string;
}
