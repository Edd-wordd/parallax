/**
 * Named darker-sky places for the Settings picker.
 *
 * Coordinates are public place locations (visitor areas), not a private pad.
 * Bortle is the catalog class for that place — DarkSky International
 * designated sites, using the class commonly published for the place.
 * Distance is great-circle only. This catalog does not estimate drive time.
 */

export type DarkSite = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bortle: number;
  source: string;
};

const SOURCE =
  "DarkSky International designated place; Bortle is the catalog class, not a live measurement.";

export const DARK_SITE_CATALOG: DarkSite[] = [
  {
    id: "cosmic-campground",
    name: "Cosmic Campground",
    lat: 33.4786,
    lon: -108.9222,
    bortle: 1,
    source: SOURCE,
  },
  {
    id: "massacre-rim",
    name: "Massacre Rim Wilderness",
    lat: 41.55,
    lon: -119.55,
    bortle: 1,
    source: SOURCE,
  },
  {
    id: "cherry-springs",
    name: "Cherry Springs State Park",
    lat: 41.6658,
    lon: -77.8236,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "natural-bridges",
    name: "Natural Bridges National Monument",
    lat: 37.6037,
    lon: -110.0036,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "big-bend",
    name: "Big Bend National Park",
    lat: 29.2498,
    lon: -103.2502,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "death-valley",
    name: "Death Valley National Park",
    lat: 36.5054,
    lon: -117.0794,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "capitol-reef",
    name: "Capitol Reef National Park",
    lat: 38.2822,
    lon: -111.2615,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "great-basin",
    name: "Great Basin National Park",
    lat: 39.0056,
    lon: -114.2186,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "chaco",
    name: "Chaco Culture National Historical Park",
    lat: 36.06,
    lon: -107.96,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "craters-of-the-moon",
    name: "Craters of the Moon National Monument",
    lat: 43.46,
    lon: -113.56,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "clayton-lake",
    name: "Clayton Lake State Park",
    lat: 36.59,
    lon: -103.31,
    bortle: 2,
    source: SOURCE,
  },
  {
    id: "grand-canyon",
    name: "Grand Canyon National Park",
    lat: 36.0544,
    lon: -112.1401,
    bortle: 3,
    source: SOURCE,
  },
  {
    id: "joshua-tree",
    name: "Joshua Tree National Park",
    lat: 33.8734,
    lon: -115.901,
    bortle: 3,
    source: SOURCE,
  },
  {
    id: "headlands",
    name: "Headlands International Dark Sky Park",
    lat: 45.786,
    lon: -84.987,
    bortle: 3,
    source: SOURCE,
  },
  {
    id: "newport",
    name: "Newport State Park",
    lat: 45.23,
    lon: -86.99,
    bortle: 3,
    source: SOURCE,
  },
  {
    id: "kissimmee-prairie",
    name: "Kissimmee Prairie Preserve",
    lat: 27.58,
    lon: -81.04,
    bortle: 3,
    source: SOURCE,
  },
];

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type NearbyDarkSite = DarkSite & { distanceKm: number };

/** Sites with a darker catalog class than `originBortle`, within `radiusKm`. */
export function darkerSitesNearby(input: {
  lat: number;
  lon: number;
  originBortle: number;
  radiusKm: number;
  catalog?: DarkSite[];
}): NearbyDarkSite[] {
  const catalog = input.catalog ?? DARK_SITE_CATALOG;
  if (
    !Number.isFinite(input.lat) ||
    !Number.isFinite(input.lon) ||
    !Number.isFinite(input.radiusKm) ||
    input.radiusKm <= 0
  ) {
    return [];
  }
  return catalog
    .filter((site) => site.bortle < input.originBortle)
    .map((site) => ({
      ...site,
      distanceKm: distanceKm(input.lat, input.lon, site.lat, site.lon),
    }))
    .filter((site) => site.distanceKm <= input.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function formatDistance(
  distanceKmValue: number,
  units: "metric" | "imperial",
): string {
  if (units === "imperial") {
    const miles = distanceKmValue / 1.609344;
    return `${Math.round(miles)} mi`;
  }
  return `${Math.round(distanceKmValue)} km`;
}
