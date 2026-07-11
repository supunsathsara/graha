// ─── Celestial Bodies ────────────────────────────────────────
export enum Planet {
  Sun = 0,
  Moon = 1,
  Mercury = 2,
  Venus = 3,
  Mars = 4,
  Jupiter = 5,
  Saturn = 6,
  Uranus = 7,
  Neptune = 8,
  Pluto = 9,
  // Vedic-specific nodes
  Rahu = 10,   // North Lunar Node
  Ketu = 11,   // South Lunar Node
  Lagna = 100, // Ascendant (calculated, not a planet)
}

/** Names in Sinhala & English */
export const PLANET_NAMES: Record<number, { en: string; si: string }> = {
  [Planet.Sun]:     { en: "Sun",        si: "ඉරු" },
  [Planet.Moon]:    { en: "Moon",       si: "සඳු" },
  [Planet.Mercury]: { en: "Mercury",    si: "බුද" },
  [Planet.Venus]:   { en: "Venus",      si: "සිකුරු" },
  [Planet.Mars]:    { en: "Mars",       si: "අඟහරු" },
  [Planet.Jupiter]: { en: "Jupiter",    si: "ගුරු" },
  [Planet.Saturn]:  { en: "Saturn",     si: "සෙනසුරු" },
  [Planet.Uranus]:  { en: "Uranus",     si: "යුරේනස්" },
  [Planet.Neptune]: { en: "Neptune",    si: "නෙප්චූන්" },
  [Planet.Pluto]:   { en: "Pluto",      si: "ප්ලූටෝ" },
  [Planet.Rahu]:    { en: "Rahu",       si: "රාහු" },
  [Planet.Ketu]:    { en: "Ketu",       si: "කේතු" },
};

// ─── Zodiac Signs ────────────────────────────────────────────
export enum ZodiacSign {
  Aries = 0,
  Taurus = 1,
  Gemini = 2,
  Cancer = 3,
  Leo = 4,
  Virgo = 5,
  Libra = 6,
  Scorpio = 7,
  Sagittarius = 8,
  Capricorn = 9,
  Aquarius = 10,
  Pisces = 11,
}

export const ZODIAC_NAMES: Record<number, { en: string; si: string }> = {
  [ZodiacSign.Aries]:      { en: "Aries",      si: "මේෂ" },
  [ZodiacSign.Taurus]:     { en: "Taurus",     si: "වෘෂභ" },
  [ZodiacSign.Gemini]:     { en: "Gemini",     si: "මිථුන" },
  [ZodiacSign.Cancer]:     { en: "Cancer",     si: "කටක" },
  [ZodiacSign.Leo]:        { en: "Leo",        si: "සිංහ" },
  [ZodiacSign.Virgo]:      { en: "Virgo",      si: "කන්‍යා" },
  [ZodiacSign.Libra]:      { en: "Libra",      si: "තුලා" },
  [ZodiacSign.Scorpio]:    { en: "Scorpio",    si: "වෘශ්චික" },
  [ZodiacSign.Sagittarius]:{ en: "Sagittarius",si: "ධනු" },
  [ZodiacSign.Capricorn]:  { en: "Capricorn",  si: "මකර" },
  [ZodiacSign.Aquarius]:   { en: "Aquarius",   si: "කුම්භ" },
  [ZodiacSign.Pisces]:     { en: "Pisces",     si: "මීන" },
};

// ─── Houses ──────────────────────────────────────────────────
export interface House {
  number: number;        // 1–12
  startLongitude: number;
  endLongitude: number;
  sign: ZodiacSign;
  lord: Planet;
}

// ─── Planetary Position ──────────────────────────────────────
export interface PlanetaryPosition {
  planet: Planet;
  name: { en: string; si: string };
  longitude: number;       // 0–360 degrees
  latitude: number;
  speed: number;           // positive = direct, negative = retrograde
  sign: ZodiacSign;
  signDegree: number;      // degrees within the sign (0–30)
  house: number;           // which house it falls in (1–12)
  nakshatra: string;       // Vedic lunar mansion
  nakshatraLord: string;   // Lord of the nakshatra
  isRetrograde: boolean;
  dignity: "exalted" | "moolatrikona" | "own" | "friendly" | "neutral" | "enemy" | "debilitated";
}

// ─── Full Birth Chart ────────────────────────────────────────
export interface BirthChart {
  userId?: string;
  name?: string;

  // Basic info
  birthDate: string;       // ISO date
  birthTime: string;       // HH:mm (24h)
  latitude: number;
  longitude: number;
  timezone: string;        // e.g. "Asia/Colombo"

  // Calculated
  lagna: {
    sign: ZodiacSign;
    degree: number;
    longitude: number;
  };
  houses: House[];
  planets: PlanetaryPosition[];

  // Vedic specifics
  rasiChart: ZodiacSign[];       // Rasi (moon sign) — 12 signs for 12 houses
  navamsaChart: ZodiacSign[];    // Navamsa D9 chart
  currentDasa: DasaPeriod | null;
}

// ─── Dasa (Planetary Periods) ────────────────────────────────
export interface DasaPeriod {
  lord: Planet;
  lordName: { en: string; si: string };
  startDate: string;
  endDate: string;
  totalYears: number;
  subPeriods: SubDasa[];
}

export interface SubDasa {
  lord: Planet;
  lordName: { en: string; si: string };
  startDate: string;
  endDate: string;
  totalMonths: number;
}

// ─── Prediction / Interpretation ─────────────────────────────
export interface ChartInterpretation {
  general: string;
  career: string;
  relationships: string;
  health: string;
  finance: string;
  strengths: string[];
  challenges: string[];
  favorablePlanets: string[];
  challengingPlanets: string[];
}

export interface DailyPrediction {
  date: string;
  overall: string;
  career: string;
  love: string;
  health: string;
  auspiciousTime: string | null;
  inauspiciousTime: string | null;
}

// ─── API Request / Response ──────────────────────────────────
export interface ChartRequest {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  name?: string;
}

export interface ChartResponse {
  success: boolean;
  data?: BirthChart;
  error?: string;
}

export interface PredictionRequest {
  chartId: string;
  type: "daily" | "weekly" | "monthly" | "general";
}

export interface PredictionResponse {
  success: boolean;
  data?: ChartInterpretation | DailyPrediction;
  error?: string;
}

// ─── User Profile ────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: string;
  chartId?: string;
  createdAt: string;
}
