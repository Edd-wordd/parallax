import { create } from "zustand";
import type { Mission, MissionTarget } from "@/lib/types";

interface MissionState {
  missions: Mission[];
  activeMissionId: string | null;
  /** True after AuthProvider finished a hydrate/clear cycle for the current auth state. */
  missionsLoaded: boolean;
  setMissions: (missions: Mission[]) => void;
  setMissionsLoaded: (loaded: boolean) => void;
  clearMissions: () => void;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  /** Replace a mission in-place; supports remapping id (mock → UUID). */
  replaceMission: (oldId: string, next: Mission) => void;
  deleteMission: (id: string) => void;
  duplicateMission: (id: string) => Mission | null;
  setActiveMission: (id: string | null) => void;
  getMission: (id: string) => Mission | undefined;
}

function generateId(): string {
  return crypto.randomUUID();
}

/** In-memory cache only — Supabase is SoT for Setup+ missions (Phase D.1). */
export const useMissionStore = create<MissionState>()((set, get) => ({
  missions: [],
  activeMissionId: null,
  missionsLoaded: false,
  setMissions: (missions) => set({ missions }),
  setMissionsLoaded: (loaded) => set({ missionsLoaded: loaded }),
  clearMissions: () => {
    try {
      localStorage.removeItem("astro-ops-missions");
    } catch {
      /* ignore */
    }
    set({ missions: [], activeMissionId: null, missionsLoaded: false });
  },
  addMission: (mission) =>
    set((s) => ({ missions: [...s.missions, mission] })),
  updateMission: (id, updates) =>
    set((s) => ({
      missions: s.missions.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
  replaceMission: (oldId, next) =>
    set((s) => ({
      missions: s.missions.map((m) => (m.id === oldId ? next : m)),
      activeMissionId:
        s.activeMissionId === oldId ? next.id : s.activeMissionId,
    })),
  deleteMission: (id) =>
    set((s) => ({
      missions: s.missions.filter((m) => m.id !== id),
      activeMissionId: s.activeMissionId === id ? null : s.activeMissionId,
    })),
  duplicateMission: (id) => {
    const m = get().missions.find((x) => x.id === id);
    if (!m) return null;
    const dup: Mission = {
      ...m,
      id: generateId(),
      name: m.name + " (Copy)",
      status: "draft",
      phase: "planning",
      targets: m.targets.map(
        (t: MissionTarget) =>
          ({ ...t, captured: false, result: undefined }) as MissionTarget,
      ),
      noteLog: [],
      logLocked: false,
      cancelledReason: undefined,
      createdAt: new Date().toISOString(),
    };
    get().addMission(dup);
    return dup;
  },
  setActiveMission: (id) => set({ activeMissionId: id }),
  getMission: (id) => get().missions.find((m) => m.id === id),
}));
