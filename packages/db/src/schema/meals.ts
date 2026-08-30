import { boolean, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Confirmed meal nutrition. Photos and provider payloads never enter this table. */
export const meals = pgTable(
  "meals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    mealDate: date("meal_date", { mode: "string" }).notNull(),
    calories: integer("calories").notNull(),
    proteinGrams: integer("protein_grams").notNull(),
    carbohydratesGrams: integer("carbohydrates_grams").notNull(),
    fatGrams: integer("fat_grams").notNull(),
    nutritionIncomplete: boolean("nutrition_incomplete").notNull().default(false),
    notes: text("notes"),
    source: text("source").default("manual").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meals_user_date_idx").on(table.userId, table.mealDate),
    index("meals_user_created_idx").on(table.userId, table.createdAt),
  ],
);
