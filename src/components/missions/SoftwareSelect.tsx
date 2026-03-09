"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SoftwareName, SoftwareState, SoftwareCaps } from "@/lib/missionUIStore";

const SOFTWARE_OPTIONS: SoftwareName[] = [
  "Ekos (Astroberry)",
  "NINA",
  "ASIAIR",
  "APT",
  "Siril only",
  "Other",
];

interface SoftwareSelectProps {
  software: SoftwareState;
  onChange: (s: Partial<SoftwareState>) => void;
  compact?: boolean;
}

export function SoftwareSelect({ software, onChange, compact }: SoftwareSelectProps) {
  const capLabels: (keyof SoftwareCaps)[] = ["plateSolve", "autoFocus", "guiding", "dithering"];
  const capDisplay: Record<keyof SoftwareCaps, string> = {
    plateSolve: "Plate solve",
    autoFocus: "Autofocus",
    guiding: "Guiding",
    dithering: "Dithering",
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Software</label>
        <select
          value={software.name}
          onChange={(e) => onChange({ name: e.target.value as SoftwareName })}
          className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          {SOFTWARE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      {software.name === "Other" && (
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Name</label>
          <Input
            value={software.otherName ?? ""}
            onChange={(e) => onChange({ otherName: e.target.value })}
            placeholder="Enter software name"
            className="text-sm"
          />
        </div>
      )}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {capLabels.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() =>
                onChange({
                  caps: { ...software.caps, [cap]: !software.caps[cap] },
                })
              }
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                software.caps[cap]
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-zinc-800/50 text-zinc-500 border border-zinc-700"
              )}
            >
              {capDisplay[cap]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
