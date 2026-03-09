import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  activeLocationId: string;
  activeGearId: string;
  dateTime: string;
  minAltitude: number;
  moonTolerance: number;
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
      activeLocationId: "loc1",
      activeGearId: "gear1",
      dateTime: new Date().toISOString(),
      minAltitude: 30,
      moonTolerance: 15,
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
      setTargetTypes: (types) => set({ targetTypes: types }),
      setDriveToDarker: (v) => set({ driveToDarker: v }),
      setDriveRadius: (v) => set({ driveRadius: v }),
      fieldModeOptions: { redSafe: false, dimLevel: 0, reduceMotion: false },
      setFieldMode: (v) => set({ isFieldMode: v }),
      toggleFieldMode: () => set((s) => ({ isFieldMode: !s.isFieldMode })),
      setFieldModeOptions: (o) =>
        set((s) => ({ fieldModeOptions: { ...s.fieldModeOptions, ...o } })),
    }),
    { name: "astro-ops-state" }
  )
);
