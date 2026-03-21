"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { generateMockPlan, type GenerateMockPlanOptions } from "@/lib/mock/missions";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationPicker } from "@/components/LocationPicker";
import { GearPicker } from "@/components/GearPicker";
import { MOCK_CONDITIONS_SOURCE } from "@/lib/mock/skyIntelligence";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Moon,
  Clock,
  Gauge,
  ArrowRight,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mission, MissionConstraint, MissionTarget } from "@/lib/types";

const STEP_NAMES = ["Setup", "Target Constraints", "Mission Plan"] as const;
const DEEP_SKY_OBJECTIVES = [
  { value: "deep_integration", label: "Deep Integration" },
  { value: "survey_night", label: "Survey Night" },
  { value: "quick_session", label: "Quick Session" },
];
const PLANETARY_RECOMMENDED = ["Jupiter", "Saturn"] as const;
const PLANETARY_OTHER = [
  "Moon",
  "Mars",
  "Venus",
  "Mercury",
  "Uranus",
  "Neptune",
] as const;

function generateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function MissionWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addMission, setActiveMission } = useMissionStore();
  const {
    activeLocationId: storeLocationId,
    activeGearId: storeGearId,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
    setActiveLocation,
    setActiveGear,
    setDateTime: setStoreDateTime,
  } = useAppStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Tonight's Mission");
  const [locationId, setLocationId] = useState(storeLocationId ?? "loc1");
  const [gearId, setGearId] = useState(storeGearId ?? "gear1");
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [constraints, setConstraints] = useState<MissionConstraint>({
    minAltitude: minAltitude,
    moonTolerance: moonTolerance,
    targetTypes: [...targetTypes],
    driveToDarker: driveToDarker,
    driveRadius: driveRadius,
    objective: "galaxy_hunt",
  });
  const [targets, setTargets] = useState<MissionTarget[]>([]);
  const [targetOrder, setTargetOrder] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [missionType, setMissionType] = useState<
    "deep_sky" | "planetary" | null
  >(null);
  const [selectedPlanetaryTargets, setSelectedPlanetaryTargets] = useState<Set<string>>(new Set(["Jupiter"]));
  const [sessionEndTime, setSessionEndTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow
    d.setHours(3, 0, 0, 0); // default 3 AM
    return d.toISOString().slice(0, 16);
  });
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const location = MOCK_LOCATIONS.find((l) => l.id === locationId);
  const gear = MOCK_GEAR.find((g) => g.id === gearId);
  const displayDate = new Date(dateTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    setActiveLocation(locationId);
  }, [locationId, setActiveLocation]);

  useEffect(() => {
    setActiveGear(gearId);
  }, [gearId, setActiveGear]);

  useEffect(() => {
    setStoreDateTime(new Date(dateTime).toISOString());
  }, [dateTime, setStoreDateTime]);

  const handleGeneratePlan = () => {
    const options: GenerateMockPlanOptions = {
      missionType,
      planetaryTargets:
        missionType === "planetary" ? Array.from(selectedPlanetaryTargets) : undefined,
    };
    const plan = generateMockPlan(locationId, gearId, dateTime, constraints, options);
    setTargets(plan);
    setTargetOrder(plan.map((t) => t.targetId));
    setSelectedIds(new Set(plan.map((t) => t.targetId)));
    setGenerated(true);
    setStep(3);
    toast("Plan generated (mock)", "success");
  };

  const toggleTarget = (targetId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const orderedIds = targetOrder.filter((id) => selectedIds.has(id));
  const orderedTargets = orderedIds
    .map((id) => targets.find((t) => t.targetId === id))
    .filter((t): t is MissionTarget => !!t);

  const orderedAllTargets = targetOrder
    .map((id) => targets.find((t) => t.targetId === id))
    .filter((t): t is MissionTarget => !!t);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragTargetIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnd = () => {
    setDragTargetIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) {
      setDragTargetIndex(null);
      return;
    }
    const newOrder = targetOrder.filter((_, i) => i !== dragIndex);
    const insertIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newOrder.splice(insertIndex, 0, targetOrder[dragIndex]);
    setTargetOrder(newOrder);
    setDragTargetIndex(null);
  };

  const updateTargetRecipe = (
    targetId: string,
    updates: Partial<Pick<MissionTarget, "subLength" | "frames" | "isoGain">>,
  ) => {
    setTargets((prev) =>
      prev.map((t) => (t.targetId === targetId ? { ...t, ...updates } : t)),
    );
  };

  const scoreBadgeColor = (score: number) =>
    score >= 7
      ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
      : score >= 4
        ? "bg-amber-500/25 text-amber-300 border-amber-500/40"
        : "bg-red-500/25 text-red-300 border-red-500/40";
  const scoreValue = (
    t: MissionTarget,
    key: "altitudeScore" | "moonSeparationScore" | "rigFramingScore",
  ) => {
    const v = t[key];
    if (v != null) return v;
    return Math.min(10, Math.max(1, Math.round((t.score || 70) / 10)));
  };
  const overallScore = (t: MissionTarget) =>
    Math.round(
      (scoreValue(t, "altitudeScore") +
        scoreValue(t, "moonSeparationScore") +
        scoreValue(t, "rigFramingScore")) /
        3,
    );

  const handleSave = () => {
    const finalTargets = orderedTargets;
    const mission: Mission = {
      id: generateId(),
      name,
      dateTime: new Date(dateTime).toISOString(),
      locationId,
      gearId,
      missionType: missionType ?? null,
      constraints,
      targets: finalTargets,
      status: "ready",
      createdAt: new Date().toISOString(),
    };
    addMission(mission);
    setActiveMission(mission.id);
    toast("Mission saved", "success");
    router.push(`/missions/${mission.id}`);
  };

  return (
    <div className="mission-space-page relative -m-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 mx-auto w-full max-w-5xl px-1 py-6 sm:px-2"
      >
        {/* Header: Create Mission | Cancel */}
        <header className="mission-page-header">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl font-semibold uppercase tracking-tight text-white/95">
                Create Mission
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white/55 hover:text-white/90 hover:bg-white/5"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Mission
              </Button>
            </div>
            <p className="text-xs text-white/45 tracking-wide">
              Step {step} of 3 · {STEP_NAMES[step - 1]}
            </p>
            <div className="mission-page-progress w-full">
              <div
                className="mission-page-progress-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 grid-rows-[min-content] gap-6 lg:grid-cols-5 lg:gap-8 lg:items-start">
          {/* Left column: form */}
          <div className="mission-panel min-w-0 overflow-visible lg:col-span-3 lg:row-start-1">
            <div className="p-4">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <p className="mb-2 text-[11px] font-normal uppercase tracking-widest text-white/45">
                          Mission Details
                        </p>
                        <label className="mb-1 block text-xs text-white/60">
                          Mission name
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tonight's Mission"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/60">
                          Location
                        </label>
                        <LocationPicker
                          locations={MOCK_LOCATIONS}
                          value={locationId}
                          onValueChange={setLocationId}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-white/60">
                          Gear
                        </label>
                        <GearPicker
                          gear={MOCK_GEAR}
                          value={gearId}
                          onValueChange={setGearId}
                        />
                      </div>
                      <div className="relative z-[100]">
                        <label className="mb-1 block text-xs text-white/60">
                          Date & time
                        </label>
                        <Input
                          type="datetime-local"
                          value={dateTime}
                          onChange={(e) => setDateTime(e.target.value)}
                          onClick={(e) => {
                            const input = e.currentTarget;
                            if (typeof input.showPicker === "function") {
                              try {
                                input.showPicker();
                              } catch {
                                /* user activation lost or unsupported */
                              }
                            }
                          }}
                          className="h-9 max-w-[200px] cursor-pointer"
                        />
                      </div>
                      <div className="relative z-[100]">
                        <label className="mb-1 block text-xs text-white/60">
                          Session end time
                        </label>
                        <Input
                          type="datetime-local"
                          value={sessionEndTime}
                          onChange={(e) => setSessionEndTime(e.target.value)}
                          onClick={(e) => {
                            const input = e.currentTarget;
                            if (typeof input.showPicker === "function") {
                              try {
                                input.showPicker();
                              } catch {
                                /* user activation lost or unsupported */
                              }
                            }
                          }}
                          className="h-9 max-w-[200px] cursor-pointer"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[11px] text-indigo-300/90">
                          {(() => {
                            const start = new Date(dateTime);
                            let end = new Date(sessionEndTime);
                            if (end.getTime() <= start.getTime()) {
                              end = new Date(
                                end.getTime() + 24 * 60 * 60 * 1000,
                              );
                            }
                            const ms = end.getTime() - start.getTime();
                            const h = Math.floor(ms / 3_600_000);
                            const m = Math.floor((ms % 3_600_000) / 60_000);
                            return `Session duration: ${h} h ${m} min`;
                          })()}
                        </p>
                      </div>
                    </div>

                    <p className="mt-6 mb-2 text-[11px] font-normal uppercase tracking-widest text-white/45">
                      Tonight&apos;s Conditions
                    </p>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <p className="mt-0 text-xs text-white/50">
                        Before you leave, Parallax uses forecast and location
                        data only. Live verification available on-site.
                      </p>
                      <dl className="mt-3 space-y-2 text-xs">
                        <div>
                          <dt className="text-white/50">Forecast confidence</dt>
                          <dd className="text-white/90">
                            {MOCK_CONDITIONS_SOURCE.forecastConfidence}%
                          </dd>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            <dt className="text-white/50 inline">Cloud:</dt>{" "}
                            <dd className="inline text-white/90">
                              {MOCK_CONDITIONS_SOURCE.cloudCover}%
                            </dd>
                          </span>
                          <span>
                            <dt className="text-white/50 inline">Humidity:</dt>{" "}
                            <dd className="inline text-white/90">
                              {MOCK_CONDITIONS_SOURCE.humidity}%
                            </dd>
                          </span>
                          <span>
                            <dt className="text-white/50 inline">Wind:</dt>{" "}
                            <dd className="inline text-white/90">
                              {MOCK_CONDITIONS_SOURCE.windMph} mph
                            </dd>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Moon className="h-3.5 w-3.5 shrink-0 text-white/40" />
                            <span className="text-white/50">Moon:</span>
                            <span className="text-white/90">
                              {MOCK_CONDITIONS_SOURCE.moonPhase} ·{" "}
                              {MOCK_CONDITIONS_SOURCE.moonInterference} ·{" "}
                              {MOCK_CONDITIONS_SOURCE.moonRiseSet}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                            <span className="text-white/50">Visibility:</span>
                            <span className="text-white/90">
                              {MOCK_CONDITIONS_SOURCE.targetVisibilityWindow}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5 shrink-0 text-white/40" />
                            <span className="text-white/50">Sky / Bortle:</span>
                            <span className="text-white/90">
                              {MOCK_CONDITIONS_SOURCE.skyBrightness} mag/arcsec²
                              · Bortle {MOCK_CONDITIONS_SOURCE.bortle}
                            </span>
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <span>
                            <dt className="text-white/50 inline">Seeing:</dt>{" "}
                            <dd className="inline text-white/90">
                              {MOCK_CONDITIONS_SOURCE.seeing}/5{" "}
                              {MOCK_CONDITIONS_SOURCE.seeingLabel}
                            </dd>
                          </span>
                          <span>
                            <dt className="text-white/50 inline">Transparency:</dt>{" "}
                            <dd className="inline text-white/90">
                              {MOCK_CONDITIONS_SOURCE.transparency}/5{" "}
                              {MOCK_CONDITIONS_SOURCE.transparencyLabel}
                            </dd>
                          </span>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-4 rounded-lg border border-white/10 border-l-2 border-l-indigo-500/50 bg-white/5 pl-4 pr-4 py-4">
                      <p className="text-sm font-medium text-white/85">
                        Recommendations
                      </p>
                      <div className="mt-2 space-y-2">
                        {MOCK_CONDITIONS_SOURCE.recommendations.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 text-[13px] leading-snug text-white/75"
                          >
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/45" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="mt-6 mb-2 text-[11px] font-normal uppercase tracking-widest text-white/45">
                      Mission Type
                    </p>
                    <div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setMissionType("deep_sky")}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            missionType === "deep_sky"
                              ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          Deep Sky
                        </button>
                        <button
                          type="button"
                          onClick={() => setMissionType("planetary")}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            missionType === "planetary"
                              ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          Planetary
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {missionType === "deep_sky" && (
                      <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-white/60">
                              Min altitude
                            </label>
                            <p className="mb-1.5 text-xs text-white/50">
                              Ignore targets below this altitude.
                            </p>
                            <Slider
                              min={0}
                              max={60}
                              value={constraints.minAltitude}
                              onValueChange={(v) =>
                                setConstraints((c) => ({
                                  ...c,
                                  minAltitude: v,
                                }))
                              }
                            />
                            <span className="text-xs text-white/50">
                              {constraints.minAltitude}°
                            </span>
                            {constraints.minAltitude < 30 && (
                              <p className="mt-1.5 text-xs text-amber-400">
                                Below 30° atmospheric distortion will significantly reduce image quality.
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-white/60">
                              Moon tolerance
                            </label>
                            <p className="mb-1.5 text-xs text-white/50">
                              How close to the moon is acceptable (degrees).
                            </p>
                            <Slider
                              min={0}
                              max={50}
                              value={constraints.moonTolerance}
                              onValueChange={(v) =>
                                setConstraints((c) => ({
                                  ...c,
                                  moonTolerance: v,
                                }))
                              }
                            />
                            <span className="text-xs text-white/50">
                              {constraints.moonTolerance}°
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="mb-1 block text-xs text-white/60">
                            Objective
                          </label>
                          <p className="mb-2 text-xs text-white/50">
                            Select the planning strategy.
                          </p>
                          <select
                            value={constraints.objective ?? ""}
                            onChange={(e) =>
                              setConstraints((c) => ({
                                ...c,
                                objective: e.target
                                  .value as MissionConstraint["objective"],
                              }))
                            }
                            className="flex h-9 w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 focus:border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          >
                            {DEEP_SKY_OBJECTIVES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {missionType === "planetary" && (
                      <div>
                        <label className="mb-1 block text-xs text-white/60">
                          Planetary targets
                        </label>
                        <p className="mb-2 text-xs text-white/50">
                          Select one or more targets. At least one required.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/45">
                              Recommended
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {PLANETARY_RECOMMENDED.map((t) => {
                                const selected = selectedPlanetaryTargets.has(t);
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlanetaryTargets((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(t)) next.delete(t);
                                        else next.add(t);
                                        return next;
                                      });
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                      selected
                                        ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-white/45">
                              Other Targets
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {PLANETARY_OTHER.map((t) => {
                                const selected = selectedPlanetaryTargets.has(t);
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlanetaryTargets((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(t)) next.delete(t);
                                        else next.add(t);
                                        return next;
                                      });
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                      selected
                                        ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {!generated || targets.length === 0 ? (
                      <p className="text-sm text-white/60">
                        Go back to Step 2 and click &quot;Generate Plan&quot;.
                      </p>
                    ) : (
                      <div className="w-full min-w-0 space-y-3">
                        <div className="w-full min-w-0">
                          <h3 className="text-base font-semibold text-zinc-200 mb-2">
                            Tonight&apos;s Imaging Schedule
                          </h3>
                          <div className="space-y-2">
                            {orderedAllTargets.map((t, i) => {
                              const isSelected = selectedIds.has(t.targetId);
                              const isExpanded =
                                expandedTargetId === t.targetId;
                              const catalogMatch =
                                t.targetName.match(/\(([^)]+)\)/);
                              const catalogTag = catalogMatch
                                ? catalogMatch[1]
                                : null;
                              const targetNameDisplay = catalogTag
                                ? t.targetName
                                    .replace(/\s*\([^)]+\)\s*/, "")
                                    .trim()
                                : t.targetName;
                              return (
                                <div
                                  key={t.targetId}
                                  onDragOver={(e) => handleDragOver(e, i)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, i)}
                                  className={cn(
                                    "rounded-lg border transition-colors",
                                    isSelected
                                      ? "border-white/15 bg-white/[0.03] hover:border-white/20"
                                      : "border-white/10 bg-white/[0.02] opacity-75",
                                    dragTargetIndex === i && "opacity-50",
                                    dragOverIndex === i &&
                                      "ring-1 ring-inset ring-white/20",
                                  )}
                                >
                                  <div className="flex items-center gap-2 p-3">
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, i)}
                                      onDragEnd={handleDragEnd}
                                      className="shrink-0 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-400 touch-none"
                                      aria-label="Drag to reorder"
                                      onPointerDown={(e) => e.stopPropagation()}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    {isSelected ? (
                                      <Checkbox
                                        checked={true}
                                        onCheckedChange={() =>
                                          toggleTarget(t.targetId)
                                        }
                                        className="shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 shrink-0 gap-1 text-xs text-white/60 hover:text-white/90"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleTarget(t.targetId);
                                        }}
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                        Re-add
                                      </Button>
                                    )}
                                    <span className="shrink-0 w-12 text-[11px] tabular-nums text-zinc-500">
                                      {t.plannedWindowStart}
                                    </span>
                                    <button
                                      type="button"
                                      className={cn(
                                        "flex flex-1 min-w-0 items-center gap-2 text-left",
                                        !isSelected &&
                                          "line-through text-white/50",
                                      )}
                                      onClick={() =>
                                        setExpandedTargetId((id) =>
                                          id === t.targetId ? null : t.targetId,
                                        )
                                      }
                                    >
                                      <span className="font-medium text-zinc-200">
                                        {targetNameDisplay}
                                      </span>
                                      {catalogTag && (
                                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                                          {catalogTag}
                                        </span>
                                      )}
                                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                        {t.targetType.replace("_", " ")}
                                      </span>
                                      <span className="flex items-center gap-2 ml-auto shrink-0">
                                        <span className="text-xs tabular-nums text-zinc-500">
                                          {t.plannedWindowEnd}
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded border px-2 py-0.5 text-xs font-medium",
                                            scoreBadgeColor(overallScore(t)),
                                          )}
                                        >
                                          Score {overallScore(t)}/10
                                        </span>
                                      </span>
                                    </button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedTargetId((id) =>
                                          id === t.targetId ? null : t.targetId,
                                        );
                                      }}
                                      aria-expanded={isExpanded}
                                    >
                                      <ChevronDown
                                        className={cn(
                                          "h-4 w-4 transition-transform",
                                          isExpanded && "rotate-180",
                                        )}
                                      />
                                    </Button>
                                  </div>
                                  {isExpanded && (
                                    <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-3">
                                      <div className="flex flex-wrap gap-2">
                                        <span
                                          className={cn(
                                            "rounded border px-2 py-0.5 text-xs font-medium",
                                            scoreBadgeColor(
                                              scoreValue(t, "altitudeScore"),
                                            ),
                                          )}
                                        >
                                          Altitude{" "}
                                          {scoreValue(t, "altitudeScore")}/10
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded border px-2 py-0.5 text-xs font-medium",
                                            scoreBadgeColor(
                                              scoreValue(
                                                t,
                                                "moonSeparationScore",
                                              ),
                                            ),
                                          )}
                                        >
                                          Moon sep.{" "}
                                          {scoreValue(t, "moonSeparationScore")}
                                          /10
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded border px-2 py-0.5 text-xs font-medium",
                                            scoreBadgeColor(
                                              scoreValue(t, "rigFramingScore"),
                                            ),
                                          )}
                                        >
                                          Rig framing{" "}
                                          {scoreValue(t, "rigFramingScore")}/10
                                        </span>
                                      </div>
                                      <p className="text-xs text-zinc-400">
                                        {t.whyIncluded ??
                                          "Fits session window and altitude."}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <label className="text-zinc-500 block mb-0.5">
                                            Exposure (s)
                                          </label>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={t.subLength ?? 120}
                                            onChange={(e) =>
                                              updateTargetRecipe(t.targetId, {
                                                subLength:
                                                  Number(e.target.value) ||
                                                  undefined,
                                              })
                                            }
                                            className="h-8"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-zinc-500 block mb-0.5">
                                            ISO / Gain
                                          </label>
                                          <Input
                                            value={t.isoGain ?? ""}
                                            onChange={(e) =>
                                              updateTargetRecipe(t.targetId, {
                                                isoGain: e.target.value,
                                              })
                                            }
                                            placeholder="e.g. 1600"
                                            className="h-8"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-zinc-500 block mb-0.5">
                                            Planned subs
                                          </label>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={t.frames ?? 30}
                                            onChange={(e) =>
                                              updateTargetRecipe(t.targetId, {
                                                frames:
                                                  Number(e.target.value) ||
                                                  undefined,
                                              })
                                            }
                                            className="h-8"
                                          />
                                        </div>
                                        <div className="col-span-2 text-xs text-zinc-500">
                                          Total integration:{" "}
                                          {(() => {
                                            const subLength = t.subLength ?? 120;
                                            const frames = t.frames ?? 30;
                                            const totalSec = subLength * frames;
                                            const h = Math.floor(totalSec / 3600);
                                            const m = Math.floor((totalSec % 3600) / 60);
                                            return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer: Back / Next */}
            <div className="flex justify-between border-t border-white/10 px-4 py-4">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  size="default"
                  className="h-9"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step === 1 && (
                <Button
                  variant="cta"
                  size="default"
                  className="mission-page-cta h-9 px-4"
                  disabled={missionType === null}
                  onClick={() => missionType !== null && setStep(2)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {step === 2 && (
                <Button
                  variant="cta"
                  size="default"
                  className="mission-page-cta h-9 px-4"
                  onClick={handleGeneratePlan}
                  disabled={
                    missionType === "planetary" &&
                    selectedPlanetaryTargets.size === 0
                  }
                >
                  Generate Plan
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="cta"
                  size="default"
                  className="mission-page-cta h-9 px-4"
                  onClick={handleSave}
                >
                  Save Mission
                </Button>
              )}
            </div>
          </div>

          {/* Right column: Mission Preview + Conditions Source */}
          <div className="space-y-4 lg:col-span-2 lg:row-start-1">
            <div className="mission-panel sticky top-20 min-w-0 p-4">
              <h3 className="text-sm font-medium">Mission Preview</h3>
              <p className="mt-1 text-xs text-white/50">
                Review the mission context before generating the plan.
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div>
                  <dt className="text-white/50">Mission name</dt>
                  <dd className="text-white/90">{name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Site</dt>
                  <dd className="text-white/90">{location?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Rig</dt>
                  <dd className="text-white/90">{gear?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Date</dt>
                  <dd className="text-white/90">{displayDate}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Bortle</dt>
                  <dd className="text-white/90">{location?.bortle ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Session duration</dt>
                  <dd className="text-white/90">
                    {(() => {
                      const start = new Date(dateTime);
                      let end = new Date(sessionEndTime);
                      if (end.getTime() <= start.getTime()) {
                        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
                      }
                      const ms = end.getTime() - start.getTime();
                      const h = Math.floor(ms / 3_600_000);
                      const m = Math.floor((ms % 3_600_000) / 60_000);
                      return `${h} h ${m} min`;
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">Mission type</dt>
                  <dd className="text-white/90">
                    {missionType === "deep_sky"
                      ? "Deep Sky Mission"
                      : missionType === "planetary"
                        ? "Planetary Mission"
                        : "—"}
                  </dd>
                </div>
              </dl>
              {step === 2 && missionType === "planetary" && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-white/50 text-xs font-medium mb-2">
                    Selected targets
                  </p>
                  {selectedPlanetaryTargets.size === 0 ? (
                    <p className="text-xs text-white/50">No targets selected</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {Array.from(selectedPlanetaryTargets).map((targetName) => (
                        <li key={targetName} className="text-white/90">
                          {targetName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {step === 3 && orderedTargets.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-white/50 text-xs font-medium mb-2">
                    Selected targets
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    {orderedTargets.map((t) => (
                      <li
                        key={t.targetId}
                        className="flex justify-between gap-2 text-white/90"
                      >
                        <span className="min-w-0 truncate">{t.targetName}</span>
                        <span className="shrink-0 tabular-nums text-white/60">
                          {t.plannedWindowStart} – {t.plannedWindowEnd}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-xs text-white/50">
                Editable during planning. Locked during capture.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowCancelModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="mission-panel w-full max-w-md p-6"
          >
            <h3 className="text-lg font-medium">Cancel Mission?</h3>
            <p className="mt-2 text-sm text-white/60">
              Your current mission setup will be discarded.
            </p>
            <div className="mt-6 flex justify-between gap-2">
              <Button
                variant="ghost"
                className="h-9"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Editing
              </Button>
              <Button
                variant="destructive"
                className="h-9"
                onClick={() => {
                  setShowCancelModal(false);
                  router.push("/missions");
                }}
              >
                Cancel Mission
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
