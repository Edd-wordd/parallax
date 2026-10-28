import { Body, Illumination, MoonPhase } from "astronomy-engine";
import { moonPhaseLabel } from "@/lib/sky/visibility";

export interface MoonMark {
  phaseFraction: number;
  elongationDeg: number;
  phaseLabel: string;
}

/** Phase at a clock time. Illumination does not depend on the observing site. */
export function moonMarkAt(date: Date): MoonMark | null {
  if (!Number.isFinite(date.getTime())) return null;
  try {
    const illum = Illumination(Body.Moon, date);
    const elongationDeg = MoonPhase(date);
    const phaseFraction = illum.phase_fraction;
    if (!Number.isFinite(phaseFraction) || !Number.isFinite(elongationDeg)) {
      return null;
    }
    return {
      phaseFraction,
      elongationDeg,
      phaseLabel: moonPhaseLabel(elongationDeg),
    };
  } catch {
    return null;
  }
}
