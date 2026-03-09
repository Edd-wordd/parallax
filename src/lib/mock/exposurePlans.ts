/**
 * Mock exposure plans by target. Replace with API data when backend is wired.
 */

export interface ExposureOption {
  label: string;
  exposure: string;
  note: string;
  recommended: boolean;
}

export interface MissionFit {
  setupTime: string;
  captureTime: string;
  wrapTime: string;
  windowFit: "Yes" | "Tight" | "No";
  /** Expected usable integration. Optional. */
  expectedUsableIntegration?: string;
  /** Buffer remaining after capture. Optional. */
  bufferRemaining?: string;
}

export interface ExposurePlan {
  preset: string;
  exposure: string;
  iso: string;
  subs: number;
  integration: string;
  filter?: string;
  capturePriority: "Efficient" | "Balanced" | "Detail Focused";
  confidence: "High confidence" | "Moderate confidence" | "Experimental";
  confidenceReason: string;
  explanation: string;
  options: ExposureOption[];
  missionFit: MissionFit;
  /** Sky brightness affects recommendation. */
  skyBackgroundSummary?: string;
  /** Target brightness profile: bright, faint, compact, diffuse, etc. */
  brightnessProfile?: string;
  /** Dynamic range / highlight clipping risk. */
  dynamicRangeRisk?: string;
  /** Expected keeper frame count. */
  expectedKeepers?: string;
  /** Calibration workflow assumption. */
  calibrationAssumption?: string;
}

export type ExposurePlansByTarget = Record<string, ExposurePlan>;

export const EXPOSURE_PLANS_BY_TARGET: ExposurePlansByTarget = {
  m42: {
    preset: "Balanced",
    exposure: "120s",
    iso: "ISO 800",
    subs: 60,
    integration: "2h 0m",
    filter: "Lum (no filter)",
    capturePriority: "Balanced",
    confidence: "High confidence",
    confidenceReason:
      "Confidence based on brightness, framing fit, and available capture time.",
    explanation:
      "Balanced for your current rig and a two-target session window. Designed to avoid overextending the session. Prioritizes usable integration over aggressive exposure lengths.",
    skyBackgroundSummary:
      "Moderate moon glow and site brightness favor shorter subs to preserve contrast.",
    brightnessProfile:
      "Bright emission core supports shorter exposures without sacrificing productivity.",
    dynamicRangeRisk:
      "Longer exposures increase highlight clipping risk in the brightest regions.",
    expectedKeepers: "~52 / 60 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      {
        label: "Shorter exposures",
        exposure: "60s",
        note: "Safest tracking, lower per-frame signal",
        recommended: false,
      },
      {
        label: "Recommended",
        exposure: "120s",
        note: "Balanced, recommended for tonight",
        recommended: true,
      },
      {
        label: "Longer exposures",
        exposure: "180s",
        note: "Stronger signal, higher saturation / tracking risk",
        recommended: false,
      },
    ],
    missionFit: {
      setupTime: "20 min",
      captureTime: "2h 0m",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~1h 45m",
      bufferRemaining: "15 min",
    },
  },
  rosette: {
    preset: "Balanced",
    exposure: "180s",
    iso: "ISO 800",
    subs: 50,
    integration: "2h 30m",
    filter: "Lum + Ha",
    capturePriority: "Detail Focused",
    confidence: "Moderate confidence",
    confidenceReason:
      "Confidence based on framing fit, target brightness, and session duration.",
    explanation:
      "Wide nebula benefits from longer subs for faint outer structure. Fits the extended window after M42. Slightly more demanding on tracking.",
    skyBackgroundSummary:
      "Darker sky conditions support balanced sub lengths without washing out faint structure.",
    brightnessProfile:
      "Extended emission target; longer subs improve signal in outer filaments.",
    dynamicRangeRisk: "Dynamic range risk is low for this target under tonight's conditions.",
    expectedKeepers: "~44 / 50 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      {
        label: "Shorter exposures",
        exposure: "90s",
        note: "Safest tracking, less Ha depth",
        recommended: false,
      },
      {
        label: "Recommended",
        exposure: "180s",
        note: "Balanced, recommended for tonight",
        recommended: true,
      },
      {
        label: "Longer exposures",
        exposure: "240s",
        note: "Stronger Ha signal, higher guiding risk",
        recommended: false,
      },
    ],
    missionFit: {
      setupTime: "15 min",
      captureTime: "2h 30m",
      wrapTime: "10 min",
      windowFit: "Tight",
      expectedUsableIntegration: "~2h 15m",
      bufferRemaining: "5 min",
    },
  },
  m45: {
    preset: "Efficient",
    exposure: "60s",
    iso: "ISO 800",
    subs: 90,
    integration: "1h 30m",
    filter: "Lum (no filter)",
    capturePriority: "Efficient",
    confidence: "High confidence",
    confidenceReason:
      "Confidence based on narrow window and target brightness profile.",
    explanation:
      "Shorter exposures suit the compact target and narrow imaging window. Avoids core saturation while capturing reflection nebula. Fits a single-target slot if started early.",
    skyBackgroundSummary:
      "Moderate moon glow and site brightness favor shorter subs to preserve contrast.",
    brightnessProfile:
      "Compact reflection target with moderate brightness and limited imaging window.",
    dynamicRangeRisk:
      "Longer exposures increase highlight clipping risk in the brightest regions.",
    expectedKeepers: "~78 / 90 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      {
        label: "Shorter exposures",
        exposure: "45s",
        note: "Safest tracking, lower per-frame signal",
        recommended: false,
      },
      {
        label: "Recommended",
        exposure: "60s",
        note: "Balanced, recommended for tonight",
        recommended: true,
      },
      {
        label: "Longer exposures",
        exposure: "90s",
        note: "Stronger signal, higher saturation / tracking risk",
        recommended: false,
      },
    ],
    missionFit: {
      setupTime: "20 min",
      captureTime: "1h 30m",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~1h 18m",
      bufferRemaining: "25 min",
    },
  },
  pleiades: {
    preset: "Efficient",
    exposure: "60s",
    iso: "ISO 800",
    subs: 90,
    integration: "1h 30m",
    filter: "Lum (no filter)",
    capturePriority: "Efficient",
    confidence: "High confidence",
    confidenceReason:
      "Confidence based on narrow window and target brightness profile.",
    explanation:
      "Shorter exposures suit the compact target and narrow imaging window. Avoids core saturation while capturing reflection nebula. Fits a single-target slot if started early.",
    skyBackgroundSummary:
      "Moderate moon glow and site brightness favor shorter subs to preserve contrast.",
    brightnessProfile:
      "Compact reflection target with moderate brightness and limited imaging window.",
    dynamicRangeRisk:
      "Longer exposures increase highlight clipping risk in the brightest regions.",
    expectedKeepers: "~78 / 90 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      {
        label: "Shorter exposures",
        exposure: "45s",
        note: "Safest tracking, lower per-frame signal",
        recommended: false,
      },
      {
        label: "Recommended",
        exposure: "60s",
        note: "Balanced, recommended for tonight",
        recommended: true,
      },
      {
        label: "Longer exposures",
        exposure: "90s",
        note: "Stronger signal, higher saturation / tracking risk",
        recommended: false,
      },
    ],
    missionFit: {
      setupTime: "20 min",
      captureTime: "1h 30m",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~1h 18m",
      bufferRemaining: "25 min",
    },
  },
};
