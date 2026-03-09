"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DISPLAY_NAMES: Record<string, string> = {
  Andromeda: "Andromeda Galaxy",
  Orion: "Orion Nebula",
  Pleiades: "Pleiades",
  Hercules: "Hercules Cluster",
  Whirlpool: "Whirlpool Galaxy",
  "Bode's Galaxy": "Bode's Galaxy",
};

const INITIAL_TARGETS = [
  { name: "Andromeda", score: 0.62 },
  { name: "Orion", score: 0.86 },
  { name: "Pleiades", score: 0.51 },
  { name: "Hercules", score: 0.73 },
  { name: "Whirlpool", score: 0.69 },
  { name: "Bode's Galaxy", score: 0.64 },
];

const UPCOMING_EVENTS = [
  { time: "01:22", event: "Meridian Flip" },
  { time: "02:05", event: "Moon Glare Increasing" },
  { time: "02:40", event: "Target Setting" },
];

// Removed motion.div bar animations — static bars for performance

const RECOMMENDATIONS = [
  { min: 0.75, message: "Continue capture" },
  { min: 0.5, message: "Switch target soon" },
  { min: 0, message: "Pause due to conditions" },
] as const;

function getRecommendation(score: number): string {
  const rec = RECOMMENDATIONS.find((r) => score >= r.min);
  return rec?.message ?? "Pause due to conditions";
}

/** Slightly jitter scores within bounds (0.2–0.95) */
function jitterScores(
  targets: { name: string; score: number }[]
): { name: string; score: number }[] {
  return targets.map((t) => {
    const delta = (Math.random() - 0.5) * 0.12;
    const next = Math.max(0.2, Math.min(0.95, t.score + delta));
    return { name: t.name, score: Math.round(next * 100) / 100 };
  });
}

interface AdaptiveMissionCardProps {
  compact?: boolean;
}

export function AdaptiveMissionCard({ compact }: AdaptiveMissionCardProps) {
  const [targets, setTargets] = useState(INITIAL_TARGETS);

  useEffect(() => {
    const interval = setInterval(() => {
      setTargets((prev) => jitterScores(prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const best = targets.reduce((a, b) => (a.score >= b.score ? a : b));
  const confidence = Math.round(best.score * 100);
  const recommendation = getRecommendation(best.score);

  if (compact) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5">
        <h2 className="dash-section-title mb-1.5">Adaptive Mission Control</h2>
        <div className="space-y-1.5">
          <div>
            <div className="dash-pill text-zinc-500">Recommended Target</div>
            <div className="text-[11px] font-medium text-zinc-300 mt-0.5">
              {DISPLAY_NAMES[best.name] ?? best.name}
            </div>
          </div>
          <div>
            <div className="dash-pill text-zinc-500">Confidence</div>
            <div className="text-[11px] font-medium text-indigo-400/90 mt-0.5">{confidence}%</div>
          </div>
          <div>
            <div className="dash-pill text-zinc-500">Recommendation</div>
            <div
              className={cn(
                "text-[11px] font-medium mt-0.5",
                recommendation === "Continue capture" && "text-emerald-400/90",
                recommendation === "Switch target soon" && "text-amber-400/90",
                recommendation === "Pause due to conditions" && "text-rose-400/90"
              )}
            >
              {recommendation}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1.5">Upcoming Events</div>
            <ul className="space-y-0.5 text-xs">
              {UPCOMING_EVENTS.map((e) => (
                <li key={e.time + e.event} className="flex justify-between gap-2 text-neutral-400">
                  <span className="text-neutral-500 tabular-nums">{e.time}</span>
                  <span>{e.event}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-1.5">Target Confidence</div>
            <div className="space-y-1.5">
              {targets.map((t) => {
                const pct = Math.round(t.score * 100);
                const isBest = t.name === best.name;
                return (
                  <div key={t.name} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-20 text-xs shrink-0 truncate",
                        isBest ? "font-medium text-indigo-400" : "text-neutral-500"
                      )}
                    >
                      {t.name}
                    </span>
                    <div className="flex-1 min-w-0 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isBest ? "bg-indigo-500/50" : "bg-indigo-500/30"
                        )}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] text-neutral-500 tabular-nums shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium text-white/70">Adaptive Mission Control</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 1. Current Recommended Target */}
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wide">
            Current Recommended Target
          </div>
          <div className="mt-0.5 font-semibold text-zinc-100">
            {DISPLAY_NAMES[best.name] ?? best.name}
          </div>
        </div>

        {/* 2. Confidence Score */}
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wide">
            Confidence Score
          </div>
          <div className="mt-0.5 text-base font-semibold text-indigo-400">
            {confidence}%
          </div>
        </div>

        {/* 3. Recommendation */}
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wide">
            Recommendation
          </div>
          <div
            className={cn(
              "mt-0.5 text-sm font-medium",
              recommendation === "Continue capture" && "text-emerald-400",
              recommendation === "Switch target soon" && "text-amber-400",
              recommendation === "Pause due to conditions" && "text-rose-400"
            )}
          >
            {recommendation}
          </div>
        </div>

        {/* 4. Upcoming Events */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Upcoming Events
          </div>
          <ul className="space-y-1.5 text-sm">
            {UPCOMING_EVENTS.map((e) => (
              <li
                key={e.time + e.event}
                className="flex justify-between gap-2 text-white/80"
              >
                <span className="text-white/50 tabular-nums">{e.time}</span>
                <span>{e.event}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Confidence Bars */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Target Confidence
          </div>
          <div className="space-y-3">
            {targets.map((t) => {
              const pct = Math.round(t.score * 100);
              const isBest = t.name === best.name;
              return (
                <div
                  key={t.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "w-24 text-sm shrink-0",
                      isBest ? "font-medium text-indigo-400" : "text-white/60"
                    )}
                  >
                    {t.name}
                  </span>
                  <div className="flex-1 min-w-0 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        isBest ? "bg-indigo-500/50" : "bg-indigo-500/30"
                      )}
                      style={{ width: pct + "%" }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-white/50 tabular-nums shrink-0">
                    {pct + "%"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
