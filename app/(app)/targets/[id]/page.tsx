"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  curatedTargetById,
  getCatalogDisplayImage,
  isRecommendEligible,
} from "@/lib/catalog";
import { CatalogObjectImage } from "@/components/catalog/CatalogObjectImage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ScoreBadge";
import { AltitudeChart } from "@/components/AltitudeChart";
import { formatAngularSize } from "@/lib/utils";
import { useDashboardRecommendationStore } from "@/lib/dashboardRecommendationStore";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listLocations } from "@/lib/supabase/queries/locations";
import { listGearProfiles } from "@/lib/supabase/queries/gear";
import { isUuid } from "@/lib/missions/resolveMissionRefs";
import type { GearProfile, Location } from "@/lib/types";
import {
  buildRecommendationForCatalogId,
  sessionIntervalFromDateTime,
} from "@/lib/recommendations/mapper";
import {
  computeSessionAstronomy,
  formatLocalHm,
  formatWindowLabel,
  sampleTargetAltitudeSeries,
} from "@/lib/sky/visibility";
import { computeRigFraming, rigFitLabel } from "@/lib/gear/framing";
import { resolveCatalogId } from "@/lib/sky/curatedTargets";

export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rawId = params.id as string;
  const id = resolveCatalogId(rawId);
  const catalog = curatedTargetById(id);
  const addToPlan = useDashboardRecommendationStore((s) => s.addToPlan);
  const plannedEntries = useDashboardRecommendationStore(
    (s) => s.plannedEntries,
  );
  const isInPlan =
    plannedEntries.some((e) => e.catalogId === id) ||
    plannedEntries.some((e) => e.catalogId === rawId);

  const {
    activeLocationId,
    activeGearId,
    dateTime,
    minAltitude,
    moonTolerance,
    targetTypes,
    driveToDarker,
    driveRadius,
  } = useAppStore();

  const [dbLocations, setDbLocations] = useState<Location[]>([]);
  const [dbGear, setDbGear] = useState<GearProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const [locs, gear] = await Promise.all([
          listLocations(client),
          listGearProfiles(client),
        ]);
        if (cancelled) return;
        setDbLocations(
          locs.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lon: r.lon,
            bortle: r.bortle,
            notes: r.notes ?? undefined,
          })),
        );
        setDbGear(
          gear.map((r) => ({
            id: r.id,
            name: r.name,
            telescope_name: r.telescope_name,
            focal_length: r.focal_length,
            aperture: r.aperture,
            camera_name: r.camera_name,
            sensor_preset: r.sensor_preset,
            sensor_width_mm: r.sensor_width_mm ?? null,
            sensor_height_mm: r.sensor_height_mm ?? null,
            optics_factor: r.optics_factor ?? null,
            pixel_size: r.pixel_size ?? undefined,
            mount_type: r.mount_type,
            guiding: r.guiding,
            active: r.is_active,
          })),
        );
      } catch {
        /* fallback mocks */
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

  const activeGear = useMemo(() => {
    if (isUuid(activeGearId)) {
      const fromDb = dbGear.find((g) => g.id === activeGearId);
      if (fromDb) return fromDb;
    }
    return (
      MOCK_GEAR.find((g) => g.id === activeGearId) ??
      dbGear.find((g) => g.active) ??
      dbGear[0] ??
      MOCK_GEAR[0]
    );
  }, [activeGearId, dbGear]);

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

  const session = useMemo(
    () => sessionIntervalFromDateTime(dateTime),
    [dateTime],
  );

  const astronomy = useMemo(() => {
    if (!catalog || activeLoc?.lat == null || activeLoc?.lon == null) {
      return null;
    }
    return computeSessionAstronomy({
      site: { latDeg: activeLoc.lat, lonDeg: activeLoc.lon },
      sessionStart: session.start,
      sessionEnd: session.end,
      minAltitudeDeg: minAltitude,
      moonToleranceDeg: moonTolerance,
      targets: [catalog],
    });
  }, [catalog, activeLoc?.lat, activeLoc?.lon, session, minAltitude, moonTolerance]);

  const vis = astronomy?.targets[0] ?? null;

  const altitudeData = useMemo(() => {
    if (!catalog || activeLoc?.lat == null || activeLoc?.lon == null) return [];
    return sampleTargetAltitudeSeries({
      latDeg: activeLoc.lat,
      lonDeg: activeLoc.lon,
      target: catalog,
      sessionStart: session.start,
      sessionEnd: session.end,
    });
  }, [catalog, activeLoc?.lat, activeLoc?.lon, session]);

  const framing = useMemo(() => {
    if (!catalog) return null;
    return computeRigFraming(
      {
        focalLengthMm: activeGear?.focal_length ?? NaN,
        sensorWidthMm: activeGear?.sensor_width_mm,
        sensorHeightMm: activeGear?.sensor_height_mm,
        opticsFactor: activeGear?.optics_factor,
      },
      {
        sizeMajorArcmin:
          catalog.sizeMajorArcmin ?? catalog.angularSizeArcmin ?? null,
        sizeMinorArcmin: catalog.sizeMinorArcmin,
        sizeVerified: catalog.sizeVerified === true,
      },
    );
  }, [catalog, activeGear]);

  const recommendation = useMemo(() => {
    if (!catalog || activeLoc?.lat == null || activeLoc?.lon == null) {
      return null;
    }
    return buildRecommendationForCatalogId({
      targetId: catalog.id,
      latDeg: activeLoc.lat,
      lonDeg: activeLoc.lon,
      dateTime,
      constraints,
      gear: activeGear
        ? {
            focalLengthMm: activeGear.focal_length,
            sensorWidthMm: activeGear.sensor_width_mm,
            sensorHeightMm: activeGear.sensor_height_mm,
            opticsFactor: activeGear.optics_factor,
          }
        : null,
    });
  }, [catalog, activeLoc?.lat, activeLoc?.lon, dateTime, constraints, activeGear]);

  if (!catalog) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Target not found</p>
        <Link href="/targets">
          <Button variant="link" className="mt-2">
            Back to targets
          </Button>
        </Link>
      </div>
    );
  }

  const size =
    catalog.sizeMajorArcmin ?? catalog.angularSizeArcmin ?? null;
  const hasSite = activeLoc?.lat != null && activeLoc?.lon != null;
  const windowLabel = vis?.recommendedWindow
    ? formatWindowLabel(
        vis.recommendedWindow.start,
        vis.recommendedWindow.end,
      )
    : null;
  const displayImage = getCatalogDisplayImage(catalog.id);

  const handleAddToTonightPlan = () => {
    if (isInPlan) return;
    if (!hasSite) {
      toast("Select a location first", "error");
      return;
    }
    if (!recommendation) {
      toast(
        "Not suitable for this session — cannot add to plan",
        "error",
      );
      return;
    }
    addToPlan(catalog.id);
    toast("Added to Tonight Plan", "success");
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-heading">{catalog.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="capitalize">
              {catalog.type.replace("_", " ")}
            </span>
            <span>
              Mag{" "}
              {catalog.magnitude != null
                ? catalog.magnitude.toFixed(1)
                : "—"}
            </span>
            <span>
              {size != null ? formatAngularSize(size) : "Size —"}
            </span>
            <span>{catalog.constellation ?? "—"}</span>
            {recommendation?.score != null ? (
              <ScoreBadge
                score={recommendation.score}
                size="lg"
                className="ml-1"
              />
            ) : (
              <span className="text-xs text-zinc-600">Score N/A</span>
            )}
          </div>
          {catalog.catalogIds && (
            <p className="mt-1 text-[11px] text-zinc-600">
              {catalog.catalogIds.join(" · ")}
              {catalog.sizeSource
                ? ` · Size: ${catalog.sizeKind?.replace(/_/g, " ") ?? "—"} (${catalog.sizeSource})`
                : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="cta"
            onClick={handleAddToTonightPlan}
            disabled={isInPlan || !recommendation}
          >
            {isInPlan ? "In Tonight Plan" : "Add to Tonight Plan"}
          </Button>
          <Link href={`/sessions/new?target=${catalog.id}`}>
            <Button variant="outline">Log this target</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800/60">
        <CatalogObjectImage
          catalogId={catalog.id}
          targetType={catalog.type}
          className="aspect-video w-full"
          showCredit
        />
        {displayImage?.matchMethod === "catalog_radec_dss2" && (
          <p className="border-t border-zinc-800/60 px-3 py-2 text-[11px] text-zinc-600">
            Survey cutout centered on this object&apos;s catalog coordinates
            (not a free-text photo search).
          </p>
        )}
      </div>

      {!hasSite ? (
        <p className="text-sm text-zinc-500">
          Select a location to calculate visibility for this session.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Altitude this session</h2>
              <p className="text-[11px] text-zinc-600">
                Calculated for your site ·{" "}
                {formatLocalHm(session.start)}–{formatLocalHm(session.end)}
              </p>
            </CardHeader>
            <CardContent>
              <AltitudeChart data={altitudeData} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  Usable imaging window
                </div>
                <div className="mt-1 font-mono text-lg tabular-nums">
                  {windowLabel ?? "Unavailable"}
                </div>
                {vis?.unavailableReason && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {vis.unavailableReason.replace(/_/g, " ")}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  Peak altitude
                </div>
                <div className="mt-1 font-mono text-lg tabular-nums">
                  {vis?.peakAltitudeDeg != null
                    ? `${vis.peakAltitudeDeg.toFixed(0)}°`
                    : "—"}
                  {vis?.peakAt
                    ? ` at ${formatLocalHm(vis.peakAt)}`
                    : ""}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs uppercase tracking-wider text-zinc-500">
                  Moon separation (min in window)
                </div>
                <div className="mt-1 font-mono text-lg tabular-nums">
                  {vis?.minMoonSeparationDeg != null
                    ? `${vis.minMoonSeparationDeg.toFixed(0)}°`
                    : "—"}
                  {astronomy?.moon
                    ? ` · ${astronomy.moon.phaseLabel} (${astronomy.moon.interferenceLabel})`
                    : ""}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Rig framing</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {framing ? (
            <>
              <p className="text-sm text-zinc-300">
                <span className="font-medium text-zinc-100">
                  {rigFitLabel(framing.state)}
                </span>
                {" — "}
                {framing.detail}
              </p>
              {framing.state === "unknown" &&
                framing.missing.includes("sensor") && (
                  <Link
                    href="/settings?tab=gear"
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Edit active rig
                  </Link>
                )}
              <p className="text-[10px] text-zinc-600">
                Schematic FOV comparison only — not a photographic composition.
                {!isRecommendEligible(catalog) &&
                  " Automatic recommendations require verified size."}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Not calculated</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">
            Session notes{" "}
            <span className="font-normal text-amber-400/80">(Demo)</span>
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">
            {windowLabel
              ? `${catalog.name} has a calculated usable window ${windowLabel} for your current site and session. Scores use altitude and Moon separation only.`
              : `${catalog.name} has no usable window under your current altitude and Moon constraints for this session.`}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
