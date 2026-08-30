import { z } from "zod";

export const insightsRangeSchema = z.enum(["7d", "30d", "3m", "1y"]);
export type InsightsRange = z.infer<typeof insightsRangeSchema>;

export const insightsMetricSchema = z.enum(["calories", "protein", "carbs", "fat"]);
export type InsightsMetric = z.infer<typeof insightsMetricSchema>;

export const insightGranularitySchema = z.enum(["day", "week", "month"]);
export type InsightGranularity = z.infer<typeof insightGranularitySchema>;

export const insightPeriodSchema = z.object({
  range: insightsRangeSchema,
  start: z.string(),
  end: z.string(),
  days: z.number().int().positive(),
  granularity: insightGranularitySchema,
});
export type InsightPeriod = z.infer<typeof insightPeriodSchema>;

const nullableValue = z.number().finite().nonnegative().nullable();

export const insightComparisonSchema = z.object({
  current: nullableValue,
  previous: nullableValue,
  delta: z.number().finite().nullable(),
  deltaPercent: z.number().finite().nullable(),
});
export type InsightComparison = z.infer<typeof insightComparisonSchema>;

export const insightMetricSummarySchema = insightComparisonSchema.extend({
  currentTotal: nullableValue,
  previousTotal: nullableValue,
});
export type InsightMetricSummary = z.infer<typeof insightMetricSummarySchema>;

export const personalInsightBucketSchema = z.object({
  key: z.string(),
  start: z.string(),
  calories: nullableValue,
  proteinGrams: nullableValue,
  carbohydratesGrams: nullableValue,
  fatGrams: nullableValue,
  meals: z.number().int().nonnegative(),
  loggedDays: z.number().int().nonnegative(),
  logged: z.boolean(),
});
export type PersonalInsightBucket = z.infer<typeof personalInsightBucketSchema>;

export const insightMealTypeSchema = z.object({
  category: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  meals: z.number().int().nonnegative(),
  calories: z.number().finite().nonnegative(),
  share: z.number().finite().nonnegative().max(1),
  calorieShare: z.number().finite().nonnegative().max(1),
});
export type InsightMealType = z.infer<typeof insightMealTypeSchema>;

export const insightFoodSchema = z.object({
  foodId: z.string(),
  name: z.string(),
  entries: z.number().int().nonnegative(),
  calories: nullableValue,
  proteinGrams: nullableValue,
  carbohydratesGrams: nullableValue,
  fatGrams: nullableValue,
  share: z.number().finite().nonnegative().max(1).nullable(),
});
export type InsightFood = z.infer<typeof insightFoodSchema>;

export const personalHighlightSchema = z.object({
  kind: z.enum(["most_logged_food", "most_logged_category", "calorie_consistency"]),
  value: z.string(),
  amount: z.number().finite().nonnegative().nullable(),
});
export type PersonalHighlight = z.infer<typeof personalHighlightSchema>;

export const personalInsightsSummarySchema = z.object({
  calories: insightMetricSummarySchema,
  proteinGrams: insightMetricSummarySchema,
  carbohydratesGrams: insightMetricSummarySchema,
  fatGrams: insightMetricSummarySchema,
  meals: insightComparisonSchema,
  loggedDays: insightComparisonSchema,
  periodDays: z.number().int().positive(),
  incompleteMeals: z.number().int().nonnegative(),
});
export type PersonalInsightsSummary = z.infer<typeof personalInsightsSummarySchema>;

export const personalInsightsResponseSchema = z.object({
  period: insightPeriodSchema,
  targetCalories: z.number().finite().positive().nullable(),
  summary: personalInsightsSummarySchema,
  buckets: z.array(personalInsightBucketSchema),
  mealTypes: z.array(insightMealTypeSchema),
  topFoods: z.array(insightFoodSchema),
  highlights: z.array(personalHighlightSchema),
});
export type PersonalInsightsResponse = z.infer<typeof personalInsightsResponseSchema>;

export const personalNutritionDetailSchema = z.object({
  metric: insightsMetricSchema,
  period: insightPeriodSchema,
  average: nullableValue,
  total: nullableValue,
  previousAverage: nullableValue,
  delta: z.number().finite().nullable(),
  deltaPercent: z.number().finite().nullable(),
  buckets: z.array(
    z.object({
      key: z.string(),
      start: z.string(),
      value: nullableValue,
      loggedDays: z.number().int().nonnegative(),
      logged: z.boolean(),
    }),
  ),
  topFoods: z.array(insightFoodSchema),
});
export type PersonalNutritionDetail = z.infer<typeof personalNutritionDetailSchema>;

export const personalInsightsQuerySchema = z.object({
  range: insightsRangeSchema.default("7d"),
  /** Client-provided local calendar date; mealDate is already local-date data. */
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type PersonalInsightsQuery = z.infer<typeof personalInsightsQuerySchema>;

export const personalNutritionQuerySchema = personalInsightsQuerySchema.extend({
  metric: insightsMetricSchema.default("protein"),
});
export type PersonalNutritionQuery = z.infer<typeof personalNutritionQuerySchema>;

export const adminAnalyticsRangeSchema = z.enum(["7d", "30d", "90d", "custom"]);
export type AdminAnalyticsRange = z.infer<typeof adminAnalyticsRangeSchema>;

export const adminAnalyticsQuerySchema = z
  .object({
    range: adminAnalyticsRangeSchema.default("30d"),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.range === "custom" && (!value.from || !value.to)) {
      context.addIssue({ code: "custom", message: "Custom analytics ranges need from and to" });
    }
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({ code: "custom", message: "Analytics from must not be after to" });
    }
  });
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;

