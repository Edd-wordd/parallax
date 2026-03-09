"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdaptiveAdvice } from "@/lib/mock/fieldOps";

interface AdaptiveMissionAdviceCardProps {
  advice: AdaptiveAdvice;
  compact?: boolean;
  className?: string;
}

const SEVERITY_STYLES: Record<AdaptiveAdvice["severity"], string> = {
  positive: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  neutral: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
  caution: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  warning: "border-rose-500/30 bg-rose-500/5 text-rose-400",
};

export function AdaptiveMissionAdviceCard({ advice, compact, className }: AdaptiveMissionAdviceCardProps) {
  const styleClass = SEVERITY_STYLES[advice.severity];

  return (
    <Card className={cn("border", styleClass, className)}>
      <CardHeader className={compact ? "px-3 py-2" : ""}>
        <h3 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {advice.title}
        </h3>
        {advice.basedOnConditionDelta && (
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {advice.basedOnConditionDelta}
          </p>
        )}
      </CardHeader>
      <CardContent className={cn(compact ? "px-3 pt-0 pb-2" : "pt-0")}>
        <p className={cn("text-zinc-300 mb-2", compact ? "text-xs" : "text-sm")}>
          {advice.summary}
        </p>
        <ul className="space-y-1">
          {advice.actionItems.map((item, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 text-zinc-300",
                compact ? "text-xs" : "text-sm",
              )}
            >
              <span className="text-neutral-500 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
