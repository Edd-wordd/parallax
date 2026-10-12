"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SoftwareSelect } from "@/components/missions/SoftwareSelect";
import { LiveSkyMonitorCard } from "@/components/sky-intelligence/LiveSkyMonitorCard";
import { MissionConditionsPanel } from "@/components/missions/MissionConditionsPanel";
import { GoNoGoBanner } from "@/components/missions/GoNoGoBanner";
import { SessionObservingLog } from "@/components/missions/SessionObservingLog";
import {
  MOCK_LIVE_EVENTS,
  MOCK_LIVE_STATE,
} from "@/lib/mock/skyIntelligence";
import type { ConditionsState, SoftwareState } from "@/lib/missionUIStore";
import {
  HOW_TO_CONTENT,
  OPTIMIZE_RECOMMENDATIONS,
} from "@/lib/mockMissionData";
import type { ConditionLogRow, MissionEventRow } from "@/lib/schemas";
import type { ManualFieldReadingPayload } from "@/lib/supabase/queries/conditionLogs";
import { checklistStateFromEvents } from "@/lib/missions/checklistFromEvents";

export type ChecklistTogglePayload = {
  sectionId: string;
  stepId: string;
  label: string;
  sectionLabel: string;
  checked: boolean;
};

const PANEL_STYLE = "mission-panel";

type SoftwareProfile = "nina" | "asiair" | "ekos" | "other";

const SOFTWARE_NAME_TO_PROFILE: Record<string, SoftwareProfile> = {
  "Ekos (Astroberry)": "ekos",
  NINA: "nina",
  ASIAIR: "asiair",
  APT: "other",
  "Siril only": "other",
  Other: "other",
};

const EQUIPMENT_SECTIONS = [
  {
    id: "power-connections",
    title: "Power & Connections",
    steps: [
      { id: "power-on", label: "Power on equipment" },
      { id: "cables", label: "Verify cables & connections" },
      { id: "dew-heater", label: "Dew heater set" },
    ],
  },
  {
    id: "mount-alignment",
    title: "Mount & Alignment",
    steps: [
      { id: "polar-align", label: "Polar alignment within tolerance", critical: true },
      { id: "level", label: "Level mount" },
      { id: "balance", label: "Balance RA & Dec" },
    ],
  },
  {
    id: "focus",
    title: "Focus",
    steps: [
      { id: "focus-routine", label: "Focus routine complete", critical: true },
    ],
  },
  {
    id: "guiding",
    title: "Guiding",
    steps: [
      { id: "calibrate", label: "Calibrate guiding" },
      { id: "enable", label: "Enable guiding" },
    ],
  },
] as const;

interface SetupViewProps {
  /** Header CTAs */
  onStartMission: () => void;
  onCancelMission: () => void;

  isReadOnlySession: boolean;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  onChecklistToggle: (item: ChecklistTogglePayload) => void;
  /** Optional initial software state (if available later) */
  software?: SoftwareState;

  /** Mission site / window for real forecast + astronomy */
  lat?: number | null;
  lon?: number | null;
  dateTime: string;
  sessionEndAt?: string | null;
  siteTimezone?: string | null;
  siteName?: string | null;
  minAltitudeDeg?: number;
  moonToleranceDeg?: number;
  conditions: ConditionsState;
  onConditionsChange: (c: Partial<ConditionsState>) => void;
  conditionLogs: ConditionLogRow[];
  missionEvents: MissionEventRow[];
  latestFieldReadingEventId?: string | null;
  onCommitReading: (reading: ManualFieldReadingPayload) => Promise<void> | void;
  committingReading?: boolean;
  readingError?: string | null;
}

