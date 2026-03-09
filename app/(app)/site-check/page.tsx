"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMissionStore } from "@/lib/missionStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import {
  SiteVerificationBanner,
  ForecastVsLiveComparison,
  AdaptationRecommendationCard,
} from "@/components/sky-intelligence";
import {
  MOCK_COMPARISON_BETTER,
  MOCK_COMPARISON_SLIGHTLY_WORSE,
  MOCK_COMPARISON_MUCH_WORSE,
  MOCK_SUMMARY_BETTER,
  MOCK_SUMMARY_WORSE,
  MOCK_ADAPTATION_BETTER,
  MOCK_ADAPTATION_SLIGHTLY_WORSE,
  MOCK_ADAPTATION_MUCH_WORSE,
  MOCK_DECISION_PROCEED,
  MOCK_DECISION_ADJUST,
  MOCK_DECISION_PAUSE,
  type ComparisonRow,
  type MissionDecision,
  type AdaptationScenario,
} from "@/lib/mock/skyIntelligence";
import { cn } from "@/lib/utils";

type ScenarioKey = "better" | "slightly_worse" | "much_worse";

const SCENARIO_CONFIG: Record<
  ScenarioKey,
  {
    comparison: ComparisonRow[];
    summary: string;
    summaryVariant: "better" | "worse";
    decision: MissionDecision;
    adaptation: AdaptationScenario;
  }
> = {
  better: {
    comparison: MOCK_COMPARISON_BETTER,
    summary: MOCK_SUMMARY_BETTER,
    summaryVariant: "better",
    decision: MOCK_DECISION_PROCEED,
    adaptation: MOCK_ADAPTATION_BETTER,
  },
  slightly_worse: {
    comparison: MOCK_COMPARISON_SLIGHTLY_WORSE,
    summary: MOCK_SUMMARY_WORSE,
    summaryVariant: "worse",
    decision: MOCK_DECISION_ADJUST,
    adaptation: MOCK_ADAPTATION_SLIGHTLY_WORSE,
  },
  much_worse: {
    comparison: MOCK_COMPARISON_MUCH_WORSE,
    summary: MOCK_SUMMARY_WORSE,
    summaryVariant: "worse",
    decision: MOCK_DECISION_PAUSE,
    adaptation: MOCK_ADAPTATION_MUCH_WORSE,
  },
};

const DECISION_LABELS: Record<string, string> = {
  proceed: "Proceed",
  proceed_with_adjustments: "Proceed with adjustments",
  pause: "Pause / reconsider",
};

const DECISION_COLORS: Record<string, string> = {
  proceed: "border-teal-500/40 bg-teal-500/10 text-teal-300",
  proceed_with_adjustments: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  pause: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export default function SiteCheckPage() {
  const [scenario, setScenario] = useState<ScenarioKey>("better");
  const { activeMissionId, getMission } = useMissionStore();
  const mission = activeMissionId ? getMission(activeMissionId) ?? null : null;
  const loc = mission
    ? MOCK_LOCATIONS.find((l) => l.id === mission.locationId)
    : MOCK_LOCATIONS[0];

  const config = SCENARIO_CONFIG[scenario];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Site Verification
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Compare forecast vs live conditions once on location. Future: Pi /
            sky camera integration.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Scenario toggle — demo Better / Slightly Worse / Much Worse */}
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2">
        <span className="dash-section-title block mb-2">Demo scenario</span>
        <div
          className="inline-flex rounded-lg border border-zinc-700/60 bg-zinc-800/30 p-0.5"
          role="group"
        >
          {(["better", "slightly_worse", "much_worse"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScenario(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors",
                scenario === key
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              {key === "better" ? "Better" : key === "slightly_worse" ? "Slightly Worse" : "Much Worse"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary banner */}
      <SiteVerificationBanner
        message={config.summary}
        variant={config.summaryVariant}
      />

      {/* Context */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-medium">Verification context</h2>
        </CardHeader>
        <CardContent className="text-xs text-zinc-400 pt-0">
          Mission: {mission?.name ?? "Tonight's Mission"} · Location: {loc?.name}
        </CardContent>
      </Card>

      {/* Forecast vs Live comparison */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-medium">Planned vs Live</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Data from Pi / sky camera / sensors (mock)
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <ForecastVsLiveComparison rows={config.comparison} />
        </CardContent>
      </Card>

      {/* Mission decision card */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <h2 className="text-sm font-medium">Mission decision</h2>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${DECISION_COLORS[config.decision]}`}
          >
            {DECISION_LABELS[config.decision]}
          </div>
        </CardContent>
      </Card>

      {/* Mission Adaptation recommendations */}
      <AdaptationRecommendationCard scenario={config.adaptation} />
    </motion.div>
  );
}
