"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_TARGETS } from "@/lib/mock/targets";
import { MOCK_NIGHT } from "@/lib/mock/night";
import { useSkyModel, type SkyTargetMarker } from "@/lib/sky/useSkyModel";

import starsData from "@/data/stars_2000.json";
import constellationsData from "@/data/constellations.json";

// Dynamic import to avoid SSR (Three.js needs DOM/WebGL)
const SkyCanvas = dynamic(() => import("./LiveSkyCanvas").then((m) => m.LiveSkyCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg bg-neutral-950/50 text-neutral-500 text-sm font-mono">
      Loading sky...
    </div>
  ),
});

const STARS = starsData as Array<{ id: number; raHours: number; decDeg: number; mag: number; name?: string }>;
const CONSTELLATIONS = constellationsData as Array<{ name: string; segments: [number, number][] }>;

const TARGET_COLORS: Record<string, string> = {
  galaxy: "#22d3ee",
  nebula: "#2dd4bf",
  open_cluster: "#67e8f9",
  globular_cluster: "#5eead4",
  planet: "#fbbf24",
};

function getTonightBase(): Date {
  const now = new Date();
  const evening = new Date(now);
  evening.setHours(20, 0, 0, 0);
  if (now.getHours() < 6) {
    evening.setDate(evening.getDate() - 1);
  }
  return evening;
}

export interface LiveSkyViewProps {
  compact?: boolean;
  embedded?: boolean;
  /** Bortle class from active location (overrides mock default) */
  locationBortle?: number;
}

