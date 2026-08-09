/**
 * Swiss Ephemeris wrapper for Vedic (Jyotish) astrological calculations.
 *
 * Uses Lahiri Ayanamsa (sidereal/Nirayana) for all positions.
 * Timezone conversion uses IANA database via luxon for historical accuracy.
 */
import { DateTime } from "luxon";
import swisseph from "swisseph";
import { createRequire } from "module";
import { existsSync } from "fs";
import { resolve } from "path";
import type {
  BirthChart,
  PlanetaryPosition,
  House,
  ZodiacSign,
  Planet,
  DasaPeriod,
  SubDasa,
} from "../types/chart.js";
import { ZODIAC_NAMES, PLANET_NAMES } from "../types/chart.js";
import { getNavamsaSign } from "./interpretations/navamsa.js";

// Swiss Ephemeris flag constants
const SEFLG_SPEED = 256;
const SEFLG_SWIEPH = 2;
const SEFLG_SIDEREAL = 65536;
const DEFAULT_FLAGS = SEFLG_SWIEPH | SEFLG_SPEED | SEFLG_SIDEREAL;

const PLANET_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const HOUSE_SYSTEM = "P".charCodeAt(0); // Placidus

// ─── Initialize ──────────────────────────────────────────────
export function initEphemeris(path?: string): void {
  // If no explicit path, use the ephemeris files bundled with the swisseph
  // package (falls back to the Moshier ephemeris if files are unavailable).
  if (!path) {
    try {
      const require = createRequire(import.meta.url);
      const bundled = resolve(require.resolve("swisseph"), "../../ephe");
      if (existsSync(bundled)) {
        swisseph.swe_set_ephe_path(bundled);
      }
    } catch {
      // no bundled files — swe_calc falls back to Moshier
    }
  } else {
    swisseph.swe_set_ephe_path(path);
  }
  // Set Lahiri Ayanamsa for Vedic sidereal calculations
  // This is the standard for Sri Lankan/Indian Jyotish astrology
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
}

// ─── Julian Day from local time ──────────────────────────────
export function localToJulianDay(
  birthDate: string,
  birthTime: string,
  timezone: string,
): number {
  // Use luxon to get the exact UTC time, accounting for historical timezone changes
  const dt = DateTime.fromISO(`${birthDate}T${birthTime}:00`, {
    zone: timezone || "Asia/Colombo",
  });

  if (!dt.isValid) {
    console.warn(
      `[Ephemeris] Invalid date/time: ${birthDate}T${birthTime} in ${timezone}`,
    );
    // Fallback: use hardcoded offset
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hours, minutes] = birthTime.split(":").map(Number);
    const fallbackOffset = 5.5; // Sri Lanka standard
    return swisseph.swe_julday(
      year,
      month,
      day,
      hours - fallbackOffset + minutes / 60,
      swisseph.SE_GREG_CAL,
    );
  }

  const utc = dt.toUTC();
  return swisseph.swe_julday(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600,
    swisseph.SE_GREG_CAL,
  );
}

// ─── Planetary Position ────────────────────────────────────
export function getPlanetPosition(
  jd: number,
  planetId: number,
): {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  rflag: number;
} | null {
  const result = swisseph.swe_calc_ut(jd, planetId, DEFAULT_FLAGS);
  if ("error" in result) {
    console.warn(
      `[Ephemeris] swe_calc_ut error for planet ${planetId}: ${(result as any).error}`,
    );
    return null;
  }
  if (!("longitude" in result)) {
    return null;
  }
  return {
    longitude: result.longitude,
    latitude: result.latitude,
    distance: result.distance,
    speed: result.longitudeSpeed,
    rflag: result.rflag,
  };
}

