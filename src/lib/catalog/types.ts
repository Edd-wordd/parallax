import type { CuratedTarget } from "@/lib/sky/curatedTargets";
import type { UnavailableReason } from "@/lib/sky/visibility";
import type { Target } from "@/lib/types";

export type ExplorerVisibilityStatus =
  | "recommended"
  | "visible"
  | "unsuitable";

export type ExplorerTargetRow = {
  catalog: CuratedTarget;
  /** Adapter for existing TargetCard UI */
  target: Target;
  status: ExplorerVisibilityStatus;
  reasonLabel: string | null;
  score: number | null;
  windowLabel: string | null;
  peakAltitudeDeg: number | null;
  minMoonSeparationDeg: number | null;
  unavailableReason: UnavailableReason | null;
};

export type CatalogImageEntry = {
  url: string;
  credit: string;
  source: string;
  matchMethod: string;
  verifiedAt: string;
};
