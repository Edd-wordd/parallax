"use client";

import { Target, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMockMissionGuidance } from "@/lib/mockMissionData";
import type { MissionTarget } from "@/lib/types";

interface SelectedTargetCardProps {
  target: MissionTarget | null;
  onMakePrimary?: (target: MissionTarget) => void;
  onRemove?: (target: MissionTarget) => void;
  isPrimary?: boolean;
}

export function SelectedTargetCard({
  target,
  onMakePrimary,
  onRemove,
  isPrimary = false,
}: SelectedTargetCardProps) {
  if (!target) {
    return (
      <div className="mission-panel p-4 h-full min-h-[200px] flex flex-col items-center justify-center text-center">
        <Target className="h-10 w-10 text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-500">Select a target in the queue to view recipe and guidance</p>
      </div>
    );
  }

  const guidance = getMockMissionGuidance(target.targetId);

  return (
    <div className="mission-panel p-4 flex flex-col h-full min-h-[200px]">
      <h3 className="mission-section-label mb-3">Selected Target</h3>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-medium text-zinc-100">{target.targetName}</p>
          <p className="text-xs text-zinc-500 capitalize">{target.targetType.replace("_", " ")}</p>
        </div>
        {target.score != null && (
          <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">
            {target.score}
          </span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-xs text-zinc-500">Tonight&apos;s window</span>
          <p className="text-zinc-300 tabular-nums">{target.plannedWindowStart} – {target.plannedWindowEnd}</p>
        </div>

        <div>
          <span className="text-xs text-zinc-500">Recommended recipe</span>
          <p className="text-zinc-300">
            {target.subLength ?? 60}s · ISO {800} · {(target.frames ?? 60)} subs · dither every 3
          </p>
        </div>

        <div>
          <span className="text-xs text-zinc-500">Mission guidance</span>
          <p className="text-zinc-300">{guidance.whyNow}</p>
          <ul className="mt-1 space-y-1">
            {guidance.watchouts.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-200/90">
                <span className="shrink-0">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
          {guidance.recheckNote && (
            <p className="text-xs text-zinc-500 mt-1">{guidance.recheckNote}</p>
          )}
        </div>
      </div>

      {(onMakePrimary || onRemove) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
          {onMakePrimary && !isPrimary && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 border-white/10 bg-white/5 text-xs"
              onClick={() => onMakePrimary(target)}
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Set as Current Focus
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              onClick={() => onRemove(target)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
