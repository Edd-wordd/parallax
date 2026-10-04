"use client";

import { useMemo } from "react";
import type { Mission } from "@/lib/types";
import {
  buildDashboardRecommendations,
  type BuildRecommendationsInput,
} from "@/lib/recommendations/mapper";
import type { DashboardRecommendationsResult } from "@/lib/recommendations/types";

export function useDashboardRecommendations(input: {
  latDeg: number | null | undefined;
  lonDeg: number | null | undefined;
  dateTime: string;
  constraints: Mission["constraints"];
  maxRecommendations?: number;
}): DashboardRecommendationsResult {
  const typesKey = [...(input.constraints.targetTypes ?? [])].sort().join(",");

  return useMemo(() => {
    const buildInput: BuildRecommendationsInput = {
      latDeg: input.latDeg,
      lonDeg: input.lonDeg,
      dateTime: input.dateTime,
      constraints: input.constraints,
      maxRecommendations: input.maxRecommendations,
    };
    return buildDashboardRecommendations(buildInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit key parts
  }, [
    input.latDeg,
    input.lonDeg,
    input.dateTime,
    input.constraints.minAltitude,
    input.constraints.moonTolerance,
    typesKey,
    input.maxRecommendations,
  ]);
}
