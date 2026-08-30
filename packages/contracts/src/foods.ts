import { z } from "zod";

export const foodTypeSchema = z.enum(["generic", "branded", "dish"]);
export type FoodType = z.infer<typeof foodTypeSchema>;

export const foodSourceTypeSchema = z.enum([
  "USDA",
  "OPEN_FOOD_FACTS",
  "CREA",
  "BOCCONE_CURATED",
  "USER_SUBMITTED",
  "AI_ESTIMATE",
]);
export type FoodSourceType = z.infer<typeof foodSourceTypeSchema>;

export const foodQualityLevelSchema = z.enum([
  "authoritative",
  "branded_label",
  "boccone_verified",
  "community_approved",
  "user_private",
  "ai_estimated",
]);
export type FoodQualityLevel = z.infer<typeof foodQualityLevelSchema>;

export const foodStatusSchema = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "MERGED",
]);
export type FoodStatus = z.infer<typeof foodStatusSchema>;

const nonNegativeNutrition = z.number().finite().min(0).max(100_000).nullable();
const requiredNutrition = z.number().finite().min(0).max(100_000);

export const nutritionPer100gSchema = z.object({
  energyKcal: nonNegativeNutrition,
  proteinG: nonNegativeNutrition,
  carbohydratesG: nonNegativeNutrition,
  fatG: nonNegativeNutrition,
  fiberG: nonNegativeNutrition,
  sugarG: nonNegativeNutrition,
  saturatedFatG: nonNegativeNutrition,
  sodiumMg: nonNegativeNutrition,
});
export type NutritionPer100g = z.infer<typeof nutritionPer100gSchema>;

export const foodPortionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().positive(),
  unit: z.string(),
  gramWeight: z.number().positive(),
  isDefault: z.boolean(),
  sourceType: foodSourceTypeSchema,
});
export type FoodPortion = z.infer<typeof foodPortionSchema>;

export const foodAliasSchema = z.object({
  id: z.string(),
  locale: z.string().min(2).max(10),
  name: z.string(),
});
export type FoodAlias = z.infer<typeof foodAliasSchema>;

export const foodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: foodTypeSchema,
  category: z.string().nullable(),
  brand: z.string().nullable(),
  barcode: z.string().nullable(),
  nutritionPer100g: nutritionPer100gSchema,
  sourceType: foodSourceTypeSchema,
  sourceId: z.string().nullable(),
  sourceName: z.string().nullable(),
  sourceUrl: z.url().nullable(),
  qualityLevel: foodQualityLevelSchema,
  status: foodStatusSchema,
  portions: z.array(foodPortionSchema),
  aliases: z.array(foodAliasSchema),
  isPrivate: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Food = z.infer<typeof foodSchema>;

