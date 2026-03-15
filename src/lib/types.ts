export type TargetType =
  | "galaxy"
  | "nebula"
  | "open_cluster"
  | "globular_cluster"
  | "planet"
  | "moon"
  | "planetarium";

export interface Target {
  id: string;
  name: string;
  type: TargetType;
  ra: number;
  dec: number;
  magnitude: number;
  angular_size: number; // arcminutes
  constellation: string;
  beginner?: boolean;
}

export interface ScoreComponent {
  label: string;
  value: number;
}

export interface Recommendation {
  target: Target;
  shootability_score: number;
  best_window_start: string;
  best_window_end: string;
  peak_altitude: number;
  moon_separation: number;
  difficulty: "easy" | "moderate" | "hard";
  why: string[];
  score_breakdown?: ScoreComponent[];
}

export interface GearProfile {
  id: string;
  name: string;
  telescope_name: string;
  focal_length: number; // mm
  aperture: number; // mm
  camera_name: string;
  sensor_preset: "apsc" | "full_frame" | "m43" | "1inch";
  pixel_size?: number; // microns
  mount_type: "alt-az" | "equatorial";
  guiding: boolean;
  active?: boolean;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bortle: number;
  notes?: string;
}

export interface SessionLog {
  id: string;
  date: string;
  location_id: string;
  gear_id: string;
  bortle: number;
  moon_percent: number;
  cloud_cover: number;
  seeing: number; // 1-5
  wind: number; // 0-3
  targets: SessionTarget[];
  success: boolean;
  notes?: string;
}

export interface SessionTarget {
  target_id: string;
  target_name: string;
  target_type: TargetType;
  outcome: "success" | "partial" | "failed";
  sub_length: number; // seconds
  frames: number;
  iso?: number;
  gain?: number;
}

export interface TargetTypeFilter {
  galaxy: boolean;
  nebula: boolean;
  open_cluster: boolean;
  globular_cluster: boolean;
  planet: boolean;
}

export interface PlannerBlock {
  id: string;
  target_id: string;
  target_name: string;
  start: string;
  end: string;
  score: number;
}

export type MissionStatus = "draft" | "ready" | "in_progress" | "completed" | "cancelled" | "aborted";

export interface MissionConstraint {
  minAltitude: number;
  moonTolerance: number;
  targetTypes: string[];
  driveToDarker: boolean;
  driveRadius: number;
  objective?: "wide_field_nebula" | "galaxy_hunt" | "clusters_visual" | "planetary";
}

export interface MissionTarget {
  targetId: string;
  targetName: string;
  targetType: TargetType;
  plannedWindowStart: string;
  plannedWindowEnd: string;
  score: number;
  captured?: boolean;
  result?: "success" | "partial" | "failed";
  subLength?: number;
  frames?: number;
  notes?: string;
  /** 1-based sequence order in the mission plan (e.g. 1, 2, 3) */
  sequenceIndex?: number;
  /** Role label: SEQ 1, SEQ 2, Early, Prime, Late, or Fallback when intentionally optional */
  roleLabel?: string;
  /** True only when target is explicitly optional/fallback — NOT default for non-current targets */
  isFallback?: boolean;
  /** Optional scores 1–10 for mission plan cards */
  altitudeScore?: number;
  moonSeparationScore?: number;
  rigFramingScore?: number;
  /** One-line reason target was included */
  whyIncluded?: string;
  /** ISO or gain for exposure recipe (e.g. "1600" or "120") */
  isoGain?: string;
}

export type MissionPhase =
  | "planning"
  | "setup"
  | "capturing"
  | "logging"
  | "completed";

export interface Mission {
  id: string;
  name: string;
  dateTime: string;
  locationId: string;
  gearId: string;
  constraints: MissionConstraint;
  targets: MissionTarget[];
  status: MissionStatus;
  phase?: MissionPhase;
  /** Currently focused/active target in the queue (mock) */
  currentTargetId?: string | null;
  notes?: string;
  /** Log entries appended on each input (text + timestamp) */
  noteLog?: { text: string; at: string }[];
  /** Reason logged when mission was cancelled */
  cancelledReason?: string;
  createdAt: string;
}
