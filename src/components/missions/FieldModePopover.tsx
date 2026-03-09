"use client";

import { useState, useRef, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { FieldModeOptions } from "@/lib/missionUIStore";

interface FieldModePopoverProps {
  isFieldMode: boolean;
  options: FieldModeOptions;
  onToggle: () => void;
  onOptionsChange: (o: Partial<FieldModeOptions>) => void;
}

export function FieldModePopover({
  isFieldMode,
  options,
  onToggle,
  onOptionsChange,
}: FieldModePopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
          "border-zinc-700 bg-zinc-900/80",
          isFieldMode && "border-cyan-500/50 bg-cyan-500/10",
          "focus-within:ring-2 focus-within:ring-cyan-500/50"
        )}
      >
        <div
          className="flex rounded-md overflow-hidden bg-zinc-800/50"
          role="group"
          aria-label="Display mode"
        >
          <button
            type="button"
            onClick={() => isFieldMode && onToggle()}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
              !isFieldMode ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-zinc-400"
            )}
            aria-pressed={!isFieldMode}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => !isFieldMode && onToggle()}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
              isFieldMode ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-zinc-400"
            )}
            aria-pressed={isFieldMode}
            title="Night vision / red-safe palette"
          >
            Field Mode
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
          role="menu"
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-400">Red-safe</span>
              <button
                type="button"
                role="switch"
                aria-checked={options.redSafe}
                onClick={() => onOptionsChange({ redSafe: !options.redSafe })}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  options.redSafe ? "bg-cyan-500" : "bg-zinc-600"
                )}
              />
            </label>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Dim overlay (0–80)</label>
              <Slider
                min={0}
                max={80}
                value={options.dimLevel}
                onValueChange={(v) => onOptionsChange({ dimLevel: v ?? 0 })}
              />
            </div>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span className="text-zinc-400">Reduce motion</span>
              <button
                type="button"
                role="switch"
                aria-checked={options.reduceMotion}
                onClick={() => onOptionsChange({ reduceMotion: !options.reduceMotion })}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  options.reduceMotion ? "bg-cyan-500" : "bg-zinc-600"
                )}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
