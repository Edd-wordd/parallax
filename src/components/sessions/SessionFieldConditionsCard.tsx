"use client";

import { cn } from "@/lib/utils";
import type { ConditionLogRow } from "@/lib/schemas";

interface SessionFieldConditionsCardProps {
  logs: ConditionLogRow[];
  /** When true, rows came from mission_id fallback (session attach missed) */
  fromMissionFallback?: boolean;
  className?: string;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readingLine(payload: Record<string, unknown>): string {
  return [
    payload.seeing != null ? `Seeing ${String(payload.seeing)}` : null,
    payload.transparency != null
      ? `Transp ${String(payload.transparency)}`
      : null,
    payload.cloudsPct != null ? `Clouds ${String(payload.cloudsPct)}%` : null,
    payload.wind != null ? `Wind ${String(payload.wind)}` : null,
    payload.moonGlare === true ? "Moon glare" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual field reading",
  forecast: "Forecast snapshot",
  live: "Live (Demo / telemetry)",
  telemetry: "Telemetry (Demo)",
};

/**
 * Field condition readings attached to a saved session.
 * Manual readings are logged values; forecast/live/telemetry are labeled by source.
 */
export function SessionFieldConditionsCard({
  logs,
  fromMissionFallback = false,
  className,
}: SessionFieldConditionsCardProps) {
  const manual = logs.filter((l) => l.source === "manual");
  const other = logs.filter((l) => l.source !== "manual");

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden",
        className,
      )}
    >
      <div className="border-b border-zinc-800/60 px-3 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="dash-section-title">Field conditions</h2>
          {fromMissionFallback && (
            <span className="text-[10px] text-amber-400/90">
              Mission fallback (session attach missed)
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Logged during the mission. Manual readings are what you entered;
          forecast/live rows keep their source label — nothing here is invented
          on this page.
        </p>
      </div>
      <div className="space-y-3 p-3">
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No condition logs attached. Log a field reading in Setup/Capture,
            then Save Log again if attach missed.
          </p>
        ) : (
          <>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Manual readings
                {manual.length > 0 ? (
                  <span className="ml-1 font-normal tabular-nums text-zinc-600">
                    ({manual.length})
                  </span>
                ) : null}
              </p>
              {manual.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-zinc-600">
                  None logged this session.
                </p>
              ) : (
                <ul className="mt-1.5 space-y-1.5">
                  {manual.map((row) => {
                    const line = readingLine(row.payload);
                    const notes =
                      typeof row.payload.notes === "string" &&
                      row.payload.notes.trim()
                        ? row.payload.notes.trim()
                        : null;
                    return (
                      <li
                        key={row.id}
                        className="rounded-md border border-zinc-800/50 bg-zinc-950/40 px-2.5 py-2 text-[11px]"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="tabular-nums text-zinc-300">
                            {line || "Reading logged"}
                          </span>
                          <span className="shrink-0 tabular-nums text-zinc-500">
                            {formatWhen(row.recorded_at)}
                          </span>
                        </div>
                        {notes && (
                          <p className="mt-1 text-zinc-500">{notes}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {other.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Other sources
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {other.map((row) => {
                    const line = readingLine(row.payload);
                    return (
                      <li
                        key={row.id}
                        className="rounded-md border border-zinc-800/40 bg-zinc-950/30 px-2.5 py-2 text-[11px]"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-zinc-400">
                            {SOURCE_LABEL[row.source] ?? row.source}
                            {row.event_type ? ` · ${row.event_type}` : ""}
                          </span>
                          <span className="shrink-0 tabular-nums text-zinc-600">
                            {formatWhen(row.recorded_at)}
                          </span>
                        </div>
                        {line && (
                          <p className="mt-0.5 tabular-nums text-zinc-500">
                            {line}
                          </p>
                        )}
                        {(row.source === "live" ||
                          row.source === "telemetry") && (
                          <p className="mt-1 text-[10px] text-amber-400/80">
                            Demo — not a measured equipment feed
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
