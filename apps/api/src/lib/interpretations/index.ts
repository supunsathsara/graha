/**
 * Compilation engine — assembles all Vedic rules into a full horoscope reading.
 *
 * Takes a BirthChart → evaluates all applicable rules → produces a structured reading.
 * No AI involvement — every statement is sourced from the rule tables.
 */
import type { BirthChart, PlanetaryPosition, ChartInterpretation, DailyPrediction } from "../../types/chart.js";
import { ZODIAC_NAMES, PLANET_NAMES } from "../../types/chart.js";
import { getPlanetInHouseInterpretation } from "./planets-in-houses.js";
import { getPlanetInSignInterpretation } from "./planets-in-signs.js";
import { getHouseLordInterpretation } from "./house-lords.js";
import { getNakshatraByLongitude } from "./nakshatras.js";
import { getNavamsaPlanetInterpretation, computeNavamsaChart } from "./navamsa.js";
import { getRemedy, getGeneralRemedy } from "./remedies.js";
import {
  getYogaInterpretation,
  getDoshaInterpretation,
  getAspectInterpretation,
  PLANET_SIGNIFICANCE,
  HOUSE_SIGNIFICANCE,
} from "./yoga-dosha-texts.js";
import { detectYogas, detectDoshas } from "../vedic.js";
import { computeAspects, getAspectSummary } from "./aspects.js";
import { getFullDignity, detectPanchamahapurushaYogas, isCombust, getRetrogradeDignity } from "./dignity.js";

// ─── Compiled Reading ──────────────────────────────────────
export interface CompiledReading {
  /** Overall life reading */
  general: string;
  /** Personality analysis from lagna and 1st house */
  personality: string;
  /** Career and professional life */
  career: string;
  /** Relationships and marriage */
  relationships: string;
  /** Health tendencies */
  health: string;
  /** Financial prospects */
  finance: string;
  /** Planetary influences in each house (1-12) */
  houseInfluences: string[];
  /** List of yogas detected with explanations */
  yogas: { name: string; description: string }[];
  /** List of doshas detected with explanations */
  doshas: { name: string; description: string; severity: string }[];
  /** Current dasa period with interpretation */
  currentDasa: string | null;
  /** Planetary strengths and challenges */
  strengths: string[];
  challenges: string[];
  /** Recommended remedies */
  remedies: { planet: string; gem: string | null; mantra: string; action: string }[];
  /** Favorable and challenging planets */
  favorablePlanets: string[];
  challengingPlanets: string[];
  /** Navamsa (D9 chart) analysis */
  navamsa: {
    lagna: number;
    vargottamaPlanets: string[];
    marriageAnalysis: string[];
    planetPlacements: { planet: string; sign: string; interpretation: string }[];
  } | null;
  /** Vedic aspects — which planets aspect which houses */
  aspects: {
    summary: string[];
    details: Array<{
      fromPlanet: string;
      fromHouse: number;
      toHouse: number;
      type: string;
      isBenefic: boolean;
      interpretation: string;
    }>;
  } | null;
  /** Planetary dignity details for each planet */
  planetaryDignities: Array<{
    planet: string;
    dignity: string;
    explanation: string;
    isCombust: boolean;
    retrogradeEffect: string;
  }>;
  /** Panchamahapurusha Yogas (five great yogas) */
  panchamahapurushaYogas: Array<{ name: string; planet: string; description: string }>;
}

