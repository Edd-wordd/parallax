/**
 * Evidence-based exposure plan from Capture worksheet + session fit + forecast.
 * Does not invent optimal exposures when worksheet fields are empty.
 */

import {
  DEFAULT_SETUP_ALLOWANCE_MINUTES,
  derivedFrames,
  estimatedCaptureMinutes,
  fitWarning,
  missingExposureEvidence,
} from "@/lib/capture/worksheetMath";
import { assessGoNoGo } from "@/lib/forecast/goNoGo";
import type { SiteSessionForecast } from "@/lib/forecast/types";
import { buildNightSimModel } from "@/lib/missions/nightSimulation";
import type { Mission, MissionTarget } from "@/lib/types";

export type ExposureOption = {
  label: string;
  exposure: string;
  note: string;
  recommended: boolean;
};

export type MissionFit = {
  setupTime: string;
  captureTime: string;
  wrapTime: string;
  windowFit: "Yes" | "Tight" | "No";
  expectedUsableIntegration?: string;
  bufferRemaining?: string;
};

export type ExposurePlanConfidence =
  | "High confidence"
  | "Moderate confidence"
  | "Experimental";

export type RealExposurePlan = {
  status: "ready" | "incomplete" | "empty";
  targetName: string | null;
  preset: string;
  exposure: string;
  iso: string;
  subs: number | null;
  integration: string;
  filter: string | null;
  capturePriority: "Efficient" | "Balanced" | "Detail Focused";
  confidence: ExposurePlanConfidence;
  confidenceReason: string;
  explanation: string;
  options: ExposureOption[];
  missionFit: MissionFit;
  skyBackgroundSummary: string | null;
  missingEvidence: string[];
  sources: string[];
};

function fmtMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  if (r === 0) return `${h}h 0m`;
  return `${h}h ${r}m`;
}

function isoGainLabel(t: MissionTarget): string {
  if (t.proposedIso != null && t.proposedGain != null) {
    return `ISO ${t.proposedIso} · Gain ${t.proposedGain}`;
  }
  if (t.proposedIso != null) return `ISO ${t.proposedIso}`;
  if (t.proposedGain != null) return `Gain ${t.proposedGain}`;
  if (t.isoGain) return t.isoGain;
  return "—";
}

function suggestSubs(
  base: number,
  preferShorter: boolean,
): ExposureOption[] {
  const shorter = Math.max(30, Math.round(base / 2 / 10) * 10);
  const longer = Math.min(300, Math.round((base * 1.5) / 10) * 10);
  return [
    {
      label: "Shorter",
      exposure: `${shorter}s`,
      note: preferShorter
        ? "Favored when clouds/moon are soft"
        : "Safer tracking / lower per-frame signal",
      recommended: preferShorter,
    },
    {
      label: "Worksheet",
      exposure: `${base}s`,
      note: "Your proposed sub length from Capture worksheet",
      recommended: !preferShorter,
    },
    {
      label: "Longer",
      exposure: `${longer}s`,
      note: "More signal per frame — higher tracking / saturation risk",
      recommended: false,
    },
  ];
}

