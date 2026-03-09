import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mission, MissionTarget } from "@/lib/types";

interface MissionState {
  missions: Mission[];
  activeMissionId: string | null;
  setMissions: (missions: Mission[]) => void;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  duplicateMission: (id: string) => Mission | null;
  setActiveMission: (id: string | null) => void;
  getMission: (id: string) => Mission | undefined;
}

function generateId(): string {
  return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      missions: [],
      activeMissionId: null,
      setMissions: (missions) => set({ missions }),
      addMission: (mission) =>
        set((s) => ({ missions: [...s.missions, mission] })),
      updateMission: (id, updates) =>
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
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
          targets: m.targets.map((t) => ({ ...t, captured: false, result: undefined })),
          noteLog: [],
          createdAt: new Date().toISOString(),
        };
        get().addMission(dup);
        return dup;
      },
      setActiveMission: (id) => set({ activeMissionId: id }),
      getMission: (id) => get().missions.find((m) => m.id === id),
    }),
    { name: "astro-ops-missions" }
  )
);
