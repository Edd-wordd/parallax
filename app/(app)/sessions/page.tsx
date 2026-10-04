"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
        (s) => new Date(s.ended_at ?? s.started_at ?? s.created_at ?? 0) >= new Date(dateFrom),
      );
    }
    if (dateTo) {
      list = list.filter(
        (s) => new Date(s.ended_at ?? s.started_at ?? s.created_at ?? 0) <= new Date(dateTo),
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
      </div>

      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}

      <div className="flex flex-wrap gap-4">
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
          className="rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
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
        <p className="text-sm text-zinc-500">Loading sessions…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No sessions yet. Complete a mission and save the log to create one.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const loc = locations.find((l) => l.id === s.location_id);
            const primaryTarget = s.targets[0]?.target_name ?? "—";
            const when = s.ended_at ?? s.started_at ?? s.created_at ?? "";
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="block rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-zinc-100">
                      {when ? formatDate(when) : "Session"}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {loc?.name ?? "Location"} · {primaryTarget}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-indigo-300">
                    {s.outcome_score}/10 · {outcomeScoreLabel(s.outcome_score)}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                  <span>{s.targets.length} targets</span>
                  <span>{s.total_integration_minutes} min integration</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
