"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Telescope, Moon, ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import {
  listGearProfiles,
  setActiveGearProfile,
} from "@/lib/supabase/queries/gear";
import { LOCATIONS_CHANGED_EVENT } from "@/components/LocationsSection";
import {
  DEFAULT_SESSION_HOURS,
  formatObservingNightLabel,
  sessionWindowFromMission,
} from "@/lib/time/sessionWindow";

export function ContextChipsBar() {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const {
    activeLocationId,
    activeGearId,
    dateTime,
    setActiveLocation,
    setActiveGear,
    setDateTime,
  } = useAppStore();

  const [siteOptions, setSiteOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [gearOptions, setGearOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [siteTimezoneById, setSiteTimezoneById] = useState<
    Record<string, string | null>
  >({});
  const [dateLabel, setDateLabel] = useState("—");
  const [mounted, setMounted] = useState(false);
  const [locationsEpoch, setLocationsEpoch] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onChanged = () => setLocationsEpoch((n) => n + 1);
    window.addEventListener(LOCATIONS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(LOCATIONS_CHANGED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const [locations, gear] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        setSiteOptions(locations.map((l) => ({ value: l.id, label: l.name })));
        const tzMap: Record<string, string | null> = {};
        for (const l of locations) {
          tzMap[l.id] = l.timezone ?? null;
        }
        setSiteTimezoneById(tzMap);
        setGearOptions(gear.map((g) => ({ value: g.id, label: g.name })));
      } catch {
        // AuthProvider surfaces connection errors; chips stay empty until ready.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeLocationId, activeGearId, locationsEpoch]);

  useEffect(() => {
    if (!mounted) return;
    const siteTimezone = siteTimezoneById[activeLocationId] ?? null;
    const window = sessionWindowFromMission({
      dateTime,
      fallbackHours: DEFAULT_SESSION_HOURS,
    });
    setDateLabel(
      formatObservingNightLabel({
        start: window.start,
        end: window.end,
        siteTimezone,
      }),
    );
  }, [dateTime, mounted, activeLocationId, siteTimezoneById]);

  const chipBase = "inline-flex items-center gap-2 text-xs w-[200px] shrink-0";
  const iconClass = "size-[14px] shrink-0 text-zinc-300";

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
            onValueChange={(id) => {
              setActiveGear(id);
              void setActiveGearProfile(getSupabaseBrowserClient(), id).catch(
                () => {
                  /* local active still updates; DB sync best-effort */
                },
              );
            }}
            className="!w-auto min-w-0 flex-1 !border-0 !bg-transparent !p-0 !pr-6 !text-zinc-400 !cursor-pointer focus:!ring-0 h-auto text-xs font-normal"
            aria-label="Select rig"
          />
        </span>
      </div>

      <div
        className={cn(chipBase, "cursor-pointer relative min-w-[220px] w-auto")}
        onClick={() => dateInputRef.current?.showPicker?.()}
        onKeyDown={(e) =>
          e.key === "Enter" && dateInputRef.current?.showPicker?.()
        }
        role="button"
        tabIndex={0}
        aria-label="Select date"
      >
        <Moon className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1 flex items-center gap-1">
          <span className="text-zinc-300 font-semibold shrink-0">Date</span>
          <span className="text-zinc-500 shrink-0">·</span>
          <span className="truncate text-zinc-400" title={dateLabel}>
            {dateLabel}
          </span>
          <ChevronDown className="size-3 shrink-0 text-zinc-500" />
        </span>
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  );
}
