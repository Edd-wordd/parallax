/**
 * Mock available targets for the Add Target picker.
 * Returns targets not already in the mission queue, with scores and windows.
 * No backend — mock data only.
 */

import type { MissionTarget } from "@/lib/types";

export interface AvailableTargetOption {
  targetId: string;
  targetName: string;
  targetType: string;
  score: number;
  bestWindowStart: string;
  bestWindowEnd: string;
  reason: string;
}

const MOCK_AVAILABLE: AvailableTargetOption[] = [
  { targetId: "m42", targetName: "Orion Nebula (M42)", targetType: "nebula", score: 78, bestWindowStart: "22:50", bestWindowEnd: "01:20", reason: "Strong mid-evening fit" },
  { targetId: "ngc2244", targetName: "Rosette Nebula", targetType: "nebula", score: 74, bestWindowStart: "23:10", bestWindowEnd: "01:45", reason: "Good framing for current rig" },
  { targetId: "m45", targetName: "Pleiades (M45)", targetType: "open_cluster", score: 70, bestWindowStart: "20:40", bestWindowEnd: "22:10", reason: "Good early slot" },
  { targetId: "m51", targetName: "Whirlpool Galaxy (M51)", targetType: "galaxy", score: 68, bestWindowStart: "22:20", bestWindowEnd: "01:40", reason: "Rising late — good post-moonset" },
  { targetId: "m13", targetName: "Hercules Cluster (M13)", targetType: "globular_cluster", score: 66, bestWindowStart: "20:30", bestWindowEnd: "03:45", reason: "Long window — flexible slot" },
  { targetId: "m81", targetName: "Bode's Galaxy (M81)", targetType: "galaxy", score: 72, bestWindowStart: "21:00", bestWindowEnd: "02:00", reason: "Strong all-night visibility" },
  { targetId: "m101", targetName: "Pinwheel Galaxy (M101)", targetType: "galaxy", score: 65, bestWindowStart: "21:30", bestWindowEnd: "02:30", reason: "Moderate elevation gain" },
  { targetId: "m17", targetName: "Omega Nebula (M17)", targetType: "nebula", score: 62, bestWindowStart: "23:00", bestWindowEnd: "02:15", reason: "Sagittarius region — southern" },
  { targetId: "m33", targetName: "Triangulum Galaxy (M33)", targetType: "galaxy", score: 64, bestWindowStart: "21:00", bestWindowEnd: "01:00", reason: "Wide field target" },
  { targetId: "m57", targetName: "Ring Nebula (M57)", targetType: "nebula", score: 70, bestWindowStart: "21:30", bestWindowEnd: "04:00", reason: "Long window, high altitude" },
];

/** Returns available targets not already in the queue (mock only) */
export function getAvailableTargetsForAdd(queueTargets: MissionTarget[]): AvailableTargetOption[] {
  const inQueue = new Set(queueTargets.map((t) => t.targetId));
  return MOCK_AVAILABLE.filter((t) => !inQueue.has(t.targetId));
}
