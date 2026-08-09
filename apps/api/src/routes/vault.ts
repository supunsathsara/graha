/**
 * Family chart vault endpoints.
 *
 * POST   /api/vault/charts       — save a computed chart + reading
 * GET    /api/vault/charts       — list saved charts for this family token
 * GET    /api/vault/charts/:id   — full chart + reading (instant reload)
 * DELETE /api/vault/charts/:id   — remove a saved chart
 *
 * Auth: the browser sends the family key as the `X-Family-Id` header.
 * The key is a bearer secret — anyone holding it can access the vault, so
 * the UI tells users to treat it like a password and keep it safe.
 *
 * Storage policy:
 *   - MAX_CHARTS_PER_FAMILY: 25 — oldest are auto-removed when exceeded
 *   - RETENTION_DAYS: 365 — vaults untouched for a year are pruned
 *   - MAX_PAYLOAD_BYTES: 200 KB per row (sanity guard)
 */
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { ensureDb } from "../db/index.js";
import { savedCharts } from "../db/schema.js";

const vaultRouter = new Hono();

// ─── Policy constants ───────────────────────────────────────
const MAX_CHARTS_PER_FAMILY = 25;
const RETENTION_DAYS = 365;
const MAX_PAYLOAD_BYTES = 200_000;

// Accepts the new GRH-XXXX-XXXX-XXXX-XXXX format, legacy UUIDs, and any
// opaque 8-64 char alnum/dash token (backward compatible).
const KEY_RE = /^[a-zA-Z0-9-]{8,64}$/;

let lastPruneAt = 0;

function familyId(c: any): string | null {
  const id = c.req.header("x-family-id");
  return id && KEY_RE.test(id) ? id : null;
}

function isTooLarge(obj: unknown): boolean {
  try {
    return JSON.stringify(obj).length > MAX_PAYLOAD_BYTES;
  } catch {
    return true;
  }
}

/**
 * Opportunistic global prune — deletes vault rows not touched in
 * RETENTION_DAYS. Runs at most once per server-process hour (free-plan
 * mindful: no cron, no extra compute, and each run is one indexed DELETE).
 */
async function pruneIfDue(db: any) {
  const now = Date.now();
  if (now - lastPruneAt < 60 * 60 * 1000) return;
  lastPruneAt = now;
  try {
    await db
      .delete(savedCharts)
      .where(lt(savedCharts.lastAccessedAt, sql`now() - interval '365 days'`));
    console.log("[Vault] pruned rows untouched for", RETENTION_DAYS, "days");
  } catch (e) {
    console.warn("[Vault] prune failed:", (e as Error).message);
  }
}

const saveSchema = z.object({
  label: z.string().min(1).max(100),
  birthData: z.record(z.string(), z.any()),
  chart: z.record(z.string(), z.any()),
  reading: z.record(z.string(), z.any()),
  hash: z.string().max(64).optional(),
});

// ─── POST /api/vault/charts ─────────────────────────────────
vaultRouter.post("/charts", zValidator("json", saveSchema), async (c) => {
  const fid = familyId(c);
  if (!fid) {
    return c.json(
      { success: false, error: "Missing or invalid X-Family-Id header" },
      400,
    );
  }

  const db = await ensureDb();
  if (!db)
    return c.json({ success: false, error: "Database not configured" }, 503);

  try {
    const body = c.req.valid("json");
    if (isTooLarge(body)) {
      return c.json(
        { success: false, error: "Chart payload too large to store" },
        413,
      );
    }

    const rows = await db
      .insert(savedCharts)
      .values({
        familyId: fid,
        label: body.label,
        birthData: JSON.stringify(body.birthData),
        chart: JSON.stringify(body.chart),
        reading: JSON.stringify(body.reading),
        hash: body.hash || null,
      })
      .returning({ id: savedCharts.id, createdAt: savedCharts.createdAt });

    // Per-family cap: keep the newest MAX_CHARTS_PER_FAMILY rows.
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(savedCharts)
      .where(eq(savedCharts.familyId, fid));
    if (count > MAX_CHARTS_PER_FAMILY) {
      const excess = count - MAX_CHARTS_PER_FAMILY;
      const oldest = await db
        .select({ id: savedCharts.id })
        .from(savedCharts)
        .where(eq(savedCharts.familyId, fid))
        .orderBy(savedCharts.createdAt)
        .limit(excess);
      if (oldest.length) {
        await db.delete(savedCharts).where(
          sql`${savedCharts.id} in (${sql.join(
            oldest.map((o) => sql`${o.id}`),
            sql`, `,
          )})`,
        );
      }
    }

    return c.json({ success: true, saved: rows[0] }, 201);
  } catch (error) {
    console.error("[Vault] save error:", error);
    return c.json({ success: false, error: "Failed to save chart" }, 500);
  }
});

