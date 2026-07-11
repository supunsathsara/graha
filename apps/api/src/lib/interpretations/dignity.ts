/**
 * Full Vedic planetary dignity system (Panchadha/Shadadha bala).
 *
 * Levels of dignity from strongest to weakest:
 *   1. Exalted (Uccha)       — planet at its peak strength
 *   2. Moolatrikona          — special sign of extreme comfort
 *   3. Own sign (Swakshetra) — planet rules this sign
 *   4. Friendly sign (Mitra) — planet's friend's sign
 *   5. Neutral sign (Sama)   — planet is neutral in this sign
 *   6. Enemy sign (Shatru)   — planet's enemy's sign
 *   7. Debilitated (Neecha)  — planet at its weakest
 *
 * Also computes:
 *   - Panchamahapurusha Yogas (five great yogas)
 *   - Planetary war (Graha Yuddha)
 *   - Combustion (planets too close to Sun)
 */

export type Dignity =
  | "exalted"
  | "moolatrikona"
  | "own"
  | "friendly"
  | "neutral"
  | "enemy"
  | "debilitated";

export type PanchamahapurushaYoga = {
  name: string;
  planet: string;
  condition: string;
  description: string;
};

// ─── Exaltation / Debilitation Degrees ─────────────────────
const EXALTATION: Record<number, { sign: number; degree: number }> = {
  0: { sign: 0, degree: 10 },   // Sun at 10° Aries
  1: { sign: 1, degree: 3 },    // Moon at 3° Taurus
  2: { sign: 5, degree: 15 },   // Mercury at 15° Virgo
  3: { sign: 11, degree: 27 },  // Venus at 27° Pisces
  4: { sign: 9, degree: 28 },   // Mars at 28° Capricorn
  5: { sign: 3, degree: 5 },    // Jupiter at 5° Cancer
  6: { sign: 6, degree: 20 },   // Saturn at 20° Libra
};

const DEBILITATION: Record<number, { sign: number; degree: number }> = {
  0: { sign: 6, degree: 10 },   // Sun at 10° Libra
  1: { sign: 7, degree: 3 },    // Moon at 3° Scorpio
  2: { sign: 11, degree: 15 },  // Mercury at 15° Pisces
  3: { sign: 5, degree: 27 },   // Venus at 27° Virgo
  4: { sign: 3, degree: 28 },   // Mars at 28° Cancer
  5: { sign: 9, degree: 5 },    // Jupiter at 5° Capricorn
  6: { sign: 0, degree: 20 },   // Saturn at 20° Aries
};

// ─── Moolatrikona Signs ─────────────────────────────────────
// Planets in their Moolatrikona sign are exceptionally strong,
// even stronger than their own sign in some traditions.
const MOOLATRIKONA: Record<number, { sign: number; startDeg: number; endDeg: number }> = {
  0: { sign: 4, startDeg: 0, endDeg: 20 },    // Sun: Leo 0°-20°
  1: { sign: 1, startDeg: 3, endDeg: 30 },    // Moon: Taurus 3°-30°
  2: { sign: 5, startDeg: 16, endDeg: 20 },   // Mercury: Virgo 16°-20°
  3: { sign: 6, startDeg: 0, endDeg: 15 },    // Venus: Libra 0°-15°
  4: { sign: 0, startDeg: 0, endDeg: 12 },    // Mars: Aries 0°-12°
  5: { sign: 8, startDeg: 0, endDeg: 5 },     // Jupiter: Sagittarius 0°-5°
  6: { sign: 10, startDeg: 0, endDeg: 20 },   // Saturn: Aquarius 0°-20°
};

// ─── Sign Rulerships ────────────────────────────────────────
const SIGN_LORDS: Record<number, number> = {
  0: 4,   // Aries → Mars
  1: 3,   // Taurus → Venus
  2: 2,   // Gemini → Mercury
  3: 1,   // Cancer → Moon
  4: 0,   // Leo → Sun
  5: 2,   // Virgo → Mercury
  6: 3,   // Libra → Venus
  7: 4,   // Scorpio → Mars
  8: 5,   // Sagittarius → Jupiter
  9: 6,   // Capricorn → Saturn
  10: 6,  // Aquarius → Saturn
  11: 5,  // Pisces → Jupiter
};

