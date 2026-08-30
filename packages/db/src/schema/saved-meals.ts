import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { foods } from "./foods";

/**
 * Saved meal: a reusable template for future meals. Not history — items
 * reference the live food catalog so nutrition is re-resolved on each use.
 */
export const savedMeals = pgTable(
  "saved_meals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    /** Same values as meals.category ("breakfast"|"lunch"|"dinner"|"snack"), nullable. */
    defaultCategory: text("default_category"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saved_meals_user_idx").on(t.userId)],
);

/**
 * Template line items. foodId is the live catalog reference; name fallbacks
 * keep the row renderable if the food is later removed/merged (item then
 * surfaces as "needs attention" instead of silently dropping).
 */
export const savedMealItems = pgTable(
  "saved_meal_items",
  {
    id: text("id").primaryKey(),
    savedMealId: text("saved_meal_id")
      .notNull()
      .references(() => savedMeals.id, { onDelete: "cascade" }),
    foodId: text("food_id").references(() => foods.id, { onDelete: "set null" }),
    foodNameFallback: text("food_name_fallback").notNull(),
    portionNameFallback: text("portion_name_fallback"),
    quantity: real("quantity").notNull(),
    grams: real("grams").notNull(),
    position: smallint("position").notNull().default(0),
  },
  (t) => [index("saved_meal_items_meal_idx").on(t.savedMealId)],
);

/** Optional routine metadata attached to a saved meal (recurrence + reminder). */
export const savedMealRoutines = pgTable(
  "saved_meal_routines",
  {
    id: text("id").primaryKey(),
    savedMealId: text("saved_meal_id")
      .notNull()
      .references(() => savedMeals.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    /** Preferred meal category when spawning from this routine. */
    defaultCategory: text("default_category"),
    /** Weekday set, ISO order 0=Mon..6=Sun; empty means every day. */
    weekdays: text("weekdays").notNull().default("0,1,2,3,4"),
    /** Local wall-clock time HH:MM — never a UTC instant. */
    localTime: text("local_time").notNull().default("08:00"),
    isReminderEnabled: boolean("is_reminder_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("saved_meal_routines_user_idx").on(t.userId)],
);

/** Provenance for meals created from a saved meal (usage ranking signal). */
export const mealProvenance = pgTable("meal_provenance", {
  mealId: text("meal_id").primaryKey(),
  sourceSavedMealId: text("source_saved_meal_id"),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
});
