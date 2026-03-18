"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SoftwareSelect } from "@/components/missions/SoftwareSelect";
import { LiveSkyMonitorCard } from "@/components/sky-intelligence/LiveSkyMonitorCard";
import {
  MOCK_LIVE_EVENTS,
  MOCK_LIVE_STATE,
} from "@/lib/mock/skyIntelligence";
import type { SoftwareState } from "@/lib/missionUIStore";
import {
  HOW_TO_CONTENT,
  OPTIMIZE_RECOMMENDATIONS,
} from "@/lib/mockMissionData";

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

  /** Notes / session log */
  noteLog: { text: string; at: string }[];
  isReadOnlySession: boolean;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  /** Optional initial software state (if available later) */
  software?: SoftwareState;
}

const QUICK_EVENT_LABELS = [
  "Clouds moving in",
  "Guiding lost",
  "Meridian flip",
  "Conditions changed",
] as const;

export function SetupView({
  onStartMission,
  onCancelMission,
  noteLog,
  isReadOnlySession,
  onAddNote,
  onQuickEvent,
  software,
}: SetupViewProps) {
  const [noteInput, setNoteInput] = useState("");
  const [softwareState, setSoftwareState] = useState<SoftwareState>(
    software ?? {
      name: "NINA",
      otherName: "",
      caps: { plateSolve: true, autoFocus: true, guiding: true, dithering: true },
    },
  );
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [optimizeNote, setOptimizeNote] = useState<string | null>(null);

  const softwareProfile: SoftwareProfile =
    SOFTWARE_NAME_TO_PROFILE[softwareState.name] ?? "nina";

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteInput.trim();
    if (!text) return;
    onAddNote(text);
    setNoteInput("");
  };

  const handleToggleStep = (sectionId: string, stepId: string) => {
    const key = `${sectionId}-${stepId}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
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
        {/* Observing conditions card */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="mission-section-label mb-0">
              Observing Conditions (forecast)
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 border border-emerald-500/30">
              Read-only
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Snapshot from forecast and site intelligence. Adjust overrides below if
            field conditions differ.
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-zinc-500">Forecast confidence</dt>
              <dd className="font-medium text-zinc-100">High (87%)</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Cloud cover</dt>
              <dd className="font-medium text-zinc-100">10–20%</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Humidity</dt>
              <dd className="font-medium text-zinc-100">42%</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Seeing</dt>
              <dd className="font-medium text-zinc-100">2.1″ (good)</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Wind</dt>
              <dd className="font-medium text-zinc-100">5–8 mph</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Moon impact</dt>
              <dd className="font-medium text-zinc-100">Low (18% illumination)</dd>
            </div>
          </dl>
        </section>

        {/* Equipment checklist with inline How-To */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <h3 className="mission-section-label mb-1">Equipment Checklist</h3>
          <p className="text-xs text-zinc-400">
            Expand any item for software-specific how-to and what &quot;done&quot;
            looks like.
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
                            onCheckedChange={() => handleToggleStep(section.id, step.id)}
                            className="h-3.5 w-3.5"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="flex-1 text-zinc-200">
                            {step.label}
                            {step.critical && (
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

      {/* Optimize suggestions */}
      <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
        <h3 className="mission-section-label mb-1">Optimize Tonight&apos;s Plan</h3>
        <p className="text-xs text-zinc-400">
          Quick tweaks based on light pollution and moon. Apply suggestions to log
          them into your session notes.
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
            Logged to notes: <span className="text-zinc-300">{optimizeNote}</span>
          </p>
        )}
      </section>

      {/* Field conditions + Sky verification */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Field conditions overrides */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <h3 className="mission-section-label mb-1">Field Conditions</h3>
          <p className="text-xs text-zinc-400">
            If reality doesn&apos;t match the forecast, capture overrides so Parallax
            can recommend adjustments.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[11px] text-zinc-400">
                Clouds
                <span className="text-zinc-300">Thin</span>
              </label>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full w-1/4 rounded-full bg-cyan-400/70" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[11px] text-zinc-400">
                Seeing
                <span className="text-zinc-300">Good</span>
              </label>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full w-1/3 rounded-full bg-emerald-400/70" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[11px] text-zinc-400">
                Wind
                <span className="text-zinc-300">Calm</span>
              </label>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full w-1/5 rounded-full bg-emerald-400/70" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-[11px] text-zinc-400">
                Moon glare
                <span className="text-zinc-300">Minimal</span>
              </label>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full w-1/6 rounded-full bg-cyan-400/70" />
              </div>
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-[11px] border border-white/10 bg-white/5"
            >
              Field conditions match forecast
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-[11px] border border-amber-500/40 bg-amber-500/10 text-amber-200"
            >
              Override conditions for this session
            </Button>
          </div>
        </section>

        {/* Sky verification */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="mission-section-label mb-0">Sky Verification</h3>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              Proceed as planned
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Compare planned vs live conditions at your primary target and window.
          </p>
          <div className="mt-2 rounded-lg border border-white/10 bg-black/40 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Metric</th>
                  <th className="px-3 py-2 text-left font-medium">Planned</th>
                  <th className="px-3 py-2 text-left font-medium">Live</th>
                  <th className="px-3 py-2 text-left font-medium">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-3 py-2 text-zinc-300">Cloud cover</td>
                  <td className="px-3 py-2 text-zinc-400">15%</td>
                  <td className="px-3 py-2 text-zinc-100">18%</td>
                  <td className="px-3 py-2 text-emerald-300">+3%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-zinc-300">Seeing</td>
                  <td className="px-3 py-2 text-zinc-400">2.0″</td>
                  <td className="px-3 py-2 text-zinc-100">2.1″</td>
                  <td className="px-3 py-2 text-emerald-300">+0.1″</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-zinc-300">Wind</td>
                  <td className="px-3 py-2 text-zinc-400">7 mph</td>
                  <td className="px-3 py-2 text-zinc-100">8 mph</td>
                  <td className="px-3 py-2 text-emerald-300">+1 mph</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-zinc-300">Moon impact</td>
                  <td className="px-3 py-2 text-zinc-400">Low</td>
                  <td className="px-3 py-2 text-zinc-100">Low</td>
                  <td className="px-3 py-2 text-emerald-300">No change</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-emerald-300">
            Conditions are within tolerance for your plan — you can safely proceed as
            planned.
          </p>
        </section>
      </div>

      {/* Third row: Live sky monitor + Notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
        {/* Live sky monitor */}
        <section className={cn(PANEL_STYLE, "p-4 space-y-3")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="mission-section-label mb-0">Live Sky Monitor</h3>
            <span className="text-[11px] text-zinc-500">
              Mock feed · NINA / ASIAIR / Ekos
            </span>
          </div>
          <LiveSkyMonitorCard
            cloudCover={18}
            starsDetected={MOCK_LIVE_STATE.live?.starsDetected ?? null}
            skyBrightness={21.2}
            missionConfidence={78}
            status={MOCK_LIVE_STATE.status}
            events={MOCK_LIVE_EVENTS}
          />
        </section>

        {/* Notes / session log */}
        <section className={cn(PANEL_STYLE, "p-4 flex flex-col gap-2")}>
          <h3 className="mission-section-label mb-1">Notes / Session Log</h3>
          {noteLog.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px] font-mono tabular-nums">
              {noteLog.map((entry) => (
                <div
                  key={entry.at}
                  className="flex gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5"
                >
                  <span className="text-xs text-zinc-500 shrink-0">
                    {new Date(entry.at).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="text-zinc-200 leading-snug">{entry.text}</span>
                </div>
              ))}
            </div>
          )}
          {!isReadOnlySession && (
            <div className="flex flex-wrap gap-2 pt-2 pb-1">
              {QUICK_EVENT_LABELS.map((label) => (
                <Button
                  key={label}
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="min-w-[9rem] h-9 px-3 text-[11px] border border-white/10 bg-white/5 justify-start"
                  onClick={() => onQuickEvent(label)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
          {!isReadOnlySession && (
            <form onSubmit={handleSubmitNote} className="mt-auto flex gap-2 pt-1">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Log what just happened…"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!noteInput.trim()}
                className="border-white/10 bg-white/5"
              >
                Add
              </Button>
            </form>
          )}
          {isReadOnlySession && (
            <p className="mt-auto pt-3 text-[11px] text-zinc-500">
              Session ended — notes and events are locked for this mission.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

