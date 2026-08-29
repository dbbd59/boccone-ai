import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** One optional daily target set per account. Values are kcal or whole grams. */
export const dailyTargets = pgTable("daily_targets", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  calories: integer("calories"),
  proteinGrams: integer("protein_grams"),
  carbohydratesGrams: integer("carbohydrates_grams"),
  fatGrams: integer("fat_grams"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
