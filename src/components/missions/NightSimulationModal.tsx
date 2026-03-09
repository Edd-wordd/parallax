"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapTimeToWindow, getMoonAtTime } from "@/lib/sim";
import { MOCK_NIGHT } from "@/lib/mock/night";
import type { MissionTarget } from "@/lib/types";

const parseTime = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
};

const NIGHT_START = 18;
const NIGHT_END = 30;
const SUNSET_MIN = 18 * 60 + 45;
const SUNRISE_NEXT = 24 * 60 + 6 * 60 + 12;
const NIGHT_LENGTH = SUNRISE_NEXT - SUNSET_MIN;

function hourToPct(h: number): number {
  const hNorm = h < 12 ? h + 24 : h;
  return ((hNorm - NIGHT_START) / (NIGHT_END - NIGHT_START)) * 100;
}

function minutesToTime(min: number): string {
  const total = SUNSET_MIN + min;
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

interface NightSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MissionTarget[];
}

const SPEEDS = [1, 5, 15];

export function NightSimulationModal({
  isOpen,
  onClose,
  targets,
}: NightSimulationModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  const totalNightMinutes = NIGHT_LENGTH;
  const activeWindows = mapTimeToWindow(currentTimeMinutes, targets, SUNSET_MIN);
  const bestTarget = activeWindows.length > 0
    ? activeWindows.reduce((a, b) => (a.score > b.score ? a : b))
    : null;
  const moon = getMoonAtTime(currentTimeMinutes, totalNightMinutes);

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
    [speed, totalNightMinutes]
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

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                <span>Sunset {MOCK_NIGHT.sunset}</span>
                <span>Sunrise {MOCK_NIGHT.sunrise}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Time</div>
                <div className="font-mono">{minutesToTime(currentTimeMinutes)}</div>
              </div>
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Moon</div>
                <div>{moon.moonPercent}% · {moon.moonAltitude}°</div>
              </div>
              <div className="rounded border border-zinc-700 p-2">
                <div className="text-zinc-500 text-xs">Best Target</div>
                <div className="text-cyan-400 truncate">
                  {bestTarget?.targetName ?? "—"}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              {targets.map((t) => {
                const startH = parseTime(t.plannedWindowStart);
                const endH = parseTime(t.plannedWindowEnd);
                const endNorm = endH < 6 ? endH + 24 : endH;
                const left = hourToPct(startH);
                const endPct = hourToPct(endNorm);
                const width = Math.max(5, endPct - left);
                const currentHour = (SUNSET_MIN + currentTimeMinutes) / 60;
                const currentHourNorm = currentHour < 6 ? currentHour + 24 : currentHour;
                const startNorm = startH < 6 ? startH + 24 : startH;
                const isActive = currentHourNorm >= startNorm && currentHourNorm <= endNorm;
                const isPast = currentHourNorm > endNorm;

                return (
                  <div
                    key={t.targetId}
                    className={`flex items-center gap-3 py-0.5 ${
                      isActive ? "opacity-100" : isPast ? "opacity-40" : "opacity-60"
                    }`}
                  >
                    <span
                      className={`w-16 shrink-0 text-xs font-mono ${
                        isActive ? "text-cyan-400" : "text-zinc-400"
                      }`}
                    >
                      {t.targetName.split(" ")[0]}
                    </span>
                    <div className="relative flex-1 h-5 rounded bg-zinc-800 overflow-hidden">
                      <div
                        className={`absolute inset-y-0 rounded transition-colors ${
                          isActive ? "bg-cyan-500" : "bg-cyan-500/50"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
