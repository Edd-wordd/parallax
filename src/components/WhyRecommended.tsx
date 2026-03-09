"use client";

import { cn } from "@/lib/utils";

interface WhyRecommendedProps {
  bullets: string[];
  className?: string;
}

export function WhyRecommended({ bullets, className }: WhyRecommendedProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
        Why Recommended
      </div>
      <ul className="space-y-0.5 text-sm text-zinc-300">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-indigo-500/80">•</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
