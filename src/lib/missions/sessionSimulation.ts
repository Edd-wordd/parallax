/**
 * Real session simulation preview from mission schedule + forecast + worksheet fit.
 */

import { assessGoNoGo } from "@/lib/forecast/goNoGo";
import type { SiteSessionForecast } from "@/lib/forecast/types";
import {
  estimatedCaptureMinutes,
  fitWarning,
} from "@/lib/capture/worksheetMath";
import { buildNightSimModel } from "@/lib/missions/nightSimulation";
import { formatWindowLabel } from "@/lib/sky/visibility";
import { resolveDisplayTimeZone } from "@/lib/time/sessionWindow";
import type { Mission } from "@/lib/types";

export type SessionSimRisk = {
  label: string;
  level: "Low" | "Moderate" | "High";
  reason: string;
};

export type SessionSimTimelineEvent = {
  time: string;
  event: string;
};

export type RealSessionSimulation = {
  summary: string;
  sessionLabel: string;
  recommendedStop: string | null;
  weatherNote: string | null;
  timeline: SessionSimTimelineEvent[];
  risks: SessionSimRisk[];
  sources: string[];
};

function fmtHm(d: Date, timeZone?: string | null): string {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function buildRealSessionSimulation(input: {
  mission: Mission;
  forecast: SiteSessionForecast | null;
  forecastStatus?: "idle" | "loading" | "ready" | "error";
  forecastError?: string | null;
  hasSite: boolean;
  siteTimezone?: string | null;
  moonInterference?: string | null;
}): RealSessionSimulation {
  const { mission } = input;
  const displayTz = resolveDisplayTimeZone(input.siteTimezone);
  const model = buildNightSimModel({
    dateTime: mission.dateTime,
    sessionEndAt: mission.sessionEndAt,
    targets: mission.targets,
  });
  const sessionLabel = formatWindowLabel(
    model.sessionStart,
    model.sessionEnd,
    displayTz.abbreviation,
  );

  const go = assessGoNoGo({
    forecast: input.forecast,
    forecastStatus: input.forecastStatus,
    forecastError: input.forecastError,
    hasSite: input.hasSite,
    sessionEnded: model.sessionEnd.getTime() < Date.now(),
    moonInterference: input.moonInterference,
  });

  const transition =
    mission.transitionMinutes != null && Number.isFinite(mission.transitionMinutes)
      ? mission.transitionMinutes
      : 15;
  const estimated = estimatedCaptureMinutes(mission.targets, transition);
  const available = model.durationMinutes;
  const fit = fitWarning(estimated, available);

  const timeline: SessionSimTimelineEvent[] = [
    {
      time: fmtHm(model.sessionStart, input.siteTimezone),
      event: "Session window starts",
    },
  ];
  for (const seg of model.segments) {
    timeline.push({
      time: fmtHm(seg.start, input.siteTimezone),
      event: `${seg.targetName} · ${seg.source === "scheduled" ? "scheduled" : "planned window"}`,
    });
    timeline.push({
      time: fmtHm(seg.end, input.siteTimezone),
      event: `${seg.targetName} ends`,
    });
  }
  timeline.push({
    time: fmtHm(model.sessionEnd, input.siteTimezone),
    event: "Session window ends",
  });

  const lastSegEnd =
    model.segments.length > 0
      ? model.segments.reduce(
          (latest, s) => (s.end > latest ? s.end : latest),
          model.segments[0]!.end,
        )
      : null;
  const recommendedStop = lastSegEnd
    ? fmtHm(lastSegEnd, input.siteTimezone)
    : fmtHm(model.sessionEnd, input.siteTimezone);

  const weather = input.forecast?.weather;
  let weatherNote: string | null = null;
  if (weather?.cloudCoverPct != null) {
    weatherNote = `Session-averaged clouds ~${Math.round(weather.cloudCoverPct)}%`;
    if (weather.humidityPct != null) {
      weatherNote += ` · humidity ~${Math.round(weather.humidityPct)}%`;
    }
    if (weather.windMph != null) {
      weatherNote += ` · wind ~${Math.round(weather.windMph)} mph`;
    }
    weatherNote += " (Open-Meteo).";
  } else if (go.verdict === "unavailable") {
    weatherNote = go.detail;
  }

  const risks: SessionSimRisk[] = [];
  if (go.verdict === "no_go") {
    risks.push({
      label: "Conditions",
      level: "High",
      reason: go.headline,
    });
  } else if (go.verdict === "marginal") {
    risks.push({
      label: "Conditions",
      level: "Moderate",
      reason: go.headline,
    });
  } else if (go.verdict === "go") {
    risks.push({
      label: "Conditions",
      level: "Low",
      reason: go.headline,
    });
  }

  if (input.moonInterference === "High") {
    risks.push({
      label: "Moon",
      level: "High",
      reason: "High moon interference for this session window.",
    });
  } else if (input.moonInterference === "Moderate") {
    risks.push({
      label: "Moon",
      level: "Moderate",
      reason: "Moderate moon interference — prefer narrowband if needed.",
    });
  }

  if (fit) {
    risks.push({
      label: "Plan fit",
      level: "High",
      reason: fit,
    });
  } else if (estimated != null) {
    risks.push({
      label: "Plan fit",
      level: "Low",
      reason: `Estimated capture ~${Math.round(estimated)} min within ~${available} min session.`,
    });
  } else if (mission.targets.length > 0) {
    risks.push({
      label: "Plan fit",
      level: "Moderate",
      reason:
        "No proposed integration on the Capture worksheet yet — timing fit unknown.",
    });
  }

  if (model.segments.length === 0 && mission.targets.length > 0) {
    risks.push({
      label: "Schedule",
      level: "Moderate",
      reason:
        "Targets lack timed schedule segments — accept a Night Schedule for sharper timing.",
    });
  }

  const summaryParts = [
    go.headline,
    mission.targets.length === 0
      ? "No targets in queue."
      : `${mission.targets.length} target${mission.targets.length === 1 ? "" : "s"} · stop ~${recommendedStop}.`,
  ];

  return {
    summary: summaryParts.join(" "),
    sessionLabel,
    recommendedStop,
    weatherNote,
    timeline,
    risks,
    sources: [
      "Session window",
      "Night Schedule / planned windows",
      "Forecast + moon (Go/No-Go)",
      "Capture worksheet fit",
    ],
  };
}
