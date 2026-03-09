/**
 * Capture Run Sheet Generator (frontend-only, mock data)
 * Produces a field-ready execution plan from schedule, gear, and conditions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GearProfile {
  camera: string;
  mount: "EQ" | "Alt-Az";
  mountTrackingQuality: "good" | "fair" | "poor";
  focalLengthMm: number;
}

export interface Conditions {
  seeing: number; // 1–5
  transparency: number; // 1–5
  wind: number; // 1–5
  clouds: number; // 0–100
  moonAltDeg: number;
  bortle: number;
}

export interface TargetBlock {
  targetName: string;
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface RunSheetEvent {
  time: string; // HH:mm
  type: string;
  label: string;
}

export interface RunSheetItem {
  targetName: string;
  start: string;
  end: string;
  phase: "now" | "next" | "later";
  exposureSeconds: number;
  frames: number;
  totalTimeMinutes: number;
  ditherEvery: number;
  notes: string[];
  confidence: number;
}

export interface RunSheet {
  createdAt: string; // ISO
  summary: { now: string | null; next: string | null; later: string | null };
  items: RunSheetItem[];
  events: RunSheetEvent[];
}

export interface RunSheetInput {
  schedule: TargetBlock[];
  gear: GearProfile;
  conditions: Conditions;
  events: RunSheetEvent[];
}

// ---------------------------------------------------------------------------
// Time parsing: convert HH:mm to decimal hours (e.g. "23:30" -> 23.5)
// Times after midnight (00:00–06:00) are normalized as 24+ for duration calc
// ---------------------------------------------------------------------------
function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

/** Block duration in seconds. Handles overnight spans (e.g. 23:30–01:10). */
function blockDurationSeconds(start: string, end: string): number {
  let startH = parseTime(start);
  let endH = parseTime(end);
  if (endH < 6) endH += 24; // next day
  if (startH < 6 && endH > 12) startH += 24;
  const hours = endH - startH;
  return Math.max(0, hours * 3600);
}

// ---------------------------------------------------------------------------
// Exposure logic (mock but consistent, deterministic)
// ---------------------------------------------------------------------------
function computeExposureSeconds(conditions: Conditions, targetIndex: number): number {
  const { seeing, wind, clouds } = conditions;
  // Slight per-target variation for realism (deterministic from index)
  const drift = (targetIndex % 3) * 15;
  if (clouds > 40) return 60 + Math.min(30, drift);
  if (seeing <= 2) return 60 + 30 + Math.min(30, drift);
  if (seeing >= 3 && seeing <= 4) return 120 + 30 + Math.min(30, drift);
  if (seeing >= 5 && wind <= 2) return 180 + 30 + Math.min(30, drift);
  return 120 + 30 + Math.min(30, drift);
}

// ---------------------------------------------------------------------------
// Confidence scoring: start 0.8, subtract penalties, clamp 0.25–0.95
// ---------------------------------------------------------------------------
function computeConfidence(conditions: Conditions): number {
  let c = 0.8;
  c -= conditions.clouds / 200;
  c -= (conditions.wind - 1) * 0.05;
  if (conditions.moonAltDeg > 20) c -= 0.08;
  return Math.min(0.95, Math.max(0.25, c));
}

// ---------------------------------------------------------------------------
// Notes generation from conditions
// ---------------------------------------------------------------------------
function computeNotes(conditions: Conditions): string[] {
  const notes: string[] = [];
  if (conditions.moonAltDeg > 20) {
    notes.push("Moon may reduce contrast; prefer brighter targets or narrowband");
  }
  if (conditions.wind >= 4) {
    notes.push("Wind high; reduce exposure or pause capture");
  }
  if (conditions.clouds > 40) {
    notes.push("Cloud cover elevated; shorter subs recommended");
  }
  if (notes.length === 0) notes.push("Conditions favorable");
  return notes;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------
const OVERHEAD_SECONDS = 8; // mock: download + dither settle

export function generateRunSheet(input: RunSheetInput): RunSheet {
  const { schedule, gear, conditions, events } = input;

  // Deterministic exposure per block
  const exposureByTarget = new Map<string, number>();
  schedule.forEach((b, i) => {
    if (!exposureByTarget.has(b.targetName)) {
      exposureByTarget.set(b.targetName, Math.round(computeExposureSeconds(conditions, i)));
    }
  });

  const ditherEvery =
    gear.mountTrackingQuality === "good" ? 3 : 2;

  const now = new Date().toISOString();
  const summary = { now: null as string | null, next: null as string | null, later: null as string | null };

  const items: RunSheetItem[] = schedule.map((block, idx) => {
    const exposureSec = exposureByTarget.get(block.targetName) ?? 120;
    const durationSec = blockDurationSeconds(block.start, block.end);
    const cycleSec = exposureSec + OVERHEAD_SECONDS;
    const frames = Math.max(1, Math.floor(durationSec / cycleSec));
    const totalTimeMinutes = Math.round((frames * cycleSec) / 60);

    const phase: "now" | "next" | "later" = idx === 0 ? "now" : idx === 1 ? "next" : "later";
    if (phase === "now") summary.now = block.targetName;
    if (phase === "next") summary.next = block.targetName;
    if (phase === "later" && !summary.later) summary.later = block.targetName;

    const confidence = Math.round(computeConfidence(conditions) * 100) / 100;
    const notes = computeNotes(conditions);

    return {
      targetName: block.targetName,
      start: block.start,
      end: block.end,
      phase,
      exposureSeconds: exposureSec,
      frames,
      totalTimeMinutes,
      ditherEvery,
      notes,
      confidence,
    };
  });

  return {
    createdAt: now,
    summary,
    items,
    events,
  };
}