// ─── Compile ────────────────────────────────────────────────
export function compileReading(chart: BirthChart): CompiledReading {
  // 1. Lagna / Ascendant analysis
  const lagnaName = ZODIAC_NAMES[chart.lagna.sign]?.en || "Unknown";
  const lagnaLord = getPlanetInHouseInterpretation(0, chart.lagna.sign + 1);

  // 2. Personality
  const personality = buildPersonality(chart);

  // 3. House-by-house analysis
  const houseInfluences = buildHouseInfluences(chart);

  // 4. Planet-by-planet analysis
  const planetReadings = buildPlanetReadings(chart);

  // 5. Career from 10th house and relevant planets
  const career = buildCareerReading(chart);

  // 6. Relationships from 7th house and Venus
  const relationships = buildRelationshipReading(chart);

  // 7. Health from 1st, 6th houses + afflicted planets
  const health = buildHealthReading(chart);

  // 8. Finance from 2nd, 11th houses + Jupiter
  const finance = buildFinanceReading(chart);

  // 9. Yogas
  const yogas = detectYogas(chart);
  const yogaTexts = yogas.map(y => ({
    name: y.name,
    description: getYogaInterpretation(y),
  }));

  // 10. Doshas
  const doshas = detectDoshas(chart);
  const doshaTexts = doshas.map(d => ({
    name: d.name,
    description: getDoshaInterpretation(d),
    severity: d.severity,
  }));

  // 11. Dasa
  const currentDasa = chart.currentDasa
    ? `You are currently in the Mahadasa of ${chart.currentDasa.lordName.en}. This period lasts ${chart.currentDasa.totalYears} years and brings matters ruled by ${chart.currentDasa.lordName.en} to the forefront. ${getDasaInterpretation(chart.currentDasa.lord as unknown as number)}`
    : null;

  // 12. Strengths and challenges
  const allStrengths: string[] = [];
  const allChallenges: string[] = [];
  const remedies: CompiledReading["remedies"] = [];
  const favorablePlanets: string[] = [];
  const challengingPlanets: string[] = [];

  for (const planet of chart.planets) {
    if (planet.dignity === "exalted") {
      allStrengths.push(`${planet.name.en} is exalted in ${ZODIAC_NAMES[planet.sign]?.en} — exceptionally powerful.`);
      favorablePlanets.push(planet.name.en);
    }
    if (planet.dignity === "debilitated") {
      allChallenges.push(`${planet.name.en} is debilitated in ${ZODIAC_NAMES[planet.sign]?.en} — requires conscious effort to express.`);
      challengingPlanets.push(planet.name.en);

      // Add remedy for debilitated planets
      const remedy = getRemedy(planet.planet as unknown as number, "debilitated");
      if (remedy) {
        remedies.push({
          planet: planet.name.en,
          gem: remedy.gem,
          mantra: remedy.mantra,
          action: remedy.action,
        });
      }
    }
    if (planet.isRetrograde) {
      allChallenges.push(`${planet.name.en} is retrograde — its energy is turned inward. Needs conscious expression.`);
    }
  }

  // Add remedies for weakened planets
  for (const planet of chart.planets) {
    if (!remedies.find(r => r.planet === planet.name.en)) {
      const remedy = getGeneralRemedy(planet.planet as unknown as number);
      if (remedy) {
        remedies.push({
          planet: planet.name.en,
          gem: remedy.gem,
          mantra: remedy.mantra,
          action: remedy.action,
        });
      }
    }
  }

  // General life reading
  const general = buildGeneralReading(chart, lagnaName, yogas, doshas);

  // ─── Navamsa (D9) Analysis ───────────────────────────
  const navamsaData = chart.planets.length > 0 ? computeNavamsaChart(chart) : null;
  const navamsaAnalysis = navamsaData ? (() => {
    const marriageAnalysis: string[] = [];
    const planetPlacements: { planet: string; sign: string; interpretation: string }[] = [];

    for (const p of navamsaData.planetsInNavamsa) {
      const planet = chart.planets.find(pl => pl.planet === p.planetId as unknown as number);
      const signName = ZODIAC_NAMES[p.navamsaSign]?.en || "Unknown";
      const isVargottama = navamsaData.vargottamaPlanets.includes(p.planetId);
      const interp = getNavamsaPlanetInterpretation(p.planetId, p.navamsaSign, isVargottama);

      planetPlacements.push({
        planet: planet?.name.en || `Planet ${p.planetId}`,
        sign: signName,
        interpretation: interp,
      });

      // Marriage-specific: Venus, Jupiter, 7th lord in Navamsa
      if (p.planetId === 3) {
        marriageAnalysis.push(`Venus is in ${signName} in D9 — ${getNavamsaRelationshipText(p.navamsaSign)}`);
      }
      if (p.planetId === 5) {
        marriageAnalysis.push(`Jupiter is in ${signName} in D9 — ${getNavamsaJupiterText(p.navamsaSign)}`);
      }
      if (isVargottama) {
        marriageAnalysis.push(`${planet?.name.en || `Planet ${p.planetId}`} is Vargottama — strongly placed in both Rasi and Navamsa, giving excellent results for its significations.`);
      }
    }

    const navamsaLagnaName = ZODIAC_NAMES[navamsaData.navamsaLagna]?.en || "Unknown";
    marriageAnalysis.unshift(`Navamsa Lagna is ${navamsaLagnaName}. This influences the overall quality of relationships and marriage.`);

    return {
      lagna: navamsaData.navamsaLagna,
      vargottamaPlanets: navamsaData.vargottamaPlanets.map(id => {
        const p = chart.planets.find(pl => pl.planet === id as unknown as number);
        return p?.name.en || `Planet ${id}`;
      }),
      marriageAnalysis,
      planetPlacements,
    };
  })() : null;

  // ─── Aspects ─────────────────────────────────────────
  const allAspects = chart.planets.length > 0 ? computeAspects(chart.planets) : [];
  const aspectSummary = allAspects.length > 0 ? getAspectSummary(allAspects) : [];
  const aspects = allAspects.length > 0 ? {
    summary: aspectSummary,
    details: allAspects.map(a => ({
      fromPlanet: a.fromPlanet.name,
      fromHouse: a.fromPlanet.house,
      toHouse: a.toHouse,
      type: a.type,
      isBenefic: a.isBenefic,
      interpretation: a.interpretation,
    })),
  } : null;

  // ─── Full Dignity + Combustion + Panchamahapurusha ────
  const planetaryDignities: CompiledReading["planetaryDignities"] = [];
  const sun = chart.planets.find(p => p.planet === 0);
  const sunLong = sun?.longitude || 0;

  for (const planet of chart.planets) {
    const pid = planet.planet as unknown as number;
    const { dignity, explanation } = getFullDignity(pid, planet.longitude);
    const { combust } = pid !== 0 ? isCombust(pid, planet.longitude, sunLong) : { combust: false };
    const retroEffect = getRetrogradeDignity(planet.isRetrograde, dignity as any);

    // Update the planet's dignity in the chart for other uses
    (planet as any).dignity = dignity;

    planetaryDignities.push({
      planet: planet.name.en,
      dignity,
      explanation,
      isCombust: combust,
      retrogradeEffect: retroEffect,
    });
  }

  // Panchamahapurusha Yogas
  const pmpYogas = detectPanchamahapurushaYogas(
    chart.planets.map(p => ({
      planetId: p.planet as unknown as number,
      sign: p.sign,
      house: p.house,
      dignity: p.dignity as any,
    }))
  );
  const panchamahapurushaYogas = pmpYogas.map(y => ({
    name: y.name,
    planet: y.planet,
    description: y.description,
  }));

  return {
    general,
    personality,
    career,
    relationships,
    health,
    finance,
    houseInfluences,
    yogas: yogaTexts,
    doshas: doshaTexts,
    currentDasa,
    strengths: allStrengths.length ? allStrengths : ["Balanced planetary configuration"],
    challenges: allChallenges.length ? allChallenges : ["No major challenging aspects detected"],
    remedies,
    favorablePlanets,
    challengingPlanets,
    navamsa: navamsaAnalysis,
    aspects,
    planetaryDignities,
    panchamahapurushaYogas,
  };
}

