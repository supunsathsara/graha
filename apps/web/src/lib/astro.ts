/**
 * Graha — astrological constants & helpers shared across the UI.
 */

import { NAKSHATRA_NAMES } from "@graha/shared";

/** English nakshatra name → Sinhala (නැකත) name. */
export function nakNameSi(en: string): string {
  return NAKSHATRA_NAMES[en]?.si || "";
}

// Planet id → unicode glyph (Vedic tradition)
export const PLANET_GLYPHS: Record<number, string> = {
  0: "☉",
  1: "☽",
  2: "☿",
  3: "♀",
  4: "♂",
  5: "♃",
  6: "♄",
  7: "♅",
  8: "♆",
  9: "♇",
  10: "☊",
  11: "☋",
};

// Planet id → short label for chart cells
export const PLANET_SHORT: Record<number, string> = {
  0: "Su",
  1: "Mo",
  2: "Me",
  3: "Ve",
  4: "Ma",
  5: "Ju",
  6: "Sa",
  7: "Ur",
  8: "Ne",
  9: "Pl",
  10: "Ra",
  11: "Ke",
};

export const PLANET_NAME_BY_ID: Record<number, string> = {
  0: "Sun",
  1: "Moon",
  2: "Mercury",
  3: "Venus",
  4: "Mars",
  5: "Jupiter",
  6: "Saturn",
  7: "Uranus",
  8: "Neptune",
  9: "Pluto",
  10: "Rahu",
  11: "Ketu",
};

export const PLANET_IDS: Record<string, number> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  rahu: 10,
  ketu: 11,
};

export function getPlanetId(name: string): number {
  return PLANET_IDS[name.toLowerCase()] ?? -1;
}

export const ZODIAC_GLYPHS: Record<number, string> = {
  0: "♈",
  1: "♉",
  2: "♊",
  3: "♋",
  4: "♌",
  5: "♍",
  6: "♎",
  7: "♏",
  8: "♐",
  9: "♑",
  10: "♒",
  11: "♓",
};

export const ZODIAC_EN: string[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const SIGN_LORDS: Record<number, number> = {
  0: 4,
  1: 3,
  2: 2,
  3: 1,
  4: 0,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 6,
  11: 5,
};

// Dignity → semantic color role
export const DIGNITY_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> =
  {
    exalted: "good",
    moolatrikona: "good",
    own: "good",
    friendly: "good",
    neutral: "neutral",
    enemy: "warn",
    debilitated: "bad",
  };

export const HOUSE_SIGNIFICANCE: Record<number, string> = {
  1: "Self, body, personality",
  2: "Wealth, speech, family",
  3: "Courage, siblings, effort",
  4: "Home, mother, inner peace",
  5: "Intelligence, children, past merits",
  6: "Health, debts, obstacles",
  7: "Marriage, partnerships, public",
  8: "Longevity, transformation, occult",
  9: "Fortune, dharma, higher learning",
  10: "Career, status, karma",
  11: "Gains, networks, aspirations",
  12: "Loss, spirituality, foreign lands",
};

export const TIMEZONES: { id: string; label: string; offset: string }[] = [
  { id: "Asia/Colombo", label: "Sri Lanka", offset: "UTC+5:30" },
  { id: "Asia/Kolkata", label: "India", offset: "UTC+5:30" },
  { id: "Asia/Dhaka", label: "Bangladesh", offset: "UTC+6" },
  { id: "Asia/Karachi", label: "Pakistan", offset: "UTC+5" },
  { id: "Asia/Dubai", label: "UAE / Gulf", offset: "UTC+4" },
  { id: "Asia/Singapore", label: "Singapore / MY", offset: "UTC+8" },
  { id: "Australia/Sydney", label: "Australia East", offset: "UTC+10" },
  { id: "America/New_York", label: "US East", offset: "UTC−5/−4" },
  { id: "America/Los_Angeles", label: "US West", offset: "UTC−8/−7" },
  { id: "Europe/London", label: "UK", offset: "UTC+0/+1" },
  { id: "Europe/Berlin", label: "Central Europe", offset: "UTC+1/+2" },
  { id: "UTC", label: "UTC", offset: "UTC±0" },
];

export const SRI_LANKA_CITIES = [
  { name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { name: "Kandy", lat: 7.2906, lon: 80.6337 },
  { name: "Galle", lat: 6.0535, lon: 80.221 },
  { name: "Jaffna", lat: 9.6615, lon: 80.0255 },
  { name: "Kurunegala", lat: 7.4861, lon: 80.3648 },
];

/** Deterministic, stable hash → pastel color for a planet glyph chip. */
export function planetColor(id: number): string {
  const palette = [
    "text-turmeric",
    "text-ola-leaf",
    "text-[#8FB6C9]",
    "text-[#E8A0B4]",
    "text-[#C98A5E]",
    "text-[#D6B84F]",
    "text-[#A08CC9]",
    "text-[#7FC7A0]",
    "text-[#E07B54]",
    "text-[#B48C6A]",
    "text-[#8FA87E]",
    "text-[#C9A66E]",
  ];
  return palette[id % palette.length];
}

/** Format a longitude (0-360) as D°M′S″ sidereal position. */
export function formatLongitude(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  const deg = Math.floor(norm);
  const min = Math.floor((norm - deg) * 60);
  const sec = Math.round(((norm - deg) * 60 - min) * 60);
  return `${deg}°${String(min).padStart(2, "0")}′${String(sec).padStart(2, "0")}″`;
}
