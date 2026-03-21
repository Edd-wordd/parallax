/**
 * Mock data for Sky Intelligence: forecast planning, live verification, and mission adaptation.
 * TODO: Replace with real data from Astroberry, AllSky, and live sensor integrations.
 */

export type ConditionMode = "forecast" | "live";

export interface ForecastConditions {
  cloudCover: number; // %
  humidity: number; // %
  windMph: number;
  moonPhase: string;
  moonInterference: "None" | "Low" | "Moderate" | "High";
  skyBrightness: number; // mag/arcsec²
  bortle: number;
  transparency: number; // 1-5
  seeing: number; // 1-5
  targetVisibilityWindow: string;
  imagingWindow: string;
}

export interface LiveConditions {
  cloudCover: number;
  humidity: number;
  windMph: number;
  skyBrightness: number;
  transparency: number;
  seeing: number;
  starsDetected: number | null;
  lastUpdated: string;
  /** Field telemetry when rig/controller is connected */
  cameraTemp?: number;
  guideRms?: string;
  dewHeater?: "off" | "low" | "medium" | "high";
  mountStatus?: "idle" | "slewing" | "tracking" | "parked";
  focusStatus?: "ok" | "drifting" | "refocusing";
}

export interface SkyIntelligenceState {
  mode: ConditionMode;
  missionName: string;
  locationName: string;
  forecastConfidence: number;
  liveConfidence: number | null;
  forecast: ForecastConditions;
  live: LiveConditions | null;
  status: string;
  recommendation: string;
}

export interface ComparisonRow {
  metric: string;
  planned: string;
  live: string;
  delta: "better" | "worse" | "slightly_worse" | "same" | "verified" | "n/a";
}

export type MissionDecision = "proceed" | "proceed_with_adjustments" | "pause";

export interface AdaptationScenario {
  id: "better" | "slightly_worse" | "much_worse";
  label: string;
  recommendations: string[];
}

export interface LiveEvent {
  time: string;
  event: string;
}

export interface SessionConditionMetadata {
  forecastConfidence: number;
  liveConfidence: number;
  cloudInterruptionMinutes: number;
  averageSkyBrightness: number;
  outcome: string;
}

// --- Forecast Mode mock state ---
export const MOCK_FORECAST_STATE: SkyIntelligenceState = {
  mode: "forecast",
  missionName: "Tonight's Mission",
  locationName: "Pinnacles Dark Site",
  forecastConfidence: 78,
  liveConfidence: null,
  forecast: {
    cloudCover: 18,
    humidity: 67,
    windMph: 8,
    moonPhase: "Waxing Crescent",
    moonInterference: "Low",
    skyBrightness: 21.2,
    bortle: 4,
    transparency: 3,
    seeing: 3,
    targetVisibilityWindow: "10:15 PM — 2:40 AM",
    imagingWindow: "3.2 hours",
  },
  live: null,
  status: "Forecast supports a 3.2 hour imaging window",
  recommendation: "Best suited for galaxies and bright nebulae",
};

// --- Live Site Mode mock state ---
export const MOCK_LIVE_STATE: SkyIntelligenceState = {
  mode: "live",
  missionName: "Tonight's Mission",
  locationName: "Pinnacles Dark Site",
  forecastConfidence: 78,
  liveConfidence: 91,
  forecast: {
    cloudCover: 18,
    humidity: 67,
    windMph: 8,
    moonPhase: "Waxing Crescent",
    moonInterference: "Low",
    skyBrightness: 21.2,
    bortle: 4,
    transparency: 3,
    seeing: 3,
    targetVisibilityWindow: "10:15 PM — 2:40 AM",
    imagingWindow: "3.2 hours",
  },
  live: {
    cloudCover: 6,
    humidity: 72,
    windMph: 7,
    skyBrightness: 21.5,
    transparency: 4,
    seeing: 4,
    starsDetected: 168,
    lastUpdated: "9:14 PM",
    cameraTemp: -18.2,
    guideRms: "0.42″",
    dewHeater: "low",
    mountStatus: "tracking",
    focusStatus: "ok",
  },
  status: "Live conditions exceed forecast. Proceed with primary target.",
  recommendation: "Stars detected. Cloud cover lower than expected.",
};

// --- Site Verification comparison ---
export const MOCK_COMPARISON_BETTER: ComparisonRow[] = [
  { metric: "Cloud Cover", planned: "18%", live: "6%", delta: "better" },
  { metric: "Humidity", planned: "67%", live: "72%", delta: "slightly_worse" },
  { metric: "Wind", planned: "8 mph", live: "7 mph", delta: "better" },
  { metric: "Sky Brightness", planned: "21.2 mag/arcsec²", live: "21.5 mag/arcsec²", delta: "better" },
  { metric: "Stars Visible", planned: "N/A", live: "168", delta: "verified" },
  { metric: "Transparency", planned: "3/5", live: "4/5", delta: "better" },
  { metric: "Seeing", planned: "3/5", live: "4/5", delta: "better" },
];