// ─── Convert to ChartInterpretation ─────────────────────────
export function readingToInterpretation(reading: CompiledReading): ChartInterpretation {
  return {
    general: reading.general + "\n\n" + reading.personality,
    career: reading.career,
    relationships: reading.relationships,
    health: reading.health,
    finance: reading.finance,
    strengths: reading.strengths,
    challenges: reading.challenges,
    favorablePlanets: reading.favorablePlanets,
    challengingPlanets: reading.challengingPlanets,
  };
}

// ─── Builder Functions ─────────────────────────────────────

function buildPersonality(chart: BirthChart): string {
  const lagnaName = ZODIAC_NAMES[chart.lagna.sign]?.en || "Unknown";
  const lagnaLord = getPlanetInHouseInterpretation(0, chart.lagna.sign + 1);
  const moonSign = chart.planets.find(p => p.planet === 1);
  const moonSignName = moonSign ? ZODIAC_NAMES[moonSign.sign]?.en : "Unknown";

  let text = `You have ${lagnaName} rising as your Lagna (Ascendant). This gives you the core personality traits of ${getSignTrait(lagnaName)}. `;

  if (lagnaLord) {
    text += `The lord of your Lagna is placed as follows: ${lagnaLord.interpretation} `;
  }

  if (moonSign) {
    text += `Your Moon sign (Rasi) is ${moonSignName}, which governs your emotional nature and mind. `;
    const nak = getNakshatraByLongitude(moonSign.longitude);
    text += `Your birth star (Janma Nakshatra) is ${nak.name}, ruled by ${nak.lord}. ${nak.personality}`;
  }

  return text;
}