// ─── All Planets ─────────────────────────────────────────────
export function getAllPlanetPositions(jd: number): Array<{
  planetId: number;
  longitude: number;
  latitude: number;
  speed: number;
}> {
  const positions: Array<{
    planetId: number;
    longitude: number;
    latitude: number;
    speed: number;
  }> = [];

  for (const pid of PLANET_IDS) {
    const pos = getPlanetPosition(jd, pid);
    if (pos) {
      positions.push({ planetId: pid, ...pos });
    }
  }

  // Add Rahu (North Lunar Node) and Ketu (180° opposite)
  try {
    const rahuResult = swisseph.swe_calc_ut(
      jd,
      swisseph.SE_MEAN_NODE,
      DEFAULT_FLAGS,
    );
    if (!("error" in rahuResult) && "longitude" in rahuResult) {
      positions.push({
        planetId: 10, // Rahu
        longitude: rahuResult.longitude,
        latitude: rahuResult.latitude,
        speed: rahuResult.longitudeSpeed,
      });
      positions.push({
        planetId: 11, // Ketu
        longitude: (rahuResult.longitude + 180) % 360,
        latitude: 0,
        speed: rahuResult.longitudeSpeed,
      });
    }
  } catch {
    // nodes sometimes unavailable
  }

  return positions;
}

// ─── Houses & Ascendant ─────────────────────────────────────
export function getHouses(
  jd: number,
  lat: number,
  lon: number,
): {
  ascendant: number;
  mc: number;
  cusps: number[];
} | null {
  const result = swisseph.swe_houses_ex(
    jd,
    DEFAULT_FLAGS,
    lat,
    lon,
    String.fromCharCode(HOUSE_SYSTEM),
  );
  if ("error" in result) {
    console.warn(`[Ephemeris] swe_houses error: ${(result as any).error}`);
    return null;
  }
  return {
    ascendant: result.ascendant,
    mc: result.mc,
    cusps: result.house, // array of 12 house cusp longitudes
  };
}

// ─── Zodiac Sign Helpers ─────────────────────────────────────
export function getZodiacSign(longitude: number): ZodiacSign {
  return (Math.floor((((longitude % 360) + 360) % 360) / 30) %
    12) as ZodiacSign;
}

export function getSignDegree(longitude: number): number {
  return (((longitude % 360) + 360) % 360) % 30;
}

export function getHouseForLongitude(
  longitude: number,
  cusps: number[],
): number {
  const normLon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (end > start) {
      if (normLon >= start && normLon < end) return i + 1;
    } else {
      // wraps around 360°
      if (normLon >= start || normLon < end) return i + 1;
    }
  }
  return 1;
}

// ─── Nakshatra ───────────────────────────────────────────────
const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", range: [0, 13.33] },
  { name: "Bharani", lord: "Venus", range: [13.33, 26.67] },
  { name: "Krittika", lord: "Sun", range: [26.67, 40] },
  { name: "Rohini", lord: "Moon", range: [40, 53.33] },
  { name: "Mrigashira", lord: "Mars", range: [53.33, 66.67] },
  { name: "Ardra", lord: "Rahu", range: [66.67, 80] },
  { name: "Punarvasu", lord: "Jupiter", range: [80, 93.33] },
  { name: "Pushya", lord: "Saturn", range: [93.33, 106.67] },
  { name: "Ashlesha", lord: "Mercury", range: [106.67, 120] },
  { name: "Magha", lord: "Ketu", range: [120, 133.33] },
  { name: "Purva Phalguni", lord: "Venus", range: [133.33, 146.67] },
  { name: "Uttara Phalguni", lord: "Sun", range: [146.67, 160] },
  { name: "Hasta", lord: "Moon", range: [160, 173.33] },
  { name: "Chitra", lord: "Mars", range: [173.33, 186.67] },
  { name: "Swati", lord: "Rahu", range: [186.67, 200] },
  { name: "Vishakha", lord: "Jupiter", range: [200, 213.33] },
  { name: "Anuradha", lord: "Saturn", range: [213.33, 226.67] },
  { name: "Jyeshtha", lord: "Mercury", range: [226.67, 240] },
  { name: "Mula", lord: "Ketu", range: [240, 253.33] },
  { name: "Purva Ashadha", lord: "Venus", range: [253.33, 266.67] },
  { name: "Uttara Ashadha", lord: "Sun", range: [266.67, 280] },
  { name: "Shravana", lord: "Moon", range: [280, 293.33] },
  { name: "Dhanishta", lord: "Mars", range: [293.33, 306.67] },
  { name: "Shatabhisha", lord: "Rahu", range: [306.67, 320] },
  { name: "Purva Bhadrapada", lord: "Jupiter", range: [320, 333.33] },
  { name: "Uttara Bhadrapada", lord: "Saturn", range: [333.33, 346.67] },
  { name: "Revati", lord: "Mercury", range: [346.67, 360] },
];

