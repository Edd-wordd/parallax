"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TARGETS_INITIAL = [
  { name: "Orion Nebula", score: 0.82 },
  { name: "Pleiades", score: 0.71 },
  { name: "Andromeda", score: 0.55 },
  { name: "Whirlpool", score: 0.52 },
  { name: "Hercules Cluster", score: 0.49 },
  { name: "Bode's", score: 0.45 },
];

const UPCOMING_EVENTS = [
  { time: "01:22", event: "Meridian Flip" },
  { time: "02:05", event: "Moon Glare" },
  { time: "02:40", event: "Target Setting" },
];

const RECOMMENDATIONS = [
  { min: 0.75, message: "Continue capture" },
  { min: 0.5, message: "Switch target soon" },
  { min: 0, message: "Pause due to conditions" },
] as const;

function getRecommendation(score: number): string {
  const rec = RECOMMENDATIONS.find((r) => score >= r.min);
  return rec?.message ?? "Pause due to conditions";
}

/** Slightly randomize scores within bounds (0.2–0.95) for simulation */
function jitterScores(
  targets: { name: string; score: number }[]
): { name: string; score: number }[] {
  return targets.map((t) => {
    const delta = (Math.random() - 0.5) * 0.12;
    const next = Math.max(0.2, Math.min(0.95, t.score + delta));
    return { name: t.name, score: Math.round(next * 100) / 100 };
  });
}

const BAR_TRANSITION = { duration: 0.5, ease: "easeOut" as const };

interface AdaptiveMissionControlProps {
  className?: string;
}

export function AdaptiveMissionControl({ className }: AdaptiveMissionControlProps) {
  const [targets, setTargets] = useState(TARGETS_INITIAL);

  useEffect(() => {
    const interval = setInterval(() => {
      setTargets((prev) => jitterScores(prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const best = targets.reduce((a, b) => (a.score >= b.score ? a : b));
  const confidence = Math.round(best.score * 100);
  const recommendation = getRecommendation(best.score);
  const sortedTargets = [...targets].sort((a, b) => b.score - a.score);

  return (
    <Card className={cn("border-neutral-800 bg-black/40 backdrop-blur-sm", className)}>
      <CardHeader>
        <h2 className="text-sm font-medium">Adaptive Mission Control</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 1. Current Recommended Target */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
            Current Recommended Target
          </div>
          <div className="mt-0.5 font-semibold text-zinc-100">{best.name}</div>
        </div>

        {/* 2. Confidence Score */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
            Confidence Score
          </div>
          <div className="mt-0.5 text-lg font-semibold text-cyan-400">
            {confidence}%
          </div>
        </div>

        {/* 3. Recommendation */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">
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
                key={`${e.time}-${e.event}`}
                className="flex justify-between gap-2 text-zinc-300"
              >
                <span className="text-zinc-500 tabular-nums">{e.time}</span>
                <span>{e.event}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Target Confidence Bars */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Target Confidence
          </div>
          <div className="space-y-3">
            {sortedTargets.map((t) => {
              const pct = Math.round(t.score * 100);
              const isBest = t.name === best.name;
              return (
                <div
                  key={t.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "w-28 text-sm shrink-0 truncate",
                      isBest ? "font-medium text-cyan-400" : "text-zinc-400"
                    )}
                  >
                    {t.name}
                  </span>
                  <div className="flex-1 min-w-0 h-2 rounded-full bg-zinc-700/80 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isBest
                          ? "bg-cyan-500 shadow-[0_0_8px_rgba(6_182_212/0.5)]"
                          : "bg-cyan-500/60"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={BAR_TRANSITION}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-zinc-400 tabular-nums shrink-0">
                    {pct}%
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
