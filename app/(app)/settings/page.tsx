"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { GearProfilesSection } from "@/components/GearProfilesSection";
import { LocationsSection } from "@/components/LocationsSection";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertUserPreferences } from "@/lib/supabase/queries";
import type { Units } from "@/lib/schemas/userPreferences";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SettingsTab = "gear" | "locations" | "preferences" | "general";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "gear", label: "Gear" },
  { id: "locations", label: "Locations" },
  { id: "preferences", label: "Preferences" },
  { id: "general", label: "General" },
];

const PREFS_DEBOUNCE_MS = 400;

function DemoBadge() {
  return (
    <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
      Demo
    </span>
  );
}

function tabFromParam(value: string | null): SettingsTab {
  if (
    value === "gear" ||
    value === "locations" ||
    value === "preferences" ||
    value === "general"
  ) {
    return value;
  }
  return "gear";
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window === "undefined") return "gear";
    return tabFromParam(new URLSearchParams(window.location.search).get("tab"));
  });
  const { userId } = useAuth();
  const {
    minAltitude,
    moonTolerance,
    units,
    setMinAltitude,
    setMoonTolerance,
    setUnits,
  } = useAppStore();
  const [telemetry, setTelemetry] = useState(true);
  const [offline, setOffline] = useState(false);
  const [aiMode, setAiMode] = useState("cloud");
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGenRef = useRef(0);

  const persistPrefs = useCallback(
    async (next: {
      units: Units;
      minAltitude: number;
      moonTolerance: number;
    }) => {
      if (!userId) {
        setPrefsError("Not saved");
        return;
      }
      const gen = ++saveGenRef.current;
      setPrefsSaving(true);
      setPrefsError(null);
      try {
        const client = getSupabaseBrowserClient();
        await upsertUserPreferences(client, userId, {
          units: next.units,
          default_min_altitude: next.minAltitude,
          default_moon_tolerance: next.moonTolerance,
        });
        if (gen !== saveGenRef.current) return;
      } catch {
        if (gen !== saveGenRef.current) return;
        setPrefsError("Not saved");
      } finally {
        if (gen === saveGenRef.current) setPrefsSaving(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    return () => {
      if (!debounceRef.current) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      const s = useAppStore.getState();
      // Fire-and-forget so a pending debounce is not lost on navigate.
      void persistPrefs({
        units: s.units,
        minAltitude: s.minAltitude,
        moonTolerance: s.moonTolerance,
      });
    };
  }, [persistPrefs]);

  const schedulePersist = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const s = useAppStore.getState();
      void persistPrefs({
        units: s.units,
        minAltitude: s.minAltitude,
        moonTolerance: s.moonTolerance,
      });
    }, PREFS_DEBOUNCE_MS);
  }, [persistPrefs]);

  const onUnitsChange = (value: string) => {
    setUnits(value as Units);
    schedulePersist();
  };

  const onMinAltitudeChange = (value: number) => {
    setMinAltitude(value);
    schedulePersist();
  };

  const onMoonToleranceChange = (value: number) => {
    setMoonTolerance(value);
    schedulePersist();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-2xl"
    >
      <div>
        <h1 className="page-heading">Settings</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Gear, sites, and planning defaults. Preferences sync to your account.
        </p>
      </div>

      <div
        className="inline-flex rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-0.5"
        role="tablist"
        aria-label="Settings sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-700/40 hover:text-zinc-400"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "gear" && (
        <div className="pt-2">
          <GearProfilesSection />
        </div>
      )}

      {activeTab === "locations" && (
        <div className="pt-2">
          <LocationsSection />
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="pt-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Preferences</CardTitle>
                {prefsSaving && (
                  <span className="text-[11px] text-zinc-500">Saving…</span>
                )}
              </div>
              <CardDescription>
                Saved to Supabase for this account. Used as planning defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400">Units</label>
                <Select
                  options={[
                    { value: "imperial", label: "Imperial" },
                    { value: "metric", label: "Metric" },
                  ]}
                  value={units}
                  onValueChange={onUnitsChange}
                  className="mt-1 w-40"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Default min altitude</label>
                <Slider
                  min={0}
                  max={60}
                  value={minAltitude}
                  onValueChange={onMinAltitudeChange}
                  className="mt-1"
                />
                <span className="text-xs text-zinc-500">{minAltitude}°</span>
                {minAltitude < 30 && (
                  <p className="mt-1.5 text-xs text-amber-400">
                    Below 30° atmospheric distortion will significantly reduce image quality.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-zinc-400">Default moon tolerance</label>
                <Slider
                  min={0}
                  max={50}
                  value={moonTolerance}
                  onValueChange={onMoonToleranceChange}
                  className="mt-1"
                />
                <span className="text-xs text-zinc-500">{moonTolerance}°</span>
              </div>
              {prefsError && (
                <p className="text-xs text-amber-400" role="alert">
                  {prefsError}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "general" && (
        <div className="pt-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Prototype controls</CardTitle>
                <DemoBadge />
              </div>
              <CardDescription>
                Local UI state only — none of these change app behavior yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Offline mode
                </h3>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox checked={offline} onCheckedChange={setOffline} />
                  Enable offline mode
                </label>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  AI mode
                </h3>
                <Select
                  options={[
                    { value: "cloud", label: "Cloud" },
                    { value: "local", label: "Local" },
                  ]}
                  value={aiMode}
                  onValueChange={setAiMode}
                  className="mt-2 w-40"
                />
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Telemetry
                </h3>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox checked={telemetry} onCheckedChange={setTelemetry} />
                  Enable error reporting
                </label>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Toggle is not wired — Sentry still follows env DSN only.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credits &amp; data sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-zinc-500 leading-relaxed">
              <p>
                Deep-sky catalog facts are derived in part from{" "}
                <a
                  href="https://github.com/mattiaverga/OpenNGC"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  OpenNGC
                </a>{" "}
                by Mattia Verga, licensed under{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  CC BY-SA 4.0
                </a>
                . See <code className="text-zinc-400">data/catalog/NOTICE</code>.
              </p>
              <p>
                Default object images are DSS2 survey cutouts from{" "}
                <a
                  href="https://alasky.cds.unistra.fr/hips-image-services/hips2fits"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  CDS Aladin HiPS
                </a>
                , matched by catalog coordinates. Astronomy positions use
                Astronomy Engine; weather uses Open-Meteo / 7Timer.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