export function getNakshatra(longitude: number): {
  name: string;
  lord: string;
} {
  const normLon = ((longitude % 360) + 360) % 360;
  for (const nak of NAKSHATRAS) {
    const [start, end] = nak.range;
    if (normLon >= start && normLon < end) {
      return { name: nak.name, lord: nak.lord };
    }
  }
  return { name: "Revati", lord: "Mercury" };
}

// ─── Planetary Dignity (simplified Vedic) ────────────────────
const EXALT_SIGN: Record<number, number> = {
  0: 0,
  1: 1,
  2: 5,
  3: 11,
  4: 9,
  5: 3,
  6: 6,
};
const DEBIL_SIGN: Record<number, number> = {
  0: 6,
  1: 7,
  2: 11,
  3: 5,
  4: 3,
  5: 9,
  6: 0,
};
const EXALTATION_DEG: Record<number, number> = {
  0: 10,
  1: 3,
  2: 15,
  3: 27,
  4: 28,
  5: 5,
  6: 20,
};

export function getDignity(
  planetId: number,
  longitude: number,
): "exalted" | "debilitated" | "neutral" {
  if (!(planetId in EXALTATION_DEG)) return "neutral";
  const sign = getZodiacSign(longitude);
  const degree = getSignDegree(longitude);

  if (
    sign === EXALT_SIGN[planetId] &&
    Math.abs(degree - EXALTATION_DEG[planetId]) < 6
  ) {
    return "exalted";
  }
  if (
    sign === DEBIL_SIGN[planetId] &&
    Math.abs(degree - EXALTATION_DEG[planetId]) < 6
  ) {
    return "debilitated";
  }
  return "neutral";
}

// ─── Vimshottari Dasa ────────────────────────────────────────
// The classic 120-year cycle, in correct Vimshottari order:
// Ketu(7) → Venus(20) → Sun(6) → Moon(10) → Mars(7) → Rahu(18)
//         → Jupiter(16) → Saturn(19) → Mercury(17)  = 120 years.
const DASA_SEQUENCE = [11, 3, 0, 1, 4, 10, 5, 6, 2] as const; // planet ids
const DASA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

const NAKSHATRA_DEG = 360 / 27; // 13°20′
const DAYS_PER_YEAR = 365.25;

interface DasaTimelineEntry {
  lord: Planet;
  lordName: { en: string; si: string };
  startDate: string; // ISO date (local birth timezone)
  endDate: string;
  totalYears: number;
  subPeriods: SubDasa[];
}

function isoDate(date: DateTime): string {
  return date.toISODate() || "";
}

function addYears(date: DateTime, years: number): DateTime {
  return date.plus({ days: Math.round(years * DAYS_PER_YEAR) });
}

/**
 * Full Vimshottari Mahadasa timeline (9 periods) with real calendar dates.
 *
 * The birth dasa is the lord of the Moon's nakshatra. Its remaining balance
 * at birth = (degrees left in the nakshatra / 13°20′) × the lord's years;
 * the dasa itself is considered to have begun at birth with that balance.
 * Subsequent Mahadasas run for their full classical durations, chained
 * without gaps, ending 120 − (elapsed) years after birth.
 */
