import { cn, scoreColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums",
        size === "sm" && "text-sm",
        size === "md" && "text-lg",
        size === "lg" && "text-2xl",
        scoreColor(score),
        className
      )}
    >
      {score}
    </span>
  );
}
