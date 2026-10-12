"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  activeSegmentsAt,
  buildNightSimModel,
  formatSimClock,
  pctAlongSession,
} from "@/lib/missions/nightSimulation";
import { moonAtSite } from "@/lib/missions/simMoon";
import type { MissionTarget } from "@/lib/types";

interface NightSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MissionTarget[];
  dateTime: string;
  sessionEndAt?: string | null;
  siteTimezone?: string | null;
  lat?: number | null;
  lon?: number | null;
}

const SPEEDS = [1, 5, 15];

export function NightSimulationModal({
  isOpen,
  onClose,
  targets,
  dateTime,
  sessionEndAt = null,
  siteTimezone = null,
  lat = null,
  lon = null,
}: NightSimulationModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  const model = useMemo(
    () =>
      buildNightSimModel({
        dateTime,
        sessionEndAt,
        targets,
      }),
    [dateTime, sessionEndAt, targets],
  );

  const totalNightMinutes = model.durationMinutes;

  useEffect(() => {
    if (isOpen) {
      setCurrentTimeMinutes(0);
      setIsPlaying(false);
    }
  }, [isOpen, dateTime, sessionEndAt]);

  const tick = useCallback(
    (now: number) => {
      const elapsed = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setCurrentTimeMinutes((prev) => {
        const next = prev + elapsed * 60 * speed;
        return Math.min(totalNightMinutes, Math.max(0, next));
      });
      rafRef.current = requestAnimationFrame(tick);
    },
    [speed, totalNightMinutes],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (isPlaying) {
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isOpen, isPlaying, tick]);

  useEffect(() => {
    if (!isPlaying && currentTimeMinutes >= totalNightMinutes) {
      setCurrentTimeMinutes(0);
    }
  }, [isPlaying, currentTimeMinutes, totalNightMinutes]);

  if (!isOpen) return null;

  const nowPct = (currentTimeMinutes / totalNightMinutes) * 100;
  const active = activeSegmentsAt(model, currentTimeMinutes);
  const bestTarget =
    active.length > 0
      ? active.reduce((a, b) => (a.score > b.score ? a : b))
      : null;
  const clock = formatSimClock(model, currentTimeMinutes, siteTimezone);
  const when = new Date(
    model.sessionStart.getTime() + currentTimeMinutes * 60_000,
  );
  const moon = moonAtSite(when, lat, lon);
  const startLabel = formatSimClock(model, 0, siteTimezone);
  const endLabel = formatSimClock(model, totalNightMinutes, siteTimezone);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-zinc-900 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Night Simulation</h2>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="mb-3 text-[11px] text-zinc-400 leading-snug">
            Scrubs this mission&apos;s session window
            {siteTimezone ? ` (${siteTimezone})` : ""}. Target bars use Night
            Schedule times when set, otherwise planned windows. Moon from
            Astronomy Engine when the site has coordinates.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex gap-1">
                {SPEEDS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={speed === s ? "secondary" : "ghost"}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative h-12 rounded border border-zinc-700 bg-zinc-800/50">
              <input
                type="range"
                min={0}
                max={totalNightMinutes}
                value={currentTimeMinutes}
                onChange={(e) => setCurrentTimeMinutes(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-cyan-400 shadow-lg shadow-cyan-400/50 z-10"
                style={{ left: `${nowPct}%` }}
              />
              <div className="absolute inset-0 flex justify-between items-center px-2 text-[10px] text-zinc-500 pointer-events-none">
                <span>Start {startLabel}</span>
                <span>End {endLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Time</div>
                <div className="font-mono tabular-nums">{clock}</div>
              </div>
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Moon</div>
                <div className="tabular-nums">
                  {moon.phasePct != null ? `${moon.phasePct}%` : "—"}
                  {moon.altitudeDeg != null
                    ? ` · ${moon.altitudeDeg}°`
                    : lat == null
                      ? " · add site"
                      : ""}
                </div>
              </div>
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Active</div>
                <div className="text-cyan-400 truncate">
                  {bestTarget?.targetName ?? "—"}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              {model.segments.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No scheduled or planned windows to plot. Accept a Night
                  Schedule or set planned windows on targets.
                </p>
              ) : (
                model.segments.map((seg) => {
                  const left = pctAlongSession(model, seg.start);
                  const right = pctAlongSession(model, seg.end);
                  const width = Math.max(2, right - left);
                  const isActive = active.some(
                    (a) => a.targetId === seg.targetId,
                  );
                  const isPast =
                    currentTimeMinutes >
                    (seg.end.getTime() - model.sessionStart.getTime()) /
                      60_000;

                  return (
                    <div
                      key={`${seg.targetId}-${seg.start.toISOString()}`}
                      className={`flex items-center gap-3 py-0.5 ${
                        isActive
                          ? "opacity-100"
                          : isPast
                            ? "opacity-40"
                            : "opacity-60"
                      }`}
                    >
                      <span
                        className={`w-20 shrink-0 text-xs font-mono truncate ${
                          isActive ? "text-cyan-400" : "text-zinc-400"
                        }`}
                        title={seg.targetName}
                      >
                        {seg.targetName.split(" ")[0]}
                      </span>
                      <div className="relative flex-1 h-5 rounded bg-zinc-800 overflow-hidden">
                        <div
                          className={`absolute inset-y-0 rounded transition-colors ${
                            isActive ? "bg-cyan-500" : "bg-cyan-500/50"
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-[10px] text-zinc-600 uppercase">
                        {seg.source === "scheduled" ? "Sched" : "Window"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
