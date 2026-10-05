"use client";

import { useState } from "react";
import { getCatalogDisplayImage } from "@/lib/catalog/images";
import type { TargetType } from "@/lib/types";
import { cn } from "@/lib/utils";

function FallbackThumb({
  targetType,
  className,
  message = "Image unavailable",
}: {
  targetType: TargetType;
  className?: string;
  message?: string;
}) {
  const isNebula = targetType === "nebula";
  const isGalaxy = targetType === "galaxy";
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        background: isNebula
          ? "linear-gradient(135deg, #0f0f14 0%, rgba(60,80,120,0.15) 40%, #0a0a0e 100%)"
          : isGalaxy
            ? "linear-gradient(135deg, #0a0a0e 0%, rgba(80,70,100,0.12) 50%, #0f0f14 100%)"
            : "linear-gradient(135deg, #0f0f14 0%, rgba(100,120,140,0.08) 50%, #0a0a0e 100%)",
      }}
      aria-hidden
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-[10px] text-zinc-600">{message}</span>
      </div>
    </div>
  );
}

export function CatalogObjectImage({
  catalogId,
  targetType,
  className,
  showCredit = false,
}: {
  catalogId: string;
  targetType: TargetType;
  className?: string;
  showCredit?: boolean;
}) {
  const img = getCatalogDisplayImage(catalogId);
  const [failed, setFailed] = useState(false);

  if (!img || failed) {
    return (
      <FallbackThumb
        targetType={targetType}
        className={className}
        message={failed ? "Survey image failed to load" : "Image unavailable"}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-zinc-950", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      {showCredit && (
        <p className="absolute bottom-0 left-0 right-0 bg-black/65 px-2 py-1 text-[10px] text-zinc-300">
          {img.credit} · {img.source}
        </p>
      )}
    </div>
  );
}