export const MOCK_COMPARISON_SLIGHTLY_WORSE: ComparisonRow[] = [
  { metric: "Cloud Cover", planned: "18%", live: "32%", delta: "worse" },
  { metric: "Humidity", planned: "67%", live: "78%", delta: "slightly_worse" },
  { metric: "Wind", planned: "8 mph", live: "12 mph", delta: "worse" },
  { metric: "Sky Brightness", planned: "21.2 mag/arcsec²", live: "20.8 mag/arcsec²", delta: "worse" },
  { metric: "Stars Visible", planned: "N/A", live: "89", delta: "verified" },
  { metric: "Transparency", planned: "3/5", live: "2/5", delta: "worse" },
  { metric: "Seeing", planned: "3/5", live: "2/5", delta: "worse" },
];

export const MOCK_COMPARISON_MUCH_WORSE: ComparisonRow[] = [
  { metric: "Cloud Cover", planned: "18%", live: "68%", delta: "worse" },
  { metric: "Humidity", planned: "67%", live: "88%", delta: "worse" },
  { metric: "Wind", planned: "8 mph", live: "18 mph", delta: "worse" },
  { metric: "Sky Brightness", planned: "21.2 mag/arcsec²", live: "19.2 mag/arcsec²", delta: "worse" },
  { metric: "Stars Visible", planned: "N/A", live: "12", delta: "verified" },
  { metric: "Transparency", planned: "3/5", live: "1/5", delta: "worse" },
  { metric: "Seeing", planned: "3/5", live: "1/5", delta: "worse" },
];

export const MOCK_SUMMARY_BETTER = "Live conditions are better than forecast";
export const MOCK_SUMMARY_WORSE = "Live conditions are worse than expected";

// --- Mission decisions ---
export const MOCK_DECISION_PROCEED: MissionDecision = "proceed";
export const MOCK_DECISION_ADJUST: MissionDecision = "proceed_with_adjustments";
export const MOCK_DECISION_PAUSE: MissionDecision = "pause";

// --- Adaptation scenarios ---
export const MOCK_ADAPTATION_BETTER: AdaptationScenario = {
  id: "better",
  label: "Better than forecast",
  recommendations: [
    "Proceed with primary target",
    "Extend session by 45 minutes",
    "Keep planned 180s exposures",
  ],
};

export const MOCK_ADAPTATION_SLIGHTLY_WORSE: AdaptationScenario = {
  id: "slightly_worse",
  label: "Slightly worse than forecast",
  recommendations: [
    "Proceed with target, but reduce sub-exposures to 120s",
    "Monitor cloud movement over next 20 minutes",
  ],
};

export const MOCK_ADAPTATION_MUCH_WORSE: AdaptationScenario = {
  id: "much_worse",
  label: "Much worse than forecast",
  recommendations: [
    "Switch from faint nebula target to brighter cluster target",
    "Reduce imaging plan to a short recovery session",
    "Consider delaying capture start",
  ],
};

// --- Live event feed ---
export const MOCK_LIVE_EVENTS: LiveEvent[] = [
  { time: "9:14 PM", event: "Site verification completed" },
  { time: "9:18 PM", event: "Conditions upgraded from 78% to 91%" },
  { time: "10:02 PM", event: "Cloud cover spike detected" },
  { time: "10:09 PM", event: "Exposure sequence resumed" },
];

// --- Live Sky Monitor status ---
export const MOCK_LIVE_STATUS = "Conditions stable";
export const MOCK_LIVE_STATUSES = [
  "Conditions stable",
  "Cloud band detected",
  "Pausing exposures",
  "Resuming capture",
  "Transparency improving",
] as const;

// --- Conditions Source (planning) ---
export const MOCK_CONDITIONS_SOURCE = {
  locationName: "Pinnacles Dark Site",
  dataSource: "Forecast",
  forecastConfidence: 78,
  cloudCover: 18,
  humidity: 67,
  windMph: 8,
  moonPhase: "Waxing Crescent",
  moonInterference: "Low",
  moonRiseSet: "Sets 9:45 PM",
  seeing: 4,
  seeingLabel: "Good",
  transparency: 3,
  transparencyLabel: "Average",
  targetVisibilityWindow: "10:15 PM — 2:40 AM",
  skyBrightness: 21.2,
  bortle: 4,
  recommendations: [
    "Best suited for galaxies and bright nebulae",
    "Conditions may degrade after 12:40 AM",
    "Consider starting with target M31 before humidity rises",
  ],
};

// --- Session condition metadata (extend existing sessions) ---
export const MOCK_SESSION_CONDITIONS: Record<string, SessionConditionMetadata> = {
  s1: {
    forecastConfidence: 76,
    liveConfidence: 88,
    cloudInterruptionMinutes: 12,
    averageSkyBrightness: 21.1,
    outcome: "Completed with adjustments",
  },
  s2: {
    forecastConfidence: 82,
    liveConfidence: 85,
    cloudInterruptionMinutes: 0,
    averageSkyBrightness: 20.8,
    outcome: "Completed as planned",
  },
  s3: {
    forecastConfidence: 71,
    liveConfidence: 62,
    cloudInterruptionMinutes: 45,
    averageSkyBrightness: 20.2,
    outcome: "Shortened due to conditions",
  },
  s4: {
    forecastConfidence: 79,
    liveConfidence: 84,
    cloudInterruptionMinutes: 8,
    averageSkyBrightness: 20.5,
    outcome: "Completed with minor adjustments",
  },
  s5: {
    forecastConfidence: 68,
    liveConfidence: 55,
    cloudInterruptionMinutes: 28,
    averageSkyBrightness: 19.8,
    outcome: "Clouds cut session short",
  },
};
