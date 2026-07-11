/**
 * Navamsa (D9) divisional chart calculator.
 *
 * The Navamsa chart is the most important divisional chart (Varga) in Vedic astrology.
 * It reveals the true strength of planets and is essential for analyzing:
 *   - Marriage and relationships (primary use)
 *   - Dharma and purpose
 *   - Hidden potential of each planet
 *
 * Each sign (30°) is divided into 9 equal parts of 3°20' each.
 * The mapping of parts to Navamsa signs follows the sign's nature:
 *   - Movable (Chara): Aries, Cancer, Libra, Capricorn → starts from Aries
 *   - Fixed (Sthira): Taurus, Leo, Scorpio, Aquarius → starts from Leo
 *   - Dual (Dwisvabhava): Gemini, Virgo, Sagittarius, Pisces → starts from Sagittarius
 */
import type { BirthChart, ZodiacSign, PlanetaryPosition } from "../../types/chart.js";

const NAVAMSA_DEG = 30 / 9; // 3.333... degrees per navamsa section

/**
 * Determines the nature of a zodiac sign.
 */
function getSignNature(sign: number): "movable" | "fixed" | "dual" {
  const movable = [0, 3, 6, 9];   // Aries, Cancer, Libra, Capricorn
  const fixed = [1, 4, 7, 10];     // Taurus, Leo, Scorpio, Aquarius
  // remaining: Gemini(2), Virgo(5), Sagittarius(8), Pisces(11) — dual
  if (movable.includes(sign)) return "movable";
  if (fixed.includes(sign)) return "fixed";
  return "dual";
}

/**
 * Gets the starting Navamsa sign for a given sign.
 */
function getNavamsaStart(sign: number): number {
  const nature = getSignNature(sign);
  switch (nature) {
    case "movable": return 0;  // Aries
    case "fixed":   return 4;  // Leo
    case "dual":    return 8;  // Sagittarius
  }
}

/**
 * Computes the Navamsa (D9) sign for a given longitude.
 */
export function getNavamsaSign(longitude: number): number {
  const normLon = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normLon / 30);
  const degInSign = normLon % 30;
  const navPart = Math.floor(degInSign / NAVAMSA_DEG); // 0-8
  const startSign = getNavamsaStart(sign);
  return (startSign + navPart) % 12;
}

/**
 * Computes the full Navamsa (D9) chart positions for all planets.
 */
export function computeNavamsaChart(chart: BirthChart): {
  /** Planet positions in D9 chart (12-sign array, each position is the planetId or null) */
  planetsInNavamsa: Array<{ planetId: number; navamsaSign: number }>;
  /** Navamsa Lagna (ascendant in D9) */
  navamsaLagna: number;
  /** Whether this Navamsa chart is Vargottama (planet in same sign in Rasi and Navamsa) */
  vargottamaPlanets: number[];
} {
  const planetsInNavamsa: Array<{ planetId: number; navamsaSign: number }> = [];
  const vargottamaPlanets: number[] = [];

  for (const planet of chart.planets) {
    const navSign = getNavamsaSign(planet.longitude);
    planetsInNavamsa.push({
      planetId: planet.planet as unknown as number,
      navamsaSign: navSign,
    });

    // Vargottama: planet is in the same sign in both Rasi and D9
    if (navSign === planet.sign) {
      vargottamaPlanets.push(planet.planet as unknown as number);
    }
  }

  // Navamsa Lagna = D9 sign of the ascendant longitude
  const navamsaLagna = getNavamsaSign(chart.lagna.longitude);

  return {
    planetsInNavamsa,
    navamsaLagna,
    vargottamaPlanets,
  };
}

/**
 * Builds a simplified Navamsa chart array (12 signs for each house).
 */
