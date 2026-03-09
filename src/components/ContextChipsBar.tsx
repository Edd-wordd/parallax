"use client";

import { useState } from "react";
import { MapPin, Telescope, Moon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ContextChipsBarProps {
  readOnly?: boolean;
}

export function ContextChipsBar({ readOnly = false }: ContextChipsBarProps) {
  const { activeLocationId, activeGearId, setActiveLocation, setActiveGear } =
    useAppStore();
  const [openChip, setOpenChip] = useState<"site" | "rig" | null>(null);

  const activeLoc = MOCK_LOCATIONS.find((l) => l.id === activeLocationId);
  const activeGear = MOCK_GEAR.find((g) => g.id === activeGearId);
  const siteLabel = activeLoc?.name ?? "—";
  const rigLabel = activeGear?.name ?? "—";
  const dateLabel = `Tonight (${formatDate(new Date().toISOString())})`;

  const chipBase =
    "inline-flex items-center gap-2 rounded-md h-8 px-2.5 bg-white/5 border border-white/10 text-xs text-zinc-300 transition-colors";
  const chipInteractive = "hover:bg-white/8 cursor-pointer";
  const chipPassive = "cursor-default";

  const iconClass = "size-[14px] shrink-0 text-white/60";

  const SiteChip = () => (
    <span className={cn(chipBase, readOnly ? chipPassive : chipInteractive)}>
      <MapPin className={iconClass} aria-hidden />
      <span>Site: {siteLabel}</span>
    </span>
  );

  const RigChip = () => (
    <span className={cn(chipBase, readOnly ? chipPassive : chipInteractive)}>
      <Telescope className={iconClass} aria-hidden />
      <span>Rig: {rigLabel}</span>
    </span>
  );

  const DateChip = () => (
    <span className={cn(chipBase, chipPassive)}>
      <Moon className={iconClass} aria-hidden />
      <span>Date: {dateLabel}</span>
    </span>
  );

  if (readOnly) {
    return (
      <div className="flex items-center gap-2">
        <SiteChip />
        <RigChip />
        <DateChip />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Site chip - stub dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenChip(openChip === "site" ? null : "site")}
          className={cn(chipBase, chipInteractive)}
        >
          <MapPin className={iconClass} aria-hidden />
          <span>Site: {siteLabel}</span>
        </button>
        {openChip === "site" && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenChip(null)}
              aria-hidden
            />
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
              {MOCK_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setActiveLocation(loc.id);
                    setOpenChip(null);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-800",
                    loc.id === activeLocationId && "text-cyan-400"
                  )}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rig chip - stub dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenChip(openChip === "rig" ? null : "rig")}
          className={cn(chipBase, chipInteractive)}
        >
          <Telescope className={iconClass} aria-hidden />
          <span>Rig: {rigLabel}</span>
        </button>
        {openChip === "rig" && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenChip(null)}
              aria-hidden
            />
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[140px] rounded border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
              {MOCK_GEAR.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setActiveGear(g.id);
                    setOpenChip(null);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-800",
                    g.id === activeGearId && "text-cyan-400"
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Date chip - read-only ( Tonight is fixed; no date picker stub needed ) */}
      <DateChip />
    </div>
  );
}
