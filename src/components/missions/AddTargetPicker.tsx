"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissionTarget } from "@/lib/types";
import type { AvailableTargetOption } from "@/lib/mock/availableTargetsForMission";

interface AddTargetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  available: AvailableTargetOption[];
  onAdd: (opt: AvailableTargetOption) => void;
}

export function AddTargetPicker({
  isOpen,
  onClose,
  available,
  onAdd,
}: AddTargetPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-md mission-panel p-4 max-h-[80vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-labelledby="add-target-title"
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 id="add-target-title" className="font-display text-sm font-semibold uppercase tracking-tight text-white/95">
            Add Target
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mb-3 shrink-0">
          Available targets not yet in this mission plan
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {available.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              No additional targets available. All recommendations are in your queue.
            </p>
          ) : (
            available.map((opt) => (
              <div
                key={opt.targetId}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3",
                  "hover:border-white/20 transition-colors"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-200 text-sm">{opt.targetName}</p>
                    <p className="text-xs text-zinc-500 capitalize">{opt.targetType.replace("_", " ")}</p>
                  </div>
                  <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    Score {opt.score}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 tabular-nums">
                  Best window {opt.bestWindowStart}–{opt.bestWindowEnd}
                </p>
                <p className="text-xs text-zinc-400">{opt.reason}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => onAdd(opt)}
                >
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
