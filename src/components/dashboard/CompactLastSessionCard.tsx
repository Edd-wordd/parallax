"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Mission } from "@/lib/types";

interface CompactLastSessionCardProps {
  mission: Mission | null;
}

export function CompactLastSessionCard({ mission }: CompactLastSessionCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-2.5">
      <h2 className="dash-section-title mb-1.5">Last Session</h2>
      {mission ? (
        <div className="space-y-1.5">
          <div>
            <p className="text-[11px] text-zinc-300 truncate">{mission.name}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {formatDate(mission.dateTime)}
              {mission.targets.length > 0 && (
                <span> · {mission.targets[0].targetName}</span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500">
              {mission.targets.length} targets
            </span>
            <Link href={`/missions/${mission.id}/log`}>
              <Button variant="secondary" size="sm">
                View Results
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] text-zinc-500">No recent session</p>
          <Link href="/sessions">
            <Button variant="secondary" size="sm">
              View Sessions
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
