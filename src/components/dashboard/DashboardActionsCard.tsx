"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Compact action group: Create Mission - sits beside Mission Control in top row */
export function DashboardActionsCard() {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2 flex items-center justify-end gap-1.5 shrink-0">
      <Link href="/missions/new">
        <Button variant="cta" size="sm" className="h-7 text-xs">
          Create Mission
        </Button>
      </Link>
    </div>
  );
}
