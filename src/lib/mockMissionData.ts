/**
 * Mock mission, rig, and setup data for Setup phase sidebar.
 * TODO: Replace with backend API when wiring.
 */

import type { Mission } from "@/lib/types";

export type PreflightStatus = "unknown" | "ok" | "warn" | "bad";

export type SoftwareProfile = "nina" | "asiair" | "ekos" | "sharpcap" | "other";

export interface RigProfile {
  id: string;
  name: string;
  softwareProfileId: SoftwareProfile;
}

export interface SetupLogField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
}

export interface SetupStep {
  id: string;
  title: string;
  critical?: boolean;
  logFields?: SetupLogField[];
}

export interface SetupSection {
  id: string;
  title: string;
  steps: SetupStep[];
}

export interface MissionSetupLog {
  [stepId: string]: Record<string, string | number>;
}

export interface HowToStep {
  goal: string;
  doThis: string;
  commonFail: string;
  successLooksLike: string;
  logIt?: SetupLogField[];
}

/** How-to content per software profile per section.step */
export const HOW_TO_CONTENT: Record<
  SoftwareProfile,
  Record<string, Record<string, HowToStep>>
> = {
  nina: {
    "power-connections": {
      "power-on": {
        goal: "Power on all equipment safely.",
        doThis: "Turn on power box, mount, camera, guide scope. Wait for devices to initialize.",
        commonFail: "Forgot to plug in USB hub or powered hub loses connection mid-session.",
        successLooksLike: "All devices show green in NINA Equipment tab.",
        logIt: [{ key: "notes", label: "Notes", placeholder: "Any issues?" }],
      },
      cables: {
        goal: "Verify all cables are secure.",
        doThis: "Check USB, power, and dew heater connections. Use cable management to avoid snags.",
        commonFail: "Loose USB causes disconnects during imaging.",
        successLooksLike: "Cables neat, no strain on connectors.",
      },
      "dew-heater": {
        goal: "Set dew heater to prevent fogging.",
        doThis: "In NINA Sequence tab, enable Dew Heater and set to ~60%.",
        commonFail: "Dew heater too high drains battery; too low causes fog.",
        successLooksLike: "Lens stays clear all night.",
        logIt: [{ key: "percent", label: "Dew %", type: "number", placeholder: "60" }],
      },
    },
    "mount-alignment": {
      "polar-align": {
        goal: "Align mount to celestial pole.",
        doThis: "Use NINA Three-Point Polar Alignment or NPP. Iterate until error < 1 arcmin.",
        commonFail: "Rushing alignment causes drift. Check bubble level first.",
        successLooksLike: "NINA reports polar error < 1'.",
        logIt: [{ key: "arcmin", label: "Polar error (')", type: "number" }],
      },
      level: {
        goal: "Level the mount.",
        doThis: "Use bubble level on mount base. Adjust tripod legs.",
        commonFail: "Unlevel mount affects goto accuracy.",
        successLooksLike: "Bubble centered.",
      },
      balance: {
        goal: "Balance RA and Dec axes.",
        doThis: "Loosen clutches, balance each axis. Re-tighten.",
        commonFail: "Poor balance causes backlash and drift.",
        successLooksLike: "Scope stays put when clutches released.",
      },
    },
    focus: {
      "focus-routine": {
        goal: "Achieve sharp focus.",
        doThis: "Run NINA Bahtinov focusing (or HFR). Use filter if needed. Re-focus after filter change.",
        commonFail: "Focus drift due to temp; not re-focusing after filter change.",
        successLooksLike: "HFR stable and minimal. Bahtinov spikes crisp.",
        logIt: [{ key: "hfr", label: "HFR (px)", type: "number" }],
      },
    },
    guiding: {
      calibrate: {
        goal: "Calibrate guiding.",
        doThis: "In Guiding tab, run Calibration. Ensure enough movement for good correction.",
        commonFail: "Calibration in poor seeing; star too faint.",
        successLooksLike: "Calibration completes with low error.",
      },
      enable: {
        goal: "Enable guiding.",
        doThis: "Start Guiding. Watch RMS. Adjust aggression if needed.",
        commonFail: "Over-aggressive guiding causes oscillation.",
        successLooksLike: "RMS < 1\" for good conditions.",
        logIt: [{ key: "rms", label: "RMS (arcsec)", type: "number" }],
      },
    },
    "test-frame": {
      "plate-solve": {
        goal: "Verify plate solving works.",
        doThis: "Take a short exposure, run Plate Solve. Sync mount if needed.",
        commonFail: "No stars in frame; exposure too short; wrong catalog.",
        successLooksLike: "Solve in < 5 sec. Coordinates match.",
        logIt: [{ key: "solve_time", label: "Solve time (s)", type: "number" }],
      },
      "test-exposure": {
        goal: "Take and inspect a test exposure.",
        doThis: "Take 60s sub at planned settings. Check focus, framing, trailing.",
        commonFail: "Trailing from poor polar align or balance.",
        successLooksLike: "Round stars, good framing, no gradients from stray light.",
        logIt: [
          { key: "exposure", label: "Exposure (s)", type: "number" },
          { key: "iso", label: "ISO", type: "number" },
        ],
      },
    },
    "final-go": {
      review: {
        goal: "Review checklist.",
        doThis: "Confirm all steps above. Double-check target list and sequence.",
        commonFail: "Starting sequence with wrong target or settings.",
        successLooksLike: "Ready to capture.",
      },
      "go-nogo": {
        goal: "Final go/no-go.",
        doThis: "Confirm conditions are good. Start first target sequence.",
        commonFail: "Clouds rolling in; continuing anyway.",
        successLooksLike: "Mission started.",
      },
    },
  },
  asiair: {
    "power-connections": {
      "power-on": {
        goal: "Power on ASIAIR and devices.",
        doThis: "Turn on ASIAIR, mount, camera. Connect via app.",
        commonFail: "Wi-Fi dropout; keep phone/tablet close.",
        successLooksLike: "ASIAIR shows all devices connected.",
        logIt: [{ key: "notes", label: "Notes", placeholder: "Any issues?" }],
      },
      cables: {
        goal: "Verify connections.",
        doThis: "Check USB-C, power, dew heater. ASIAIR powers camera.",
        commonFail: "Loose USB to camera.",
        successLooksLike: "Cables secure.",
      },
      "dew-heater": {
        goal: "Set dew heater.",
        doThis: "In Equipment, set Dew Heater %.",
        commonFail: "Dew heater drains battery.",
        successLooksLike: "Lens clear.",
        logIt: [{ key: "percent", label: "Dew %", type: "number" }],
      },
    },
    "mount-alignment": {
      "polar-align": {
        goal: "Polar align with ASIAIR.",
        doThis: "Use ASIAIR Polar Alignment. Iterate until < 1' error.",
        commonFail: "Rushing; check level first.",
        successLooksLike: "Polar error < 1'.",
        logIt: [{ key: "arcmin", label: "Polar error (')", type: "number" }],
      },
      level: {
        goal: "Level the mount.",
        doThis: "Bubble level on mount base.",
        commonFail: "Unlevel affects goto.",
        successLooksLike: "Bubble centered.",
      },
      balance: {
        goal: "Balance RA and Dec.",
        doThis: "Loosen clutches, balance, re-tighten.",
        commonFail: "Poor balance.",
        successLooksLike: "Scope stays put.",
      },
    },
    focus: {
      "focus-routine": {
        goal: "Focus with ASIAIR.",
        doThis: "Use Auto Focus or Bahtinov in ASIAIR. Re-focus after filter change.",
        commonFail: "Temp drift; no re-focus.",
        successLooksLike: "Sharp stars.",
        logIt: [{ key: "hfr", label: "HFR (px)", type: "number" }],
      },
    },
    guiding: {
      calibrate: {
        goal: "Calibrate guiding.",
        doThis: "Run Calibration in Guiding. Ensure good movement.",
        commonFail: "Poor seeing.",
        successLooksLike: "Calibration OK.",
      },
      enable: {
        goal: "Enable guiding.",
        doThis: "Start Guiding. Watch RMS.",
        commonFail: "Over-aggressive.",
        successLooksLike: "RMS < 1\".",
        logIt: [{ key: "rms", label: "RMS (arcsec)", type: "number" }],
      },
    },
    "test-frame": {
      "plate-solve": {
        goal: "Plate solve.",
        doThis: "Take exposure, solve. Sync if needed.",
        commonFail: "Wrong catalog or no stars.",
        successLooksLike: "Solve < 5 sec.",
        logIt: [{ key: "solve_time", label: "Solve time (s)", type: "number" }],
      },
      "test-exposure": {
        goal: "Test exposure.",
        doThis: "60s sub at planned settings. Check focus, framing.",
        commonFail: "Trailing.",
        successLooksLike: "Round stars, good frame.",
        logIt: [
          { key: "exposure", label: "Exposure (s)", type: "number" },
          { key: "iso", label: "ISO", type: "number" },
        ],
      },
    },
    "final-go": {
      review: {
        goal: "Review checklist.",
        doThis: "Confirm all steps. Check sequence.",
        commonFail: "Wrong target.",
        successLooksLike: "Ready.",
      },
      "go-nogo": {
        goal: "Go/no-go.",
        doThis: "Confirm conditions. Start sequence.",
        commonFail: "Clouds.",
        successLooksLike: "Started.",
      },
    },
  },
  ekos: {
    "power-connections": {
      "power-on": {
        goal: "Power on KStars/Ekos devices.",
        doThis: "Start Ekos, connect mount, camera, guide. Use Ekos Device Manager.",
        commonFail: "INDI server not running.",
        successLooksLike: "All devices green in Ekos.",
        logIt: [{ key: "notes", label: "Notes" }],
      },
      cables: {
        goal: "Verify cables.",
        doThis: "Check USB, power. Ekos uses INDI.",
        commonFail: "USB disconnects.",
        successLooksLike: "Stable connections.",
      },
      "dew-heater": {
        goal: "Dew heater.",
        doThis: "In Aux tab, set dew heater.",
        commonFail: "Dew heater not configured.",
        successLooksLike: "Lens clear.",
        logIt: [{ key: "percent", label: "Dew %", type: "number" }],
      },
    },
    "mount-alignment": {
      "polar-align": {
        goal: "Polar align.",
        doThis: "Use Polar Alignment tool. Iterate.",
        commonFail: "Rushing alignment.",
        successLooksLike: "Error < 1'.",
        logIt: [{ key: "arcmin", label: "Polar error (')", type: "number" }],
      },
      level: { goal: "Level.", doThis: "Bubble level.", commonFail: "Unlevel.", successLooksLike: "Centered." },
      balance: { goal: "Balance.", doThis: "Balance axes.", commonFail: "Poor balance.", successLooksLike: "Stays put." },
    },
    focus: {
      "focus-routine": {
        goal: "Focus.",
        doThis: "Run Focus module. Bahtinov or HFR.",
        commonFail: "Temp drift.",
        successLooksLike: "Sharp.",
        logIt: [{ key: "hfr", label: "HFR (px)", type: "number" }],
      },
    },
    guiding: {
      calibrate: { goal: "Calibrate.", doThis: "Run calibration.", commonFail: "Poor seeing.", successLooksLike: "OK." },
      enable: {
        goal: "Enable guiding.",
        doThis: "Start guiding.",
        commonFail: "Oscillation.",
        successLooksLike: "RMS < 1\".",
        logIt: [{ key: "rms", label: "RMS (arcsec)", type: "number" }],
      },
    },
    "test-frame": {
      "plate-solve": {
        goal: "Plate solve.",
        doThis: "Align module, solve.",
        commonFail: "No stars.",
        successLooksLike: "Solved.",
        logIt: [{ key: "solve_time", label: "Solve time (s)", type: "number" }],
      },
      "test-exposure": {
        goal: "Test frame.",
        doThis: "Capture, inspect.",
        commonFail: "Trailing.",
        successLooksLike: "Round stars.",
        logIt: [
          { key: "exposure", label: "Exposure (s)", type: "number" },
          { key: "iso", label: "ISO", type: "number" },
        ],
      },
    },
    "final-go": {
      review: { goal: "Review.", doThis: "Confirm steps.", commonFail: "Skipped.", successLooksLike: "Ready." },
      "go-nogo": { goal: "Go/no-go.", doThis: "Start.", commonFail: "Bad conditions.", successLooksLike: "Started." },
    },
  },
  sharpcap: {
    "power-connections": {
      "power-on": {
        goal: "Power on.",
        doThis: "Start SharpCap. Connect devices.",
        commonFail: "Driver issues.",
        successLooksLike: "Devices connected.",
        logIt: [{ key: "notes", label: "Notes" }],
      },
      cables: {
        goal: "Cables.",
        doThis: "Check connections.",
        commonFail: "USB.",
        successLooksLike: "Secure.",
      },
      "dew-heater": {
        goal: "Dew heater.",
        doThis: "If supported, set in equipment.",
        commonFail: "N/A for some setups.",
        successLooksLike: "Clear.",
        logIt: [{ key: "percent", label: "Dew %", type: "number" }],
      },
    },
    "mount-alignment": {
      "polar-align": {
        goal: "Polar align.",
        doThis: "Use SharpCap polar align or external tool.",
        commonFail: "Rushing.",
        successLooksLike: "< 1'.",
        logIt: [{ key: "arcmin", label: "Polar error (')", type: "number" }],
      },
      level: { goal: "Level.", doThis: "Bubble.", commonFail: "Unlevel.", successLooksLike: "OK." },
      balance: { goal: "Balance.", doThis: "Balance.", commonFail: "Poor.", successLooksLike: "OK." },
    },
    focus: {
      "focus-routine": {
        goal: "Focus.",
        doThis: "Bahtinov or live focus.",
        commonFail: "Drift.",
        successLooksLike: "Sharp.",
        logIt: [{ key: "hfr", label: "HFR", type: "number" }],
      },
    },
    guiding: {
      calibrate: { goal: "Calibrate.", doThis: "PHD2 or built-in.", commonFail: "Seeing.", successLooksLike: "OK." },
      enable: {
        goal: "Guiding.",
        doThis: "Start PHD2/SharpCap guiding.",
        commonFail: "Oscillation.",
        successLooksLike: "RMS good.",
        logIt: [{ key: "rms", label: "RMS", type: "number" }],
      },
    },
    "test-frame": {
      "plate-solve": {
        goal: "Solve.",
        doThis: "Capture, solve if available.",
        commonFail: "Catalog.",
        successLooksLike: "Solved.",
        logIt: [{ key: "solve_time", label: "Solve (s)", type: "number" }],
      },
      "test-exposure": {
        goal: "Test.",
        doThis: "Capture, inspect.",
        commonFail: "Trailing.",
        successLooksLike: "Round stars.",
        logIt: [
          { key: "exposure", label: "Exposure (s)", type: "number" },
          { key: "iso", label: "ISO", type: "number" },
        ],
      },
    },
    "final-go": {
      review: { goal: "Review.", doThis: "Confirm.", commonFail: "Skip.", successLooksLike: "Ready." },
      "go-nogo": { goal: "Go.", doThis: "Start.", commonFail: "Clouds.", successLooksLike: "Started." },
    },
  },
  other: {
    "power-connections": {
      "power-on": {
        goal: "Power on all equipment.",
        doThis: "Power box, mount, camera, guide scope. Wait for init.",
        commonFail: "Forgot device or loose cable.",
        successLooksLike: "All devices ready.",
        logIt: [{ key: "notes", label: "Notes" }],
      },
      cables: {
        goal: "Verify cables.",
        doThis: "Check USB, power, dew. Secure connections.",
        commonFail: "Loose USB.",
        successLooksLike: "Neat, no strain.",
      },
      "dew-heater": {
        goal: "Dew heater.",
        doThis: "Set dew heater to prevent fogging.",
        commonFail: "Too high or too low.",
        successLooksLike: "Lens clear.",
        logIt: [{ key: "percent", label: "Dew %", type: "number" }],
      },
    },
    "mount-alignment": {
      "polar-align": {
        goal: "Polar align.",
        doThis: "Use your polar alignment method. Iterate until < 1' error.",
        commonFail: "Rushing.",
        successLooksLike: "Polar error < 1'.",
        logIt: [{ key: "arcmin", label: "Polar error (')", type: "number" }],
      },
      level: {
        goal: "Level mount.",
        doThis: "Bubble level on base.",
        commonFail: "Unlevel.",
        successLooksLike: "Centered.",
      },
      balance: {
        goal: "Balance.",
        doThis: "Balance RA and Dec.",
        commonFail: "Poor balance.",
        successLooksLike: "Stays put.",
      },
    },
    focus: {
      "focus-routine": {
        goal: "Focus.",
        doThis: "Run focus routine. Re-focus after filter change.",
        commonFail: "Temp drift.",
        successLooksLike: "Sharp stars.",
        logIt: [{ key: "hfr", label: "HFR (px)", type: "number" }],
      },
    },
    guiding: {
      calibrate: {
        goal: "Calibrate guiding.",
        doThis: "Run calibration.",
        commonFail: "Poor seeing.",
        successLooksLike: "Calibration OK.",
      },
      enable: {
        goal: "Enable guiding.",
        doThis: "Start guiding.",
        commonFail: "Over-aggressive.",
        successLooksLike: "RMS acceptable.",
        logIt: [{ key: "rms", label: "RMS (arcsec)", type: "number" }],
      },
    },
    "test-frame": {
      "plate-solve": {
        goal: "Plate solve.",
        doThis: "Take exposure, solve.",
        commonFail: "No stars or wrong catalog.",
        successLooksLike: "Solved.",
        logIt: [{ key: "solve_time", label: "Solve time (s)", type: "number" }],
      },
      "test-exposure": {
        goal: "Test exposure.",
        doThis: "Take test sub at planned settings.",
        commonFail: "Trailing.",
        successLooksLike: "Round stars, good framing.",
        logIt: [
          { key: "exposure", label: "Exposure (s)", type: "number" },
          { key: "iso", label: "ISO", type: "number" },
        ],
      },
    },
    "final-go": {
      review: {
        goal: "Review checklist.",
        doThis: "Confirm all steps.",
        commonFail: "Skipped steps.",
        successLooksLike: "Ready.",
      },
      "go-nogo": {
        goal: "Go/no-go.",
        doThis: "Confirm conditions. Start.",
        commonFail: "Bad conditions.",
        successLooksLike: "Started.",
      },
    },
  },
};

