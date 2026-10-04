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
} from "@/lib/supabase/queries/gear";

type GearFormState = {
  rig_name: string;
  telescope_name: string;
  focal_length: number;
  aperture: number;
  camera: string;
  sensor_preset: string;
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
  sensor_preset: "",
  pixel_size: NaN,
  mount_type: "",
  guiding: false,
};

function toSensorPreset(
  value: string,
): GearProfile["sensor_preset"] {
  if (
    value === "apsc" ||
    value === "full_frame" ||
    value === "m43" ||
    value === "1inch"
  ) {
    return value;
  }
  return "apsc";
}

export function GearProfilesSection() {
  const { toast } = useToast();
  const { activeGearId, setActiveGear } = useAppStore();
  const [profiles, setProfiles] = useState<GearProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GearFormState>(initialFormState);

  const updateForm = (updates: Partial<GearFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(initialFormState);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listGearProfiles(getSupabaseBrowserClient());
        if (!cancelled) {
          setProfiles(
            rows.map((r) => ({
              id: r.id,
              name: r.name,
              telescope_name: r.telescope_name,
              focal_length: r.focal_length,
              aperture: r.aperture,
              camera_name: r.camera_name,
              sensor_preset: r.sensor_preset,
              pixel_size: r.pixel_size ?? undefined,
              mount_type: r.mount_type,
              guiding: r.guiding,
              active: r.is_active,
            })),
          );
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

  const handleAddProfile = async () => {
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
    try {
      const row = await createGearProfile(getSupabaseBrowserClient(), {
        name,
        telescope_name: form.telescope_name.trim(),
        focal_length: form.focal_length,
        aperture: form.aperture,
        camera_name: form.camera.trim(),
        sensor_preset: toSensorPreset(form.sensor_preset.trim()),
        pixel_size: Number.isNaN(form.pixel_size) ? undefined : form.pixel_size,
        mount_type: form.mount_type as GearProfile["mount_type"],
        guiding: form.guiding,
        is_active: false,
      });
      setProfiles((prev) => [
        ...prev,
        {
          id: row.id,
          name: row.name,
          telescope_name: row.telescope_name,
          focal_length: row.focal_length,
          aperture: row.aperture,
          camera_name: row.camera_name,
          sensor_preset: row.sensor_preset,
          pixel_size: row.pixel_size ?? undefined,
          mount_type: row.mount_type,
          guiding: row.guiding,
          active: row.is_active,
        },
      ]);
      toast("Gear profile added", "success");
      handleClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to add gear", "error");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Gear profiles</h2>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Add profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((g) => {
              const isActive = activeGearId === g.id;
              return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <Card className={isActive ? "border-indigo-500/50" : ""}>
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm">{g.name}</h3>
                      {isActive ? (
                        <span className="text-xs text-indigo-400">Active</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setActiveGear(g.id)}
                        >
                          Set as active
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 py-2 pt-0 text-sm text-zinc-400">
                    <div>Telescope: {g.telescope_name}</div>
                    <div>
                      Focal: {g.focal_length}mm · Aperture: {g.aperture}mm
                    </div>
                    <div>
                      Camera: {g.camera_name} ({g.sensor_preset})
                    </div>
                    <div>
                      Mount: {g.mount_type} · Guiding: {g.guiding ? "Yes" : "No"}
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
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-200">
                Add Gear Profile
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
                handleAddProfile();
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
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2">
                    Camera
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
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
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Sensor size
                      </label>
                      <Input
                        type="text"
                        value={form.sensor_preset}
                        onChange={(e) =>
                          updateForm({ sensor_preset: e.target.value })
                        }
                        placeholder="e.g. 1inch, full_frame, APS-C"
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
                    Add
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
