/**
 * User profile endpoints.
 *
 * POST /api/profile/create  — create a user profile
 * GET  /api/profile/:id     — get profile
 * PUT  /api/profile/:id     — update profile
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { generateId } from "../db/index.js";

const profileRouter = new Hono();

// In-memory store for development (replace with DB later)
const profiles = new Map<string, any>();

// ─── Validation Schema ─────────────────────────────────────
const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().optional(),
});

const updateProfileSchema = createProfileSchema.partial();

// ─── POST /create ──────────────────────────────────────────
profileRouter.post("/create", zValidator("json", createProfileSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const id = generateId();

    const profile = {
      id,
      ...body,
      timezone: body.timezone || "Asia/Colombo",
      createdAt: new Date().toISOString(),
    };

    profiles.set(id, profile);

    return c.json({
      success: true,
      profile,
    }, 201);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create profile",
      },
      500
    );
  }
});

// ─── GET /:id ───────────────────────────────────────────────
profileRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const profile = profiles.get(id);

  if (!profile) {
    return c.json({
      success: false,
      error: "Profile not found",
    }, 404);
  }

  return c.json({
    success: true,
    profile,
  });
});

// ─── PUT /:id ───────────────────────────────────────────────
profileRouter.put("/:id", zValidator("json", updateProfileSchema), async (c) => {
  const id = c.req.param("id");
  const existing = profiles.get(id);

  if (!existing) {
    return c.json({
      success: false,
      error: "Profile not found",
    }, 404);
  }

  const body = c.req.valid("json");
  const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
  profiles.set(id, updated);

  return c.json({
    success: true,
    profile: updated,
  });
});

// ─── GET / ──────────────────────────────────────────────────
profileRouter.get("/", async (c) => {
  return c.json({
    success: true,
    profiles: Array.from(profiles.values()),
    count: profiles.size,
  });
});

export { profileRouter };
