/**
 * Drizzle Kit configuration.
 *
 * Reads DATABASE_URL from the environment.
 * For Supabase:
 *   DATABASE_URL="postgresql://postgres:password@db.<project>.supabase.co:5432/postgres"
 * For local:
 *   DATABASE_URL="postgresql://postgres:password@localhost:5432/graha"
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
