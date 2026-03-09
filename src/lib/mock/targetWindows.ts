/**
 * Mock Astro Window System data.
 * Used for Mission Timeline layered visualization.
 * Not wired to backend or real astronomy APIs.
 */

export type TargetWindow = {
  id: string;
  name: string;
  sequence: number;
  score: number;
  visibleStart: string;
  visibleEnd: string;
  optimalStart: string;
  optimalEnd: string;
  moonConflictStart?: string;
  moonConflictEnd?: string;
  cloudRiskStart?: string;
  cloudRiskEnd?: string;
  isCurrent?: boolean;
};

export const MOCK_TARGET_WINDOWS: TargetWindow[] = [
  {
    id: "m31",
    name: "Andromeda Galaxy",
    sequence: 1,
    score: 94,
    visibleStart: "20:15",
    visibleEnd: "05:45",
    optimalStart: "22:30",
    optimalEnd: "03:20",
    moonConflictStart: "23:15",
    moonConflictEnd: "00:45",
    cloudRiskStart: "02:10",
    cloudRiskEnd: "02:50",
    isCurrent: true,
  },
  {
    id: "m42",
    name: "Orion Nebula",
    sequence: 2,
    score: 88,
    visibleStart: "21:30",
    visibleEnd: "05:30",
    optimalStart: "23:00",
    optimalEnd: "04:15",
    moonConflictStart: undefined,
    moonConflictEnd: undefined,
    cloudRiskStart: "01:20",
    cloudRiskEnd: "02:00",
    isCurrent: false,
  },
  {
    id: "m45",
    name: "Pleiades",
    sequence: 3,
    score: 82,
    visibleStart: "20:00",
    visibleEnd: "05:50",
    optimalStart: "21:45",
    optimalEnd: "02:30",
    moonConflictStart: "22:30",
    moonConflictEnd: "23:45",
    cloudRiskStart: undefined,
    cloudRiskEnd: undefined,
    isCurrent: false,
  },
  {
    id: "ngc6992",
    name: "Eastern Veil Nebula",
    sequence: 4,
    score: 76,
    visibleStart: "21:00",
    visibleEnd: "04:40",
    optimalStart: "00:15",
    optimalEnd: "03:00",
    moonConflictStart: "00:30",
    moonConflictEnd: "01:15",
    cloudRiskStart: "02:30",
    cloudRiskEnd: "03:15",
    isCurrent: false,
  },
  {
    id: "b33",
    name: "Horsehead Nebula",
    sequence: 5,
    score: 71,
    visibleStart: "22:00",
    visibleEnd: "04:00",
    optimalStart: "00:30",
    optimalEnd: "02:45",
    moonConflictStart: undefined,
    moonConflictEnd: undefined,
    cloudRiskStart: "01:00",
    cloudRiskEnd: "01:45",
    isCurrent: false,
  },
];
