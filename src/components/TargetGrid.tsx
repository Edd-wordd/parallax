"use client";

import { TargetCard } from "./TargetCard";
import type { Target } from "@/lib/types";

interface TargetGridProps {
  targets: Target[];
  scores?: Record<string, number>;
  grid?: boolean;
}

export function TargetGrid({ targets, scores = {}, grid = true }: TargetGridProps) {
  return (
    <div
      className={
        grid
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-4"
      }
    >
      {targets.map((t) => (
        <TargetCard key={t.id} target={t} score={scores[t.id]} />
      ))}
    </div>
  );
}
