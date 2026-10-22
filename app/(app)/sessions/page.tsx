"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  listSessions,
  type SessionWithTargets,
} from "@/lib/supabase/queries/sessions";
import { listLocations } from "@/lib/supabase/queries/locations";
import type { LocationRow } from "@/lib/schemas";
import { outcomeScoreLabel } from "@/lib/outcomeLabel";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithTargets[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");

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
          setError(e instanceof Error ? e.message : "Failed to load sessions");
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

  const locOptions = useMemo(
    () => [
      { value: "", label: "All locations" },
      ...locations.map((l) => ({ value: l.id, label: l.name })),
    ],
    [locations],
  );

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (locationFilter) {
      list = list.filter((s) => s.location_id === locationFilter);
    }
    if (dateFrom) {
      list = list.filter(
        (s) =>
          new Date(s.ended_at ?? s.started_at ?? s.created_at ?? 0) >=
          new Date(dateFrom),
      );
    }
    if (dateTo) {
      list = list.filter(
        (s) =>
          new Date(s.ended_at ?? s.started_at ?? s.created_at ?? 0) <=
          new Date(dateTo),
      );
    }
    if (scoreFilter === "high") {
      list = list.filter((s) => s.outcome_score >= 7);
    } else if (scoreFilter === "mid") {
      list = list.filter((s) => s.outcome_score >= 4 && s.outcome_score <= 6);
    } else if (scoreFilter === "low") {
      list = list.filter((s) => s.outcome_score <= 3);
    }
    return list;
  }, [sessions, locationFilter, dateFrom, dateTo, scoreFilter]);

  const dateInputClass =
    "h-9 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-heading">Sessions</h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          History from mission Save Log — one row per completed mission log.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Select
          options={locOptions}
          value={locationFilter}
          onValueChange={setLocationFilter}
          className="w-48"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={dateInputClass}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={dateInputClass}
        />
        <Select
          options={[
            { value: "", label: "All scores" },
            { value: "high", label: "7–10" },
            { value: "mid", label: "4–6" },
            { value: "low", label: "1–3" },
          ]}
          value={scoreFilter}
          onValueChange={setScoreFilter}
          className="w-36"
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
          Loading sessions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center">
          <p className="text-sm text-zinc-400">No sessions yet.</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Complete a mission and save the log to create one.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/missions">
              <Button variant="secondary" size="sm">
                Open missions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const loc = locations.find((l) => l.id === s.location_id);
            const primaryTarget = s.targets[0]?.target_name ?? "—";
            const when = s.ended_at ?? s.started_at ?? s.created_at ?? "";
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="block overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/50 transition-colors hover:border-zinc-700/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-medium text-zinc-100">
                      {when ? formatDate(when) : "Session"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      <span className="text-zinc-500 font-medium">Site</span>
                      <span className="text-zinc-600 mx-1.5">·</span>
                      <span className="text-zinc-300">
                        {loc?.name ?? "Location"}
                      </span>
                      <span className="text-zinc-600 mx-1.5">·</span>
                      <span className="text-zinc-300">{primaryTarget}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-400/90">
                    {s.outcome_score}/10 · {outcomeScoreLabel(s.outcome_score)}
                  </span>
                </div>
                <div className="flex gap-4 border-t border-zinc-800/60 px-3 py-2 text-[11px] text-zinc-500">
                  <span>{s.targets.length} targets</span>
                  <span className="tabular-nums">
                    {s.total_integration_minutes} min integration
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
