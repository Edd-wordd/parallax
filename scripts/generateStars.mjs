#!/usr/bin/env node
/**
 * Generates src/data/stars_2000.json with ~2000 star entries.
 * ~50 brightest have real names and coordinates; rest are generated with realistic distributions.
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/data/stars_2000.json");

// ~50 bright named stars: RA (hours), Dec (deg), mag, name
// Data from Yale Bright Star Catalog / commonly cited values
const NAMED_STARS = [
  { raHours: 6.7525, decDeg: -16.7161, mag: -1.46, name: "Sirius" },
  { raHours: 6.3992, decDeg: -52.6956, mag: -0.74, name: "Canopus" },
  { raHours: 14.2611, decDeg: 19.1824, mag: -0.05, name: "Arcturus" },
  { raHours: 18.6156, decDeg: 38.7836, mag: 0.03, name: "Vega" },
  { raHours: 5.2782, decDeg: 46.0013, mag: 0.08, name: "Capella" },
  { raHours: 5.2423, decDeg: -8.2016, mag: 0.13, name: "Rigel" },
  { raHours: 7.655, decDeg: 5.225, mag: 0.34, name: "Procyon" },
  { raHours: 5.9195, decDeg: 7.4071, mag: 0.5, name: "Betelgeuse" },
  { raHours: 19.8464, decDeg: 8.8683, mag: 0.77, name: "Altair" },
  { raHours: 4.5987, decDeg: 16.5093, mag: 0.85, name: "Aldebaran" },
  { raHours: 13.4199, decDeg: -11.1613, mag: 0.97, name: "Spica" },
  { raHours: 16.4901, decDeg: -26.4321, mag: 1.06, name: "Antares" },
  { raHours: 7.7553, decDeg: 28.0262, mag: 1.14, name: "Pollux" },
  { raHours: 22.9608, decDeg: -29.6222, mag: 1.16, name: "Fomalhaut" },
  { raHours: 20.6905, decDeg: 45.2803, mag: 1.25, name: "Deneb" },
  { raHours: 10.1396, decDeg: 11.9672, mag: 1.35, name: "Regulus" },
  { raHours: 7.5766, decDeg: 31.8886, mag: 1.58, name: "Castor" },
  { raHours: 5.4182, decDeg: 6.3497, mag: 1.64, name: "Bellatrix" },
  { raHours: 5.6036, decDeg: -1.2019, mag: 1.69, name: "Alnilam" },
  { raHours: 5.6793, decDeg: -1.9426, mag: 1.77, name: "Alnitak" },
  { raHours: 3.4054, decDeg: 49.8612, mag: 1.79, name: "Mirfak" },
  { raHours: 5.7958, decDeg: -9.6696, mag: 2.07, name: "Saiph" },
  { raHours: 0.1398, decDeg: 29.0904, mag: 2.07, name: "Alpheratz" },
  { raHours: 3.1361, decDeg: 40.9556, mag: 2.12, name: "Algol" },
  { raHours: 23.0629, decDeg: 28.0828, mag: 2.42, name: "Scheat" },
  { raHours: 21.7364, decDeg: 9.875, mag: 2.38, name: "Enif" },
  { raHours: 23.0794, decDeg: 15.2053, mag: 2.49, name: "Markab" },
  { raHours: 6.9775, decDeg: -28.9721, mag: 1.5, name: "Wezen" },
  { raHours: 6.3782, decDeg: -17.9559, mag: 1.84, name: "Adhara" },
  { raHours: 7.4010, decDeg: -26.3932, mag: 1.86, name: "Aludra" },
  { raHours: 9.2208, decDeg: -69.7172, mag: 1.67, name: "Miaplacidus" },
  { raHours: 0.8574, decDeg: -17.9866, mag: 2.04, name: "Diphda" },
  { raHours: 1.6286, decDeg: 9.7328, mag: 2.26, name: "Menkar" },
  { raHours: 2.0650, decDeg: 42.3292, mag: 2.1, name: "Almach" },
  { raHours: 2.1192, decDeg: 23.4624, mag: 2.01, name: "Hamal" },
  { raHours: 5.4382, decDeg: -0.2991, mag: 2.25, name: "Mintaka" },
  { raHours: 14.1770, decDeg: 15.4200, mag: 2.14, name: "Vindemiatrix" },
  { raHours: 15.5785, decDeg: 19.8414, mag: 2.23, name: "Zubeneschamali" },
  { raHours: 15.2834, decDeg: -9.3829, mag: 2.75, name: "Zubenelgenubi" },
  { raHours: 17.1476, decDeg: -36.7123, mag: 2.29, name: "Epsilon Sco" },
  { raHours: 17.6219, decDeg: -42.9978, mag: 2.39, name: "Epsilon Sgr" },
  { raHours: 18.2997, decDeg: -21.0586, mag: 2.72, name: "Kaus Australis" },
  { raHours: 19.7509, decDeg: 10.9594, mag: 2.72, name: "Tarazed" },
  { raHours: 20.3704, decDeg: 40.2567, mag: 2.23, name: "Sadr" },
  { raHours: 21.7886, decDeg: -5.5711, mag: 2.90, name: "Sadaltager" },
  { raHours: 0.6751, decDeg: 56.5373, mag: 2.24, name: "Schedar" },
  { raHours: 0.1526, decDeg: 59.1497, mag: 2.28, name: "Caph" },
  { raHours: 1.9067, decDeg: 60.2353, mag: 2.15, name: "Cih" },
  { raHours: 1.1625, decDeg: 35.6206, mag: 2.07, name: "Mirach" },
  { raHours: 3.3084, decDeg: 15.1836, mag: 2.83, name: "Algenib" },
  { raHours: 3.7912, decDeg: 24.1051, mag: 2.86, name: "Alcyone" },
];

// Ensure NAMED_STARS has exactly 50 entries; trim/expand as needed
const NAMED = NAMED_STARS.slice(0, 50).map((s, i) => ({ ...s, id: i + 1 }));

// Simple seeded random for reproducibility (optional)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

/** Random RA 0-24 hours */
function randomRA() {
  return rng() * 24;
}

