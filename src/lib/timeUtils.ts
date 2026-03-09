/**
 * Time parsing and percent mapping utilities for timelines.
 */

/** Parse "HH:mm" to decimal hours (e.g. "19:42" -> 19.7) */
export function parseTimeToHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m ?? 0) / 60;
}

/** Parse "HH:mm" to minutes from midnight (0–1439 for same day, 1440+ for next day) */
export function parseTimeToMinutes(t: string, nextDay = false): number {
  const hours = parseTimeToHours(t);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return (nextDay ? 24 : 0) * 60 + h * 60 + m;
}

/**
 * Compute NOW cursor position as percent (0..1) along the night window.
 * percent = (nowTime - sunsetTime) / (sunriseTime - sunsetTime)
 * Clamped 0..1. Before sunset -> 0, after sunrise -> 1.
 */
export function getNowPercent(
  sunsetTime: string,
  sunriseTime: string,
  now?: Date
): number {
  const nowDate = now ?? new Date();
  const base = new Date(nowDate);
  const y = base.getFullYear();
  const m = base.getMonth();
  const d = base.getDate();

  const [sh, sm] = sunsetTime.split(":").map(Number);
  const [eh, em] = sunriseTime.split(":").map(Number);

  const sunset = new Date(y, m, d, sh, sm ?? 0, 0, 0);
  const sunrise = new Date(y, m, d + 1, eh, em ?? 0, 0, 0);

  if (nowDate < sunset) return 0;
  if (nowDate > sunrise) return 1;
  const total = sunrise.getTime() - sunset.getTime();
  const elapsed = nowDate.getTime() - sunset.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute position (0..1) of an event time within the night window (sunset to sunrise).
 */
export function eventPercent(
  eventTime: string,
  sunsetTime: string,
  sunriseTime: string,
  eventNextDay = false
): number {
  const sunsetMin = parseTimeToMinutes(sunsetTime, false);
  const sunriseMin = parseTimeToMinutes(sunriseTime, true);
  const eventMin = parseTimeToMinutes(eventTime, eventNextDay);
  const total = sunriseMin - sunsetMin;
  const pos = (eventMin - sunsetMin) / total;
  return clamp(pos, 0, 1);
}
