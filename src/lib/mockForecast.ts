import type { ConditionsState } from "@/lib/missionUIStore";

export const forecastSeed: ConditionsState & { generatedAtLabel: string } = {
  seeing: 3,
  transparency: 3,
  wind: "low",
  clouds: 10,
  moonGlare: false,
  generatedAtLabel: "Forecast @ 6:00 PM",
};