function buildHouseInfluences(chart: BirthChart): string[] {
  const influences: string[] = [];

  for (let h = 1; h <= 12; h++) {
    const houseSignificance = HOUSE_SIGNIFICANCE[h];
    const planetsInHouse = chart.planets.filter(p => p.house === h);

    let text = `House ${h}: ${houseSignificance}\n`;

    if (planetsInHouse.length === 0) {
      text += "No planets occupy this house. Its matters are influenced by its lord's placement elsewhere. ";
    }

    for (const planet of planetsInHouse) {
      const phInterp = getPlanetInHouseInterpretation(planet.planet as unknown as number, h);
      if (phInterp) {
        text += `${planet.name.en} here: ${phInterp.interpretation} `;
      }
    }

    influences.push(text.trim());
  }

  return influences;
}

function buildPlanetReadings(chart: BirthChart): string[] {
  const readings: string[] = [];

  for (const planet of chart.planets) {
    const sign = ZODIAC_NAMES[planet.sign]?.en || "Unknown";
    const houseInterp = getPlanetInHouseInterpretation(planet.planet as unknown as number, planet.house);
    const signInterp = getPlanetInSignInterpretation(planet.planet as unknown as number, planet.sign);
    const nak = getNakshatraByLongitude(planet.longitude);
    const significance = PLANET_SIGNIFICANCE[planet.planet as unknown as number] || "";

    let text = `${planet.name.en} in ${sign} in house ${planet.house}: `;
    text += `${significance} `;

    if (signInterp) {
      text += `In ${sign}, ${signInterp.interpretation} `;
    }
    if (houseInterp) {
      text += `In house ${planet.house}: ${houseInterp.interpretation} `;
    }

    text += `Birth star: ${nak.name}. `;

    if (planet.isRetrograde) {
      text += "Retrograde — energy is internalized, results come later in life. ";
    }

    readings.push(text.trim());
  }

  return readings;
}

function buildCareerReading(chart: BirthChart): string {
  const texts: string[] = [];

  // 10th house analysis
  const tenthHousePlanets = chart.planets.filter(p => p.house === 10);
  for (const p of tenthHousePlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 10);
    if (interp) texts.push(`${p.name.en} in the 10th house: ${interp.career}`);
  }

  // Sun and Saturn (career indicators)
  const sun = chart.planets.find(p => p.planet === 0);
  const saturn = chart.planets.find(p => p.planet === 6);
  if (sun && sun.house !== 10) {
    const interp = getPlanetInHouseInterpretation(0, sun.house);
    if (interp) texts.push(`Sun in house ${sun.house} influences career: ${interp.career}`);
  }

  // Midheaven (MC) — closest house to 10th
  if (tenthHousePlanets.length === 0) {
    texts.push("No planets in the 10th house — career success comes through the lord of the 10th house. Focus on strengthening the ruler of your midheaven.");
  }

  return texts.join("\n") || "Career directions are influenced by your 10th house and its lord. Consider professions aligned with your planetary strengths.";
}

