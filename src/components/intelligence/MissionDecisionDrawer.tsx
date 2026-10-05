"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buildEngineReasons } from "@/lib/recommendations/engineReasons";
import { rigFitLabel } from "@/lib/gear/framing";
import type {
  DashboardRecommendation,
  RejectedRecommendation,
} from "@/lib/recommendations/types";

/** Schematic FOV vs target — not a photographic composition. */
function FovSchematic({
  fovW,
  fovH,
  targetMajor,
}: {
  fovW: number;
  fovH: number;
  targetMajor: number;
}) {
  const maxFov = Math.max(fovW, fovH, 1);
  const frameW = 120;
  const frameH = Math.max(40, (fovH / fovW) * frameW);
  const scale = Math.min(frameW / maxFov, frameH / maxFov);
  const tSize = Math.min(targetMajor * scale, Math.max(frameW, frameH) * 1.2);
  return (
    <div className="mt-2">
      <div
        className="relative mx-auto border border-zinc-600 bg-zinc-950/80"
        style={{ width: frameW, height: frameH }}
        role="img"
        aria-label="Schematic field of view versus target size"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/70 bg-indigo-500/15"
          style={{ width: tSize, height: tSize }}
        />
      </div>
      <p className="mt-1.5 text-center text-[10px] text-zinc-600">
        Schematic only — shape and camera rotation unknown
      </p>
    </div>
  );
}

type DrawerTarget =
  | (DashboardRecommendation & { isRejected: false })
  | (RejectedRecommendation & { isRejected: true });

interface MissionDecisionDrawerProps {
  target: DrawerTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

function RecommendedEvidence({ target }: { target: DashboardRecommendation }) {
  const engineReasons = buildEngineReasons(target);

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Engine reasoning
        </p>
        <p className="mb-2 text-[10px] text-zinc-600">
          Calculated from window, altitude, and Moon data — not AI-generated.
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-zinc-300">
          {engineReasons.map((reason, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400/70" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          When you can image
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          Usable window{" "}
          <span className="font-medium text-zinc-100 tabular-nums">
            {target.windowLabel}
          </span>{" "}
          ({target.windowDurationMinutes} minutes). This is when the target is
          above your {target.minAltitudeDeg}° altitude floor during
          astronomical darkness and inside your session.
        </p>
        {target.narrowWindow && (
          <p className="mt-1.5 text-xs text-amber-300/80">
            Narrow window — under 90 minutes. Plan to start on time.
          </p>
        )}
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          How high it gets
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          Peaks around{" "}
          <span className="font-medium text-zinc-100">
            {target.peakAltitudeDeg.toFixed(0)}°
          </span>
          {target.peakAtLabel !== "—" ? (
            <>
              {" "}
              at{" "}
              <span className="tabular-nums text-zinc-100">
                {target.peakAtLabel}
              </span>
            </>
          ) : null}
          . Higher altitude usually means less air and haze to shoot through.
          For this site, the geometric maximum for this target is about{" "}
          {target.maxPossibleAltitudeDeg.toFixed(0)}°.
        </p>
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Moon during that window
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          {target.moonPhaseLabel ? (
            <>
              {target.moonPhaseLabel}
              {target.moonInterference
                ? ` · ${target.moonInterference} interference`
                : ""}
              .{" "}
            </>
          ) : null}
          Closest approach to the target in the usable window:{" "}
          <span className="font-medium text-zinc-100 tabular-nums">
            {target.minMoonSeparationDeg.toFixed(0)}°
          </span>
          . Your minimum allowed separation is {target.moonToleranceDeg}°.
        </p>
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          What shaped the score
        </p>
        <ul className="space-y-1.5 text-sm text-zinc-300">
          <li>
            Altitude score:{" "}
            <span className="tabular-nums text-zinc-100">
              {target.altitudeScore}/10
            </span>
          </li>
          <li>
            Moon separation score:{" "}
            <span className="tabular-nums text-zinc-100">
              {target.moonSeparationScore}/10
            </span>
          </li>
          <li>
            Combined score:{" "}
            <span className="tabular-nums text-zinc-100">{target.score}</span>{" "}
            (altitude and Moon only)
          </li>
        </ul>
        {target.whyIncluded && (
          <p className="mt-2 text-xs text-zinc-500">{target.whyIncluded}</p>
        )}
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Rig framing
        </p>
        <p className="text-sm leading-relaxed text-zinc-300">
          <span className="font-medium text-zinc-100">
            {rigFitLabel(target.rigFit)}
          </span>
          {" — "}
          {target.rigFitDetail}
        </p>
        {target.fovWidthArcmin != null &&
          target.fovHeightArcmin != null &&
          target.targetSizeMajorArcmin != null && (
            <>
              <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">
                FOV {target.fovWidthArcmin.toFixed(1)}′ ×{" "}
                {target.fovHeightArcmin.toFixed(1)}′ · target major{" "}
                {target.targetSizeMajorArcmin.toFixed(1)}′
                {target.targetSizeKind
                  ? ` (${target.targetSizeKind.replace(/_/g, " ")})`
                  : ""}
              </p>
              {target.targetSizeSource && (
                <p className="mt-1 text-[10px] text-zinc-600">
                  Size source: {target.targetSizeSource}
                </p>
              )}
              <FovSchematic
                fovW={target.fovWidthArcmin}
                fovH={target.fovHeightArcmin}
                targetMajor={target.targetSizeMajorArcmin}
              />
            </>
          )}
        {target.rigFit === "unknown" &&
          target.rigFitDetail.includes("sensor") && (
            <p className="mt-2 text-xs">
              <Link
                href="/settings?tab=gear"
                className="text-indigo-400 hover:underline"
              >
                Edit active rig
              </Link>{" "}
              to set sensor width and height.
            </p>
          )}
      </section>

      <section className="border-t border-zinc-800/80 pt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Not calculated yet
        </p>
        <ul className="space-y-1 text-sm text-zinc-400">
          <li>Exposure time and camera settings</li>
          <li>Weather — see Observing Conditions (separate from this score)</li>
        </ul>
      </section>
    </div>
  );
}

function RejectedEvidence({ target }: { target: RejectedRecommendation }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-zinc-300">
        {target.reasonLabel}.
      </p>
      <p className="text-sm text-zinc-500">
        Try a different date, a lower minimum altitude, or a wider Moon
        tolerance if that matches your goals.
      </p>
    </div>
  );
}

export function MissionDecisionDrawer({
  target,
  isOpen,
  onClose,
}: MissionDecisionDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && target && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 right-0 top-0 z-50 w-[min(380px,90vw)] max-w-full overflow-y-auto border-l border-zinc-800 bg-zinc-900 shadow-xl"
          >
            <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-display truncate text-base font-semibold text-zinc-100">
                    {target.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase",
                        target.isRejected
                          ? "bg-zinc-700/60 text-zinc-400"
                          : "bg-indigo-500/20 text-indigo-300",
                      )}
                    >
                      {target.isRejected ? "Not suitable" : "Recommended"}
                    </span>
                    {!target.isRejected && (
                      <span className="font-mono text-xs tabular-nums text-zinc-500">
                        Score: {(target as DashboardRecommendation).score}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="shrink-0"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              {target.isRejected ? (
                <RejectedEvidence target={target} />
              ) : (
                <RecommendedEvidence target={target} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export type { DrawerTarget };