/** Dec favoring equator (cos-weighted: fewer stars near poles) */
function randomDec() {
  const u = rng();
  const decRad = Math.asin(2 * u - 1);
  return (decRad * 180) / Math.PI;
}

/** Mag -1 to 7, more dim stars (power-law-like) */
function randomMag() {
  const u = rng();
  // ~10^0.4 per mag: more stars at fainter mag; use u^0.5 to skew toward 7
  const t = Math.pow(u, 0.5);
  return -1 + 8 * t;
}

function generateStars() {
  const stars = [];
  const usedIds = new Set();

  // Add named stars first (ids 1..50)
  for (let i = 0; i < NAMED.length; i++) {
    const s = NAMED[i];
    stars.push({
      id: s.id,
      raHours: Math.round(s.raHours * 10000) / 10000,
      decDeg: Math.round(s.decDeg * 10000) / 10000,
      mag: Math.round(s.mag * 100) / 100,
      name: s.name,
    });
    usedIds.add(s.id);
  }

  // Generate remaining ~1950 stars (ids 51..2000)
  for (let i = NAMED.length; i < 2000; i++) {
    const id = i + 1;
    if (usedIds.has(id)) continue;
    stars.push({
      id,
      raHours: Math.round(randomRA() * 10000) / 10000,
      decDeg: Math.round(randomDec() * 10000) / 10000,
      mag: Math.round(randomMag() * 100) / 100,
    });
  }

  // Sort by id for clean output
  stars.sort((a, b) => a.id - b.id);
  return stars;
}

// Run
const stars = generateStars();

const dir = dirname(outPath);
try {
  mkdirSync(dir, { recursive: true });
} catch (_) {}

writeFileSync(outPath, JSON.stringify(stars, null, 0), "utf8");
console.log(`Wrote ${stars.length} stars to ${outPath}`);
