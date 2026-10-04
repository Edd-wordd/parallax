"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getSessionById,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import { listLocations } from "@/lib/supabase/queries/locations";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";
import { integrationMinutes } from "@/lib/schemas";

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionWithTargets | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const [row, locations] = await Promise.all([
          getSessionById(client, id),
          listLocations(client),
        ]);
        if (cancelled) return;
        setSession(row);
        if (row) {
          setLocationName(
            locations.find((l) => l.id === row.location_id)?.name ?? "Location",
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load session");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-zinc-500">
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">{error ?? "Session not found"}</p>
        <Link href="/sessions">
          <Button variant="link" className="mt-2">
            Back to sessions
          </Button>
        </Link>
      </div>
    );
  }

  const when =
    session.ended_at ?? session.started_at ?? session.created_at ?? "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Session — {when ? formatDate(when) : id.slice(0, 8)}
        </h1>
        <Link href="/sessions">
          <Button variant="outline">Back to sessions</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Summary</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <div>Location: {locationName}</div>
          <div>
            Score: {session.outcome_score}/10 (
            {outcomeScoreLabel(session.outcome_score)})
          </div>
          <div>Targets: {session.targets.length}</div>
          <div>
            Total integration: {session.total_integration_minutes} min
          </div>
          {session.session_software && (
            <div>Software: {session.session_software}</div>
          )}
          {session.what_i_learned && (
            <div className="pt-2 text-zinc-400">
              Learned: {session.what_i_learned}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Targets</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {session.targets.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-zinc-800 px-3 py-2 text-sm"
            >
              <div className="font-medium text-zinc-100">{t.target_name}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {t.frames_captured} × {t.exposure_seconds}s ·{" "}
                {Math.round(
                  integrationMinutes(t.frames_captured, t.exposure_seconds) *
                    10,
                ) / 10}{" "}
                min
                {t.iso != null ? ` · ISO ${t.iso}` : ""}
              </div>
              {t.notes && (
                <p className="text-xs text-zinc-400 mt-1">{t.notes}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
