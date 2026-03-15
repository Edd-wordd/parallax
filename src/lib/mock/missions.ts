import type { Mission } from "@/lib/types";

export type GenerateMockPlanOptions = {
  missionType: "deep_sky" | "planetary" | null;
  planetaryTarget?: string;
  planetaryTargets?: string[];
};

export function generateMockPlan(
  locationId: string,
  gearId: string,
  dateTime: string,
  constraints: Mission["constraints"],
  options?: GenerateMockPlanOptions
): Mission["targets"] {
  const planetaryNames = options?.planetaryTargets?.length
    ? options.planetaryTargets
    : options?.planetaryTarget
      ? [options.planetaryTarget]
      : [];
  if (options?.missionType === "planetary" && planetaryNames.length > 0) {
    return planetaryNames.map((name, i) => {
      const id = name.toLowerCase().replace(/\s+/g, "_");
      return {
        targetId: id,
        targetName: name,
        targetType: "planet" as const,
        plannedWindowStart: "22:00",
        plannedWindowEnd: "02:00",
        score: 80,
        sequenceIndex: i + 1,
        roleLabel: `SEQ ${i + 1}`,
        isFallback: false,
      };
    });
  }

  const targetTypes = constraints.targetTypes.length
    ? constraints.targetTypes
    : ["galaxy", "nebula", "open_cluster", "globular_cluster"];
  const targets = [
    { targetId: "m31", targetName: "Andromeda (M31)", targetType: "galaxy" as const, start: "21:10", end: "22:40", score: 85 },
    { targetId: "m42", targetName: "Orion Nebula (M42)", targetType: "nebula" as const, start: "22:50", end: "01:20", score: 78 },
    { targetId: "m45", targetName: "Pleiades (M45)", targetType: "open_cluster" as const, start: "01:30", end: "03:10", score: 72 },
    { targetId: "m13", targetName: "Hercules Cluster (M13)", targetType: "globular_cluster" as const, start: "20:30", end: "03:45", score: 68 },
    { targetId: "m51", targetName: "Whirlpool Galaxy (M51)", targetType: "galaxy" as const, start: "22:20", end: "01:40", score: 65 },
    { targetId: "m81", targetName: "Bode's Galaxy (M81)", targetType: "galaxy" as const, start: "21:00", end: "02:00", score: 70 },
  ];
  return targets
    .filter((t) => targetTypes.includes(t.targetType))
    .slice(0, 8)
    .map((t, i): Mission["targets"][0] => ({
      targetId: t.targetId,
      targetName: t.targetName,
      targetType: t.targetType,
      plannedWindowStart: t.start,
      plannedWindowEnd: t.end,
      score: t.score,
      sequenceIndex: i + 1,
      roleLabel: `SEQ ${i + 1}`,
      isFallback: false,
    }));
}
