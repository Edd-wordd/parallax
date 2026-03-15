"use client";

import { useState } from "react";
import { RecommendedTargetCard } from "./RecommendedTargetCard";
import { MissionPlanPanel } from "./MissionPlanPanel";
import { MissionDecisionDrawer } from "./MissionDecisionDrawer";
import { Button } from "@/components/ui/button";
import {
  RECOMMENDED_TARGETS,
  ENGINE_CONFIDENCE,
  ENGINE_CONFIDENCE_SUBTEXT,
} from "@/lib/mock/intelligenceLayer";
import type { RecommendedTarget, RejectedTarget } from "@/lib/mock/intelligenceLayer";

type DrawerTarget = (RecommendedTarget | RejectedTarget) & { isRejected: boolean };

interface TonightRecommendationsSectionProps {
  selectedTargetId: string | null;
  onSelectTarget: (id: string | null) => void;
  activeMissionTargetId?: string | null;
  plannedTargets?: RecommendedTarget[];
  onStartMission?: (target: RecommendedTarget) => void;
  onAddToPlan?: (target: RecommendedTarget) => void;
  onBuildOptimalMission?: () => void;
  onRemoveFromPlan?: (targetId: string) => void;
  onClearPlan?: () => void;
  onStartPlannedMission?: () => void;
}

export function TonightRecommendationsSection({
  selectedTargetId,
  onSelectTarget,
  activeMissionTargetId = null,
  plannedTargets = [],
  onStartMission,
  onAddToPlan,
  onBuildOptimalMission,
  onRemoveFromPlan,
  onClearPlan,
  onStartPlannedMission,
}: TonightRecommendationsSectionProps) {
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawerForRecommended = (target: RecommendedTarget) => {
    setDrawerTarget({ ...target, isRejected: false });
    setDrawerOpen(true);
  };

  const openDrawerForRejected = (target: RejectedTarget) => {
    setDrawerTarget({ ...target, isRejected: true });
    setDrawerOpen(true);
  };

  const plannedIds = new Set(plannedTargets.map((t) => t.id));

  return (
    <div id="tonight-recommendations" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="dash-section-title text-zinc-400">
            Tonight&apos;s Recommendations
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
            <span className="text-indigo-400/80 font-medium">
              Mission Engine Confidence: {ENGINE_CONFIDENCE}
            </span>
            <span className="text-zinc-600">·</span>
            {ENGINE_CONFIDENCE_SUBTEXT}
          </p>
        </div>
        {onBuildOptimalMission && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={onBuildOptimalMission}
          >
            Build Optimal Mission
          </Button>
        )}
      </div>

      {plannedTargets.length > 0 && (
        <MissionPlanPanel
          targets={plannedTargets}
          activeTargetId={activeMissionTargetId}
          status="planning"
          onRemoveTarget={onRemoveFromPlan}
          onClearPlan={onClearPlan}
          onStartPlannedMission={onStartPlannedMission}
        />
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Recommended Targets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {RECOMMENDED_TARGETS.map((target) => (
            <div key={target.id} className="min-h-0 flex">
              <RecommendedTargetCard
                target={target}
                selected={selectedTargetId === target.id}
                isActive={activeMissionTargetId === target.id}
                inPlan={plannedIds.has(target.id)}
                onSelect={() => onSelectTarget(selectedTargetId === target.id ? null : target.id)}
                onStartMission={() => onStartMission?.(target)}
                onAddToPlan={() => onAddToPlan?.(target)}
                onOpenDecisionDrawer={() => openDrawerForRecommended(target)}
              />
            </div>
          ))}
        </div>
      </div>

      <MissionDecisionDrawer
        target={drawerTarget}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerTarget(null);
        }}
      />
    </div>
  );
}