export function buildRealExposurePlan(input: {
  mission: Mission;
  target: MissionTarget | null;
  forecast: SiteSessionForecast | null;
  forecastStatus?: "idle" | "loading" | "ready" | "error";
  forecastError?: string | null;
  hasSite: boolean;
  cameraName?: string | null;
  hasGuiding?: boolean;
  moonInterference?: string | null;
}): RealExposurePlan {
  const { mission, target } = input;
  const model = buildNightSimModel({
    dateTime: mission.dateTime,
    sessionEndAt: mission.sessionEndAt,
    targets: mission.targets,
  });
  const available = model.durationMinutes;
  const transition =
    mission.transitionMinutes != null &&
    Number.isFinite(mission.transitionMinutes)
      ? mission.transitionMinutes
      : 15;
  const estimated = estimatedCaptureMinutes(mission.targets, transition);
  const fitMsg = fitWarning(estimated, available);

  const go = assessGoNoGo({
    forecast: input.forecast,
    forecastStatus: input.forecastStatus,
    forecastError: input.forecastError,
    hasSite: input.hasSite,
    sessionEnded: model.sessionEnd.getTime() < Date.now(),
    moonInterference: input.moonInterference,
  });

  const weather = input.forecast?.weather;
  const clouds = weather?.cloudCoverPct ?? null;
  const preferShorter =
    go.verdict === "marginal" ||
    go.verdict === "no_go" ||
    input.moonInterference === "High" ||
    (clouds != null && clouds >= 55);

  let skyBackgroundSummary: string | null = null;
  if (clouds != null || input.moonInterference) {
    const parts = [
      clouds != null ? `Clouds ~${Math.round(clouds)}%` : null,
      input.moonInterference
        ? `Moon ${input.moonInterference}`
        : null,
      go.verdict !== "unavailable" ? go.headline : null,
    ].filter(Boolean);
    skyBackgroundSummary = parts.join(" · ");
  } else if (!input.hasSite) {
    skyBackgroundSummary = "Add a site to load forecast sky context.";
  }

  const missionFit: MissionFit = (() => {
    const setup = DEFAULT_SETUP_ALLOWANCE_MINUTES;
    const wrap = 10;
    const capture = estimated ?? 0;
    let windowFit: MissionFit["windowFit"] = "Yes";
    if (estimated == null) windowFit = "Tight";
    else if (fitMsg) windowFit = "No";
    else if (estimated > available * 0.9) windowFit = "Tight";
    const buffer =
      estimated != null ? Math.max(0, available - estimated) : null;
    return {
      setupTime: fmtMinutes(setup),
      captureTime: estimated != null ? fmtMinutes(estimated) : "—",
      wrapTime: fmtMinutes(wrap),
      windowFit,
      expectedUsableIntegration:
        target?.proposedIntegrationMinutes != null
          ? fmtMinutes(target.proposedIntegrationMinutes)
          : undefined,
      bufferRemaining:
        buffer != null ? fmtMinutes(buffer) : undefined,
    };
  })();

  if (!target) {
    return {
      status: "empty",
      targetName: null,
      preset: "—",
      exposure: "—",
      iso: "—",
      subs: null,
      integration: "—",
      filter: null,
      capturePriority: "Balanced",
      confidence: "Experimental",
      confidenceReason: "Select a target in the queue.",
      explanation:
        "Exposure Plan summarizes Capture worksheet settings for the focused target — it does not invent an optimal recipe.",
      options: [],
      missionFit,
      skyBackgroundSummary,
      missingEvidence: ["selected target"],
      sources: ["Capture worksheet", "Session window", "Forecast / moon"],
    };
  }

  const hasFilter = !!(target.proposedFilter && target.proposedFilter.trim());
  const hasIsoOrGain =
    target.proposedIso != null ||
    target.proposedGain != null ||
    !!target.isoGain;
  const hasSub = target.proposedSubLengthSeconds != null;
  const hasIntegration = target.proposedIntegrationMinutes != null;

  const missingEvidence = missingExposureEvidence({
    hasCameraName: !!input.cameraName,
    hasFilter,
    hasIsoOrGain,
    hasSkyContext: input.hasSite && input.forecastStatus === "ready",
    hasTrackingHint: !!input.hasGuiding || !!input.cameraName,
  });
  if (!hasSub) missingEvidence.push("proposed sub length");
  if (!hasIntegration) missingEvidence.push("proposed integration minutes");

  const frames = derivedFrames(
    target.proposedIntegrationMinutes,
    target.proposedSubLengthSeconds,
  );

  if (!hasSub && !hasIntegration) {
    return {
      status: "incomplete",
      targetName: target.targetName,
      preset: "Worksheet",
      exposure: "—",
      iso: isoGainLabel(target),
      subs: null,
      integration: "—",
      filter: target.proposedFilter?.trim() || null,
      capturePriority: "Balanced",
      confidence: "Experimental",
      confidenceReason:
        "Fill proposed sub length and integration on the Capture worksheet.",
      explanation: `No proposed exposure yet for ${target.targetName}. Enter settings in Capture worksheet — this card will summarize them and check fit against the session window.`,
      options: [],
      missionFit,
      skyBackgroundSummary,
      missingEvidence,
      sources: ["Capture worksheet", "Session window", "Forecast / moon"],
    };
  }

  const sub = target.proposedSubLengthSeconds ?? null;
  const options =
    sub != null && sub > 0 ? suggestSubs(sub, preferShorter) : [];

  let confidence: ExposurePlanConfidence = "High confidence";
  let confidenceReason =
    "Based on your worksheet proposals plus session fit and forecast context.";
  if (missingEvidence.length >= 3 || fitMsg) {
    confidence = "Experimental";
    confidenceReason = fitMsg
      ? fitMsg
      : `Missing evidence: ${missingEvidence.join(", ")}.`;
  } else if (missingEvidence.length > 0 || preferShorter) {
    confidence = "Moderate confidence";
    confidenceReason =
      missingEvidence.length > 0
        ? `Partial evidence — still missing: ${missingEvidence.join(", ")}.`
        : "Conditions are soft — consider shorter subs from the options below.";
  }

  const capturePriority: RealExposurePlan["capturePriority"] = preferShorter
    ? "Efficient"
    : hasIntegration &&
        target.proposedIntegrationMinutes != null &&
        target.proposedIntegrationMinutes >= 120
      ? "Detail Focused"
      : "Balanced";

  const explanation = [
    `Summarizing Capture worksheet for ${target.targetName}.`,
    preferShorter
      ? "Forecast/moon suggest favoring shorter subs if you revise the worksheet."
      : "Worksheet sub length is the recommended baseline for tonight.",
    fitMsg ? fitMsg : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    status: "ready",
    targetName: target.targetName,
    preset: "Worksheet",
    exposure: sub != null ? `${sub}s` : "—",
    iso: isoGainLabel(target),
    subs: frames,
    integration:
      target.proposedIntegrationMinutes != null
        ? fmtMinutes(target.proposedIntegrationMinutes)
        : "—",
    filter: target.proposedFilter?.trim() || null,
    capturePriority,
    confidence,
    confidenceReason,
    explanation,
    options,
    missionFit,
    skyBackgroundSummary,
    missingEvidence,
    sources: [
      "Capture worksheet (proposed)",
      "Session window + transitions",
      "Forecast clouds / Go/No-Go + moon",
      input.cameraName ? `Camera: ${input.cameraName}` : "Camera unset",
    ],
  };
}