export const SOFTWARE_PROFILES: { id: SoftwareProfile; label: string }[] = [
  { id: "nina", label: "NINA" },
  { id: "asiair", label: "ASIAIR" },
  { id: "ekos", label: "Ekos" },
  { id: "sharpcap", label: "SharpCap" },
  { id: "other", label: "Other" },
];

export const setupSections: SetupSection[] = [
  {
    id: "power-connections",
    title: "Power & Connections",
    steps: [
      { id: "power-on", title: "Power on equipment", logFields: [{ key: "notes", label: "Log value", placeholder: "Any issues?" }] },
      { id: "cables", title: "Verify cables & connections" },
      { id: "dew-heater", title: "Dew heater on", logFields: [{ key: "percent", label: "Dew %", type: "number", placeholder: "60" }] },
    ],
  },
  {
    id: "mount-alignment",
    title: "Mount & Alignment",
    steps: [
      { id: "polar-align", title: "Polar alignment", critical: true, logFields: [{ key: "arcmin", label: "Polar error (')", type: "number" }] },
      { id: "level", title: "Level mount" },
      { id: "balance", title: "Balance RA & Dec" },
    ],
  },
  {
    id: "focus",
    title: "Focus",
    steps: [
      { id: "focus-routine", title: "Focus routine complete", critical: true, logFields: [{ key: "hfr", label: "HFR (px)", type: "number" }] },
    ],
  },
  {
    id: "guiding",
    title: "Guiding",
    steps: [
      { id: "calibrate", title: "Calibrate guiding" },
      { id: "enable", title: "Enable guiding", logFields: [{ key: "rms", label: "RMS (arcsec)", type: "number" }] },
    ],
  },
  {
    id: "test-frame",
    title: "Test Frame",
    steps: [
      { id: "plate-solve", title: "Plate solve success", critical: true, logFields: [{ key: "solve_time", label: "Solve time (s)", type: "number" }] },
      { id: "test-exposure", title: "Take test exposure", critical: true, logFields: [{ key: "exposure", label: "Exposure (s)", type: "number" }, { key: "iso", label: "ISO", type: "number" }] },
    ],
  },
  {
    id: "final-go",
    title: "Final Go/No-Go",
    steps: [
      { id: "review", title: "Checklist review" },
      { id: "go-nogo", title: "Go/No-Go decision" },
    ],
  },
];

