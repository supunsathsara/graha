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

// ─── App ───────────────────────────────────────────────────
const app = new Hono({ strict: false });

// ─── Middleware ────────────────────────────────────────────
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://*.vercel.app"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use("*", logger());
app.use("*", secureHeaders());

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

// ─── Root — serve frontend ─────────────────────────────
app.get("/", async (c) => {
  try {
    const filePath = new URL("../public/index.html", import.meta.url).pathname;
    const content = await fs.readFile(filePath);
    return c.newResponse(content, 200, { "Content-Type": "text/html; charset=utf-8" });
  } catch {
    // Fallback: JSON if file isn't found
    return c.json({
      name: "Graha API",
      description: "Vedic astrology API — visit / for the frontend",
      version: "1.0.0",
      docs: "/health",
      endpoints: {
        "POST /api/chart/compute": "Compute a birth chart",
        "POST /api/prediction/interpret": "Full chart interpretation",
      },
    });
  }
});

// ─── Static Files (public/) ────────────────────────────────
const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

app.get("/*", async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  if (pathname.startsWith("/api/")) return c.notFound();

  try {
    const filePath = join(PUBLIC_DIR, pathname);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const content = await fs.readFile(filePath);
    return c.newResponse(content, 200, { "Content-Type": contentType });
  } catch {
    return c.notFound();
  }
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
