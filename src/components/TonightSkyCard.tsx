"use client";

/**
 * Tonight's Sky: astronomical sky-state + forecast metrics for the selected session.
 * Values must match Observing Conditions for the same site/session.
 */
import type { TonightSkyDisplay } from "@/lib/sky/tonightSkyDisplay";
import { MoonPhaseVisual } from "@/components/MoonPhaseVisual";
import { cn } from "@/lib/utils";
import { Moon, Clock, Cloud } from "lucide-react";
import { formatLocalHm } from "@/lib/sky/visibility";

interface TonightSkyCardProps {
  display: TonightSkyDisplay | null;
  compact?: boolean;
  embedded?: boolean;
  /** Shown when site coords missing */
  emptyMessage?: string;
}

export function TonightSkyCard({
  display,
  embedded,
  emptyMessage = "Select a location with coordinates to see sky conditions.",
}: TonightSkyCardProps) {
  if (!display) {
    return (
      <div
        className={cn(
          embedded
            ? "p-1.5"
            : "rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5",
        )}
      >
        {!embedded && (
          <h2 className="dash-section-title mb-2">Tonight&apos;s Sky</h2>
        )}
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  const rows = [
    { label: "Moon Phase", value: display.moonPhase.display },
    { label: "Bortle Scale", value: display.bortle.display },
    { label: "Seeing", value: display.seeing.display },
    { label: "Cloud Cover", value: display.cloudCover.display },
    { label: "Wind Speed", value: display.windSpeed.display },
    {
      label: "Dark in session",
      value: display.darkDuringSession.display,
    },
  ];

  const moonData = {
    moonPhase: display.moonPhase.available
      ? display.moonPhase.display.split(" (")[0]!
      : "—",
    illumination: display.illumination ?? 0,
    moonset: display.moonset.display,
    altitude: display.moonAltitude.display,
  };

  return (
    <div
      className={cn(
        embedded
          ? "p-1.5"
          : "rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5",
      )}
    >
      {!embedded && (
        <h2 className="dash-section-title mb-2">Tonight&apos;s Sky</h2>
      )}
      <p className="mb-2 text-[10px] text-zinc-600 tabular-nums">
        Session {formatLocalHm(display.sessionStart)} –{" "}
        {formatLocalHm(display.sessionEnd)} (6 h planning window)
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <div className="min-w-0 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline">
              <span className="dash-pill truncate text-zinc-500">{r.label}</span>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center py-1">
          <MoonPhaseVisual
            data={moonData}
            size="sm"
            imageOnly
            className="opacity-90"
          />
        </div>
        <div className="min-w-0 space-y-1.5 text-right">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-end">
              <span className="dash-metric truncate text-xs text-zinc-400">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-800/60 pt-3 sm:grid-cols-2 sm:gap-0">
        <div className="min-w-0 sm:border-r sm:border-zinc-800/60 sm:pr-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tonight AI Generated Details{" "}
            <span className="font-normal normal-case text-amber-400/80">
              (Demo)
            </span>
          </h3>
          <div className="space-y-2">
            {display.demoNotes.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-xs leading-snug text-zinc-500"
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {i === 0 ? (
                    <Clock className="h-3.5 w-3.5 text-indigo-400/80" />
                  ) : i === 1 ? (
                    <Moon className="h-3.5 w-3.5 text-indigo-400/80" />
                  ) : (
                    <Cloud className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                </span>
                <span className="min-w-0 flex-1">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 sm:pl-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Capture window
          </h3>
          <div className="space-y-1">
            <p className="font-display text-sm font-medium text-zinc-200">
              Dark during session
            </p>
            <p className="text-sm tabular-nums text-zinc-300">
              {display.darkDuringSession.display}
            </p>
            {display.darkDurationHours && (
              <p className="text-xs text-zinc-500">
                {display.darkDurationHours} hours overlapping your session
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              Target windows are clipped to this darkness ∩ your altitude floor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
