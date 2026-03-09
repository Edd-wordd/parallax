"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_GEAR } from "@/lib/mock/gear";

const MOCK_READINESS = {
  rigSelected: true,
  softwareSelected: true,
  fieldMode: false,
  offlineReady: true,
  siteVerification: "pending" as "pending" | "complete",
  captureReady: false,
};

export function MissionReadinessCard() {
  const items = [
    { key: "rig", label: "Rig selected", done: MOCK_READINESS.rigSelected, detail: MOCK_GEAR.find((g) => g.active)?.name ?? "—" },
    { key: "software", label: "Software selected", done: MOCK_READINESS.softwareSelected, detail: "NINA" },
    { key: "field", label: "Field mode", done: MOCK_READINESS.fieldMode, detail: MOCK_READINESS.fieldMode ? "On" : "Off" },
    { key: "offline", label: "Offline ready", done: MOCK_READINESS.offlineReady },
    { key: "site", label: "Site verification", done: MOCK_READINESS.siteVerification === "complete", detail: MOCK_READINESS.siteVerification === "complete" ? "Complete" : "Pending" },
    { key: "capture", label: "Capture ready", done: MOCK_READINESS.captureReady, detail: MOCK_READINESS.captureReady ? "Yes" : "No" },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5 flex flex-col h-full">
      <h2 className="dash-section-title mb-0.5">Mission Readiness</h2>
      <p className="text-[9px] text-zinc-500 mb-1.5">Plan → Setup → Verify → Run → Log</p>
      <div className="flex justify-between items-center text-[9px] mb-1">
        <span className="text-zinc-500">Progress</span>
        <span className="dash-metric text-zinc-400">{doneCount}/{total}</span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800/80 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-indigo-500/40 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 min-h-0">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center gap-1.5 py-0.5 px-1.5 rounded min-w-0",
              item.done ? "bg-zinc-800/30" : "bg-transparent"
            )}
          >
            {item.done ? (
              <Check className="h-3 w-3 shrink-0 text-emerald-500/70" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 text-zinc-600" strokeWidth={2} />
            )}
            <div className="min-w-0 truncate">
              <span className={cn("text-[10px] truncate block", item.done ? "text-zinc-400" : "text-zinc-500")}>
                {item.label}
              </span>
              {item.detail && (
                <span className="text-[9px] text-zinc-500 truncate block">{item.detail}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link href="/site-check" className="mt-1.5 text-[10px] text-indigo-400/80 hover:text-indigo-400/90">
        Verify on site
      </Link>
    </div>
  );
}
