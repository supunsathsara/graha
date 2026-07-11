/**
 * AI-powered horoscope interpretation.
 *
 * Supports:
 *   - Groq SDK (fast inference, uses Llama/Mixtral models)
 *   - Hugging Face Inference API (free tier, open models)
 *
 * The AI takes calculated chart data as context and generates
 * natural-language interpretations in English and Sinhala.
 */
import Groq from "groq-sdk";
import type {
  BirthChart,
  ChartInterpretation,
  DailyPrediction,
  PlanetaryPosition,
} from "../types/chart.js";
import { PLANET_NAMES, ZODIAC_NAMES, ZodiacSign } from "../types/chart.js";

// ─── Clients ─────────────────────────────────────────────────
let groqClient: Groq | null = null;

export function initAI(): void {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    groqClient = new Groq({ apiKey: groqKey });
    console.log("[AI] Groq client initialized");
  } else {
    console.log("[AI] GROQ_API_KEY not set — AI features disabled");
  }
}

function getGroqClient(): Groq {
  if (!groqClient) {
    throw new Error("Groq client not initialized. Set GROQ_API_KEY and call initAI().");
  }
  return groqClient;
}

// ─── Prompt Builder ──────────────────────────────────────────

function buildChartContext(chart: BirthChart): string {
  const lines: string[] = [];
  lines.push(`Birth Chart Analysis for ${chart.name || "Unknown"}`);
  lines.push(`Date: ${chart.birthDate} ${chart.birthTime}`);
  lines.push(`Location: ${chart.latitude}°N, ${chart.longitude}°E`);
  lines.push("");

  // Lagna
  const lagnaName = ZODIAC_NAMES[chart.lagna.sign]?.en || "Unknown";
  lines.push(`Ascendant (Lagna): ${lagnaName} at ${chart.lagna.degree.toFixed(2)}°`);

  // Planets
  lines.push("\nPlanetary Positions:");
  for (const p of chart.planets) {
    const signName = ZODIAC_NAMES[p.sign]?.en || "Unknown";
    const retro = p.isRetrograde ? " (Retrograde)" : "";
    lines.push(
      `  ${p.name.en}: ${signName} ${p.signDegree.toFixed(2)}° House ${p.house}${retro}`
    );
  }

  // Dasa
  if (chart.currentDasa) {
    lines.push(`\nCurrent Dasa: ${chart.currentDasa.lordName.en} (${chart.currentDasa.startDate} – ${chart.currentDasa.endDate})`);
  }

  return lines.join("\n");
}

function buildDailyPrompt(): string {
  return `You are a Vedic astrologer with deep knowledge of Jyotish (Indian/Vedic astrology). 
Given the birth chart data below, provide a daily horoscope prediction in this exact JSON format:

{
  "general": "string",
  "career": "string",
  "love": "string",
  "health": "string",
  "auspiciousTime": "string or null",
  "inauspiciousTime": "string or null"
}

Use clear, practical language. Mention relevant planetary transits.`;
}

function buildInterpretationPrompt(): string {
  return `You are a master Jyotish astrologer. 
Given the birth chart data below, provide a comprehensive reading in this exact JSON format:

{
  "general": "overall life reading",
  "career": "career and professional life",
  "relationships": "relationships and marriage",
  "health": "health tendencies and advice",
  "finance": "financial prospects",
  "strengths": ["strength1", "strength2"],
  "challenges": ["challenge1", "challenge2"],
  "favorablePlanets": ["planet1", "planet2"],
  "challengingPlanets": ["planet1", "planet2"]
}

Be specific to the chart positions. Mention yogas, doshas, and nakshatras.`;
}

// ─── Groq-based Interpretation ──────────────────────────────