export const foodSearchQuerySchema = z.object({
  query: z.string().trim().max(120).default(""),
  locale: z.enum(["en", "it"]).default("it"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type FoodSearchQuery = z.infer<typeof foodSearchQuerySchema>;

export const foodSearchResponseSchema = z.object({
  foods: z.array(foodSchema),
  recent: z.array(foodSchema),
  frequent: z.array(foodSchema),
});
export type FoodSearchResponse = z.infer<typeof foodSearchResponseSchema>;

export const createFoodSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  brand: z.string().trim().max(160).nullable().optional(),
  type: foodTypeSchema.default("generic"),
  category: z.string().trim().max(120).nullable().optional(),
  portionName: z.string().trim().min(1).max(120).default("100 g"),
  portionGrams: z.number().finite().positive().max(100_000).default(100),
  nutritionPer100g: nutritionPer100gSchema.extend({
    energyKcal: requiredNutrition,
    proteinG: requiredNutrition,
    carbohydratesG: requiredNutrition,
    fatG: requiredNutrition,
  }),
});
export type CreateFoodSubmission = z.infer<typeof createFoodSubmissionSchema>;

export const foodSubmissionSchema = z.object({
  id: z.string(),
  foodId: z.string(),
  submittedBy: z.string(),
  status: foodStatusSchema,
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  reviewReason: z.string().nullable(),
  mergedIntoFoodId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type FoodSubmission = z.infer<typeof foodSubmissionSchema>;

export const foodSubmissionResponseSchema = z.object({
  food: foodSchema,
  submission: foodSubmissionSchema,
});
export type FoodSubmissionResponse = z.infer<typeof foodSubmissionResponseSchema>;

export const mealFoodEntryInputSchema = z.object({
  foodId: z.string().trim().min(1).max(128),
  portionName: z.string().trim().min(1).max(120),
  quantity: z.number().finite().positive().max(1_000),
  grams: z.number().finite().positive().max(100_000),
});
export type MealFoodEntryInput = z.infer<typeof mealFoodEntryInputSchema>;

export const mealFoodEntryUpdateInputSchema = mealFoodEntryInputSchema.extend({
  /** Existing entry ids allow the API to preserve unchanged snapshots. */
  id: z.string().trim().min(1).max(128).optional(),
});
export type MealFoodEntryUpdateInput = z.infer<typeof mealFoodEntryUpdateInputSchema>;

export const mealFoodEntrySchema = z.object({
  id: z.string(),
  foodId: z.string(),
  foodName: z.string(),
  portionName: z.string(),
  quantity: z.number().nonnegative(),
  grams: z.number().nonnegative(),
  energyKcal: z.number().nonnegative().nullable(),
  proteinG: z.number().nonnegative().nullable(),
  carbohydratesG: z.number().nonnegative().nullable(),
  fatG: z.number().nonnegative().nullable(),
  fiberG: z.number().nonnegative().nullable(),
  sugarG: z.number().nonnegative().nullable(),
  saturatedFatG: z.number().nonnegative().nullable(),
  sodiumMg: z.number().nonnegative().nullable(),
});
export type MealFoodEntry = z.infer<typeof mealFoodEntrySchema>;

export const adminFoodsQuerySchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  status: foodStatusSchema.optional(),
  sourceType: foodSourceTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type AdminFoodsQuery = z.infer<typeof adminFoodsQuerySchema>;

export const adminFoodsResponseSchema = z.object({
  foods: z.array(foodSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type AdminFoodsResponse = z.infer<typeof adminFoodsResponseSchema>;

export const adminFoodResponseSchema = z.object({ food: foodSchema });

export const adminFoodIdParamsSchema = z.object({ id: z.string().trim().min(1).max(128) });
export const adminFoodSubmissionIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const adminFoodUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  category: z.string().trim().max(120).nullable().optional(),
  type: foodTypeSchema.optional(),
  brand: z.string().trim().max(160).nullable().optional(),
  aliases: z
    .array(z.object({ locale: z.string().min(2).max(10), name: z.string().trim().min(1).max(120) }))
    .max(50)
    .optional(),
  portions: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        amount: z.number().finite().positive().max(10_000),
        unit: z.string().trim().min(1).max(32),
        gramWeight: z.number().finite().positive().max(100_000),
        isDefault: z.boolean(),
      }),
    )
    .max(50)
    .optional(),
  nutritionPer100g: nutritionPer100gSchema.optional(),
});
export type AdminFoodUpdate = z.infer<typeof adminFoodUpdateSchema>;

export const adminFoodSubmissionsQuerySchema = z.object({
  status: foodStatusSchema.default("PENDING_REVIEW"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type AdminFoodSubmissionsQuery = z.infer<typeof adminFoodSubmissionsQuerySchema>;

export const adminFoodSubmissionSchema = foodSubmissionSchema.extend({
  food: foodSchema,
  submitter: z.object({ id: z.string(), name: z.string(), email: z.email() }),
  possibleDuplicates: z.array(foodSchema),
  validationFlags: z.array(z.string()),
});
export type AdminFoodSubmission = z.infer<typeof adminFoodSubmissionSchema>;

export const adminFoodSubmissionsResponseSchema = z.object({
  submissions: z.array(adminFoodSubmissionSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type AdminFoodSubmissionsResponse = z.infer<typeof adminFoodSubmissionsResponseSchema>;

export const adminFoodSubmissionResponseSchema = z.object({
  submission: adminFoodSubmissionSchema,
});

export const adminFoodRejectSchema = z.object({
  reason: z.string().trim().max(500).nullable().optional(),
});
export const adminFoodMergeSchema = z.object({ foodId: z.string().trim().min(1).max(128) });
