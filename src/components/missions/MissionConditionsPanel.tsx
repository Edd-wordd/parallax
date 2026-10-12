"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSiteSessionForecast } from "@/lib/forecast/useSiteSessionForecast";
import {
  computeSessionAstronomy,
  formatWindowLabel,
} from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import { resolveDisplayTimeZone } from "@/lib/time/sessionWindow";
import type { ConditionsState, WindLevel } from "@/lib/missionUIStore";
import type { ManualFieldReadingPayload } from "@/lib/supabase/queries/conditionLogs";
import type { ConditionLogRow } from "@/lib/schemas";
import { latestManualReading } from "@/lib/supabase/queries/conditionLogs";

interface MissionConditionsPanelProps {
  lat: number | null | undefined;
  lon: number | null | undefined;
  dateTime: string;
  sessionEndAt?: string | null;
  siteTimezone?: string | null;
  minAltitudeDeg?: number;
  moonToleranceDeg?: number;
  siteName?: string | null;
  conditions: ConditionsState;
  onConditionsChange: (c: Partial<ConditionsState>) => void;
  conditionLogs: ConditionLogRow[];
  /** Prior field_reading mission_events.id — enables “Correct earlier”. */
  latestFieldReadingEventId?: string | null;
  onCommitReading: (reading: ManualFieldReadingPayload) => Promise<void> | void;
  committing?: boolean;
  commitError?: string | null;
  readOnly?: boolean;
  className?: string;
}

