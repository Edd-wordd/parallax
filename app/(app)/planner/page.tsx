"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PlannerTimeline } from "@/components/PlannerTimeline";
import { TargetCard } from "@/components/TargetCard";
import { Button } from "@/components/ui/button";
import { MOCK_TARGETS } from "@/lib/mock/targets";
import { generateTonightRecommendations } from "@/lib/mock/recommendations";
import { useAppStore } from "@/lib/store";
import type { PlannerBlock } from "@/lib/types";

const initialBlocks: PlannerBlock[] = [
  { id: "1", target_id: "m31", target_name: "M31 Andromeda", start: "21:10", end: "22:40", score: 85 },
  { id: "2", target_id: "m42", target_name: "M42 Orion Nebula", start: "22:50", end: "01:20", score: 78 },
  { id: "3", target_id: "m45", target_name: "M45 Pleiades", start: "01:30", end: "03:10", score: 72 },
];

export default function PlannerPage() {
  const { minAltitude, moonTolerance, targetTypes } = useAppStore();
  const [blocks, setBlocks] = useState<PlannerBlock[]>(initialBlocks);
  const recs = generateTonightRecommendations(minAltitude, moonTolerance, targetTypes);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({ blocks, exportDate: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "astro-plan.json";
    a.click();
  };

  const handleExportPdf = () => {
    alert("Export PDF (mock) — would generate PDF from plan.");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session Planner</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJson}>
            Export to JSON
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            Export Plan (PDF)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Timeline</h2>
          <PlannerTimeline blocks={blocks} onReorder={setBlocks} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400">Constraints</h2>
          <div className="rounded-lg border border-zinc-700 p-4 text-sm text-zinc-300 space-y-2">
            <p>Min altitude: 30°</p>
            <p>Moon tolerance: 15°</p>
            <p>Target types: galaxy, nebula, clusters</p>
          </div>
          <h2 className="text-sm font-medium text-zinc-400 pt-4">Recommended</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recs.slice(0, 5).map((r) => (
              <TargetCard key={r.target.id} target={r.target} score={r.shootability_score} compact />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
