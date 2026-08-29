import { z } from "zod";

const caloriesTargetSchema = z.number().int().min(1).max(100_000).nullable();
const gramsTargetSchema = z.number().int().min(1).max(10_000).nullable();

/** User-controlled daily values; null means that target is intentionally unset. */
export const dailyTargetsSchema = z.object({
  calories: caloriesTargetSchema,
  proteinGrams: gramsTargetSchema,
  carbohydratesGrams: gramsTargetSchema,
  fatGrams: gramsTargetSchema,
});

export const dailyTargetsResponseSchema = z.object({
  targets: dailyTargetsSchema,
});

export const updateDailyTargetsSchema = dailyTargetsSchema;

export type DailyTargets = z.infer<typeof dailyTargetsSchema>;
export type DailyTargetsResponse = z.infer<typeof dailyTargetsResponseSchema>;
