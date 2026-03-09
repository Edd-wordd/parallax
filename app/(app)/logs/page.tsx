"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SessionTable } from "@/components/SessionTable";
import { generateMockSessions } from "@/lib/mock/sessions";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";

export default function LogsPage() {
  const sessions = useMemo(() => generateMockSessions(), []);
  const [locationFilter, setLocationFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState("");

  const filtered = useMemo(() => {
    let list = sessions.map((s) => ({
      id: s.id,
      date: s.date,
      location_id: s.location_id,
      bortle: s.bortle,
      moon_percent: s.moon_percent,
      targets_count: s.targets.length,
      success: s.success,
    }));

    if (locationFilter) {
      list = list.filter((s) => s.location_id === locationFilter);
    }
    if (successFilter === "success") {
      list = list.filter((s) => s.success);
    } else if (successFilter === "failed") {
      list = list.filter((s) => !s.success);
    }
    return list;
  }, [sessions, locationFilter, successFilter]);

  const locOptions = [
    { value: "", label: "All locations" },
    ...MOCK_LOCATIONS.map((l) => ({ value: l.id, label: l.name })),
  ];
  const successOptions = [
    { value: "", label: "All" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Session Logs</h1>
        <Link href="/logs/new">
          <Button>Log session</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          options={locOptions}
          value={locationFilter}
          onValueChange={setLocationFilter}
          className="w-48"
        />
        <Select
          options={successOptions}
          value={successFilter}
          onValueChange={setSuccessFilter}
          className="w-32"
        />
      </div>

      <SessionTable sessions={filtered} />
    </motion.div>
  );
}