function buildRelationshipReading(chart: BirthChart): string {
  const texts: string[] = [];

  const seventhPlanets = chart.planets.filter(p => p.house === 7);
  for (const p of seventhPlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 7);
    if (interp) texts.push(`${p.name.en} in 7th house: ${interp.relationships}`);
  }

  const venus = chart.planets.find(p => p.planet === 3);
  if (venus && venus.house !== 7) {
    const interp = getPlanetInHouseInterpretation(3, venus.house);
    if (interp) texts.push(`Venus in house ${venus.house}: ${interp.relationships}`);
  }

  // Check Mangalik dosha
  const doshas = detectDoshas(chart);
  const mangalik = doshas.find(d => d.name === "Mangalik Dosha" || d.name === "Mangal Cancellation");
  if (mangalik) {
    texts.push(getDoshaInterpretation(mangalik));
  }

  return texts.join("\n") || "Relationship patterns are influenced by the 7th house and Venus. For personalized insights, a complete chart analysis is recommended.";
}

function buildHealthReading(chart: BirthChart): string {
  const texts: string[] = [];

  // 1st house (overall vitality)
  const firstHousePlanets = chart.planets.filter(p => p.house === 1);
  for (const p of firstHousePlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 1);
    if (interp) texts.push(`${p.name.en} in 1st house affects health: ${interp.health}`);
  }

  // 6th house (health/illness)
  const sixthHousePlanets = chart.planets.filter(p => p.house === 6);
  for (const p of sixthHousePlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 6);
    if (interp) texts.push(`${p.name.en} in 6th house: ${interp.health}`);
  }

  // Check for debilitated or afflicted planets
  for (const p of chart.planets) {
    if (p.dignity === "debilitated") {
      texts.push(`${p.name.en} is debilitated — its associated body parts need care.`);
    }
  }

  return texts.join("\n") || "Health is generally balanced. Pay attention to the houses and planets that are most prominent in your chart.";
}

function buildFinanceReading(chart: BirthChart): string {
  const texts: string[] = [];

  // 2nd house (wealth)
  const secondHousePlanets = chart.planets.filter(p => p.house === 2);
  for (const p of secondHousePlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 2);
    if (interp) texts.push(`${p.name.en} in 2nd house: ${interp.career}`);
  }

  // 11th house (gains)
  const eleventhHousePlanets = chart.planets.filter(p => p.house === 11);
  for (const p of eleventhHousePlanets) {
    const interp = getPlanetInHouseInterpretation(p.planet as unknown as number, 11);
    if (interp) texts.push(`${p.name.en} in 11th house: ${interp.career}`);
  }

  // Jupiter (wealth indicator)
  const jupiter = chart.planets.find(p => p.planet === 5);
  if (jupiter) {
    texts.push(`Jupiter in house ${jupiter.house} influences financial growth and prosperity.`);
  }

  return texts.join("\n") || "Financial prospects are determined by the 2nd and 11th houses, as well as Jupiter's placement.";
}

function buildGeneralReading(
  chart: BirthChart,
  lagnaName: string,
  yogas: ReturnType<typeof detectYogas>,
  doshas: ReturnType<typeof detectDoshas>
): string {
  const parts: string[] = [];

  parts.push(`Your birth chart reveals that you have ${lagnaName} rising as your Lagna. Your core personality, physical constitution, and life approach are shaped by this ascendant.`);

  if (yogas.length > 0) {
    parts.push(`Your chart contains ${yogas.length} special yoga combination(s):`);
    for (const yoga of yogas) {
      parts.push(`• ${yoga.name}: ${getYogaInterpretation(yoga)}`);
    }
  }

  if (doshas.some(d => d.present)) {
    parts.push(`Your chart has the following afflictions (Doshas):`);
    for (const dosha of doshas.filter(d => d.present)) {
      parts.push(`• ${dosha.name}: ${getDoshaInterpretation(dosha)}`);
    }
  }

  parts.push(`Your current Dasa period is ${chart.currentDasa?.lordName.en || "being calculated"}. This planetary period brings specific karmic themes and opportunities to the forefront.`);

  return parts.join("\n\n");
}

