"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdaptationScenario } from "@/lib/mock/skyIntelligence";

interface AdaptationRecommendationCardProps {
  scenario: AdaptationScenario;
  compact?: boolean;
  className?: string;
}

const SCENARIO_STYLES = {
  better: "border-emerald-500/30 bg-emerald-500/5",
  slightly_worse: "border-amber-500/30 bg-amber-500/5",
  much_worse: "border-rose-500/30 bg-rose-500/5",
};

export function AdaptationRecommendationCard({
  scenario,
  compact,
  className,
}: AdaptationRecommendationCardProps) {
  const styleClass = SCENARIO_STYLES[scenario.id];

  return (
    <Card className={cn("border", styleClass, className)}>
      <CardHeader className={compact ? "px-3 py-2" : ""}>
        <h3
          className={cn(
            "font-medium",
            scenario.id === "better" && "text-emerald-400",
            scenario.id === "slightly_worse" && "text-amber-400",
            scenario.id === "much_worse" && "text-rose-400",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {scenario.label}
        </h3>
      </CardHeader>
      <CardContent className={cn(compact ? "px-3 pt-0 pb-2" : "pt-0")}>
        <ul
          className={cn(
            "space-y-1.5",
            compact ? "space-y-1" : ""
          )}
        >
          {scenario.recommendations.map((rec, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 text-zinc-300",
                compact ? "text-xs" : "text-sm"
              )}
            >
              <span className="text-neutral-500 mt-0.5 shrink-0">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
