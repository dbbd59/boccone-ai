import { z } from "zod";

import { mealCategorySchema } from "./meals";

const savedMealIdSchema = z.string().trim().min(1).max(128);
const savedMealNameSchema = z.string().trim().min(1).max(160);

/**
 * One line item of a saved meal template. References a catalog food by ID and
 * keeps name/portion fallbacks so a removed or merged food degrades to
 * "needs attention" instead of silently dropping the item.
 */
export const savedMealItemInputSchema = z.object({
  foodId: z.string().trim().min(1).max(128),
  portionName: z.string().trim().min(1).max(120),
  quantity: z.number().finite().positive().max(1_000),
  grams: z.number().finite().positive().max(100_000),
});
export type SavedMealItemInput = z.infer<typeof savedMealItemInputSchema>;

export const savedMealItemSchema = savedMealItemInputSchema.extend({
  foodId: z.string().nullable(),
  id: z.string(),
  /** Current catalog name resolved server-side; null when the food is gone. */
  foodName: z.string().nullable(),
  /** True when the referenced food no longer resolves in the catalog. */
  needsAttention: z.boolean(),
});
export type SavedMealItem = z.infer<typeof savedMealItemSchema>;

/** Weekday recurrence: 0=Monday .. 6=Sunday. Empty array means every day. */
export const routineWeekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .refine((days) => new Set(days).size === days.length, "Weekdays must be unique");

export const routineLocalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:MM format");

/**
 * Routine metadata attached to a Saved Meal. A Saved Meal without a routine is
 * just a template; the routine adds meal-type context and an optional reminder.
 */
export const savedMealRoutineSchema = z.object({
  mealType: mealCategorySchema.nullable(),
  weekdays: routineWeekdaysSchema,
  localTime: routineLocalTimeSchema,
  isReminderEnabled: z.boolean(),
});
export type SavedMealRoutine = z.infer<typeof savedMealRoutineSchema>;

export const savedMealRoutineInputSchema = z.object({
  mealType: mealCategorySchema.nullable().optional(),
  weekdays: routineWeekdaysSchema,
  localTime: routineLocalTimeSchema,
  isReminderEnabled: z.boolean().default(false),
});
export type SavedMealRoutineInput = z.infer<typeof savedMealRoutineInputSchema>;

export const createSavedMealSchema = z.object({
  name: savedMealNameSchema,
  defaultCategory: mealCategorySchema.nullable().optional(),
  items: z.array(savedMealItemInputSchema).min(1).max(100),
  /** Optionally create/update the routine in the same call. */
  routine: savedMealRoutineInputSchema.optional(),
});
export type CreateSavedMeal = z.infer<typeof createSavedMealSchema>;

export const updateSavedMealSchema = z
  .object({
    name: savedMealNameSchema.optional(),
    defaultCategory: mealCategorySchema.nullable().optional(),
    /** Replaces all items when provided. */
    items: z.array(savedMealItemInputSchema).min(1).max(100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one saved meal field is required");
export type UpdateSavedMeal = z.infer<typeof updateSavedMealSchema>;

export const savedMealSchema = z.object({
  id: z.string(),
  name: savedMealNameSchema,
  defaultCategory: mealCategorySchema.nullable(),
  items: z.array(savedMealItemSchema),
  routine: savedMealRoutineSchema.nullable(),
  usageCount: z.number().int().min(0),
  lastUsedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type SavedMeal = z.infer<typeof savedMealSchema>;

export const savedMealResponseSchema = z.object({ savedMeal: savedMealSchema });
export type SavedMealResponse = z.infer<typeof savedMealResponseSchema>;

export const savedMealsResponseSchema = z.object({
  savedMeals: z.array(savedMealSchema),
});
export type SavedMealsResponse = z.infer<typeof savedMealsResponseSchema>;

export const savedMealMutationResponseSchema = z.object({ success: z.literal(true) });
export type SavedMealMutationResponse = z.infer<typeof savedMealMutationResponseSchema>;

/**
 * Marks a Saved Meal as used after a meal created from it is successfully
 * persisted. Opening/previewing a template must NOT call this.
 */
export const useSavedMealSchema = z.object({
  mealId: z.string().trim().min(1).max(128),
});
export type UseSavedMeal = z.infer<typeof useSavedMealSchema>;

export const savedMealIdParamsSchema = z.object({ id: savedMealIdSchema });
