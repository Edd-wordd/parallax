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
  heart: {
    preset: "Detail Focused",
    exposure: "240s",
    iso: "ISO 800",
    subs: 30,
    integration: "2h 0m",
    filter: "Lum + Ha",
    capturePriority: "Detail Focused",
    confidence: "Moderate confidence",
    confidenceReason:
      "Confidence based on framing fit, target brightness, and session duration.",
    explanation:
      "Strong Ha target with good altitude. Longer subs improve signal in outer structure. Pairs well with Soul Nebula if extending the session.",
    skyBackgroundSummary:
      "Darker sky conditions support balanced sub lengths without washing out faint structure.",
    brightnessProfile:
      "Extended emission target; longer subs improve signal in outer filaments.",
    dynamicRangeRisk: "Dynamic range risk is low for this target under tonight's conditions.",
    expectedKeepers: "~26 / 30 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      { label: "Shorter exposures", exposure: "120s", note: "Safest tracking, less Ha depth", recommended: false },
      { label: "Recommended", exposure: "240s", note: "Balanced, recommended for tonight", recommended: true },
      { label: "Longer exposures", exposure: "300s", note: "Stronger Ha signal, higher guiding risk", recommended: false },
    ],
    missionFit: {
      setupTime: "15 min",
      captureTime: "2h 0m",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~1h 45m",
      bufferRemaining: "20 min",
    },
  },
  m31: {
    preset: "Balanced",
    exposure: "180s",
    iso: "ISO 800",
    subs: 40,
    integration: "2h 0m",
    filter: "Lum (no filter)",
    capturePriority: "Balanced",
    confidence: "High confidence",
    confidenceReason:
      "Confidence based on brightness, framing fit, and available capture time.",
    explanation:
      "Andromeda benefits from moderate subs to capture core and arms. Fits a two-target session window.",
    skyBackgroundSummary:
      "Moderate moon glow and site brightness favor shorter subs to preserve contrast.",
    brightnessProfile:
      "Bright core with extended arms; balanced exposures avoid saturation.",
    dynamicRangeRisk:
      "Longer exposures increase highlight clipping risk in the core.",
    expectedKeepers: "~35 / 40 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      { label: "Shorter exposures", exposure: "120s", note: "Safest tracking, lower per-frame signal", recommended: false },
      { label: "Recommended", exposure: "180s", note: "Balanced, recommended for tonight", recommended: true },
      { label: "Longer exposures", exposure: "240s", note: "Stronger signal, higher saturation risk", recommended: false },
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
  "elephant-trunk": {
    preset: "Detail Focused",
    exposure: "180s",
    iso: "ISO 800",
    subs: 50,
    integration: "2h 30m",
    filter: "Lum + Ha",
    capturePriority: "Detail Focused",
    confidence: "Moderate confidence",
    confidenceReason:
      "Confidence based on framing fit and target brightness.",
    explanation:
      "Narrowband target that benefits from longer subs for faint structure.",
    skyBackgroundSummary:
      "Darker sky conditions support balanced sub lengths.",
    brightnessProfile: "Extended emission target with faint outer regions.",
    dynamicRangeRisk: "Dynamic range risk is low for this target.",
    expectedKeepers: "~44 / 50 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      { label: "Shorter exposures", exposure: "120s", note: "Safest tracking", recommended: false },
      { label: "Recommended", exposure: "180s", note: "Balanced for tonight", recommended: true },
      { label: "Longer exposures", exposure: "240s", note: "Stronger signal, higher risk", recommended: false },
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
  lagoon: {
    preset: "Balanced",
    exposure: "120s",
    iso: "ISO 800",
    subs: 60,
    integration: "2h 0m",
    filter: "Lum (no filter)",
    capturePriority: "Balanced",
    confidence: "High confidence",
    confidenceReason:
      "Confidence based on brightness and framing fit.",
    explanation:
      "Bright emission nebula with compact core. Balanced subs suit the target and session window.",
    skyBackgroundSummary:
      "Moderate moon glow favors shorter subs to preserve contrast.",
    brightnessProfile: "Bright core with extended emission.",
    dynamicRangeRisk:
      "Longer exposures increase highlight clipping risk in core.",
    expectedKeepers: "~52 / 60 frames if conditions remain stable",
    calibrationAssumption:
      "Assumes stable tracking and a standard dark/flat calibration workflow.",
    options: [
      { label: "Shorter exposures", exposure: "60s", note: "Safest tracking", recommended: false },
      { label: "Recommended", exposure: "120s", note: "Balanced for tonight", recommended: true },
      { label: "Longer exposures", exposure: "180s", note: "Stronger signal, higher risk", recommended: false },
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
  // Planetary targets (Create Mission → planetary path)
  jupiter: {
    preset: "Efficient",
    exposure: "20ms",
    iso: "Gain 200",
    subs: 3000,
    integration: "60s stack",
    filter: "RGB or L",
    capturePriority: "Efficient",
    confidence: "High confidence",
    confidenceReason: "Bright target; short exposures reduce seeing blur. High frame count improves stacking.",
    explanation: "Planetary imaging uses very short exposures to freeze atmospheric seeing. Stack thousands of frames for sharp detail.",
    skyBackgroundSummary: "Short exposures minimize sky brightness impact.",
    brightnessProfile: "Bright target; keep exposures under 30ms to avoid overexposure.",
    dynamicRangeRisk: "High dynamic range; avoid saturation in GRS and zones.",
    expectedKeepers: "~2500 / 3000 frames with good seeing",
    calibrationAssumption: "Assumes flat/dark calibration and quality-based frame selection.",
    options: [
      { label: "Shorter", exposure: "15ms", note: "Freeze seeing, more frames", recommended: false },
      { label: "Recommended", exposure: "20ms", note: "Balanced for tonight", recommended: true },
      { label: "Longer", exposure: "30ms", note: "Higher signal, more blur", recommended: false },
    ],
    missionFit: {
      setupTime: "15 min",
      captureTime: "30 min",
      wrapTime: "5 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~50s best frames",
      bufferRemaining: "10 min",
    },
  },
  saturn: {
    preset: "Detail Focused",
    exposure: "25ms",
    iso: "Gain 250",
    subs: 2500,
    integration: "62s stack",
    filter: "RGB or L",
    capturePriority: "Detail Focused",
    confidence: "High confidence",
    confidenceReason: "Smaller disc than Jupiter; slightly longer exposures acceptable. Ring detail benefits from good seeing.",
    explanation: "Saturn requires steady seeing. Slightly longer exposures than Jupiter to capture ring structure.",
    skyBackgroundSummary: "Short exposures minimize sky brightness impact.",
    brightnessProfile: "Moderate brightness; rings add complexity.",
    dynamicRangeRisk: "Moderate; balance disc and ring exposure.",
    expectedKeepers: "~2000 / 2500 frames with good seeing",
    calibrationAssumption: "Assumes flat/dark calibration and quality-based frame selection.",
    options: [
      { label: "Shorter", exposure: "20ms", note: "Freeze seeing", recommended: false },
      { label: "Recommended", exposure: "25ms", note: "Balanced for rings", recommended: true },
      { label: "Longer", exposure: "35ms", note: "Higher signal", recommended: false },
    ],
    missionFit: {
      setupTime: "15 min",
      captureTime: "35 min",
      wrapTime: "5 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~55s best frames",
      bufferRemaining: "5 min",
    },
  },
  moon: {
    preset: "Efficient",
    exposure: "5ms",
    iso: "Gain 100",
    subs: 500,
    integration: "2.5s stack",
    filter: "Lum (no filter)",
    capturePriority: "Efficient",
    confidence: "High confidence",
    confidenceReason: "Bright target; very short exposures. Mosaic or single region both viable.",
    explanation: "Lunar imaging uses very short exposures. Stack for noise reduction. Consider mosaic for full disc.",
    skyBackgroundSummary: "Minimal; moon dominates the frame.",
    brightnessProfile: "Very bright; avoid overexposure on illuminated regions.",
    dynamicRangeRisk: "High; terminator vs bright highlands.",
    expectedKeepers: "~450 / 500 frames",
    calibrationAssumption: "Flats recommended for vignetting.",
    options: [
      { label: "Shorter", exposure: "3ms", note: "Bright regions", recommended: false },
      { label: "Recommended", exposure: "5ms", note: "Balanced", recommended: true },
      { label: "Longer", exposure: "10ms", note: "Terminator detail", recommended: false },
    ],
    missionFit: {
      setupTime: "10 min",
      captureTime: "20 min",
      wrapTime: "5 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~2s best frames",
      bufferRemaining: "15 min",
    },
  },
  mars: {
    preset: "Detail Focused",
    exposure: "30ms",
    iso: "Gain 300",
    subs: 2000,
    integration: "60s stack",
    filter: "RGB or L",
    capturePriority: "Detail Focused",
    confidence: "Moderate confidence",
    confidenceReason: "Smaller disc; seeing-critical. Best when opposition is near.",
    explanation: "Mars benefits from excellent seeing. Slightly longer exposures than Jupiter to capture surface detail.",
    skyBackgroundSummary: "Short exposures minimize sky impact.",
    brightnessProfile: "Variable brightness; depends on opposition.",
    dynamicRangeRisk: "Moderate; polar caps vs dark regions.",
    expectedKeepers: "~1600 / 2000 frames",
    calibrationAssumption: "Assumes flat/dark and quality selection.",
    options: [
      { label: "Shorter", exposure: "25ms", note: "Freeze seeing", recommended: false },
      { label: "Recommended", exposure: "30ms", note: "Surface detail", recommended: true },
      { label: "Longer", exposure: "40ms", note: "Higher signal", recommended: false },
    ],
    missionFit: {
      setupTime: "15 min",
      captureTime: "40 min",
      wrapTime: "5 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~50s best frames",
      bufferRemaining: "5 min",
    },
  },
  venus: {
    preset: "Efficient",
    exposure: "2ms",
    iso: "Gain 50",
    subs: 1000,
    integration: "2s stack",
    filter: "UV or RGB",
    capturePriority: "Efficient",
    confidence: "High confidence",
    confidenceReason: "Very bright; ultra-short exposures. Cloud detail possible with UV filter.",
    explanation: "Venus is extremely bright. Use very short exposures. UV filter can reveal cloud structure.",
    skyBackgroundSummary: "Minimal; target dominates.",
    brightnessProfile: "Very bright; easy to overexpose.",
    dynamicRangeRisk: "High; keep exposures very short.",
    expectedKeepers: "~900 / 1000 frames",
    calibrationAssumption: "Flats recommended.",
    options: [
      { label: "Shorter", exposure: "1ms", note: "Brightest phase", recommended: false },
      { label: "Recommended", exposure: "2ms", note: "Balanced", recommended: true },
      { label: "Longer", exposure: "5ms", note: "Crescent phase", recommended: false },
    ],
    missionFit: {
      setupTime: "10 min",
      captureTime: "15 min",
      wrapTime: "5 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~1.8s best frames",
      bufferRemaining: "10 min",
    },
  },
  mercury: {
    preset: "Efficient",
    exposure: "3ms",
    iso: "Gain 80",
    subs: 800,
    integration: "2.4s stack",
    filter: "Lum (no filter)",
    capturePriority: "Efficient",
    confidence: "Moderate confidence",
    confidenceReason: "Low altitude and short visibility window. Act fast when it appears.",
    explanation: "Mercury is challenging: low altitude, short window. Very short exposures to beat poor seeing near horizon.",
    skyBackgroundSummary: "Low altitude increases sky glow.",
    brightnessProfile: "Bright but small; horizon haze reduces contrast.",
    dynamicRangeRisk: "Moderate.",
    expectedKeepers: "~650 / 800 frames",
    calibrationAssumption: "Flats recommended.",
    options: [
      { label: "Shorter", exposure: "2ms", note: "Brightest", recommended: false },
      { label: "Recommended", exposure: "3ms", note: "Quick capture", recommended: true },
      { label: "Longer", exposure: "5ms", note: "More signal", recommended: false },
    ],
    missionFit: {
      setupTime: "10 min",
      captureTime: "15 min",
      wrapTime: "5 min",
      windowFit: "Tight",
      expectedUsableIntegration: "~2s best frames",
      bufferRemaining: "5 min",
    },
  },
  uranus: {
    preset: "Detail Focused",
    exposure: "500ms",
    iso: "Gain 400",
    subs: 120,
    integration: "60s stack",
    filter: "RGB",
    capturePriority: "Detail Focused",
    confidence: "Experimental",
    confidenceReason: "Faint disc; longer exposures than gas giants. Stack for color.",
    explanation: "Uranus appears as a small disc. Longer exposures than Jupiter/Saturn. RGB for color.",
    skyBackgroundSummary: "Darker sky helps; avoid moonlight.",
    brightnessProfile: "Faint; benefits from dark site.",
    dynamicRangeRisk: "Low; target is dim.",
    expectedKeepers: "~100 / 120 frames",
    calibrationAssumption: "Darks and flats recommended.",
    options: [
      { label: "Shorter", exposure: "300ms", note: "Reduce trailing", recommended: false },
      { label: "Recommended", exposure: "500ms", note: "Balanced", recommended: true },
      { label: "Longer", exposure: "800ms", note: "More signal", recommended: false },
    ],
    missionFit: {
      setupTime: "20 min",
      captureTime: "90 min",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~50s usable",
      bufferRemaining: "10 min",
    },
  },
  neptune: {
    preset: "Detail Focused",
    exposure: "600ms",
    iso: "Gain 450",
    subs: 100,
    integration: "60s stack",
    filter: "RGB",
    capturePriority: "Detail Focused",
    confidence: "Experimental",
    confidenceReason: "Faint disc; longest planetary exposures. Dark site essential.",
    explanation: "Neptune is challenging: small and faint. Longer exposures, fewer frames. Dark sky critical.",
    skyBackgroundSummary: "Dark site essential; no moon.",
    brightnessProfile: "Very faint; push exposure while avoiding trailing.",
    dynamicRangeRisk: "Low.",
    expectedKeepers: "~85 / 100 frames",
    calibrationAssumption: "Darks and flats essential.",
    options: [
      { label: "Shorter", exposure: "400ms", note: "Reduce trailing", recommended: false },
      { label: "Recommended", exposure: "600ms", note: "Balanced", recommended: true },
      { label: "Longer", exposure: "1000ms", note: "More signal", recommended: false },
    ],
    missionFit: {
      setupTime: "20 min",
      captureTime: "90 min",
      wrapTime: "10 min",
      windowFit: "Yes",
      expectedUsableIntegration: "~50s usable",
      bufferRemaining: "5 min",
    },
  },
};
