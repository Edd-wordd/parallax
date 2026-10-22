/**
 * Solar-system bodies for Create Mission → Planetary.
 * Kept out of the deep-sky catalog and Explorer list.
 */

import { Body } from "astronomy-engine";
import type { TargetType } from "@/lib/types";

export type PlanetTarget = {
  id: string;
  name: string;
  body: Body;
  targetType: Extract<TargetType, "planet" | "moon">;
};

export const PLANET_TARGETS: PlanetTarget[] = [
  { id: "mercury", name: "Mercury", body: Body.Mercury, targetType: "planet" },
  { id: "venus", name: "Venus", body: Body.Venus, targetType: "planet" },
  { id: "mars", name: "Mars", body: Body.Mars, targetType: "planet" },
  { id: "jupiter", name: "Jupiter", body: Body.Jupiter, targetType: "planet" },
  { id: "saturn", name: "Saturn", body: Body.Saturn, targetType: "planet" },
  { id: "uranus", name: "Uranus", body: Body.Uranus, targetType: "planet" },
  { id: "neptune", name: "Neptune", body: Body.Neptune, targetType: "planet" },
  { id: "moon", name: "Moon", body: Body.Moon, targetType: "moon" },
];

const BY_NAME = new Map(
  PLANET_TARGETS.map((p) => [p.name.toLowerCase(), p]),
);

export function planetByName(name: string): PlanetTarget | null {
  return BY_NAME.get(name.trim().toLowerCase()) ?? null;
}
