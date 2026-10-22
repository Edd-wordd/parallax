"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type {
  GearAccessory,
  GearMountClass,
  GearProfile,
  GearTracking,
} from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import {
  findKnownTelescopeByName,
  getKnownTelescopeById,
  KNOWN_TELESCOPES,
} from "@/lib/gear/knownTelescopes";
import {
  effectiveFocalLengthMm,
  formatFRatio,
  fRatio,
  samplingArcsecPerPixel,
} from "@/lib/gear/opticsMath";

type GearFormState = {
  rig_name: string;
  known_telescope_id: string;
  telescope_name: string;
  focal_length: number;
  aperture: number;
  camera: string;
  known_sensor_id: string;
  sensor_width_mm: number;
  sensor_height_mm: number;
  optics_factor: number;
  pixel_size: number;
  camera_cooled: boolean;
  mount_type: string;
  mount_class: GearMountClass;
  tracking: GearTracking;
  accessories: GearAccessory[];
  mount_notes: string;
};

const ACCESSORY_OPTIONS: { id: GearAccessory; label: string; hint: string }[] =
  [
    {
      id: "focus_mask",
      label: "Focus mask (Bahtinov / mesh)",
      hint: "Plastic mesh or Bahtinov mask for focusing — not polar alignment",
    },
    {
      id: "flattener_coma",
      label: "Flattener / coma corrector",
      hint: "Common on Newtonians (e.g. AstroMaster 130) for sharper edges",
    },
    {
      id: "dew_control",
      label: "Dew heater / shield",
      hint: "Field checklist — prevents fogged optics",
    },
    {
      id: "filters_owned",
      label: "Own light-pollution / narrowband filters",
      hint: "Filter choice still set per target in Capture; this tags ownership",
    },
  ];

