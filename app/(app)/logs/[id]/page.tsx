"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
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
import { generateMockSessions } from "@/lib/mock/sessions";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { formatDateTime } from "@/lib/utils";

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const sessions = useMemo(() => generateMockSessions(), []);
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Session not found</p>
        <Link href="/logs">
          <Button variant="link" className="mt-2">
            Back to logs
          </Button>
        </Link>
      </div>
    );
  }

  const loc = MOCK_LOCATIONS.find((l) => l.id === session.location_id);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session {formatDateTime(session.date)}</h1>
        <Link href="/logs">
          <Button variant="outline">Back to logs</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Location</div>
            <div className="font-medium">{loc?.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Bortle / Moon</div>
            <div className="font-medium">{session.bortle} / {session.moon_percent}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Targets</div>
            <div className="font-medium">{session.targets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Success</div>
            <div className={session.success ? "font-medium text-emerald-400" : "font-medium text-zinc-500"}>
              {session.success ? "Yes" : "No"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Targets shot</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {session.targets.map((t) => (
              <div
                key={t.target_id}
                className="flex items-center justify-between rounded border border-zinc-700 px-3 py-2"
              >
                <span>{t.target_name}</span>
                <span
                  className={
                    t.outcome === "success"
                      ? "text-emerald-400"
                      : t.outcome === "partial"
                        ? "text-amber-400"
                        : "text-zinc-500"
                  }
                >
                  {t.outcome}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Conditions</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>Cloud: {session.cloud_cover}%</div>
          <div>Seeing: {session.seeing}/5</div>
          <div>Wind: {session.wind}/3</div>
        </CardContent>
      </Card>

      {session.notes && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Notes</h2>
          </CardHeader>
          <CardContent>{session.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Insights</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">
            You succeed more with nebula in Bortle {session.bortle}. (Mock insight from session data.)
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
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartResizeGuard>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