// ─── GET /api/vault/charts ──────────────────────────────────
vaultRouter.get("/charts", async (c) => {
  const fid = familyId(c);
  if (!fid)
    return c.json(
      { success: false, error: "Missing or invalid X-Family-Id header" },
      400,
    );

  const db = await ensureDb();
  if (!db)
    return c.json({ success: false, error: "Database not configured" }, 503);

  try {
    await pruneIfDue(db);

    // Track access (drives the 365-day retention policy)
    await db
      .update(savedCharts)
      .set({ lastAccessedAt: sql`now()` })
      .where(eq(savedCharts.familyId, fid));

    const rows = await db
      .select({
        id: savedCharts.id,
        label: savedCharts.label,
        birthData: savedCharts.birthData,
        createdAt: savedCharts.createdAt,
      })
      .from(savedCharts)
      .where(eq(savedCharts.familyId, fid))
      .orderBy(desc(savedCharts.createdAt));

    const list = rows.map((r) => {
      let bd: any = {};
      try {
        bd = JSON.parse(r.birthData);
      } catch {}
      return {
        id: r.id,
        label: r.label,
        birthDate: bd.birthDate || "",
        birthTime: bd.birthTime || "",
        createdAt: r.createdAt,
      };
    });

    return c.json({
      success: true,
      charts: list,
      maxCharts: MAX_CHARTS_PER_FAMILY,
    });
  } catch (error) {
    console.error("[Vault] list error:", error);
    return c.json({ success: false, error: "Failed to list charts" }, 500);
  }
});

// ─── GET /api/vault/charts/:id ──────────────────────────────
vaultRouter.get("/charts/:id", async (c) => {
  const fid = familyId(c);
  if (!fid)
    return c.json(
      { success: false, error: "Missing or invalid X-Family-Id header" },
      400,
    );
  const id = c.req.param("id");

  const db = await ensureDb();
  if (!db)
    return c.json({ success: false, error: "Database not configured" }, 503);

  try {
    const rows = await db
      .select()
      .from(savedCharts)
      .where(and(eq(savedCharts.id, id), eq(savedCharts.familyId, fid)))
      .limit(1);

    if (!rows.length)
      return c.json({ success: false, error: "Chart not found" }, 404);

    // Track access
    await db
      .update(savedCharts)
      .set({ lastAccessedAt: sql`now()` })
      .where(eq(savedCharts.id, id));

    const row = rows[0];
    return c.json({
      success: true,
      chart: JSON.parse(row.chart),
      reading: JSON.parse(row.reading),
      birthData: JSON.parse(row.birthData),
      label: row.label,
    });
  } catch (error) {
    console.error("[Vault] get error:", error);
    return c.json({ success: false, error: "Failed to load chart" }, 500);
  }
});

// ─── DELETE /api/vault/charts/:id ───────────────────────────
vaultRouter.delete("/charts/:id", async (c) => {
  const fid = familyId(c);
  if (!fid)
    return c.json(
      { success: false, error: "Missing or invalid X-Family-Id header" },
      400,
    );
  const id = c.req.param("id");

  const db = await ensureDb();
  if (!db)
    return c.json({ success: false, error: "Database not configured" }, 503);

  try {
    const rows = await db
      .delete(savedCharts)
      .where(and(eq(savedCharts.id, id), eq(savedCharts.familyId, fid)))
      .returning({ id: savedCharts.id });
    if (!rows.length)
      return c.json({ success: false, error: "Chart not found" }, 404);
    return c.json({ success: true, deleted: rows[0].id });
  } catch (error) {
    console.error("[Vault] delete error:", error);
    return c.json({ success: false, error: "Failed to delete chart" }, 500);
  }
});

export { vaultRouter };
