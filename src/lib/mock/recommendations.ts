import type { Target, Recommendation } from "@/lib/types";
import { MOCK_TARGETS } from "./targets";

/** Deterministic pseudo-random from string seed (for SSR-safe mock data) */
function seeded(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i) | 0;
  return Math.abs(h % 10000) / 10000;
}

export function generateTonightRecommendations(
  minAltitude: number,
  moonTolerance: number,
  targetTypes: string[],
  driveRadius?: number
): Recommendation[] {
  const types = targetTypes.length ? targetTypes : ["galaxy", "nebula", "open_cluster", "globular_cluster"];
  const filtered = MOCK_TARGETS.filter((t) => types.includes(t.type));

  return filtered.slice(0, 8).map((target, i) => {
    const s = seeded(target.id + String(i));
    const baseScore = 50 + s * 40;
    const altBonus = minAltitude <= 30 ? 5 : 0;
    const moonBonus = moonTolerance >= 20 ? 10 : 0;
    const driveBonus = driveRadius && driveRadius >= 50 ? 15 : 0;
    const score = Math.min(100, Math.round(baseScore + altBonus + moonBonus + driveBonus));

    const peakAlt = Math.round(55 + seeded(target.id + "alt" + i) * 30);
    const moonSep = Math.round(25 + seeded(target.id + "moon" + i) * 50);
    const duration = 3 + Math.floor(seeded(target.id + "dur" + i) * 3);

    const difficulty = score >= 75 ? "easy" : score >= 50 ? "moderate" : "hard";
    const why: string[] = [
      `Reaches ${peakAlt}° altitude`,
      `Visible for ${duration}h tonight`,
      `Moon ${moonSep}° away`,
      "Fits your telescope field of view",
    ];
    if (target.magnitude < 6) why.push("Bright target");
    if (target.angular_size > 30) why.push("Large angular size");
    if (target.beginner) why.push("Beginner friendly");

    const score_breakdown = [
      { label: "Altitude", value: Math.round(15 + seeded(target.id + "a" + i) * 15) },
      { label: "Duration", value: Math.round(10 + seeded(target.id + "d" + i) * 12) },
      { label: "Moon", value: -Math.round(seeded(target.id + "m" + i) * 8) },
      { label: "Light pollution fit", value: Math.round(5 + seeded(target.id + "l" + i) * 10) },
      { label: "Framing", value: Math.round(12 + seeded(target.id + "f" + i) * 10) },
      { label: "Brightness", value: Math.round(5 + seeded(target.id + "b" + i) * 8) },
    ];

    return {
      target,
      shootability_score: score,
      best_window_start: "21:30",
      best_window_end: "01:45",
      peak_altitude: peakAlt,
      moon_separation: moonSep,
      difficulty,
      why,
      score_breakdown,
    };
  });
}

export function getTargetById(id: string): Target | undefined {
  return MOCK_TARGETS.find((t) => t.id === id);
}
