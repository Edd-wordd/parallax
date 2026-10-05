"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { GearProfile } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createGearProfile,
  listGearProfiles,
  setActiveGearProfile,
  updateGearProfile,
} from "@/lib/supabase/queries/gear";
import type { GearProfileRow } from "@/lib/schemas";
import {
  findKnownSensorByCameraName,
  getKnownSensorById,
  KNOWN_SENSORS,
} from "@/lib/gear/knownSensors";

type GearFormState = {
  rig_name: string;
  telescope_name: string;
  focal_length: number;
  aperture: number;
  camera: string;
  known_sensor_id: string;
  sensor_width_mm: number;
  sensor_height_mm: number;
  optics_factor: number;
  pixel_size: number;
  mount_type: string;
  guiding: boolean;
};

const initialFormState: GearFormState = {
  rig_name: "",
  telescope_name: "",
  focal_length: NaN,
  aperture: NaN,
  camera: "",
  known_sensor_id: "",
  sensor_width_mm: NaN,
  sensor_height_mm: NaN,
  optics_factor: NaN,
  pixel_size: NaN,
  mount_type: "",
  guiding: false,
};

function rowToProfile(r: GearProfileRow): GearProfile {
  return {
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
  };
}

function validateSensorMm(w: number, h: number): string | null {
  if (Number.isNaN(w) || Number.isNaN(h)) {
    return "Sensor width and height (mm) are required for framing";
  }
  if (!(w > 0 && h > 0 && w <= 50 && h <= 50)) {
    return "Sensor dimensions must be between 0 and 50 mm";
  }
  return null;
}

function formToSensorPreset(
  knownId: string,
  camera: string,
): GearProfile["sensor_preset"] {
  const known = knownId
    ? getKnownSensorById(knownId)
    : findKnownSensorByCameraName(camera);
  return known?.sensorPreset ?? "1inch";
}