function fmtFetched(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WIND_OPTIONS: WindLevel[] = ["low", "med", "high"];

export function MissionConditionsPanel({
  lat,
  lon,
  dateTime,
  sessionEndAt = null,
  siteTimezone = null,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
  siteName,
  conditions,
  onConditionsChange,
  conditionLogs,
  latestFieldReadingEventId = null,
  onCommitReading,
  committing = false,
  commitError = null,
  readOnly = false,
  className,
}: MissionConditionsPanelProps) {
  const [localNotes, setLocalNotes] = useState("");
  const [correctEarlier, setCorrectEarlier] = useState(false);
  const displayTz = resolveDisplayTimeZone(siteTimezone);
  const interval = useMemo(
    () => sessionIntervalFromDateTime(dateTime, sessionEndAt),
    [dateTime, sessionEndAt],
  );

  const astronomy = useMemo(() => {
    if (lat == null || lon == null) return null;
    return computeSessionAstronomy({
      site: { latDeg: lat, lonDeg: lon },
      sessionStart: interval.start,
      sessionEnd: interval.end,
      minAltitudeDeg,
      moonToleranceDeg,
      targets: [],
    });
  }, [
    lat,
    lon,
    interval.start,
    interval.end,
    minAltitudeDeg,
    moonToleranceDeg,
  ]);

  const forecastHook = useSiteSessionForecast({
    latDeg: lat,
    lonDeg: lon,
    sessionStart: interval.start,
    sessionEnd: interval.end,
    includeAstroWx: true,
    moonInterference: astronomy?.moon?.interferenceLabel ?? null,
    enabled: lat != null && lon != null,
  });

  const weather = forecastHook.forecast?.weather;
  const astroWx = forecastHook.forecast?.astroWx;
  const loading = forecastHook.status === "loading";
  const latest = latestManualReading(conditionLogs);
  const sessionEnded = interval.end.getTime() < Date.now();
  const weatherOutOfRange =
    forecastHook.forecast?.status.weather === "out_of_range";
  const astroOutOfRange =
    forecastHook.forecast?.status.astroWx === "out_of_range";

  const weatherVal = (
    value: string | null,
    status?: string,
  ): string => {
    if (lat == null || lon == null) return "Select a site";
    if (loading) return "…";
    if (forecastHook.status === "error") return "Unavailable";
    if (status === "out_of_range") {
      return sessionEnded ? "Session ended" : "Out of range";
    }
    if (value == null) return "Unavailable";
    return value;
  };

  const handleCommit = async () => {
    await onCommitReading({
      seeing: conditions.seeing,
      transparency: conditions.transparency,
      cloudsPct: conditions.clouds,
      wind: conditions.wind,
      moonGlare: conditions.moonGlare,
      notes: localNotes.trim() || undefined,
      correctsEventId:
        correctEarlier && latestFieldReadingEventId
          ? latestFieldReadingEventId
          : undefined,
    });
    setLocalNotes("");
    setCorrectEarlier(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Forecast
          </h3>
          <span className="text-[10px] text-zinc-600">
            {siteName ?? "Mission site"} ·{" "}
            {fmtFetched(forecastHook.forecast?.fetchedAt)}
          </span>
        </div>
        <p className="text-[10px] text-zinc-600">
          Provider data for this mission window — not a field measurement.
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <dt className="text-zinc-500">Cloud cover</dt>
            <dd className="text-zinc-100">
              {weatherVal(
                weather?.cloudCoverPct != null
                  ? `${Math.round(weather.cloudCoverPct)}%`
                  : null,
                forecastHook.forecast?.status.weather,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Humidity</dt>
            <dd className="text-zinc-100">
              {weatherVal(
                weather?.humidityPct != null
                  ? `${Math.round(weather.humidityPct)}%`
                  : null,
                forecastHook.forecast?.status.weather,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Wind</dt>
            <dd className="text-zinc-100">
              {weatherVal(
                weather?.windMph != null
                  ? `${Math.round(weather.windMph)} mph`
                  : null,
                forecastHook.forecast?.status.weather,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Seeing (astro wx)</dt>
            <dd className="text-zinc-100">
              {weatherVal(
                astroWx?.seeingUi1to5 != null
                  ? `${astroWx.seeingUi1to5} / 5`
                  : null,
                forecastHook.forecast?.status.astroWx,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Transparency (astro wx)</dt>
            <dd className="text-zinc-100">
              {weatherVal(
                astroWx?.transparencyUi1to5 != null
                  ? `${astroWx.transparencyUi1to5} / 5`
                  : null,
                forecastHook.forecast?.status.astroWx,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Sources</dt>
            <dd className="text-zinc-400 text-[10px]">
              {weather?.source ?? "—"} / {astroWx?.source ?? "—"}
            </dd>
          </div>
        </dl>
        {forecastHook.status === "error" && (
          <p className="text-[11px] text-amber-200/90">
            {forecastHook.error ?? "Forecast unavailable."}
          </p>
        )}
        {(weatherOutOfRange || astroOutOfRange) &&
          forecastHook.status !== "error" && (
            <p className="text-[11px] text-amber-200/90">
              {sessionEnded
                ? "This mission window is in the past — forecasts only cover upcoming hours. Log what you saw under Field reading."
                : "No forecast hours overlap this session window (outside provider range)."}
            </p>
          )}
      </div>

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Calculated sky
          </h3>
          <span className="text-[10px] text-zinc-600">Astronomy Engine</span>
        </div>
        <p className="text-[10px] text-zinc-600">
          Calculated for this session — not a weather forecast or field reading.
        </p>
        {astronomy ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div>
              <dt className="text-zinc-500">Dark window</dt>
              <dd className="text-zinc-100 tabular-nums">
                {astronomy.effectiveDark
                  ? formatWindowLabel(
                      astronomy.effectiveDark.start,
                      astronomy.effectiveDark.end,
                      displayTz.abbreviation,
                    )
                  : "No darkness"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Moon</dt>
              <dd className="text-zinc-100">
                {astronomy.moon
                  ? `${astronomy.moon.phaseLabel} · ${astronomy.moon.interferenceLabel}`
                  : "Unavailable"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-zinc-500">
                Session · {displayTz.sourceLabel}
              </dt>
              <dd className="text-zinc-100 tabular-nums">
                {formatWindowLabel(
                  interval.start,
                  interval.end,
                  displayTz.abbreviation,
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-zinc-500">
            Add coordinates on the mission location to calculate sky state.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Field reading
          </h3>
          <span className="text-[10px] text-zinc-600">Manual · committed</span>
        </div>
        {latest && (
          <p className="text-[11px] text-emerald-400/90 tabular-nums">
            Latest: Seeing {String(latest.payload.seeing)} · Transp{" "}
            {String(latest.payload.transparency)} · Clouds{" "}
            {String(latest.payload.cloudsPct)}% · Wind{" "}
            {String(latest.payload.wind)} ·{" "}
            {fmtFetched(new Date(latest.recorded_at))}
          </p>
        )}
        {!readOnly && (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="text-zinc-500">
                Seeing (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={conditions.seeing}
                  onChange={(e) =>
                    onConditionsChange({
                      seeing: Math.min(
                        5,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-zinc-100"
                />
              </label>
              <label className="text-zinc-500">
                Transparency (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={conditions.transparency}
                  onChange={(e) =>
                    onConditionsChange({
                      transparency: Math.min(
                        5,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-zinc-100"
                />
              </label>
              <label className="text-zinc-500">
                Clouds (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={conditions.clouds}
                  onChange={(e) =>
                    onConditionsChange({
                      clouds: Math.min(
                        100,
                        Math.max(0, Number(e.target.value) || 0),
                      ),
                    })
                  }
                  className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-zinc-100"
                />
              </label>
              <label className="text-zinc-500">
                Wind
                <select
                  value={conditions.wind}
                  onChange={(e) =>
                    onConditionsChange({
                      wind: e.target.value as WindLevel,
                    })
                  }
                  className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-zinc-100"
                >
                  {WIND_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={conditions.moonGlare}
                onChange={(e) =>
                  onConditionsChange({ moonGlare: e.target.checked })
                }
              />
              Moon glare noticeable in field
            </label>
            <input
              type="text"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Optional note for this reading"
              className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-100"
            />
            {latestFieldReadingEventId && (
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={correctEarlier}
                  onChange={(e) => setCorrectEarlier(e.target.checked)}
                />
                Correct earlier reading (keeps prior stamp; links correction)
              </label>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="cta"
                disabled={committing}
                onClick={() => void handleCommit()}
              >
                {committing
                  ? "Saving…"
                  : correctEarlier
                    ? "Save correction"
                    : "Save field reading"}
              </Button>
              {commitError && (
                <span className="text-[11px] text-rose-400">
                  Not saved — {commitError}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
