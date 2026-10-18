"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin } from "lucide-react";
import type { Location } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createLocation,
  listLocations,
  softDeleteLocationIfUnused,
  updateLocation,
} from "@/lib/supabase/queries/locations";
import { useAppStore } from "@/lib/store";
import {
  COMMON_SITE_TIMEZONES,
  isValidIanaTimeZone,
} from "@/lib/time/commonTimezones";

/** Dispatched so ContextChipsBar reloads site options after Settings changes. */
export const LOCATIONS_CHANGED_EVENT = "parallax:locations-changed";

type LocationFormState = {
  name: string;
  latitude: number;
  longitude: number;
  bortle: number;
  notes: string;
  /** Empty string = device time (null in DB) */
  timezone: string;
};

const initialLocationForm: LocationFormState = {
  name: "",
  latitude: NaN,
  longitude: NaN,
  bortle: NaN,
  notes: "",
  timezone: "",
};

function rowToLocation(r: {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bortle: number;
  notes?: string | null;
  timezone?: string | null;
}): Location {
  return {
    id: r.id,
    name: r.name,
    lat: r.lat,
    lon: r.lon,
    bortle: r.bortle,
    notes: r.notes ?? undefined,
    timezone: r.timezone ?? null,
  };
}

function notifyLocationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCATIONS_CHANGED_EVENT));
  }
}

function geolocationErrorMessage(err: GeolocationPositionError | Error): string {
  if ("code" in err) {
    if (err.code === err.PERMISSION_DENIED) {
      return "Location permission denied — enter coordinates manually.";
    }
    if (err.code === err.POSITION_UNAVAILABLE) {
      return "Location unavailable — enter coordinates manually.";
    }
    if (err.code === err.TIMEOUT) {
      return "Location request timed out — enter coordinates manually.";
    }
  }
  return "Could not get location — enter coordinates manually.";
}

