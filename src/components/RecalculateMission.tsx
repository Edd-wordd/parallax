"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/Tooltip";

const LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const TOOLTIP_TEXT =
  "Adjust conditions if weather changes. The planner will recompute optimal targets.";

export function RecalculateMission() {
  const [seeing, setSeeing] = useState(3);
  const [transparency, setTransparency] = useState(3);
  const [wind, setWind] = useState(3);

  const handleRecalculate = () => {
    // No backend — placeholder for future planner recompute
  };

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="dash-section-title">
          Recalculate Mission
        </h2>
        <Tooltip content={TOOLTIP_TEXT}>
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-[10px] text-neutral-500 cursor-help"
            aria-label={TOOLTIP_TEXT}
          >
            ?
          </span>
        </Tooltip>
      </div>
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-neutral-500">Seeing</span>
            <span className="text-neutral-400 tabular-nums">
              {seeing} — {LABELS[seeing]}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={seeing}
            onValueChange={setSeeing}
            className="h-1.5"
          />
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-neutral-500">Transparency</span>
            <span className="text-neutral-400 tabular-nums">
              {transparency} — {LABELS[transparency]}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={transparency}
            onValueChange={setTransparency}
            className="h-1.5"
          />
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-neutral-500">Wind</span>
            <span className="text-neutral-400 tabular-nums">
              {wind} — {LABELS[wind]}
            </span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={wind}
            onValueChange={setWind}
            className="h-1.5"
          />
        </div>
      </div>
      <p className="text-[10px] text-neutral-500 mb-3">
        1 = Poor · 3 = Average · 5 = Excellent
      </p>
      <Button
        variant="outline"
        size="sm"
        className="w-full border-zinc-700/80 hover:border-indigo-500/30 hover:bg-indigo-500/5"
        onClick={handleRecalculate}
      >
        Recalculate Mission
      </Button>
    </div>
  );
}
