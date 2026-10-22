"use client";

import { SessionClock } from "@/components/missions/SessionClock";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectedTargetCard } from "@/components/missions/SelectedTargetCard";
import { ExposurePlannerCard, SessionSimulatorCard } from "@/components/intelligence";
import { CaptureWorksheet } from "@/components/missions/CaptureWorksheet";
import { GoNoGoBanner } from "@/components/missions/GoNoGoBanner";
import { SessionObservingLog } from "@/components/missions/SessionObservingLog";
import type { Mission, MissionTarget } from "@/lib/types";
import type { MissionEventRow } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { targetScheduleLabel } from "@/lib/schedule/display";
import { sessionWindowFromMission } from "@/lib/time/sessionWindow";
import { DEFAULT_TRANSITION_MINUTES } from "@/lib/schedule/types";
import { Moon, Plus, Target, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

const PANEL_STYLE = "mission-panel";

export interface PlanningViewProps {
  mission: Mission;
  isReadOnlySession: boolean;
  isFieldMode: boolean;
  currentTarget: MissionTarget | null;
  currentTargetId: string | null;
  selectedTarget: MissionTarget | null;
  nextTargetLabel: string | null;
  hasGuiding?: boolean;
  /** ID of the target currently selected in UI (for highlighting in queue) */
  selectedTargetId: string | null;
  onSimulateNight: () => void;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  onTargetQueueClick: (t: MissionTarget) => void;
  onFocusTarget: (t: MissionTarget, e: React.MouseEvent) => void;
  onMoveTarget: (index: number, dir: "up" | "down") => void;
  onRemoveTarget: (targetId: string, e?: React.MouseEvent) => void;
  onCaptureToggle: (targetId: string) => void;
  onMakePrimary: (t: MissionTarget) => void;
  canEditTargets: boolean;
  onOpenAddTarget: () => void;
  onPatchTarget?: (targetId: string, patch: Partial<MissionTarget>) => void;
  cameraName?: string | null;
  lat?: number | null;
  lon?: number | null;
  siteTimezone?: string | null;
  missionEvents?: MissionEventRow[];
}

export function PlanningView({
  mission,
  isReadOnlySession,
  isFieldMode: _isFieldMode,
  currentTarget,
  currentTargetId,
  selectedTarget,
  nextTargetLabel,
  hasGuiding = false,
  selectedTargetId,
  onSimulateNight,
  onAddNote,
  onQuickEvent,
  onTargetQueueClick,
  onFocusTarget,
  onMoveTarget,
  onRemoveTarget,
  onCaptureToggle,
  onMakePrimary,
  canEditTargets,
  onOpenAddTarget,
  onPatchTarget,
  cameraName = null,
  lat = null,
  lon = null,
  siteTimezone = null,
  missionEvents = [],
}: PlanningViewProps) {
  const sessionWindow = sessionWindowFromMission({
    dateTime: mission.dateTime,
    sessionEndAt: mission.sessionEndAt,
  });
  const availableMinutes = Math.max(
    0,
    Math.round(
      (sessionWindow.end.getTime() - sessionWindow.start.getTime()) / 60_000,
    ),
  );
  const transitionMinutes =
    mission.transitionMinutes ?? DEFAULT_TRANSITION_MINUTES;

  return (
    <>
      {/* Simulate Night — scrubs the saved session window and schedule */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSimulateNight}
          className="border-white/10 bg-white/5"
          title="Scrub this mission session window and schedule"
        >
          <Moon className="h-4 w-4 mr-1" />
          Simulate Night
        </Button>
      </div>

      {/* Observing log + session clock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,34%)_minmax(0,1fr)]">
        <div className={cn(PANEL_STYLE, "flex min-h-[22rem] flex-col gap-2 p-4")}>
          <SessionObservingLog
            events={missionEvents}
            isReadOnly={isReadOnlySession}
            onAddNote={onAddNote}
            onQuickEvent={onQuickEvent}
            compact={false}
            className="min-h-0 flex-1"
          />
        </div>

        <section
          className={cn(
            PANEL_STYLE,
            "flex min-h-0 flex-col overflow-hidden p-4",
          )}
        >
          <GoNoGoBanner
            className="mb-3"
            lat={lat}
            lon={lon}
            dateTime={mission.dateTime}
            sessionEndAt={mission.sessionEndAt}
          />
          <h2 className="mission-section-label mb-3">Session clock</h2>
          <SessionClock
            sessionStart={sessionWindow.start}
            sessionEnd={sessionWindow.end}
            targets={mission.targets}
            selectedTargetId={selectedTargetId ?? currentTargetId}
          />
          {nextTargetLabel && (
            <p className="mt-3 text-xs tabular-nums text-cyan-300">
              {nextTargetLabel}
            </p>
          )}
        </section>
      </div>

      <div className={cn(PANEL_STYLE, "p-4")}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="mission-section-label">Target Queue</h2>
            {canEditTargets && (
              <Button
                variant="secondary"
                size="sm"
                className="border-white/10 bg-white/5"
                onClick={onOpenAddTarget}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Target
              </Button>
            )}
          </div>
          {mission.targets.length === 0 ? (
            <div className="py-8 text-center rounded-lg border border-dashed border-white/10">
              <p className="text-sm text-zinc-500 mb-3">
                No targets in this mission plan yet.
              </p>
              {canEditTargets && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-white/10 bg-white/5"
                  onClick={onOpenAddTarget}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Target
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {mission.targets.map((t, idx) => {
                const openId = selectedTargetId ?? currentTargetId;
                const isOpen = openId === t.targetId;
                const isSelected = isOpen;
                const seqLabel =
                  t.roleLabel ??
                  (t.isFallback ? "Fallback" : `SEQ ${t.sequenceIndex ?? idx + 1}`);
                return (
                  <div
                    key={t.targetId}
                    onClick={() => (canEditTargets ? onTargetQueueClick(t) : undefined)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 transition-colors",
                      isSelected
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                      canEditTargets ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={cn(
                          "min-w-[2.5rem] shrink-0 text-center text-[10px] font-medium uppercase tabular-nums",
                          t.isFallback ? "text-amber-400/80" : "text-zinc-500",
                        )}
                      >
                        {seqLabel}
                      </span>
                      {canEditTargets && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-cyan-400"
                            onClick={(e) => onFocusTarget(t, e)}
                            title="Set as Current Focus"
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                            onClick={() => onMoveTarget(idx, "up")}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                            onClick={() => onMoveTarget(idx, "down")}
                            disabled={idx === mission.targets.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                            onClick={(e) => onRemoveTarget(t.targetId, e)}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <label
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={t.captured ?? false}
                        onCheckedChange={
                          canEditTargets ? () => onCaptureToggle(t.targetId) : undefined
                        }
                        disabled={!canEditTargets}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "truncate text-sm",
                              t.captured
                                ? "text-zinc-500 line-through"
                                : "text-zinc-200",
                            )}
                          >
                            {t.targetName}
                          </span>
                          <span className="text-xs text-zinc-500 shrink-0 tabular-nums">
                            {targetScheduleLabel(t)}
                          </span>
                        </div>
                      </div>
                    </label>
                    {isSelected && (
                      <span className="text-[10px] shrink-0 font-medium uppercase text-violet-400">
                        {currentTargetId === t.targetId ? "Current focus" : "Selected"}
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <SelectedTargetCard
                        embedded
                        target={t}
                        onMakePrimary={canEditTargets ? onMakePrimary : undefined}
                        onRemove={
                          canEditTargets
                            ? (target) => onRemoveTarget(target.targetId)
                            : undefined
                        }
                        isPrimary={currentTargetId === t.targetId}
                      />
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {onPatchTarget && mission.targets.length > 0 && (
        <section className={cn(PANEL_STYLE, "p-4 mt-4")}>
          <CaptureWorksheet
            targets={mission.targets}
            transitionMinutes={transitionMinutes}
            availableMinutes={availableMinutes}
            cameraName={cameraName}
            hasSkyContext
            hasTrackingHint={!!cameraName}
            readOnly={isReadOnlySession || !canEditTargets}
            onPatchTarget={onPatchTarget}
          />
        </section>
      )}

      {/* Exposure Plan + Session Simulator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
        <ExposurePlannerCard
          mission={mission}
          target={selectedTarget ?? currentTarget}
          lat={lat}
          lon={lon}
          cameraName={cameraName}
          hasGuiding={hasGuiding}
        />
        <SessionSimulatorCard
          mission={mission}
          lat={lat}
          lon={lon}
          siteTimezone={siteTimezone}
        />
      </div>
    </>
  );
}

