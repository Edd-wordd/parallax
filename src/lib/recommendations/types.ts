/**
 * Dashboard recommendation view-models built only from
 * generateDeepSkyPlan / computeSessionAstronomy + curated catalog.
 * No framing, exposure, or historical claims.
 */

import type { TargetType } from "@/lib/types";
import type { UnavailableReason } from "@/lib/sky/visibility";

export type RigFitState = "not_calculated";

export interface DashboardRecommendation {
  id: string;
  name: string;
  type: TargetType;
  /** Aggregate score 0–100 (altitude + moon only) */
  score: number;
  altitudeScore: number;
  moonSeparationScore: number;
  windowStart: Date;
  windowEnd: Date;
  windowLabel: string;
  windowDurationMinutes: number;
  narrowWindow: boolean;
  peakAltitudeDeg: number;
  peakAt: Date | null;
  peakAtLabel: string;
  minMoonSeparationDeg: number;
  maxPossibleAltitudeDeg: number;
  whyIncluded: string | null;
  constellation?: string;
  magnitude?: number;
  moonPhaseLabel: string | null;
  moonInterference: string | null;
  moonToleranceDeg: number;
  minAltitudeDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  rigFit: RigFitState;
  /** MissionTarget-ready fields */
  plannedWindowStart: string;
  plannedWindowEnd: string;
}

export interface RejectedRecommendation {
  id: string;
  name: string;
  type: TargetType;
  unavailableReason: UnavailableReason;
  reasonLabel: string;
}

export interface DashboardRecommendationsResult {
  status: "ready" | "no_site" | "invalid_session" | "no_darkness" | "empty";
  sectionTitle: string;
  dateLabel: string;
  isTonight: boolean;
  recommendations: DashboardRecommendation[];
  rejected: RejectedRecommendation[];
  emptyMessage: string | null;
  sessionStart: Date;
  sessionEnd: Date;
}
