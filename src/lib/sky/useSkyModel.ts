"use client";

import { useMemo } from "react";
import { altAzFromRaDec, altAzToVector, type ObserverSpec } from "./skyMath";
import { SKY_SPHERE_RADIUS } from "./skyConstants";

export interface SkyStar {
  id: number;
  raHours: number;
  decDeg: number;
  mag: number;
  name?: string;
}

export interface SkyConstellation {
  name: string;
  segments: [number, number][];
}

export interface SkyTargetMarker {
  id: string;
  name: string;
  ra: number;
  dec: number;
  /** Computed x,y,z on sphere */
  vector: [number, number, number];
  /** Altitude and azimuth in degrees (for tooltips) */
  altDeg: number;
  azDeg: number;
  label: string;
  color?: string;
}

export interface SkyModelToggles {
  showConstellations: boolean;
  showTargets: boolean;
  showHorizon: boolean;
}

export interface SkyModelInput {
  observer: ObserverSpec;
  date: Date;
  toggles: SkyModelToggles;
  stars: SkyStar[];
  constellations: SkyConstellation[];
  targets: Array<{ id: string; name: string; ra: number; dec: number; color?: string }>;
}

export interface SkyModelOutput {
  starPositions: Float32Array;
  starSizes: Float32Array;
  starCount: number;
  starCountAboveHorizon: number;
  constellationLinePoints: Float32Array;
  constellationLineCount: number;
  targetMarkers: SkyTargetMarker[];
  meta: {
    localTimeString: string;
    starCountAboveHorizon: number;
  };
}

/** Magnitude to point size: brighter = larger. Clamp for modern look. */
function magToSize(mag: number): number {
  // mag -1 -> ~2, mag 6 -> ~0.2
  const base = 2.5 - 0.35 * mag;
  return Math.max(0.15, Math.min(2.2, base));
}

export function useSkyModel(input: SkyModelInput): SkyModelOutput {
  const { observer, date, toggles, stars, constellations, targets } = input;

  return useMemo(() => {

    const positions: number[] = [];
    const sizes: number[] = [];

    // Full sphere: render ALL stars (no altitude filter) for full orb look
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      const { altDeg, azDeg } = altAzFromRaDec(
        date,
        observer,
        star.raHours,
        star.decDeg
      );
      const [x, y, z] = altAzToVector(altDeg, azDeg, SKY_SPHERE_RADIUS);
      positions.push(x, y, z);
      sizes.push(magToSize(star.mag));
    }

    const starPositions = new Float32Array(positions);
    const starSizes = new Float32Array(sizes);
    const starCount = positions.length / 3;

    // Build constellation line points (pairs of [x,y,z, x,y,z]) - all segments, full sphere
    const linePoints: number[] = [];
    for (const c of constellations) {
      for (const [idA, idB] of c.segments) {
        const starA = stars.find((s) => s.id === idA);
        const starB = stars.find((s) => s.id === idB);
        if (!starA || !starB) continue;
        const { altDeg: altA, azDeg: azA } = altAzFromRaDec(
          date,
          observer,
          starA.raHours,
          starA.decDeg
        );
        const { altDeg: altB, azDeg: azB } = altAzFromRaDec(
          date,
          observer,
          starB.raHours,
          starB.decDeg
        );
        const [xa, ya, za] = altAzToVector(altA, azA, SKY_SPHERE_RADIUS);
        const [xb, yb, zb] = altAzToVector(altB, azB, SKY_SPHERE_RADIUS);
        linePoints.push(xa, ya, za, xb, yb, zb);
      }
    }
    const constellationLinePoints = new Float32Array(linePoints);
    const constellationLineCount = linePoints.length / 6;

    // Target markers
    const targetMarkers: SkyTargetMarker[] = targets.map((t) => {
      const { altDeg, azDeg } = altAzFromRaDec(date, observer, t.ra, t.dec);
      const vector = altAzToVector(altDeg, azDeg, SKY_SPHERE_RADIUS) as [number, number, number];
      return {
        id: t.id,
        name: t.name,
        ra: t.ra,
        dec: t.dec,
        vector,
        altDeg,
        azDeg,
        label: t.name,
        color: t.color,
      };
    });

    const localTimeString = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return {
      starPositions,
      starSizes,
      starCount,
      starCountAboveHorizon: starCount,
      constellationLinePoints,
      constellationLineCount,
      targetMarkers,
      meta: {
        localTimeString,
        starCountAboveHorizon: starCount,
      },
    };
  }, [
    observer.lat,
    observer.lon,
    observer.heightMeters ?? 0,
    date.getTime(),
    stars,
    constellations,
    targets,
  ]);
}
