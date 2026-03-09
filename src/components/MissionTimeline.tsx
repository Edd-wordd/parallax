"use client";

import { useState, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import { MOCK_NIGHT } from "@/lib/mock/night";
import { MOCK_TARGET_WINDOWS, type TargetWindow } from "@/lib/mock/targetWindows";
import type { MissionTarget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getNowPercent, eventPercent } from "@/lib/timeUtils";
import { Tooltip } from "@/components/ui/Tooltip";

const { sunset, sunrise, astronomicalDarknessStart, moonset } = MOCK_NIGHT;

const VERTICAL_MARKERS = [
  { label: "Sunset", time: sunset, nextDay: false },
  { label: "Dark", time: astronomicalDarknessStart, nextDay: false },
  { label: "Moonset", time: moonset, nextDay: false },
  { label: "Sunrise", time: sunrise, nextDay: true },
];

const parseTime = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h + (m ?? 0) / 60;
};

function segPct(t: string, nextDay = false): number {
  return eventPercent(t, sunset, sunrise, nextDay) * 100;
}

/** Map window start/end to 0..100 on the sunset-sunrise scale */
function windowToPct(
  timeStr: string,
  nextDay: boolean,
  sunsetStr: string,
  sunriseStr: string
): number {
  return eventPercent(timeStr, sunsetStr, sunriseStr, nextDay) * 100;
}

function isNextDay(timeStr: string): boolean {
  return parseTime(timeStr) < 6;
}

const sunsetX = 0;
const darkX = segPct(astronomicalDarknessStart);
const moonsetX = segPct(moonset);
const sunriseX = 100;

/** Astro window colors — use CSS vars for field-mode override */
const ASTRO_COLORS = {
  trackBase: "bg-[var(--astro-track-base,rgba(63,63,70,0.4))]",
  visible: "bg-[var(--astro-visible,rgba(113,113,122,0.5))]",
  optimal: "bg-[var(--astro-optimal,rgba(99,102,241,0.55))]",
  moonImpact: "bg-[var(--astro-moon,rgba(251,191,36,0.4))]",
  cloudRisk: "bg-[var(--astro-cloud,rgba(148,163,184,0.45))]",
  nowLine: "bg-[var(--astro-now,#22d3ee)]",
  nowText: "text-[var(--astro-now,#22d3ee)]",
  nowBorder: "border-[var(--astro-now,#22d3ee)]",
} as const;

const LEGEND_ITEMS = [
  { key: "visible", label: "Visible", color: "bg-zinc-500/60" },
  { key: "optimal", label: "Optimal", color: "bg-indigo-500/70" },
  { key: "moon", label: "Moon Impact", color: "bg-amber-500/50" },
  { key: "cloud", label: "Cloud Risk", color: "bg-slate-500/50" },
  { key: "now", label: "Now", color: "bg-cyan-400" },
] as const;

/** Isolated clock — only this rerenders on tick */
const NowMarker = memo(function NowMarker({
  sunset: s,
  sunrise: r,
  compact,
  stacked,
}: {
  sunset: string;
  sunrise: string;
  compact?: boolean;
  stacked?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const progress = getNowPercent(s, r, now);
  const nowTime = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const labelTop = compact ? "-top-0.5" : "-top-8";
  return (
    <>
      <div
        className={cn(
          "absolute top-0 bottom-0 w-0.5 rounded-full -translate-x-1/2 pointer-events-none",
          ASTRO_COLORS.nowLine,
          "shadow-[0_0_6px_var(--astro-now,rgba(34,211,238,0.5))]"
        )}
        style={{ left: `${progress * 100}%` }}
        aria-hidden
      />
      <div
        className={cn(
          "absolute left-0 flex flex-col items-center -translate-x-1/2 pointer-events-none",
          labelTop
        )}
        style={{ left: `${progress * 100}%` }}
      >
        {stacked ? (
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-semibold tabular-nums uppercase tracking-wide flex flex-col items-center",
              ASTRO_COLORS.nowBorder,
              ASTRO_COLORS.nowText,
              "bg-[var(--astro-bg,zinc-900)]",
              compact ? "text-[10px]" : "rounded-md px-2 py-1 text-xs"
            )}
          >
            <span>Now</span>
            <span>{nowTime}</span>
          </span>
        ) : (
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-semibold tabular-nums uppercase tracking-wide",
              ASTRO_COLORS.nowBorder,
              ASTRO_COLORS.nowText,
              "bg-[var(--astro-bg,zinc-900)]",
              compact ? "text-[10px]" : "rounded-md px-2.5 py-1 text-xs"
            )}
          >
            Now {nowTime}
          </span>
        )}
      </div>
    </>
  );
});

