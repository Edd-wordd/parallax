"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { GearProfilesSection } from "@/components/GearProfilesSection";
import { LocationsSection } from "@/components/LocationsSection";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SettingsTab = "gear" | "locations" | "preferences" | "general";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "gear", label: "Gear" },
  { id: "locations", label: "Locations" },
  { id: "preferences", label: "Preferences" },
  { id: "general", label: "General" },
];

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("gear");
  const { minAltitude, moonTolerance, setMinAltitude, setMoonTolerance } = useAppStore();
  const [units, setUnits] = useState("imperial");
  const [telemetry, setTelemetry] = useState(true);
  const [offline, setOffline] = useState(false);
  const [aiMode, setAiMode] = useState("cloud");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveTab(tabFromParam(params.get("tab")));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-2xl"
    >
      <h1 className="page-heading">Settings</h1>

      <div
        className="inline-flex rounded-lg border border-zinc-700/80 bg-zinc-800/40 p-0.5"
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
              <h2 className="text-sm font-medium">Preferences</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-400">Units</label>
                  <DemoBadge />
                </div>
                <Select
                  options={[
                    { value: "imperial", label: "Imperial" },
                    { value: "metric", label: "Metric" },
                  ]}
                  value={units}
                  onValueChange={setUnits}
                  className="mt-1 w-40"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  UI only — not saved to your account yet
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-400">Default min altitude</label>
                <Slider
                  min={0}
                  max={60}
                  value={minAltitude}
                  onValueChange={setMinAltitude}
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
                  onValueChange={setMoonTolerance}
                  className="mt-1"
                />
                <span className="text-xs text-zinc-500">{moonTolerance}°</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "general" && (
        <div className="pt-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-medium">Prototype controls</h2>
                <DemoBadge />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Local UI state only — none of these change app behavior yet.
              </p>
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
              <h2 className="text-sm font-medium">Credits &amp; data sources</h2>
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
