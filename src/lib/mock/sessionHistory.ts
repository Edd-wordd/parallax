/**
 * Mock session history for Session History feature.
 * TODO: Replace with backend API when wiring. Persist to DB keyed by userId/sessionId.
 */

import type { Session } from "@/types/session";

const LOC_IDS = ["loc1", "loc2", "loc3", "loc4"];
const RATINGS: Session["outcomeRating"][] = ["A", "A", "B", "B", "B", "C", "C", "D"];

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(21, 0, 0, 0);
  return d.toISOString();
}

function timeStr(h: number, m: number): string {
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const DEMO_TARGETS: { id: string; name: string }[] = [
  { id: "m31", name: "M31 Andromeda" },
  { id: "m42", name: "M42 Orion Nebula" },
  { id: "m45", name: "M45 Pleiades" },
  { id: "m13", name: "M13 Hercules" },
  { id: "m51", name: "M51 Whirlpool" },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: "s1",
    missionId: "m1",
    date: dateOffset(2),
    locationId: LOC_IDS[1],
    targetsCount: 3,
    totalIntegrationMinutes: 180,
    outcomeRating: "A",
    startTime: "21:10",
    endTime: "02:45",
    targets: [
      {
        targetId: "m31",
        targetName: "M31 Andromeda",
        frames: 45,
        exposure: 120,
        iso: 800,
        integrationTime: 90,
        notes: "Good tracking.",
      },
      {
        targetId: "m42",
        targetName: "M42 Orion Nebula",
        frames: 60,
        exposure: 60,
        iso: 1600,
        integrationTime: 60,
      },
      {
        targetId: "m45",
        targetName: "M45 Pleiades",
        frames: 30,
        exposure: 60,
        iso: 800,
        integrationTime: 30,
      },
    ],
    whatILearned: "Bortle 4 made a huge difference for M31 core detail.",
  },
  {
    id: "s2",
    date: dateOffset(7),
    locationId: LOC_IDS[0],
    targetsCount: 2,
    totalIntegrationMinutes: 90,
    outcomeRating: "B",
    startTime: "22:00",
    endTime: "01:30",
    targets: [
      {
        targetId: "m42",
        targetName: "M42 Orion Nebula",
        frames: 40,
        exposure: 90,
        iso: 1600,
        integrationTime: 60,
      },
      {
        targetId: "m45",
        targetName: "M45 Pleiades",
        frames: 25,
        exposure: 60,
        iso: 800,
        integrationTime: 25,
      },
    ],
    whatILearned: "Need to dither more in light-polluted skies.",
  },
  {
    id: "s3",
    date: dateOffset(14),
    locationId: LOC_IDS[2],
    targetsCount: 1,
    totalIntegrationMinutes: 120,
    outcomeRating: "A",
    startTime: "20:30",
    endTime: "01:00",
    targets: [
      {
        targetId: "m31",
        targetName: "M31 Andromeda",
        frames: 60,
        exposure: 120,
        iso: 800,
        integrationTime: 120,
      },
    ],
  },
  {
    id: "s4",
    date: dateOffset(21),
    locationId: LOC_IDS[1],
    targetsCount: 4,
    totalIntegrationMinutes: 240,
    outcomeRating: "B",
    targets: DEMO_TARGETS.slice(0, 4).map((t, i) => ({
      targetId: t.id,
      targetName: t.name,
      frames: 30 + i * 10,
      exposure: 120,
      iso: 800,
      integrationTime: 60,
      notes: i === 0 ? "Best of the night" : undefined,
    })),
    whatILearned: "M51 needs longer integration next time.",
  },
  {
    id: "s5",
    date: dateOffset(28),
    locationId: LOC_IDS[0],
    targetsCount: 2,
    totalIntegrationMinutes: 60,
    outcomeRating: "C",
    targets: [
      {
        targetId: "m42",
        targetName: "M42 Orion Nebula",
        frames: 20,
        exposure: 60,
        iso: 3200,
        integrationTime: 20,
      },
      {
        targetId: "m45",
        targetName: "M45 Pleiades",
        frames: 30,
        exposure: 60,
        iso: 1600,
        integrationTime: 30,
      },
    ],
    whatILearned: "Clouds cut session short. Check forecast.",
  },
];
