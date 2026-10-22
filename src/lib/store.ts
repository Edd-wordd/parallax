import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Units } from "@/lib/schemas/userPreferences";

export const DEFAULT_MIN_ALTITUDE = 30;
export const DEFAULT_MOON_TOLERANCE = 15;
export const DEFAULT_UNITS: Units = "metric";

interface AppState {
  activeLocationId: string;
  activeGearId: string;
  dateTime: string;
  minAltitude: number;
  moonTolerance: number;
  units: Units;
  targetTypes: string[];
  driveToDarker: boolean;
  driveRadius: number;
  /** Global Field Mode (night vision) — applies theme to entire app */
  isFieldMode: boolean;
  fieldModeOptions: { redSafe: boolean; dimLevel: number; reduceMotion: boolean };
  setActiveLocation: (id: string) => void;
  setActiveGear: (id: string) => void;
  setDateTime: (iso: string) => void;
  setMinAltitude: (v: number) => void;
  setMoonTolerance: (v: number) => void;
  setUnits: (v: Units) => void;
  applyUserPreferences: (prefs: {
    minAltitude: number;
    moonTolerance: number;
    units: Units;
  }) => void;
  resetUserPreferences: () => void;
  setTargetTypes: (types: string[]) => void;
  setDriveToDarker: (v: boolean) => void;
  setDriveRadius: (v: number) => void;
  setFieldMode: (v: boolean) => void;
  toggleFieldMode: () => void;
  setFieldModeOptions: (o: Partial<{ redSafe: boolean; dimLevel: number; reduceMotion: boolean }>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      /** Set to real UUIDs by AuthProvider after bootstrap */
      activeLocationId: "",
      activeGearId: "",
      dateTime: new Date().toISOString(),
      minAltitude: DEFAULT_MIN_ALTITUDE,
      moonTolerance: DEFAULT_MOON_TOLERANCE,
      units: DEFAULT_UNITS,
      targetTypes: ["galaxy", "nebula", "open_cluster", "globular_cluster"],
      driveToDarker: false,
      driveRadius: 50,
      isFieldMode: false,
      fieldModeOptions: { redSafe: false, dimLevel: 0, reduceMotion: false },
      setActiveLocation: (id) => set({ activeLocationId: id }),
      setActiveGear: (id) => set({ activeGearId: id }),
      setDateTime: (iso) => set({ dateTime: iso }),
      setMinAltitude: (v) => set({ minAltitude: v }),
      setMoonTolerance: (v) => set({ moonTolerance: v }),
      setUnits: (v) => set({ units: v }),
      applyUserPreferences: (prefs) =>
        set({
          minAltitude: prefs.minAltitude,
          moonTolerance: prefs.moonTolerance,
          units: prefs.units,
        }),
      resetUserPreferences: () =>
        set({
          minAltitude: DEFAULT_MIN_ALTITUDE,
          moonTolerance: DEFAULT_MOON_TOLERANCE,
          units: DEFAULT_UNITS,
        }),
      setTargetTypes: (types) => set({ targetTypes: types }),
      setDriveToDarker: (v) => set({ driveToDarker: v }),
      setDriveRadius: (v) => set({ driveRadius: v }),
      setFieldMode: (v) => set({ isFieldMode: v }),
      toggleFieldMode: () => set((s) => ({ isFieldMode: !s.isFieldMode })),
      setFieldModeOptions: (o) =>
        set((s) => ({ fieldModeOptions: { ...s.fieldModeOptions, ...o } })),
    }),
    {
      name: "astro-ops-state",
      // Prefs are hydrated from user_preferences on auth — do not let
      // localStorage overwrite durable DB values after bootstrap.
      partialize: (state) => ({
        activeLocationId: state.activeLocationId,
        activeGearId: state.activeGearId,
        dateTime: state.dateTime,
        targetTypes: state.targetTypes,
        driveToDarker: state.driveToDarker,
        driveRadius: state.driveRadius,
        isFieldMode: state.isFieldMode,
        fieldModeOptions: state.fieldModeOptions,
      }),
    },
  )
);