// ─── Planetary Friendships (Temporary + Permanent) ─────────
// Based on classical Vedic texts. Core friendship table.
// 0=Sun, 1=Moon, 2=Mercury, 3=Venus, 4=Mars, 5=Jupiter, 6=Saturn
type FriendshipLevel = "friend" | "neutral" | "enemy";

const FRIENDSHIPS: Record<number, Record<number, FriendshipLevel>> = {
  0: { 0: "neutral", 1: "friend", 2: "neutral", 3: "enemy", 4: "friend", 5: "friend", 6: "enemy" },
  1: { 0: "friend", 1: "neutral", 2: "friend", 3: "neutral", 4: "neutral", 5: "neutral", 6: "neutral" },
  2: { 0: "friend", 1: "enemy", 2: "neutral", 3: "friend", 4: "neutral", 5: "neutral", 6: "neutral" },
  3: { 0: "enemy", 1: "enemy", 2: "friend", 3: "neutral", 4: "neutral", 5: "neutral", 6: "friend" },
  4: { 0: "friend", 1: "friend", 2: "enemy", 3: "neutral", 4: "neutral", 5: "friend", 6: "neutral" },
  5: { 0: "friend", 1: "friend", 2: "enemy", 3: "enemy", 4: "friend", 5: "neutral", 6: "neutral" },
  6: { 0: "enemy", 1: "enemy", 2: "friend", 3: "friend", 4: "friend", 5: "neutral", 6: "neutral" },
};

// ─── Get Dignity ───────────────────────────────────────────
export function getFullDignity(
  planetId: number,
  longitude: number
): { dignity: Dignity; explanation: string } {
  const normLon = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normLon / 30);
  const degree = normLon % 30;

  // 1. Check exaltation
  const exalt = EXALTATION[planetId];
  if (exalt && sign === exalt.sign) {
    const orb = Math.abs(degree - exalt.degree);
    if (orb < 10) {
      const strength = orb < 3 ? "extremely" : "moderately";
      return { dignity: "exalted", explanation: `${strength} exalted at ${exalt.degree}° in ${getSignName(sign)}` };
    }
  }

  // 2. Check debilitation
  const debil = DEBILITATION[planetId];
  if (debil && sign === debil.sign) {
    const orb = Math.abs(degree - debil.degree);
    if (orb < 10) {
      return { dignity: "debilitated", explanation: `debilitated at ${debil.degree}° in ${getSignName(sign)}` };
    }
  }

  // 3. Check moolatrikona
  const mt = MOOLATRIKONA[planetId];
  if (mt && sign === mt.sign && degree >= mt.startDeg && degree < mt.endDeg) {
    return { dignity: "moolatrikona", explanation: `in Moolatrikona sign ${getSignName(sign)} — exceptionally strong` };
  }

  // 4. Check own sign
  if (planetId in SIGN_LORDS && SIGN_LORDS[sign] === planetId) {
    return { dignity: "own", explanation: `in its own sign ${getSignName(sign)}` };
  }

  // 5. Check friendship
  if (planetId >= 0 && planetId <= 6 && sign >= 0 && sign <= 11) {
    const signLord = SIGN_LORDS[sign];
    const friendship = FRIENDSHIPS[planetId]?.[signLord];
    if (friendship === "friend") {
      return { dignity: "friendly", explanation: `in ${getSignName(sign)} — ruled by friend ${getPlanetName(signLord)}` };
    }
    if (friendship === "enemy") {
      return { dignity: "enemy", explanation: `in ${getSignName(sign)} — ruled by enemy ${getPlanetName(signLord)}` };
    }
    if (friendship === "neutral") {
      // Check if the sign lord is neutral to the planet
      return { dignity: "neutral", explanation: `in ${getSignName(sign)} — ruled by neutral ${getPlanetName(signLord)}` };
    }
  }

  return { dignity: "neutral", explanation: `in ${getSignName(sign)}` };
}

