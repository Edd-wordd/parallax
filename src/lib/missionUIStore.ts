/**
 * Mission Dashboard UI state store.
 *
 * State shape and how to extend later with real persistence/sync:
 * - activePhase, sidebarMode, selectedTargetId: persist to URL query params or sessionStorage
 * - connectivity: replace mock with real network status + IndexedDB/service worker for offline
 * - planStale: derive from last plan timestamp vs conditions/software change
 * - conditions: persist to user prefs; sync to backend for plan recalculation
 * - software: persist to rig profile; sync to backend
 * - fieldModeOptions: persist to user prefs
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { forecastSeed } from "@/lib/mockForecast";

export type ActivePhase = "planning" | "setup" | "capturing" | "logging";
export type SidebarMode = "target" | "recipe" | "guidance" | "setup" | "log";

export type SoftwareName =
  | "Ekos (Astroberry)"
  | "NINA"
  | "ASIAIR"
  | "APT"
  | "Siril only"
  | "Other";

export interface SoftwareCaps {
  plateSolve: boolean;
  autoFocus: boolean;
  guiding: boolean;
  dithering: boolean;
}

export interface SoftwareState {
  name: SoftwareName;
  otherName?: string;
  caps: SoftwareCaps;
}

export type WindLevel = "low" | "med" | "high";

export interface ConditionsState {
  seeing: number;
  transparency: number;
  wind: WindLevel;
  clouds: number;
  moonGlare: boolean;
}

export interface FieldModeOptions {
  redSafe: boolean;
  dimLevel: number;
  reduceMotion: boolean;
}

export type ConnectivityStatus = "online" | "offline";

export interface ConnectivityState {
  status: ConnectivityStatus;
  isCached: boolean;
  pendingOps: number;
  lastSyncLabel: string;
}

export interface MissionUIState {
  activePhase: ActivePhase;
  sidebarMode: SidebarMode;
  isSidebarOpen: boolean;
  selectedTargetId: string | null;
  isFieldMode: boolean;
  fieldModeOptions: FieldModeOptions;
  connectivity: ConnectivityState;
  planStale: boolean;
  conditions: ConditionsState;
  software: SoftwareState;
}

const SOFTWARE_DEFAULTS: Record<SoftwareName, SoftwareCaps> = {
  "Ekos (Astroberry)": {
    plateSolve: true,
    autoFocus: true,
    guiding: true,
    dithering: true,
  },
  NINA: { plateSolve: true, autoFocus: true, guiding: true, dithering: true },
  ASIAIR: { plateSolve: true, autoFocus: true, guiding: true, dithering: true },
  APT: { plateSolve: true, autoFocus: false, guiding: true, dithering: true },
  "Siril only": {
    plateSolve: false,
    autoFocus: false,
    guiding: false,
    dithering: false,
  },
  Other: { plateSolve: true, autoFocus: true, guiding: true, dithering: true },
};

const initialState: MissionUIState = {
  activePhase: "planning",
  sidebarMode: "target",
  isSidebarOpen: false,
  selectedTargetId: null,
  isFieldMode: false,
  fieldModeOptions: { redSafe: false, dimLevel: 0, reduceMotion: false },
  connectivity: {
    status: "online",
    isCached: true,
    pendingOps: 0,
    lastSyncLabel: "2 min ago",
  },
  planStale: false,
  conditions: {
    seeing: forecastSeed.seeing,
    transparency: forecastSeed.transparency,
    wind: forecastSeed.wind,
    clouds: forecastSeed.clouds,
    moonGlare: forecastSeed.moonGlare,
  },
  software: {
    name: "NINA",
    caps: SOFTWARE_DEFAULTS.NINA,
  },
};

type Action =
  | { type: "SET_ACTIVE_PHASE"; payload: ActivePhase }
  | { type: "SET_SIDEBAR_MODE"; payload: SidebarMode }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "SET_SELECTED_TARGET"; payload: string | null }
  | { type: "TOGGLE_FIELD_MODE" }
  | { type: "SET_FIELD_MODE_OPTIONS"; payload: Partial<FieldModeOptions> }
  | { type: "SET_CONNECTIVITY"; payload: Partial<ConnectivityState> }
  | { type: "SET_PLAN_STALE"; payload: boolean }
  | { type: "SET_CONDITIONS"; payload: Partial<ConditionsState> }
  | { type: "RESET_CONDITIONS" }
  | { type: "SET_SOFTWARE"; payload: Partial<SoftwareState> }
  | { type: "RECALCULATE" }
  | {
      type: "PHASE_CLICK";
      payload: { phase: ActivePhase; firstTargetId?: string };
    }
  | { type: "SIDEBAR_TAB_CLICK"; payload: SidebarMode };

function reducer(state: MissionUIState, action: Action): MissionUIState {
  switch (action.type) {
    case "SET_ACTIVE_PHASE":
      return { ...state, activePhase: action.payload };
    case "SET_SIDEBAR_MODE":
      return { ...state, sidebarMode: action.payload };
    case "SET_SIDEBAR_OPEN":
      return { ...state, isSidebarOpen: action.payload };
    case "SET_SELECTED_TARGET":
      return { ...state, selectedTargetId: action.payload };
    case "TOGGLE_FIELD_MODE":
      return { ...state, isFieldMode: !state.isFieldMode };
    case "SET_FIELD_MODE_OPTIONS":
      return {
        ...state,
        fieldModeOptions: { ...state.fieldModeOptions, ...action.payload },
      };
    case "SET_CONNECTIVITY":
      return {
        ...state,
        connectivity: { ...state.connectivity, ...action.payload },
      };
    case "SET_PLAN_STALE":
      return { ...state, planStale: action.payload };
    case "SET_CONDITIONS":
      return {
        ...state,
        conditions: { ...state.conditions, ...action.payload },
        planStale: true,
      };
    case "RESET_CONDITIONS":
      return {
        ...state,
        conditions: {
          seeing: forecastSeed.seeing,
          transparency: forecastSeed.transparency,
          wind: forecastSeed.wind,
          clouds: forecastSeed.clouds,
          moonGlare: forecastSeed.moonGlare,
        },
        planStale: false,
      };
    case "SET_SOFTWARE": {
      const next = { ...state.software, ...action.payload };
      if (action.payload.name && action.payload.name !== "Other") {
        next.caps = SOFTWARE_DEFAULTS[action.payload.name];
      }
      return { ...state, software: next };
    }
    case "RECALCULATE":
      return { ...state, planStale: false };
    case "PHASE_CLICK": {
      const { phase, firstTargetId } = action.payload;
      let next = { ...state, activePhase: phase };
      if (phase === "setup") {
        next = { ...next, sidebarMode: "setup", isSidebarOpen: true };
      } else if (phase === "capturing") {
        next = {
          ...next,
          sidebarMode: "target",
          isSidebarOpen: true,
          selectedTargetId: firstTargetId ?? state.selectedTargetId ?? null,
        };
      } else if (phase === "logging") {
        next = { ...next, sidebarMode: "log", isSidebarOpen: true };
      }
      return next;
    }
    case "SIDEBAR_TAB_CLICK":
      return { ...state, sidebarMode: action.payload, isSidebarOpen: true };
    default:
      return state;
  }
}

interface MissionUIContextValue {
  state: MissionUIState;
  dispatch: React.Dispatch<Action>;
  setActivePhase: (p: ActivePhase) => void;
  setSidebarMode: (m: SidebarMode) => void;
  setSidebarOpen: (o: boolean) => void;
  setSelectedTarget: (id: string | null) => void;
  toggleFieldMode: () => void;
  setFieldModeOptions: (o: Partial<FieldModeOptions>) => void;
  setConditions: (c: Partial<ConditionsState>) => void;
  resetConditions: () => void;
  setSoftware: (s: Partial<SoftwareState>) => void;
  recalculate: () => void;
  phaseClick: (phase: ActivePhase, firstTargetId?: string) => void;
  sidebarTabClick: (mode: SidebarMode) => void;
}

const MissionUIContext = createContext<MissionUIContextValue | null>(null);

export function MissionUIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const setActivePhase = useCallback(
    (p: ActivePhase) => dispatch({ type: "SET_ACTIVE_PHASE", payload: p }),
    [],
  );
  const setSidebarMode = useCallback(
    (m: SidebarMode) => dispatch({ type: "SET_SIDEBAR_MODE", payload: m }),
    [],
  );
  const setSidebarOpen = useCallback(
    (o: boolean) => dispatch({ type: "SET_SIDEBAR_OPEN", payload: o }),
    [],
  );
  const setSelectedTarget = useCallback(
    (id: string | null) =>
      dispatch({ type: "SET_SELECTED_TARGET", payload: id }),
    [],
  );
  const toggleFieldMode = useCallback(
    () => dispatch({ type: "TOGGLE_FIELD_MODE" }),
    [],
  );
  const setFieldModeOptions = useCallback(
    (o: Partial<FieldModeOptions>) =>
      dispatch({ type: "SET_FIELD_MODE_OPTIONS", payload: o }),
    [],
  );
  const setConditions = useCallback(
    (c: Partial<ConditionsState>) =>
      dispatch({ type: "SET_CONDITIONS", payload: c }),
    [],
  );
  const resetConditions = useCallback(
    () => dispatch({ type: "RESET_CONDITIONS" }),
    [],
  );
  const setSoftware = useCallback(
    (s: Partial<SoftwareState>) =>
      dispatch({ type: "SET_SOFTWARE", payload: s }),
    [],
  );
  const recalculate = useCallback(() => dispatch({ type: "RECALCULATE" }), []);
  const phaseClick = useCallback(
    (phase: ActivePhase, firstTargetId?: string) =>
      dispatch({ type: "PHASE_CLICK", payload: { phase, firstTargetId } }),
    [],
  );
  const sidebarTabClick = useCallback(
    (mode: SidebarMode) =>
      dispatch({ type: "SIDEBAR_TAB_CLICK", payload: mode }),
    [],
  );

  const value: MissionUIContextValue = {
    state,
    dispatch,
    setActivePhase,
    setSidebarMode,
    setSidebarOpen,
    setSelectedTarget,
    toggleFieldMode,
    setFieldModeOptions,
    setConditions,
    resetConditions,
    setSoftware,
    recalculate,
    phaseClick,
    sidebarTabClick,
  };

  return React.createElement(MissionUIContext.Provider, { value }, children);
}

export function useMissionUI() {
  const ctx = useContext(MissionUIContext);
  if (!ctx)
    throw new Error("useMissionUI must be used within MissionUIProvider");
  return ctx;
}
