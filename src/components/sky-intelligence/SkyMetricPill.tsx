"use client";

import { cn } from "@/lib/utils";

interface SkyMetricPillProps {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "muted";
  className?: string;
}

export function SkyMetricPill({
  label,
  value,
  variant = "default",
  className,
}: SkyMetricPillProps) {
  const variantClass =
    variant === "success"
      ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-400/90"
      : variant === "warning"
        ? "border-amber-500/20 bg-amber-500/5 text-amber-400/90"
        : variant === "muted"
          ? "border-zinc-700/50 bg-zinc-800/20 text-zinc-500"
          : "border-zinc-700/40 bg-zinc-800/20 text-zinc-300";

  return (
    <div
      className={cn(
        "rounded border px-2 py-1 inline-flex flex-col min-w-0",
        variantClass,
        className
      )}
    >
      <span className="dash-pill text-[10px] text-zinc-500 truncate">{label}</span>
      <span className="dash-metric text-xs truncate">{value}</span>
    </div>
  );
}