export function buildNavamsaChartArray(
  rasiChart: ZodiacSign[],
  planetsInNavamsa: Array<{ planetId: number; navamsaSign: number }>
): ZodiacSign[] {
  // The Navamsa chart houses are based on the Navamsa Lagna
  // For a simplified version, return the navamsa sign for each planet
  const navamsaSigns: ZodiacSign[] = [];

  for (const p of planetsInNavamsa) {
    navamsaSigns.push(p.navamsaSign as ZodiacSign);
  }

  return navamsaSigns;
}

/**
 * Interpret a planet in Navamsa for marriage/relationship analysis.
 */
export function getNavamsaPlanetInterpretation(
  planetId: number,
  navamsaSign: number,
  isVargottama: boolean
): string {
  const planetName = getPlanetName(planetId);
  const signName = getSignName(navamsaSign);
  let text = `In D9 Navamsa chart, ${planetName} is placed in ${signName}. `;

  if (isVargottama) {
    text += `This planet is Vargottama — in the same sign in both Rasi and Navamsa. This greatly strengthens the planet and its significations. The planet's energy is pure and unobstructed. `;
  }

  // Planet-specific Navamsa interpretations
  const navamsaTexts: Record<number, Record<number, string>> = {
    0: { // Sun in Navamsa
      0: "Sun in Aries Navamsa: Strong leadership, courageous, natural authority.",
      3: "Sun in Cancer Navamsa: Emotional leadership, protective authority.",
      4: "Sun in Leo Navamsa: Royal, confident, generous, creative power.",
      6: "Sun in Libra Navamsa: Balanced leadership, diplomatic authority.",
      9: "Sun in Capricorn Navamsa: Disciplined authority, ambitious leader.",
    },
    1: { // Moon in Navamsa
      1: "Moon in Taurus Navamsa: Stable emotions, nurturing, comfort-seeking.",
      3: "Moon in Cancer Navamsa: Deep emotions, intuitive, psychic sensitivity.",
      4: "Moon in Leo Navamsa: Dramatic emotions, warm-hearted, creative.",
      7: "Moon in Scorpio Navamsa: Intense emotions, transformative, secretive.",
      11: "Moon in Pisces Navamsa: Dreamy, compassionate, artistic, spiritual.",
    },
    3: { // Venus in Navamsa (key for marriage)
      1: "Venus in Taurus Navamsa: Strong marriage, sensual, loyal partner.",
      3: "Venus in Cancer Navamsa: Nurturing love, emotional bonding, family-oriented marriage.",
      4: "Venus in Leo Navamsa: Passionate romance, generous partner, creative relationship.",
      6: "Venus in Libra Navamsa: Harmonious marriage, diplomatic partner, balanced relationship.",
      7: "Venus in Scorpio Navamsa: Intense love, transformative marriage, deep bonding.",
      11: "Venus in Pisces Navamsa: Divine love, spiritual partnership, artistic union.",
    },
    5: { // Jupiter in Navamsa (dharma)
      3: "Jupiter in Cancer Navamsa: Supreme wisdom, nurturing, divine knowledge.",
      8: "Jupiter in Sagittarius Navamsa: Philosopher, guru, righteous.",
      11: "Jupiter in Pisces Navamsa: Spiritual genius, divine wisdom.",
    },
    6: { // Saturn in Navamsa
      6: "Saturn in Libra Navamsa: Just, balanced, fair authority.",
      9: "Saturn in Capricorn Navamsa: Maximum discipline, ambition.",
      10: "Saturn in Aquarius Navamsa: Humanitarian, innovative discipline.",
    },
  };

  const planetSpecific = navamsaTexts[planetId]?.[navamsaSign];
  if (planetSpecific) {
    text += planetSpecific;
  }

  return text;
}

function getPlanetName(planetId: number): string {
  const names: Record<number, string> = {
    0: "Sun", 1: "Moon", 2: "Mercury", 3: "Venus", 4: "Mars",
    5: "Jupiter", 6: "Saturn", 10: "Rahu", 11: "Ketu",
  };
  return names[planetId] || `Planet ${planetId}`;
}

function getSignName(sign: number): string {
  const names = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  return names[sign] || "Unknown";
}
