"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartResizeGuard } from "@/components/ChartResizeGuard";
import { LearnedFromSessionsCard } from "@/components/intelligence";
import { Button } from "@/components/ui/button";
import {
  ADAPTATION_EFFECTS,
  ADAPTATION_INSIGHTS,
} from "@/lib/mock/intelligenceLayer";
import { buildSessionInsights } from "@/lib/insights/sessionInsights";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  listSessions,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import { listLocations } from "@/lib/supabase/queries/locations";
import type { LocationRow } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";

const COLORS = ["#6366f1", "#818cf8", "#34d399", "#a78bfa", "#f59e0b"];

const tooltipStyle = {
  backgroundColor: "#27272a",
  border: "1px solid #52525b",
  borderRadius: "6px",
};

function DashCard({
  title,
  subtitle,
  demo,
  children,
}: {
  title: string;
  subtitle?: string;
  demo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      <div className="border-b border-zinc-800/60 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="dash-section-title text-zinc-400">{title}</h2>
          {demo && (
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
              Demo
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export default function InsightsPage() {
  const [sessions, setSessions] = useState<SessionWithTargets[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const [sessionRows, locationRows] = await Promise.all([
          listSessions(client),
          listLocations(client),
        ]);
        if (cancelled) return;
        setSessions(sessionRows);
        setLocations(locationRows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load insights");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const insights = useMemo(
    () => buildSessionInsights(sessions, locations),
    [sessions, locations],
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
        Loading insights…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-8 text-center">
        <p className="text-sm text-rose-200">{error}</p>
        <Link href="/sessions">
          <Button variant="link" className="mt-2">
            Back to sessions
          </Button>
        </Link>
      </div>
    );
  }

  const empty = insights.sessionCount === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-heading">Insights</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          From your saved sessions only. Charts update when you Save Log from a
          mission.
        </p>
      </div>

      {!empty && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Sessions",
              value: String(insights.sessionCount),
            },
            {
              label: "Avg outcome",
              value:
                insights.avgScore != null
                  ? `${insights.avgScore}/10`
                  : "—",
            },
            {
              label: "Total integration",
              value: `${insights.totalIntegrationMinutes} min`,
            },
            {
              label: "Good nights (7+)",
              value: String(insights.highScoreCount),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2.5"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <p className="mt-0.5 text-lg font-display tabular-nums text-zinc-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <LearnedFromSessionsCard
        facts={insights.facts}
        demoInsights={ADAPTATION_INSIGHTS}
        demoEffects={ADAPTATION_EFFECTS}
      />

      {empty ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">
            No sessions to analyze yet. Run a mission through Logging and Save
            Log, then return here.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard">
              <Button variant="cta" size="sm">
                Tonight
              </Button>
            </Link>
            <Link href="/sessions">
              <Button variant="secondary" size="sm">
                Sessions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <DashCard
              title="Outcome trend"
              subtitle="Average outcome score by month (from Save Log)"
            >
              {insights.scoreTrend.length === 0 ? (
                <p className="text-xs text-zinc-500">Not enough dated sessions.</p>
              ) : (
                <ChartResizeGuard height={200} minHeight={120}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.scoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        domain={[1, 10]}
                        ticks={[1, 4, 7, 10]}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v, _n, item) => {
                          const n =
                            (item?.payload as { sessions?: number } | undefined)
                              ?.sessions ?? 0;
                          return [
                            `${v ?? 0}/10 · ${n} session${n === 1 ? "" : "s"}`,
                            "Avg",
                          ];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        stroke="#6366f1"
                        strokeWidth={2}
                        name="Avg score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartResizeGuard>
              )}
            </DashCard>

            <DashCard
              title="Sites by avg score"
              subtitle="Your locations ranked by average outcome"
            >
              {insights.locations.length === 0 ? (
                <p className="text-xs text-zinc-500">No location data.</p>
              ) : (
                <ChartResizeGuard height={200} minHeight={120}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={insights.locations}
                      layout="vertical"
                      margin={{ left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis
                        type="number"
                        stroke="#71717a"
                        fontSize={11}
                        domain={[0, 10]}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#71717a"
                        fontSize={11}
                        width={88}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v, _n, item) => {
                          const n =
                            (item?.payload as { sessions?: number } | undefined)
                              ?.sessions ?? 0;
                          return [
                            `${v ?? 0}/10 · ${n} session${n === 1 ? "" : "s"}`,
                            "Avg",
                          ];
                        }}
                      />
                      <Bar
                        dataKey="avgScore"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        name="Avg score"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartResizeGuard>
              )}
            </DashCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <DashCard
              title="Integration by target type"
              subtitle="Share of recorded integration minutes (catalog type)"
            >
              {insights.targetTypes.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No target integration recorded yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <ChartResizeGuard height={180} minHeight={120} className="sm:flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.targetTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                        >
                          {insights.targetTypes.map((_, i) => (
                            <Cell
                              key={i}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v, name, item) => {
                            const mins =
                              (item?.payload as { minutes?: number } | undefined)
                                ?.minutes ?? 0;
                            return [
                              `${v ?? 0}% · ${mins} min`,
                              String(name ?? ""),
                            ];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartResizeGuard>
                  <ul className="space-y-1 text-xs text-zinc-400 sm:w-40 shrink-0">
                    {insights.targetTypes.map((t, i) => (
                      <li key={t.name} className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-sm shrink-0"
                          style={{
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                        <span className="truncate">{t.name}</span>
                        <span className="ml-auto tabular-nums text-zinc-500">
                          {t.value}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DashCard>

            <DashCard
              title="Top targets"
              subtitle="Most recorded integration time"
            >
              {insights.topTargets.length === 0 ? (
                <p className="text-xs text-zinc-500">No targets logged yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {insights.topTargets.map((t, i) => (
                    <li
                      key={t.catalogId}
                      className="flex items-center justify-between gap-2 rounded-md border border-zinc-800/50 bg-zinc-950/40 px-2.5 py-2 text-xs"
                    >
                      <span className="min-w-0 truncate text-zinc-200">
                        <span className="text-zinc-600 tabular-nums mr-1.5">
                          {i + 1}.
                        </span>
                        {t.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-500">
                        {t.integrationMinutes} min · {t.sessions} sess
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashCard>
          </div>

          {insights.recentNotes.length > 0 && (
            <DashCard
              title="What you learned"
              subtitle="Notes from recent Save Log entries"
            >
              <ul className="space-y-2">
                {insights.recentNotes.map((n) => (
                  <li
                    key={n.sessionId}
                    className="rounded-md border border-zinc-800/50 bg-zinc-950/40 px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/sessions/${n.sessionId}`}
                        className="text-[11px] text-indigo-400/90 hover:underline"
                      >
                        {formatDate(n.when)}
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                      {n.note}
                    </p>
                  </li>
                ))}
              </ul>
            </DashCard>
          )}

          <DashCard
            title="Generic condition tips"
            subtitle="Not derived from your sessions or site ratings"
            demo
          >
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• Bortle 5 or darker often helps broadband targets</li>
              <li>• Prefer larger Moon separation for faint nebulae</li>
              <li>• Seeing 3/5+ supports longer subs — check your field log</li>
              <li>
                · Your real scores live in Sessions (
                {sessions
                  .slice(0, 3)
                  .map(
                    (s) =>
                      `${s.outcome_score}/10 ${outcomeScoreLabel(s.outcome_score)}`,
                  )
                  .join(" · ")}
                {sessions.length > 3 ? "…" : ""})
              </li>
            </ul>
          </DashCard>
        </>
      )}
    </div>
  );
}