export function LocationsSection() {
  const { toast } = useToast();
  const activeLocationId = useAppStore((s) => s.activeLocationId);
  const setActiveLocation = useAppStore((s) => s.setActiveLocation);
  const [locations, setLocations] = useState<Location[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [darkerSitesOpen, setDarkerSitesOpen] = useState(false);
  const [form, setForm] = useState<LocationFormState>(initialLocationForm);
  const [geolocating, setGeolocating] = useState(false);
  const [geoAttempted, setGeoAttempted] = useState(false);

  const updateForm = (updates: Partial<LocationFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialLocationForm);
    setGeoAttempted(false);
  };

  const loadLocations = useCallback(async () => {
    const rows = await listLocations(getSupabaseBrowserClient());
    setLocations(rows.map(rowToLocation));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadLocations();
      } catch {
        /* AuthProvider handles connection errors */
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLocations]);

  const requestGeolocation = useCallback(async () => {
      if (!navigator.geolocation) {
        toast("Geolocation is not available in this browser", "error");
        return;
      }
      setGeolocating(true);
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 12_000,
              maximumAge: 60_000,
            });
          },
        );
        setForm((prev) => {
          const latEmpty = Number.isNaN(prev.latitude);
          const lonEmpty = Number.isNaN(prev.longitude);
          // Never overwrite coordinates the user already entered
          if (!latEmpty || !lonEmpty) return prev;
          return {
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        });
      } catch (e) {
        const geoErr = e as GeolocationPositionError;
        toast(geolocationErrorMessage(geoErr), "error");
      } finally {
        setGeolocating(false);
      }
    }, [toast]);

  const openAdd = () => {
    setEditingId(null);
    setForm(initialLocationForm);
    setGeoAttempted(false);
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      latitude: loc.lat,
      longitude: loc.lon,
      bortle: loc.bortle,
      notes: loc.notes ?? "",
      timezone: loc.timezone?.trim() || "",
    });
    setGeoAttempted(true);
    setModalOpen(true);
  };

  // Auto-request GPS when opening Add (empty coords only)
  useEffect(() => {
    if (!modalOpen || editingId || geoAttempted) return;
    setGeoAttempted(true);
    void requestGeolocation();
  }, [modalOpen, editingId, geoAttempted, requestGeolocation]);

  const handleSave = async () => {
    const name = form.name.trim();
    if (
      !name ||
      Number.isNaN(form.latitude) ||
      Number.isNaN(form.longitude) ||
      Number.isNaN(form.bortle)
    ) {
      toast("Name, coordinates, and Bortle are required", "error");
      return;
    }
    const tz = form.timezone.trim();
    if (tz && !isValidIanaTimeZone(tz)) {
      toast("Choose a valid IANA timezone or Device time", "error");
      return;
    }
    try {
      const client = getSupabaseBrowserClient();
      const payload = {
        name,
        lat: form.latitude,
        lon: form.longitude,
        bortle: form.bortle,
        notes: form.notes.trim() || undefined,
        timezone: tz || null,
      };
      if (editingId) {
        const row = await updateLocation(client, editingId, {
          ...payload,
          notes: form.notes.trim() || null,
          timezone: tz || null,
        });
        setLocations((prev) =>
          prev.map((l) => (l.id === editingId ? rowToLocation(row) : l)),
        );
        toast("Location updated", "success");
      } else {
        const row = await createLocation(client, {
          ...payload,
          timezone: tz || undefined,
        });
        setLocations((prev) => [...prev, rowToLocation(row)]);
        toast("Location added", "success");
      }
      notifyLocationsChanged();
      handleClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save location", "error");
    }
  };

  const handleRemoveDuplicate = async (loc: Location) => {
    try {
      const result = await softDeleteLocationIfUnused(
        getSupabaseBrowserClient(),
        loc.id,
      );
      if (!result.deleted) {
        toast(result.reason ?? "Cannot remove this location", "error");
        return;
      }
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
      if (activeLocationId === loc.id) {
        const next = locations.find((l) => l.id !== loc.id);
        setActiveLocation(next?.id ?? "");
      }
      notifyLocationsChanged();
      toast("Unused location removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to remove", "error");
    }
  };

  const isPlaceholder = (loc: Location) =>
    (loc.notes ?? "").toLowerCase().includes("placeholder") ||
    loc.name === "My observing site" ||
    loc.name === "Home site";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Locations</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Edit your site coordinates and Bortle. GPS never sets Bortle —
                use a verified light-pollution source.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkerSitesOpen(true)}
              >
                Find darker sites nearby (Demo)
              </Button>
              <Button size="sm" onClick={openAdd}>
                Add location
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{loc.name}</h3>
                      {isPlaceholder(loc) && (
                        <span className="shrink-0 text-[9px] uppercase tracking-wide text-amber-400/90">
                          Edit site
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 py-2 pt-0 text-sm text-zinc-400">
                    <div>
                      {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                    </div>
                    <div>Bortle: {loc.bortle}</div>
                    <div className="text-xs text-zinc-500">
                      Timezone: {loc.timezone?.trim() || "Device time"}
                    </div>
                    {loc.notes && (
                      <div className="text-zinc-500 text-xs">{loc.notes}</div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => openEdit(loc)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-zinc-500"
                        onClick={() => void handleRemoveDuplicate(loc)}
                      >
                        Remove if unused
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-200">
                {editingId ? "Edit location" : "Add location"}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 -m-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={Number.isNaN(form.latitude) ? "" : form.latitude}
                      onChange={(e) =>
                        updateForm({
                          latitude:
                            e.target.value === ""
                              ? NaN
                              : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={Number.isNaN(form.longitude) ? "" : form.longitude}
                      onChange={(e) =>
                        updateForm({
                          longitude:
                            e.target.value === ""
                              ? NaN
                              : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void requestGeolocation()}
                    disabled={geolocating}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {geolocating
                      ? "Getting location…"
                      : "Use my current location"}
                  </Button>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Fills empty coordinates only — never overwrites values you
                    typed. Does not set Bortle.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    Bortle
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={9}
                    step={1}
                    value={Number.isNaN(form.bortle) ? "" : form.bortle}
                    onChange={(e) => {
                      const v =
                        e.target.value === "" ? NaN : parseFloat(e.target.value);
                      if (Number.isNaN(v)) {
                        updateForm({ bortle: NaN });
                      } else {
                        updateForm({
                          bortle: Math.min(9, Math.max(1, Math.round(v))),
                        });
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    1 (darkest) – 9 (city). Enter from a verified source (e.g.
                    light-pollution map); GPS does not set this.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    Site timezone
                  </label>
                  <select
                    className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-200"
                    value={form.timezone}
                    onChange={(e) => updateForm({ timezone: e.target.value })}
                  >
                    {COMMON_SITE_TIMEZONES.map((z) => (
                      <option key={z.label} value={z.value}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Optional IANA zone for observing civil time. Leave as Device
                    time when the site matches this device. Changing timezone
                    does not rewrite an accepted mission schedule.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    Notes <span className="text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500/40 resize-none"
                    placeholder="e.g. horizon obstructions, access notes"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    {editingId ? "Save" : "Add"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {darkerSitesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setDarkerSitesOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 w-full max-w-lg"
          >
            <h3 className="text-lg font-medium mb-4">
              Darker sites nearby (Demo)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Pinnacles Dark Site</span>
                <span className="text-cyan-400">45 min drive · Bortle 4</span>
              </div>
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Mount Diablo</span>
                <span className="text-cyan-400">1h 10m · Bortle 5</span>
              </div>
              <div className="flex justify-between rounded border border-zinc-700 p-2">
                <span>Death Valley</span>
                <span className="text-cyan-400">8h · Bortle 1</span>
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() => setDarkerSitesOpen(false)}
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}
