"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMissionStore } from "@/lib/missionStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const RESULT_OPTIONS: { value: "success" | "partial" | "failed"; label: string }[] = [
  { value: "success", label: "Success" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
];

export default function MissionLogPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { getMission, updateMission } = useMissionStore();
  const mission = getMission(id);

  const [targetResults, setTargetResults] = useState<
    Record<string, { result?: "success" | "partial" | "failed"; subLength?: number; frames?: number; notes?: string }>
  >({});
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());
  const [applySubLength, setApplySubLength] = useState("");
  const [applyFrames, setApplyFrames] = useState("");

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Mission not found</p>
        <Link href="/missions">
          <Button variant="link" className="mt-2">
            Back to missions
          </Button>
        </Link>
      </div>
    );
  }

  const updateTargetResult = (
    targetId: string,
    updates: { result?: "success" | "partial" | "failed"; subLength?: number; frames?: number; notes?: string }
  ) => {
    setTargetResults((prev) => ({
      ...prev,
      [targetId]: { ...prev[targetId], ...updates },
    }));
  };

  const toggleExpanded = (targetId: string) => {
    setExpandedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const handleApplyToAll = () => {
    const sub = applySubLength ? Number(applySubLength) : undefined;
    const frames = applyFrames ? Number(applyFrames) : undefined;
    if (sub === undefined && frames === undefined) return;
    const next: typeof targetResults = {};
    mission.targets.forEach((t) => {
      next[t.targetId] = { ...targetResults[t.targetId] };
      if (sub !== undefined) next[t.targetId].subLength = sub;
      if (frames !== undefined) next[t.targetId].frames = frames;
    });
    setTargetResults(next);
  };

  const handleSave = () => {
    const updatedTargets = mission.targets.map((t) => {
      const r = targetResults[t.targetId];
      return {
        ...t,
        result: r?.result,
        subLength: r?.subLength,
        frames: r?.frames,
        notes: r?.notes,
        captured: r?.result === "success" || r?.result === "partial",
      };
    });
    const completed = updatedTargets.filter(
      (t) => t.result === "success" || t.result === "partial"
    ).length;
    updateMission(id, {
      targets: updatedTargets,
      status: completed === updatedTargets.length ? "completed" : mission.status,
      phase: completed === updatedTargets.length ? "completed" : "logging",
    });
    toast("Results saved");
    router.push(`/missions/${id}`);
  };

  const successCount = mission.targets.filter((t) => targetResults[t.targetId]?.result === "success").length;
  const partialCount = mission.targets.filter((t) => targetResults[t.targetId]?.result === "partial").length;
  const failedCount = mission.targets.filter((t) => targetResults[t.targetId]?.result === "failed").length;
  const totalFrames = mission.targets.reduce(
    (sum, t) => sum + (targetResults[t.targetId]?.frames ?? 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 max-w-2xl"
    >
      <h1 className="text-lg font-semibold tracking-tight">{mission.name}</h1>
      <Card>
        <CardHeader className="p-3">
          <h2 className="text-sm font-medium text-white/70">Session Summary</h2>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-white/50">Targets: <span className="text-white font-medium">{mission.targets.length}</span></span>
              <span className="text-white/50">Success: <span className="text-emerald-400 font-medium">{successCount}</span></span>
              <span className="text-white/50">Partial: <span className="text-amber-400 font-medium">{partialCount}</span></span>
              <span className="text-white/50">Failed: <span className="text-red-400/90 font-medium">{failedCount}</span></span>
              <span className="text-white/50">Total Frames: <span className="text-white font-medium">{totalFrames}</span></span>
            </div>
            <div className="flex gap-2">
              <Button variant="cta" size="sm" onClick={handleSave}>
                Save Log
              </Button>
              <Link href={`/missions/${id}`}>
                <Button variant="ghost" size="sm">
                  Back to Mission
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-white/70">Target Results</h2>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Sub"
                value={applySubLength}
                onChange={(e) => setApplySubLength(e.target.value)}
                className="w-16 h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Frames"
                value={applyFrames}
                onChange={(e) => setApplyFrames(e.target.value)}
                className="w-16 h-8 text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleApplyToAll}>
                Apply to all
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {mission.targets.map((t) => {
            const r = targetResults[t.targetId];
            const expanded = expandedTargets.has(t.targetId);
            return (
              <div
                key={t.targetId}
                className="rounded-lg border border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(t.targetId)}
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="size-4 shrink-0 text-white/50" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-white/50" />
                  )}
                  <span className="flex-1 font-medium text-sm truncate">{t.targetName}</span>
                  <span
                    className={`shrink-0 text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      r?.result === "success"
                        ? "text-emerald-400/90 bg-emerald-500/10"
                        : r?.result === "partial"
                          ? "text-amber-400/90 bg-amber-500/10"
                          : r?.result === "failed"
                            ? "text-red-400/90 bg-red-500/10"
                            : "text-white/40 bg-white/5"
                    }`}
                  >
                    {r?.result ? RESULT_OPTIONS.find((o) => o.value === r.result)?.label ?? r.result : "—"}
                  </span>
                  <span className="shrink-0 text-xs text-white/50">
                    {r?.frames ?? "—"} fr
                  </span>
                  <span className="shrink-0 text-xs text-white/50">
                    {r?.subLength ?? "—"}s
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-white/10 p-3 space-y-2 bg-white/[0.02]">
                    <div className="flex flex-wrap gap-1.5">
                      {RESULT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateTargetResult(t.targetId, { result: opt.value })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            r?.result === opt.value
                              ? "bg-teal-500/30 text-teal-300 border border-teal-500/40"
                              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/[0.07]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 items-end flex-wrap">
                      <div>
                        <label className="text-xs text-white/50 block">Sub length (sec)</label>
                        <Input
                          type="number"
                          value={r?.subLength ?? ""}
                          onChange={(e) =>
                            updateTargetResult(t.targetId, {
                              subLength: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder="60"
                          className="mt-0.5 w-20 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 block">Frames</label>
                        <Input
                          type="number"
                          value={r?.frames ?? ""}
                          onChange={(e) =>
                            updateTargetResult(t.targetId, {
                              frames: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder="30"
                          className="mt-0.5 w-20 h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-xs text-white/50 block">Notes</label>
                        <Input
                          value={r?.notes ?? ""}
                          onChange={(e) => updateTargetResult(t.targetId, { notes: e.target.value })}
                          placeholder="Optional notes"
                          className="mt-0.5 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
