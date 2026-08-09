/**
 * Panchanga (Sinhala almanac) endpoint.
 *
 * GET /api/panchanga?date=YYYY-MM-DD&lat=..&lon=..
 * — sunrise/sunset, Rahu/Yama/Gulika Kala, Buddhist Era date,
 *   Sinhala month/weekday, day nakshatra, auspicious windows.
 *
 * Pure rule engine — no AI.
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { initEphemeris } from "../lib/ephemeris.js";
import { computePanchanga } from "../lib/panchanga.js";

const panchangaRouter = new Hono();

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initEphemeris();
    initialized = true;
  }
}

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

panchangaRouter.get("/", zValidator("query", querySchema), (c) => {
  try {
    ensureInit();
    const { date, lat, lon } = c.req.valid("query");
    const dateStr = date || new Date().toISOString().slice(0, 10);

    const panchanga = computePanchanga(dateStr, lat, lon);
    if (!panchanga) {
      return c.json(
        {
          success: false,
          error: "Could not compute sunrise/sunset for the given location.",
        },
        422,
      );
    }
    return c.json({ success: true, panchanga });
  } catch (error) {
    console.error("[Panchanga] error:", error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Panchanga computation failed",
      },
      500,
    );
  }
});

export { panchangaRouter };
