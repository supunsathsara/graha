/**
 * Swiss Ephemeris wrapper for Vedic (Jyotish) astrological calculations.
 *
 * Uses Lahiri Ayanamsa (sidereal/Nirayana) for all positions.
 * Timezone conversion uses IANA database via luxon for historical accuracy.
 */
import { DateTime } from "luxon";
import swisseph from "swisseph";
import type {
  BirthChart,
  PlanetaryPosition,
  House,
  ZodiacSign,
  Planet,
  DasaPeriod,
  SubDasa,
} from "../types/chart.js";
import {
  ZODIAC_NAMES,
  PLANET_NAMES,
} from "../types/chart.js";
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
  if (path) {
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
  timezone: string
): number {
  // Use luxon to get the exact UTC time, accounting for historical timezone changes
  const dt = DateTime.fromISO(`${birthDate}T${birthTime}:00`, {
    zone: timezone || "Asia/Colombo",
  });

  if (!dt.isValid) {
    console.warn(`[Ephemeris] Invalid date/time: ${birthDate}T${birthTime} in ${timezone}`);
    // Fallback: use hardcoded offset
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hours, minutes] = birthTime.split(":").map(Number);
    const fallbackOffset = 5.5; // Sri Lanka standard
    return swisseph.swe_julday(year, month, day, hours - fallbackOffset + minutes / 60, swisseph.SE_GREG_CAL);
  }

  const utc = dt.toUTC();
  return swisseph.swe_julday(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600,
    swisseph.SE_GREG_CAL
  );
}

