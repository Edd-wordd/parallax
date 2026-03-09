export interface MockNight {
  astronomicalDarknessStart: string;
  astronomicalDarknessEnd: string;
  sunset: string;
  sunrise: string;
  moonPhase: string;
  moonPhasePercent: number;
  /** 0–1, for phase visual (0=new, 0.5=quarter, 1=full) */
  illumination: number;
  moonset: string;
  moonAltitude: number;
  /** Degrees from new moon, for terminator direction */
  moonAngle: number;
  bortle: number;
  cloudCover: number;
  seeing: number;
  windSpeed: number; // mph
  recommendedTypes: { type: string; status: "good" | "moderate" | "poor" }[];
}

export const MOCK_NIGHT: MockNight = {
  astronomicalDarknessStart: "19:42",
  astronomicalDarknessEnd: "05:18",
  sunset: "18:45",
  sunrise: "06:12",
  moonPhase: "Waxing Crescent",
  moonPhasePercent: 25,
  illumination: 0.25,
  moonset: "23:15",
  moonAltitude: 42,
  moonAngle: 18,
  bortle: 4,
  cloudCover: 10,
  seeing: 3.5,
  windSpeed: 8,
  recommendedTypes: [
    { type: "Nebula", status: "good" },
    { type: "Clusters", status: "good" },
    { type: "Galaxies", status: "moderate" },
  ],
};
