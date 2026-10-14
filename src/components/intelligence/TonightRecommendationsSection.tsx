"use client";

import { RecommendedTargetCard } from "./RecommendedTargetCard";
import type { DashboardRecommendation } from "@/lib/recommendations/types";

interface TonightRecommendationsSectionProps {
  sectionTitle: string;
  recommendations: DashboardRecommendation[];
  emptyMessage: string | null;
  selectedTargetId: string | null;
  onSelectTarget: (id: string | null) => void;
  activeMissionTargetId?: string | null;
  plannedTargets?: DashboardRecommendation[];
  onCreateMissionPlan?: (target: DashboardRecommendation) => void;
  onAddToPlan?: (target: DashboardRecommendation) => void;
  onOpenEvidence?: (target: DashboardRecommendation) => void;
}

export function TonightRecommendationsSection({
  sectionTitle,
  recommendations,
  emptyMessage,
  selectedTargetId,
  onSelectTarget,
  activeMissionTargetId = null,
  plannedTargets = [],
  onCreateMissionPlan,
  onAddToPlan,
  onOpenEvidence,
}: TonightRecommendationsSectionProps) {
  const plannedIds = new Set(plannedTargets.map((t) => t.id));
  const planEmpty = plannedTargets.length === 0;

  return (
    <div id="tonight-recommendations" className="space-y-3">
      <div>
        <h2 className="dash-section-title text-zinc-400">{sectionTitle}</h2>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Ranked by altitude and Moon separation. Rig fit is FOV evidence only
          (not in the score). Add targets to Mission Control above.
        </p>
      </div>

      {emptyMessage ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-6">
          <p className="text-sm text-zinc-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((target) => (
            <div key={target.id} className="flex min-h-0">
              <RecommendedTargetCard
                target={target}
                selected={selectedTargetId === target.id}
                isActive={activeMissionTargetId === target.id}
                inPlan={plannedIds.has(target.id)}
                showCreateMission={planEmpty}
                onSelect={() =>
                  onSelectTarget(
                    selectedTargetId === target.id ? null : target.id,
                  )
                }
                onCreateMissionPlan={() => onCreateMissionPlan?.(target)}
                onAddToPlan={() => onAddToPlan?.(target)}
                onOpenEvidence={() => onOpenEvidence?.(target)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