// ─── Planetary Position ────────────────────────────────────
export function getPlanetPosition(
  jd: number,
  planetId: number
): {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  rflag: number;
} | null {
  const result = swisseph.swe_calc_ut(jd, planetId, DEFAULT_FLAGS);
  if ("error" in result) {
    console.warn(`[Ephemeris] swe_calc_ut error for planet ${planetId}: ${(result as any).error}`);
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
export function getAllPlanetPositions(
  jd: number
): Array<{ planetId: number; longitude: number; latitude: number; speed: number }> {
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
    const rahuResult = swisseph.swe_calc_ut(jd, swisseph.SE_MEAN_NODE, DEFAULT_FLAGS);
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
  lon: number
): {
  ascendant: number;
  mc: number;
  cusps: number[];
} | null {
  const result = swisseph.swe_houses_ex(jd, DEFAULT_FLAGS, lat, lon, String.fromCharCode(HOUSE_SYSTEM));
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
  return (Math.floor(((longitude % 360 + 360) % 360) / 30) % 12) as ZodiacSign;
}

export function getSignDegree(longitude: number): number {
  return ((longitude % 360 + 360) % 360) % 30;
}

export function getHouseForLongitude(longitude: number, cusps: number[]): number {
  const normLon = (longitude % 360 + 360) % 360;
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

export function getNakshatra(longitude: number): { name: string; lord: string } {
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
  0: 0, 1: 1, 2: 5, 3: 11, 4: 9, 5: 3, 6: 6,
};
const DEBIL_SIGN: Record<number, number> = {
  0: 6, 1: 7, 2: 11, 3: 5, 4: 3, 5: 9, 6: 0,
};
const EXALTATION_DEG: Record<number, number> = {
  0: 10, 1: 3, 2: 15, 3: 27, 4: 28, 5: 5, 6: 20,
};

export function getDignity(
  planetId: number,
  longitude: number
): "exalted" | "debilitated" | "neutral" {
  if (!(planetId in EXALTATION_DEG)) return "neutral";
  const sign = getZodiacSign(longitude);
  const degree = getSignDegree(longitude);

  if (sign === EXALT_SIGN[planetId] && Math.abs(degree - EXALTATION_DEG[planetId]) < 6) {
    return "exalted";
  }
  if (sign === DEBIL_SIGN[planetId] && Math.abs(degree - EXALTATION_DEG[planetId]) < 6) {
    return "debilitated";
  }
  return "neutral";
}

// ─── Vimshottari Dasa ────────────────────────────────────────
const DASA_LORDS = [0, 1, 2, 3, 4, 5, 6, 10, 11] as const;
const DASA_YEARS = [6, 10, 7, 18, 16, 19, 17, 18, 7];

export function calculateCurrentDasa(birthJd: number, currentJd: number): DasaPeriod | null {
  const moonPos = getPlanetPosition(birthJd, 1);
  if (!moonPos) return null;

  const nakIndex = getNakshatraIndex(moonPos.longitude);
  const remainingDeg = getNakshatraRemaining(moonPos.longitude);
  const totalDeg = 13.33;
  const lordIndex = nakIndex % 9;
  const yearsInNak = DASA_YEARS[lordIndex];
  const elapsed = ((totalDeg - remainingDeg) / totalDeg) * yearsInNak;

  let remaining = yearsInNak - elapsed;
  let accumulator = 0;

  for (let i = 0; i < 9; i++) {
    const lord = (lordIndex + i + 1) % 9;
    const years = DASA_YEARS[lord];
    if (remaining <= years) {
      const planetId = DASA_LORDS[lord];
      return {
        lord: planetId as unknown as Planet,
        lordName: PLANET_NAMES[planetId] || { en: "Unknown", si: "නොදනී" },
        startDate: `${Math.round(accumulator)} years after birth`,
        endDate: `${Math.round(accumulator + years)} years after birth`,
        totalYears: years,
        subPeriods: generateSubDasas(planetId, years),
      };
    }
    remaining -= years;
    accumulator += years;
  }
  return null;
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

function generateSubDasas(mainLord: number, totalYears: number): SubDasa[] {
  const subDasas: SubDasa[] = [];
  const startIndex = DASA_LORDS.indexOf(mainLord as unknown as (typeof DASA_LORDS)[number]);
  if (startIndex === -1) return subDasas;

  let accumulatedMonths = 0;
  for (let i = 0; i < 9; i++) {
    const lordIndex = (startIndex + i) % 9;
    const planetId = DASA_LORDS[lordIndex];
    const subMonths = (DASA_YEARS[lordIndex] / 120) * totalYears * 12;
    subDasas.push({
      lord: planetId as unknown as Planet,
      lordName: PLANET_NAMES[planetId] || { en: "Unknown", si: "නොදනී" },
      startDate: `${Math.floor(accumulatedMonths / 12)}y ${Math.round(accumulatedMonths % 12)}m`,
      endDate: `${Math.floor((accumulatedMonths + subMonths) / 12)}y ${Math.round((accumulatedMonths + subMonths) % 12)}m`,
      totalMonths: Math.round(subMonths),
    });
    accumulatedMonths += subMonths;
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
      name: PLANET_NAMES[pos.planetId] || { en: `Planet ${pos.planetId}`, si: `ග්‍රහ ${pos.planetId}` },
      longitude: pos.longitude,
      latitude: pos.latitude,
      speed: pos.speed,
      sign,
      signDegree,
      house,
      nakshatra: nakshatra.name,
      nakshatraLord: nakshatra.lord,
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
    "UTC"
  );
  const currentDasa = calculateCurrentDasa(jd, nowJd);

  // Rasi chart based on Moon sign
  const moonPos = planets.find((p) => p.planet === 1);
  const rasiChart: ZodiacSign[] = [];
  if (moonPos) {
    for (let i = 0; i < 12; i++) {
      rasiChart.push(((moonPos.sign + i) % 12) as ZodiacSign);
    }
  }

  // Compute Navamsa (D9) chart
  const navamsaSigns = planets.map(p => getNavamsaSign(p.longitude) as ZodiacSign);

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
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function getSignLord(sign: ZodiacSign): Planet {
  const lords: Record<number, Planet> = {
    0: 4 as unknown as Planet, 1: 3 as unknown as Planet,
    2: 2 as unknown as Planet, 3: 1 as unknown as Planet,
    4: 0 as unknown as Planet, 5: 2 as unknown as Planet,
    6: 3 as unknown as Planet, 7: 4 as unknown as Planet,
    8: 5 as unknown as Planet, 9: 6 as unknown as Planet,
    10: 6 as unknown as Planet, 11: 5 as unknown as Planet,
  };
  return lords[sign];
}
