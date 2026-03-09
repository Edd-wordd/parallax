export function generateAltitudeSeries(): { time: string; altitude: number }[] {
  const hours = Array.from({ length: 12 }, (_, i) => 18 + i);
  return hours.map((h) => ({
    time: `${h}:00`,
    altitude: Math.max(0, Math.sin(((h - 20) / 8) * Math.PI) * 70 + 15 + Math.random() * 10),
  }));
}
