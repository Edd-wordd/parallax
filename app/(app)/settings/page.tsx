"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import { useState } from "react";

export default function SettingsPage() {
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
    </motion.div>
  );
}
