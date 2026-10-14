"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ObservingTimeline } from "@/components/missions/ObservingTimeline";
import { SessionCaptureCloseout } from "@/components/sessions/SessionCaptureCloseout";
import { SessionFieldConditionsCard } from "@/components/sessions/SessionFieldConditionsCard";
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
import {
  listConditionLogsForMission,
  listConditionLogsForSession,
} from "@/lib/supabase/queries/conditionLogs";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";
import { getMissionWithTargets } from "@/lib/supabase/queries/missions";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";
import {
  formatObservingNightLabel,
  sessionWindowFromMission,
} from "@/lib/time/sessionWindow";
import type { ConditionLogRow, MissionEventRow } from "@/lib/schemas";

const SOFTWARE_LABEL: Record<string, string> = {
  nina: "NINA",
  asiair: "ASIAIR",
  ekos: "Ekos",
};

export default function SessionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<SessionWithTargets | null>(null);
  const [locationName, setLocationName] = useState("");
  const [siteTimezone, setSiteTimezone] = useState<string | null>(null);
  const [rigName, setRigName] = useState<string | null>(null);
  const [missionName, setMissionName] = useState<string | null>(null);
  const [events, setEvents] = useState<MissionEventRow[]>([]);
  const [eventsSource, setEventsSource] = useState<"session" | "mission" | null>(
    null,
  );
  const [conditionLogs, setConditionLogs] = useState<ConditionLogRow[]>([]);
  const [conditionsSource, setConditionsSource] = useState<
    "session" | "mission" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const [row, locations, gear] = await Promise.all([
          getSessionById(client, id),
          listLocations(client),
          listGearProfiles(client).catch(() => []),
        ]);
        if (cancelled) return;
        setSession(row);
        if (!row) return;

        const loc = locations.find((l) => l.id === row.location_id);
        setLocationName(loc?.name ?? "Location");
        setSiteTimezone(loc?.timezone ?? null);

        let missionGearId: string | null = null;
        let mName: string | null = null;
        if (row.mission_id) {
          const mission = await getMissionWithTargets(
            client,
            row.mission_id,
          ).catch(() => null);
          if (mission) {
            missionGearId = mission.gearId ?? null;
            mName = mission.name ?? null;
          }
        }
        if (!cancelled) {
          setMissionName(mName);
          setRigName(
            missionGearId
              ? (gear.find((g) => g.id === missionGearId)?.name ?? null)
              : null,
          );
        }

        let sessionEvents = await listMissionEventsForSession(client, id).catch(
          () => [] as MissionEventRow[],
        );
        let evSource: "session" | "mission" | null =
          sessionEvents.length > 0 ? "session" : null;

        if (
          sessionEvents.length === 0 &&
          row.mission_id &&
          typeof row.mission_id === "string"
        ) {
          const missionEvents = await listMissionEvents(
            client,
            row.mission_id,
          ).catch(() => [] as MissionEventRow[]);
          if (missionEvents.length > 0) {
            sessionEvents = missionEvents;
            evSource = "mission";
          }
        }

        let sessionLogs = await listConditionLogsForSession(client, id).catch(
          () => [] as ConditionLogRow[],
        );
        let logSource: "session" | "mission" | null =
          sessionLogs.length > 0 ? "session" : null;

        if (
          sessionLogs.length === 0 &&
          row.mission_id &&
          typeof row.mission_id === "string"
        ) {
          const missionLogs = await listConditionLogsForMission(
            client,
            row.mission_id,
          ).catch(() => [] as ConditionLogRow[]);
          if (missionLogs.length > 0) {
            sessionLogs = missionLogs;
            logSource = "mission";
          }
        }

        if (!cancelled) {
          setEvents(sessionEvents);
          setEventsSource(evSource);
          setConditionLogs(sessionLogs);
          setConditionsSource(logSource);
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

  const nightLabel = useMemo(() => {
    if (!session) return null;
    const startIso = session.started_at ?? session.created_at;
    const endIso = session.ended_at ?? session.started_at ?? session.created_at;
    if (!startIso || !endIso) return null;
    const win = sessionWindowFromMission({
      dateTime: startIso,
      sessionEndAt: endIso,
    });
    return formatObservingNightLabel({
      start: win.start,
      end: win.end,
      siteTimezone,
    });
  }, [session, siteTimezone]);

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
  const software =
    session.session_software != null
      ? (SOFTWARE_LABEL[session.session_software] ?? session.session_software)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-heading">
            Session — {when ? formatDate(when) : id.slice(0, 8)}
          </h1>
          {nightLabel && (
            <p className="mt-0.5 text-sm text-zinc-400 tabular-nums">
              {nightLabel}
            </p>
          )}
          {missionName && (
            <p className="mt-0.5 text-xs text-zinc-500 truncate">
              From mission · {missionName}
            </p>
          )}
        </div>
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

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
        <div className="border-b border-zinc-800/60 px-3 py-2.5">
          <h2 className="dash-section-title">Summary</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Saved from mission Save Log. Score and integration are from what you
            recorded — not a forecast or AI grade.
          </p>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Site
            </p>
            <p className="text-zinc-200">{locationName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Rig
            </p>
            <p className="text-zinc-200">{rigName ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Outcome
            </p>
            <p className="text-zinc-200">
              {session.outcome_score}/10 ·{" "}
              {outcomeScoreLabel(session.outcome_score)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Targets
            </p>
            <p className="text-zinc-200">{session.targets.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Total integration
            </p>
            <p className="text-zinc-200 tabular-nums">
              {session.total_integration_minutes} min
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Software
            </p>
            <p className="text-zinc-200">{software ?? "—"}</p>
          </div>
          {(session.started_at || session.ended_at) && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Logged window
              </p>
              <p className="text-zinc-300 tabular-nums text-xs">
                {session.started_at
                  ? new Date(session.started_at).toLocaleString()
                  : "—"}{" "}
                –{" "}
                {session.ended_at
                  ? new Date(session.ended_at).toLocaleString()
                  : "—"}
              </p>
            </div>
          )}
          {session.what_i_learned && (
            <div className="sm:col-span-2 lg:col-span-3 pt-1 border-t border-zinc-800/50">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                What I learned
              </p>
              <p className="mt-0.5 text-zinc-300 text-sm">
                {session.what_i_learned}
              </p>
            </div>
          )}
        </div>
      </div>

      <SessionCaptureCloseout targets={session.targets} />

      <SessionFieldConditionsCard
        logs={conditionLogs}
        fromMissionFallback={conditionsSource === "mission"}
      />

      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
        <div className="border-b border-zinc-800/60 px-3 py-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="dash-section-title">Observing log</h2>
            {eventsSource === "mission" && (
              <span className="text-[10px] text-amber-400/90">
                Mission timeline fallback (session attach missed)
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Append-only mission timeline attached at Save Log — notes,
            checklist, plan snapshots, and field actions.
          </p>
        </div>
        <div className="p-3">
          <ObservingTimeline
            events={events}
            emptyMessage="No observing events were attached to this session. If you logged during the mission, re-save or open the mission timeline."
          />
        </div>
      </div>
    </motion.div>
  );
}
