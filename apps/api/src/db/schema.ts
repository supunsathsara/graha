/**
 * Drizzle ORM schema for Graha — PostgreSQL.
 *
 * Tables:
 *   - users:      account & birth data
 *   - charts:     computed birth charts (cached)
 *   - predictions: AI-generated predictions (cached)
 */
import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  birthDate: text("birth_date").notNull(), // "YYYY-MM-DD"
  birthTime: text("birth_time").notNull(), // "HH:mm"
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezone: text("timezone").default("Asia/Colombo"),
  chartId: uuid("chart_id"), // FK to charts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const charts = pgTable("charts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  lagnaSign: integer("lagna_sign").notNull(),
  lagnaDegree: real("lagna_degree").notNull(),
  chartData: text("chart_data").notNull(), // JSON — full birth chart
  createdAt: timestamp("created_at").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  chartId: uuid("chart_id").references(() => charts.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(), // "daily" | "weekly" | "monthly" | "general"
  date: text("date").notNull(), // prediction date
  data: text("data").notNull(), // JSON — prediction content
  provider: text("provider").default("groq"), // AI provider used
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Family chart vault — no-login cloud storage for birth charts.
 *
 * A device generates a random family token (stored in the browser) and sends
 * it as the `X-Family-Id` header. All charts saved under that token are
 * private to the family. The full computed chart + reading are stored so
 * reloading is instant (no recompute, no AI cost).
 */
export const savedCharts = pgTable(
  "saved_charts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: text("family_id").notNull(),
    label: text("label").notNull(), // display name, e.g. "Father"
    birthData: text("birth_data").notNull(), // JSON — form inputs
    chart: text("chart").notNull(), // JSON — full BirthChart
    reading: text("reading").notNull(), // JSON — full compiled reading
    hash: text("hash"), // birth-data hash for dedup
    lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("saved_charts_family_idx").on(t.familyId),
    index("saved_charts_access_idx").on(t.lastAccessedAt),
  ],
);
