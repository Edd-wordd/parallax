/** Shared forecast result for Create Mission + dashboard Observing Conditions. */

export type ForecastProviderStatus =
  | "ok"
  | "loading"
  | "out_of_range"
  | "error"
  | "unavailable";

export type TimeInterval = { start: Date; end: Date };

export interface WeatherHourSample {
  time: Date;
  cloudCoverPct: number | null;
  humidityPct: number | null;
  windMph: number | null;
}

export interface WeatherForecastBlock {
  cloudCoverPct: number | null;
  humidityPct: number | null;
  windMph: number | null;
  /** Session hours with all three metrics / expected session hours */
  coveragePct: number;
  source: "open-meteo";
  fetchedAt: Date;
  validFor: TimeInterval;
  hourSamples: WeatherHourSample[];
}

export interface AstroWxSample {
  time: Date;
  seeingRaw: number | null;
  transparencyRaw: number | null;
  seeingUi1to5: number | null;
  transparencyUi1to5: number | null;
}

export interface AstroWxForecastBlock {
  seeingUi1to5: number | null;
  transparencyUi1to5: number | null;
  coveragePct: number;
  source: "7timer-astro";
  fetchedAt: Date;
  samples: AstroWxSample[];
}

export interface SiteSessionForecast {
  session: TimeInterval;
  site: { latDeg: number; lonDeg: number };
  weather: WeatherForecastBlock | null;
  astroWx: AstroWxForecastBlock | null;
  status: {
    weather: ForecastProviderStatus;
    astroWx: ForecastProviderStatus;
  };
  /** From Astronomy Engine — not a forecast provider */
  moonInterference: string | null;
  weatherError?: string;
  astroWxError?: string;
  fetchedAt: Date;
}

export interface SiteSessionForecastInput {
  latDeg: number;
  lonDeg: number;
  sessionStart: Date;
  sessionEnd: Date;
  /** Include 7Timer ASTRO. Default true. */
  includeAstroWx?: boolean;
  /** Optional moon interference label from computeSessionAstronomy */
  moonInterference?: string | null;
}
