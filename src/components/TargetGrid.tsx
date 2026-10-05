"use client";

import Link from "next/link";
import { TargetCard } from "./TargetCard";
import { CatalogObjectImage } from "@/components/catalog/CatalogObjectImage";
import type { ExplorerTargetRow } from "@/lib/catalog";
import type { Target } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/ScoreBadge";

interface TargetGridProps {
  targets?: Target[];
  rows?: ExplorerTargetRow[];
  scores?: Record<string, number>;
  grid?: boolean;
}

function statusStyles(status: ExplorerTargetRow["status"]) {
  switch (status) {
    case "recommended":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    case "visible":
      return "bg-emerald-500/15 text-emerald-300/90 border-emerald-500/25";
    case "unsuitable":
      return "bg-zinc-800 text-zinc-500 border-zinc-700/60";
  }
}

function statusLabel(status: ExplorerTargetRow["status"]) {
  switch (status) {
    case "recommended":
      return "Recommended";
    case "visible":
      return "Visible";
    case "unsuitable":
      return "Unsuitable";
  }
}

function ExplorerCard({ row }: { row: ExplorerTargetRow }) {
  const { target, status, score, windowLabel, reasonLabel } = row;
  return (
    <Link href={`/targets/${target.id}`}>
      <div className="h-full rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden transition-colors hover:border-indigo-500/25">
        <CatalogObjectImage
          catalogId={target.id}
          targetType={target.type}
          className="aspect-video w-full"
        />
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium truncate text-sm text-zinc-100">
              {target.name}
            </h3>
            {score != null && status === "recommended" && (
              <ScoreBadge score={score} size="md" className="shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase",
                statusStyles(status),
              )}
            >
              {statusLabel(status)}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {target.type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {Number.isFinite(target.magnitude)
              ? `Mag ${target.magnitude.toFixed(1)}`
              : "Mag —"}
            {" · "}
            {target.constellation}
            {windowLabel ? (
              <span className="text-zinc-400"> · {windowLabel}</span>
            ) : null}
          </p>
          {reasonLabel && status !== "recommended" && (
            <p className="text-[11px] text-zinc-600">{reasonLabel}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TargetGrid({
  targets,
  rows,
  scores = {},
  grid = true,
}: TargetGridProps) {
  const layout = grid
    ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    : "flex flex-col gap-4";

  if (rows) {
    return (
      <div className={layout}>
        {rows.map((row) => (
          <ExplorerCard key={row.target.id} row={row} />
        ))}
      </div>
    );
  }

  return (
    <div className={layout}>
      {(targets ?? []).map((t) => (
        <TargetCard key={t.id} target={t} score={scores[t.id]} />
      ))}
    </div>
  );
}
