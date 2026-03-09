import type { SessionLog, SessionTarget } from "@/lib/types";

const outcomes = ["success", "partial", "failed"] as const;
const targetIds = ["m31", "m42", "m45", "m13", "m51", "m81", "m82", "m33", "m17", "m8", "m44", "m57", "m27", "saturn", "jupiter"];

function random<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(20 + Math.floor(Math.random() * 5));
  d.setMinutes(0);
  return d.toISOString();
}

export function generateMockSessions(): SessionLog[] {
  return Array.from({ length: 20 }, (_, i) => {
    const numTargets = 1 + Math.floor(Math.random() * 4);
    const targets: SessionTarget[] = Array.from({ length: numTargets }, () => {
      const id = random(targetIds);
      return {
        target_id: id,
        target_name: id.toUpperCase(),
        target_type: random(["galaxy", "nebula", "open_cluster", "globular_cluster", "planet"] as const),
        outcome: random(outcomes),
        sub_length: random([60, 120, 180, 300]),
        frames: 30 + Math.floor(Math.random() * 90),
        iso: random([800, 1600, 3200]),
      };
    });
    const success = targets.filter((t) => t.outcome === "success").length > 0;
    return {
      id: `log${i + 1}`,
      date: randomDate(120),
      location_id: random(["loc1", "loc2", "loc3", "loc4"]),
      gear_id: random(["gear1", "gear2", "gear3"]),
      bortle: random([4, 5, 6, 7, 8]),
      moon_percent: random([0, 10, 25, 50, 75]),
      cloud_cover: random([0, 5, 10, 20, 30]),
      seeing: 1 + Math.floor(Math.random() * 5),
      wind: Math.floor(Math.random() * 4),
      targets,
      success,
      notes: success ? undefined : "Clouds rolled in.",
    };
  });
}