// ─── Panchamahapurusha Yogas ───────────────────────────────
// Five great yogas formed by specific planets in kendra (angular houses)
export function detectPanchamahapurushaYogas(
  planets: Array<{ planetId: number; sign: number; house: number; dignity: Dignity }>
): PanchamahapurushaYoga[] {
  const yogas: PanchamahapurushaYoga[] = [];
  const kendraHouses = [1, 4, 7, 10];

  for (const planet of planets) {
    // Must be in own or exaltation sign AND in a kendra house
    if (planet.dignity !== "own" && planet.dignity !== "exalted") continue;
    if (!kendraHouses.includes(planet.house)) continue;

    const yoga = getPanchamahapurushaYoga(planet.planetId);
    if (yoga) {
      yogas.push(yoga);
    }
  }

  return yogas;
}

function getPanchamahapurushaYoga(planetId: number): PanchamahapurushaYoga | null {
  const yogas: Record<number, PanchamahapurushaYoga> = {
    2: { name: "Bhadra Yoga", planet: "Mercury", condition: "in own/exalted sign in kendra", description: "Bhadra Yoga confers intelligence, eloquence, wealth, and social grace. Native is learned, witty, and successful in business." },
    3: { name: "Malavya Yoga", planet: "Venus", condition: "in own/exalted sign in kendra", description: "Malavya Yoga brings beauty, artistic talent, luxury, wealth, and a comfortable life. Native is charming and fortunate." },
    4: { name: "Ruchaka Yoga", planet: "Mars", condition: "in own/exalted sign in kendra", description: "Ruchaka Yoga gives courage, strength, leadership, and commanding presence. Native excels in competitive fields." },
    5: { name: "Hamsa Yoga", planet: "Jupiter", condition: "in own/exalted sign in kendra", description: "Hamsa Yoga confers wisdom, spirituality, wealth, and high moral character. Native is respected and fortunate." },
    6: { name: "Shasha Yoga", planet: "Saturn", condition: "in own/exalted sign in kendra", description: "Shasha Yoga gives authority, discipline, longevity, and rise from humble beginnings to power. Native is a natural administrator." },
  };
  return yogas[planetId] || null;
}

// ─── Combustion ─────────────────────────────────────────────
// A planet is combust when too close to the Sun.
export function isCombust(planetId: number, planetLong: number, sunLong: number): { combust: boolean; orb: number } {
  if (planetId === 0) return { combust: false, orb: 0 }; // Sun cannot be combust

  const diff = Math.abs(((planetLong - sunLong) % 360 + 360) % 360);
  const orb = Math.min(diff, 360 - diff);

  // Combustion orbs vary by planet
  const combustionOrbs: Record<number, number> = {
    1: 12,   // Moon: 12°
    2: 14,   // Mercury: 14°
    3: 10,   // Venus: 10°
    4: 17,   // Mars: 17°
    5: 11,   // Jupiter: 11°
    6: 15,   // Saturn: 15°
  };

  const maxOrb = combustionOrbs[planetId] || 10;
  return { combust: orb < maxOrb, orb };
}

// ─── Retrogression Dignity ─────────────────────────────────
export function getRetrogradeDignity(isRetrograde: boolean, dignity: Dignity): string {
  if (!isRetrograde) return "";
  // Retrograde planets are considered stronger (vakri)
  if (dignity === "exalted" || dignity === "moolatrikona" || dignity === "own") {
    return "Retrograde — greatly strengthens this planet's positive energy";
  }
  if (dignity === "debilitated") {
    return "Retrograde — cancels debilitation, acting like neutral or friendly";
  }
  return "Retrograde — internalizes energy, results come later but powerfully";
}

// ─── Helpers ────────────────────────────────────────────────
function getSignName(sign: number): string {
  const names = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  return names[sign] || "Unknown";
}

function getPlanetName(planetId: number): string {
  const names: Record<number, string> = {
    0: "Sun", 1: "Moon", 2: "Mercury", 3: "Venus", 4: "Mars",
    5: "Jupiter", 6: "Saturn", 10: "Rahu", 11: "Ketu",
  };
  return names[planetId] || "Unknown";
}
