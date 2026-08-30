import { z } from "zod";

import { foodSchema } from "./foods";

export const aiProviderSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
  "openai-compatible",
]);
export type AiProvider = z.infer<typeof aiProviderSchema>;

export const aiFeatureSchema = z.enum(["MEAL_NATURAL_LANGUAGE", "AI_CONNECTION_TEST"]);
export type AiFeature = z.infer<typeof aiFeatureSchema>;

export const aiModelCapabilitiesSchema = z.object({
  text: z.boolean().optional(),
  structuredOutput: z.boolean().optional(),
  tools: z.boolean().optional(),
  vision: z.boolean().optional(),
  reasoning: z.boolean().optional(),
});

export const aiModelSchema = z.object({
  id: z.string().min(1).max(160),
  label: z.string().min(1).max(160),
  capabilities: aiModelCapabilitiesSchema,
});
export type AiModel = z.infer<typeof aiModelSchema>;

export const aiProviderDefinitionSchema = z.object({
  id: aiProviderSchema,
  label: z.string().min(1).max(160),
  requiresBaseUrl: z.boolean(),
  supportsModelDiscovery: z.boolean(),
  guide: z.object({
    key: aiProviderSchema,
    docsUrl: z.url().optional(),
    apiKeyUrl: z.url().optional(),
  }),
  recommendedModels: z.array(aiModelSchema),
});
export type AiProviderDefinition = z.infer<typeof aiProviderDefinitionSchema>;

export const aiModelPricingSchema = z.object({
  input: z.number().finite().nonnegative().optional(),
  output: z.number().finite().nonnegative().optional(),
  currency: z.string().min(1).max(16).optional(),
  unit: z.string().min(1).max(32).optional(),
});

export const aiModelDescriptorSchema = z.object({
  id: z.string().min(1).max(160),
  displayName: z.string().min(1).max(160),
  provider: aiProviderSchema,
  description: z.string().max(2_000).optional(),
  contextWindow: z.number().int().positive().optional(),
  capabilities: aiModelCapabilitiesSchema.optional(),
  inputModalities: z.array(z.string().min(1).max(32)).max(16).optional(),
  outputModalities: z.array(z.string().min(1).max(32)).max(16).optional(),
  pricing: aiModelPricingSchema.optional(),
  createdAt: z.string().datetime().optional(),
  publisher: z.string().min(1).max(160).optional(),
  source: z.enum(["provider", "manual"]),
});
export type AiModelDescriptor = z.infer<typeof aiModelDescriptorSchema>;

export const aiModelsResponseSchema = z.object({
  provider: aiProviderSchema,
  models: z.array(aiModelDescriptorSchema),
  stale: z.boolean(),
  cachedAt: z.string().datetime().nullable(),
});
export type AiModelsResponse = z.infer<typeof aiModelsResponseSchema>;

export const aiSettingsResponseSchema = z.object({
  settings: z
    .object({
      provider: aiProviderSchema,
      model: z.string().min(1).max(160).nullable(),
      baseUrl: z.url().nullable(),
      hasApiKey: z.boolean(),
    })
    .nullable(),
  providers: z.array(aiProviderDefinitionSchema),
});
export type AiSettingsResponse = z.infer<typeof aiSettingsResponseSchema>;

export const updateAiSettingsSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().trim().min(1).max(160).optional(),
  apiKey: z.string().trim().min(1).max(10_000).optional(),
  baseUrl: z.url().nullable().optional(),
});
export type UpdateAiSettings = z.infer<typeof updateAiSettingsSchema>;

export const aiConnectionTestResponseSchema = z.object({
  success: z.literal(true),
  provider: aiProviderSchema,
  model: z.string(),
});
export type AiConnectionTestResponse = z.infer<typeof aiConnectionTestResponseSchema>;

export const mealInterpretationRequestSchema = z.object({
  text: z.string().trim().min(1).max(4_000),
  locale: z.enum(["en", "it"]).default("it"),
  timezone: z.string().trim().min(1).max(80).default("UTC"),
});
export type MealInterpretationRequest = z.infer<typeof mealInterpretationRequestSchema>;

export const mealDraftResolutionStatusSchema = z.enum([
  "RESOLVED",
  "AMBIGUOUS",
  "UNRESOLVED",
  "ESTIMATED",
]);
export type MealDraftResolutionStatus = z.infer<typeof mealDraftResolutionStatusSchema>;

const draftNutritionValue = z.number().finite().nonnegative().nullable();
export const mealDraftNutritionSchema = z.object({
  calories: draftNutritionValue,
  proteinGrams: draftNutritionValue,
  carbohydratesGrams: draftNutritionValue,
  fatGrams: draftNutritionValue,
});
export type MealDraftNutrition = z.infer<typeof mealDraftNutritionSchema>;

export const mealDraftFoodSchema = z.object({
  sourceText: z.string(),
  normalizedName: z.string(),
  food: foodSchema.nullable(),
  candidates: z.array(foodSchema).max(5),
  portionName: z.string(),
  quantity: z.number().positive(),
  grams: z.number().positive().nullable(),
  nutrition: mealDraftNutritionSchema.nullable(),
  confidence: z.number().min(0).max(1),
  resolutionStatus: mealDraftResolutionStatusSchema,
  reviewNote: z.string().nullable(),
});
export type MealDraftFood = z.infer<typeof mealDraftFoodSchema>;

export const mealDraftSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable(),
  mealName: z.string().nullable(),
  foods: z.array(mealDraftFoodSchema),
  notes: z.string().nullable(),
  totals: mealDraftNutritionSchema,
  nutritionIncomplete: z.boolean(),
});
export type MealDraft = z.infer<typeof mealDraftSchema>;

export const mealDraftResponseSchema = z.object({ draft: mealDraftSchema });
export type MealDraftResponse = z.infer<typeof mealDraftResponseSchema>;

export const adminAiUsageQuerySchema = z.object({
  feature: aiFeatureSchema.optional(),
  provider: aiProviderSchema.optional(),
  status: z.enum(["succeeded", "failed", "cancelled"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type AdminAiUsageQuery = z.infer<typeof adminAiUsageQuerySchema>;

export const aiUsageStatusSchema = z.enum(["succeeded", "failed", "cancelled"]);
export const adminAiUsageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user: z.object({ id: z.string(), name: z.string(), email: z.email() }).nullable(),
  feature: aiFeatureSchema,
  provider: aiProviderSchema,
  model: z.string(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  latencyMs: z.number().int().nonnegative(),
  status: aiUsageStatusSchema,
  errorCode: z.string().nullable(),
  providerRequestId: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type AdminAiUsage = z.infer<typeof adminAiUsageSchema>;

const aiUsageBreakdownSchema = z.object({
  key: z.string().min(1),
  requests: z.number().int().nonnegative(),
});

export const adminAiUsageSummarySchema = z.object({
  requestCount: z.number().int().nonnegative(),
  succeededCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  cancelledCount: z.number().int().nonnegative(),
  averageLatencyMs: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  byProvider: z.array(aiUsageBreakdownSchema),
  byModel: z.array(aiUsageBreakdownSchema),
  byFeature: z.array(aiUsageBreakdownSchema),
});
export type AdminAiUsageSummary = z.infer<typeof adminAiUsageSummarySchema>;

export const adminAiUsageResponseSchema = z.object({
  usage: z.array(adminAiUsageSchema),
  summary: adminAiUsageSummarySchema,
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type AdminAiUsageResponse = z.infer<typeof adminAiUsageResponseSchema>;
