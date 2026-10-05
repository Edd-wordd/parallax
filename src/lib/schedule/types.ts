/**
 * Night schedule view-models — imaging duration is total on-target time,
 * not an exposure recipe.
 */

export const DEFAULT_IMAGING_MINUTES = 90;
export const DEFAULT_TRANSITION_MINUTES = 15;
export const MIN_TRANSITION_MINUTES = 5;
export const MAX_TRANSITION_MINUTES = 45;

export type ScheduleTargetInput = {
  catalogId: string;
  name: string;
  /** Usable imaging window (already clipped to session ∩ dark ∩ altitude ∩ moon) */
  usableStart: Date;
  usableEnd: Date;
  desiredMinutes: number;
  /** Optional score for auto-propose ordering / tie-break */
  score?: number;
};

export type ScheduledSegment = {
  catalogId: string;
  name: string;
  start: Date;
  end: Date;
  imagingMinutes: number;
  label: string;
};

export type ScheduleConflict = {
  catalogId: string;
  name: string;
  reason: string;
  /** Suggested durations (minutes) that would fit if user accepts — never auto-applied */
  suggestedMaxMinutes?: number;
};

export type NightScheduleResult = {
  ok: boolean;
  segments: ScheduledSegment[];
  conflicts: ScheduleConflict[];
  transitionMinutes: number;
  sessionStart: Date;
  sessionEnd: Date;
  unusedMinutes: number;
  /** Human summary when proposing a smaller set */
  proposalNote: string | null;
};
