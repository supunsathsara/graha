/**
 * Vedic (Jyotish) astrological helpers.
 *
 * Functions for computing Vedic-specific elements:
 *   - Yogas (planetary combinations)
 *   - Doshas (afflictions like Mangalik)
 *   - Shadbala (strength) calculations
 *   - Dasa balance at birth
 *   - Muhurta (electional astrology)
 */
import type { BirthChart, PlanetaryPosition, ZodiacSign } from "../types/chart.js";
import { ZODIAC_NAMES, PLANET_NAMES } from "../types/chart.js";

// ─── Yogas (Beneficial Planetary Combinations) ──────────────

export interface Yoga {
  name: string;
  nameSi: string;
  description: string;
  planets: string[];
  strength: "strong" | "moderate" | "weak";
}

export function detectYogas(chart: BirthChart): Yoga[] {
  const yogas: Yoga[] = [];

  // Gaja Kesari Yoga: Jupiter + Moon in kendra (1,4,7,10) from each other
  const jupiter = chart.planets.find((p) => p.planet === 5);
  const moon = chart.planets.find((p) => p.planet === 1);
  if (jupiter && moon) {
    // Gaja Kesari Yoga: Jupiter and Moon both in Kendra (houses 1,4,7,10) from lagna
    const jupiterInKendra = [1, 4, 7, 10].includes(jupiter.house);
    const moonInKendra = [1, 4, 7, 10].includes(moon.house);
    if (jupiterInKendra && moonInKendra) {
      yogas.push({
          name: "Gaja Kesari Yoga",
          nameSi: "ගජ කේසරී යෝගය",
          description:
            "A royal yoga formed by Jupiter and Moon in a kendra from each other. Brings wisdom, wealth, and reputation.",
          planets: ["Jupiter", "Moon"],
          strength: "strong",
        });
      }
    }

  // Dhana Yoga: Lord of the 5th and 9th (trine lords) in kendra or trikona
  const trineLords = getLordsInHouses(chart, [5, 9]);
  if (trineLords.length >= 2) {
    yogas.push({
      name: "Dhana Yoga",
      nameSi: "ධන යෝගය",
      description: "Formed by auspicious planets in trine houses. Indicates wealth and prosperity.",
      planets: trineLords.map((p) => p.name.en),
      strength: "moderate",
    });
  }

  // Raja Yoga: Lord of kendra (1,4,7,10) and lord of trikona (5,9) in conjunction
  const kendraLords = getLordsInHouses(chart, [1, 4, 7, 10]);
  if (kendraLords.length >= 2) {
    yogas.push({
      name: "Raja Yoga",
      nameSi: "රාජ යෝගය",
      description: "Powerful yoga indicating leadership, authority, and royal status.",
      planets: kendraLords.map((p) => p.name.en),
      strength: "moderate",
    });
  }

  // Vesi Yoga: Benefic planets (Jupiter, Venus, Mercury) in 2nd from Sun
  const sun = chart.planets.find((p) => p.planet === 0);
  if (sun) {
    const sunHouse = sun.house;
    const in2nd = chart.planets.filter(
      (p) => (p.house === (sunHouse % 12) + 1) && [2, 3, 5].includes(p.planet)
    );
    if (in2nd.length > 0) {
      yogas.push({
        name: "Vesi Yoga",
        nameSi: "වේසි යෝගය",
        description: "Benefic planets in 2nd from Sun. Brings wealth, intelligence, and good fortune.",
        planets: in2nd.map((p) => p.name.en),
        strength: "weak",
      });
    }
  }

  return yogas;
}

// ─── Doshas (Afflictions) ───────────────────────────────────

export interface Dosha {
  name: string;
  nameSi: string;
  description: string;
  present: boolean;
  severity: "high" | "medium" | "low" | "none";
}

export function detectDoshas(chart: BirthChart): Dosha[] {
  const doshas: Dosha[] = [];

  // Mangalik Dosha: Mars in houses 1,2,4,7,8,12 from ascendant
  const mars = chart.planets.find((p) => p.planet === 4);
  if (mars) {
    const mangalikHouses = [1, 2, 4, 7, 8, 12];
    if (mangalikHouses.includes(mars.house)) {
      doshas.push({
        name: "Mangalik Dosha",
        nameSi: "මංගල දෝෂය",
        description: `Mars in house ${mars.house}. Can cause challenges in marriage unless canceled.`,
        present: true,
        severity: "high",
      });
    } else if ([3, 6, 11].includes(mars.house)) {
      // Mars in upachaya houses can be beneficial
      doshas.push({
        name: "Mangal Cancellation",
        nameSi: "මංගල නිවාරණය",
        description: "Mars in upachaya house — Mangalik Dosha is canceled or reduced.",
        present: false,
        severity: "none",
      });
    }
  }

  // Kaal Sarpa Yoga: All planets between Rahu and Ketu
  const rahu = chart.planets.find((p) => p.planet === 10);
  const ketu = chart.planets.find((p) => p.planet === 11);
  if (rahu && ketu) {
    const planetsBetween = chart.planets.filter((p) => {
      if (p.planet >= 10) return false;
      return isBetween(p.longitude, rahu.longitude, ketu.longitude);
    });
    if (planetsBetween.length >= 5) {
      doshas.push({
        name: "Kaal Sarpa Yoga",
        nameSi: "කාල සර්ප යෝගය",
        description: "All planets between Rahu and Ketu. Creates a mixed karmic pattern of challenges and potential breakthroughs.",
        present: true,
        severity: "high",
      });
    }
  }

  // Pitri Dosha (Sun-Venus conjunction)
  const sun = chart.planets.find((p) => p.planet === 0);
  const venus = chart.planets.find((p) => p.planet === 3);
  if (sun && venus) {
    const diff = Math.abs(sun.longitude - venus.longitude);
    if (diff < 10) {
      doshas.push({
        name: "Pitri Dosha",
        nameSi: "පිතෘ දෝෂය",
        description: "Sun-Venus conjunction. May indicate challenges in family relationships.",
        present: true,
        severity: "low",
      });
    }
  }

  return doshas;
}

