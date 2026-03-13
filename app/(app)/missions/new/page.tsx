"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { useAppStore } from "@/lib/store";
import { generateMockPlan } from "@/lib/mock/missions";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationPicker } from "@/components/LocationPicker";
import { GearPicker } from "@/components/GearPicker";
import { MissionTimeline } from "@/components/MissionTimeline";
import { MOCK_CONDITIONS_SOURCE } from "@/lib/mock/skyIntelligence";
import { useToast } from "@/components/ui/toast";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import type { Mission, MissionConstraint, MissionTarget } from "@/lib/types";

const TARGET_TYPES = ["galaxy", "nebula", "open_cluster", "globular_cluster"];
const STEP_NAMES = ["Setup", "Target Constraints", "Mission Plan"] as const;
const OBJECTIVES = [
  { value: "wide_field_nebula", label: "Wide Field Nebula" },
  { value: "galaxy_hunt", label: "Galaxy Hunt" },
  { value: "clusters_visual", label: "Clusters / Visual" },
  { value: "planetary", label: "Planetary" },
];

function generateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function MissionWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addMission, setActiveMission } = useMissionStore();
  const {
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
  const [locationId, setLocationId] = useState("loc1");
  const [gearId, setGearId] = useState("gear1");
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [useTonight, setUseTonight] = useState(true);
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

  const location = MOCK_LOCATIONS.find((l) => l.id === locationId);
  const gear = MOCK_GEAR.find((g) => g.id === gearId);
  const displayDate = useTonight ? "Tonight" : new Date(dateTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  useEffect(() => {
    setActiveLocation(locationId);
  }, [locationId, setActiveLocation]);

  useEffect(() => {
    setActiveGear(gearId);
  }, [gearId, setActiveGear]);

  useEffect(() => {
    const iso = useTonight ? new Date().toISOString() : new Date(dateTime).toISOString();
    setStoreDateTime(iso);
  }, [useTonight, dateTime, setStoreDateTime]);

  const handleGeneratePlan = () => {
    const plan = generateMockPlan(locationId, gearId, dateTime, constraints);
    setTargets(plan);
    setTargetOrder(plan.map((t) => t.targetId));
    setSelectedIds(new Set(plan.map((t) => t.targetId)));
    setGenerated(true);
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

  const moveTarget = (index: number, dir: "up" | "down") => {
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[j]] = [next[j], next[index]];
    setTargetOrder((prev) => [
      ...next,
      ...prev.filter((id) => !orderedIds.includes(id)),
    ]);
  };

  const handleSave = () => {
    const finalTargets = orderedTargets;
    const mission: Mission = {
      id: generateId(),
      name,
      dateTime: useTonight ? new Date().toISOString() : new Date(dateTime).toISOString(),
      locationId,
      gearId,
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
        className="relative z-10 mx-auto w-full max-w-5xl px-6 py-6 sm:px-8"
      >
      {/* Header: Create Mission | Cancel */}
      <header className="mission-page-header">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold uppercase tracking-tight text-white/95">Create Mission</h1>
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
        <div className="mission-panel min-w-0 overflow-hidden lg:col-span-3 lg:row-start-1">
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
                    <label className="mb-1 block text-xs text-white/60">Mission name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tonight's Mission"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Location</label>
                    <LocationPicker
                      locations={MOCK_LOCATIONS}
                      value={locationId}
                      onValueChange={setLocationId}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Gear</label>
                    <GearPicker
                      gear={MOCK_GEAR}
                      value={gearId}
                      onValueChange={setGearId}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox checked={useTonight} onCheckedChange={(c) => setUseTonight(!!c)} />
                  <label className="cursor-pointer text-xs text-white/70">Use Tonight</label>
                </div>
                {!useTonight && (
                  <div className="mt-2">
                    <Input
                      type="datetime-local"
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="h-9 max-w-[200px]"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {/* Section 1: Constraints */}
                <div>
                  <h3 className="text-sm font-medium text-white/90">Constraints</h3>
                  <p className="mb-3 mt-0.5 text-xs text-white/50">
                    Tune what &quot;good conditions&quot; means for this mission.
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-white/60">Min altitude</label>
                      <p className="mb-1.5 text-xs text-white/50">Ignore targets below this altitude.</p>
                      <Slider
                        min={0}
                        max={60}
                        value={constraints.minAltitude}
                        onValueChange={(v) => setConstraints((c) => ({ ...c, minAltitude: v }))}
                      />
                      <span className="text-xs text-white/50">{constraints.minAltitude}°</span>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/60">Moon tolerance</label>
                      <p className="mb-1.5 text-xs text-white/50">How close to the moon is acceptable.</p>
                      <Slider
                        min={0}
                        max={50}
                        value={constraints.moonTolerance}
                        onValueChange={(v) => setConstraints((c) => ({ ...c, moonTolerance: v }))}
                      />
                      <span className="text-xs text-white/50">{constraints.moonTolerance}%</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="mb-1 block text-xs text-white/60">Target types</span>
                      <p className="mb-2 text-xs text-white/50">Select what you&apos;re open to capturing tonight.</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {TARGET_TYPES.map((t) => (
                          <label key={t} className="flex cursor-pointer items-center gap-1.5 text-xs">
                            <Checkbox
                              checked={constraints.targetTypes.includes(t)}
                              onCheckedChange={(c) => {
                                if (c)
                                  setConstraints((x) => ({
                                    ...x,
                                    targetTypes: [...x.targetTypes, t],
                                  }));
                                else
                                  setConstraints((x) => ({
                                    ...x,
                                    targetTypes: x.targetTypes.filter((y) => y !== t),
                                  }));
                              }}
                            />
                            <span className="capitalize">{t.replace("_", " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
                        <Checkbox
                          checked={constraints.driveToDarker}
                          onCheckedChange={(c) =>
                            setConstraints((x) => ({ ...x, driveToDarker: !!c }))
                          }
                        />
                        Drive to darker site
                      </label>
                      <p className="mb-2 mt-0.5 text-xs text-white/50">Include sites within your max drive distance.</p>
                      {constraints.driveToDarker && (
                        <div className="mt-2">
                          <p className="mb-2 text-xs text-white/50">Maximum distance we will consider for better skies.</p>
                          <div className="flex items-center gap-2">
                            <Slider
                              min={15}
                            max={100}
                            value={constraints.driveRadius}
                            onValueChange={(v) => setConstraints((c) => ({ ...c, driveRadius: v }))}
                              className="flex-1"
                            />
                            <span className="w-8 text-xs text-white/50">{constraints.driveRadius} km</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider and Section 2: Objective */}
                <div className="mt-4 border-t border-white/10 pt-4">
                  <h3 className="text-sm font-medium text-white/90">Objective</h3>
                  <p className="mb-3 mt-0.5 text-xs text-white/50">
                    Choose the capture strategy we optimize for.
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-white/60">Objective</label>
                      <p className="mb-2 text-xs text-white/50">Select the planning strategy.</p>
                      <select
                        value={constraints.objective ?? ""}
                        onChange={(e) =>
                          setConstraints((c) => ({
                            ...c,
                            objective: e.target.value as MissionConstraint["objective"],
                          }))
                        }
                        className="flex h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 focus:border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      >
                        {OBJECTIVES.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="cta" size="default" className="mission-page-cta h-9 px-4" onClick={handleGeneratePlan}>
                        Generate Plan
                      </Button>
                    </div>
                  </div>
                </div>
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
                  <div className="space-y-3">
                    <MissionTimeline targets={orderedTargets} />
                    <div>
                      <span className="mb-2 block text-xs text-white/60">Select and reorder targets</span>
                      <div className="space-y-1">
                        {orderedTargets.map((t, i) => (
                          <div
                            key={t.targetId}
                            className="flex items-center justify-between rounded-lg border border-white/10 p-2 transition-colors hover:border-white/15"
                          >
                            <label className="flex flex-1 cursor-pointer items-center gap-2">
                              <Checkbox
                                checked={selectedIds.has(t.targetId)}
                                onCheckedChange={() => toggleTarget(t.targetId)}
                              />
                              <span className="text-sm">{t.targetName}</span>
                            </label>
                            <div className="flex gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => moveTarget(i, "up")}
                                disabled={i === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => moveTarget(i, "down")}
                                disabled={i === orderedTargets.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button variant="cta" size="default" className="mission-page-cta h-9 px-4" onClick={handleSave}>
                      Save Mission
                    </Button>
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
              {step < 3 && (
                <Button variant="cta" size="default" className="mission-page-cta h-9 px-4" onClick={() => setStep((s) => s + 1)}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

        {/* Right column: Mission Preview + Conditions Source */}
        <div className="space-y-4 lg:col-span-2 lg:row-start-1">
          <div className="mission-panel sticky top-20 min-w-0 p-4">
            <h3 className="text-sm font-medium">Mission Preview</h3>
            <p className="mt-1 text-xs text-white/50">Review the mission context before generating the plan.</p>
            <dl className="mt-3 space-y-2 text-xs">
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
              {location && (
                <div>
                  <dt className="text-white/50">Bortle</dt>
                  <dd className="text-white/90">{location.bortle}</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-xs text-white/50">
              Editable during planning. Locked during capture.
            </p>
          </div>

          {/* Conditions Source — before leaving, Atlas uses forecast/location only */}
          <div className="mission-panel min-w-0 p-4">
            <h3 className="text-sm font-medium">Conditions Source</h3>
            <p className="mt-1 text-xs text-white/50">
              Before you leave, Atlas uses forecast and location data only. Live
              verification available on-site.
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="text-white/50">Chosen location</dt>
                <dd className="text-white/90">{location?.name ?? MOCK_CONDITIONS_SOURCE.locationName}</dd>
              </div>
              <div>
                <dt className="text-white/50">Data source</dt>
                <dd className="text-white/90">{MOCK_CONDITIONS_SOURCE.dataSource}</dd>
              </div>
              <div>
                <dt className="text-white/50">Forecast confidence</dt>
                <dd className="text-white/90">{MOCK_CONDITIONS_SOURCE.forecastConfidence}%</dd>
              </div>
              <div className="flex gap-4">
                <span><dt className="text-white/50 inline">Cloud:</dt> <dd className="inline text-white/90">{MOCK_CONDITIONS_SOURCE.cloudCover}%</dd></span>
                <span><dt className="text-white/50 inline">Humidity:</dt> <dd className="inline text-white/90">{MOCK_CONDITIONS_SOURCE.humidity}%</dd></span>
                <span><dt className="text-white/50 inline">Wind:</dt> <dd className="inline text-white/90">{MOCK_CONDITIONS_SOURCE.windMph} mph</dd></span>
              </div>
              <div>
                <dt className="text-white/50">Moon phase / interference</dt>
                <dd className="text-white/90">{MOCK_CONDITIONS_SOURCE.moonPhase} · {MOCK_CONDITIONS_SOURCE.moonInterference}</dd>
              </div>
              <div>
                <dt className="text-white/50">Target visibility window</dt>
                <dd className="text-white/90">{MOCK_CONDITIONS_SOURCE.targetVisibilityWindow}</dd>
              </div>
              <div>
                <dt className="text-white/50">Sky brightness / Bortle</dt>
                <dd className="text-white/90">{MOCK_CONDITIONS_SOURCE.skyBrightness} mag/arcsec² · Bortle {MOCK_CONDITIONS_SOURCE.bortle}</dd>
              </div>
            </dl>
            <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/90">Recommendations</span>
              <ul className="mt-1.5 space-y-0.5 text-xs text-white/80">
                {MOCK_CONDITIONS_SOURCE.recommendations.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
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
              <Button variant="ghost" className="h-9" onClick={() => setShowCancelModal(false)}>
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
