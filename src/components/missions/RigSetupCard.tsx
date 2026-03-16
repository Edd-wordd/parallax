import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SoftwareSelect } from "@/components/missions/SoftwareSelect";
import type { SoftwareState } from "@/lib/missionUIStore";

interface RigSetupCardProps {
  software: SoftwareState;
  onSoftwareChange: (s: Partial<SoftwareState>) => void;
  className?: string;
}

type SetupTab = "checklist" | "howto" | "optimize" | "guidance";

export function RigSetupCard({
  software,
  onSoftwareChange,
  className,
}: RigSetupCardProps) {
  const [activeTab, setActiveTab] = useState<SetupTab>("checklist");

  // Local checklist state
  const [powerOn, setPowerOn] = useState(false);
  const [powerLog, setPowerLog] = useState("");
  const [cablesOk, setCablesOk] = useState(false);
  const [dewOn, setDewOn] = useState(false);
  const [dewPercent, setDewPercent] = useState("60");
  const [polarAligned, setPolarAligned] = useState(false);
  const [polarError, setPolarError] = useState("");
  const [mountLevel, setMountLevel] = useState(false);
  const [balanced, setBalanced] = useState(false);
  const [focusDone, setFocusDone] = useState(false);
  const [focusHfr, setFocusHfr] = useState("");
  const [guideCalibrated, setGuideCalibrated] = useState(false);
  const [guidingOn, setGuidingOn] = useState(false);
  const [guideRms, setGuideRms] = useState("");

  return (
    <div className={cn("mission-panel p-4 flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="mission-section-label mb-0">Rig Setup</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <SoftwareSelect
            software={software}
            onChange={onSoftwareChange}
            compact
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs border-b border-white/10 pb-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={cn(
            "px-2.5 py-1 rounded-full",
            activeTab === "checklist"
              ? "bg-white/10 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          Checklist
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("howto")}
          className={cn(
            "px-2.5 py-1 rounded-full",
            activeTab === "howto"
              ? "bg-white/10 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          How-To
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("optimize")}
          className={cn(
            "px-2.5 py-1 rounded-full",
            activeTab === "optimize"
              ? "bg-white/10 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          Optimize
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guidance")}
          className={cn(
            "px-2.5 py-1 rounded-full",
            activeTab === "guidance"
              ? "bg-white/10 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-200",
          )}
        >
          Guidance
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {activeTab === "checklist" && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {["Power", "Mount", "Focus", "Guiding", "Solve"].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-yellow-200"
                >
                  {label}
                  <span className="text-[9px] font-normal text-yellow-300/80">
                    · Unknown
                  </span>
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-300">
                Power &amp; Connections
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={powerOn}
                  onChange={(e) => setPowerOn(e.target.checked)}
                />
                <span className="text-zinc-200 flex-1">Power on equipment</span>
                <input
                  type="text"
                  value={powerLog}
                  onChange={(e) => setPowerLog(e.target.value)}
                  placeholder="Log value"
                  className="w-32 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={cablesOk}
                  onChange={(e) => setCablesOk(e.target.checked)}
                />
                <span className="text-zinc-200">
                  Verify cables &amp; connections
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={dewOn}
                  onChange={(e) => setDewOn(e.target.checked)}
                />
                <span className="text-zinc-200 flex-1">Dew heater on</span>
                <input
                  type="number"
                  value={dewPercent}
                  onChange={(e) => setDewPercent(e.target.value)}
                  className="w-16 rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[11px] text-zinc-200"
                />
                <span className="text-[11px] text-zinc-400">%</span>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-300">
                Mount &amp; Alignment
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={polarAligned}
                  onChange={(e) => setPolarAligned(e.target.checked)}
                />
                <span className="text-zinc-200 flex-1">
                  Polar alignment
                  <span className="ml-1 text-[10px] uppercase text-rose-300">
                    Critical
                  </span>
                </span>
                <input
                  type="text"
                  value={polarError}
                  onChange={(e) => setPolarError(e.target.value)}
                  placeholder="Error"
                  className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px] border-white/10 bg-white/5"
                >
                  Log val
                </Button>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={mountLevel}
                  onChange={(e) => setMountLevel(e.target.checked)}
                />
                <span className="text-zinc-200">Level mount</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={balanced}
                  onChange={(e) => setBalanced(e.target.checked)}
                />
                <span className="text-zinc-200">Balance RA &amp; Dec</span>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-300">Focus</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={focusDone}
                  onChange={(e) => setFocusDone(e.target.checked)}
                />
                <span className="text-zinc-200 flex-1">
                  Focus routine complete
                  <span className="ml-1 text-[10px] uppercase text-rose-300">
                    Critical
                  </span>
                </span>
                <input
                  type="text"
                  value={focusHfr}
                  onChange={(e) => setFocusHfr(e.target.value)}
                  placeholder="HFR"
                  className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px] border-white/10 bg-white/5"
                >
                  Log val
                </Button>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-zinc-300">Guiding</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={guideCalibrated}
                  onChange={(e) => setGuideCalibrated(e.target.checked)}
                />
                <span className="text-zinc-200">Calibrate guiding</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/40"
                  checked={guidingOn}
                  onChange={(e) => setGuidingOn(e.target.checked)}
                />
                <span className="text-zinc-200 flex-1">Enable guiding</span>
                <input
                  type="text"
                  value={guideRms}
                  onChange={(e) => setGuideRms(e.target.value)}
                  placeholder="RMS"
                  className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[10px] border-white/10 bg-white/5"
                >
                  Log val
                </Button>
              </label>
            </div>
          </div>
        )}

        {activeTab === "howto" && (
          <p className="text-xs text-zinc-400">How-To guidance coming soon.</p>
        )}

        {activeTab === "optimize" && (
          <p className="text-xs text-zinc-400">
            Optimization suggestions coming soon.
          </p>
        )}

        {activeTab === "guidance" && (
          <div className="space-y-2 text-xs text-zinc-300">
            <p>
              Use this space for observatory-specific setup guidance, gotchas, or
              rig quirks you want to remember.
            </p>
            <p className="text-zinc-400">
              Examples: preferred polar alignment workflow, balance tweaks for
              meridian flips, or notes on when to refocus as temperature drops.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

