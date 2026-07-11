/**
 * Graha — Shared types for frontend and backend.
 * Used by both apps/api and apps/web.
 */

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
  0: { en: "Aries", si: "මේෂ" },
  1: { en: "Taurus", si: "වෘෂභ" },
  2: { en: "Gemini", si: "මිථුන" },
  3: { en: "Cancer", si: "කටක" },
  4: { en: "Leo", si: "සිංහ" },
  5: { en: "Virgo", si: "කන්‍යා" },
  6: { en: "Libra", si: "තුලා" },
  7: { en: "Scorpio", si: "වෘශ්චික" },
  8: { en: "Sagittarius", si: "ධනු" },
  9: { en: "Capricorn", si: "මකර" },
  10: { en: "Aquarius", si: "කුම්භ" },
  11: { en: "Pisces", si: "මීන" },
};

// ─── Planets ─────────────────────────────────────────────────
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
  Rahu = 10,
  Ketu = 11,
}

export const PLANET_NAMES: Record<number, { en: string; si: string }> = {
  0: { en: "Sun", si: "ඉරු" },
  1: { en: "Moon", si: "සඳු" },
  2: { en: "Mercury", si: "බුද" },
  3: { en: "Venus", si: "සිකුරු" },
  4: { en: "Mars", si: "අඟහරු" },
  5: { en: "Jupiter", si: "ගුරු" },
  6: { en: "Saturn", si: "සෙනසුරු" },
  7: { en: "Uranus", si: "යුරේනස්" },
  8: { en: "Neptune", si: "නෙප්චූන්" },
  9: { en: "Pluto", si: "ප්ලූටෝ" },
  10: { en: "Rahu", si: "රාහු" },
  11: { en: "Ketu", si: "කේතු" },
};

// ─── Planet Position ─────────────────────────────────────────
export interface PlanetaryPosition {
  planet: Planet;
  name: { en: string; si: string };
  longitude: number;
  latitude: number;
  speed: number;
  sign: ZodiacSign;
  signDegree: number;
  house: number;
  nakshatra: string;
  nakshatraLord: string;
  isRetrograde: boolean;
  dignity: "exalted" | "moolatrikona" | "own" | "friendly" | "neutral" | "enemy" | "debilitated";
}

// ─── Houses ──────────────────────────────────────────────────
export interface House {
  number: number;
  startLongitude: number;
  endLongitude: number;
  sign: ZodiacSign;
  lord: Planet;
}

// ─── Dasa ────────────────────────────────────────────────────
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

// ─── Lagna ───────────────────────────────────────────────────
export interface Lagna {
  sign: ZodiacSign;
  degree: number;
  longitude: number;
}

// ─── Birth Chart ─────────────────────────────────────────────
export interface BirthChart {
  userId?: string;
  name?: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: string;
  lagna: Lagna;
  houses: House[];
  planets: PlanetaryPosition[];
  rasiChart: ZodiacSign[];
  navamsaChart: ZodiacSign[];
  currentDasa: DasaPeriod | null;
}

// ─── Interpretation ──────────────────────────────────────────
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

// ─── API Requests / Responses ────────────────────────────────
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
  chartId?: string;
  data?: BirthChart;
  error?: string;
}

export interface InterpretRequest extends ChartRequest {
  aiMode?: "polish" | "off" | "full";
  provider?: "groq" | "huggingface" | "auto";
}

export interface InterpretResponse {
  success: boolean;
  predictionId?: string;
  chart?: BirthChart;
  reading?: CompiledReading;
  error?: string;
}

// ─── Compiled Reading (API response shape) ──────────────────
export interface CompiledReading {
  interpretation: ChartInterpretation;
  houseInfluences: string[];
  yogas: { name: string; description: string }[];
  doshas: { name: string; description: string; severity: string }[];
  currentDasa: string | null;
  strengths: string[];
  challenges: string[];
  remedies: { planet: string; gem: string | null; mantra: string; action: string }[];
  favorablePlanets: string[];
  challengingPlanets: string[];
  navamsa: NavamsaData | null;
  aspects: AspectData | null;
  planetaryDignities: PlanetaryDignity[];
  panchamahapurushaYogas: { name: string; planet: string; description: string }[];
}

export interface NavamsaData {
  lagna: number;
  vargottamaPlanets: string[];
  marriageAnalysis: string[];
  planetPlacements: { planet: string; sign: string; interpretation: string }[];
}

export interface AspectData {
  summary: string[];
  details: {
    fromPlanet: string;
    fromHouse: number;
    toHouse: number;
    type: string;
    isBenefic: boolean;
    interpretation: string;
  }[];
}

export interface PlanetaryDignity {
  planet: string;
  dignity: string;
  explanation: string;
  isCombust: boolean;
  retrogradeEffect: string;
}
