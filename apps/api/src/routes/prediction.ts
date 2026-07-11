/**
 * Prediction / Interpretation endpoints.
 *
 * POST /api/prediction/interpret  — rule-based Vedic reading (primary)
 *                                   + optional AI polish
 * POST /api/prediction/daily      — transit-based daily prediction
 * GET  /api/prediction/:id         — retrieve cached prediction
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { computeBirthChart, initEphemeris } from "../lib/ephemeris.js";
import { getChartInterpretation, getDailyPrediction, initAI } from "../lib/ai.js";
import { compileReading, readingToInterpretation } from "../lib/interpretations/index.js";
import { generateId } from "../db/index.js";
import { logChartComputation, logAIInteraction, logError } from "../lib/logger.js";

const predictionRouter = new Hono();

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initEphemeris();
    initAI();
    initialized = true;
  }
}

// ─── Validation Schemas ────────────────────────────────────

const interpretSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
  name: z.string().max(100).optional(),
  // AI mode: "polish" = rule-based + AI polish | "off" = rules only | "full" = AI only (legacy)
  aiMode: z.enum(["polish", "off", "full"]).optional(),
  provider: z.enum(["groq", "huggingface", "auto"]).optional(),
});

const dailySchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
  name: z.string().max(100).optional(),
  provider: z.enum(["groq", "huggingface", "auto"]).optional(),
});

// ─── POST /interpret ───────────────────────────────────────
predictionRouter.post("/interpret", zValidator("json", interpretSchema), async (c) => {
  try {
    ensureInit();
    const start = Date.now();

    const body = c.req.valid("json");
    const aiMode = body.aiMode || "polish"; // default: rule-based + AI polish

    const chart = computeBirthChart({
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone,
      name: body.name,
    });

    // Step 1: Rule engine — always runs
    const reading = compileReading(chart);
    let interpretation = readingToInterpretation(reading);

    // Step 2: AI polish (optional) — improves language, does NOT change facts
    let aiUsed = false;
    if (aiMode === "polish") {
      try {
        const aiStart = Date.now();
        const aiInterpretation = await getChartInterpretation(chart, body.provider || "auto");
        // Only use AI for the general text and formatting;
        // keep the rule-based specific fields (career, relationships, health, etc.)
        if (aiInterpretation.general && aiInterpretation.general.length > 10) {
          interpretation.general = aiInterpretation.general;
          aiUsed = true;
        }
        logAIInteraction(body.provider || "groq", "polish", Date.now() - aiStart, true).catch(() => {});
        // AI can enhance descriptions but not override calculated data
      } catch {
        logAIInteraction(body.provider || "groq", "polish", 0, false).catch(() => {});
        // AI polish failed — use pure rule-based result
      }
    }

    logChartComputation(
      body.birthDate, body.birthTime, body.latitude, body.longitude,
      Date.now() - start, { aiMode, aiUsed }
    ).catch(() => {});

    return c.json({
      success: true,
      predictionId: generateId(),
      chart,
      reading: {
        interpretation,
        houseInfluences: reading.houseInfluences,
        yogas: reading.yogas,
        doshas: reading.doshas,
        currentDasa: reading.currentDasa,
        strengths: reading.strengths,
        challenges: reading.challenges,
        remedies: reading.remedies,
        navamsa: reading.navamsa,
        aspects: reading.aspects,
        planetaryDignities: reading.planetaryDignities,
        panchamahapurushaYogas: reading.panchamahapurushaYogas,
      },
      ai: aiUsed,
    });
  } catch (error) {
    console.error("[Prediction] Interpret error:", error);
    logError("Interpretation failed", error).catch(() => {});
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate interpretation",
      },
      500
    );
  }
});

// ─── POST /daily ────────────────────────────────────────────
predictionRouter.post("/daily", zValidator("json", dailySchema), async (c) => {
  try {
    ensureInit();

    const body = c.req.valid("json");
    const chart = computeBirthChart({
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone,
      name: body.name,
    });

    // Daily predictions use the rule engine for current transits
    // and AI for natural language (if available)
    const reading = compileReading(chart);
    const prediction = await getDailyPrediction(chart, body.provider || "auto");

    return c.json({
      success: true,
      predictionId: generateId(),
      prediction,
      currentDasa: chart.currentDasa,
    });
  } catch (error) {
    console.error("[Prediction] Daily error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate daily prediction",
      },
      500
    );
  }
});

// ─── GET /:id ───────────────────────────────────────────────
predictionRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  // TODO: Retrieve from database
  return c.json({
    success: false,
    error: "Database not connected — prediction not cached. Re-generate with POST.",
  });
});

export { predictionRouter };