/** Single target row with layered astro windows */
function AstroTargetRow({
  w,
  sunset: s,
  sunrise: r,
  selectedTargetId,
  onTargetClick,
  fieldMode,
}: {
  w: TargetWindow;
  sunset: string;
  sunrise: string;
  selectedTargetId: string | null;
  onTargetClick?: (id: string) => void;
  fieldMode?: boolean;
}) {
  const visibleLeft = windowToPct(w.visibleStart, isNextDay(w.visibleStart), s, r);
  const visibleRight = windowToPct(w.visibleEnd, isNextDay(w.visibleEnd), s, r);
  const optimalLeft = windowToPct(w.optimalStart, isNextDay(w.optimalStart), s, r);
  const optimalRight = windowToPct(w.optimalEnd, isNextDay(w.optimalEnd), s, r);
  const moonLeft = w.moonConflictStart
    ? windowToPct(w.moonConflictStart, isNextDay(w.moonConflictStart), s, r)
    : null;
  const moonRight = w.moonConflictEnd
    ? windowToPct(w.moonConflictEnd, isNextDay(w.moonConflictEnd), s, r)
    : null;
  const cloudLeft = w.cloudRiskStart
    ? windowToPct(w.cloudRiskStart, isNextDay(w.cloudRiskStart), s, r)
    : null;
  const cloudRight = w.cloudRiskEnd
    ? windowToPct(w.cloudRiskEnd, isNextDay(w.cloudRiskEnd), s, r)
    : null;

  const isSelected = selectedTargetId === w.id;

  const content = (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,180px)_1fr_64px] gap-x-3 items-center min-h-[2.75rem] py-1.5 px-2 rounded-md border border-transparent transition-colors",
        isSelected && "ring-1 ring-cyan-500/40 border-cyan-500/20 bg-cyan-500/[0.04]"
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 pr-2 border-r border-white/[0.06]">
        <span
          className={cn(
            "text-xs font-medium break-words",
            isSelected ? "text-cyan-400" : "text-zinc-300"
          )}
          title={w.name}
        >
          {w.name}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide tabular-nums">
            SEQ {w.sequence}
          </span>
          <span className="text-[10px] tabular-nums text-zinc-500">{w.score}</span>
        </div>
      </div>
      <div className="relative h-5 rounded overflow-hidden min-w-0 astro-row-track">
        {/* Base night track (full span) */}
        <div className={cn("absolute inset-0", ASTRO_COLORS.trackBase)} />
        {/* Visible window */}
        <div
          className={cn("absolute inset-y-0", ASTRO_COLORS.visible)}
          style={{
            left: `${visibleLeft}%`,
            width: `${Math.max(2, visibleRight - visibleLeft)}%`,
          }}
        />
        {/* Optimal window */}
        <div
          className={cn("absolute inset-y-0", ASTRO_COLORS.optimal)}
          style={{
            left: `${optimalLeft}%`,
            width: `${Math.max(2, optimalRight - optimalLeft)}%`,
          }}
        />
        {/* Moon interference */}
        {moonLeft != null && moonRight != null && (
          <div
            className={cn("absolute inset-y-0", ASTRO_COLORS.moonImpact)}
            style={{
              left: `${moonLeft}%`,
              width: `${Math.max(1, moonRight - moonLeft)}%`,
            }}
          />
        )}
        {/* Cloud risk */}
        {cloudLeft != null && cloudRight != null && (
          <div
            className={cn("absolute inset-y-0", ASTRO_COLORS.cloudRisk)}
            style={{
              left: `${cloudLeft}%`,
              width: `${Math.max(1, cloudRight - cloudLeft)}%`,
            }}
          />
        )}
      </div>
      <div className="flex justify-end shrink-0">
        {w.isCurrent ? (
          <span
            className={cn(
              "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            )}
          >
            Current
          </span>
        ) : (
          <span className="w-12" aria-hidden />
        )}
      </div>
    </div>
  );

  if (onTargetClick) {
    return (
      <button
        key={w.id}
        type="button"
        onClick={() => onTargetClick(w.id)}
        className="w-full text-left block group"
      >
        {content}
      </button>
    );
  }
  return (
    <Link key={w.id} href={`/targets/${w.id}`} className="block group">
      {content}
    </Link>
  );
}

