/**
 * Mock field-ops data: Night Health, Adaptive Mission Advice, and related structures.
 * Supports mission-intelligence layer UX without backend or hardware.
 */

export type NightHealthOverall = "Strong" | "Good" | "Moderate" | "Degraded" | "Poor";

export interface NightHealth {
  overall: NightHealthOverall;
  sessionSuccessProbability: number;
  trendVsForecast: "better" | "stable" | "slightly_worse" | "worse";
  skyClarity: string;
  cloudRisk: string;
  trackingStability: string;
  moonInterference: string;
  dewRisk: string;
  confidence: number;
  recommendation: string;
  recheckTime?: string;
}

export type AdaptiveAdviceSeverity = "positive" | "neutral" | "caution" | "warning";

export interface AdaptiveAdvice {
  title: string;
  summary: string;
  actionItems: string[];
  severity: AdaptiveAdviceSeverity;
  basedOnConditionDelta?: string;
}

/** Mock Night Health — adjust via conditions for demo */
export function getMockNightHealth(overrides?: Partial<NightHealth>): NightHealth {
  return {
    overall: "Strong",
    sessionSuccessProbability: 84,
    trendVsForecast: "better",
    skyClarity: "Good",
    cloudRisk: "Low",
    trackingStability: "Stable",
    moonInterference: "Moderate",
    dewRisk: "Rising later",
    confidence: 91,
    recommendation: "Continue primary target",
    recheckTime: "10:45 PM",
    ...overrides,
  };
}

/** Mock adaptive advice — varies by condition deltas (mock) */
export function getMockAdaptiveAdvice(conditions?: { clouds?: number; transparency?: number }): AdaptiveAdvice {
  const clouds = conditions?.clouds ?? 6;
  const transparency = conditions?.transparency ?? 4;

  if (clouds > 40) {
    return {
      title: "Cloud cover rising",
      summary: "Conditions suggest reducing scope of tonight's plan.",
      actionItems: [
        "Shorten M42 and skip the final backup target",
        "Monitor cloud movement over next 20 minutes",
      ],
      severity: "caution",
      basedOnConditionDelta: "Cloud cover higher than forecast",
    };
  }

  if (transparency >= 4) {
    return {
      title: "Conditions better than forecast",
      summary: "Transparency improved. Extend current target if desired.",
      actionItems: [
        "Extend the current target by 30 minutes",
        "Keep planned sub lengths",
        "Conditions support full mission",
      ],
      severity: "positive",
      basedOnConditionDelta: "Transparency better than expected",
    };
  }

  return {
    title: "Continue primary target",
    summary: "Conditions stable vs forecast. Planned exposures remain valid.",
    actionItems: [
      "Proceed with primary target",
      "Conditions support planned sub lengths",
      "Recheck after 10:45 PM if cloud confidence falls",
    ],
    severity: "neutral",
    basedOnConditionDelta: "Stable vs forecast",
  };
}
