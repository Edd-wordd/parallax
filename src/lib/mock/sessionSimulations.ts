/**
 * Mock session simulations by target. Replace with API data when backend is wired.
 */

export interface SessionTimelineEvent {
  time: string;
  event: string;
}

export interface SessionRisk {
  label: string;
  level: "Low" | "Moderate" | "High";
  reason: string;
}

export interface SessionSimulation {
  expectedQuality: number;
  summary: string;
  predictedOutcome: string;
  timeline: SessionTimelineEvent[];
  risks: SessionRisk[];
  simulationReasons: string[];
  /** Expected usable integration, ties to Exposure Plan. */
  expectedIntegration?: string;
  /** Altitude: start → peak → end (e.g. "34° → 57° → 29°"). */
  altitudeRange?: string;
  /** When quality is best and when it declines. */
  qualityWindow?: string;
  /** Meridian flip or mount event note. */
  interruptionNote?: string;
  /** Weather shift timing. */
  weatherShiftNote?: string;
}

export type SessionSimulationsByTarget = Record<string, SessionSimulation>;

export const SESSION_SIMULATIONS_BY_TARGET: SessionSimulationsByTarget = {
  m42: {
    expectedQuality: 8.4,
    summary:
      "Strong chance of a productive session with moderate setup sensitivity. Best results depend on accurate focus and keeping dew under control. A solid choice for a 2-hour imaging run.",
    predictedOutcome: "Strong broadband result",
    expectedIntegration: "~1h 45m usable signal",
    altitudeRange: "34° → 57° → 29°",
    qualityWindow: "Best quality between 9:20 PM and 10:40 PM",
    interruptionNote: "Meridian flip expected around 10:55 PM",
    weatherShiftNote: "Humidity risk increases after 11:30 PM",
    timeline: [
      { time: "8:45 PM", event: "Setup and alignment" },
      { time: "9:05 PM", event: "Focus + framing verification" },
      { time: "9:20 PM", event: "Capture begins" },
      { time: "10:40 PM", event: "Conditions remain favorable" },
      { time: "11:35 PM", event: "Dew risk increases" },
      { time: "12:10 AM", event: "Recommended stop window" },
    ],
    risks: [
      {
        label: "Dew Risk",
        level: "Moderate",
        reason: "Rises late in the session",
      },
      {
        label: "Framing Risk",
        level: "Low",
        reason: "Low if plate solving is confirmed",
      },
      {
        label: "Tracking Risk",
        level: "Moderate",
        reason: "Moderate if using longer than 120s subs",
      },
      {
        label: "Moon Washout",
        level: "Low",
        reason: "Minimal during the primary capture window",
      },
    ],
    simulationReasons: [
      "This session scores well because the target stays in a favorable altitude band for most of the session.",
      "Exposure plan fits the available capture window and avoids overextending.",
      "Setup overhead remains moderate; earlier start improves total integration.",
      "Late-session moisture may reduce consistency; recommended stop before 12:10 AM.",
    ],
  },
  rosette: {
    expectedQuality: 7.8,
    summary:
      "Good session potential with a tighter timing window. Best started after M42. Focus stability and refocus after temperature drop are important.",
    predictedOutcome: "Good framing, extended integration possible",
    expectedIntegration: "~2h 15m usable signal",
    altitudeRange: "28° → 52° → 35°",
    qualityWindow: "Best quality between 10:50 PM and 12:30 AM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Cloud risk remains low through the recommended stop window",
    timeline: [
      { time: "10:20 PM", event: "Target enters favorable altitude" },
      { time: "10:35 PM", event: "Setup and plate solve" },
      { time: "10:50 PM", event: "Capture begins" },
      { time: "12:00 AM", event: "Stable imaging continues" },
      { time: "12:45 AM", event: "Dew risk rising" },
      { time: "1:15 AM", event: "Recommended stop" },
    ],
    risks: [
      {
        label: "Dew Risk",
        level: "Moderate",
        reason: "Rises late in the session; later start increases humidity exposure",
      },
      {
        label: "Framing Risk",
        level: "Low",
        reason: "Wide target; verify full nebula in frame",
      },
      {
        label: "Tracking Risk",
        level: "Low",
        reason: "Rig historically stable for this focal length",
      },
      {
        label: "Moon Washout",
        level: "Low",
        reason: "Moon separation sufficient for Ha",
      },
    ],
    simulationReasons: [
      "Target remains high for most of the usable window and fits the extended slot after M42.",
      "Exposure plan matches the mission duration and Ha needs.",
      "Setup overhead is moderate; realistic for a second-target run.",
      "Late-session conditions create minor risk, not major failure.",
    ],
  },
  m45: {
    expectedQuality: 7.2,
    summary:
      "Productive session if started early. Western descent limits the window. Shorter subs reduce tracking stress. Good warm-up before a second target.",
    predictedOutcome: "Acceptable but time-limited result",
    expectedIntegration: "~1h 18m usable signal",
    altitudeRange: "34° → 57° → 29°",
    qualityWindow: "Best quality between 9:05 PM and 10:40 PM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Efficiency drops after 11:15 PM as altitude declines",
    timeline: [
      { time: "8:30 PM", event: "Setup and alignment" },
      { time: "8:50 PM", event: "Focus and framing" },
      { time: "9:05 PM", event: "Capture begins" },
      { time: "10:00 PM", event: "Peak altitude window" },
      { time: "10:45 PM", event: "Altitude declining" },
      { time: "11:30 PM", event: "Recommended stop" },
    ],
    risks: [
      {
        label: "Dew Risk",
        level: "Low",
        reason: "Earlier window, less humidity buildup",
      },
      {
        label: "Framing Risk",
        level: "Low",
        reason: "Compact target, straightforward framing",
      },
      {
        label: "Tracking Risk",
        level: "Low",
        reason: "Short 60s subs reduce tracking stress",
      },
      {
        label: "Moon Washout",
        level: "Low",
        reason: "Low moon interference for reflection nebula",
      },
    ],
    simulationReasons: [
      "This session scores well because the target peaks early and fits your available imaging window.",
      "The western descent shortens the usable capture period; earlier setup improves total integration.",
      "Shorter subs reduce tracking stress and improve keeper rate for this target tonight.",
      "Single-target slot or lead-in to M42.",
    ],
  },
  pleiades: {
    expectedQuality: 7.2,
    summary:
      "Productive session if started early. Western descent limits the window. Shorter subs reduce tracking stress. Good warm-up before a second target.",
    predictedOutcome: "Acceptable but time-limited result",
    expectedIntegration: "~1h 18m usable signal",
    altitudeRange: "34° → 57° → 29°",
    qualityWindow: "Best quality between 9:05 PM and 10:40 PM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Efficiency drops after 11:15 PM as altitude declines",
    timeline: [
      { time: "8:30 PM", event: "Setup and alignment" },
      { time: "8:50 PM", event: "Focus and framing" },
      { time: "9:05 PM", event: "Capture begins" },
      { time: "10:00 PM", event: "Peak altitude window" },
      { time: "10:45 PM", event: "Altitude declining" },
      { time: "11:30 PM", event: "Recommended stop" },
    ],
    risks: [
      {
        label: "Dew Risk",
        level: "Low",
        reason: "Earlier window, less humidity buildup",
      },
      {
        label: "Framing Risk",
        level: "Low",
        reason: "Compact target, straightforward framing",
      },
      {
        label: "Tracking Risk",
        level: "Low",
        reason: "Short 60s subs reduce tracking stress",
      },
      {
        label: "Moon Washout",
        level: "Low",
        reason: "Low moon interference for reflection nebula",
      },
    ],
    simulationReasons: [
      "This session scores well because the target peaks early and fits your available imaging window.",
      "The western descent shortens the usable capture period; earlier setup improves total integration.",
      "Shorter subs reduce tracking stress and improve keeper rate for this target tonight.",
      "Single-target slot or lead-in to M42.",
    ],
  },
};
