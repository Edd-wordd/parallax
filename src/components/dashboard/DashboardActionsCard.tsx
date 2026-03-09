"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardActionsCardProps {
  onQuickMission: () => void;
}

/** Compact action group: Create Mission, Quick Mission - sits beside Mission Control in top row */
export function DashboardActionsCard({
  onQuickMission,
}: DashboardActionsCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2 flex items-center justify-end gap-1.5 shrink-0">
      <Link href="/missions/new">
        <Button variant="cta" size="sm" className="h-7 text-xs">
          Create Mission
        </Button>
      </Link>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 text-xs"
        onClick={onQuickMission}
      >
        Quick Mission
      </Button>
    </div>
  );
}
