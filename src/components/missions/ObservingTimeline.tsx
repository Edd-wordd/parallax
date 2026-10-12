"use client";

import { cn } from "@/lib/utils";
import type { MissionEventRow } from "@/lib/schemas";

interface ObservingTimelineProps {
  events: MissionEventRow[];
  className?: string;
  emptyMessage?: string;
  compact?: boolean;
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

function planTargetsDetail(payload: Record<string, unknown>): string | null {
  const targets = payload.targets;
  if (!Array.isArray(targets) || targets.length === 0) return null;
  return targets
    .slice(0, 6)
    .map((raw) => {
      const t = raw as Record<string, unknown>;
      const name = String(t.name ?? t.catalogId ?? "?");
      const role = t.roleLabel != null ? String(t.roleLabel) : null;
      const schedule =
        t.scheduleLabel != null ? String(t.scheduleLabel) : null;
      const filter =
        t.proposedFilter != null ? ` · ${String(t.proposedFilter)}` : "";
      const sub =
        t.proposedSubLengthSeconds != null
          ? ` · ${String(t.proposedSubLengthSeconds)}s`
          : "";
      const bits = [role, schedule].filter(Boolean).join(" · ");
      return `${name}${bits ? ` (${bits})` : ""}${filter}${sub}`;
    })
    .join(" · ");
}

export function ObservingTimeline({
  events,
  className,
  emptyMessage = "No observing events yet.",
  compact = false,
}: ObservingTimelineProps) {
  if (events.length === 0) {
    return (
      <p className={cn("text-xs text-zinc-500", className)}>{emptyMessage}</p>
    );
  }

  return (
    <ol
      className={cn(
        "space-y-2",
        compact && "max-h-48 overflow-y-auto pr-1",
        className,
      )}
    >
      {events.map((ev) => (
        <li
          key={ev.id}
          className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2.5 py-2 text-[11px]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-zinc-200">{ev.summary}</span>
            <span className="shrink-0 tabular-nums text-zinc-500">
              {formatWhen(ev.recorded_at)}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-zinc-600">
            <span>{ev.kind.replace(/_/g, " ")}</span>
            <span>·</span>
            <span>{ev.source}</span>
            {ev.catalog_id && (
              <>
                <span>·</span>
                <span className="normal-case tracking-normal text-zinc-500">
                  {ev.catalog_id}
                </span>
              </>
            )}
            {ev.corrects_event_id && (
              <>
                <span>·</span>
                <span className="text-amber-500/80">correction</span>
              </>
            )}
          </div>
          {((ev.kind === "field_reading" || ev.kind === "correction") &&
            ev.payload &&
            typeof ev.payload === "object") && (
              <p className="mt-1 tabular-nums text-zinc-400">
                {[
                  ev.payload.seeing != null
                    ? `Seeing ${String(ev.payload.seeing)}`
                    : null,
                  ev.payload.transparency != null
                    ? `Transp ${String(ev.payload.transparency)}`
                    : null,
                  ev.payload.cloudsPct != null
                    ? `Clouds ${String(ev.payload.cloudsPct)}%`
                    : null,
                  ev.payload.wind != null
                    ? `Wind ${String(ev.payload.wind)}`
                    : null,
                  ev.payload.moonGlare === true ? "Moon glare" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          {ev.kind === "capture_plan_updated" &&
            ev.payload &&
            typeof ev.payload === "object" && (
              <p className="mt-1 tabular-nums text-zinc-400">
                {[
                  ev.payload.proposedFilter != null
                    ? `Filter ${String(ev.payload.proposedFilter)}`
                    : null,
                  ev.payload.proposedSubLengthSeconds != null
                    ? `Sub ${String(ev.payload.proposedSubLengthSeconds)}s`
                    : null,
                  ev.payload.proposedIso != null
                    ? `ISO ${String(ev.payload.proposedIso)}`
                    : null,
                  ev.payload.proposedGain != null
                    ? `Gain ${String(ev.payload.proposedGain)}`
                    : null,
                  ev.payload.proposedIntegrationMinutes != null
                    ? `Int ${String(ev.payload.proposedIntegrationMinutes)} min`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          {(ev.kind === "plan_snapshot" || ev.kind === "mission_started") &&
            ev.payload &&
            typeof ev.payload === "object" && (
              <p className="mt-1 text-zinc-400 leading-snug">
                {[
                  ev.payload.sessionStart != null
                    ? `Window ${String(ev.payload.sessionStart)}`
                    : null,
                  ev.payload.sessionEndAt != null
                    ? `→ ${String(ev.payload.sessionEndAt)}`
                    : null,
                  ev.payload.transitionMinutes != null
                    ? `Transition ${String(ev.payload.transitionMinutes)}m`
                    : null,
                  planTargetsDetail(
                    ev.payload as Record<string, unknown>,
                  ),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          {ev.kind === "checklist_item" &&
            ev.payload &&
            typeof ev.payload === "object" && (
              <p className="mt-1 text-zinc-400">
                {ev.payload.checked === true ? "Checked" : "Unchecked"}
                {ev.payload.sectionLabel != null
                  ? ` · ${String(ev.payload.sectionLabel)}`
                  : ""}
              </p>
            )}
        </li>
      ))}
    </ol>
  );
}