/** Astro Window System — hero layout with layered target rows */
function AstroTimeline({
  targetWindows,
  currentTargetId,
  selectedTargetId,
  onTargetClick,
  sunset: s,
  sunrise: r,
  fieldMode,
}: {
  targetWindows: TargetWindow[];
  currentTargetId?: string | null;
  selectedTargetId?: string | null;
  onTargetClick?: (id: string) => void;
  sunset: string;
  sunrise: string;
  fieldMode?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const progress = getNowPercent(s, r, now);

  const windowsWithCurrent = useMemo(() => {
    return targetWindows.map((w) => ({
      ...w,
      isCurrent: currentTargetId ? w.id === currentTargetId : w.isCurrent,
    }));
  }, [targetWindows, currentTargetId]);

  const gridCols = 24;

  return (
    <div className="min-h-[300px] flex flex-col gap-3 astro-timeline">
      {/* Header: title + session progress */}
      <div className="flex justify-between items-center shrink-0">
        <span className="text-sm font-medium text-zinc-300">Mission Timeline</span>
        <span className="text-xs tabular-nums text-zinc-500">{Math.round(progress * 100)}%</span>
      </div>

      {/* Shared grid: time axis row */}
      <div
        className="grid gap-x-3 items-center"
        style={{
          gridTemplateColumns: "minmax(0,180px) 1fr 64px",
        }}
      >
        <div className="h-5" />
        <div className="relative h-5 min-w-0">
          <div
            className="grid h-full w-full text-[10px] text-zinc-500 font-medium"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {VERTICAL_MARKERS.map((e) => {
              const pct = eventPercent(e.time, s, r, e.nextDay);
              const col = Math.round(pct * (gridCols - 1)) + 1;
              const displayTime =
                e.label === "Sunset"
                  ? MOCK_NIGHT.sunset
                  : e.label === "Dark"
                    ? MOCK_NIGHT.astronomicalDarknessStart
                    : e.label === "Moonset"
                      ? MOCK_NIGHT.moonset
                      : MOCK_NIGHT.sunrise;
              return (
                <Tooltip key={e.label} content={`${e.label}: ${displayTime}`}>
                  <span
                    className="justify-self-center whitespace-nowrap"
                    style={{ gridColumn: col } as React.CSSProperties}
                  >
                    {displayTime}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div />
      </div>

      {/* Base night track + NOW marker row (aligns with target rows) */}
      <div
        className="grid gap-x-3 items-start"
        style={{ gridTemplateColumns: "minmax(0,180px) 1fr 64px" }}
      >
        <div className="h-1.5" />
        <div className="relative h-1.5 rounded-full overflow-hidden min-w-0">
          <div
            className={cn("absolute inset-0 rounded-full", ASTRO_COLORS.trackBase)}
            style={{ left: `${darkX}%`, width: `${sunriseX - darkX}%` }}
          />
          <div className="absolute inset-0 pointer-events-none z-10">
            <NowMarker sunset={s} sunrise={r} compact stacked />
          </div>
        </div>
        <div />
      </div>

      {/* Target rows */}
      <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
        {windowsWithCurrent.map((w) => (
          <AstroTargetRow
            key={w.id}
            w={w}
            sunset={s}
            sunrise={r}
            selectedTargetId={selectedTargetId ?? null}
            onTargetClick={onTargetClick}
            fieldMode={fieldMode}
          />
        ))}
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-white/[0.06] shrink-0">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2.5 h-1.5 rounded-sm shrink-0",
                item.key === "now" ? "bg-cyan-400" : item.color
              )}
            />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Legacy HeroTimeline — uses MissionTarget, simple bars (for backward compat) */
function HeroTimelineLegacy({
  targets,
  onTargetClick,
  selectedTargetId,
  currentTargetId,
  missionDate,
  sunset: s,
  sunrise: r,
}: {
  targets: MissionTarget[];
  onTargetClick?: (t: MissionTarget) => void;
  selectedTargetId: string | null;
  currentTargetId?: string | null;
  missionDate?: string;
  sunset: string;
  sunrise: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const progress = getNowPercent(s, r, now);
  const bestNow = missionDate ? getBestTargetNow(targets, now, missionDate) : null;

  const windows = useMemo(() => {
    const count = targets.length > 0 ? targets.length : 4;
    const list: TargetWindow[] = [];
    for (let i = 0; i < count; i++) {
      const mock = MOCK_TARGET_WINDOWS[i % MOCK_TARGET_WINDOWS.length]!;
      const t = targets[i];
      list.push({
        ...mock,
        id: t?.targetId ?? mock.id,
        name: t?.targetName ?? mock.name,
        sequence: t?.sequenceIndex ?? i + 1,
        score: t?.score ?? mock.score,
        isCurrent: currentTargetId === (t?.targetId ?? mock.id),
      });
    }
    return list;
  }, [targets, currentTargetId]);

  const handleClick = (id: string) => {
    const t = targets.find((x) => x.targetId === id);
    if (t && onTargetClick) onTargetClick(t);
  };

  return (
    <AstroTimeline
      targetWindows={targets.length > 0 ? windows : MOCK_TARGET_WINDOWS}
      currentTargetId={currentTargetId}
      selectedTargetId={selectedTargetId}
      onTargetClick={onTargetClick ? handleClick : undefined}
      sunset={s}
      sunrise={r}
    />
  );
}

function getBestTargetNow(
  targets: MissionTarget[],
  now: Date,
  missionDate: string
): MissionTarget | null {
  const base = new Date(missionDate);
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();
  const activeTargets = targets.filter((t) => {
    const [sh, sm] = t.plannedWindowStart.split(":").map(Number);
    const [eh, em] = t.plannedWindowEnd.split(":").map(Number);
    const start = new Date(y, m, d, sh ?? 0, sm ?? 0, 0, 0);
    const end = new Date(y, m, (eh ?? 0) < 6 ? d + 1 : d, eh ?? 0, em ?? 0, 0, 0);
    return now >= start && now <= end;
  });
  if (activeTargets.length === 0) return null;
  return activeTargets.sort((a, b) => {
    const [ah, am] = a.plannedWindowEnd.split(":").map(Number);
    const [bh, bm] = b.plannedWindowEnd.split(":").map(Number);
    const aEnd = new Date(y, m, (ah ?? 0) < 6 ? d + 1 : d, ah ?? 0, am ?? 0, 0, 0);
    const bEnd = new Date(y, m, (bh ?? 0) < 6 ? d + 1 : d, bh ?? 0, bm ?? 0, 0, 0);
    return aEnd.getTime() - bEnd.getTime();
  })[0];
}

const TIMELINE_COLORS = {
  trackBase: "bg-zinc-700/50",
  captureWindow: "bg-[var(--astro-optimal,rgba(99,102,241,0.6))]",
  nowMarker: "bg-cyan-400",
  postMoonset: "bg-violet-500/25",
} as const;

interface MissionTimelineProps {
  targets: MissionTarget[];
  onTargetClick?: (target: MissionTarget) => void;
  missionDate?: string;
  reduceMotion?: boolean;
  compact?: boolean;
  /** Hero mode: Astro Window System with layered target rows */
  hero?: boolean;
  selectedTargetId?: string | null;
  currentTargetId?: string | null;
  /** Enable field-mode palette (night vision) */
  fieldMode?: boolean;
}

export function MissionTimeline({
  targets,
  onTargetClick,
  missionDate,
  compact = false,
  hero = false,
  selectedTargetId = null,
  currentTargetId = null,
  fieldMode = false,
}: MissionTimelineProps) {
  if (compact && !hero) {
    return (
      <CompactTimeline
        targets={targets}
        onTargetClick={onTargetClick}
      />
    );
  }

  if (hero) {
    return (
      <HeroTimelineLegacy
        targets={targets}
        onTargetClick={onTargetClick}
        selectedTargetId={selectedTargetId}
        currentTargetId={currentTargetId}
        missionDate={missionDate}
        sunset={sunset}
        sunrise={sunrise}
      />
    );
  }

  return (
    <DefaultTimeline
      targets={targets}
      onTargetClick={onTargetClick}
      sunset={sunset}
      sunrise={sunrise}
    />
  );
}

/** Compact timeline for dashboard */
function CompactTimeline({
  targets,
  onTargetClick,
}: {
  targets: MissionTarget[];
  onTargetClick?: (t: MissionTarget) => void;
}) {
  const useMock = targets.length === 0;
  const mockWindows = MOCK_TARGET_WINDOWS.slice(0, 4);

    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex justify-between text-[10px] text-zinc-500 mb-2 px-0.5 font-medium">
          <span>Sunset {MOCK_NIGHT.sunset}</span>
          <span>Dark {MOCK_NIGHT.astronomicalDarknessStart}</span>
          <span>Moonset {MOCK_NIGHT.moonset}</span>
          <span>Sunrise {MOCK_NIGHT.sunrise}</span>
        </div>
        <div className="relative h-12 shrink-0">
          <div className={cn("absolute inset-0 left-0 right-0 top-3 h-2 rounded-full", TIMELINE_COLORS.trackBase)} />
          {VERTICAL_MARKERS.map((m) => {
            const pct = segPct(m.time, m.nextDay);
            return (
              <Tooltip key={m.label + m.time} content={`${m.label}: ${m.time}`}>
                <div
                  className="absolute top-2 bottom-0 w-px bg-zinc-500/75 z-[1]"
                  style={{ left: `${pct}%` }}
                  role="presentation"
                />
              </Tooltip>
            );
          })}
          <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-[2]">
            <NowMarker sunset={sunset} sunrise={sunrise} compact />
          </div>
        </div>
        <div className="space-y-2.5 mt-3 flex-1 min-h-0 overflow-auto">
        {useMock
          ? mockWindows.map((w) => {
              const left = windowToPct(w.visibleStart, false, sunset, sunrise);
              const endPct = windowToPct(w.visibleEnd, isNextDay(w.visibleEnd), sunset, sunrise);
              const width = Math.max(8, endPct - left);
              const content = (
                <div className="group flex items-center gap-3 py-0.5">
                  <span className="w-16 shrink-0 text-xs font-medium text-zinc-400 truncate">
                    {w.name.split(" ")[0]}
                  </span>
                  <div className="relative flex-1 h-3 rounded overflow-hidden bg-zinc-800/80 min-w-0">
                    <div
                      className={cn("absolute inset-y-0 rounded", TIMELINE_COLORS.captureWindow)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>
                </div>
              );
              return (
                <Link key={w.id} href={`/targets/${w.id}`}>
                  {content}
                </Link>
              );
            })
          : targets.map((t) => {
            const endH = parseTime(t.plannedWindowEnd);
            const endNextDay = endH < 6;
            const left = windowToPct(t.plannedWindowStart, false, sunset, sunrise);
            const endPct = windowToPct(t.plannedWindowEnd, endNextDay, sunset, sunrise);
            const width = Math.max(8, endPct - left);
            const content = (
              <div className="group flex items-center gap-3 py-0.5">
                  <span className="w-16 shrink-0 text-xs font-medium text-zinc-400 truncate">
                  {t.targetName.split(" ")[0]}
                </span>
                  <div className="relative flex-1 h-3 rounded overflow-hidden bg-zinc-800/80 min-w-0">
                  <div
                      className={cn("absolute inset-y-0 rounded", TIMELINE_COLORS.captureWindow)}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
              </div>
            );
            return onTargetClick ? (
              <button key={t.targetId} type="button" onClick={() => onTargetClick(t)} className="w-full text-left block">
                {content}
              </button>
            ) : (
              <Link key={t.targetId} href={`/targets/${t.targetId}`}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

/** Default timeline (missions/new, etc.) */
function DefaultTimeline({
  targets,
  onTargetClick,
  sunset: s,
  sunrise: r,
}: {
  targets: MissionTarget[];
  onTargetClick?: (t: MissionTarget) => void;
  sunset: string;
  sunrise: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Tonight&apos;s Imaging Schedule</h3>
      <div className="relative grid grid-cols-[4rem_1fr] gap-x-3">
        <div className="absolute top-0 bottom-0 left-[4.75rem] right-4 pointer-events-none z-0" aria-hidden>
          {VERTICAL_MARKERS.map((e) => {
            const pct = eventPercent(e.time, s, r, e.nextDay) * 100;
            return (
              <div
                key={e.label + e.time}
                className="absolute top-0 bottom-0 w-px bg-zinc-500/20 -translate-x-1/2"
                style={{ left: `${pct}%` }}
              />
            );
          })}
        </div>
        <div
          className="absolute top-0 bottom-0 left-[4.75rem] right-0 pointer-events-none col-start-2 overflow-visible z-10"
          aria-hidden
        >
          <NowMarker sunset={s} sunrise={r} />
        </div>
        <div className="col-start-1 col-end-3">
          <div className="relative h-20 rounded-lg border border-neutral-800 bg-zinc-900/90 p-3">
            <div className={cn("absolute left-[4.75rem] right-4 top-10 h-2 rounded-full", TIMELINE_COLORS.trackBase)} />
            <div
              className="absolute top-10 h-2 rounded-full bg-zinc-600/50"
              style={{
                left: `calc(4.75rem + (100% - 5.75rem) * ${sunsetX / 100})`,
                width: `calc((100% - 5.75rem) * ${(darkX - sunsetX) / 100})`,
              }}
            />
            <div
              className={cn("absolute top-10 h-2 rounded-full", TIMELINE_COLORS.captureWindow)}
              style={{
                left: `calc(4.75rem + (100% - 5.75rem) * ${darkX / 100})`,
                width: `calc((100% - 5.75rem) * ${(moonsetX - darkX) / 100})`,
              }}
            />
            <div
              className={cn("absolute top-10 h-2 rounded-full", TIMELINE_COLORS.postMoonset)}
              style={{
                left: `calc(4.75rem + (100% - 5.75rem) * ${moonsetX / 100})`,
                width: `calc((100% - 5.75rem) * ${(sunriseX - moonsetX) / 100})`,
              }}
            />
            <div className="absolute left-[4.75rem] right-4 top-14 text-xs text-zinc-400">
              {VERTICAL_MARKERS.map((e) => {
                const pct = eventPercent(e.time, s, r, e.nextDay) * 100;
                const displayTime =
                  e.label === "Sunset"
                    ? MOCK_NIGHT.sunset
                    : e.label === "Dark"
                      ? MOCK_NIGHT.astronomicalDarknessStart
                      : e.label === "Moonset"
                        ? MOCK_NIGHT.moonset
                        : MOCK_NIGHT.sunrise;
                return (
                  <Tooltip key={e.label + e.time} content={`${e.label}: ${displayTime}`}>
                    <span
                      className="absolute -translate-x-1/2 whitespace-nowrap"
                      style={{ left: `${pct}%` }}
                    >
                      {e.label} {displayTime}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          {targets.length > 0
            ? targets.map((t) => {
            const endH = parseTime(t.plannedWindowEnd);
            const endNextDay = endH < 6;
                const left = windowToPct(t.plannedWindowStart, false, s, r);
                const endPct = windowToPct(t.plannedWindowEnd, endNextDay, s, r);
            const width = Math.max(5, endPct - left);
            const content = (
              <div className="group flex items-center gap-3 py-0.5 rounded transition-colors">
                <span className="w-16 shrink-0 text-xs font-medium text-zinc-400 group-hover:text-cyan-400/90">
                  {t.targetName.split(" ")[0]}
                </span>
                    <div className="relative flex-1 h-5 rounded overflow-hidden bg-zinc-800/80 min-w-0">
                  <div
                    className={cn(
                          "absolute inset-y-0 rounded group-hover:opacity-100 transition-opacity",
                      TIMELINE_COLORS.captureWindow
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
              </div>
            );
            return onTargetClick ? (
              <button
                key={t.targetId}
                type="button"
                onClick={() => onTargetClick(t)}
                className="w-full text-left block"
              >
                {content}
              </button>
            ) : (
              <Link key={t.targetId} href={`/targets/${t.targetId}`}>
                {content}
              </Link>
            );
              })
            : MOCK_TARGET_WINDOWS.slice(0, 4).map((w) => {
                const left = windowToPct(w.visibleStart, false, s, r);
                const endPct = windowToPct(w.visibleEnd, isNextDay(w.visibleEnd), s, r);
                const width = Math.max(5, endPct - left);
                return (
                  <Link key={w.id} href={`/targets/${w.id}`}>
                    <div className="group flex items-center gap-3 py-0.5 rounded transition-colors">
                      <span className="w-16 shrink-0 text-xs font-medium text-zinc-400">
                        {w.name.split(" ")[0]}
                      </span>
                      <div className="relative flex-1 h-5 rounded overflow-hidden bg-zinc-800/80 min-w-0">
                        <div
                          className={cn("absolute inset-y-0 rounded", TIMELINE_COLORS.captureWindow)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
          })}
        </div>
      </div>
    </div>
  );
}