export function computeVimshottariTimeline(
  birthJd: number,
  birthLocal: DateTime,
): DasaTimelineEntry[] {
  const moonPos = getPlanetPosition(birthJd, 1);
  if (!moonPos) return [];

  const nakIndex = getNakshatraIndex(moonPos.longitude);
  const remainingDeg = getNakshatraRemaining(moonPos.longitude);
  const birthLordIdx = nakIndex % 9;

  // Balance of the birth Mahadasa remaining at the moment of birth.
  const balanceYears =
    (remainingDeg / NAKSHATRA_DEG) * DASA_YEARS[birthLordIdx];

  const timeline: DasaTimelineEntry[] = [];
  let cursor = birthLocal;

  for (let i = 0; i < 9; i++) {
    const idx = (birthLordIdx + i) % 9;
    const lordId = DASA_SEQUENCE[idx];
    const years = i === 0 ? balanceYears : DASA_YEARS[idx];
    const start = cursor;
    const end = addYears(start, years);

    timeline.push({
      lord: lordId as unknown as Planet,
      lordName: PLANET_NAMES[lordId] || { en: "Unknown", si: "නොදනී" },
      startDate: isoDate(start),
      endDate: isoDate(end),
      totalYears: Math.round(years * 100) / 100,
      subPeriods: generateSubDasas(lordId, years, start),
    });

    cursor = end;
  }

  return timeline;
}

/**
 * Current Dasa — the Mahadasa active at `currentJd` (defaults to now),
 * found from the correct timeline with real dates.
 */
export function calculateCurrentDasa(
  birthJd: number,
  currentJd: number,
  birthLocal: DateTime,
): DasaPeriod | null {
  const timeline = computeVimshottariTimeline(birthJd, birthLocal);
  if (!timeline.length) return null;

  const now = DateTime.fromMillis((currentJd - 2440587.5) * 86400000, {
    zone: "UTC",
  });

  // Find the period whose [start, end) window contains "now".
  const active =
    timeline.find((p) => {
      const s = DateTime.fromISO(p.startDate + "T00:00:00");
      const e = DateTime.fromISO(p.endDate + "T00:00:00");
      return now >= s && now < e;
    }) || timeline[0];

  return {
    lord: active.lord,
    lordName: active.lordName,
    startDate: active.startDate,
    endDate: active.endDate,
    totalYears: active.totalYears,
    subPeriods: active.subPeriods,
  };
}

function getNakshatraIndex(longitude: number): number {
  const normLon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < NAKSHATRAS.length; i++) {
    const [start, end] = NAKSHATRAS[i].range;
    if (normLon >= start && normLon < end) return i;
  }
  return 26;
}

function getNakshatraRemaining(longitude: number): number {
  const normLon = ((longitude % 360) + 360) % 360;
  for (const nak of NAKSHATRAS) {
    const [start, end] = nak.range;
    if (normLon >= start && normLon < end) return end - normLon;
  }
  return 360 - normLon;
}

/**
 * Antardasas within a Mahadasa: each sub-period lasts
 * (subLordYears / 120) × mahadasaYears, with real dates.
 */
function generateSubDasas(
  mainLord: number,
  totalYears: number,
  start: DateTime,
): SubDasa[] {
  const subDasas: SubDasa[] = [];
  const startIndex = DASA_SEQUENCE.indexOf(
    mainLord as unknown as (typeof DASA_SEQUENCE)[number],
  );
  if (startIndex === -1) return subDasas;

  let cursor = start;
  for (let i = 0; i < 9; i++) {
    const idx = (startIndex + i) % 9;
    const lordId = DASA_SEQUENCE[idx];
    const subYears = (DASA_YEARS[idx] / 120) * totalYears;
    const end = addYears(cursor, subYears);
    subDasas.push({
      lord: lordId as unknown as Planet,
      lordName: PLANET_NAMES[lordId] || { en: "Unknown", si: "නොදනී" },
      startDate: isoDate(cursor),
      endDate: isoDate(end),
      totalMonths: Math.round(subYears * 12),
    });
    cursor = end;
  }
  return subDasas;
}

