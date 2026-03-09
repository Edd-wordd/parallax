"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MOCK_TARGETS } from "@/lib/mock/targets";
import { TargetGrid } from "@/components/TargetGrid";
import { TargetFilters } from "@/components/TargetFilters";
import type { Target } from "@/lib/types";

export default function TargetsPage() {
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<Record<string, boolean>>({});
  const [visibleTonight, setVisibleTonight] = useState(false);
  const [beginner, setBeginner] = useState(false);
  const [gridView, setGridView] = useState(true);

  const filtered = useMemo(() => {
    let list: Target[] = [...MOCK_TARGETS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.constellation.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q)
      );
    }
    const activeTypes = Object.entries(types)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeTypes.length) {
      list = list.filter((t) => activeTypes.includes(t.type));
    }
    if (visibleTonight) {
      list = list.slice(0, Math.floor(list.length * 0.7));
    }
    if (beginner) {
      list = list.filter((t) => t.beginner);
    }
    return list;
  }, [search, types, visibleTonight, beginner]);

  const handleTypeChange = (key: string, checked: boolean) => {
    setTypes((p) => ({ ...p, [key]: checked }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">Target Explorer</h1>
      <TargetFilters
        search={search}
        onSearchChange={setSearch}
        types={types}
        onTypeChange={handleTypeChange}
        visibleTonight={visibleTonight}
        onVisibleTonightChange={setVisibleTonight}
        beginner={beginner}
        onBeginnerChange={setBeginner}
        gridView={gridView}
        onGridViewChange={setGridView}
      />
      <TargetGrid targets={filtered} grid={gridView} />
    </motion.div>
  );
}
