/**
 * Interpretations for Yogas, Doshas, and planetary aspects.
 *
 * These provide detailed text for the combinations detected by vedic.ts.
 */
import type { Yoga, Dosha } from "../vedic.js";

export function getYogaInterpretation(yoga: Yoga): string {
  const descriptions: Record<string, string> = {
    "Gaja Kesari Yoga": "This powerful Raja Yoga brings wisdom, prosperity, and good reputation. It indicates a person of high moral character, intelligence, and influence. The combination of Jupiter and Moon in angular houses creates a mind that is both wise and compassionate.",
    "Dhana Yoga": "This wealth-giving yoga indicates financial prosperity and material abundance. The lords of trine houses (5th and 9th) in kendra or trikona create strong dhana (wealth) indications. Native enjoys comfortable lifestyle.",
    "Raja Yoga": "The combination of kendra and trikona lords creates Raja Yoga — one of the most powerful yogas for success, authority, and leadership. Native rises to positions of power and influence in society.",
    "Vesi Yoga": "Benefic planets in the 2nd from Sun indicate wealth accumulation, good speech, and intelligence. Native earns through their own efforts and enjoys steady financial growth.",
  };
  return descriptions[yoga.name] || `${yoga.name}: ${yoga.description}`;
}

export function getDoshaInterpretation(dosha: Dosha): string {
  const texts: Record<string, string> = {
    "Mangalik Dosha": "Mars afflicting key houses (1,2,4,7,8,12) can create challenges in relationships and marriage. This dosha is mitigated by marrying someone also born with Mangalik Dosha, or after the age of 28. Remedies include performing a special puja and wearing a red coral after proper consultation.",
    "Kaal Sarpa Yoga": "All planets situated between Rahu and Ketu creates a karmic pattern where the native experiences both extreme highs and lows in life. This yoga indicates that the soul has brought significant karmic baggage. Spiritual practices, mantra chanting, and serving the underprivileged help mitigate its effects.",
    "Pitri Dosha": "The conjunction of Sun and Venus affects family relationships and ancestral blessings. This may indicate karmic patterns related to the paternal lineage. Performing ancestral rituals (Shraddha) and honoring one's father through service helps balance this energy.",
  };
  return texts[dosha.name] || dosha.description;
}

export function getAspectInterpretation(
  aspectPlanet: string,
  aspectedHouse: number,
  aspectType: string
): string {
  const aspects: Record<string, string> = {
    conjunction: `${aspectPlanet} is conjunct, lending its full energy to matters of house ${aspectedHouse}.`,
    "trine (120°)": `${aspectPlanet} beneficially aspects house ${aspectedHouse}, bringing harmony and opportunity.`,
    "square (90°)": `${aspectPlanet} challenges house ${aspectedHouse}, creating tension that leads to growth.`,
    "opposition (180°)": `${aspectPlanet} opposes house ${aspectedHouse}, creating awareness through polarity.`,
    "sextile (60°)": `${aspectPlanet} supports house ${aspectedHouse} with opportunity and ease.`,
  };
  return aspects[aspectType] || `${aspectPlanet} aspects house ${aspectedHouse}.`;
}

// Text for each planet's general significance (Graha Karakatwas)
export const PLANET_SIGNIFICANCE: Record<number, string> = {
  0: "Sun represents the soul, authority, father, vitality, leadership, self-confidence, and government.",
  1: "Moon represents the mind, emotions, mother, nurturing, public, water, and mental peace.",
  2: "Mercury represents intelligence, communication, commerce, education, speech, writing, and logic.",
  3: "Venus represents love, beauty, arts, luxury, marriage, wealth, vehicles, and relationships.",
  4: "Mars represents courage, energy, siblings, sports, conflict, surgery, and technical skills.",
  5: "Jupiter represents wisdom, knowledge, spirituality, wealth, children, teaching, and expansion.",
  6: "Saturn represents discipline, hard work, delays, longevity, service, and karma.",
  10: "Rahu represents worldly desires, foreign connections, obsession, technology, and unconventional paths.",
  11: "Ketu represents spirituality, detachment, liberation, past life karma, and mystical knowledge.",
};

// House significations (Bhavakarakatwas)
export const HOUSE_SIGNIFICANCE: Record<number, string> = {
  1: "1st house: Self, personality, physical body, health, appearance, and overall life direction.",
  2: "2nd house: Wealth, family, speech, food, eyesight, and accumulated assets.",
  3: "3rd house: Siblings, courage, communication, short travels, skills, and initiative.",
  4: "4th house: Home, mother, education, vehicles, property, and inner peace.",
  5: "5th house: Children, creativity, intelligence, romance, speculation, and past life merits.",
  6: "6th house: Health, enemies, debts, service, litigation, and daily work.",
  7: "7th house: Marriage, partnerships, spouse, business relationships, and public dealings.",
  8: "8th house: Longevity, inheritance, secrets, occult, transformation, and sudden events.",
  9: "9th house: Fortune, higher education, spirituality, father, guru, long travels, and dharma.",
  10: "10th house: Career, profession, reputation, authority, achievements, and public life.",
  11: "11th house: Income, gains, friends, social circle, elder siblings, and fulfilled desires.",
  12: "12th house: Expenditure, foreign travel, spirituality, isolation, sleep, and liberation.",
};
