/**
 * Session visibility for Target Explorer — same AE path as dashboard.
 */

import {
  catalogObjectToTarget,
  listDeepSkyCatalog,
} from "@/lib/catalog/index";
import type { ExplorerTargetRow } from "@/lib/catalog/types";
import { generateDeepSkyPlan } from "@/lib/sky/generateDeepSkyPlan";
import {
  computeSessionAstronomy,
  formatWindowLabel,
  type UnavailableReason,
} from "@/lib/sky/visibility";
import { sessionIntervalFromDateTime } from "@/lib/recommendations/mapper";
import type { Mission } from "@/lib/types";

function reasonLabel(reason: UnavailableReason | null): string | null {
  if (!reason) return null;
  switch (reason) {
    case "never_above_min_altitude":
      return "Stays below your minimum altitude";
    case "moon_too_close":
      return "Moon too close during the usable window";
    case "no_astronomical_darkness":
      return "No astronomical darkness in this session";
    case "invalid_session":
      return "Invalid session times";
    default:
      return "Not suitable for this session";
  }
}

export function buildExplorerVisibility(input: {
  latDeg: number;
  lonDeg: number;
  dateTime: string;
  constraints: Mission["constraints"];
  maxRecommended?: number;
}): {
  rows: ExplorerTargetRow[];
  sessionStart: Date;
  sessionEnd: Date;
  isTonight: boolean;
  visibleFilterLabel: string;
} {
  const { start: sessionStart, end: sessionEnd } = sessionIntervalFromDateTime(
    input.dateTime,
  );
  const now = new Date();
  const isTonight =
    sessionStart.getFullYear() === now.getFullYear() &&
    sessionStart.getMonth() === now.getMonth() &&
    sessionStart.getDate() === now.getDate();
  const visibleFilterLabel = isTonight
    ? "Visible tonight"
    : "Visible this session";

  const catalog = listDeepSkyCatalog();
  const astronomy = computeSessionAstronomy({
    site: { latDeg: input.latDeg, lonDeg: input.lonDeg },
    sessionStart,
    sessionEnd,
    minAltitudeDeg: input.constraints.minAltitude,
    moonToleranceDeg: input.constraints.moonTolerance,
    targets: catalog,
  });

  const plan = generateDeepSkyPlan({
    latDeg: input.latDeg,
    lonDeg: input.lonDeg,
    sessionStart,
    sessionEnd,
    constraints: input.constraints,
    maxTargets: input.maxRecommended ?? 8,
  });
  const recommendedIds = new Set(plan.targets.map((t) => t.targetId));
  const byId = new Map(astronomy.targets.map((t) => [t.targetId, t]));

  const rows: ExplorerTargetRow[] = catalog.map((cat) => {
    const vis = byId.get(cat.id);
    const hasWindow = vis?.recommendedWindow != null && vis.unavailableReason == null;
    let status: ExplorerTargetRow["status"];
    if (recommendedIds.has(cat.id)) {
      status = "recommended";
    } else if (hasWindow) {
      status = "visible";
    } else {
      status = "unsuitable";
    }
    const win = vis?.recommendedWindow;
    return {
      catalog: cat,
      target: catalogObjectToTarget(cat),
      status,
      reasonLabel:
        status === "unsuitable"
          ? reasonLabel(vis?.unavailableReason ?? astronomy.emptyReason)
          : status === "visible"
            ? "Visible this session — not in top recommendations"
            : null,
      score: vis?.score ?? null,
      windowLabel: win ? formatWindowLabel(win.start, win.end) : null,
      peakAltitudeDeg: vis?.peakAltitudeDeg ?? null,
      minMoonSeparationDeg: vis?.minMoonSeparationDeg ?? null,
      unavailableReason: vis?.unavailableReason ?? null,
    };
  });

  return {
    rows,
    sessionStart,
    sessionEnd,
    isTonight,
    visibleFilterLabel,
  };
}
