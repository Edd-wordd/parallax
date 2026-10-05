"use client";

import { useMemo } from "react";
import type { Mission } from "@/lib/types";
import {
  buildDashboardRecommendations,
  type BuildRecommendationsInput,
} from "@/lib/recommendations/mapper";
import type {
  DashboardRecommendationsResult,
  FramingGearForRecs,
} from "@/lib/recommendations/types";

export function useDashboardRecommendations(input: {
  latDeg: number | null | undefined;
  lonDeg: number | null | undefined;
  dateTime: string;
  constraints: Mission["constraints"];
  maxRecommendations?: number;
  gear?: FramingGearForRecs;
}): DashboardRecommendationsResult {
  const typesKey = [...(input.constraints.targetTypes ?? [])].sort().join(",");
  const gearKey = input.gear
    ? [
        input.gear.focalLengthMm,
        input.gear.sensorWidthMm ?? "",
        input.gear.sensorHeightMm ?? "",
        input.gear.opticsFactor ?? "",
      ].join(":")
    : "none";

  return useMemo(() => {
    const buildInput: BuildRecommendationsInput = {
      latDeg: input.latDeg,
      lonDeg: input.lonDeg,
      dateTime: input.dateTime,
      constraints: input.constraints,
      maxRecommendations: input.maxRecommendations,
      gear: input.gear ?? null,
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
    gearKey,
  ]);
}
