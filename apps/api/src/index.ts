/**
 * Graha — Vedic Astrology API
 *
 * Hono.js application running on Vercel Edge Functions.
 *
 * Endpoints:
 *   POST /api/chart/compute        — compute birth chart
 *   GET  /api/chart/:id            — get cached chart
 *   POST /api/prediction/interpret — AI chart interpretation
 *   POST /api/prediction/daily     — AI daily prediction
 *   POST /api/profile/create       — create user profile
 *   GET  /api/profile/:id          — get user profile
 *   GET  /health                   — health check
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env.local from the project root (two levels up from src/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../../.env.local");
config({ path: envPath });

import { promises as fs } from "fs";
import { join, extname } from "path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { chartRouter } from "./routes/chart.js";
import { predictionRouter } from "./routes/prediction.js";
import { profileRouter } from "./routes/profile.js";
import { logRequest, logError } from "./lib/logger.js";
import { rateLimit } from "./lib/ratelimit.js";

// ─── App ───────────────────────────────────────────────────
const app = new Hono({ strict: false });

// ─── Middleware ────────────────────────────────────────────
// ─── Auth Middleware ────────────────────────────────────────
const API_SECRET = process.env.API_SECRET;

app.use("*", async (c, next) => {
  // Skip auth check for health endpoint
  if (c.req.path === "/health") return next();

  // If API_SECRET is set, validate the X-Graha-Secret header
  if (API_SECRET) {
    const clientSecret = c.req.header("X-Graha-Secret");
    if (!clientSecret || clientSecret !== API_SECRET) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }
  }
  await next();
});

// ─── Rate Limiting ───────────────────────────────────────────
app.use("*", rateLimit);

app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Graha-Secret"],
  credentials: true,
}));
app.use("*", logger());
app.use("*", secureHeaders());

// ─── Axiom Request Logging ─────────────────────────────────
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  if (c.req.path === "/health") return;
  if (c.res) {
    logRequest(c.req.method, c.req.path, c.res.status, duration).catch(() => {});
  }
});

// ─── Routes ────────────────────────────────────────────────
app.route("/api/chart", chartRouter);
app.route("/api/prediction", predictionRouter);
app.route("/api/profile", profileRouter);

// ─── Health Check ───────────────────────────────────────────
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    name: "graha",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    ai: {
      groq: !!process.env.GROQ_API_KEY,
      huggingface: !!process.env.HF_TOKEN,
    },
  });
});

// ─── Root ────────────────────────────────────────────────
app.get("/", (c) => {
  return c.json({
    name: "Graha API",
    version: "1.0.0",
    description: "Vedic astrology engine — API endpoints at /api/*",
    docs: "/health",
    endpoints: {
      "POST /api/chart/compute": "Compute a birth chart",
      "POST /api/prediction/interpret": "Full chart reading + optional AI",
      "POST /api/prediction/daily": "Daily prediction",
      "POST /api/profile/create": "Create user profile",
    },
  });
});

// ─── Vercel Edge Handler ──────────────────────────────────
// Uses Hono's Vercel adapter to run on Vercel Edge Functions.
// For pure Node.js, export app; for Vercel, export the handler.
import { handle } from "hono/vercel";

// Vercel Edge Function handler
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

// For local dev usage: `pnpm dev` (uses tsx + @hono/node-server)
if (process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT) || 3001;
  console.log(`[Graha] Starting local dev server on http://localhost:${port}`);
  // Vercel adapter handle is for production; for dev we use @hono/node-server
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port });
}
