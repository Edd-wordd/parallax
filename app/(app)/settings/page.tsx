"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { GearProfilesSection } from "@/components/GearProfilesSection";
import { LocationsSection } from "@/components/LocationsSection";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SettingsTab = "gear" | "locations" | "preferences" | "general";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "gear", label: "Gear" },
  { id: "locations", label: "Locations" },
  { id: "preferences", label: "Preferences" },
  { id: "general", label: "General" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("gear");
  const { minAltitude, moonTolerance, setMinAltitude, setMoonTolerance } = useAppStore();
  const [units, setUnits] = useState("imperial");
  const [telemetry, setTelemetry] = useState(true);
  const [offline, setOffline] = useState(false);
  const [aiMode, setAiMode] = useState("cloud");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-2xl"
    >
      <h1 className="text-2xl font-bold">Settings</h1>

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
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-zinc-400">Units</label>
                <Select
                  options={[
                    { value: "imperial", label: "Imperial" },
                    { value: "metric", label: "Metric" },
                  ]}
                  value={units}
                  onValueChange={setUnits}
                  className="mt-1 w-40"
                />
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
              <h2 className="text-sm font-medium">Offline mode</h2>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-2">
                <Checkbox checked={offline} onCheckedChange={setOffline} />
                Enable offline mode (UI only)
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">AI mode</h2>
            </CardHeader>
            <CardContent>
              <Select
                options={[
                  { value: "cloud", label: "Cloud" },
                  { value: "local", label: "Local" },
                ]}
                value={aiMode}
                onValueChange={setAiMode}
                className="w-40"
              />
              <p className="mt-2 text-xs text-zinc-500">UI only — no real AI backend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Telemetry</h2>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-2">
                <Checkbox checked={telemetry} onCheckedChange={setTelemetry} />
                Enable Sentry error reporting
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                When enabled and DSN is set, errors are sent to Sentry. No DSN required for app to run.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