export function GearProfilesSection() {
  const { toast } = useToast();
  const { activeGearId, setActiveGear } = useAppStore();
  const [profiles, setProfiles] = useState<GearProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GearFormState>(initialFormState);

  const updateForm = (updates: Partial<GearFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialFormState);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (g: GearProfile) => {
    const known = findKnownSensorByCameraName(g.camera_name);
    setEditingId(g.id);
    setForm({
      rig_name: g.name,
      telescope_name: g.telescope_name,
      focal_length: g.focal_length,
      aperture: g.aperture,
      camera: g.camera_name,
      known_sensor_id: known?.id ?? "",
      sensor_width_mm: g.sensor_width_mm ?? NaN,
      sensor_height_mm: g.sensor_height_mm ?? NaN,
      optics_factor: g.optics_factor ?? NaN,
      pixel_size: g.pixel_size ?? NaN,
      mount_type: g.mount_type,
      guiding: g.guiding,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listGearProfiles(getSupabaseBrowserClient());
        if (!cancelled) {
          setProfiles(rows.map(rowToProfile));
        }
      } catch {
        /* AuthProvider handles connection errors */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyKnownSensor = (sensorId: string) => {
    if (!sensorId) {
      updateForm({ known_sensor_id: "" });
      return;
    }
    const s = getKnownSensorById(sensorId);
    if (!s) return;
    updateForm({
      known_sensor_id: sensorId,
      sensor_width_mm: s.sensorWidthMm,
      sensor_height_mm: s.sensorHeightMm,
      pixel_size: s.pixelSizeUm ?? NaN,
      camera: form.camera.trim() || s.label.split(" (")[0]!,
    });
  };

  const applyVerifiedForCamera = () => {
    const s = findKnownSensorByCameraName(form.camera);
    if (!s) {
      toast("No verified dimensions for this camera name", "error");
      return;
    }
    updateForm({
      known_sensor_id: s.id,
      sensor_width_mm: s.sensorWidthMm,
      sensor_height_mm: s.sensorHeightMm,
      pixel_size: s.pixelSizeUm ?? form.pixel_size,
    });
    toast(`Applied ${s.sensorWidthMm} × ${s.sensorHeightMm} mm`, "success");
  };

  const handleSave = async () => {
    const name = form.rig_name.trim();
    if (
      !name ||
      !form.telescope_name.trim() ||
      !form.camera.trim() ||
      Number.isNaN(form.focal_length) ||
      Number.isNaN(form.aperture) ||
      !form.mount_type
    ) {
      toast("Rig, optics, camera, and mount are required", "error");
      return;
    }
    const sensorErr = validateSensorMm(
      form.sensor_width_mm,
      form.sensor_height_mm,
    );
    if (sensorErr) {
      toast(sensorErr, "error");
      return;
    }
    if (
      !Number.isNaN(form.optics_factor) &&
      (!(form.optics_factor > 0) || !Number.isFinite(form.optics_factor))
    ) {
      toast("Optics factor must be a positive number when set", "error");
      return;
    }

    const payload = {
      name,
      telescope_name: form.telescope_name.trim(),
      focal_length: form.focal_length,
      aperture: form.aperture,
      camera_name: form.camera.trim(),
      sensor_preset: formToSensorPreset(form.known_sensor_id, form.camera),
      sensor_width_mm: form.sensor_width_mm,
      sensor_height_mm: form.sensor_height_mm,
      optics_factor: Number.isNaN(form.optics_factor)
        ? null
        : form.optics_factor,
      pixel_size: Number.isNaN(form.pixel_size) ? undefined : form.pixel_size,
      mount_type: form.mount_type as GearProfile["mount_type"],
      guiding: form.guiding,
    };

    try {
      const client = getSupabaseBrowserClient();
      if (editingId) {
        const row = await updateGearProfile(client, editingId, payload);
        setProfiles((prev) =>
          prev.map((p) => (p.id === editingId ? rowToProfile(row) : p)),
        );
        toast("Gear profile updated", "success");
      } else {
        const row = await createGearProfile(client, {
          ...payload,
          is_active: false,
        });
        setProfiles((prev) => [...prev, rowToProfile(row)]);
        toast("Gear profile added", "success");
      }
      handleClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save gear", "error");
    }
  };

  const handleSetActive = async (id: string) => {
    setActiveGear(id);
    try {
      await setActiveGearProfile(getSupabaseBrowserClient(), id);
      setProfiles((prev) =>
        prev.map((p) => ({ ...p, active: p.id === id })),
      );
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Could not persist active rig",
        "error",
      );
    }
  };

  const knownMatch = findKnownSensorByCameraName(form.camera);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Gear profiles</h2>
            <Button size="sm" onClick={openAdd}>
              Add profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((g) => {
              const isActive = activeGearId === g.id;
              const hasDims =
                g.sensor_width_mm != null && g.sensor_height_mm != null;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <Card className={isActive ? "border-indigo-500/50" : ""}>
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{g.name}</h3>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => openEdit(g)}
                          >
                            Edit
                          </Button>
                          {isActive ? (
                            <span className="text-xs text-indigo-400 self-center">
                              Active
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => void handleSetActive(g.id)}
                            >
                              Set as active
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 py-2 pt-0 text-sm text-zinc-400">
                      <div>Telescope: {g.telescope_name}</div>
                      <div>
                        Focal: {g.focal_length}mm · Aperture: {g.aperture}mm
                      </div>
                      <div>Camera: {g.camera_name}</div>
                      <div>
                        Sensor:{" "}
                        {hasDims
                          ? `${g.sensor_width_mm} × ${g.sensor_height_mm} mm`
                          : "Not set (framing unknown)"}
                      </div>
                      {g.optics_factor != null && g.optics_factor !== 1 && (
                        <div>Optics factor: {g.optics_factor}×</div>
                      )}
                      <div>
                        Mount: {g.mount_type} · Guiding:{" "}
                        {g.guiding ? "Yes" : "No"}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-sm font-medium text-zinc-200">
                {editingId ? "Edit Gear Profile" : "Add Gear Profile"}
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
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Optics
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Rig
                      </label>
                      <Input
                        type="text"
                        value={form.rig_name}
                        onChange={(e) =>
                          updateForm({ rig_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Telescope
                      </label>
                      <Input
                        type="text"
                        value={form.telescope_name}
                        onChange={(e) =>
                          updateForm({ telescope_name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Focal mm
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={
                          Number.isNaN(form.focal_length)
                            ? ""
                            : form.focal_length
                        }
                        onChange={(e) =>
                          updateForm({
                            focal_length: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Aperture mm
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={Number.isNaN(form.aperture) ? "" : form.aperture}
                        onChange={(e) =>
                          updateForm({
                            aperture: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">
                        Reducer / Barlow factor (optional)
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="e.g. 0.8 reducer, 2 Barlow — leave empty for none"
                        value={
                          Number.isNaN(form.optics_factor)
                            ? ""
                            : form.optics_factor
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          updateForm({
                            optics_factor:
                              v === "" ? NaN : parseFloat(v),
                          });
                        }}
                      />
                      <p className="mt-1 text-[10px] text-zinc-600">
                        Empty = use focal length as entered. Not applied
                        silently.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Camera &amp; sensor
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">
                        Model
                      </label>
                      <Input
                        type="text"
                        value={form.camera}
                        onChange={(e) =>
                          updateForm({ camera: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">
                        Fill from known camera
                      </label>
                      <Select
                        options={[
                          { value: "", label: "— enter dimensions manually —" },
                          ...KNOWN_SENSORS.map((s) => ({
                            value: s.id,
                            label: s.label,
                          })),
                        ]}
                        value={form.known_sensor_id}
                        onValueChange={applyKnownSensor}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Sensor width mm
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        required
                        value={
                          Number.isNaN(form.sensor_width_mm)
                            ? ""
                            : form.sensor_width_mm
                        }
                        onChange={(e) =>
                          updateForm({
                            sensor_width_mm: parseFloat(e.target.value),
                            known_sensor_id: "",
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Sensor height mm
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        required
                        value={
                          Number.isNaN(form.sensor_height_mm)
                            ? ""
                            : form.sensor_height_mm
                        }
                        onChange={(e) =>
                          updateForm({
                            sensor_height_mm: parseFloat(e.target.value),
                            known_sensor_id: "",
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Pixel µm
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={
                          Number.isNaN(form.pixel_size) ? "" : form.pixel_size
                        }
                        onChange={(e) =>
                          updateForm({
                            pixel_size: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    {knownMatch &&
                      (Number.isNaN(form.sensor_width_mm) ||
                        form.sensor_width_mm !== knownMatch.sensorWidthMm) && (
                        <div className="col-span-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={applyVerifiedForCamera}
                          >
                            Use verified dims for {knownMatch.label.split(" (")[0]}
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Mount
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Type
                      </label>
                      <Select
                        options={[
                          { value: "", label: "—" },
                          { value: "equatorial", label: "Equatorial" },
                          { value: "alt-az", label: "Alt-Az" },
                        ]}
                        value={form.mount_type}
                        onValueChange={(value) =>
                          updateForm({ mount_type: value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="guiding"
                        checked={form.guiding}
                        onCheckedChange={(checked) =>
                          updateForm({ guiding: !!checked })
                        }
                      />
                      <label
                        htmlFor="guiding"
                        className="text-xs text-zinc-500 cursor-pointer"
                      >
                        Guiding
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
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
    </>
  );
}