// ─── Full Birth Chart Computation ────────────────────────────
export function computeBirthChart(params: {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  name?: string;
}): BirthChart {
  const { birthDate, birthTime, latitude, longitude, timezone, name } = params;

  // Convert local birth time to Julian Day using luxon (handles historical timezone changes)
  const jd = localToJulianDay(birthDate, birthTime, timezone || "Asia/Colombo");

  // Get planetary positions
  const planetPositions = getAllPlanetPositions(jd);
  const houses = getHouses(jd, latitude, longitude);
  const ascendant = houses?.ascendant ?? 0;
  const cusps = houses?.cusps ?? Array.from({ length: 12 }, (_, i) => i * 30);

  // Build planets with Vedic details
  const planets: PlanetaryPosition[] = planetPositions.map((pos) => {
    const sign = getZodiacSign(pos.longitude);
    const signDegree = getSignDegree(pos.longitude);
    const house = getHouseForLongitude(pos.longitude, cusps);
    const nakshatra = getNakshatra(pos.longitude);

    return {
      planet: pos.planetId as unknown as Planet,
      name: PLANET_NAMES[pos.planetId] || {
        en: `Planet ${pos.planetId}`,
        si: `ග්‍රහ ${pos.planetId}`,
      },
      longitude: pos.longitude,
      latitude: pos.latitude,
      speed: pos.speed,
      sign,
      signDegree,
      house,
      nakshatra: nakshatra.name,
      nakshatraLord: nakshatra.lord,
      nakshatraPada: Math.floor((pos.longitude % 13.333333) / 3.333333) + 1,
      isRetrograde: pos.speed < 0,
      dignity: getDignity(pos.planetId, pos.longitude),
    };
  });

  // Build houses
  const houseList: House[] = cusps.slice(0, 12).map((cusp, i) => {
    const sign = getZodiacSign(cusp);
    const nextCusp = cusps[(i + 1) % 12];
    return {
      number: i + 1,
      startLongitude: cusp,
      endLongitude: nextCusp,
      sign,
      lord: getSignLord(sign),
    };
  });

  // Current Dasa
  const now = new Date();
  const nowJd = localToJulianDay(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    "UTC",
  );

  // Birth moment in local time — anchors all Dasa dates.
  const birthLocal = DateTime.fromMillis((jd - 2440587.5) * 86400000, {
    zone: timezone || "Asia/Colombo",
  });
  const currentDasa = calculateCurrentDasa(jd, nowJd, birthLocal);
  const dasaTimeline = computeVimshottariTimeline(jd, birthLocal);

  // Rasi chart based on Moon sign
  const moonPos = planets.find((p) => p.planet === 1);
  const rasiChart: ZodiacSign[] = [];
  if (moonPos) {
    for (let i = 0; i < 12; i++) {
      rasiChart.push(((moonPos.sign + i) % 12) as ZodiacSign);
    }
  }

  // Compute Navamsa (D9) chart
  const navamsaSigns = planets.map(
    (p) => getNavamsaSign(p.longitude) as ZodiacSign,
  );

  return {
    name,
    birthDate,
    birthTime,
    latitude,
    longitude,
    timezone: timezone || "Asia/Colombo",
    lagna: {
      sign: getZodiacSign(ascendant),
      degree: getSignDegree(ascendant),
      longitude: ascendant,
    },
    houses: houseList,
    planets,
    rasiChart,
    navamsaChart: navamsaSigns,
    currentDasa,
    dasaTimeline,
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function getSignLord(sign: ZodiacSign): Planet {
  const lords: Record<number, Planet> = {
    0: 4 as unknown as Planet,
    1: 3 as unknown as Planet,
    2: 2 as unknown as Planet,
    3: 1 as unknown as Planet,
    4: 0 as unknown as Planet,
    5: 2 as unknown as Planet,
    6: 3 as unknown as Planet,
    7: 4 as unknown as Planet,
    8: 5 as unknown as Planet,
    9: 6 as unknown as Planet,
    10: 6 as unknown as Planet,
    11: 5 as unknown as Planet,
  };
  return lords[sign];
}
