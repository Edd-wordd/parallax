/**
 * Default mission titles from the session dates, and duplicate-name checks.
 */

export function missionNameFromSession(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  const startLabel = fmt.format(start);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) return startLabel;
  return `${startLabel}–${fmt.format(end)}`;
}

export function missionNameTaken(
  name: string,
  missions: { id: string; name: string }[],
  exceptId?: string,
): boolean {
  const key = name.trim().toLowerCase();
  if (!key) return false;
  return missions.some(
    (m) => m.id !== exceptId && m.name.trim().toLowerCase() === key,
  );
}
