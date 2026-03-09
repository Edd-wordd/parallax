/**
 * Night simulation utilities.
 * TODO: Wire to real astronomy calculations when backend available.
 */

export interface TimeWindow {
  targetId: string;
  targetName: string;
  plannedWindowStart: string;
  plannedWindowEnd: string;
  score: number;
}

export interface ActiveWindow {
  targetId: string;
  targetName: string;
  score: number;
}

const parseTime = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
};

/**
 * Converts time in minutes from midnight (0–1440) to hour.decimal.
 */
function minutesToHour(minutes: number): number {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return h + m / 60;
}

/**
 * Maps simulated time (minutes from sunset) to active target windows.
 * Returns targets whose window contains the current time.
 */
export function mapTimeToWindow(
  currentTimeMinutes: number,
  windows: TimeWindow[],
  sunsetMinutes: number = 18 * 60 + 45
): ActiveWindow[] {
  const totalMinutes = sunsetMinutes + currentTimeMinutes;
  const hourNow = minutesToHour(totalMinutes);
  // Handle wraparound (e.g. 02:00 next day = 26)
  const hourNorm = hourNow < 6 ? hourNow + 24 : hourNow;

  return windows
    .filter((w) => {
      const start = parseTime(w.plannedWindowStart);
      let end = parseTime(w.plannedWindowEnd);
      if (end < 6) end += 24;
      const startNorm = start < 6 ? start + 24 : start;
      return hourNorm >= startNorm && hourNorm <= end;
    })
    .map((w) => ({ targetId: w.targetId, targetName: w.targetName, score: w.score }));
}

/**
 * Get moon percent and altitude for a given time (mock deterministic curve).
 * Based on sin wave for demo feel.
 */
export function getMoonAtTime(
  currentTimeMinutes: number,
  nightLengthMinutes: number = 11 * 60 + 27
): { moonPercent: number; moonAltitude: number } {
  const t = currentTimeMinutes / nightLengthMinutes;
  const moonPercent = Math.round(25 + 30 * Math.sin(t * Math.PI));
  const moonAltitude = Math.round(15 + 25 * Math.sin((t - 0.2) * Math.PI));
  return {
    moonPercent: Math.max(0, Math.min(100, moonPercent)),
    moonAltitude: Math.max(-10, Math.min(90, moonAltitude)),
  };
}
