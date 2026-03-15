/**
 * Dashboard data layer: derives forecast, sky-state, and recommendations from
 * site + date + rig context. Replace mock implementations with real API calls.
 */

import type { Recommendation } from "@/lib/types";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_NIGHT } from "@/lib/mock/night";
import {
  MOCK_FORECAST_STATE,
  MOCK_LIVE_STATE,
  type SkyIntelligenceState,
} from "@/lib/mock/skyIntelligence";
import { generateTonightRecommendations, getTargetById } from "@/lib/mock/recommendations";

/** Format coordinates for display. Returns null if location has no lat/lon. */
export function formatCoordinates(
  lat: number | undefined,
  lon: number | undefined
): string | null {
  if (lat == null || lon == null) return null;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

/** Sky-state: astronomical conditions (moon phase, bortle, seeing, dark window). */
export interface SkyState {
  moonPhase: string;
  moonPhasePercent: number;
  illumination: number;
  moonset: string;
  moonAltitude: number;
  moonAngle: number;
  bortle: number;
  cloudCover: number;
  seeing: number;
  windSpeed: number;
  astronomicalDarknessStart: string;
  astronomicalDarknessEnd: string;
}

/** Forecast: environmental/planning conditions (confidence, humidity, etc.). */
export interface ForecastState {
  forecastConfidence: number;
  cloudCover: number;
  humidity: number;
  moonInterference: string;
  targetVisibilityWindow: string;
  imagingWindow: string;
}

/** Get sky-state for site + date. TODO: Replace with real API (coordinates + date). */
export function getSkyStateForSiteDate(
  siteId: string,
  _dateTime: string
): SkyState {
  const loc = MOCK_LOCATIONS.find((l) => l.id === siteId);
  const bortle = loc?.bortle ?? MOCK_NIGHT.bortle;
  return {
    ...MOCK_NIGHT,
    bortle,
  };
}

/** Get forecast state for site + date. TODO: Replace with real API. */
export function getForecastForSiteDate(
  siteId: string,
  _dateTime: string
): ForecastState & { status: string } {
  const loc = MOCK_LOCATIONS.find((l) => l.id === siteId);
  const state = { ...MOCK_FORECAST_STATE };
  if (loc) {
    state.locationName = loc.name;
  }
  return {
    forecastConfidence: state.forecastConfidence,
    cloudCover: state.forecast.cloudCover,
    humidity: state.forecast.humidity,
    moonInterference: state.forecast.moonInterference,
    targetVisibilityWindow: state.forecast.targetVisibilityWindow,
    imagingWindow: state.forecast.imagingWindow,
    status: state.status,
  };
}

/** Get full Sky Intelligence state for site + date. */
export function getSkyIntelligenceForSiteDate(
  siteId: string,
  dateTime: string
): SkyIntelligenceState {
  const loc = MOCK_LOCATIONS.find((l) => l.id === siteId);
  const forecast = getForecastForSiteDate(siteId, dateTime);
  const base = MOCK_FORECAST_STATE;
  const live = MOCK_LIVE_STATE;
  return {
    ...base,
    locationName: loc?.name ?? base.locationName,
    forecastConfidence: forecast.forecastConfidence,
    forecast: {
      ...base.forecast,
      cloudCover: forecast.cloudCover,
      humidity: forecast.humidity,
      moonInterference: forecast.moonInterference as "None" | "Low" | "Moderate" | "High",
      targetVisibilityWindow: forecast.targetVisibilityWindow,
      imagingWindow: forecast.imagingWindow,
    },
    status: forecast.status,
    live: live.live,
    liveConfidence: live.liveConfidence,
  };
}

/** Get live-mode Sky Intelligence for site + date. */
export function getLiveSkyIntelligenceForSiteDate(
  siteId: string,
  dateTime: string
): SkyIntelligenceState {
  const base = getSkyIntelligenceForSiteDate(siteId, dateTime);
  return { ...MOCK_LIVE_STATE, ...base };
}

/** Get recommendations for site + rig + date + constraints. */
export function getRecommendationsForSiteRigDate(
  siteId: string,
  gearId: string,
  dateTime: string,
  constraints: {
    minAltitude: number;
    moonTolerance: number;
    targetTypes: string[];
    driveToDarker?: boolean;
    driveRadius?: number;
  }
): Recommendation[] {
  return generateTonightRecommendations(
    constraints.minAltitude,
    constraints.moonTolerance,
    constraints.targetTypes,
    constraints.driveToDarker ? constraints.driveRadius : undefined
  );
}
