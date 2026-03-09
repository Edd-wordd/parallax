"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { PlannerBlock } from "@/lib/types";

interface PlannerTimelineProps {
  blocks: PlannerBlock[];
  onReorder?: (blocks: PlannerBlock[]) => void;
}

export function PlannerTimeline({ blocks, onReorder }: PlannerTimelineProps) {
  const [localBlocks, setLocalBlocks] = useState(blocks);

  const move = (index: number, dir: "up" | "down") => {
    const next = [...localBlocks];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setLocalBlocks(next);
    onReorder?.(next);
  };

  return (
    <div className="space-y-3">
      {localBlocks.map((b, i) => (
        <Card key={b.id} className="flex items-center justify-between p-4">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm text-cyan-400">
              {b.start} — {b.end}
            </div>
            <div className="font-medium mt-0.5">{b.target_name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Score {b.score}</div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => move(i, "up")}
              disabled={i === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => move(i, "down")}
              disabled={i === localBlocks.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
