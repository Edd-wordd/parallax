"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TargetGrid } from "@/components/TargetGrid";
import { TargetFilters } from "@/components/TargetFilters";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import type { Location } from "@/lib/types";
import { buildExplorerVisibility } from "@/lib/catalog/explorerVisibility";
import { isBrightAndLarge } from "@/lib/catalog";
import type { ExplorerTargetRow } from "@/lib/catalog";

export default function TargetsPage() {
  const {
    activeLocationId,
    dateTime,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
  } = useAppStore();
  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<Record<string, boolean>>({});
  const [visibleOnly, setVisibleOnly] = useState(false);
  const [brightAndLarge, setBrightAndLarge] = useState(false);
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listLocations(getSupabaseBrowserClient());
        if (!cancelled) {
          setDbLocations(
            rows.map((r) => ({
              id: r.id,
              name: r.name,
              lat: r.lat,
              lon: r.lon,
              bortle: r.bortle,
              notes: r.notes ?? undefined,
            })),
          );
        }
      } catch {
        /* mock fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLoc = useMemo(() => {
    if (isUuid(activeLocationId)) {
      const fromDb = dbLocations.find((l) => l.id === activeLocationId);
      if (fromDb) return fromDb;
    }
    return (
      MOCK_LOCATIONS.find((l) => l.id === activeLocationId) ??
      dbLocations[0] ??
      MOCK_LOCATIONS[0]
    );
  }, [activeLocationId, dbLocations]);

  const constraints = useMemo(
    () => ({
      minAltitude,
      moonTolerance,
      targetTypes: [...targetTypes],
      driveToDarker,
      driveRadius,
    }),
    [minAltitude, moonTolerance, targetTypes, driveToDarker, driveRadius],
  );

  const visibility = useMemo(() => {
    if (
      activeLoc?.lat == null ||
      activeLoc?.lon == null ||
      !Number.isFinite(activeLoc.lat) ||
      !Number.isFinite(activeLoc.lon)
    ) {
      return null;
    }
    return buildExplorerVisibility({
      latDeg: activeLoc.lat,
      lonDeg: activeLoc.lon,
      dateTime,
      constraints,
    });
  }, [activeLoc?.lat, activeLoc?.lon, dateTime, constraints]);

  const filtered = useMemo(() => {
    let list: ExplorerTargetRow[] = visibility?.rows ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.target.name.toLowerCase().includes(q) ||
          r.target.constellation.toLowerCase().includes(q) ||
          r.target.type.toLowerCase().includes(q) ||
          r.catalog.catalogIds?.some((c) => c.toLowerCase().includes(q)),
      );
    }
    const activeTypes = Object.entries(types)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (activeTypes.length) {
      list = list.filter((r) => activeTypes.includes(r.target.type));
    }
    if (visibleOnly) {
      list = list.filter(
        (r) => r.status === "recommended" || r.status === "visible",
      );
    }
    if (brightAndLarge) {
      list = list.filter((r) => isBrightAndLarge(r.catalog));
    }
    return list;
  }, [visibility?.rows, search, types, visibleOnly, brightAndLarge]);

  const handleTypeChange = (key: string, checked: boolean) => {
    setTypes((p) => ({ ...p, [key]: checked }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div>
        <h1 className="page-heading">Target Explorer</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Deep-sky catalog with calculated visibility for your site and session.
          Outside the top recommendations can still be visible.
        </p>
      </div>
      {!visibility ? (
        <p className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
          Select a location with coordinates to calculate visibility.
        </p>
      ) : (
        <>
          <TargetFilters
            search={search}
            onSearchChange={setSearch}
            types={types}
            onTypeChange={handleTypeChange}
            visibleTonight={visibleOnly}
            onVisibleTonightChange={setVisibleOnly}
            visibleFilterLabel={visibility.visibleFilterLabel}
            brightAndLarge={brightAndLarge}
            onBrightAndLargeChange={setBrightAndLarge}
            gridView={gridView}
            onGridViewChange={setGridView}
          />
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400">
              No targets match these filters for this session.
            </p>
          ) : (
            <TargetGrid rows={filtered} grid={gridView} />
          )}
        </>
      )}
    </motion.div>
  );
}