export const CRITICAL_STEP_IDS = [
  "polar-align",
  "focus-routine",
  "plate-solve",
  "test-exposure",
];

export const PREFLIGHT_KEYS = ["power", "mount", "focus", "guiding", "solve"] as const;

export const mockRig: RigProfile = {
  id: "rig1",
  name: "Home Rig",
  softwareProfileId: "nina",
};

export interface OptimizeRecommendation {
  id: string;
  title: string;
  why: string;
  confidence: number;
  suggestedChange?: string;
}

export const OPTIMIZE_RECOMMENDATIONS: OptimizeRecommendation[] = [
  { id: "sub-length", title: "Increase sub-exposure to 90s", why: "Bortle 8 + Moon 25% — longer subs will improve SNR.", confidence: 85, suggestedChange: "subLength: 90" },
  { id: "gain", title: "Use gain 100 for L-eNhance", why: "Dual-band filter benefits from higher gain in light pollution.", confidence: 78 },
  { id: "dither", title: "Enable 3px dither every 3 frames", why: "Reduces walking noise; minimal overhead.", confidence: 92, suggestedChange: "dither: 3px/3" },
  { id: "dew", title: "Set dew heater to 65%", why: "Temp drop tonight — slightly higher prevents fog.", confidence: 70, suggestedChange: "dewHeater: 65%" },
  { id: "focus-refresh", title: "Re-focus after 2°C drop", why: "Plastic components will shift. Plan a refocus at ~23:30.", confidence: 80 },
  { id: "dark-library", title: "Build dark library after session", why: "Same temp range — darks will match well.", confidence: 75 },
];

