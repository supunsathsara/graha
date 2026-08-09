/**
 * Kundli matching (Guna Milan) endpoint.
 *
 * POST /api/match/compute — full Ashtakoota (36-point) compatibility analysis
 *                           with Mangal / Nadi / Bhakoot / Vedha / Rajju doshas.
 *
 * Pure rule engine — no AI involved.
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { computeBirthChart, initEphemeris } from "../lib/ephemeris.js";
import { computeGunaMilan } from "../lib/matchmaking.js";
import { generateId } from "../db/index.js";
import { logChartComputation, logError } from "../lib/logger.js";

const matchRouter = new Hono();

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initEphemeris();
    initialized = true;
  }
}

const personSchema = z.object({
  name: z.string().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
});

const matchSchema = z.object({
  boy: personSchema,
  girl: personSchema,
});

matchRouter.post("/compute", zValidator("json", matchSchema), async (c) => {
  try {
    ensureInit();
    const start = Date.now();
    const { boy, girl } = c.req.valid("json");

    const boyChart = computeBirthChart({
      birthDate: boy.birthDate,
      birthTime: boy.birthTime,
      latitude: boy.latitude,
      longitude: boy.longitude,
      timezone: boy.timezone,
      name: boy.name,
    });

    const girlChart = computeBirthChart({
      birthDate: girl.birthDate,
      birthTime: girl.birthTime,
      latitude: girl.latitude,
      longitude: girl.longitude,
      timezone: girl.timezone,
      name: girl.name,
    });

    const result = computeGunaMilan(boyChart, girlChart);

    logChartComputation(
      boy.birthDate,
      boy.birthTime,
      boy.latitude,
      boy.longitude,
      Date.now() - start,
      { match: true },
    ).catch(() => {});

    return c.json({ ...result, matchId: generateId() });
  } catch (error) {
    console.error("[Match] Compute error:", error);
    logError("Matchmaking failed", error).catch(() => {});
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to compute matchmaking",
      },
      500,
    );
  }
});

export { matchRouter };
