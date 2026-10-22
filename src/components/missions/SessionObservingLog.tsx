"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ObservingTimeline } from "@/components/missions/ObservingTimeline";
import type { MissionEventRow } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const DEFAULT_QUICK_EVENTS = [
  "Clouds moving in",
  "Guiding lost",
  "Meridian flip",
  "Conditions improved",
] as const;

interface SessionObservingLogProps {
  events: MissionEventRow[];
  isReadOnly?: boolean;
  onAddNote: (text: string) => void;
  onQuickEvent: (label: string) => void;
  quickEventLabels?: readonly string[];
  className?: string;
  /** Compact timeline height for side panels */
  compact?: boolean;
}

/**
 * Single surface for mission notes + durable observing timeline.
 * Composer writes `note` events; timeline shows all mission_events.
 */
export function SessionObservingLog({
  events,
  isReadOnly = false,
  onAddNote,
  onQuickEvent,
  quickEventLabels = DEFAULT_QUICK_EVENTS,
  className,
  compact = true,
}: SessionObservingLogProps) {
  const [noteInput, setNoteInput] = useState("");

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    const text = noteInput.trim();
    if (!text) return;
    onAddNote(text);
    setNoteInput("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div>
        <h2 className="mission-section-label mb-0.5">Observing log</h2>
        <p className="text-[11px] text-zinc-500">
          One timeline for notes, checklist, phase changes, and field actions.
        </p>
      </div>

      <ObservingTimeline
        events={events}
        compact={compact}
        className={compact ? undefined : "max-h-96 overflow-y-auto pr-1"}
        emptyMessage="Nothing logged yet — notes and checklist items appear here."
      />

      {!isReadOnly && (
        <div className="flex flex-wrap gap-2 pt-1">
          {quickEventLabels.map((label) => (
            <Button
              key={label}
              type="button"
              size="lg"
              variant="ghost"
              className="min-w-[9rem] h-9 px-3 text-[11px] border border-white/10 bg-white/5 justify-start"
              onClick={() => onQuickEvent(label)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <form onSubmit={handleSubmitNote} className="mt-auto flex gap-2 pt-1">
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Log what just happened…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-zinc-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!noteInput.trim()}
            className="border-white/10 bg-white/5"
          >
            Add
          </Button>
        </form>
      )}

      {isReadOnly && (
        <p className="mt-auto pt-2 text-[11px] text-zinc-500">
          Session ended — observing log is locked for this mission.
        </p>
      )}
    </div>
  );
}
