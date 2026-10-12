/**
 * Lightweight Go / No-Go assessment from session forecast + moon label.
 * Not a full imaging recommendation — honest about missing data.
 */

import type { ForecastProviderStatus, SiteSessionForecast } from "./types";

export type GoNoGoVerdict = "go" | "marginal" | "no_go" | "unavailable";

export type GoNoGoAssessment = {
  verdict: GoNoGoVerdict;
  headline: string;
  detail: string;
  factors: string[];
};

export type AssessGoNoGoInput = {
  forecast: SiteSessionForecast | null;
  /** Hook/status before forecast object exists */
  forecastStatus?: "idle" | "loading" | "ready" | "error";
  forecastError?: string | null;
  hasSite: boolean;
  sessionEnded: boolean;
  /** Astronomy Engine moon interference: Low | Moderate | High */
  moonInterference?: string | null;
};

function cloudBand(pct: number): "clear" | "mixed" | "socked" {
  if (pct < 40) return "clear";
  if (pct <= 70) return "mixed";
  return "socked";
}

function rankVerdict(v: GoNoGoVerdict): number {
  switch (v) {
    case "go":
      return 0;
    case "marginal":
      return 1;
    case "no_go":
      return 2;
    default:
      return 3;
  }
}

function worse(a: GoNoGoVerdict, b: GoNoGoVerdict): GoNoGoVerdict {
  return rankVerdict(a) >= rankVerdict(b) ? a : b;
}

export function assessGoNoGo(input: AssessGoNoGoInput): GoNoGoAssessment {
  if (!input.hasSite) {
    return {
      verdict: "unavailable",
      headline: "Site required",
      detail: "Add a location with coordinates to assess conditions.",
      factors: [],
    };
  }

  if (input.sessionEnded) {
    return {
      verdict: "unavailable",
      headline: "Session ended",
      detail:
        "This mission window is in the past — forecasts only cover upcoming hours. Use field readings if you observed.",
      factors: [],
    };
  }

  if (input.forecastStatus === "loading") {
    return {
      verdict: "unavailable",
      headline: "Checking forecast…",
      detail: "Pulling cloud, wind, and astro weather for this session window.",
      factors: [],
    };
  }

  if (input.forecastStatus === "error") {
    return {
      verdict: "unavailable",
      headline: "Forecast unavailable",
      detail: input.forecastError ?? "Could not load weather for this site.",
      factors: [],
    };
  }

  const forecast = input.forecast;
  if (!forecast) {
    return {
      verdict: "unavailable",
      headline: "No forecast yet",
      detail: "Waiting for provider data for this session window.",
      factors: [],
    };
  }

  const weatherStatus: ForecastProviderStatus = forecast.status.weather;
  if (weatherStatus === "out_of_range") {
    return {
      verdict: "unavailable",
      headline: "Out of range",
      detail:
        "No forecast hours overlap this session window. Confirm start/end are upcoming evenings, not a past morning.",
      factors: [],
    };
  }

  if (weatherStatus === "error" || weatherStatus === "unavailable") {
    return {
      verdict: "unavailable",
      headline: "Weather unavailable",
      detail: forecast.weatherError ?? "Open-Meteo did not return usable hours.",
      factors: [],
    };
  }

  const weather = forecast.weather;
  const factors: string[] = [];
  let verdict: GoNoGoVerdict = "go";

  if (weather?.cloudCoverPct != null) {
    const band = cloudBand(weather.cloudCoverPct);
    factors.push(`Clouds ~${Math.round(weather.cloudCoverPct)}%`);
    if (band === "socked") verdict = worse(verdict, "no_go");
    else if (band === "mixed") verdict = worse(verdict, "marginal");
  } else {
    factors.push("Cloud cover unknown");
    verdict = worse(verdict, "marginal");
  }

  if (weather?.windMph != null) {
    factors.push(`Wind ~${Math.round(weather.windMph)} mph`);
    if (weather.windMph > 30) verdict = worse(verdict, "no_go");
    else if (weather.windMph > 20) verdict = worse(verdict, "marginal");
  }

  const seeing = forecast.astroWx?.seeingUi1to5;
  const astroStatus = forecast.status.astroWx;
  if (astroStatus === "ok" && seeing != null) {
    factors.push(`Seeing ${seeing}/5`);
    if (seeing <= 1) verdict = worse(verdict, "no_go");
    else if (seeing === 2) verdict = worse(verdict, "marginal");
  } else if (astroStatus === "out_of_range") {
    factors.push("Astro wx out of range");
  }

  const moon =
    input.moonInterference ?? forecast.moonInterference ?? null;
  if (moon) {
    factors.push(`Moon ${moon}`);
    if (moon === "High") verdict = worse(verdict, "marginal");
  }

  if (verdict === "go") {
    return {
      verdict,
      headline: "Go — conditions look workable",
      detail:
        "Based on session-averaged forecast clouds, wind, seeing, and moon. Still verify in the field before starting.",
      factors,
    };
  }
  if (verdict === "marginal") {
    return {
      verdict,
      headline: "Marginal — proceed with caution",
      detail:
        "Some factors are soft (clouds, wind, seeing, or moon). Narrowband or shorter plans may still work.",
      factors,
    };
  }
  return {
    verdict: "no_go",
    headline: "No-Go — conditions look poor",
    detail:
      "Forecast suggests heavy clouds, strong wind, or very poor seeing for this window. Consider postponing or switching plans.",
    factors,
  };
}
