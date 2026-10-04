"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus, Copy } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-800/50 text-zinc-400",
  ready: "bg-emerald-500/10 text-emerald-400/90",
  in_progress: "bg-indigo-500/10 text-indigo-400/90 border border-indigo-500/15",
  completed: "bg-zinc-800/40 text-zinc-500",
  cancelled: "bg-amber-500/10 text-amber-400/90",
};

export default function MissionsPage() {
  const router = useRouter();
  const { missions, duplicateMission } = useMissionStore();
  const [locationNames, setLocationNames] = useState<Record<string, { name: string; bortle: number }>>({});
  const [gearNames, setGearNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const [locs, gear] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        setLocationNames(
          Object.fromEntries(locs.map((l) => [l.id, { name: l.name, bortle: l.bortle }])),
        );
        setGearNames(Object.fromEntries(gear.map((g) => [g.id, g.name])));
      } catch {
        /* display-only */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="page-heading">Missions</h1>
        <Link href="/missions/new">
          <Button variant="cta">
            <Plus className="h-4 w-4 mr-2" />
            Create Mission
          </Button>
        </Link>
      </div>

      {missions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-zinc-400 mb-3 text-sm">No missions yet.</p>
          <Link href="/missions/new">
            <Button variant="cta">Create your first mission</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((m) => {
            const loc = locationNames[m.locationId];
            const gearName = gearNames[m.gearId];
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="h-full overflow-hidden hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-150">
                  <Link href={`/missions/${m.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-medium truncate text-zinc-100">{m.name}</h3>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 font-display text-[10px] uppercase tracking-[0.08em] ${
                            STATUS_COLORS[m.status] ?? STATUS_COLORS.draft
                          }`}
                        >
                          {STATUS_LABELS[m.status]}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-xs text-zinc-500">
                        <div>
                          {loc ? `${loc.name} · Bortle ${loc.bortle}` : "Site"}
                        </div>
                        <div>
                          {gearName ?? "Rig"}
                          {m.missionType === "deep_sky" && " · Deep Sky"}
                          {m.missionType === "planetary" && " · Planetary"}
                          {" · "}
                          {formatDate(m.dateTime)} · {m.targets.length} targets
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                  <div className="px-3 pb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-zinc-500 hover:text-zinc-300"
                      onClick={(e) => {
                        e.preventDefault();
                        const dup = duplicateMission(m.id);
                        if (dup) router.push(`/missions/${dup.id}`);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
