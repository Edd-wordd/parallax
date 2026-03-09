"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  generateRunSheet,
  type RunSheet,
  type RunSheetInput,
  type TargetBlock,
  type GearProfile,
  type Conditions,
  type RunSheetEvent,
} from "@/lib/astro/runSheet";

// Removed motion.div staggered animations — static layout for performance

// ---------------------------------------------------------------------------
// Text export for Copy button
// ---------------------------------------------------------------------------
function runSheetToText(sheet: RunSheet): string {
  const created = new Date(sheet.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  let out = `CAPTURE RUN SHEET\nCreated: ${created}\n\n`;

  const phaseLabels: Record<string, string> = {
    now: "NOW",
    next: "NEXT",
    later: "LATER",
  };

  sheet.items.forEach((item) => {
    const phase = phaseLabels[item.phase] ?? "LATER";
    out += `${phase} (${item.start}–${item.end}): ${item.targetName}\n`;
    out += `- Exposure: ${item.exposureSeconds}s\n`;
    out += `- Frames: ${item.frames}\n`;
    out += `- Dither: every ${item.ditherEvery} frames\n`;
    out += `- Notes: ${item.notes.join("; ")}\n`;
    out += `- Confidence: ${Math.round(item.confidence * 100)}%\n\n`;
  });

  out += "EVENTS\n";
  sheet.events.forEach((e) => {
    out += `${e.time} ${e.label}\n`;
  });

  return out;
}

// ---------------------------------------------------------------------------
// Default mock inputs (can be overridden via props)
// ---------------------------------------------------------------------------
const DEFAULT_SCHEDULE: TargetBlock[] = [
  { targetName: "Andromeda", start: "19:50", end: "21:20" },
  { targetName: "Orion", start: "21:20", end: "23:30" },
  { targetName: "Pleiades", start: "23:30", end: "01:10" },
  { targetName: "Whirlpool", start: "01:10", end: "03:00" },
];

const DEFAULT_GEAR: GearProfile = {
  camera: "Sony a7R II",
  mount: "EQ",
  mountTrackingQuality: "good",
  focalLengthMm: 650,
};

const DEFAULT_CONDITIONS: Conditions = {
  seeing: 3,
  transparency: 4,
  wind: 2,
  clouds: 15,
  moonAltDeg: 25,
  bortle: 6,
};

const DEFAULT_EVENTS: RunSheetEvent[] = [
  { time: "23:15", type: "moonset", label: "Moonset" },
  { time: "01:22", type: "meridian_flip", label: "Meridian Flip" },
  { time: "06:12", type: "sunrise", label: "Sunrise" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CaptureRunSheetCardProps {
  /** Override mock inputs (optional) */
  input?: Partial<RunSheetInput>;
}

export function CaptureRunSheetCard({ input: inputOverrides }: CaptureRunSheetCardProps) {
  const { toast } = useToast();
  const [runSheet, setRunSheet] = useState<RunSheet | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "error">("idle");

  const buildInput = useCallback((): RunSheetInput => {
    const schedule = inputOverrides?.schedule ?? DEFAULT_SCHEDULE;
    const gear = inputOverrides?.gear ?? DEFAULT_GEAR;
    const conditions = inputOverrides?.conditions ?? DEFAULT_CONDITIONS;
    const events = inputOverrides?.events ?? DEFAULT_EVENTS;
    return { schedule, gear, conditions, events };
  }, [inputOverrides]);

  const generate = useCallback(() => {
    const input = buildInput();
    setRunSheet(generateRunSheet(input));
  }, [buildInput]);

  // When auto-refresh is ON: slight randomized drift on clouds/wind/moonAlt
  const generateWithDrift = useCallback(() => {
    const base = buildInput();
    const drift = () => (Math.random() - 0.5) * 0.15;
    const conditions: Conditions = {
      ...base.conditions,
      clouds: Math.max(0, Math.min(100, base.conditions.clouds + Math.round((Math.random() - 0.5) * 10))),
      wind: Math.max(1, Math.min(5, base.conditions.wind + Math.round((Math.random() - 0.5) * 1.5))),
      moonAltDeg: Math.max(0, base.conditions.moonAltDeg + (Math.random() - 0.5) * 8),
    };
    setRunSheet(generateRunSheet({ ...base, conditions }));
  }, [buildInput]);

  useEffect(() => {
    generate();
  }, [generate]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(generateWithDrift, 60_000);
    return () => clearInterval(id);
  }, [autoRefresh, generateWithDrift]);

  const handleCopy = async () => {
    if (!runSheet) return;
    setCopyStatus("idle");
    try {
      await navigator.clipboard.writeText(runSheetToText(runSheet));
      setCopyStatus("ok");
      toast("Run sheet copied to clipboard", "success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
      toast("Could not copy to clipboard", "error");
    }
  };

  const handleExport = () => {
    if (!runSheet) return;
    const blob = new Blob([JSON.stringify(runSheet, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "run-sheet.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Run sheet exported", "success");
  };

  if (!runSheet) return null;

  const { summary, items, events } = runSheet;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-white/70">Capture Run Sheet</h2>
          <p className="text-xs text-white/50">Field-ready execution plan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button size="sm" onClick={generate} variant="outline">
            Generate
          </Button>
          <Button size="sm" onClick={handleCopy} variant="outline">
            Copy
          </Button>
          <Button size="sm" onClick={handleExport} variant="outline">
            Export JSON
          </Button>
          <label className="flex items-center gap-2 text-xs text-zinc-400 ml-2">
            <Checkbox checked={autoRefresh} onCheckedChange={(c) => setAutoRefresh(!!c)} />
            Auto-refresh
          </label>
        </div>
        {copyStatus === "error" && (
          <p className="text-xs text-rose-400">Copy failed. Check clipboard permissions.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* A) NOW / NEXT / LATER quick section */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-xs text-white/50 uppercase tracking-wide">Now</span>
            <div className={cn("font-medium", summary.now && "text-indigo-400")}>
              {summary.now ?? "—"}
            </div>
          </div>
          <div>
            <span className="text-xs text-white/50 uppercase tracking-wide">Next</span>
            <div className="font-medium text-zinc-300">{summary.next ?? "—"}</div>
          </div>
          <div>
            <span className="text-xs text-white/50 uppercase tracking-wide">Later</span>
            <div className="font-medium text-zinc-400">{summary.later ?? "—"}</div>
          </div>
        </div>

        {/* B) RunSheetItem rows */}
        <div className="space-y-3">
          <div className="text-xs text-white/50 uppercase tracking-wide">Target blocks</div>
          <div className="space-y-2">
            {items.map((item) => {
              const isNow = item.phase === "now";
              const pct = Math.round(item.confidence * 100);
              const totalTime = `${Math.floor(item.totalTimeMinutes / 60)}h ${item.totalTimeMinutes % 60}m`;
              return (
                <div
                  key={`${item.targetName}-${item.start}`}
                  className={cn(
                    "rounded-lg border p-3 space-y-2",
                    isNow
                      ? "border-indigo-500/40 bg-indigo-500/5"
                      : "border-white/10 bg-white/[0.02]"
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium uppercase",
                          isNow ? "text-indigo-400" : "text-white/50"
                        )}
                      >
                        {item.phase.toUpperCase()}
                      </span>
                      <span className="font-medium">{item.targetName}</span>
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {item.start}–{item.end}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-zinc-400">
                    <span>Exposure: {item.exposureSeconds}s</span>
                    <span>Frames: ×{item.frames}</span>
                    <span>Est. time: {totalTime}</span>
                    <span>Dither: every {item.ditherEvery} frames</span>
                  </div>
                  {item.notes.length > 0 && (
                    <p className="text-xs text-zinc-500">{item.notes.join("; ")}</p>
                  )}
                  {/* Confidence bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-20 shrink-0">Confidence</span>
                    <div className="flex-1 min-w-0 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isNow ? "bg-indigo-500" : "bg-indigo-500/60"
                        )}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C) Events section */}
        <div>
          <div className="text-xs text-white/50 uppercase tracking-wide mb-2">Events</div>
          <ul className="space-y-1.5 text-sm">
            {events.map((e) => (
              <li
                key={e.time + e.label}
                className="flex justify-between gap-2 text-zinc-300"
              >
                <span className="text-zinc-500 tabular-nums">{e.time}</span>
                <span>{e.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
