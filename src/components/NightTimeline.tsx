"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MOCK_NIGHT } from "@/lib/mock/night";
import { MOCK_TARGET_WINDOWS } from "@/lib/mock/targetWindows";
import { getNowPercent, eventPercent } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";

const { sunset, sunrise, astronomicalDarknessStart, moonset } = MOCK_NIGHT;

function eventPct(t: string, nextDay = false): number {
  return eventPercent(t, sunset, sunrise, nextDay) * 100;
}

type SegmentState = "unavailable" | "compromised" | "primary";

interface BarSegment {
  leftPct: number;
  widthPct: number;
  state: SegmentState;
}

function getTargetSegments(start: string, end: string): BarSegment[] {
  const darkPct = eventPct(astronomicalDarknessStart);
  const moonPct = eventPct(moonset);
  const startNextDay = end < "12:00" || end <= sunrise;
  const startPct = eventPct(start, false);
  const endPct = eventPct(end, startNextDay);
  const totalW = Math.max(5, endPct - startPct);

  const segments: BarSegment[] = [];

  if (startPct < darkPct) {
    const segEnd = Math.min(darkPct, endPct);
    segments.push({
      leftPct: startPct,
      widthPct: Math.max(2, segEnd - startPct),
      state: "unavailable",
    });
  }

  const compStart = Math.max(startPct, darkPct);
  const compEnd = Math.min(endPct, moonPct);
  if (compEnd > compStart) {
    segments.push({
      leftPct: compStart,
      widthPct: Math.max(2, compEnd - compStart),
      state: "compromised",
    });
  }

  const primStart = Math.max(startPct, moonPct);
  if (endPct > primStart) {
    segments.push({
      leftPct: primStart,
      widthPct: Math.max(2, endPct - primStart),
      state: "primary",
    });
  }

  return segments.length > 0
    ? segments
    : [{ leftPct: startPct, widthPct: totalW, state: "primary" }];
}

const EVENT_TICKS = [
  { label: "Astronomical dark", time: astronomicalDarknessStart, nextDay: false },
  { label: "Moonset", time: moonset, nextDay: false },
  { label: "Sunrise", time: sunrise, nextDay: true },
];

const STATE_COLORS: Record<SegmentState, string> = {
  unavailable: "bg-zinc-700/50",
  compromised: "bg-amber-500/20",
  primary: "bg-indigo-500/25",
};

export function NightTimeline() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowPct = now ? getNowPercent(sunset, sunrise, now) * 100 : 0;
  const nowLabel = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="space-y-1.5">
      {/* Master night rail */}
      <div className="relative h-10 rounded border border-zinc-800/60 bg-zinc-900/40 px-2.5 py-1.5">
        <div className="absolute inset-x-2.5 top-6 h-0.5 rounded-full bg-zinc-800/70" />
        {/* Twilight → dark (unavailable) */}
        <div
          className="absolute top-6 h-0.5 rounded-full bg-zinc-700/50"
          style={{
            left: "calc(0.625rem + (100% - 1.25rem) * 0)",
            width: `calc((100% - 1.25rem) * ${eventPct(astronomicalDarknessStart) / 100})`,
          }}
        />
        {/* Dark → moonset (compromised) */}
        <div
          className="absolute top-6 h-0.5 rounded-full bg-amber-500/15"
          style={{
            left: `calc(0.625rem + (100% - 1.25rem) * ${eventPct(astronomicalDarknessStart) / 100})`,
            width: `calc((100% - 1.25rem) * ${(eventPct(moonset) - eventPct(astronomicalDarknessStart)) / 100})`,
          }}
        />
        {/* Moonset → sunrise (primary) */}
        <div
          className="absolute top-6 h-0.5 rounded-full bg-indigo-500/20"
          style={{
            left: `calc(0.625rem + (100% - 1.25rem) * ${eventPct(moonset) / 100})`,
            width: `calc((100% - 1.25rem) * ${(100 - eventPct(moonset)) / 100})`,
          }}
        />

        {EVENT_TICKS.map((e) => {
          const pct = eventPercent(e.time, sunset, sunrise, e.nextDay) * 100;
          return (
            <div
              key={e.label + e.time}
              className="absolute top-1.5 bottom-1.5 w-px bg-zinc-700/60 cursor-default z-10"
              style={{ left: `calc(0.625rem + (100% - 1.25rem) * ${pct / 100})` }}
              title={`${e.label}: ${e.time}`}
            />
          );
        })}

        {mounted && now && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none z-20"
              style={{
                left: `calc(0.625rem + (100% - 1.25rem) * ${nowPct / 100})`,
                background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.25) 30%, rgba(99,102,241,0.3) 50%, rgba(99,102,241,0.25) 70%, transparent)",
              }}
              aria-hidden
            />
            <div
              className="absolute -top-3 flex justify-center -translate-x-1/2 pointer-events-none z-20"
              style={{ left: `calc(0.625rem + (100% - 1.25rem) * ${nowPct / 100})` }}
            >
              <span className="rounded px-1.5 py-0.5 text-[9px] font-display font-medium tabular-nums text-zinc-400 bg-zinc-800/90 border border-zinc-700/70">
                NOW {nowLabel}
              </span>
            </div>
          </>
        )}

        <div className="absolute left-2.5 right-2.5 top-7 flex justify-between text-[9px] tabular-nums text-zinc-500">
          <span>{sunset}</span>
          <span>{astronomicalDarknessStart}</span>
          <span>{moonset}</span>
          <span>{sunrise}</span>
        </div>
      </div>

      {/* Target rows */}
      <div className="space-y-0.5">
        {MOCK_TARGET_WINDOWS.map((w) => {
          const segments = getTargetSegments(w.start, w.end);
          return (
            <Link key={w.targetId} href={`/targets/${w.targetId}`}>
              <div className="group flex items-center gap-2 py-0.5 rounded hover:bg-zinc-800/30 transition-colors">
                <span className="w-10 shrink-0 text-[10px] dash-pill text-zinc-400 truncate">
                  {w.targetName}
                </span>
                <div className="relative flex-1 h-2.5 rounded overflow-hidden bg-zinc-800/50">
                  {segments.map((seg, i) => (
                    <div
                      key={i}
                      className={cn("absolute inset-y-0 rounded", STATE_COLORS[seg.state], "group-hover:opacity-90 transition-opacity")}
                      style={{
                        left: `${seg.leftPct}%`,
                        width: `${seg.widthPct}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
