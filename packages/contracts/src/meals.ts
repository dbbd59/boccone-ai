import { z } from "zod";

import { mealFoodEntryInputSchema, mealFoodEntrySchema } from "./foods";

export const mealCategorySchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type MealCategory = z.infer<typeof mealCategorySchema>;

export const mealDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => {
    const [yearPart, monthPart, dayPart] = value.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);
    const day = Number(dayPart);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Date must be a valid calendar date");

const mealNameSchema = z.string().trim().min(1).max(160);
const mealCaloriesSchema = z.number().int().min(0).max(100_000);
const mealGramsSchema = z.number().int().min(0).max(10_000);
const mealNotesSchema = z.string().trim().max(2_000).nullable();

/** Nutrition values are user-confirmed whole kcal/grams for the logged meal. */
const mealFields = {
  name: mealNameSchema,
  category: mealCategorySchema,
  date: mealDateSchema,
  notes: mealNotesSchema.optional(),
};

const manualMealSchema = z.object({
  ...mealFields,
  calories: mealCaloriesSchema,
  proteinGrams: mealGramsSchema,
  carbohydratesGrams: mealGramsSchema,
  fatGrams: mealGramsSchema,
});

export const foodMealSchema = z.object({
  ...mealFields,
  entries: z.array(mealFoodEntryInputSchema).min(1).max(100),
});

export const createMealSchema = z.union([foodMealSchema, manualMealSchema]);

export const updateMealSchema = z
  .object({
    name: mealNameSchema.optional(),
    category: mealCategorySchema.optional(),
    date: mealDateSchema.optional(),
    notes: mealNotesSchema.optional(),
    calories: mealCaloriesSchema.optional(),
    proteinGrams: mealGramsSchema.optional(),
    carbohydratesGrams: mealGramsSchema.optional(),
    fatGrams: mealGramsSchema.optional(),
    entries: z.array(mealFoodEntryInputSchema).min(1).max(100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one meal field is required");

export type CreateMeal = z.infer<typeof createMealSchema>;
export type UpdateMeal = z.infer<typeof updateMealSchema>;

export const mealSchema = z.object({
  ...mealFields,
  calories: mealCaloriesSchema,
  proteinGrams: mealGramsSchema,
  carbohydratesGrams: mealGramsSchema,
  fatGrams: mealGramsSchema,
  nutritionIncomplete: z.boolean(),
  id: z.string(),
  source: z.literal("manual"),
  entries: z.array(mealFoodEntrySchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Meal = z.infer<typeof mealSchema>;

export const mealResponseSchema = z.object({ meal: mealSchema });
export type MealResponse = z.infer<typeof mealResponseSchema>;

export const mealMutationResponseSchema = z.object({ success: z.literal(true) });
export type MealMutationResponse = z.infer<typeof mealMutationResponseSchema>;

export const mealTotalsSchema = z.object({
  calories: mealCaloriesSchema,
  proteinGrams: mealGramsSchema,
  carbohydratesGrams: mealGramsSchema,
  fatGrams: mealGramsSchema,
});

export type MealTotals = z.infer<typeof mealTotalsSchema>;

export const dailyMealsResponseSchema = z.object({
  date: mealDateSchema,
  meals: z.array(mealSchema),
  totals: mealTotalsSchema,
  nutritionIncomplete: z.boolean(),
});

export type DailyMealsResponse = z.infer<typeof dailyMealsResponseSchema>;

export const adminMealsQuerySchema = z.object({
  date: mealDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminMealsQuery = z.infer<typeof adminMealsQuerySchema>;

export const adminMealsResponseSchema = z.object({
  userId: z.string(),
  meals: z.array(mealSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type AdminMealsResponse = z.infer<typeof adminMealsResponseSchema>;

export const adminMealOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const adminGlobalMealSchema = mealSchema.extend({
  user: adminMealOwnerSchema,
});

export type AdminGlobalMeal = z.infer<typeof adminGlobalMealSchema>;

export const adminGlobalMealsQuerySchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  date: mealDateSchema.optional(),
  category: mealCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminGlobalMealsQuery = z.infer<typeof adminGlobalMealsQuerySchema>;

export const adminGlobalMealsResponseSchema = z.object({
  meals: z.array(adminGlobalMealSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export type AdminGlobalMealsResponse = z.infer<typeof adminGlobalMealsResponseSchema>;

export const adminGlobalMealResponseSchema = z.object({
  meal: adminGlobalMealSchema,
});

export const mealIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const adminMealParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
  mealId: z.string().trim().min(1).max(128),
});

export const adminMealIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
});
