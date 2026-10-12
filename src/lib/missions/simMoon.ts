/**
 * Moon phase / altitude at a wall-clock time for night simulation scrubber.
 */

import {
  Body,
  Equator,
  Horizon,
  Illumination,
  Observer,
} from "astronomy-engine";

export function moonAtSite(
  when: Date,
  lat: number | null | undefined,
  lon: number | null | undefined,
): { phasePct: number | null; altitudeDeg: number | null } {
  if (
    lat == null ||
    lon == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return { phasePct: null, altitudeDeg: null };
  }
  try {
    const illum = Illumination(Body.Moon, when);
    const phasePct = Math.round(illum.phase_fraction * 100);
    const observer = new Observer(lat, lon, 0);
    const eq = Equator(Body.Moon, when, observer, true, true);
    const hor = Horizon(when, observer, eq.ra, eq.dec, "normal");
    return {
      phasePct,
      altitudeDeg: Math.round(hor.altitude),
    };
  } catch {
    return { phasePct: null, altitudeDeg: null };
  }
}
