/**
 * Derive Insights charts/lists from saved sessions only.
 * Never invent scores, weather, or adaptation claims.
 */

import { curatedTargetById } from "@/lib/catalog";
import type { LocationRow } from "@/lib/schemas";
import type { SessionWithTargets } from "@/lib/supabase/queries/sessions";

export type ScoreTrendPoint = {
  key: string;
  label: string;
  avgScore: number;
  sessions: number;
};

export type LocationInsight = {
  locationId: string;
  name: string;
  sessions: number;
  avgScore: number;
};

export type TargetTypeShare = {
  name: string;
  value: number;
  minutes: number;
};

export type TopTarget = {
  catalogId: string;
  name: string;
  sessions: number;
  integrationMinutes: number;
};

export type SessionInsights = {
  sessionCount: number;
  avgScore: number | null;
  totalIntegrationMinutes: number;
  highScoreCount: number;
  scoreTrend: ScoreTrendPoint[];
  locations: LocationInsight[];
  targetTypes: TargetTypeShare[];
  topTargets: TopTarget[];
  recentNotes: { sessionId: string; when: string; note: string }[];
  facts: string[];
};

function sessionWhen(s: SessionWithTargets): Date {
  const iso = s.ended_at ?? s.started_at ?? s.created_at;
  return iso ? new Date(iso) : new Date(0);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y!, (m ?? 1) - 1, 1);
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

function typeLabel(catalogId: string): string {
  const t = curatedTargetById(catalogId);
  if (!t?.type) return "Other";
  const raw = t.type.toLowerCase();
  if (raw.includes("nebula")) return "Nebula";
  if (raw.includes("galaxy")) return "Galaxy";
  if (raw.includes("cluster")) return "Cluster";
  if (raw.includes("planet")) return "Planet";
  return t.type;
}

export function buildSessionInsights(
  sessions: SessionWithTargets[],
  locations: LocationRow[],
): SessionInsights {
  const locName = new Map(locations.map((l) => [l.id, l.name]));
  const sessionCount = sessions.length;

  if (sessionCount === 0) {
    return {
      sessionCount: 0,
      avgScore: null,
      totalIntegrationMinutes: 0,
      highScoreCount: 0,
      scoreTrend: [],
      locations: [],
      targetTypes: [],
      topTargets: [],
      recentNotes: [],
      facts: [],
    };
  }

  const scoreSum = sessions.reduce((s, x) => s + x.outcome_score, 0);
  const avgScore = Math.round((scoreSum / sessionCount) * 10) / 10;
  const totalIntegrationMinutes =
    Math.round(
      sessions.reduce((s, x) => s + x.total_integration_minutes, 0) * 10,
    ) / 10;
  const highScoreCount = sessions.filter((s) => s.outcome_score >= 7).length;

  // Score trend by calendar month
  const byMonth = new Map<string, { sum: number; n: number }>();
  for (const s of sessions) {
    const key = monthKey(sessionWhen(s));
    const cur = byMonth.get(key) ?? { sum: 0, n: 0 };
    cur.sum += s.outcome_score;
    cur.n += 1;
    byMonth.set(key, cur);
  }
  const scoreTrend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      label: monthLabel(key),
      avgScore: Math.round((v.sum / v.n) * 10) / 10,
      sessions: v.n,
    }));

  // Locations
  const byLoc = new Map<string, { sum: number; n: number }>();
  for (const s of sessions) {
    const cur = byLoc.get(s.location_id) ?? { sum: 0, n: 0 };
    cur.sum += s.outcome_score;
    cur.n += 1;
    byLoc.set(s.location_id, cur);
  }
  const locationInsights = [...byLoc.entries()]
    .map(([locationId, v]) => ({
      locationId,
      name: locName.get(locationId) ?? "Unknown site",
      sessions: v.n,
      avgScore: Math.round((v.sum / v.n) * 10) / 10,
    }))
    .sort((a, b) => b.avgScore - a.avgScore || b.sessions - a.sessions);

  // Target types by integration minutes
  const typeMin = new Map<string, number>();
  const targetAgg = new Map<
    string,
    { name: string; sessions: Set<string>; minutes: number }
  >();
  for (const s of sessions) {
    for (const t of s.targets) {
      const typ = typeLabel(t.catalog_id);
      const mins = t.frames_captured * t.exposure_seconds / 60;
      typeMin.set(typ, (typeMin.get(typ) ?? 0) + mins);

      const agg = targetAgg.get(t.catalog_id) ?? {
        name: t.target_name,
        sessions: new Set<string>(),
        minutes: 0,
      };
      agg.sessions.add(s.id);
      agg.minutes += mins;
      if (t.target_name) agg.name = t.target_name;
      targetAgg.set(t.catalog_id, agg);
    }
  }
  const typeTotal = [...typeMin.values()].reduce((a, b) => a + b, 0) || 1;
  const targetTypes = [...typeMin.entries()]
    .map(([name, minutes]) => ({
      name,
      minutes: Math.round(minutes * 10) / 10,
      value: Math.round((minutes / typeTotal) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const topTargets = [...targetAgg.entries()]
    .map(([catalogId, v]) => ({
      catalogId,
      name: v.name,
      sessions: v.sessions.size,
      integrationMinutes: Math.round(v.minutes * 10) / 10,
    }))
    .sort((a, b) => b.integrationMinutes - a.integrationMinutes)
    .slice(0, 8);

  const recentNotes = [...sessions]
    .filter((s) => !!s.what_i_learned?.trim())
    .sort((a, b) => sessionWhen(b).getTime() - sessionWhen(a).getTime())
    .slice(0, 5)
    .map((s) => ({
      sessionId: s.id,
      when: sessionWhen(s).toISOString(),
      note: s.what_i_learned!.trim(),
    }));

  const facts: string[] = [];
  facts.push(
    `${sessionCount} saved session${sessionCount === 1 ? "" : "s"} · avg outcome ${avgScore}/10`,
  );
  facts.push(
    `${totalIntegrationMinutes} min total integration recorded across all targets`,
  );
  if (highScoreCount > 0) {
    facts.push(
      `${highScoreCount} session${highScoreCount === 1 ? "" : "s"} scored 7+ (Good/Excellent)`,
    );
  }
  const bestLoc = locationInsights[0];
  if (bestLoc && bestLoc.sessions >= 1) {
    facts.push(
      `Highest avg score: ${bestLoc.name} (${bestLoc.avgScore}/10 across ${bestLoc.sessions} session${bestLoc.sessions === 1 ? "" : "s"})`,
    );
  }
  const top = topTargets[0];
  if (top) {
    facts.push(
      `Most integration: ${top.name} (${top.integrationMinutes} min across ${top.sessions} session${top.sessions === 1 ? "" : "s"})`,
    );
  }

  return {
    sessionCount,
    avgScore,
    totalIntegrationMinutes,
    highScoreCount,
    scoreTrend,
    locations: locationInsights,
    targetTypes,
    topTargets,
    recentNotes,
    facts,
  };
}
