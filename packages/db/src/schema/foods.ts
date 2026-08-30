import { boolean, index, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { meals } from "./meals";

export const foods = pgTable(
  "foods",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    type: text("type").notNull(),
    category: text("category"),
    brand: text("brand"),
    barcode: text("barcode"),
    energyKcalPer100g: real("energy_kcal_per_100g"),
    proteinGPer100g: real("protein_g_per_100g"),
    carbohydratesGPer100g: real("carbohydrates_g_per_100g"),
    fatGPer100g: real("fat_g_per_100g"),
    fiberGPer100g: real("fiber_g_per_100g"),
    sugarGPer100g: real("sugar_g_per_100g"),
    saturatedFatGPer100g: real("saturated_fat_g_per_100g"),
    sodiumMgPer100g: real("sodium_mg_per_100g"),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    qualityLevel: text("quality_level").notNull(),
    status: text("status").notNull().default("APPROVED"),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("foods_normalized_name_idx").on(table.normalizedName),
    index("foods_status_owner_idx").on(table.status, table.ownerUserId),
    index("foods_barcode_idx").on(table.barcode),
    uniqueIndex("foods_source_identity_idx").on(table.sourceType, table.sourceId),
  ],
);

export const foodAliases = pgTable(
  "food_aliases",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("food_aliases_normalized_name_idx").on(table.normalizedName),
    uniqueIndex("food_aliases_food_locale_name_idx").on(
      table.foodId,
      table.locale,
      table.normalizedName,
    ),
  ],
);

export const foodPortions = pgTable(
  "food_portions",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: real("amount").notNull().default(1),
    unit: text("unit").notNull().default("serving"),
    gramWeight: real("gram_weight").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    sourceType: text("source_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("food_portions_food_idx").on(table.foodId)],
);

export const foodSubmissions = pgTable(
  "food_submissions",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("PENDING_REVIEW"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    reviewReason: text("review_reason"),
    mergedIntoFoodId: text("merged_into_food_id").references(() => foods.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("food_submissions_status_idx").on(table.status, table.createdAt),
    index("food_submissions_submitter_idx").on(table.submittedBy),
    uniqueIndex("food_submissions_food_idx").on(table.foodId),
  ],
);

/** Immutable nutrition values captured when a food is added to a meal. */
export const mealFoodEntries = pgTable(
  "meal_food_entries",
  {
    id: text("id").primaryKey(),
    mealId: text("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    foodNameSnapshot: text("food_name_snapshot").notNull(),
    portionNameSnapshot: text("portion_name_snapshot").notNull(),
    quantity: real("quantity").notNull(),
    grams: real("grams").notNull(),
    energyKcalSnapshot: real("energy_kcal_snapshot"),
    proteinGSnapshot: real("protein_g_snapshot"),
    carbohydratesGSnapshot: real("carbohydrates_g_snapshot"),
    fatGSnapshot: real("fat_g_snapshot"),
    fiberGSnapshot: real("fiber_g_snapshot"),
    sugarGSnapshot: real("sugar_g_snapshot"),
    saturatedFatGSnapshot: real("saturated_fat_g_snapshot"),
    sodiumMgSnapshot: real("sodium_mg_snapshot"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("meal_food_entries_meal_idx").on(table.mealId)],
);
