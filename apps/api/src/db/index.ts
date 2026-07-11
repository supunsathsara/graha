/**
 * Database client — optional Neon PostgreSQL.
 *
 * When DATABASE_URL is set, connects to Neon PostgreSQL.
 * When unset, returns a no-op stub — all chart/reading features work without a database.
 */
let dbClient: any = null;

export function getDb() {
  if (dbClient) return dbClient;

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[DB] DATABASE_URL not set — running without database persistence.");
    dbClient = { __stub: true };
    return dbClient;
  }

  // Lazy dynamic import — only loads Neon when DATABASE_URL is set
  import("@neondatabase/serverless").then(({ neon }) => {
    import("drizzle-orm/neon-http").then(({ drizzle }) => {
      import("./schema.js").then((schema) => {
        const sql = neon(url);
        dbClient = drizzle(sql, { schema });
        console.log("[DB] Connected to Neon PostgreSQL");
      });
    });
  }).catch((err) => {
    console.warn("[DB] Failed to connect to Neon:", err.message);
    dbClient = { __stub: true };
  });

  // Return stub immediately; dbClient gets replaced when Neon connects
  dbClient = { __stub: true };
  return dbClient;
}

// Eager init on module load
export const db = getDb();

// ─── Helper: generate UUIDs ────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID();
}
