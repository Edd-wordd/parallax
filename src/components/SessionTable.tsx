"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";

interface SessionRow {
  id: string;
  date: string;
  location_id: string;
  bortle: number;
  moon_percent: number;
  targets_count: number;
  success: boolean;
}

interface SessionTableProps {
  sessions: SessionRow[];
}

export function SessionTable({ sessions }: SessionTableProps) {
  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-900/50">
            <th className="text-left py-3 px-4 font-medium">Date</th>
            <th className="text-left py-3 px-4 font-medium">Location</th>
            <th className="text-left py-3 px-4 font-medium">Bortle</th>
            <th className="text-left py-3 px-4 font-medium">Moon</th>
            <th className="text-left py-3 px-4 font-medium">Targets</th>
            <th className="text-left py-3 px-4 font-medium">Success</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const loc = MOCK_LOCATIONS.find((l) => l.id === s.location_id);
            return (
              <tr
                key={s.id}
                className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link href={`/logs/${s.id}`} className="text-cyan-400 hover:underline">
                    {formatDate(s.date)}
                  </Link>
                </td>
                <td className="py-3 px-4 text-zinc-300">{loc?.name ?? s.location_id}</td>
                <td className="py-3 px-4 text-zinc-400">{s.bortle}</td>
                <td className="py-3 px-4 text-zinc-400">{s.moon_percent}%</td>
                <td className="py-3 px-4 text-zinc-400">{s.targets_count}</td>
                <td className="py-3 px-4">
                  <span
                    className={
                      s.success ? "text-emerald-400" : "text-zinc-500"
                    }
                  >
                    {s.success ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