export const adminAnalyticsPeriodSchema = z.object({
  range: adminAnalyticsRangeSchema,
  start: z.string(),
  end: z.string(),
  days: z.number().int().positive(),
  granularity: insightGranularitySchema,
  timezone: z.literal("UTC"),
});
export type AdminAnalyticsPeriod = z.infer<typeof adminAnalyticsPeriodSchema>;

export const adminAnalyticsMetricSchema = z.object({
  current: z.number().finite().nonnegative(),
  previous: z.number().finite().nonnegative(),
  delta: z.number().finite(),
  deltaPercent: z.number().finite().nullable(),
});
export type AdminAnalyticsMetric = z.infer<typeof adminAnalyticsMetricSchema>;

export const adminOverviewBucketSchema = z.object({
  key: z.string(),
  start: z.string(),
  newUsers: z.number().int().nonnegative(),
  meals: z.number().int().nonnegative(),
  foodEntries: z.number().int().nonnegative(),
  aiRequests: z.number().int().nonnegative(),
});
export type AdminOverviewBucket = z.infer<typeof adminOverviewBucketSchema>;

export const adminOverviewResponseSchema = z.object({
  period: adminAnalyticsPeriodSchema,
  totalUsers: z.number().int().nonnegative(),
  kpis: z.object({
    newUsers: adminAnalyticsMetricSchema,
    activeUsers: adminAnalyticsMetricSchema,
    meals: adminAnalyticsMetricSchema,
    foodEntries: adminAnalyticsMetricSchema,
    foodSubmissions: adminAnalyticsMetricSchema,
    aiRequests: adminAnalyticsMetricSchema,
  }),
  activity: z.array(adminOverviewBucketSchema),
});
export type AdminOverviewResponse = z.infer<typeof adminOverviewResponseSchema>;

export const adminNutritionBucketSchema = z.object({
  key: z.string(),
  start: z.string(),
  calories: z.number().finite().nonnegative(),
  proteinGrams: z.number().finite().nonnegative(),
  carbohydratesGrams: z.number().finite().nonnegative(),
  fatGrams: z.number().finite().nonnegative(),
  meals: z.number().int().nonnegative(),
});
export type AdminNutritionBucket = z.infer<typeof adminNutritionBucketSchema>;

export const adminNutritionResponseSchema = z.object({
  period: adminAnalyticsPeriodSchema,
  totals: z.object({
    meals: adminAnalyticsMetricSchema,
    calories: adminAnalyticsMetricSchema,
    proteinGrams: adminAnalyticsMetricSchema,
    carbohydratesGrams: adminAnalyticsMetricSchema,
    fatGrams: adminAnalyticsMetricSchema,
    incompleteMeals: z.number().int().nonnegative(),
  }),
  activity: z.array(adminNutritionBucketSchema),
  mealTypes: z.array(insightMealTypeSchema),
  topFoods: z.array(insightFoodSchema),
});
export type AdminNutritionResponse = z.infer<typeof adminNutritionResponseSchema>;

export const adminCatalogGrowthBucketSchema = z.object({
  key: z.string(),
  start: z.string(),
  foodsCreated: z.number().int().nonnegative(),
  submissions: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  merged: z.number().int().nonnegative(),
});
export type AdminCatalogGrowthBucket = z.infer<typeof adminCatalogGrowthBucketSchema>;

export const adminCatalogResponseSchema = z.object({
  period: adminAnalyticsPeriodSchema,
  catalog: z.object({
    total: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    merged: z.number().int().nonnegative(),
  }),
  moderation: z.object({
    submissions: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    merged: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    approvalRate: z.number().finite().nonnegative().max(1).nullable(),
    averageReviewHours: z.number().finite().nonnegative().nullable(),
  }),
  growth: z.array(adminCatalogGrowthBucketSchema),
  popularFoods: z.array(insightFoodSchema),
});
export type AdminCatalogResponse = z.infer<typeof adminCatalogResponseSchema>;

export const adminAiAnalyticsBucketSchema = z.object({
  key: z.string(),
  start: z.string(),
  requests: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  averageLatencyMs: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
});
export type AdminAiAnalyticsBucket = z.infer<typeof adminAiAnalyticsBucketSchema>;

export const adminAiAnalyticsResponseSchema = z.object({
  period: adminAnalyticsPeriodSchema,
  summary: z.object({
    requests: adminAnalyticsMetricSchema,
    succeeded: adminAnalyticsMetricSchema,
    failed: adminAnalyticsMetricSchema,
    averageLatencyMs: z.number().int().nonnegative().nullable(),
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
    totalTokens: z.number().int().nonnegative().nullable(),
  }),
  activity: z.array(adminAiAnalyticsBucketSchema),
  byProvider: z.array(z.object({ key: z.string(), requests: z.number().int().nonnegative() })),
  byModel: z.array(z.object({ key: z.string(), requests: z.number().int().nonnegative() })),
  byFeature: z.array(z.object({ key: z.string(), requests: z.number().int().nonnegative() })),
});
export type AdminAiAnalyticsResponse = z.infer<typeof adminAiAnalyticsResponseSchema>;