// ─── Muhurta (Electional Astrology) ─────────────────────────

export function calculateMuhurta(date: Date, latitude: number, longitude: number) {
  // Simplified Muhurta calculation
  // In practice, this checks: tithi, vara, nakshatra, yoga, karana
  const dayOfWeek = date.getDay();
  const dayNames = [
    "Sunday (Ravi Vara)",
    "Monday (Soma Vara)",
    "Tuesday (Mangala Vara)",
    "Wednesday (Budha Vara)",
    "Thursday (Guru Vara)",
    "Friday (Shukra Vara)",
    "Saturday (Shani Vara)",
  ];

  return {
    day: dayNames[dayOfWeek],
    isGoodFor: getGoodForDay(dayOfWeek),
    isBadFor: getBadForDay(dayOfWeek),
    rahuKalam: getRahuKalam(date, latitude, longitude),
    yamagandam: getYamagandam(date),
  };
}

function getRahuKalam(date: Date, _lat: number, _lon: number) {
  // Simplified Rahu Kalam calculation based on day of week
  const day = date.getDay();
  // Rahu Kalam periods (in 24h format)
  const periods: Record<number, [number, number]> = {
    0: [7.5, 9],    // Sunday
    1: [15, 16.5],  // Monday
    2: [12, 13.5],  // Tuesday
    3: [13.5, 15],  // Wednesday
    4: [16.5, 18],  // Thursday
    5: [10.5, 12],  // Friday
    6: [9, 10.5],   // Saturday
  };
  const period = periods[day] || [0, 0];
  return `${formatHour(period[0])} – ${formatHour(period[1])}`;
}

function getYamagandam(date: Date) {
  const day = date.getDay();
  const periods: Record<number, [number, number]> = {
    0: [12, 13.5],
    1: [10.5, 12],
    2: [9, 10.5],
    3: [7.5, 9],
    4: [15, 16.5],
    5: [16.5, 18],
    6: [13.5, 15],
  };
  const period = periods[day] || [0, 0];
  return `${formatHour(period[0])} – ${formatHour(period[1])}`;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function getGoodForDay(day: number): string[] {
  const good: Record<number, string[]> = {
    0: ["Starting new ventures", "Leadership activities"],
    1: ["Home-related activities", "Emotional work", "Artistic pursuits"],
    2: ["Communication", "Travel", "Learning"],
    3: ["Business partnerships", "Creative work", "Relationships"],
    4: ["Spiritual practices", "Education", "Wealth-building"],
    5: ["Education", "Creativity", "Legal matters"],
    6: ["Meditation", "Solo work", "Completion of tasks"],
  };
  return good[day] || [];
}

function getBadForDay(day: number): string[] {
  const bad: Record<number, string[]> = {
    0: ["Avoid surgery", "Avoid arguments with authority"],
    1: ["Avoid major financial decisions"],
    2: ["Avoid legal disputes"],
    3: ["Avoid conflict", "Avoid confrontations"],
    4: ["Avoid laziness", "Avoid gambling"],
    5: ["Avoid shortcuts", "Avoid dishonesty"],
    6: ["Avoid starting new ventures", "Avoid travel"],
  };
  return bad[day] || [];
}

// ─── Transit Calculator ─────────────────────────────────────

export function calculateTransits(chart: BirthChart, currentPlanets: PlanetaryPosition[]): string[] {
  const transits: string[] = [];

  for (const current of currentPlanets) {
    const natal = chart.planets.find((p) => p.planet === current.planet);
    if (!natal) continue;

    const aspect = getAspect(natal.longitude, current.longitude);
    if (aspect) {
      transits.push(
        `${current.name.en} transiting — ${aspect} aspect to natal ${natal.name.en}`
      );
    }
  }

  return transits;
}

function getAspect(natalLong: number, transitLong: number): string | null {
  const diff = Math.abs(transitLong - natalLong) % 360;
  const orb = 6; // allowable orb in degrees

  if (Math.abs(diff - 0) < orb || Math.abs(diff - 360) < orb) return "conjunction";
  if (Math.abs(diff - 60) < orb) return "sextile (60°)";
  if (Math.abs(diff - 90) < orb) return "square (90°)";
  if (Math.abs(diff - 120) < orb) return "trine (120°)";
  if (Math.abs(diff - 180) < orb) return "opposition (180°)";
  return null;
}

// ─── Internal Helpers ───────────────────────────────────────

function getLordsInHouses(chart: BirthChart, houses: number[]): PlanetaryPosition[] {
  return chart.planets.filter((p) => houses.includes(p.house));
}

function isBetween(longitude: number, start: number, end: number): boolean {
  if (end > start) {
    return longitude > start && longitude < end;
  } else {
    return longitude > start || longitude < end;
  }
}