async function interpretWithGroq(
  chartContext: string,
  systemPrompt: string
): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // Fast, good for astrology
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Birth chart data:\n\n${chartContext}` },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content || "{}";
}

// ─── Hugging Face-based Interpretation ──────────────────────

async function interpretWithHuggingFace(
  chartContext: string,
  systemPrompt: string
): Promise<string> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error("HF_TOKEN not set");
  }

  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `<s>[INST] ${systemPrompt}\n\n${chartContext} [/INST]`,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!(response as any).ok) {
    const err = response as any;
    throw new Error(`Hugging Face API error: ${err.status} ${err.statusText}`);
  }

  const result = (await (response as any).json()) as Array<{ generated_text: string }>;
  return result[0]?.generated_text || "{}";
}

// ─── Public API ─────────────────────────────────────────────

export async function getChartInterpretation(
  chart: BirthChart,
  provider: "groq" | "huggingface" | "auto" = "auto"
): Promise<ChartInterpretation> {
  const chartContext = buildChartContext(chart);
  const systemPrompt = buildInterpretationPrompt();

  let rawJson: string;

  try {
    if (provider === "groq" || (provider === "auto" && process.env.GROQ_API_KEY)) {
      rawJson = await interpretWithGroq(chartContext, systemPrompt);
    } else if (
      provider === "huggingface" ||
      (provider === "auto" && process.env.HF_TOKEN)
    ) {
      rawJson = await interpretWithHuggingFace(chartContext, systemPrompt);
    } else {
      // Fallback: return template-based interpretation
      return generateTemplateInterpretation(chart);
    }
  } catch (error) {
    console.error("[AI] Interpretation failed:", error);
    return generateTemplateInterpretation(chart);
  }

  try {
    return JSON.parse(rawJson) as ChartInterpretation;
  } catch {
    console.error("[AI] Failed to parse AI response as JSON, using template");
    return generateTemplateInterpretation(chart);
  }
}

export async function getDailyPrediction(
  chart: BirthChart,
  provider: "groq" | "huggingface" | "auto" = "auto"
): Promise<DailyPrediction> {
  const chartContext = buildChartContext(chart);
  const systemPrompt = buildDailyPrompt();

  let rawJson: string;

  try {
    if (provider === "groq" || (provider === "auto" && process.env.GROQ_API_KEY)) {
      rawJson = await interpretWithGroq(chartContext, systemPrompt);
    } else if (
      provider === "huggingface" ||
      (provider === "auto" && process.env.HF_TOKEN)
    ) {
      rawJson = await interpretWithHuggingFace(chartContext, systemPrompt);
    } else {
      return generateTemplateDailyPrediction();
    }
  } catch (error) {
    console.error("[AI] Daily prediction failed:", error);
    return generateTemplateDailyPrediction();
  }

  try {
    return JSON.parse(rawJson) as DailyPrediction;
  } catch {
    return generateTemplateDailyPrediction();
  }
}

// ─── Template Fallbacks (when AI is unavailable) ────────────

function generateTemplateInterpretation(chart: BirthChart): ChartInterpretation {
  const lagnaName = ZODIAC_NAMES[chart.lagna.sign]?.en || "Unknown";
  const moon = chart.planets.find((p) => p.planet === 1);
  const moonSign = moon ? ZODIAC_NAMES[moon.sign]?.en : "Unknown";

  return {
    general: `You have ${lagnaName} rising, indicating a personality driven by ${getSignTraits(chart.lagna.sign)}. Your Moon is in ${moonSign}, influencing your emotional nature.`,
    career: `With your planetary placements, you may find success in fields aligned with your 10th house lord. Consider careers that leverage your natural strengths.`,
    relationships: `The position of Venus and the 7th house lord in your chart suggest particular patterns in relationships.`,
    health: `Pay attention to the areas ruled by the 6th house and any afflicted planets in your chart.`,
    finance: `Jupiter's placement influences your financial prospects. Currently, your financial periods are guided by your dasa cycle.`,
    strengths: getTemplateStrengths(chart),
    challenges: getTemplateChallenges(chart),
    favorablePlanets: chart.planets
      .filter((p) => p.dignity === "exalted")
      .map((p) => p.name.en),
    challengingPlanets: chart.planets
      .filter((p) => p.dignity === "debilitated")
      .map((p) => p.name.en),
  };
}

function generateTemplateDailyPrediction(): DailyPrediction {
  const today = new Date().toISOString().split("T")[0];
  return {
    date: today,
    overall: "Today is a balanced day. Focus on your priorities and avoid unnecessary conflicts. The planetary alignments support thoughtful decision-making.",
    career: "Good day for planning and strategic thinking. Avoid impulsive decisions in professional matters.",
    love: "Relationships require patience today. Listen more than you speak.",
    health: "Moderate energy levels. Light exercise and proper hydration are recommended.",
    auspiciousTime: null,
    inauspiciousTime: null,
  };
}

function getSignTraits(sign: ZodiacSign): string {
  const traits: Record<number, string> = {
    0: "courage, initiative, and assertiveness",
    1: "stability, sensuality, and determination",
    2: "intellect, adaptability, and communication",
    3: "nurturing, intuition, and emotional depth",
    4: "leadership, creativity, and generosity",
    5: "precision, analysis, and service",
    6: "diplomacy, balance, and aesthetics",
    7: "intensity, transformation, and resourcefulness",
    8: "optimism, adventure, and wisdom",
    9: "ambition, discipline, and practicality",
    10: "innovation, humanitarianism, and independence",
    11: "compassion, artistry, and spirituality",
  };
  return traits[sign] || "balanced energy";
}

function getTemplateStrengths(chart: BirthChart): string[] {
  const strengths: string[] = [];
  for (const p of chart.planets) {
    if (p.dignity === "exalted") strengths.push(`${p.name.en} is exalted — strong ${p.name.en} energy`);
    if (p.house === 1 || p.house === 10) strengths.push(`${p.name.en} in house ${p.house} — prominent influence`);
  }
  if (strengths.length === 0) strengths.push("Balanced planetary distribution");
  return strengths.slice(0, 4);
}

function getTemplateChallenges(chart: BirthChart): string[] {
  const challenges: string[] = [];
  for (const p of chart.planets) {
    if (p.dignity === "debilitated") challenges.push(`${p.name.en} is debilitated — requires conscious effort`);
    if (p.house === 6 || p.house === 8 || p.house === 12) challenges.push(`${p.name.en} in house ${p.house} — area of karmic challenge`);
  }
  if (challenges.length === 0) challenges.push("No major challenging aspects detected");
  return challenges.slice(0, 4);
}
