"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Telescope, Moon, ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ContextChipsBar() {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const { activeLocationId, activeGearId, dateTime, setActiveLocation, setActiveGear, setDateTime } = useAppStore();

  const activeLoc = MOCK_LOCATIONS.find((l) => l.id === activeLocationId);
  const activeGear = MOCK_GEAR.find((g) => g.id === activeGearId);

  const [dateLabel, setDateLabel] = useState(() => formatDate(dateTime));

  useEffect(() => {
    const d = new Date(dateTime);
    const now = new Date();
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    setDateLabel(isSameDay ? `Tonight (${formatDate(dateTime)})` : formatDate(dateTime));
  }, [dateTime]);

  const chipBase = "inline-flex items-center gap-2 text-xs w-[200px] shrink-0";
  const iconClass = "size-[14px] shrink-0 text-zinc-300";

  const siteOptions = MOCK_LOCATIONS.map((l) => ({ value: l.id, label: l.name }));
  const gearOptions = MOCK_GEAR.map((g) => ({ value: g.id, label: g.name }));

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const picked = new Date(value + "T00:00:00");
    const current = new Date(dateTime);
    current.setFullYear(picked.getFullYear());
    current.setMonth(picked.getMonth());
    current.setDate(picked.getDate());
    setDateTime(current.toISOString());
  };

  const dateValue = (() => {
    const d = new Date(dateTime);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div className="flex items-center gap-10">
      <div className={chipBase}>
        <MapPin className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1 flex items-center gap-1">
          <span className="text-zinc-300 font-semibold shrink-0">Site</span>
          <span className="text-zinc-500 shrink-0">·</span>
          <Select
            options={siteOptions}
            value={activeLocationId}
            onValueChange={setActiveLocation}
            className="!w-auto min-w-0 flex-1 !border-0 !bg-transparent !p-0 !pr-6 !text-zinc-400 !cursor-pointer focus:!ring-0 h-auto text-xs font-normal"
            aria-label="Select site"
          />
        </span>
      </div>

      <div className={chipBase}>
        <Telescope className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1 flex items-center gap-1">
          <span className="text-zinc-300 font-semibold shrink-0">Rig</span>
          <span className="text-zinc-500 shrink-0">·</span>
          <Select
            options={gearOptions}
            value={activeGearId}
            onValueChange={setActiveGear}
            className="!w-auto min-w-0 flex-1 !border-0 !bg-transparent !p-0 !pr-6 !text-zinc-400 !cursor-pointer focus:!ring-0 h-auto text-xs font-normal"
            aria-label="Select rig"
          />
        </span>
      </div>

      <div
        className={cn(chipBase, "cursor-pointer relative")}
        onClick={() => dateInputRef.current?.showPicker?.()}
        onKeyDown={(e) => e.key === "Enter" && dateInputRef.current?.showPicker?.()}
        role="button"
        tabIndex={0}
        aria-label="Select date"
      >
        <Moon className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1 flex items-center gap-1">
          <span className="text-zinc-300 font-semibold shrink-0">Date</span>
          <span className="text-zinc-500 shrink-0">·</span>
          <span className="text-zinc-400 truncate">{dateLabel}</span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-zinc-500 pointer-events-none" />
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark]"
          aria-hidden
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
