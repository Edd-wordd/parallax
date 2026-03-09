"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ConnectivityState } from "@/lib/missionUIStore";

interface ConnectivityStateProps {
  connectivity: ConnectivityState;
}

/** Passive status chip for mission header — shows connectivity/offline status without interaction */
export function ConnectivityStatusChip({ connectivity }: ConnectivityStateProps) {
  const label =
    connectivity.status === "online"
      ? connectivity.isCached
        ? "Offline ready"
        : "Online"
      : "Offline";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
        "border-zinc-700 bg-zinc-900/80 text-zinc-400",
        connectivity.status === "online"
          ? connectivity.isCached
            ? "border-emerald-500/30 text-emerald-400/90"
            : "text-zinc-400"
          : "border-amber-500/30 text-amber-400/90"
      )}
      aria-label={`Status: ${label}`}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          connectivity.status === "online" ? "bg-emerald-500" : "bg-amber-500"
        )}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}

export function ConnectivityPopover({ connectivity }: ConnectivityStateProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label =
    connectivity.status === "online"
      ? connectivity.isCached
        ? "Offline-ready"
        : "Online"
      : "Offline";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
          "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-zinc-100",
          "focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            connectivity.status === "online" ? "bg-emerald-500" : "bg-amber-500"
          )}
          aria-hidden
        />
        <span>{label}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
          role="menu"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Mission available offline</span>
              <span>{connectivity.isCached ? "✅" : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Last sync</span>
              <span>{connectivity.lastSyncLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pending changes</span>
              <span>{connectivity.pendingOps}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
