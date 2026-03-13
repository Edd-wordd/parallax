"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin } from "lucide-react";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LocationFormState = {
  name: string;
  latitude: number;
  longitude: number;
  bortle: number;
  notes: string;
};

const initialLocationForm: LocationFormState = {
  name: "",
  latitude: NaN,
  longitude: NaN,
  bortle: NaN,
  notes: "",
};

export default function LocationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [darkerSitesOpen, setDarkerSitesOpen] = useState(false);
  const [form, setForm] = useState<LocationFormState>(initialLocationForm);
  const [geolocating, setGeolocating] = useState(false);

  const updateForm = (updates: Partial<LocationFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(initialLocationForm);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      updateForm({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } finally {
      setGeolocating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDarkerSitesOpen(true)}>
            Find darker sites nearby
          </Button>
          <Button onClick={() => setModalOpen(true)}>Add location</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_LOCATIONS.map((loc) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-medium">{loc.name}</h2>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-zinc-400">
                <div>{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</div>
                <div>Bortle: {loc.bortle}</div>
                {loc.notes && <div className="text-zinc-500">{loc.notes}</div>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
              <h2 className="text-sm font-medium text-zinc-200">Add location</h2>
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
                handleClose();
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
                    <label className="block text-xs text-zinc-500 mb-1">Latitude</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={Number.isNaN(form.latitude) ? "" : form.latitude}
                      onChange={(e) =>
                        updateForm({ latitude: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Longitude</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={Number.isNaN(form.longitude) ? "" : form.longitude}
                      onChange={(e) =>
                        updateForm({ longitude: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={geolocating}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {geolocating ? "Getting location…" : "Use my current location"}
                  </Button>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Bortle</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={9}
                    step={1}
                    value={Number.isNaN(form.bortle) ? "" : form.bortle}
                    onChange={(e) => {
                      const v = e.target.value === "" ? NaN : parseFloat(e.target.value);
                      if (Number.isNaN(v)) {
                        updateForm({ bortle: NaN });
                      } else {
                        const clamped = Math.min(9, Math.max(1, Math.round(v)));
                        updateForm({ bortle: clamped });
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-zinc-500">1 (darkest) – 9 (city)</p>
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
                  <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add
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
            <h3 className="text-lg font-medium mb-4">Darker sites nearby (mock)</h3>
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
            <Button className="mt-4" onClick={() => setDarkerSitesOpen(false)}>Close</Button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
