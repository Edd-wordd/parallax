"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MOCK_SESSIONS } from "@/lib/mock/sessionHistory";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NightSimulationModal } from "@/components/missions/NightSimulationModal";
import { formatDate } from "@/lib/utils";
import { SessionConditionSummary } from "@/components/sky-intelligence";
import { MOCK_SESSION_CONDITIONS } from "@/lib/mock/skyIntelligence";
import { Moon } from "lucide-react";

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
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Session — {formatDate(session.date)}
        </h1>
        <Link href="/sessions">
          <Button variant="outline">Back to sessions</Button>
        </Link>
      </div>

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
          {MOCK_SESSION_CONDITIONS[session.id] && (
            <div>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 dash-pill">
                Condition Metadata
              </h3>
              <SessionConditionSummary
                metadata={MOCK_SESSION_CONDITIONS[session.id]}
              />
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

      <NightSimulationModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
        targets={missionTargets}
      />
    </motion.div>
  );
}
