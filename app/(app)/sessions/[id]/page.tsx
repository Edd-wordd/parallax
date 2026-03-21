"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MOCK_SESSIONS } from "@/lib/mock/sessionHistory";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ChartResizeGuard } from "@/components/ChartResizeGuard";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { formatDate } from "@/lib/utils";
import { SessionConditionSummary } from "@/components/sky-intelligence";
import { MOCK_SESSION_CONDITIONS } from "@/lib/mock/skyIntelligence";
import { Moon } from "lucide-react";

// Mock conditions for data section (aligned with MOCK_SESSIONS ids)
const MOCK_CONDITIONS: Record<
  string,
  { bortle: number; moon: number; cloud: number; seeing: number; transparency: number; wind: number; notes?: string }
> = {
  s1: { bortle: 4, moon: 25, cloud: 5, seeing: 4, transparency: 3, wind: 2 },
  s2: { bortle: 6, moon: 50, cloud: 10, seeing: 3, transparency: 3, wind: 1 },
  s3: { bortle: 5, moon: 10, cloud: 20, seeing: 4, transparency: 3, wind: 1 },
  s4: { bortle: 5, moon: 0, cloud: 0, seeing: 5, transparency: 3, wind: 0 },
  s5: { bortle: 7, moon: 75, cloud: 30, seeing: 2, transparency: 3, wind: 3, notes: "Clouds cut session short. Check forecast." },
};

const successByType = [
  { type: "Nebula", success: 75 },
  { type: "Galaxy", success: 60 },
  { type: "Cluster", success: 85 },
  { type: "Planet", success: 90 },
];
const sessionsOverTime = [
  { month: "Oct", count: 3 },
  { month: "Nov", count: 5 },
  { month: "Dec", count: 4 },
  { month: "Jan", count: 6 },
  { month: "Feb", count: 2 },
];

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [replayOpen, setReplayOpen] = useState(false);

  const session = MOCK_SESSIONS.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Session not found</p>
        <Link href="/sessions">
          <Button variant="link" className="mt-2">
            Back to sessions
          </Button>
        </Link>
      </div>
    );
  }

  const loc = MOCK_LOCATIONS.find((l) => l.id === session.locationId);
  const conditions = MOCK_CONDITIONS[session.id];
  const meta = MOCK_SESSION_CONDITIONS[session.id];
  const success = ["A", "B"].includes(session.outcomeRating);

  const missionTargets = session.targets.map((t) => ({
    targetId: t.targetId,
    targetName: t.targetName,
    targetType: "galaxy" as const,
    plannedWindowStart: session.startTime ?? "21:00",
    plannedWindowEnd: session.endTime ?? "02:00",
    score: 75,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Session — {formatDate(session.date)}
        </h1>
        <Link href="/sessions">
          <Button variant="outline">Back to sessions</Button>
        </Link>
      </div>

      {/* Section 1: Summary narrative */}
      <div className="space-y-6">
        <h2 className="dash-section-title text-zinc-400">Summary</h2>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Mission Summary Snapshot</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <div>Location: {loc?.name}</div>
              <div>Targets: {session.targetsCount}</div>
              <div>Total integration: {session.totalIntegrationMinutes} min</div>
              <div>Outcome: {session.outcomeRating}</div>
              {session.startTime && session.endTime && (
                <div>
                  Time: {session.startTime} — {session.endTime}
                </div>
              )}
            </div>
            {meta && (
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 dash-pill">
                  Condition Metadata
                </h3>
                <SessionConditionSummary metadata={meta} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Target Results</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.targets.map((t) => (
                <div
                  key={t.targetId}
                  className="rounded border border-zinc-700 p-4 space-y-2"
                >
                  <div className="font-medium">{t.targetName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-zinc-400">
                    <div>Frames: {t.frames}</div>
                    <div>Exposure: {t.exposure}s</div>
                    {t.iso != null && <div>ISO: {t.iso}</div>}
                    <div>Integration: {t.integrationTime} min</div>
                  </div>
                  {t.notes && (
                    <div className="text-sm text-zinc-500">{t.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {session.whatILearned && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">What I Learned</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300">{session.whatILearned}</p>
            </CardContent>
          </Card>
        )}

        <Button onClick={() => setReplayOpen(true)}>
          <Moon className="h-4 w-4 mr-2" />
          Replay Mission
        </Button>
      </div>

      {/* Section 2: Data and charts */}
      <div className="space-y-6">
        <h2 className="dash-section-title text-zinc-400">Data & charts</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-zinc-500">Location</div>
              <div className="font-medium">{loc?.name}</div>
            </CardContent>
          </Card>
          {conditions && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-zinc-500">Bortle / Moon</div>
                <div className="font-medium">
                  {conditions.bortle} / {conditions.moon}%
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-zinc-500">Targets</div>
              <div className="font-medium">{session.targetsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-zinc-500">Outcome</div>
              <div
                className={
                  success
                    ? "font-medium text-emerald-400"
                    : "font-medium text-zinc-500"
                }
              >
                {session.outcomeRating}
              </div>
            </CardContent>
          </Card>
        </div>

        {conditions && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Conditions</h2>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div>Cloud: {conditions.cloud}%</div>
              <div>Seeing: {conditions.seeing}/5</div>
              <div>Transparency: {conditions.transparency}/5</div>
              <div>Wind: {conditions.wind}/3</div>
            </CardContent>
          </Card>
        )}

        {conditions?.notes && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Notes</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300">{conditions.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Insights</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">
              {meta?.outcome && (
                <span>{meta.outcome}. </span>
              )}
              {conditions && (
                <>Session conditions: Bortle {conditions.bortle}, Moon {conditions.moon}%. (Mock insight from session data.)</>
              )}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Success by target type</h2>
            </CardHeader>
            <CardContent>
              <ChartResizeGuard height={200} minHeight={120}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="type" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#27272a",
                        border: "1px solid #52525b",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="success" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartResizeGuard>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Sessions over time</h2>
            </CardHeader>
            <CardContent>
              <ChartResizeGuard height={200} minHeight={120}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#27272a",
                        border: "1px solid #52525b",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22d3ee"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartResizeGuard>
            </CardContent>
          </Card>
        </div>
      </div>

      <NightSimulationModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
        targets={missionTargets}
      />
    </motion.div>
  );
}
