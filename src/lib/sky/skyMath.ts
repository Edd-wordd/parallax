/**
 * Sky math: RA/Dec <-> Alt/Az conversion using astronomy-engine.
 * Isolates astronomy-engine usage in this module.
 */

import { Horizon, Observer } from "astronomy-engine";

const DEG2RAD = Math.PI / 180;

/** Convert RA in hours to degrees */
export function raHoursToDeg(raHours: number): number {
  return (raHours / 24) * 360;
}

export interface ObserverSpec {
  name?: string;
  lat: number;
  lon: number;
  heightMeters?: number;
}

export interface AltAzResult {
  altDeg: number;
  azDeg: number;
}

/**
 * Convert equatorial (RA/Dec) to horizontal (Alt/Az) for a given date and observer.
 * Uses astronomy-engine Horizon. RA in hours, Dec in degrees.
 */
export function altAzFromRaDec(
  date: Date,
  observer: ObserverSpec,
  raHours: number,
  decDeg: number,
  refraction: "normal" | "jplhor" | null = "normal"
): AltAzResult {
  const obs = new Observer(
    observer.lat,
    observer.lon,
    observer.heightMeters ?? 0
  );
  const hor = Horizon(date, obs, raHours, decDeg, refraction ?? undefined);
  return { altDeg: hor.altitude, azDeg: hor.azimuth };
}

/**
 * Convert altitude (deg) and azimuth (deg) to a 3D vector.
 * Convention: az 0 = North, 90 = East (degrees, clockwise from North).
 * Y = up (altitude), X = East, Z = North.
 * x = r * cos(alt) * sin(az)
 * y = r * sin(alt)
 * z = r * cos(alt) * cos(az)
 */
export function altAzToVector(
  altDeg: number,
  azDeg: number,
  radius: number
): [number, number, number] {
  const altRad = altDeg * DEG2RAD;
  const azRad = azDeg * DEG2RAD;
  const cosAlt = Math.cos(altRad);
  const sinAlt = Math.sin(altRad);
  const cosAz = Math.cos(azRad);
  const sinAz = Math.sin(azRad);
  const x = radius * cosAlt * sinAz;
  const y = radius * sinAlt;
  const z = radius * cosAlt * cosAz;
  return [x, y, z];
}
