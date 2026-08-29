import { z } from "zod";

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
export const createMealSchema = z.object({
  name: mealNameSchema,
  category: mealCategorySchema,
  date: mealDateSchema,
  calories: mealCaloriesSchema,
  proteinGrams: mealGramsSchema,
  carbohydratesGrams: mealGramsSchema,
  fatGrams: mealGramsSchema,
  notes: mealNotesSchema.optional(),
});

export const updateMealSchema = createMealSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one meal field is required");

export type CreateMeal = z.infer<typeof createMealSchema>;
export type UpdateMeal = z.infer<typeof updateMealSchema>;

export const mealSchema = createMealSchema.extend({
  id: z.string(),
  notes: mealNotesSchema,
  source: z.literal("manual"),
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

export const mealIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const adminMealParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
  mealId: z.string().trim().min(1).max(128),
});
