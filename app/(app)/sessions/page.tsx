"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MOCK_SESSIONS } from "@/lib/mock/sessionHistory";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { SessionConditionSummary } from "@/components/sky-intelligence";
import { MOCK_SESSION_CONDITIONS } from "@/lib/mock/skyIntelligence";
import type { OutcomeRating } from "@/types/session";

const LOC_OPTIONS = [
  { value: "", label: "All locations" },
  ...MOCK_LOCATIONS.map((l) => ({ value: l.id, label: l.name })),
];

const OUTCOME_OPTIONS = [
  { value: "", label: "All" },
  { value: "success", label: "Success (A/B)" },
  { value: "partial", label: "Partial (C)" },
  { value: "failed", label: "Failed (D/F)" },
];

export default function SessionsPage() {
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...MOCK_SESSIONS];
    if (locationFilter) {
      list = list.filter((s) => s.locationId === locationFilter);
    }
    if (dateFrom) {
      list = list.filter((s) => new Date(s.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      list = list.filter((s) => new Date(s.date) <= new Date(dateTo));
    }
    if (outcomeFilter) {
      const successRatings: OutcomeRating[] = ["A", "B"];
      const partialRatings: OutcomeRating[] = ["C"];
      const failedRatings: OutcomeRating[] = ["D", "F"];
      if (outcomeFilter === "success") {
        list = list.filter((s) => successRatings.includes(s.outcomeRating));
      } else if (outcomeFilter === "partial") {
        list = list.filter((s) => partialRatings.includes(s.outcomeRating));
      } else if (outcomeFilter === "failed") {
        list = list.filter((s) => failedRatings.includes(s.outcomeRating));
      }
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [locationFilter, dateFrom, dateTo, outcomeFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Link href="/sessions/new">
          <Button>Log session</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          options={LOC_OPTIONS}
          value={locationFilter}
          onValueChange={setLocationFilter}
          className="w-48"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
          placeholder="To"
        />
        <Select
          options={OUTCOME_OPTIONS}
          value={outcomeFilter}
          onValueChange={setOutcomeFilter}
          className="w-36"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((s) => {
          const loc = MOCK_LOCATIONS.find((l) => l.id === s.locationId);
          const conditions = MOCK_SESSION_CONDITIONS[s.id];
          const primaryTarget = s.targets[0]?.targetName ?? "—";
          return (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="block rounded-xl border border-zinc-700/80 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-100">{formatDate(s.date)}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {loc?.name ?? s.locationId} · {primaryTarget}
                  </div>
                </div>
                <span
                  className={
                    s.outcomeRating === "A"
                      ? "text-emerald-400 text-sm font-medium"
                      : s.outcomeRating === "B"
                        ? "text-cyan-400 text-sm font-medium"
                        : s.outcomeRating === "C"
                          ? "text-amber-400 text-sm font-medium"
                          : "text-zinc-500 text-sm"
                  }
                >
                  {s.outcomeRating}
                </span>
              </div>
              {conditions && (
                <div className="mt-3">
                  <SessionConditionSummary metadata={conditions} compact />
                </div>
              )}
              <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                <span>{s.targetsCount} targets</span>
                <span>{s.totalIntegrationMinutes} min integration</span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