/** Mock AI explanation bullets for targets. */
export function getMockAIExplanation(targetId: string): { whyTarget: string; whyWindow: string; whyRecipe: string } {
  const defaults = {
    whyTarget: "High surface brightness, good for light-polluted skies.",
    whyWindow: "Peak altitude 60° after astronomical twilight.",
    whyRecipe: "60s subs balance SNR with guiding; 800 ISO avoids clipping.",
  };
  const overrides: Record<string, Partial<typeof defaults>> = {
    t1: { whyTarget: "Andromeda reaches 60°+ tonight; ideal for your focal length.", whyWindow: "Best after moonset; highest altitude 23:00–02:00." },
    t2: { whyTarget: "Orion visible early; high surface brightness for Bortle 8.", whyWindow: "Rises ~20:00; peak 22:00–01:00 before moonset." },
  };
  return { ...defaults, ...overrides[targetId] };
}

/** Mission guidance for field operations — why target, recipe, watchouts. */
export function getMockMissionGuidance(targetId: string): {
  whyNow: string;
  whyRecipe: string;
  watchouts: string[];
  recheckNote?: string;
} {
  const defaults = {
    whyNow: "Target peaks at 60° after astronomical twilight. Current sky brightness supports this target despite moderate moon presence.",
    whyRecipe: "60s subs reduce clipping risk and preserve guiding margin. ISO 800 balances noise and dynamic range.",
    watchouts: ["Reassess after 10:45 PM if cloud confidence falls", "Dew risk rising later — verify heater"],
    recheckNote: "Recheck after 10:45 PM",
  };
  const overrides: Record<string, Partial<typeof defaults>> = {
    m31: { whyNow: "Andromeda peaks at 60°+ after dark. Window is shrinking — prioritize now.", watchouts: ["Andromeda window shrinks after midnight"] },
    m42: { whyNow: "Orion visible early. High surface brightness fits Bortle 8.", watchouts: ["Moon glare may increase after 11 PM"] },
    m45: { whyNow: "Pleiades best after moonset. Large frame suits wide-field.", watchouts: ["Window ends before dawn — plan subs early"] },
  };
  return { ...defaults, ...overrides[targetId] };
}

/** Mock mission in setup phase. */
export function getMockMission(overrides?: Partial<Mission>): Mission {
  return {
    id: "m-setup-demo",
    name: "Tonight's Setup Demo",
    dateTime: new Date().toISOString(),
    locationId: "loc1",
    gearId: "gear1",
    constraints: { minAltitude: 30, moonTolerance: 30, targetTypes: ["galaxy", "nebula"], driveToDarker: false, driveRadius: 30 },
    targets: [
      { targetId: "t1", targetName: "Andromeda (M31)", targetType: "galaxy", plannedWindowStart: "21:00", plannedWindowEnd: "02:00", score: 85, sequenceIndex: 1, roleLabel: "SEQ 1", isFallback: false },
      { targetId: "t2", targetName: "Orion (M42)", targetType: "nebula", plannedWindowStart: "20:00", plannedWindowEnd: "01:00", score: 78, sequenceIndex: 2, roleLabel: "SEQ 2", isFallback: false },
    ],
    status: "ready",
    phase: "setup",
    notes: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
