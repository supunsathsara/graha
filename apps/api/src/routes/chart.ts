/**
 * Chart calculation endpoints.
 *
 * POST /api/chart/compute  — compute a full birth chart
 * GET  /api/chart/:id      — retrieve a cached chart
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { computeBirthChart, initEphemeris } from "../lib/ephemeris.js";
import { generateId } from "../db/index.js";
import { logChartComputation, logError } from "../lib/logger.js";

const chartRouter = new Hono();

// Initialize Swiss Ephemeris on first use
let ephemerisInitialized = false;
function ensureEphemeris() {
  if (!ephemerisInitialized) {
    initEphemeris();
    ephemerisInitialized = true;
  }
}

// ─── Validation Schema ─────────────────────────────────────
const chartRequestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:mm (24h)"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
  name: z.string().max(100).optional(),
});

// ─── POST /compute ─────────────────────────────────────────
chartRouter.post("/compute", zValidator("json", chartRequestSchema), async (c) => {
  const start = Date.now();
  try {
    ensureEphemeris();

    const body = c.req.valid("json");
    const chart = computeBirthChart(body);
    const chartId = generateId();

    logChartComputation(
      body.birthDate, body.birthTime, body.latitude, body.longitude,
      Date.now() - start,
      { chartId }
    ).catch(() => {});

    return c.json({ success: true, chartId, data: chart });
  } catch (error) {
    console.error("[Chart] Compute error:", error);
    logError("Chart computation failed", error).catch(() => {});
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to compute chart" },
      500
    );
  }
});

// ─── GET /chart/:id ────────────────────────────────────────
chartRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  // TODO: Lookup in database
  return c.json({
    success: false,
    error: "Database not connected — chart not cached yet. Re-compute with POST.",
  });
});

export { chartRouter };