export function SetupView({
  onStartMission,
  onCancelMission,
  isReadOnlySession,
  onAddNote,
  onQuickEvent,
  onChecklistToggle,
  software,
  lat = null,
  lon = null,
  dateTime,
  sessionEndAt = null,
  siteTimezone = null,
  siteName = null,
  minAltitudeDeg = 30,
  moonToleranceDeg = 15,
  conditions,
  onConditionsChange,
  conditionLogs,
  missionEvents,
  latestFieldReadingEventId = null,
  onCommitReading,
  committingReading = false,
  readingError = null,
}: SetupViewProps) {
  const [softwareState, setSoftwareState] = useState<SoftwareState>(
    software ?? {
      name: "NINA",
      otherName: "",
      caps: { plateSolve: true, autoFocus: true, guiding: true, dithering: true },
    },
  );
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>(
    () => checklistStateFromEvents(missionEvents),
  );
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [optimizeNote, setOptimizeNote] = useState<string | null>(null);

  useEffect(() => {
    setCheckedSteps(checklistStateFromEvents(missionEvents));
  }, [missionEvents]);

  const softwareProfile: SoftwareProfile =
    SOFTWARE_NAME_TO_PROFILE[softwareState.name] ?? "nina";

  const handleToggleStep = (
    sectionId: string,
    stepId: string,
    label: string,
    sectionLabel: string,
  ) => {
    if (isReadOnlySession) return;
    const key = `${sectionId}-${stepId}`;
    const nextChecked = !(checkedSteps[key] ?? false);
    setCheckedSteps((prev) => ({ ...prev, [key]: nextChecked }));
    onChecklistToggle({
      sectionId,
      stepId,
      label,
      sectionLabel,
      checked: nextChecked,
    });
  };

  const handleToggleHowTo = (sectionId: string, stepId: string) => {
    const key = `${sectionId}-${stepId}`;
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyOptimize = (recId: string) => {
    const rec = OPTIMIZE_RECOMMENDATIONS.find((r) => r.id === recId);
    if (!rec) return;
    const suffix = rec.suggestedChange ? ` (${rec.suggestedChange})` : "";
    setOptimizeNote(`[Optimize] ${rec.title}${suffix}`);
    onAddNote(`[Optimize] ${rec.title}${suffix}`);
  };

  return (
    <div className="space-y-4">
      {/* Local heading (CTAs live in page header) */}
      <div className="flex flex-col gap-1">
        <h2 className="mission-section-label mb-0">Setup & Go/No-Go</h2>
        <p className="text-xs text-zinc-400">
          Use the mission header to start or cancel. This view helps you verify software,
          sky, equipment, and field conditions.
        </p>
      </div>

      <GoNoGoBanner
        lat={lat}
        lon={lon}
        dateTime={dateTime}
        sessionEndAt={sessionEndAt}
        minAltitudeDeg={minAltitudeDeg}
        moonToleranceDeg={moonToleranceDeg}
      />

      {/* Software selector */}
      <section className={cn(PANEL_STYLE, "p-4")}>
        <SoftwareSelect
          software={softwareState}
          onChange={(s) => setSoftwareState((prev) => ({ ...prev, ...s }))}
        />
        <p className="mt-2 text-[11px] text-zinc-500">
          How-To steps below adapt to {softwareState.name === "Other"
            ? (softwareState.otherName || "your software")
            : softwareState.name}
          .
        </p>
      </section>

      {/* Observing conditions + Equipment checklist with How-To */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Observing conditions — forecast / calculated / field */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="mission-section-label mb-0">
              Observing Conditions
            </h3>
          </div>
          <MissionConditionsPanel
            lat={lat}
            lon={lon}
            dateTime={dateTime}
            sessionEndAt={sessionEndAt}
            siteTimezone={siteTimezone}
            siteName={siteName}
            minAltitudeDeg={minAltitudeDeg}
            moonToleranceDeg={moonToleranceDeg}
            conditions={conditions}
            onConditionsChange={onConditionsChange}
            conditionLogs={conditionLogs}
            latestFieldReadingEventId={latestFieldReadingEventId}
            onCommitReading={onCommitReading}
            committing={committingReading}
            commitError={readingError}
            readOnly={isReadOnlySession}
          />
        </section>

        {/* Equipment checklist with inline How-To */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <h3 className="mission-section-label mb-1">Equipment Checklist</h3>
          <p className="text-xs text-zinc-400">
            Checkoffs are written to the observing log. Expand any item for
            software-specific how-to.
          </p>
          <div className="mt-2 space-y-3 max-h-80 overflow-y-auto pr-1">
            {EQUIPMENT_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  {section.title}
                </h4>
                <div className="space-y-1.5">
                  {section.steps.map((step) => {
                    const key = `${section.id}-${step.id}`;
                    const checked = checkedSteps[key] ?? false;
                    const expanded = expandedSteps[key] ?? false;
                    const howTo =
                      HOW_TO_CONTENT[softwareProfile]?.[section.id]?.[step.id];
                    return (
                      <div
                        key={key}
                        className="rounded-md border border-white/8 bg-white/5 text-xs overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
                          onClick={() => handleToggleHowTo(section.id, step.id)}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              handleToggleStep(
                                section.id,
                                step.id,
                                step.label,
                                section.title,
                              )
                            }
                            className="h-3.5 w-3.5"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isReadOnlySession}
                          />
                          <span className="flex-1 text-zinc-200">
                            {step.label}
                            {"critical" in step && step.critical && (
                              <span className="ml-2 rounded-full border border-rose-500/60 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-rose-300">
                                Critical
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {expanded ? "Hide how-to" : "Show how-to"}
                          </span>
                        </button>
                        {expanded && howTo && (
                          <div className="border-t border-white/10 bg-black/40 px-3 py-2 space-y-1.5 text-[11px]">
                            <div>
                              <span className="text-zinc-500">Goal</span>
                              <p className="text-zinc-200">{howTo.goal}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Steps</span>
                              <p className="text-zinc-200">{howTo.doThis}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Common fail</span>
                              <p className="text-zinc-200">{howTo.commonFail}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Success looks like</span>
                              <p className="text-zinc-200">
                                {howTo.successLooksLike}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Optimize suggestions (Demo) */}
      <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="mission-section-label mb-0">
            Optimize Tonight&apos;s Plan
          </h3>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
            Demo
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Demo suggestions only — not connected to live AI or equipment.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          {OPTIMIZE_RECOMMENDATIONS.slice(0, 3).map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border border-white/10 bg-black/40 p-3 flex flex-col gap-2"
            >
              <span className="text-sm font-medium text-zinc-100">
                {rec.title}
              </span>
              <p className="text-[11px] text-zinc-400 flex-1">{rec.why}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-fit text-[11px]"
                type="button"
                onClick={() => handleApplyOptimize(rec.id)}
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
        {optimizeNote && (
          <p className="text-[11px] text-zinc-500">
            Logged: <span className="text-zinc-300">{optimizeNote}</span>
          </p>
        )}
      </section>

      {/* Live sky monitor (Demo) + Notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="mission-section-label mb-0">Live Sky Monitor</h3>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              Demo
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Mock feed — not connected equipment telemetry.
          </p>
          <LiveSkyMonitorCard
            cloudCover={18}
            starsDetected={MOCK_LIVE_STATE.live?.starsDetected ?? null}
            skyBrightness={21.2}
            missionConfidence={78}
            status={MOCK_LIVE_STATE.status}
            events={MOCK_LIVE_EVENTS}
          />
        </section>

        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <SessionObservingLog
            events={missionEvents}
            isReadOnly={isReadOnlySession}
            onAddNote={onAddNote}
            onQuickEvent={onQuickEvent}
            quickEventLabels={[
              "Clouds moving in",
              "Guiding lost",
              "Meridian flip",
              "Conditions changed",
            ]}
          />
        </section>
      </div>
    </div>
  );
}

