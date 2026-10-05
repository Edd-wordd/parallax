/**
 * Dashboard recommendation view-models from generateDeepSkyPlan + optional
 * rig framing evidence. Ranking score remains altitude + Moon only.
 */

import type { TargetType } from "@/lib/types";
import type { UnavailableReason } from "@/lib/sky/visibility";
import type { RigFitState } from "@/lib/gear/framing";

export type { RigFitState };

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
  /** Qualitative FOV fit — not part of score */
  rigFit: RigFitState;
  rigFitDetail: string;
  fovWidthArcmin: number | null;
  fovHeightArcmin: number | null;
  targetSizeMajorArcmin: number | null;
  targetSizeMinorArcmin: number | null;
  targetSizeKind: string | null;
  targetSizeSource: string | null;
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

export type FramingGearForRecs = {
  focalLengthMm: number;
  sensorWidthMm: number | null | undefined;
  sensorHeightMm: number | null | undefined;
  opticsFactor?: number | null;
} | null;
