"use client";

import { cn } from "@/lib/utils";

export interface BreakdownItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

interface ScoreBreakdownProps {
  items: BreakdownItem[];
  total: number;
  className?: string;
}

export function ScoreBreakdown({ items, total, className }: ScoreBreakdownProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium">Score breakdown</div>
      {items.map((item) => {
        const pct = item.max ? (item.value / item.max) * 100 : Math.min(100, Math.abs(item.value) * 2);
        const isNeg = item.value < 0;
        const displayVal = item.value >= 0 ? `+${item.value}` : `${item.value}`;
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{item.label}</span>
              <span className={isNeg ? "text-amber-400" : "text-emerald-400"}>{displayVal}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.color ?? (isNeg ? "bg-amber-500" : "bg-cyan-500")
                )}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-1 text-right text-sm font-mono text-cyan-400">{total} total</div>
    </div>
  );
}
