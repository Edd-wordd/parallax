"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMissionStore } from "@/lib/missionStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus, Copy } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  ready: "bg-emerald-500/10 text-emerald-400/90",
  in_progress: "bg-teal-500/20 text-teal-400",
  completed: "bg-white/5 text-white/50",
  cancelled: "bg-amber-500/10 text-amber-400/90",
};

export default function MissionsPage() {
  const router = useRouter();
  const { missions, duplicateMission } = useMissionStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">Missions</h1>
        <Link href="/missions/new">
          <Button variant="cta">
            <Plus className="h-4 w-4 mr-2" />
            Create Mission
          </Button>
        </Link>
      </div>

      {missions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-white/60 mb-3 text-sm">No missions yet.</p>
          <Link href="/missions/new">
            <Button variant="cta">Create your first mission</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((m) => {
            const loc = MOCK_LOCATIONS.find((l) => l.id === m.locationId);
            const gear = MOCK_GEAR.find((g) => g.id === m.gearId);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="h-full overflow-hidden hover:border-white/15 hover:-translate-y-0.5 transition-all duration-150">
                  <Link href={`/missions/${m.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-semibold truncate">{m.name}</h3>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] uppercase tracking-wide ${
                            STATUS_COLORS[m.status] ?? STATUS_COLORS.draft
                          }`}
                        >
                          {STATUS_LABELS[m.status]}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-xs text-white/50">
                        <div>{loc?.name} · Bortle {loc?.bortle}</div>
                        <div>{gear?.name} · {formatDate(m.dateTime)} · {m.targets.length} targets</div>
                      </div>
                    </CardContent>
                  </Link>
                  <div className="px-3 pb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-white/50 hover:text-white/80"
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