export const LiveSkyView = React.memo(function LiveSkyView({
  compact,
  embedded,
  locationBortle,
}: LiveSkyViewProps) {
  const { activeLocationId } = useAppStore();
  const activeLoc =
    MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ?? MOCK_LOCATIONS[0];

  const [showConstellations, setShowConstellations] = useState(true);
  const [showTargets, setShowTargets] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [hoveredTarget, setHoveredTarget] = useState<SkyTargetMarker | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [orbitKey, setOrbitKey] = useState(0);

  const tonightBase = useMemo(() => getTonightBase(), []);
  const [timeOffsetHours, setTimeOffsetHours] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const date = useMemo(() => {
    const d = new Date(tonightBase);
    d.setTime(d.getTime() + timeOffsetHours * 60 * 60 * 1000);
    return d;
  }, [tonightBase, timeOffsetHours]);

  const observer = useMemo(
    () => ({
      name: activeLoc.name,
      lat: activeLoc.lat,
      lon: activeLoc.lon,
    }),
    [activeLoc.name, activeLoc.lat, activeLoc.lon]
  );

  const targetsForSky = useMemo(
    () =>
      MOCK_TARGETS.slice(0, 8).map((t) => ({
        id: t.id,
        name: t.name,
        ra: t.ra,
        dec: t.dec,
        color: TARGET_COLORS[t.type] ?? "#22d3ee",
      })),
    []
  );

  const skyModel = useSkyModel({
    observer,
    date,
    toggles: {
      showConstellations,
      showTargets,
      showHorizon,
    },
    stars: STARS,
    constellations: CONSTELLATIONS,
    targets: targetsForSky,
  });

  const bortle = locationBortle ?? activeLoc.bortle ?? MOCK_NIGHT.bortle;
  const moonPercent = MOCK_NIGHT.moonPhasePercent;

  const handleRecenter = useCallback(() => {
    setOrbitKey((k) => k + 1);
  }, []);

  const handleTargetHover = useCallback(
    (target: SkyTargetMarker | null, pos?: { x: number; y: number }) => {
      setHoveredTarget(target);
      if (target && pos) {
        setTooltipPos(pos);
      } else {
        setTooltipPos(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeOffsetHours((h) => {
        const next = h + 0.05; // ~3 min per tick at 100ms
        if (next >= 6) return -6;
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const webglAvailable = useMemo(() => {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setCanvasSize((prev) =>
          prev?.width === width && prev?.height === height ? prev : { width, height }
        );
        break;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const canRenderCanvas =
    webglAvailable && canvasSize && canvasSize.width >= 200 && canvasSize.height >= 200;

  return (
    <div
      className={cn(
        !embedded && "rounded-xl border border-neutral-800 bg-neutral-900",
        "overflow-hidden relative",
        compact && !embedded && "p-3"
      )}
    >
      {/* Header - minimal when embedded (HUD takes over) */}
      <div
        className={cn(
          "flex items-start justify-between gap-2 pb-2",
          embedded ? "px-2 pt-2" : "px-4 pt-4"
        )}
      >
        {!embedded && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-white">Live Sky View</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time sky orientation and target positions
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRecenter} className="h-7 px-2 text-xs">
              Recenter
            </Button>
          </>
        )}
      </div>

      {/* Time scrubber - UI only */}
      <div
        className={cn(
          "px-4 pb-2 flex flex-col gap-2",
          embedded && "px-2"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-neutral-500 shrink-0">
            Tonight ±6h
          </span>
          <input
            type="range"
            min={-6}
            max={6}
            step={0.25}
            value={timeOffsetHours}
            onChange={(e) => setTimeOffsetHours(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full bg-neutral-800 appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="font-mono text-[10px] text-neutral-400 tabular-nums w-12">
            {timeOffsetHours >= 0 ? "+" : ""}
            {timeOffsetHours.toFixed(1)}h
          </span>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={cn(
              "shrink-0 w-8 h-8 rounded-md border font-mono text-xs transition-colors",
              isPlaying
                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                : "border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-400"
            )}
          >
            {isPlaying ? "||" : "▶"}
          </button>
        </div>
      </div>

      {/* Canvas container with HUD overlay */}
      <div className={cn("relative pb-2", embedded ? "px-2" : "px-4")}>
        <div
          ref={canvasWrapperRef}
          className="relative mt-1 h-[320px] md:h-[480px] w-full rounded-xl border border-neutral-800/80 bg-neutral-950/60 overflow-hidden"
        >
          {!webglAvailable ? (
            <div className="flex h-full w-full items-center justify-center text-center text-sm text-neutral-500 px-4 font-mono">
              WebGL unavailable. Try disabling low power mode or hardware acceleration.
            </div>
          ) : !canRenderCanvas ? (
            <div className="flex h-full w-full items-center justify-center text-center text-sm text-neutral-500 font-mono">
              Initializing sky renderer…
            </div>
          ) : (
            <>
              <SkyCanvas
                starPositions={skyModel.starPositions}
                starSizes={skyModel.starSizes}
                starCount={skyModel.starCount}
                constellationLinePoints={skyModel.constellationLinePoints}
                constellationLineCount={skyModel.constellationLineCount}
                targetMarkers={skyModel.targetMarkers}
                showConstellations={showConstellations}
                showTargets={showTargets}
                showHorizon={showHorizon}
                hoveredTargetId={hoveredTarget?.id ?? null}
                onTargetHover={handleTargetHover}
                orbitKey={orbitKey}
              />

              {/* HUD Overlay - Top left */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                <div className="bg-neutral-950/90 border border-neutral-800/80 rounded-lg px-3 py-2 space-y-0.5">
                  <div className="font-mono text-[11px] text-cyan-400/90">
                    {observer.name ?? "Site"}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 tabular-nums">
                    {skyModel.meta.localTimeString}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    Bortle {bortle} · Moon {moonPercent}%
                  </div>
                </div>
              </div>

              {/* HUD Overlay - Top right (legend/toggles) */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
                <div className="bg-neutral-950/90 border border-neutral-800/80 rounded-lg px-3 py-2 space-y-1">
                  <HudIndicator
                    label="Targets"
                    on={showTargets}
                    onClick={() => setShowTargets((v) => !v)}
                  />
                  <HudIndicator
                    label="Constellations"
                    on={showConstellations}
                    onClick={() => setShowConstellations((v) => !v)}
                  />
                  <HudIndicator
                    label="Horizon"
                    on={showHorizon}
                    onClick={() => setShowHorizon((v) => !v)}
                  />
                  {embedded && (
                    <button
                      type="button"
                      onClick={handleRecenter}
                      className="w-full text-left font-mono text-[10px] text-neutral-500 hover:text-cyan-400 pt-1 mt-1 border-t border-neutral-800"
                    >
                      Recenter
                    </button>
                  )}
                </div>
              </div>

              {/* HUD - Bottom left helper */}
              <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                <div className="font-mono text-[10px] text-neutral-600">
                  Drag to rotate · Scroll to zoom
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tooltip - fixed to cursor */}
        {hoveredTarget && tooltipPos && (
          <div
            className="fixed z-50 rounded-lg border border-neutral-700/80 bg-neutral-950/95 px-3 py-2 shadow-xl pointer-events-none font-mono"
            style={{
              left: tooltipPos.x + 14,
              top: tooltipPos.y + 14,
            }}
          >
            <div className="text-xs font-medium text-cyan-400">{hoveredTarget.name}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Alt {hoveredTarget.altDeg.toFixed(1)}° · Az {hoveredTarget.azDeg.toFixed(1)}°
            </div>
          </div>
        )}
      </div>

      {/* Footer - only when not embedded */}
      {!embedded && (
        <div className={cn("flex flex-wrap items-center gap-2 pt-1", "px-4 pb-4")}>
          <span className="rounded-full bg-neutral-800/60 px-2.5 py-0.5 text-[10px] text-neutral-400 font-mono">
            {observer.name ?? "Site"}
          </span>
          <span className="rounded-full bg-neutral-800/60 px-2.5 py-0.5 text-[10px] text-neutral-400 font-mono tabular-nums">
            {skyModel.meta.localTimeString}
          </span>
          <span className="rounded-full bg-neutral-800/60 px-2.5 py-0.5 text-[10px] text-neutral-500 font-mono">
            {skyModel.meta.starCountAboveHorizon} stars
          </span>
        </div>
      )}
    </div>
  );
});

const HudIndicator = React.memo(function HudIndicator({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left font-mono text-[10px] transition-colors",
        on ? "text-cyan-400" : "text-neutral-500"
      )}
    >
      {label}: {on ? "ON" : "OFF"}
    </button>
  );
});
