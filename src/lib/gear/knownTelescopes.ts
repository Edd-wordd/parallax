/**
 * Curated OTA / lens presets for Settings → Gear autofill.
 * Focal length & aperture from typical manufacturer stock specs.
 * Always overridable — measured FL, reducers, and custom glass win.
 *
 * Grouped roughly by class in the Select (label prefix). Expand over time;
 * prefer well-known imaging configs over every retail SKU.
 */

export type KnownTelescope = {
  id: string;
  label: string;
  /** Substrings matched case-insensitively against telescope_name */
  matchNames: string[];
  telescopeName: string;
  focalLengthMm: number;
  apertureMm: number;
  /** Hint for Newtonians / fast Newts that often want a flattener/coma corrector */
  suggestsFlattenerComa?: boolean;
};

export const KNOWN_TELESCOPES: KnownTelescope[] = [
  // —— Fast imaging refractors / petzval ——
  {
    id: "william_optics_redcat_51",
    label: "Refractor · William Optics RedCat 51 (250 / 51)",
    matchNames: ["redcat 51", "redcat51", "william optics redcat 51"],
    telescopeName: "William Optics RedCat 51",
    focalLengthMm: 250,
    apertureMm: 51,
  },
  {
    id: "william_optics_redcat_71",
    label: "Refractor · William Optics RedCat 71 (350 / 71)",
    matchNames: ["redcat 71", "redcat71"],
    telescopeName: "William Optics RedCat 71",
    focalLengthMm: 350,
    apertureMm: 71,
  },
  {
    id: "william_optics_gt71",
    label: "Refractor · William Optics GT71 (420 / 71)",
    matchNames: ["gt71", "william optics gt71", "wo gt71"],
    telescopeName: "William Optics GT71",
    focalLengthMm: 420,
    apertureMm: 71,
  },
  {
    id: "william_optics_gt81",
    label: "Refractor · William Optics GT81 (478 / 81)",
    matchNames: ["gt81", "william optics gt81", "wo gt81"],
    telescopeName: "William Optics GT81",
    focalLengthMm: 478,
    apertureMm: 81,
  },
  {
    id: "william_optics_z61",
    label: "Refractor · William Optics Zenithstar 61 (360 / 61)",
    matchNames: ["zenithstar 61", "z61", "zs61"],
    telescopeName: "William Optics Zenithstar 61",
    focalLengthMm: 360,
    apertureMm: 61,
  },
  {
    id: "askar_fra400",
    label: "Refractor · Askar FRA400 (400 / 72)",
    matchNames: ["fra400", "askar fra400"],
    telescopeName: "Askar FRA400",
    focalLengthMm: 400,
    apertureMm: 72,
  },
  {
    id: "askar_fra500",
    label: "Refractor · Askar FRA500 (500 / 90)",
    matchNames: ["fra500", "askar fra500"],
    telescopeName: "Askar FRA500",
    focalLengthMm: 500,
    apertureMm: 90,
  },
  {
    id: "askar_fra600",
    label: "Refractor · Askar FRA600 (600 / 108)",
    matchNames: ["fra600", "askar fra600"],
    telescopeName: "Askar FRA600",
    focalLengthMm: 600,
    apertureMm: 108,
  },
  {
    id: "askar_71f",
    label: "Refractor · Askar 71F (490 / 71)",
    matchNames: ["askar 71f", "71f"],
    telescopeName: "Askar 71F",
    focalLengthMm: 490,
    apertureMm: 71,
  },
  {
    id: "askar_103apo",
    label: "Refractor · Askar 103APO (700 / 103)",
    matchNames: ["askar 103", "103apo", "103 apo"],
    telescopeName: "Askar 103APO",
    focalLengthMm: 700,
    apertureMm: 103,
  },
  {
    id: "sharpstar_61edphii",
    label: "Refractor · Sharpstar 61EDPH II (335 / 61)",
    matchNames: ["61edph", "sharpstar 61"],
    telescopeName: "Sharpstar 61EDPH II",
    focalLengthMm: 335,
    apertureMm: 61,
  },
  {
    id: "sharpstar_76edph",
    label: "Refractor · Sharpstar 76EDPH (418 / 76)",
    matchNames: ["76edph", "sharpstar 76"],
    telescopeName: "Sharpstar 76EDPH",
    focalLengthMm: 418,
    apertureMm: 76,
  },
  {
    id: "sharpstar_94edph",
    label: "Refractor · Sharpstar 94EDPH (517 / 94)",
    matchNames: ["94edph", "sharpstar 94"],
    telescopeName: "Sharpstar 94EDPH",
    focalLengthMm: 517,
    apertureMm: 94,
  },
  {
    id: "ts_photoline_80",
    label: "Refractor · TS-Optics Photoline 80mm F/6 (480 / 80)",
    matchNames: ["photoline 80", "ts 80 f6", "ts-optics 80"],
    telescopeName: "TS-Optics Photoline 80",
    focalLengthMm: 480,
    apertureMm: 80,
  },
  {
    id: "apot_tecnica_90",
    label: "Refractor · Astro-Tech AT90EDT (540 / 90)",
    matchNames: ["at90edt", "astro-tech 90", "at90"],
    telescopeName: "Astro-Tech AT90EDT",
    focalLengthMm: 540,
    apertureMm: 90,
  },
  {
    id: "apot_tecnica_115",
    label: "Refractor · Astro-Tech AT115EDT (805 / 115)",
    matchNames: ["at115edt", "astro-tech 115", "at115"],
    telescopeName: "Astro-Tech AT115EDT",
    focalLengthMm: 805,
    apertureMm: 115,
  },

  // —— Classic ED doublets (Sky-Watcher / ES / SVBONY) ——
  {
    id: "skywatcher_72ed",
    label: "Refractor · Sky-Watcher Evostar 72ED (420 / 72)",
    matchNames: ["72ed", "evostar 72", "sky-watcher 72"],
    telescopeName: "Sky-Watcher Evostar 72ED",
    focalLengthMm: 420,
    apertureMm: 72,
  },
  {
    id: "skywatcher_80ed",
    label: "Refractor · Sky-Watcher Evostar 80ED (600 / 80)",
    matchNames: ["80ed", "evostar 80", "sky-watcher 80ed"],
    telescopeName: "Sky-Watcher Evostar 80ED",
    focalLengthMm: 600,
    apertureMm: 80,
  },
  {
    id: "skywatcher_100ed",
    label: "Refractor · Sky-Watcher Evostar 100ED (900 / 100)",
    matchNames: ["100ed", "evostar 100", "sky-watcher 100ed"],
    telescopeName: "Sky-Watcher Evostar 100ED",
    focalLengthMm: 900,
    apertureMm: 100,
  },
  {
    id: "skywatcher_120ed",
    label: "Refractor · Sky-Watcher Evostar 120ED (900 / 120)",
    matchNames: ["120ed", "evostar 120"],
    telescopeName: "Sky-Watcher Evostar 120ED",
    focalLengthMm: 900,
    apertureMm: 120,
  },
  {
    id: "skywatcher_150ed",
    label: "Refractor · Sky-Watcher Evostar 150ED (1200 / 150)",
    matchNames: ["150ed", "evostar 150"],
    telescopeName: "Sky-Watcher Evostar 150ED",
    focalLengthMm: 1200,
    apertureMm: 150,
  },
  {
    id: "es_ed80",
    label: "Refractor · Explore Scientific ED80 (480 / 80)",
    matchNames: ["es ed80", "explore scientific ed80", "ed80 ess"],
    telescopeName: "Explore Scientific ED80",
    focalLengthMm: 480,
    apertureMm: 80,
  },
  {
    id: "es_ed102",
    label: "Refractor · Explore Scientific ED102 (714 / 102)",
    matchNames: ["es ed102", "explore scientific ed102", "ed102"],
    telescopeName: "Explore Scientific ED102",
    focalLengthMm: 714,
    apertureMm: 102,
  },
  {
    id: "es_ed127",
    label: "Refractor · Explore Scientific ED127 (952 / 127)",
    matchNames: ["es ed127", "explore scientific ed127", "ed127"],
    telescopeName: "Explore Scientific ED127",
    focalLengthMm: 952,
    apertureMm: 127,
  },
  {
    id: "svbony_sv503_70",
    label: "Refractor · SVBONY SV503 70ED (420 / 70)",
    matchNames: ["sv503 70", "svbony 70ed", "sv503-70"],
    telescopeName: "SVBONY SV503 70ED",
    focalLengthMm: 420,
    apertureMm: 70,
  },
  {
    id: "svbony_sv503_80",
    label: "Refractor · SVBONY SV503 80ED (560 / 80)",
    matchNames: ["sv503 80", "svbony 80ed", "sv503-80"],
    telescopeName: "SVBONY SV503 80ED",
    focalLengthMm: 560,
    apertureMm: 80,
  },
  {
    id: "stellalyra_80ed",
    label: "Refractor · StellaLyra 80ED (560 / 80)",
    matchNames: ["stellalyra 80", "stella lyra 80"],
    telescopeName: "StellaLyra 80ED",
    focalLengthMm: 560,
    apertureMm: 80,
  },

  // —— Premium / classic APOs (spot checks) ——
  {
    id: "takahashi_fs60cb",
    label: "Refractor · Takahashi FS-60CB (355 / 60)",
    matchNames: ["fs-60", "fs60", "takahashi fs-60"],
    telescopeName: "Takahashi FS-60CB",
    focalLengthMm: 355,
    apertureMm: 60,
  },
  {
    id: "takahashi_fc76dcu",
    label: "Refractor · Takahashi FC-76DCU (570 / 76)",
    matchNames: ["fc-76", "fc76", "takahashi fc-76"],
    telescopeName: "Takahashi FC-76DCU",
    focalLengthMm: 570,
    apertureMm: 76,
  },
  {
    id: "takahashi_toa130",
    label: "Refractor · Takahashi TOA-130 (1000 / 130)",
    matchNames: ["toa-130", "toa130", "takahashi toa"],
    telescopeName: "Takahashi TOA-130",
    focalLengthMm: 1000,
    apertureMm: 130,
  },
  {
    id: "televue_np101is",
    label: "Refractor · Tele Vue NP101is (540 / 101)",
    matchNames: ["np101", "tele vue np101", "televue np101"],
    telescopeName: "Tele Vue NP101is",
    focalLengthMm: 540,
    apertureMm: 101,
  },
  {
    id: "televue_np127is",
    label: "Refractor · Tele Vue NP127is (660 / 127)",
    matchNames: ["np127", "tele vue np127", "televue np127"],
    telescopeName: "Tele Vue NP127is",
    focalLengthMm: 660,
    apertureMm: 127,
  },
  {
    id: "apm_lzosis_115",
    label: "Refractor · APM LZOS 115/805 (805 / 115)",
    matchNames: ["apm 115", "lzos 115", "apm lzos 115"],
    telescopeName: "APM LZOS 115/805",
    focalLengthMm: 805,
    apertureMm: 115,
  },

  // —— Astrographs / Newtonians ——
  {
    id: "skywatcher_quattro_150",
    label: "Newtonian · Sky-Watcher Quattro 150P (600 / 150)",
    matchNames: ["quattro 150", "quattro150", "150p f4"],
    telescopeName: "Sky-Watcher Quattro 150P",
    focalLengthMm: 600,
    apertureMm: 150,
    suggestsFlattenerComa: true,
  },
  {
    id: "skywatcher_quattro_200",
    label: "Newtonian · Sky-Watcher Quattro 200P (800 / 200)",
    matchNames: ["quattro 200", "quattro200", "200p f4"],
    telescopeName: "Sky-Watcher Quattro 200P",
    focalLengthMm: 800,
    apertureMm: 200,
    suggestsFlattenerComa: true,
  },
  {
    id: "skywatcher_quattro_250",
    label: "Newtonian · Sky-Watcher Quattro 250P (1000 / 250)",
    matchNames: ["quattro 250", "quattro250", "250p f4"],
    telescopeName: "Sky-Watcher Quattro 250P",
    focalLengthMm: 1000,
    apertureMm: 250,
    suggestsFlattenerComa: true,
  },
  {
    id: "skywatcher_200p_f5",
    label: "Newtonian · Sky-Watcher 200P f/5 (1000 / 200)",
    matchNames: ["200p", "explorer 200p", "sky-watcher 200p"],
    telescopeName: "Sky-Watcher Explorer 200P",
    focalLengthMm: 1000,
    apertureMm: 200,
    suggestsFlattenerComa: true,
  },
  {
    id: "orion_8_f4",
    label: "Newtonian · Orion 8″ f/4 Astrograph (800 / 203)",
    matchNames: ["orion 8 f/4", "orion 8\" f/4", "orion 203mm f4"],
    telescopeName: "Orion 8″ f/4 Astrograph",
    focalLengthMm: 800,
    apertureMm: 203,
    suggestsFlattenerComa: true,
  },
  {
    id: "apertura_6_f4",
    label: "Newtonian · Apertura/GSO 6″ f/4 (600 / 152)",
    matchNames: ["gso 6 f/4", "apertura 6 f/4", "150mm f4 newt"],
    telescopeName: "Apertura 6″ f/4 Imaging Newtonian",
    focalLengthMm: 600,
    apertureMm: 152,
    suggestsFlattenerComa: true,
  },
  {
    id: "apertura_8_f4",
    label: "Newtonian · Apertura/GSO 8″ f/4 (800 / 203)",
    matchNames: ["gso 8 f/4", "apertura 8 f/4", "200mm f4 newt"],
    telescopeName: "Apertura 8″ f/4 Imaging Newtonian",
    focalLengthMm: 800,
    apertureMm: 203,
    suggestsFlattenerComa: true,
  },
  {
    id: "celestron_astromaster_130eq",
    label: "Newtonian · Celestron AstroMaster 130EQ (650 / 130)",
    matchNames: ["astromaster 130", "astromaster130", "130eq"],
    telescopeName: "Celestron AstroMaster 130EQ",
    focalLengthMm: 650,
    apertureMm: 130,
    suggestsFlattenerComa: true,
  },
  {
    id: "celestron_astromaster_114eq",
    label: "Newtonian · Celestron AstroMaster 114EQ (1000 / 114)",
    matchNames: ["astromaster 114", "114eq"],
    telescopeName: "Celestron AstroMaster 114EQ",
    focalLengthMm: 1000,
    apertureMm: 114,
    suggestsFlattenerComa: true,
  },
  {
    id: "skywatcher_130pds",
    label: "Newtonian · Sky-Watcher Explorer 130PDS (650 / 130)",
    matchNames: ["130pds", "explorer 130pds"],
    telescopeName: "Sky-Watcher Explorer 130PDS",
    focalLengthMm: 650,
    apertureMm: 130,
    suggestsFlattenerComa: true,
  },
  {
    id: "skywatcher_150pds",
    label: "Newtonian · Sky-Watcher Explorer 150PDS (750 / 150)",
    matchNames: ["150pds", "explorer 150pds"],
    telescopeName: "Sky-Watcher Explorer 150PDS",
    focalLengthMm: 750,
    apertureMm: 150,
    suggestsFlattenerComa: true,
  },

  // —— SCTs / EdgeHD / Maks ——
  {
    id: "celestron_c5",
    label: "SCT · Celestron C5 (1250 / 125)",
    matchNames: ["c5", "celestron c5"],
    telescopeName: "Celestron C5",
    focalLengthMm: 1250,
    apertureMm: 125,
  },
  {
    id: "celestron_c6",
    label: "SCT · Celestron C6 (1500 / 150)",
    matchNames: ["c6", "celestron c6"],
    telescopeName: "Celestron C6",
    focalLengthMm: 1500,
    apertureMm: 150,
  },
  {
    id: "celestron_c8",
    label: "SCT · Celestron C8 (2032 / 203)",
    matchNames: ["c8", "celestron c8", "c8 xlt"],
    telescopeName: "Celestron C8",
    focalLengthMm: 2032,
    apertureMm: 203,
  },
  {
    id: "celestron_c8_edge",
    label: "SCT · Celestron EdgeHD 8 (2032 / 203)",
    matchNames: ["edgehd 8", "edge hd 8", "c8 edge"],
    telescopeName: "Celestron EdgeHD 8",
    focalLengthMm: 2032,
    apertureMm: 203,
  },
  {
    id: "celestron_c925",
    label: "SCT · Celestron C9.25 (2350 / 235)",
    matchNames: ["c9.25", "c925", "celestron 9.25"],
    telescopeName: "Celestron C9.25",
    focalLengthMm: 2350,
    apertureMm: 235,
  },
  {
    id: "celestron_c925_edge",
    label: "SCT · Celestron EdgeHD 9.25 (2350 / 235)",
    matchNames: ["edgehd 9.25", "edge hd 9.25"],
    telescopeName: "Celestron EdgeHD 9.25",
    focalLengthMm: 2350,
    apertureMm: 235,
  },
  {
    id: "celestron_c11",
    label: "SCT · Celestron C11 (2800 / 279)",
    matchNames: ["c11", "celestron c11"],
    telescopeName: "Celestron C11",
    focalLengthMm: 2800,
    apertureMm: 279,
  },
  {
    id: "celestron_c11_edge",
    label: "SCT · Celestron EdgeHD 11 (2800 / 279)",
    matchNames: ["edgehd 11", "edge hd 11"],
    telescopeName: "Celestron EdgeHD 11",
    focalLengthMm: 2800,
    apertureMm: 279,
  },
  {
    id: "celestron_c14",
    label: "SCT · Celestron C14 (3910 / 356)",
    matchNames: ["c14", "celestron c14"],
    telescopeName: "Celestron C14",
    focalLengthMm: 3910,
    apertureMm: 356,
  },
  {
    id: "meade_8_acf",
    label: "SCT · Meade 8″ ACF (2000 / 203)",
    matchNames: ["meade 8", "meade lx200 8", "8 acf"],
    telescopeName: "Meade 8″ ACF",
    focalLengthMm: 2000,
    apertureMm: 203,
  },
  {
    id: "skywatcher_skymax_127",
    label: "Mak · Sky-Watcher Skymax 127 (1500 / 127)",
    matchNames: ["skymax 127", "127 mak"],
    telescopeName: "Sky-Watcher Skymax 127",
    focalLengthMm: 1500,
    apertureMm: 127,
  },
  {
    id: "skywatcher_skymax_180",
    label: "Mak · Sky-Watcher Skymax 180 (2700 / 180)",
    matchNames: ["skymax 180", "180 mak"],
    telescopeName: "Sky-Watcher Skymax 180",
    focalLengthMm: 2700,
    apertureMm: 180,
  },

  // —— Ritchey–Chrétien ——
  {
    id: "gso_6_rc",
    label: "RC · GSO/Apertura 6″ f/9 RC (1370 / 152)",
    matchNames: ["6 rc", "6\" rc", "gso 6 rc", "apertura 6 rc"],
    telescopeName: "GSO 6″ Ritchey–Chrétien",
    focalLengthMm: 1370,
    apertureMm: 152,
  },
  {
    id: "gso_8_rc",
    label: "RC · GSO/Apertura 8″ f/8 RC (1624 / 203)",
    matchNames: ["8 rc", "8\" rc", "gso 8 rc", "apertura 8 rc"],
    telescopeName: "GSO 8″ Ritchey–Chrétien",
    focalLengthMm: 1624,
    apertureMm: 203,
  },
  {
    id: "gso_10_rc",
    label: "RC · GSO/Apertura 10″ f/8 RC (2000 / 254)",
    matchNames: ["10 rc", "10\" rc", "gso 10 rc"],
    telescopeName: "GSO 10″ Ritchey–Chrétien",
    focalLengthMm: 2000,
    apertureMm: 254,
  },
  {
    id: "ioptron_photron_150",
    label: "RC · iOptron Photron 150 RC (1370 / 150)",
    matchNames: ["photron 150", "ioptron 150 rc"],
    telescopeName: "iOptron Photron 150 RC",
    focalLengthMm: 1370,
    apertureMm: 150,
  },
  {
    id: "ioptron_photron_200",
    label: "RC · iOptron Photron 200 RC (1600 / 200)",
    matchNames: ["photron 200", "ioptron 200 rc"],
    telescopeName: "iOptron Photron 200 RC",
    focalLengthMm: 1600,
    apertureMm: 200,
  },

  // —— Camera lenses (common AP) ——
  {
    id: "rokinon_14",
    label: "Lens · Rokinon/Samyang 14mm f/2.8 (14 / 5)",
    matchNames: ["rokinon 14", "samyang 14", "14mm f/2.8"],
    telescopeName: "Rokinon 14mm f/2.8",
    focalLengthMm: 14,
    apertureMm: 5,
  },
  {
    id: "rokinon_24",
    label: "Lens · Rokinon/Samyang 24mm f/1.4 (24 / 17.1)",
    matchNames: ["rokinon 24", "samyang 24", "24mm f/1.4"],
    telescopeName: "Rokinon 24mm f/1.4",
    focalLengthMm: 24,
    apertureMm: 17.1,
  },
  {
    id: "rokinon_35",
    label: "Lens · Rokinon/Samyang 35mm f/1.4 (35 / 25)",
    matchNames: ["rokinon 35", "samyang 35", "35mm f/1.4"],
    telescopeName: "Rokinon 35mm f/1.4",
    focalLengthMm: 35,
    apertureMm: 25,
  },
  {
    id: "rokinon_85",
    label: "Lens · Rokinon/Samyang 85mm f/1.4 (85 / 60.7)",
    matchNames: ["rokinon 85", "samyang 85", "85mm f/1.4"],
    telescopeName: "Rokinon 85mm f/1.4",
    focalLengthMm: 85,
    apertureMm: 60.7,
  },
  {
    id: "rokinon_135",
    label: "Lens · Rokinon/Samyang 135mm f/2 (135 / 67.5)",
    matchNames: ["rokinon 135", "samyang 135", "135mm f/2"],
    telescopeName: "Rokinon 135mm f/2",
    focalLengthMm: 135,
    apertureMm: 67.5,
  },
  {
    id: "sigma_105_art",
    label: "Lens · Sigma 105mm f/1.4 Art (105 / 75)",
    matchNames: ["sigma 105", "105 art", "105mm f/1.4"],
    telescopeName: "Sigma 105mm f/1.4 Art",
    focalLengthMm: 105,
    apertureMm: 75,
  },
  {
    id: "sony_20_g",
    label: "Lens · Sony 20mm f/1.8 G (20 / 11.1)",
    matchNames: ["sony 20mm", "20mm f/1.8 g", "sel20f18g"],
    telescopeName: "Sony FE 20mm f/1.8 G",
    focalLengthMm: 20,
    apertureMm: 11.1,
  },
  {
    id: "canon_rf_50_12",
    label: "Lens · Canon RF 50mm f/1.2L (50 / 41.7)",
    matchNames: ["rf 50", "canon 50mm f/1.2"],
    telescopeName: "Canon RF 50mm f/1.2L",
    focalLengthMm: 50,
    apertureMm: 41.7,
  },
];

export function findKnownTelescopeByName(
  telescopeName: string,
): KnownTelescope | null {
  const n = telescopeName.trim().toLowerCase();
  if (!n) return null;
  // Prefer longer matchNames first to avoid C8 matching before EdgeHD 8, etc.
  const ranked = [...KNOWN_TELESCOPES].sort(
    (a, b) =>
      Math.max(...b.matchNames.map((m) => m.length)) -
      Math.max(...a.matchNames.map((m) => m.length)),
  );
  for (const t of ranked) {
    if (t.matchNames.some((m) => n.includes(m))) return t;
  }
  return null;
}

export function getKnownTelescopeById(id: string): KnownTelescope | null {
  return KNOWN_TELESCOPES.find((t) => t.id === id) ?? null;
}
