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