const initialFormState: GearFormState = {
  rig_name: "",
  known_telescope_id: "",
  telescope_name: "",
  focal_length: NaN,
  aperture: NaN,
  camera: "",
  known_sensor_id: "",
  sensor_width_mm: NaN,
  sensor_height_mm: NaN,
  optics_factor: NaN,
  pixel_size: NaN,
  camera_cooled: false,
  mount_type: "",
  mount_class: "stock",
  tracking: "none",
  accessories: [],
  mount_notes: "",
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
    mount_class: r.mount_class,
    tracking: r.tracking,
    guiding: r.guiding,
    camera_cooled: r.camera_cooled,
    accessories: r.accessories,
    mount_notes: r.mount_notes ?? null,
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

function trackingLabel(t: GearTracking | undefined): string {
  switch (t) {
    case "guided":
      return "Guided";
    case "motorized":
      return "Motorized";
    default:
      return "No tracking";
  }
}

function mountClassLabel(c: GearMountClass | undefined): string {
  switch (c) {
    case "custom_diy":
      return "Custom / DIY";
    case "star_tracker":
      return "Star tracker";
    default:
      return "Stock";
  }
}

export function GearProfilesSection() {
  const { toast } = useToast();
  const { activeGearId, setActiveGear } = useAppStore();
  const [profiles, setProfiles] = useState<GearProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GearFormState>(initialFormState);
  const [showAdvancedOptics, setShowAdvancedOptics] = useState(false);

  const updateForm = (updates: Partial<GearFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const derived = useMemo(() => {
    const eff = effectiveFocalLengthMm(
      form.focal_length,
      Number.isNaN(form.optics_factor) ? null : form.optics_factor,
    );
    const ratio = fRatio(
      form.focal_length,
      form.aperture,
      Number.isNaN(form.optics_factor) ? null : form.optics_factor,
    );
    const sampling = samplingArcsecPerPixel(
      form.pixel_size,
      form.focal_length,
      Number.isNaN(form.optics_factor) ? null : form.optics_factor,
    );
    return { eff, ratio, sampling };
  }, [
    form.focal_length,
    form.aperture,
    form.optics_factor,
    form.pixel_size,
  ]);

  const handleClose = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialFormState);
    setShowAdvancedOptics(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(initialFormState);
    setShowAdvancedOptics(false);
    setModalOpen(true);
  };

  const openEdit = (g: GearProfile) => {
    const knownCam = findKnownSensorByCameraName(g.camera_name);
    const knownOta = findKnownTelescopeByName(g.telescope_name);
    setEditingId(g.id);
    setForm({
      rig_name: g.name,
      known_telescope_id: knownOta?.id ?? "",
      telescope_name: g.telescope_name,
      focal_length: g.focal_length,
      aperture: g.aperture,
      camera: g.camera_name,
      known_sensor_id: knownCam?.id ?? "",
      sensor_width_mm: g.sensor_width_mm ?? NaN,
      sensor_height_mm: g.sensor_height_mm ?? NaN,
      optics_factor: g.optics_factor ?? NaN,
      pixel_size: g.pixel_size ?? NaN,
      camera_cooled: g.camera_cooled ?? false,
      mount_type: g.mount_type,
      mount_class: g.mount_class ?? "stock",
      tracking:
        g.tracking ?? (g.guiding ? "guided" : "none"),
      accessories: g.accessories ?? [],
      mount_notes: g.mount_notes ?? "",
    });
    setShowAdvancedOptics(
      g.optics_factor != null ||
        (g.accessories?.includes("flattener_coma") ?? false),
    );
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

  const applyKnownTelescope = (telescopeId: string) => {
    if (!telescopeId) {
      updateForm({ known_telescope_id: "" });
      return;
    }
    const t = getKnownTelescopeById(telescopeId);
    if (!t) return;
    const nextAccessories = new Set(form.accessories);
    if (t.suggestsFlattenerComa) {
      /* hint only — do not force-check */
    }
    updateForm({
      known_telescope_id: telescopeId,
      telescope_name: t.telescopeName,
      focal_length: t.focalLengthMm,
      aperture: t.apertureMm,
      accessories: [...nextAccessories],
    });
    if (t.suggestsFlattenerComa) {
      setShowAdvancedOptics(true);
    }
  };

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
      camera:
        s.cameraName ??
        (form.camera.trim() || s.label.split(" (")[0]!),
      camera_cooled: s.cooled ?? false,
    });
  };

  const toggleAccessory = (id: GearAccessory, on: boolean) => {
    updateForm({
      accessories: on
        ? [...new Set([...form.accessories, id])]
        : form.accessories.filter((a) => a !== id),
    });
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
      toast("Rig, optics, camera, and mount geometry are required", "error");
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

    const guiding = form.tracking === "guided";
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
      mount_class: form.mount_class,
      tracking: form.tracking,
      guiding,
      camera_cooled: form.camera_cooled,
      accessories: form.accessories,
      mount_notes: form.mount_notes.trim() || null,
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

  const selectedOta = form.known_telescope_id
    ? getKnownTelescopeById(form.known_telescope_id)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="dash-section-title text-zinc-400">Gear profiles</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Libraries cover common imaging OTAs, Newts, SCTs/RCs, lenses, and
                dedicated/DSLR cameras — or enter any custom build. Framing uses
                focal length, optics factor, and sensor size.
              </p>
            </div>
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
              const eff = effectiveFocalLengthMm(
                g.focal_length,
                g.optics_factor,
              );
              const ratio = fRatio(
                g.focal_length,
                g.aperture,
                g.optics_factor,
              );
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
                      <div>{g.telescope_name}</div>
                      <div className="tabular-nums">
                        {eff != null ? `${Math.round(eff)} mm eff` : "—"} ·{" "}
                        {formatFRatio(ratio)}
                        {g.aperture ? ` · ${g.aperture} mm` : ""}
                      </div>
                      <div>
                        {g.camera_name}
                        {g.camera_cooled ? " · cooled" : ""}
                      </div>
                      <div>
                        Sensor:{" "}
                        {hasDims
                          ? `${g.sensor_width_mm} × ${g.sensor_height_mm} mm`
                          : "Not set (framing unknown)"}
                      </div>
                      <div>
                        {mountClassLabel(g.mount_class)} · {g.mount_type} ·{" "}
                        {trackingLabel(g.tracking ?? (g.guiding ? "guided" : "none"))}
                      </div>
                      {(g.accessories?.length ?? 0) > 0 && (
                        <div className="text-[11px] text-zinc-500">
                          {g.accessories!
                            .map((a) =>
                              ACCESSORY_OPTIONS.find((o) => o.id === a)?.label.split(
                                " (",
                              )[0],
                            )
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800/60 bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">
                  {editingId ? "Edit gear profile" : "Add gear profile"}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Starter kits: pick library items. Custom builds: override any
                  number and set mount class to Custom / DIY.
                </p>
              </div>
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
              <div className="p-4 space-y-5">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    Rig name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Backyard 130 + A7RII"
                    value={form.rig_name}
                    onChange={(e) =>
                      updateForm({ rig_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <p className="dash-section-title text-zinc-500 mb-2">
                    Telescope (OTA)
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Search telescope library
                      </label>
                      <SearchableSelect
                        options={[
                          {
                            value: "",
                            label: "— enter manually / custom glass —",
                          },
                          ...KNOWN_TELESCOPES.map((t) => ({
                            value: t.id,
                            label: t.label,
                          })),
                        ]}
                        value={form.known_telescope_id}
                        onValueChange={applyKnownTelescope}
                        placeholder="Type RedCat, Quattro, C8, AstroMaster…"
                        emptyLabel="— enter manually / custom glass —"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Telescope name
                      </label>
                      <Input
                        type="text"
                        value={form.telescope_name}
                        onChange={(e) =>
                          updateForm({
                            telescope_name: e.target.value,
                            known_telescope_id: "",
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Focal length mm
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
                              known_telescope_id: "",
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
                          value={
                            Number.isNaN(form.aperture) ? "" : form.aperture
                          }
                          onChange={(e) =>
                            updateForm({
                              aperture: parseFloat(e.target.value),
                              known_telescope_id: "",
                            })
                          }
                        />
                      </div>
                    </div>
                    {selectedOta?.suggestsFlattenerComa && (
                      <p className="text-[11px] text-amber-200/80">
                        Newtonians like this often need a coma corrector for
                        imaging — see Accessories below (optional).
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="dash-section-title text-zinc-500">
                      Optics extras
                    </p>
                    <button
                      type="button"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                      onClick={() => setShowAdvancedOptics((v) => !v)}
                    >
                      {showAdvancedOptics ? "Hide" : "Show"} reducer / Barlow
                    </button>
                  </div>
                  {showAdvancedOptics && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Reducer / Barlow factor (optional)
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        placeholder="e.g. 0.8 reducer, 2 Barlow — empty = none"
                        value={
                          Number.isNaN(form.optics_factor)
                            ? ""
                            : form.optics_factor
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          updateForm({
                            optics_factor: v === "" ? NaN : parseFloat(v),
                          });
                        }}
                      />
                      <p className="mt-1 text-[10px] text-zinc-600">
                        Empty = use focal length as entered. Not applied
                        silently.
                      </p>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-zinc-500 tabular-nums">
                    Effective FL:{" "}
                    {derived.eff != null
                      ? `${Math.round(derived.eff)} mm`
                      : "—"}{" "}
                    · {formatFRatio(derived.ratio)}
                    {derived.sampling != null
                      ? ` · ~${derived.sampling.toFixed(2)}″/px`
                      : ""}
                  </p>
                </div>

                <div>
                  <p className="dash-section-title text-zinc-500 mb-2">
                    Camera &amp; sensor
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Search camera library
                      </label>
                      <SearchableSelect
                        options={[
                          {
                            value: "",
                            label: "— enter dimensions manually —",
                          },
                          ...KNOWN_SENSORS.map((s) => ({
                            value: s.id,
                            label: s.label,
                          })),
                        ]}
                        value={form.known_sensor_id}
                        onValueChange={applyKnownSensor}
                        placeholder="Type ASI2600, A7R II, QHY600…"
                        emptyLabel="— enter dimensions manually —"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Camera model
                      </label>
                      <Input
                        type="text"
                        value={form.camera}
                        onChange={(e) =>
                          updateForm({
                            camera: e.target.value,
                            known_sensor_id: "",
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                            Number.isNaN(form.pixel_size)
                              ? ""
                              : form.pixel_size
                          }
                          onChange={(e) =>
                            updateForm({
                              pixel_size: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                          <Checkbox
                            checked={form.camera_cooled}
                            onCheckedChange={(checked) =>
                              updateForm({ camera_cooled: !!checked })
                            }
                          />
                          Cooled camera
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="dash-section-title text-zinc-500 mb-2">
                    Mount &amp; tracking
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Geometry
                      </label>
                      <Select
                        options={[
                          { value: "", label: "—" },
                          { value: "equatorial", label: "Equatorial (EQ)" },
                          { value: "alt-az", label: "Alt-Az" },
                        ]}
                        value={form.mount_type}
                        onValueChange={(value) =>
                          updateForm({ mount_type: value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Build class
                      </label>
                      <Select
                        options={[
                          { value: "stock", label: "Stock kit" },
                          {
                            value: "custom_diy",
                            label: "Custom / DIY drive",
                          },
                          {
                            value: "star_tracker",
                            label: "Star tracker",
                          },
                        ]}
                        value={form.mount_class}
                        onValueChange={(value) =>
                          updateForm({
                            mount_class: value as GearMountClass,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">
                        Tracking
                      </label>
                      <Select
                        options={[
                          {
                            value: "none",
                            label: "None (static / untracked)",
                          },
                          {
                            value: "motorized",
                            label: "Motorized (no autoguide)",
                          },
                          {
                            value: "guided",
                            label: "Autoguided",
                          },
                        ]}
                        value={form.tracking}
                        onValueChange={(value) =>
                          updateForm({ tracking: value as GearTracking })
                        }
                      />
                      <p className="mt-1 text-[10px] text-zinc-600">
                        Custom motorized stands usually use Motorized until you
                        add a guide scope / OAG.
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-500 mb-1">
                        Mount notes (optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. custom motor + stand"
                        value={form.mount_notes}
                        onChange={(e) =>
                          updateForm({ mount_notes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="dash-section-title text-zinc-500 mb-1">
                    Accessories you own
                  </p>
                  <p className="text-[10px] text-zinc-600 mb-2">
                    Optional tags for Setup reminders. Deep inventory
                    (backfocus, filter wheel map, guide-cam geometry) is
                    Advanced later — see gear-form-v2 plan.
                  </p>
                  <ul className="space-y-2">
                    {ACCESSORY_OPTIONS.map((opt) => (
                      <li key={opt.id}>
                        <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                          <Checkbox
                            className="mt-0.5"
                            checked={form.accessories.includes(opt.id)}
                            onCheckedChange={(checked) =>
                              toggleAccessory(opt.id, !!checked)
                            }
                          />
                          <span>
                            <span className="font-medium">{opt.label}</span>
                            <span className="block text-[10px] text-zinc-600">
                              {opt.hint}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
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
    </>
  );
}
