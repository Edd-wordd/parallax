"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NoMissionEmptyStateProps {
  onQuickMission: () => void;
}

export function NoMissionEmptyState({ onQuickMission }: NoMissionEmptyStateProps) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      <div className="px-5 py-5 text-center">
        <h2 className="font-display text-base font-semibold text-zinc-200 mb-1">
          No Active Mission
        </h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-4">
          Conditions look promising tonight. Review the forecast and recommended targets below to build a mission.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/missions/new">
            <Button variant="cta" size="sm" className="text-sm">
              Create Mission
            </Button>
          </Link>
          <Button variant="secondary" size="sm" className="text-sm" onClick={onQuickMission}>
            Quick Mission
          </Button>
        </div>
      </div>
    </div>
  );
}
