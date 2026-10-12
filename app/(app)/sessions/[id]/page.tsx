"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ObservingTimeline } from "@/components/missions/ObservingTimeline";
import { formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getSessionById,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import {
  listMissionEvents,
  listMissionEventsForSession,
} from "@/lib/supabase/queries/missionEvents";
import { listLocations } from "@/lib/supabase/queries/locations";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";
import { integrationMinutes, type MissionEventRow } from "@/lib/schemas";

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionWithTargets | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [events, setEvents] = useState<MissionEventRow[]>([]);
  const [eventsSource, setEventsSource] = useState<"session" | "mission" | null>(
    null,
  );
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

        let sessionEvents = await listMissionEventsForSession(client, id).catch(
          () => [] as MissionEventRow[],
        );
        let source: "session" | "mission" | null =
          sessionEvents.length > 0 ? "session" : null;

        // Fallback: events written before session_id attach (or attach missed)
        if (
          sessionEvents.length === 0 &&
          row?.mission_id &&
          typeof row.mission_id === "string"
        ) {
          const missionEvents = await listMissionEvents(
            client,
            row.mission_id,
          ).catch(() => [] as MissionEventRow[]);
          if (missionEvents.length > 0) {
            sessionEvents = missionEvents;
            source = "mission";
          }
        }

        if (!cancelled) {
          setEvents(sessionEvents);
          setEventsSource(source);
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
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-heading">
          Session — {when ? formatDate(when) : id.slice(0, 8)}
        </h1>
        <div className="flex flex-wrap gap-2">
          {session.mission_id && (
            <Link href={`/missions/${session.mission_id}`}>
              <Button variant="secondary">Open mission</Button>
            </Link>
          )}
          <Link href="/sessions">
            <Button variant="outline">Back to sessions</Button>
          </Link>
        </div>
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
          <h2 className="text-sm font-medium">Targets — planned vs actual</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {session.targets.length === 0 ? (
            <p className="text-xs text-zinc-500">No targets on this session.</p>
          ) : (
            session.targets.map((t) => {
              const hasPlanned =
                t.planned_frames != null ||
                t.planned_sub_length_seconds != null ||
                t.planned_integration_minutes != null ||
                !!t.planned_filter ||
                t.planned_iso != null ||
                t.planned_gain != null;
              const actualMin =
                Math.round(
                  integrationMinutes(t.frames_captured, t.exposure_seconds) *
                    10,
                ) / 10;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-sm"
                >
                  <div className="font-medium text-zinc-100">{t.target_name}</div>
                  <div className="mt-1.5 grid gap-1 text-xs">
                    <p className="text-zinc-500">
                      <span className="font-medium text-zinc-400">Planned</span>
                      {" · "}
                      {hasPlanned
                        ? [
                            t.planned_frames != null
                              ? `${t.planned_frames} frames`
                              : null,
                            t.planned_sub_length_seconds != null
                              ? `${t.planned_sub_length_seconds}s`
                              : null,
                            t.planned_integration_minutes != null
                              ? `${t.planned_integration_minutes} min`
                              : null,
                            t.planned_filter
                              ? `filter ${t.planned_filter}`
                              : null,
                            t.planned_iso != null
                              ? `ISO ${t.planned_iso}`
                              : null,
                            t.planned_gain != null
                              ? `gain ${t.planned_gain}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "No capture worksheet snapshot"}
                    </p>
                    <p className="text-zinc-300">
                      <span className="font-medium text-zinc-400">Actual</span>
                      {" · "}
                      {t.frames_captured} × {t.exposure_seconds}s · {actualMin}{" "}
                      min
                      {t.iso != null ? ` · ISO ${t.iso}` : ""}
                      {t.gain != null ? ` · gain ${t.gain}` : ""}
                      {t.result ? ` · ${t.result}` : ""}
                    </p>
                    {(t.actual_start_at || t.actual_end_at) && (
                      <p className="tabular-nums text-zinc-500">
                        Window:{" "}
                        {t.actual_start_at
                          ? new Date(t.actual_start_at).toLocaleString()
                          : "—"}{" "}
                        –{" "}
                        {t.actual_end_at
                          ? new Date(t.actual_end_at).toLocaleString()
                          : "—"}
                      </p>
                    )}
                  </div>
                  {t.notes && (
                    <p className="text-xs text-zinc-400 mt-1">{t.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Observing log</h2>
            {eventsSource === "mission" && (
              <span className="text-[10px] text-amber-400/90">
                Showing mission timeline (session attach fallback)
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Same append-only timeline as the mission — notes, checklist, plan
            snapshot, and field actions.
          </p>
        </CardHeader>
        <CardContent>
          <ObservingTimeline
            events={events}
            emptyMessage="No observing events were attached to this session. If you logged during the mission, re-save or open the mission timeline."
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
