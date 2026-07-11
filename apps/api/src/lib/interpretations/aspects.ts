/**
 * Vedic planetary aspects (Graha Drishti).
 *
 * In Vedic astrology each planet aspects specific houses from its position:
 *   - All planets aspect the 7th house from themselves (universal aspect)
 *   - Mars additionally aspects the 4th and 8th
 *   - Saturn additionally aspects the 3rd and 10th
 *   - Jupiter additionally aspects the 5th and 9th
 *   - Rahu/Ketu behave like Saturn (some traditions say they aspect 5th, 9th)
 *
 * Aspect strength varies by type:
 *   - 7th aspect: full strength (100%)
 *   - Special aspects (Mars/Saturn/Jupiter): 75%
 *   - Other planetary aspects to own sign: 50%
 */
import type { PlanetaryPosition, BirthChart } from "../../types/chart.js";
import { ZODIAC_NAMES } from "../../types/chart.js";

export type AspectType = "full" | "special" | "partial";

export interface Aspect {
  /** The planet doing the aspecting */
  fromPlanet: { id: number; name: string; house: number };
  /** The house being aspected (1-12) */
  toHouse: number;
  /** The type of aspect */
  type: AspectType;
  /** The aspect angle */
  angle: number;
  /** Whether this is a natural benefic aspect */
  isBenefic: boolean;
  /** Interpretation of this aspect */
  interpretation: string;
}

// ─── Aspect Rules ──────────────────────────────────────────
interface AspectRule {
  planetId: number;
  offsets: number[]; // houses from self that are aspected
  type: AspectType;
}

const ASPECT_RULES: AspectRule[] = [
  // Universal: all planets aspect 7th
  { planetId: -1, offsets: [7], type: "full" },
  // Mars: 4th, 7th, 8th
  { planetId: 4, offsets: [4, 7, 8], type: "special" },
  // Saturn: 3rd, 7th, 10th
  { planetId: 6, offsets: [3, 7, 10], type: "special" },
  // Jupiter: 5th, 7th, 9th
  { planetId: 5, offsets: [5, 7, 9], type: "special" },
  // Rahu: 5th, 7th, 9th (some traditions)
  { planetId: 10, offsets: [5, 7, 9], type: "special" },
  // Ketu: 5th, 7th, 9th
  { planetId: 11, offsets: [5, 7, 9], type: "special" },
];

// Natural benefics: Jupiter, Venus, Mercury (if well-aspected), Moon (if bright)
const NATURAL_BENEFICS = [2, 3, 5];
// Natural malefics: Sun, Mars, Saturn, Rahu, Ketu
const NATURAL_MALEFICS = [0, 4, 6, 10, 11];

function getAspectedHouses(currentHouse: number, offsets: number[]): number[] {
  return offsets.map((offset) => {
    const aspected = ((currentHouse - 1 + offset - 1) % 12) + 1;
    return aspected;
  });
}

export function computeAspects(
  planets: PlanetaryPosition[]
): Aspect[] {
  const aspects: Aspect[] = [];

  for (const planet of planets) {
    const pid = planet.planet as unknown as number;
    const fromHouse = planet.house;

    // Universal 7th aspect (all planets)
    const universalRules = ASPECT_RULES.filter(r => r.planetId === -1);
    for (const rule of universalRules) {
      const aspectedHouses = getAspectedHouses(fromHouse, rule.offsets);
      for (const toHouse of aspectedHouses) {
        const angle = getAspectAngle(fromHouse, toHouse);
        aspects.push({
          fromPlanet: {
            id: pid,
            name: planet.name.en,
            house: fromHouse,
          },
          toHouse,
          type: rule.type,
          angle,
          isBenefic: getIsBenefic(pid, toHouse, planet),
          interpretation: buildAspectInterpretation(planet, toHouse, angle, rule.type),
        });
      }
    }

    // Special aspects (Mars, Saturn, Jupiter, Rahu, Ketu)
    const specialRules = ASPECT_RULES.filter(r => r.planetId === pid);
    for (const rule of specialRules) {
      const aspectedHouses = getAspectedHouses(fromHouse, rule.offsets);
      for (const toHouse of aspectedHouses) {
        // Skip 7th — already added by universal rule
        const seventhHouse = ((fromHouse - 1 + 6) % 12) + 1;
        if (toHouse === seventhHouse) continue;

        const angle = getAspectAngle(fromHouse, toHouse);
        aspects.push({
          fromPlanet: {
            id: pid,
            name: planet.name.en,
            house: fromHouse,
          },
          toHouse,
          type: rule.type,
          angle,
          isBenefic: getIsBenefic(pid, toHouse, planet),
          interpretation: buildAspectInterpretation(planet, toHouse, angle, rule.type),
        });
      }
    }
  }

  return aspects;
}

function getAspectAngle(fromHouse: number, toHouse: number): number {
  const diff = ((toHouse - fromHouse) % 12 + 12) % 12;
  return diff * 30; // each house = 30°
}

function getIsBenefic(planetId: number, toHouse: number, planet: PlanetaryPosition): boolean {
  if (NATURAL_BENEFICS.includes(planetId)) return true;
  if (NATURAL_MALEFICS.includes(planetId)) return false;
  return true; // neutral
}

function buildAspectInterpretation(
  planet: PlanetaryPosition,
  toHouse: number,
  angle: number,
  aspectType: AspectType
): string {
  const planetName = planet.name.en;
  const prefix = planet.isRetrograde ? "Retrograde " : "";

  const aspectStrength = aspectType === "full" ? "powerfully" :
    aspectType === "special" ? "strongly" : "moderately";

  const benefic = getIsBenefic(planet.planet as unknown as number, toHouse, planet);
  const effect = benefic ? "beneficially" : "challengingly";

  const houseMeanings: Record<number, string> = {
    1: "self, personality, and physical vitality",
    2: "wealth, family, and speech",
    3: "courage, siblings, and communication",
    4: "home, mother, emotional peace",
    5: "creativity, children, intelligence",
    6: "health, enemies, service",
    7: "marriage, partnerships, public",
    8: "longevity, secrets, transformation",
    9: "dharma, luck, higher education",
    10: "career, reputation, authority",
    11: "gains, friends, desires",
    12: "expenditure, spirituality, isolation",
  };

  const houseMeaning = houseMeanings[toHouse] || `house ${toHouse}`;

  return `${prefix}${planetName} ${effect} ${aspectStrength} aspects ${houseMeaning} (${toHouse}th house)`;
}

export function getAspectSummary(aspects: Aspect[]): string[] {
  const summaries: string[] = [];

  // Group aspects by aspected house
  const byHouse = new Map<number, Aspect[]>();
  for (const aspect of aspects) {
    const existing = byHouse.get(aspect.toHouse) || [];
    existing.push(aspect);
    byHouse.set(aspect.toHouse, existing);
  }

  for (const [house, houseAspects] of byHouse) {
    const beneficCount = houseAspects.filter(a => a.isBenefic).length;
    const maleficCount = houseAspects.filter(a => !a.isBenefic).length;
    const planets = houseAspects.map(a => a.fromPlanet.name).join(", ");

    if (beneficCount > maleficCount) {
      summaries.push(`House ${house} receives predominantly beneficial aspects from ${planets} — matters of this house are supported.`);
    } else if (maleficCount > beneficCount) {
      summaries.push(`House ${house} receives challenging aspects from ${planets} — matters of this house may face obstacles.`);
    } else {
      summaries.push(`House ${house} receives mixed aspects from ${planets}.`);
    }
  }

  return summaries;
}