function getSignTrait(sign: string): string {
  const traits: Record<string, string> = {
    "Aries": "courage, initiative, and pioneering spirit",
    "Taurus": "stability, sensuality, and determination",
    "Gemini": "intellect, adaptability, and curiosity",
    "Cancer": "nurturing, intuition, and emotional depth",
    "Leo": "leadership, creativity, and generosity",
    "Virgo": "precision, analysis, and practical service",
    "Libra": "diplomacy, balance, and aesthetic sense",
    "Scorpio": "intensity, transformation, and investigative power",
    "Sagittarius": "optimism, adventure, and philosophical wisdom",
    "Capricorn": "ambition, discipline, and practical mastery",
    "Aquarius": "innovation, humanitarianism, and independence",
    "Pisces": "compassion, artistry, and spiritual depths",
  };
  return traits[sign] || "unique energy";
}

function getDasaInterpretation(planetId: number): string {
  const dasaTexts: Record<number, string> = {
    0: "Sun's period brings focus on authority, father, career advancement, and self-confidence. It is a time of increased visibility and responsibility.",
    1: "Moon's period emphasizes emotions, home life, mother, and public interactions. A time of fluctuating fortunes and increased sensitivity.",
    2: "Mercury's period is favorable for education, communication, business, and intellectual pursuits. Good for starting new ventures involving skills.",
    3: "Venus's period brings romance, luxury, artistic pursuits, marriage, and financial comfort. A pleasant period overall.",
    4: "Mars's period brings energy, conflict, courage, and technical achievements. Success through competition but caution in relationships.",
    5: "Jupiter's period is highly beneficial — brings wisdom, expansion, wealth, children, and spiritual growth. A fortunate period.",
    6: "Saturn's period is karmic — brings hard work, delays, discipline, and long-term results. What you build now will last.",
    10: "Rahu's period brings rapid worldly success, foreign connections, unconventional achievements, and sudden changes. Materialistic focus.",
    11: "Ketu's period brings spiritual detachment, introspection, health challenges, and past life karmic results. Seek spiritual practices.",
  };
  return dasaTexts[planetId] || "This planetary period brings its own unique themes based on its placement in the birth chart.";
}

function getNavamsaRelationshipText(sign: number): string {
  const texts: Record<number, string> = {
    0: "impulsive romantic nature, passionate relationship",
    1: "stable, loyal, sensual relationship",
    2: "intellectual relationship, communicative partner",
    3: "emotional, nurturing, family-oriented relationship",
    4: "dramatic, generous, romantic relationship",
    5: "practical, service-oriented relationship",
    6: "harmonious, balanced, partnership-focused relationship",
    7: "intense, transformative, deep bonding",
    8: "adventurous, philosophical relationship",
    9: "disciplined, committed, long-term relationship",
    10: "unconventional, friendship-based relationship",
    11: "spiritual, compassionate, artistic union",
  };
  return texts[sign] || "balanced relationship";
}

function getNavamsaJupiterText(sign: number): string {
  const texts: Record<number, string> = {
    0: "brings courage and optimism to relationships",
    1: "brings stability and loyalty to marriage",
    2: "intellectual compatibility in marriage",
    3: "nurturing and protective in relationships",
    4: "generous and warm-hearted in marriage",
    5: "practical wisdom in relationships",
    6: "balanced and fair in partnerships",
    7: "deep commitment and transformation in marriage",
    8: "philosophical approach to relationships",
    9: "disciplined commitment in marriage",
    10: "unconventional but faithful in relationships",
    11: "spiritual and compassionate union",
  };
  return texts[sign] || "brings wisdom to relationships";
}
