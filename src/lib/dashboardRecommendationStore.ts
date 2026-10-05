/**
 * Dashboard recommendation plan (Add to Plan / Propose schedule).
 * Target IDs must match curated catalog / generateDeepSkyPlan.
 * Cleared when site, date, or constraints change.
 */
import { create } from "zustand";
import { DEFAULT_IMAGING_MINUTES } from "@/lib/schedule/types";

export type PlanEntry = {
  catalogId: string;
  desiredMinutes: number;
};

export interface DashboardRecommendationState {
  /** Ordered plan entries with imaging durations. */
  plannedEntries: PlanEntry[];
  /** Target ID for "Why this was chosen" drawer. */
  selectedWhyChosenTargetId: string | null;
  /** Whether Build Optimal Mission has been run this session. */
  isOptimalMissionBuilt: boolean;
}

export interface DashboardRecommendationActions {
  addToPlan: (targetId: string, desiredMinutes?: number) => void;
  removeFromPlan: (targetId: string) => void;
  clearPlan: () => void;
  setPlannedTargets: (ids: string[], desiredMinutes?: number) => void;
  setDesiredMinutes: (targetId: string, minutes: number) => void;
  reorderPlan: (catalogIds: string[]) => void;
  setSelectedWhyChosenTargetId: (id: string | null) => void;
  setOptimalMissionBuilt: (built: boolean) => void;
  isInPlan: (targetId: string) => boolean;
  /** Catalog ids in plan order (compat). */
  plannedTargetIds: () => string[];
  reset: () => void;
}

const initialState: DashboardRecommendationState = {
  plannedEntries: [],
  selectedWhyChosenTargetId: null,
  isOptimalMissionBuilt: false,
};

export const useDashboardRecommendationStore = create<
  DashboardRecommendationState & DashboardRecommendationActions
>((set, get) => ({
  ...initialState,

  addToPlan: (targetId, desiredMinutes = DEFAULT_IMAGING_MINUTES) =>
    set((s) => {
      if (s.plannedEntries.some((e) => e.catalogId === targetId)) return s;
      return {
        plannedEntries: [
          ...s.plannedEntries,
          {
            catalogId: targetId,
            desiredMinutes: Math.max(1, Math.round(desiredMinutes)),
          },
        ],
      };
    }),

  removeFromPlan: (targetId) =>
    set((s) => ({
      plannedEntries: s.plannedEntries.filter((e) => e.catalogId !== targetId),
    })),

  clearPlan: () =>
    set({
      plannedEntries: [],
      isOptimalMissionBuilt: false,
    }),

  setPlannedTargets: (ids, desiredMinutes = DEFAULT_IMAGING_MINUTES) =>
    set({
      plannedEntries: ids.map((catalogId) => ({
        catalogId,
        desiredMinutes: Math.max(1, Math.round(desiredMinutes)),
      })),
      isOptimalMissionBuilt: true,
    }),

  setDesiredMinutes: (targetId, minutes) =>
    set((s) => ({
      plannedEntries: s.plannedEntries.map((e) =>
        e.catalogId === targetId
          ? { ...e, desiredMinutes: Math.max(1, Math.round(minutes)) }
          : e,
      ),
    })),

  reorderPlan: (catalogIds) =>
    set((s) => {
      const byId = new Map(s.plannedEntries.map((e) => [e.catalogId, e]));
      const next: PlanEntry[] = [];
      for (const id of catalogIds) {
        const e = byId.get(id);
        if (e) next.push(e);
      }
      for (const e of s.plannedEntries) {
        if (!catalogIds.includes(e.catalogId)) next.push(e);
      }
      return { plannedEntries: next };
    }),

  setSelectedWhyChosenTargetId: (id) => set({ selectedWhyChosenTargetId: id }),
  setOptimalMissionBuilt: (built) => set({ isOptimalMissionBuilt: built }),

  isInPlan: (targetId) =>
    get().plannedEntries.some((e) => e.catalogId === targetId),

  plannedTargetIds: () => get().plannedEntries.map((e) => e.catalogId),

  reset: () => set(initialState),
}));

/** Selector helper for components that only need ids. */
export function selectPlannedTargetIds(
  s: DashboardRecommendationState,
): string[] {
  return s.plannedEntries.map((e) => e.catalogId);
}
