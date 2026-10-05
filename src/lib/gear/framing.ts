/**
 * Rig FOV vs target angular size — qualitative fit only.
 * No numeric framing score. Calculation separate from UI/AI.
 */

export type RigFitState =
  | "fits"
  | "tight_crop"
  | "small_in_frame"
  | "mosaic_needed"
  | "unknown";

/** Target major &lt; this fraction of shorter FOV → small_in_frame */
export const SMALL_IN_FRAME_FRACTION = 0.25;
/** Target major &gt; this × shorter FOV → mosaic_needed; between shorter and this → tight_crop */
export const MOSAIC_FACTOR = 1.15;

export type FramingGearInput = {
  focalLengthMm: number;
  sensorWidthMm: number | null | undefined;
  sensorHeightMm: number | null | undefined;
  /** Reducer (&lt;1) or Barlow (&gt;1). Null/undefined/1 → use focal length as-is */
  opticsFactor?: number | null;
};

export type FramingTargetInput = {
  /** Major angular size in arcminutes; required for a known fit */
  sizeMajorArcmin: number | null | undefined;
  sizeMinorArcmin?: number | null;
  /** When false/undefined and size present, still allow fit if size is finite */
  sizeVerified?: boolean;
};

export type FramingResult = {
  state: RigFitState;
  effectiveFocalLengthMm: number | null;
  fovWidthArcmin: number | null;
  fovHeightArcmin: number | null;
  shorterFovArcmin: number | null;
  targetMajorArcmin: number | null;
  targetMinorArcmin: number | null;
  /** Why unknown, or brief fit summary */
  detail: string;
  missing: Array<"sensor" | "focal_length" | "target_size">;
};

export function effectiveFocalLengthMm(
  focalLengthMm: number,
  opticsFactor?: number | null,
): number {
  if (
    opticsFactor == null ||
    !Number.isFinite(opticsFactor) ||
    opticsFactor <= 0 ||
    opticsFactor === 1
  ) {
    return focalLengthMm;
  }
  return focalLengthMm * opticsFactor;
}

/** FOV along one sensor axis in degrees. */
export function fovDegrees(sensorMm: number, effectiveFlMm: number): number {
  return (2 * Math.atan(sensorMm / (2 * effectiveFlMm)) * 180) / Math.PI;
}

export function fovArcmin(sensorMm: number, effectiveFlMm: number): number {
  return fovDegrees(sensorMm, effectiveFlMm) * 60;
}

export function classifyRigFit(
  targetMajorArcmin: number,
  shorterFovArcmin: number,
): Exclude<RigFitState, "unknown"> {
  if (targetMajorArcmin > shorterFovArcmin * MOSAIC_FACTOR) {
    return "mosaic_needed";
  }
  if (targetMajorArcmin > shorterFovArcmin) {
    return "tight_crop";
  }
  if (targetMajorArcmin < shorterFovArcmin * SMALL_IN_FRAME_FRACTION) {
    return "small_in_frame";
  }
  return "fits";
}

export function computeRigFraming(
  gear: FramingGearInput,
  target: FramingTargetInput,
): FramingResult {
  const missing: FramingResult["missing"] = [];
  const flOk =
    Number.isFinite(gear.focalLengthMm) && gear.focalLengthMm > 0;
  const wOk =
    gear.sensorWidthMm != null &&
    Number.isFinite(gear.sensorWidthMm) &&
    gear.sensorWidthMm > 0;
  const hOk =
    gear.sensorHeightMm != null &&
    Number.isFinite(gear.sensorHeightMm) &&
    gear.sensorHeightMm > 0;
  const sizeOk =
    target.sizeMajorArcmin != null &&
    Number.isFinite(target.sizeMajorArcmin) &&
    target.sizeMajorArcmin > 0 &&
    target.sizeVerified === true;

  if (!flOk) missing.push("focal_length");
  if (!wOk || !hOk) missing.push("sensor");
  if (!sizeOk) missing.push("target_size");

  if (missing.length > 0) {
    const parts: string[] = [];
    if (missing.includes("sensor")) {
      parts.push("sensor width/height");
    }
    if (missing.includes("focal_length")) parts.push("focal length");
    if (missing.includes("target_size")) {
      parts.push("verified target size");
    }
    return {
      state: "unknown",
      effectiveFocalLengthMm: flOk
        ? effectiveFocalLengthMm(gear.focalLengthMm, gear.opticsFactor)
        : null,
      fovWidthArcmin: null,
      fovHeightArcmin: null,
      shorterFovArcmin: null,
      targetMajorArcmin: sizeOk ? target.sizeMajorArcmin! : null,
      targetMinorArcmin:
        target.sizeMinorArcmin != null &&
        Number.isFinite(target.sizeMinorArcmin)
          ? target.sizeMinorArcmin
          : null,
      detail: `Unknown — missing ${parts.join(", ")}`,
      missing,
    };
  }

  const eff = effectiveFocalLengthMm(gear.focalLengthMm, gear.opticsFactor);
  const fovW = fovArcmin(gear.sensorWidthMm!, eff);
  const fovH = fovArcmin(gear.sensorHeightMm!, eff);
  const shorter = Math.min(fovW, fovH);
  const major = target.sizeMajorArcmin!;
  const state = classifyRigFit(major, shorter);

  const labels: Record<Exclude<RigFitState, "unknown">, string> = {
    fits: "Fits",
    tight_crop: "Tight crop",
    small_in_frame: "Small in frame",
    mosaic_needed: "Mosaic needed",
  };

  return {
    state,
    effectiveFocalLengthMm: eff,
    fovWidthArcmin: fovW,
    fovHeightArcmin: fovH,
    shorterFovArcmin: shorter,
    targetMajorArcmin: major,
    targetMinorArcmin:
      target.sizeMinorArcmin != null && Number.isFinite(target.sizeMinorArcmin)
        ? target.sizeMinorArcmin
        : null,
    detail: `${labels[state]} · FOV ${fovW.toFixed(0)}′×${fovH.toFixed(0)}′ vs target ${major.toFixed(0)}′`,
    missing: [],
  };
}

export function rigFitLabel(state: RigFitState): string {
  switch (state) {
    case "fits":
      return "Fits";
    case "tight_crop":
      return "Tight crop";
    case "small_in_frame":
      return "Small in frame";
    case "mosaic_needed":
      return "Mosaic needed";
    case "unknown":
      return "Unknown";
  }
}
