/**
 * Dashboard recommendation workflow state.
 * Mock UI state for Start Mission, Add to Plan, Build Optimal Mission.
 * Replace with real state/persistence when backend is wired.
 */
import { create } from "zustand";

export interface DashboardRecommendationState {
  /** Target IDs in mission plan (Add to Plan flow). */
  plannedTargets: string[];
  /** Target ID for "Why this was chosen" drawer. */
  selectedWhyChosenTargetId: string | null;
  /** Whether Build Optimal Mission has been run this session. */
  isOptimalMissionBuilt: boolean;
}

export interface DashboardRecommendationActions {
  addToPlan: (targetId: string) => void;
  removeFromPlan: (targetId: string) => void;
  clearPlan: () => void;
  setPlannedTargets: (ids: string[]) => void;
  setSelectedWhyChosenTargetId: (id: string | null) => void;
  setOptimalMissionBuilt: (built: boolean) => void;
  isInPlan: (targetId: string) => boolean;
  reset: () => void;
}

const initialState: DashboardRecommendationState = {
  plannedTargets: [],
  selectedWhyChosenTargetId: null,
  isOptimalMissionBuilt: false,
};

export const useDashboardRecommendationStore = create<
  DashboardRecommendationState & DashboardRecommendationActions
>((set, get) => ({
  ...initialState,

  addToPlan: (targetId) =>
    set((s) => ({
      plannedTargets: s.plannedTargets.includes(targetId)
        ? s.plannedTargets
        : [...s.plannedTargets, targetId],
    })),

  removeFromPlan: (targetId) =>
    set((s) => ({
      plannedTargets: s.plannedTargets.filter((id) => id !== targetId),
    })),

  clearPlan: () =>
    set({
      plannedTargets: [],
      isOptimalMissionBuilt: false,
    }),

  setPlannedTargets: (ids) => set({ plannedTargets: ids, isOptimalMissionBuilt: true }),

  setSelectedWhyChosenTargetId: (id) => set({ selectedWhyChosenTargetId: id }),
  setOptimalMissionBuilt: (built) => set({ isOptimalMissionBuilt: built }),

  isInPlan: (targetId) => get().plannedTargets.includes(targetId),

  reset: () => set(initialState),
}));
