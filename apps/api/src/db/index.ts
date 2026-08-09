/**
 * Database client — optional Neon PostgreSQL.
 *
 * When DATABASE_URL is set, connects to Neon PostgreSQL.
 * When unset, `ensureDb()` resolves null and all persistence features
 * gracefully no-op (charts/readings still work — they are computed on the fly).
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

export type Db = NeonHttpDatabase<typeof schema>;

let dbClient: Db | null = null;
let connecting: Promise<Db | null> | null = null;

/**
 * Async DB access. Resolves the connected client (or null if DATABASE_URL
 * is not configured). Safe to call from every handler — connection is lazy
 * and reused.
 */
export function ensureDb(): Promise<Db | null> {
  if (dbClient) return Promise.resolve(dbClient);
  if (connecting) return connecting;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[DB] DATABASE_URL not set — running without persistence.");
    return Promise.resolve(null);
  }

  connecting = (async () => {
    try {
      const sqlNeon: NeonQueryFunction<false, false> = neon(url);
      const client = drizzle(sqlNeon, { schema });
      // Verify connectivity once
      await client.execute(sql`select 1`);
      console.log("[DB] Connected to Neon PostgreSQL");
      dbClient = client;
      return client;
    } catch (err) {
      console.warn("[DB] Failed to connect to Neon:", (err as Error).message);
      return null;
    }
  })();

  return connecting;
}

// ─── Helper: generate UUIDs ────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID();
}
