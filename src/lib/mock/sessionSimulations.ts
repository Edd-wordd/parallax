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
  heart: {
    expectedQuality: 7.9,
    summary:
      "Strong Ha target with good session potential. Best started after M42. Focus stability is important for faint outer structure.",
    predictedOutcome: "Good Ha result, extended integration possible",
    expectedIntegration: "~1h 45m usable signal",
    altitudeRange: "32° → 58° → 38°",
    qualityWindow: "Best quality between 10:45 PM and 12:45 AM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Humidity risk increases after 1:00 AM",
    timeline: [
      { time: "10:30 PM", event: "Target enters favorable altitude" },
      { time: "10:45 PM", event: "Setup and plate solve" },
      { time: "11:00 PM", event: "Capture begins" },
      { time: "12:15 AM", event: "Stable imaging continues" },
      { time: "12:50 AM", event: "Dew risk rising" },
      { time: "1:20 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Dew Risk", level: "Moderate", reason: "Rises late in the session" },
      { label: "Framing Risk", level: "Low", reason: "Wide target; verify full nebula in frame" },
      { label: "Tracking Risk", level: "Low", reason: "Rig historically stable" },
      { label: "Moon Washout", level: "Low", reason: "Moon separation sufficient for Ha" },
    ],
    simulationReasons: [
      "Target remains high for most of the usable window and fits the extended slot after M42.",
      "Exposure plan matches the mission duration and Ha needs.",
      "Setup overhead is moderate; realistic for a second-target run.",
    ],
  },
  m31: {
    expectedQuality: 8.2,
    summary:
      "Strong chance of a productive session. Andromeda peaks well during the imaging window. Focus and framing are key.",
    predictedOutcome: "Strong broadband result",
    expectedIntegration: "~1h 50m usable signal",
    altitudeRange: "38° → 62° → 35°",
    qualityWindow: "Best quality between 10:00 PM and 12:30 AM",
    interruptionNote: "Meridian flip expected around 11:30 PM",
    weatherShiftNote: "Conditions stable through recommended stop",
    timeline: [
      { time: "9:30 PM", event: "Setup and alignment" },
      { time: "9:50 PM", event: "Focus + framing verification" },
      { time: "10:05 PM", event: "Capture begins" },
      { time: "11:25 PM", event: "Meridian flip" },
      { time: "11:45 PM", event: "Capture resumes" },
      { time: "12:45 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Dew Risk", level: "Moderate", reason: "Rises late in the session" },
      { label: "Framing Risk", level: "Low", reason: "Large target; verify full galaxy in frame" },
      { label: "Tracking Risk", level: "Low", reason: "Moderate subs reduce stress" },
      { label: "Moon Washout", level: "Low", reason: "Minimal during primary capture window" },
    ],
    simulationReasons: [
      "Andromeda stays in a favorable altitude band for most of the session.",
      "Exposure plan fits the available capture window.",
      "Meridian flip adds minor overhead but manageable.",
    ],
  },
  "elephant-trunk": {
    expectedQuality: 7.5,
    summary:
      "Good session potential with a moderate timing window. Narrowband target benefits from stable conditions.",
    predictedOutcome: "Good Ha result",
    expectedIntegration: "~2h 10m usable signal",
    altitudeRange: "30° → 54° → 32°",
    qualityWindow: "Best quality between 10:30 PM and 12:45 AM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Cloud risk remains low through the window",
    timeline: [
      { time: "10:15 PM", event: "Target enters favorable altitude" },
      { time: "10:35 PM", event: "Setup and plate solve" },
      { time: "10:50 PM", event: "Capture begins" },
      { time: "12:00 AM", event: "Stable imaging continues" },
      { time: "12:50 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Dew Risk", level: "Moderate", reason: "Rises late in the session" },
      { label: "Framing Risk", level: "Low", reason: "Verify full structure in frame" },
      { label: "Tracking Risk", level: "Low", reason: "Rig stable for this focal length" },
      { label: "Moon Washout", level: "Low", reason: "Ha filter reduces moon impact" },
    ],
    simulationReasons: [
      "Target remains high for most of the usable window.",
      "Exposure plan matches the mission duration.",
      "Narrowband imaging less sensitive to sky brightness.",
    ],
  },
  lagoon: {
    expectedQuality: 8.0,
    summary:
      "Strong chance of a productive session. Bright target with good altitude. Solid choice for a 2-hour run.",
    predictedOutcome: "Strong broadband result",
    expectedIntegration: "~1h 50m usable signal",
    altitudeRange: "35° → 58° → 30°",
    qualityWindow: "Best quality between 9:45 PM and 11:45 PM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Western descent limits window; start early",
    timeline: [
      { time: "9:15 PM", event: "Setup and alignment" },
      { time: "9:35 PM", event: "Focus + framing verification" },
      { time: "9:50 PM", event: "Capture begins" },
      { time: "11:00 PM", event: "Peak altitude window" },
      { time: "11:50 PM", event: "Altitude declining" },
      { time: "12:15 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Dew Risk", level: "Low", reason: "Earlier window, less humidity" },
      { label: "Framing Risk", level: "Low", reason: "Compact target, straightforward framing" },
      { label: "Tracking Risk", level: "Low", reason: "Moderate subs reduce stress" },
      { label: "Moon Washout", level: "Low", reason: "Minimal during primary window" },
    ],
    simulationReasons: [
      "Bright target peaks well during the imaging window.",
      "Shorter subs reduce tracking stress.",
      "Western descent shortens window; earlier start improves integration.",
    ],
  },
  // Planetary targets (Create Mission → planetary path)
  jupiter: {
    expectedQuality: 8.5,
    summary: "Strong planetary session. Jupiter is well placed. Short exposures reduce seeing blur. Stack thousands of frames for sharp detail.",
    predictedOutcome: "Sharp bands and GRS possible with good seeing",
    expectedIntegration: "~50s best frames",
    altitudeRange: "42° → 65° → 38°",
    qualityWindow: "Best quality between 10:30 PM and 12:30 AM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Seeing typically improves after 11:00 PM",
    timeline: [
      { time: "9:45 PM", event: "Setup and alignment" },
      { time: "10:10 PM", event: "Focus and framing" },
      { time: "10:25 PM", event: "Capture begins" },
      { time: "10:55 PM", event: "Stack 1 complete" },
      { time: "11:25 PM", event: "Stack 2 complete" },
      { time: "11:45 PM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Seeing", level: "Moderate", reason: "Planetary imaging seeing-critical" },
      { label: "Dew Risk", level: "Low", reason: "Short session" },
      { label: "Framing Risk", level: "Low", reason: "Compact target" },
      { label: "Overexposure", level: "Low", reason: "Keep exposures under 30ms" },
    ],
    simulationReasons: [
      "Jupiter is well placed in the sky tonight.",
      "Short exposures freeze atmospheric turbulence.",
      "High frame count improves stacking quality.",
    ],
  },
  saturn: {
    expectedQuality: 8.2,
    summary: "Good planetary session. Saturn well placed. Ring detail benefits from steady seeing. Slightly longer exposures than Jupiter.",
    predictedOutcome: "Ring structure and Cassini Division visible",
    expectedIntegration: "~55s best frames",
    altitudeRange: "38° → 58° → 35°",
    qualityWindow: "Best quality between 10:45 PM and 12:15 AM",
    interruptionNote: "No major mount interruptions expected",
    weatherShiftNote: "Seeing improves through the night",
    timeline: [
      { time: "10:00 PM", event: "Setup and alignment" },
      { time: "10:25 PM", event: "Focus and framing" },
      { time: "10:40 PM", event: "Capture begins" },
      { time: "11:15 PM", event: "Stack 1 complete" },
      { time: "11:45 PM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Seeing", level: "Moderate", reason: "Ring detail needs steady air" },
      { label: "Dew Risk", level: "Low", reason: "Moderate session length" },
      { label: "Framing Risk", level: "Low", reason: "Compact target" },
      { label: "Moon Washout", level: "Low", reason: "Planetary less affected" },
    ],
    simulationReasons: [
      "Saturn at good altitude tonight.",
      "Ring tilt favorable for detail.",
      "Session fits before dew risk rises.",
    ],
  },
  moon: {
    expectedQuality: 8.8,
    summary: "Excellent lunar session. Bright target, short exposures. Mosaic or high-res single region both viable. Very forgiving conditions.",
    predictedOutcome: "Sharp lunar detail, crater and mare structure",
    expectedIntegration: "~2s best frames",
    altitudeRange: "45° → 72° → 40°",
    qualityWindow: "Best quality 9:30 PM through 1:00 AM",
    interruptionNote: "No major interruptions expected",
    weatherShiftNote: "Lunar imaging less sensitive to conditions",
    timeline: [
      { time: "9:15 PM", event: "Setup and alignment" },
      { time: "9:30 PM", event: "Focus and framing" },
      { time: "9:40 PM", event: "Capture begins" },
      { time: "10:00 PM", event: "First region complete" },
      { time: "10:30 PM", event: "Recommended stop or continue mosaic" },
    ],
    risks: [
      { label: "Seeing", level: "Low", reason: "Short exposures forgive poor seeing" },
      { label: "Dew Risk", level: "Low", reason: "Short session" },
      { label: "Overexposure", level: "Moderate", reason: "Bright regions saturate easily" },
      { label: "Framing Risk", level: "Low", reason: "Large target" },
    ],
    simulationReasons: [
      "Moon well placed for imaging.",
      "Short exposures reduce seeing impact.",
      "Flexible session length.",
    ],
  },
  mars: {
    expectedQuality: 7.5,
    summary: "Moderate planetary session. Mars is smaller; seeing-critical. Best when opposition is near. Surface detail possible with steady air.",
    predictedOutcome: "Polar cap and dark features visible with good seeing",
    expectedIntegration: "~50s best frames",
    altitudeRange: "35° → 52° → 30°",
    qualityWindow: "Best quality between 11:00 PM and 12:45 AM",
    interruptionNote: "No major interruptions expected",
    weatherShiftNote: "Seeing may vary; capture during steadier moments",
    timeline: [
      { time: "10:30 PM", event: "Setup and alignment" },
      { time: "10:55 PM", event: "Focus and framing" },
      { time: "11:10 PM", event: "Capture begins" },
      { time: "11:50 PM", event: "Stack complete" },
      { time: "12:15 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Seeing", level: "High", reason: "Small disc; very seeing-critical" },
      { label: "Dew Risk", level: "Moderate", reason: "Later session" },
      { label: "Framing Risk", level: "Low", reason: "Compact target" },
      { label: "Altitude", level: "Moderate", reason: "Lower than Jupiter/Saturn" },
    ],
    simulationReasons: [
      "Mars at acceptable altitude.",
      "Session fits seeing window.",
      "Multiple stacks improve chances.",
    ],
  },
  venus: {
    expectedQuality: 8.0,
    summary: "Good session for Venus. Very bright; ultra-short exposures. Cloud detail possible with UV filter. Often visible at dusk/dawn.",
    predictedOutcome: "Phase and cloud structure with UV",
    expectedIntegration: "~1.8s best frames",
    altitudeRange: "28° → 42° → 25°",
    qualityWindow: "Best when highest; check visibility window",
    interruptionNote: "Short visibility window typical",
    weatherShiftNote: "Often imaged at twilight; low altitude",
    timeline: [
      { time: "Dusk", event: "Setup before target sets" },
      { time: "Dusk + 15m", event: "Focus and capture" },
      { time: "Dusk + 35m", event: "Recommended stop" },
    ],
    risks: [
      { label: "Altitude", level: "High", reason: "Typically low; horizon haze" },
      { label: "Window", level: "High", reason: "Short visibility" },
      { label: "Overexposure", level: "Moderate", reason: "Very bright" },
      { label: "Dew Risk", level: "Low", reason: "Short session" },
    ],
    simulationReasons: [
      "Venus visibility depends on phase and time.",
      "Act quickly when target is visible.",
      "UV filter reveals cloud structure.",
    ],
  },
  mercury: {
    expectedQuality: 6.5,
    summary: "Challenging target. Low altitude, short window. Act fast when it appears. Horizon haze reduces quality.",
    predictedOutcome: "Phase visible; detail limited by altitude",
    expectedIntegration: "~2s best frames",
    altitudeRange: "12° → 18° → 10°",
    qualityWindow: "Very short; twilight only",
    interruptionNote: "Rapidly sets or rises",
    weatherShiftNote: "Horizon conditions critical",
    timeline: [
      { time: "Twilight", event: "Setup; locate target quickly" },
      { time: "Twilight + 10m", event: "Capture begins" },
      { time: "Twilight + 25m", event: "Recommended stop" },
    ],
    risks: [
      { label: "Altitude", level: "High", reason: "Always near horizon" },
      { label: "Window", level: "High", reason: "Very short visibility" },
      { label: "Seeing", level: "High", reason: "Horizon turbulence" },
      { label: "Haze", level: "Moderate", reason: "Twilight sky glow" },
    ],
    simulationReasons: [
      "Mercury is the most challenging planetary target.",
      "Check visibility for your location and date.",
      "Quick capture when visible.",
    ],
  },
  uranus: {
    expectedQuality: 6.8,
    summary: "Challenging but viable. Faint disc; longer exposures than gas giants. Dark site helps. RGB for color.",
    predictedOutcome: "Small blue-green disc; moon capture possible",
    expectedIntegration: "~50s usable",
    altitudeRange: "40° → 58° → 42°",
    qualityWindow: "Best between 11:00 PM and 1:30 AM",
    interruptionNote: "No major interruptions expected",
    weatherShiftNote: "Dark sky essential; avoid moon",
    timeline: [
      { time: "10:45 PM", event: "Setup and alignment" },
      { time: "11:15 PM", event: "Focus and locate" },
      { time: "11:30 PM", event: "Capture begins" },
      { time: "1:00 AM", event: "Stack complete" },
      { time: "1:20 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Brightness", level: "Moderate", reason: "Faint target" },
      { label: "Moon Washout", level: "High", reason: "Avoid moonlit nights" },
      { label: "Dew Risk", level: "Moderate", reason: "Long session" },
      { label: "Framing Risk", level: "Moderate", reason: "Small target; plate solve helps" },
    ],
    simulationReasons: [
      "Uranus at good altitude tonight.",
      "Dark site improves result.",
      "Longer exposures than Jupiter/Saturn.",
    ],
  },
  neptune: {
    expectedQuality: 6.2,
    summary: "Most challenging planet. Very faint; long exposures. Dark site essential. Moon must be down.",
    predictedOutcome: "Small blue disc; challenging",
    expectedIntegration: "~50s usable",
    altitudeRange: "38° → 55° → 40°",
    qualityWindow: "Best between 11:30 PM and 1:00 AM",
    interruptionNote: "No major interruptions expected",
    weatherShiftNote: "Darkest possible sky required",
    timeline: [
      { time: "11:00 PM", event: "Setup and alignment" },
      { time: "11:35 PM", event: "Focus and locate (plate solve)" },
      { time: "11:50 PM", event: "Capture begins" },
      { time: "1:20 AM", event: "Stack complete" },
      { time: "1:35 AM", event: "Recommended stop" },
    ],
    risks: [
      { label: "Brightness", level: "High", reason: "Very faint" },
      { label: "Moon Washout", level: "High", reason: "Moon must be down" },
      { label: "Dew Risk", level: "Moderate", reason: "Long session" },
      { label: "Framing Risk", level: "High", reason: "Tiny disc; plate solve critical" },
    ],
    simulationReasons: [
      "Neptune at acceptable altitude.",
      "Darkest possible conditions needed.",
      "Patience required; long exposures.",
    ],
  },
};
