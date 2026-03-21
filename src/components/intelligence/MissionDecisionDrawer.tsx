"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  RecommendedTarget,
  RejectedTarget,
} from "@/lib/mock/intelligenceLayer";

type DrawerTarget = (RecommendedTarget | RejectedTarget) & {
  isRejected: boolean;
};

interface MissionDecisionDrawerProps {
  target: DrawerTarget | null;
  isOpen: boolean;
  onClose: () => void;
}

function RecommendedContent({ target }: { target: RecommendedTarget }) {
  const reasons = target.chosenReasons ?? [];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
          Engine reasoning
        </p>
        {reasons.length > 0 ? (
          <ul className="space-y-2">
            {reasons.map((reason, i) => (
              <li
                key={i}
                className="text-sm text-zinc-300 leading-relaxed flex gap-2"
              >
                <span className="text-indigo-500/70 shrink-0">•</span>
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">
            Reaches strong altitude during your main imaging window · Fits your
            rig framing · Moon interference remains manageable during the best
            capture period.
          </p>
        )}
      </div>
      <div className="pt-3 border-t border-zinc-800/80">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
          Summary
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {target.explanation}
        </p>
      </div>{" "}
      <div className="pt-3 border-t border-zinc-800/80">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
          Imaging Data
        </p>
        <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
          <span>
            <span className="font-semibold text-zinc-300">Exposure: </span>
            {target.exposureRecipe.subLength}s subs ×{" "}
            {target.exposureRecipe.plannedSubs} frames
            {" · "}
            ISO {target.exposureRecipe.iso}
          </span>
          <span>
            <span className="font-semibold text-zinc-300">
              Imaging Window:{" "}
            </span>
            {target.window}
          </span>
          <span>
            <span className="font-semibold text-zinc-300">Peak Altitude: </span>
            {target.peakAltitude.altitude}° at {target.peakAltitude.time}
          </span>
          <span>
            <span className="font-semibold text-zinc-300">
              Moon Separation:{" "}
            </span>
            {target.moonSeparation}°
          </span>
          <span>
            <span className="font-semibold text-zinc-300">Target Size: </span>
            {target.targetSize}' (arcmin)
          </span>
        </div>
      </div>
    </div>
  );
}

function RejectedContent({ target }: { target: RejectedTarget }) {
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {target.rejectedReasons.map((reason, i) => (
          <li
            key={i}
            className="text-sm text-zinc-400 leading-relaxed flex gap-2"
          >
            <span className="text-zinc-600 shrink-0">•</span>
            {reason}
          </li>
        ))}
      </ul>
      <div className="pt-3 border-t border-zinc-800/80">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
          Recommendation
        </p>
        <p className="text-sm text-zinc-400">
          Not recommended tonight. Better suited for different conditions or rig
          configuration.
        </p>
      </div>
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[min(380px,90vw)] max-w-full bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto shadow-xl"
          >
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 z-10">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h2 className="font-display text-base font-semibold text-zinc-100 truncate">
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
                      {target.isRejected ? "Rejected" : "Recommended"}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-zinc-500">
                      Score: {target.score}
                    </span>
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
                <RejectedContent target={target as RejectedTarget} />
              ) : (
                <RecommendedContent target={target as RecommendedTarget} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
