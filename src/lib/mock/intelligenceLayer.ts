/**
 * Mock data for the intelligence layer — recommendations, rejections, adaptation insights,
 * setup impact, and tonight summary. Replace with real API data when backend is wired.
 */

export interface ScoreFactors {
  altitude: number;
  moon: number;
  framing: number;
  sessionFit: number;
}

export interface ExposureRecipe {
  subLength: number;
  iso: number;
  plannedSubs: number;
}

// Modify: peakAltitude is now an object with altitude and time
export interface RecommendedTarget {
  id: string;
  name: string;
  type: string;
  score: number;
  window: string;
  badge: "Best Match" | "Good Framing" | "Narrow Window";
  explanation: string;
  factors: ScoreFactors;
  chosenReasons: string[];
  peakAltitude: { altitude: number; time: string };
  moonSeparation: number;
  targetSize: number;
  exposureRecipe: ExposureRecipe;
}

export interface RejectedTarget {
  id: string;
  name: string;
  status: "Rejected";
  label: "Too Low" | "Poor Framing" | "Moon Conflict" | "Narrow Window";
  score: number;
  explanation: string;
  rejectedReasons: string[];
}

export const RECOMMENDED_TARGETS: RecommendedTarget[] = [
  {
    id: "m42",
    name: "M42",
    type: "Emission Nebula",
    score: 94,
    window: "9:10 PM – 12:40 AM",
    badge: "Best Match",
    explanation:
      "High altitude and strong framing make this the most efficient target for tonight.",
    factors: { altitude: 95, moon: 78, framing: 92, sessionFit: 90 },
    chosenReasons: [
      "Remains high during your best seeing window",
      "Frames well with your current focal length and sensor",
      "Fits within a 2-target session",
      "Moderate moon impact remains acceptable",
    ],
    peakAltitude: { altitude: 80, time: "23:15" },
    moonSeparation: 90,
    targetSize: 40,
    exposureRecipe: {
      subLength: 120,
      iso: 800,
      plannedSubs: 60,
    },
  },
  {
    id: "rosette",
    name: "Rosette Nebula",
    type: "Emission Nebula",
    score: 87,
    window: "10:20 PM – 1:15 AM",
    badge: "Good Framing",
    explanation:
      "Wide-field nebula that matches your rig's field of view and historical success rate.",
    factors: { altitude: 82, moon: 75, framing: 94, sessionFit: 88 },
    chosenReasons: [
      "Sensor and focal length produce ideal framing",
      "Your past sessions with wide nebulae have had strong results",
      "Available after M42 in the sequence",
      "Moon separation sufficient for broadband",
    ],
    peakAltitude: { altitude: 74, time: "00:30" },
    moonSeparation: 90,
    targetSize: 40,
    exposureRecipe: {
      subLength: 180,
      iso: 800,
      plannedSubs: 50,
    },
  },
  {
    id: "pleiades",
    name: "Pleiades",
    type: "Open Cluster",
    score: 79,
    window: "8:30 PM – 11:45 PM",
    badge: "Narrow Window",
    explanation:
      "Best earlier in the night; add as a first target if you start before 9 PM.",
    factors: { altitude: 68, moon: 85, framing: 80, sessionFit: 72 },
    chosenReasons: [
      "Low moon interference for reflection nebula",
      "Compact target fits session if started early",
      "Good warm-up before M42",
      "Western descent limits imaging window",
    ],
    peakAltitude: { altitude: 51, time: "21:10" },
    moonSeparation: 90,
    targetSize: 40,
    exposureRecipe: {
      subLength: 90,
      iso: 1600,
      plannedSubs: 45,
    },
  },
  {
    id: "heart",
    name: "Heart Nebula (IC 1805)",
    type: "Emission Nebula",
    score: 82,
    window: "10:45 PM – 2:20 AM",
    badge: "Good Framing",
    explanation:
      "Strong Ha target with good altitude; pairs well with Soul Nebula if extending the session.",
    factors: { altitude: 88, moon: 72, framing: 86, sessionFit: 84 },
    chosenReasons: [
      "Peaks above 50° during prime imaging hours",
      "Narrowband-friendly despite moderate moon",
      "Matches your rig's field of view",
      "Good second target after M42",
    ],
    peakAltitude: { altitude: 63, time: "01:15" },
    moonSeparation: 90,
    targetSize: 40,
    exposureRecipe: {
      subLength: 240,
      iso: 800,
      plannedSubs: 30,
    },
  },
];

export const REJECTED_TARGETS: RejectedTarget[] = [
  {
    id: "m31",
    name: "Andromeda Galaxy",
    status: "Rejected",
    label: "Poor Framing",
    score: 48,
    explanation:
      "Too large for the current setup and drops lower late in the session.",
    rejectedReasons: [
      "Current rig crops the target too tightly",
      "Altitude becomes less favorable after the first hour",
      "Better suited for a wider-field configuration",
    ],
  },
  {
    id: "elephant-trunk",
    name: "Elephant Trunk Nebula",
    status: "Rejected",
    label: "Too Low",
    score: 42,
    explanation:
      "Falls below 30° altitude before your usable capture window closes.",
    rejectedReasons: [
      "Peaks at 28° and drops below usable before midnight",
      "Would require starting earlier than your typical session",
      "Low altitude increases atmospheric distortion",
    ],
  },
  {
    id: "lagoon",
    name: "Lagoon Nebula",
    status: "Rejected",
    label: "Moon Conflict",
    score: 55,
    explanation:
      "Moon separation is too small for clean contrast on emission structure.",
    rejectedReasons: [
      "Moon within 25° during best window",
      "Emission nebula benefits from darker sky",
      "Better suited for a new-moon session",
    ],
  },
];

export const ADAPTATION_INSIGHTS: string[] = [
  "You usually complete 2-target missions successfully",
  "Sessions above 180s exposures often fail in average seeing",
  "Wide nebula targets have produced your best recent results",
  "You tend to stop imaging after 1:15 AM",
];

export const ADAPTATION_EFFECTS: string[] = [
  "Reduced mission from 4 targets to 2",
  "Prioritized wider framing targets",
  "Avoided long-integration faint galaxies",
  "Recommended shorter setup flow for faster readiness",
];

export const ENGINE_CONFIDENCE = "High" as const;
export const ENGINE_CONFIDENCE_SUBTEXT =
  "Confidence based on visibility, framing, and historical fit";

/** Window parts for mission target creation (start/end in HH:MM 24h). */
export const TARGET_WINDOW_PARTS: Record<
  string,
  { start: string; end: string }
> = {
  m42: { start: "21:10", end: "00:40" },
  rosette: { start: "22:20", end: "01:15" },
  pleiades: { start: "20:30", end: "23:45" },
  heart: { start: "22:45", end: "02:20" },
};
