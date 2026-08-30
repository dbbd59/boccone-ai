import {
  adminAiAnalyticsResponseSchema,
  adminCatalogResponseSchema,
  adminNutritionResponseSchema,
  adminOverviewResponseSchema,
  personalInsightsResponseSchema,
  personalNutritionDetailSchema,
  type AdminAiAnalyticsResponse,
  type AdminAnalyticsQuery,
  type AdminCatalogResponse,
  type AdminNutritionResponse,
  type AdminOverviewResponse,
  type InsightGranularity,
  type InsightsMetric,
  type InsightsRange,
  type PersonalInsightsQuery,
  type PersonalInsightsResponse,
  type PersonalNutritionDetail,
} from "@boccone/contracts";
import {
  aiUsage,
  and,
  asc,
  count,
  desc,
  dailyTargets,
  eq,
  foodSubmissions,
  foods,
  gte,
  mealFoodEntries,
  meals,
  sql,
  sum,
  type Database,
  user,
} from "@boccone/db";

interface NutritionTotals {
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  meals: number;
  incompleteMeals: number;
}

type MealDayRow = NutritionTotals & { date: string };

interface DateWindow {
  start: string;
  endExclusive: string;
  previousStart: string;
  previousEndExclusive: string;
  range: InsightsRange;
  days: number;
  granularity: InsightGranularity;
}

type AdminDateWindow = Omit<DateWindow, "range"> & {
  range: AdminAnalyticsQuery["range"];
};

const METRIC_COLUMNS = {
  calories: mealFoodEntries.energyKcalSnapshot,
  protein: mealFoodEntries.proteinGSnapshot,
  carbs: mealFoodEntries.carbohydratesGSnapshot,
  fat: mealFoodEntries.fatGSnapshot,
} as const;

export function resolvePersonalWindow(
  range: InsightsRange,
  today = formatDate(new Date()),
): DateWindow {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "3m" ? 90 : 365;
  const endExclusive = addDays(today, 1);
  const start = addDays(endExclusive, -days);
  const previousEndExclusive = start;
  const previousStart = addDays(previousEndExclusive, -days);
  return {
    start,
    endExclusive,
    previousStart,
    previousEndExclusive,
    range,
    days,
    granularity: granularityForDays(days),
  };
}

export function resolveAdminWindow(
  query: AdminAnalyticsQuery,
  today = formatDate(new Date()),
): AdminDateWindow {
  const endExclusive = query.range === "custom" ? addDays(query.to!, 1) : addDays(today, 1);
  const start =
    query.range === "custom"
      ? query.from!
      : addDays(endExclusive, query.range === "7d" ? -7 : query.range === "90d" ? -90 : -30);
  const days = daysBetween(start, endExclusive);
  const previousEndExclusive = start;
  const previousStart = addDays(previousEndExclusive, -days);
  return {
    start,
    endExclusive,
    previousStart,
    previousEndExclusive,
    range: query.range,
    days,
    granularity: granularityForDays(days),
  };
}

export function calculateDeltaPercent(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function getPersonalInsights(
  db: Database,
  userId: string,
  query: PersonalInsightsQuery,
): Promise<PersonalInsightsResponse> {
  const window = resolvePersonalWindow(query.range, query.today);
  const [currentRows, target, mealTypes, topFoods] = await Promise.all([
    listMealDays(db, userId, window.previousStart, window.endExclusive),
    getCalorieTarget(db, userId),
    listMealTypes(db, userId, window.start, window.endExclusive),
    listTopFoods(db, userId, window.start, window.endExclusive, "calories"),
  ]);
  const current = currentRows.filter((row) => row.date >= window.start);
  const previous = currentRows.filter(
    (row) => row.date >= window.previousStart && row.date < window.previousEndExclusive,
  );
  const summary = buildPersonalSummary(current, previous, window.days);
  const buckets = buildPersonalBuckets(current, window);
  const highlights = buildHighlights(current, topFoods, mealTypes);

  return personalInsightsResponseSchema.parse({
    period: toPersonalPeriod(window),
    targetCalories: target,
    summary,
    buckets,
    mealTypes,
    topFoods,
    highlights,
  });
}

export async function getPersonalNutritionDetail(
  db: Database,
  userId: string,
  query: PersonalInsightsQuery & { metric: InsightsMetric },
): Promise<PersonalNutritionDetail> {
  const window = resolvePersonalWindow(query.range, query.today);
  const [rows, topFoods] = await Promise.all([
    listMealDays(db, userId, window.previousStart, window.endExclusive),
    listTopFoods(db, userId, window.start, window.endExclusive, query.metric),
  ]);
  const current = rows.filter((row) => row.date >= window.start);
  const previous = rows.filter(
    (row) => row.date >= window.previousStart && row.date < window.previousEndExclusive,
  );
  const currentTotals = sumMealDays(current);
  const previousTotals = sumMealDays(previous);
  const currentAverage = averageForLoggedDays(currentTotals, current.length, query.metric);
  const previousAverage = averageForLoggedDays(previousTotals, previous.length, query.metric);
  const currentTotal = metricValue(currentTotals, query.metric);

  return personalNutritionDetailSchema.parse({
    metric: query.metric,
    period: toPersonalPeriod(window),
    average: currentAverage,
    total: currentTotal,
    previousAverage,
    delta:
      currentAverage === null || previousAverage === null ? null : currentAverage - previousAverage,
    deltaPercent: calculateDeltaPercent(currentAverage, previousAverage),
    buckets: buildMetricBuckets(current, window, query.metric),
    topFoods,
  });
}

export async function getAdminOverview(
  db: Database,
  query: AdminAnalyticsQuery,
): Promise<AdminOverviewResponse> {
  const window = resolveAdminWindow(query);
  const [current, previous, totalUsers, activity] = await Promise.all([
    getAdminUsageCounts(db, window.start, window.endExclusive),
    getAdminUsageCounts(db, window.previousStart, window.previousEndExclusive),
    countRows(db, user),
    buildAdminOverviewActivity(db, window),
  ]);
  return adminOverviewResponseSchema.parse({
    period: toAdminPeriod(window),
    totalUsers,
    kpis: {
      newUsers: adminMetric(current.newUsers, previous.newUsers),
      activeUsers: adminMetric(current.activeUsers, previous.activeUsers),
      meals: adminMetric(current.meals, previous.meals),
      foodEntries: adminMetric(current.foodEntries, previous.foodEntries),
      foodSubmissions: adminMetric(current.foodSubmissions, previous.foodSubmissions),
      aiRequests: adminMetric(current.aiRequests, previous.aiRequests),
    },
    activity,
  });
}

export async function getAdminNutrition(
  db: Database,
  query: AdminAnalyticsQuery,
): Promise<AdminNutritionResponse> {
  const window = resolveAdminWindow(query);
  const [currentRows, previousRows, mealTypes, topFoods] = await Promise.all([
    listMealDays(db, undefined, window.start, window.endExclusive),
    listMealDays(db, undefined, window.previousStart, window.previousEndExclusive),
    listMealTypes(db, undefined, window.start, window.endExclusive),
    listTopFoods(db, undefined, window.start, window.endExclusive, "calories"),
  ]);
  const current = sumMealDays(currentRows);
  const previous = sumMealDays(previousRows);
  return adminNutritionResponseSchema.parse({
    period: toAdminPeriod(window),
    totals: {
      meals: adminMetric(current.meals, previous.meals),
      calories: adminMetric(current.calories, previous.calories),
      proteinGrams: adminMetric(current.proteinGrams, previous.proteinGrams),
      carbohydratesGrams: adminMetric(current.carbohydratesGrams, previous.carbohydratesGrams),
      fatGrams: adminMetric(current.fatGrams, previous.fatGrams),
      incompleteMeals: current.incompleteMeals,
    },
    activity: buildAdminNutritionBuckets(currentRows, window),
    mealTypes,
    topFoods,
  });
}

export async function getAdminCatalog(
  db: Database,
  query: AdminAnalyticsQuery,
): Promise<AdminCatalogResponse> {
  const window = resolveAdminWindow(query);
  const [catalogCounts, moderation, growth, popularFoods] = await Promise.all([
    getCatalogCounts(db),
    getModerationSummary(db, window),
    getCatalogGrowth(db, window),
    listTopFoods(db, undefined, window.start, window.endExclusive, "calories"),
  ]);
  return adminCatalogResponseSchema.parse({
    period: toAdminPeriod(window),
    catalog: catalogCounts,
    moderation,
    growth,
    popularFoods,
  });
}

export async function getAdminAiAnalytics(
  db: Database,
  query: AdminAnalyticsQuery,
): Promise<AdminAiAnalyticsResponse> {
  const window = resolveAdminWindow(query);
  const [current, previous, activity, byProvider, byModel, byFeature] = await Promise.all([
    getAiAggregate(db, window.start, window.endExclusive),
    getAiAggregate(db, window.previousStart, window.previousEndExclusive),
    getAiActivity(db, window),
    getAiBreakdown(db, window.start, window.endExclusive, aiUsage.provider),
    getAiBreakdown(db, window.start, window.endExclusive, aiUsage.model),
    getAiBreakdown(db, window.start, window.endExclusive, aiUsage.feature),
  ]);
  return adminAiAnalyticsResponseSchema.parse({
    period: toAdminPeriod(window),
    summary: {
      requests: adminMetric(current.requests, previous.requests),
      succeeded: adminMetric(current.succeeded, previous.succeeded),
      failed: adminMetric(current.failed, previous.failed),
      averageLatencyMs: current.averageLatencyMs,
      inputTokens: current.inputTokens,
      outputTokens: current.outputTokens,
      totalTokens: current.totalTokens,
    },
    activity,
    byProvider,
    byModel,
    byFeature,
  });
}

async function listMealDays(
  db: Database,
  userId: string | undefined,
  start: string,
  endExclusive: string,
): Promise<MealDayRow[]> {
  const conditions = [gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`];
  if (userId) conditions.push(eq(meals.userId, userId));
  const rows = await db
    .select({
      date: meals.mealDate,
      calories: sum(meals.calories),
      proteinGrams: sum(meals.proteinGrams),
      carbohydratesGrams: sum(meals.carbohydratesGrams),
      fatGrams: sum(meals.fatGrams),
      meals: count(),
      incompleteMeals: sql<number>`count(*) filter (where ${meals.nutritionIncomplete} = true)`,
    })
    .from(meals)
    .where(and(...conditions))
    .groupBy(meals.mealDate)
    .orderBy(asc(meals.mealDate));
  return rows.map((row) => ({
    date: row.date,
    calories: numberValue(row.calories),
    proteinGrams: numberValue(row.proteinGrams),
    carbohydratesGrams: numberValue(row.carbohydratesGrams),
    fatGrams: numberValue(row.fatGrams),
    meals: Number(row.meals),
    incompleteMeals: Number(row.incompleteMeals),
  }));
}

async function getCalorieTarget(db: Database, userId: string): Promise<number | null> {
  const [row] = await db
    .select({ calories: dailyTargets.calories })
    .from(dailyTargets)
    .where(eq(dailyTargets.userId, userId));
  return row?.calories === null || row?.calories === undefined ? null : Number(row.calories);
}

async function listMealTypes(
  db: Database,
  userId: string | undefined,
  start: string,
  endExclusive: string,
) {
  const conditions = [gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`];
  if (userId) conditions.push(eq(meals.userId, userId));
  const rows = await db
    .select({ category: meals.category, meals: count(), calories: sum(meals.calories) })
    .from(meals)
    .where(and(...conditions))
    .groupBy(meals.category)
    .orderBy(desc(count()), asc(meals.category));
  const total = rows.reduce((value, row) => value + Number(row.meals), 0);
  const totalCalories = rows.reduce((value, row) => value + numberValue(row.calories), 0);
  return rows.map((row) => ({
    category: row.category as "breakfast" | "lunch" | "dinner" | "snack",
    meals: Number(row.meals),
    calories: numberValue(row.calories),
    share: total === 0 ? 0 : Number(row.meals) / total,
    calorieShare: totalCalories === 0 ? 0 : numberValue(row.calories) / totalCalories,
  }));
}

async function listTopFoods(
  db: Database,
  userId: string | undefined,
  start: string,
  endExclusive: string,
  metric: InsightsMetric,
  limit = 8,
) {
  const metricColumn = METRIC_COLUMNS[metric];
  const conditions = [gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`];
  if (userId) conditions.push(eq(meals.userId, userId));
  const [rows, totalRow] = await Promise.all([
    db
      .select({
        foodId: mealFoodEntries.foodId,
        name: mealFoodEntries.foodNameSnapshot,
        entries: count(),
        calories: sum(mealFoodEntries.energyKcalSnapshot),
        proteinGrams: sum(mealFoodEntries.proteinGSnapshot),
        carbohydratesGrams: sum(mealFoodEntries.carbohydratesGSnapshot),
        fatGrams: sum(mealFoodEntries.fatGSnapshot),
      })
      .from(mealFoodEntries)
      .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
      .where(and(...conditions))
      .groupBy(mealFoodEntries.foodId, mealFoodEntries.foodNameSnapshot)
      .orderBy(
        desc(metricColumn ? sum(metricColumn) : count()),
        asc(mealFoodEntries.foodNameSnapshot),
      )
      .limit(limit),
    db
      .select({ total: sum(metricColumn) })
      .from(mealFoodEntries)
      .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
      .where(and(...conditions)),
  ]);
  const total = nullableNumber(totalRow[0]?.total);
  return rows.map((row) => ({
    foodId: row.foodId,
    name: row.name,
    entries: Number(row.entries),
    calories: nullableNumber(row.calories),
    proteinGrams: nullableNumber(row.proteinGrams),
    carbohydratesGrams: nullableNumber(row.carbohydratesGrams),
    fatGrams: nullableNumber(row.fatGrams),
    share:
      total === null || total === 0 || metricValueFromFood(row, metric) === null
        ? null
        : metricValueFromFood(row, metric)! / total,
  }));
}

function metricValueFromFood(
  row: {
    calories: number | string | null;
    proteinGrams: number | string | null;
    carbohydratesGrams: number | string | null;
    fatGrams: number | string | null;
  },
  metric: InsightsMetric,
): number | null {
  return metric === "calories"
    ? nullableNumber(row.calories)
    : metric === "protein"
      ? nullableNumber(row.proteinGrams)
      : metric === "carbs"
        ? nullableNumber(row.carbohydratesGrams)
        : nullableNumber(row.fatGrams);
}

function buildPersonalSummary(current: MealDayRow[], previous: MealDayRow[], periodDays: number) {
  const currentTotals = sumMealDays(current);
  const previousTotals = sumMealDays(previous);
  return {
    calories: personalMetricSummary(
      currentTotals,
      previousTotals,
      "calories",
      current.length,
      previous.length,
    ),
    proteinGrams: personalMetricSummary(
      currentTotals,
      previousTotals,
      "proteinGrams",
      current.length,
      previous.length,
    ),
    carbohydratesGrams: personalMetricSummary(
      currentTotals,
      previousTotals,
      "carbohydratesGrams",
      current.length,
      previous.length,
    ),
    fatGrams: personalMetricSummary(
      currentTotals,
      previousTotals,
      "fatGrams",
      current.length,
      previous.length,
    ),
    meals: personalComparison(currentTotals.meals, previousTotals.meals),
    loggedDays: personalComparison(current.length, previous.length),
    periodDays,
    incompleteMeals: currentTotals.incompleteMeals,
  };
}

function personalMetricSummary(
  current: NutritionTotals,
  previous: NutritionTotals,
  key: keyof Pick<NutritionTotals, "calories" | "proteinGrams" | "carbohydratesGrams" | "fatGrams">,
  currentDays: number,
  previousDays: number,
) {
  const currentAverage = currentDays === 0 ? null : current[key] / currentDays;
  const previousAverage = previousDays === 0 ? null : previous[key] / previousDays;
  return {
    ...personalComparison(currentAverage, previousAverage),
    currentTotal: currentDays === 0 ? null : current[key],
    previousTotal: previousDays === 0 ? null : previous[key],
  };
}

function personalComparison(current: number | null, previous: number | null) {
  return {
    current,
    previous,
    delta: current === null || previous === null ? null : current - previous,
    deltaPercent: calculateDeltaPercent(current, previous),
  };
}

function buildPersonalBuckets(rows: MealDayRow[], window: DateWindow) {
  const grouped = groupMealRows(rows, window.granularity);
  const loggedDaysByBucket = countLoggedDaysByBucket(rows, window.granularity);
  return enumerateBuckets(window.start, window.endExclusive, window.granularity).map((start) => {
    const value = grouped.get(start);
    const loggedDays = loggedDaysByBucket.get(start) ?? 0;
    const average = (
      metric: keyof Pick<
        NutritionTotals,
        "calories" | "proteinGrams" | "carbohydratesGrams" | "fatGrams"
      >,
    ) => (value && window.granularity !== "day" ? value[metric] / loggedDays : value?.[metric]);
    return {
      key: start,
      start,
      calories: average("calories") ?? null,
      proteinGrams: average("proteinGrams") ?? null,
      carbohydratesGrams: average("carbohydratesGrams") ?? null,
      fatGrams: average("fatGrams") ?? null,
      meals: value?.meals ?? 0,
      loggedDays,
      logged: loggedDays > 0,
    };
  });
}

function buildMetricBuckets(rows: MealDayRow[], window: DateWindow, metric: InsightsMetric) {
  const grouped = groupMealRows(rows, window.granularity);
  const loggedDaysByBucket = countLoggedDaysByBucket(rows, window.granularity);
  return enumerateBuckets(window.start, window.endExclusive, window.granularity).map((start) => {
    const value = grouped.get(start);
    const loggedDays = loggedDaysByBucket.get(start) ?? 0;
    return {
      key: start,
      start,
      value:
        value && loggedDays > 0 && window.granularity !== "day"
          ? metricValue(value, metric) / loggedDays
          : value
            ? metricValue(value, metric)
            : null,
      loggedDays,
      logged: loggedDays > 0,
    };
  });
}

function countLoggedDaysByBucket(rows: MealDayRow[], granularity: InsightGranularity) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = bucketStart(row.date, granularity);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function buildHighlights(
  rows: MealDayRow[],
  topFoods: Awaited<ReturnType<typeof listTopFoods>>,
  mealTypes: Awaited<ReturnType<typeof listMealTypes>>,
) {
  const highlights: {
    kind: "most_logged_food" | "most_logged_category" | "calorie_consistency";
    value: string;
    amount: number | null;
  }[] = [];
  const topFood = topFoods[0];
  if (topFood)
    highlights.push({ kind: "most_logged_food", value: topFood.name, amount: topFood.entries });
  const topCategory = [...mealTypes].sort((left, right) => right.meals - left.meals)[0];
  if (topCategory)
    highlights.push({
      kind: "most_logged_category",
      value: topCategory.category,
      amount: topCategory.meals,
    });
  if (rows.length >= 3) {
    const calories = rows.map((row) => row.calories);
    highlights.push({
      kind: "calorie_consistency",
      value: "calories",
      amount: Math.max(...calories) - Math.min(...calories),
    });
  }
  return highlights;
}

function sumMealDays(rows: MealDayRow[]): NutritionTotals {
  return rows.reduce(
    (totals, row) => ({
      calories: totals.calories + row.calories,
      proteinGrams: totals.proteinGrams + row.proteinGrams,
      carbohydratesGrams: totals.carbohydratesGrams + row.carbohydratesGrams,
      fatGrams: totals.fatGrams + row.fatGrams,
      meals: totals.meals + row.meals,
      incompleteMeals: totals.incompleteMeals + row.incompleteMeals,
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbohydratesGrams: 0,
      fatGrams: 0,
      meals: 0,
      incompleteMeals: 0,
    },
  );
}

function averageForLoggedDays(totals: NutritionTotals, loggedDays: number, metric: InsightsMetric) {
  return loggedDays === 0 ? null : metricValue(totals, metric) / loggedDays;
}

function metricValue(totals: NutritionTotals, metric: InsightsMetric): number {
  return metric === "calories"
    ? totals.calories
    : metric === "protein"
      ? totals.proteinGrams
      : metric === "carbs"
        ? totals.carbohydratesGrams
        : totals.fatGrams;
}

function groupMealRows(rows: MealDayRow[], granularity: InsightGranularity) {
  const grouped = new Map<string, NutritionTotals>();
  for (const row of rows) {
    const key = bucketStart(row.date, granularity);
    const current = grouped.get(key) ?? {
      calories: 0,
      proteinGrams: 0,
      carbohydratesGrams: 0,
      fatGrams: 0,
      meals: 0,
      incompleteMeals: 0,
    };
    grouped.set(key, {
      calories: current.calories + row.calories,
      proteinGrams: current.proteinGrams + row.proteinGrams,
      carbohydratesGrams: current.carbohydratesGrams + row.carbohydratesGrams,
      fatGrams: current.fatGrams + row.fatGrams,
      meals: current.meals + row.meals,
      incompleteMeals: current.incompleteMeals + row.incompleteMeals,
    });
  }
  return grouped;
}

async function getAdminUsageCounts(db: Database, start: string, endExclusive: string) {
  const [newUsers, activeUsers, mealCount, foodEntryCount, submissionCount, aiRequestCount] =
    await Promise.all([
      countByDate(db, user, user.createdAt, start, endExclusive),
      db
        .select({ value: sql<number>`count(distinct ${meals.userId})` })
        .from(meals)
        .where(and(gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`)),
      db
        .select({ value: count() })
        .from(meals)
        .where(and(gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`)),
      db
        .select({ value: count() })
        .from(mealFoodEntries)
        .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
        .where(and(gte(meals.mealDate, start), sql`${meals.mealDate} < ${endExclusive}`)),
      db
        .select({ value: count() })
        .from(foodSubmissions)
        .where(timestampRange(foodSubmissions.createdAt, start, endExclusive)),
      db
        .select({ value: count() })
        .from(aiUsage)
        .where(timestampRange(aiUsage.createdAt, start, endExclusive)),
    ]);
  return {
    newUsers: Number(newUsers),
    activeUsers: Number(activeUsers[0]?.value ?? 0),
    meals: Number(mealCount[0]?.value ?? 0),
    foodEntries: Number(foodEntryCount[0]?.value ?? 0),
    foodSubmissions: Number(submissionCount[0]?.value ?? 0),
    aiRequests: Number(aiRequestCount[0]?.value ?? 0),
  };
}

async function buildAdminOverviewActivity(db: Database, window: AdminDateWindow) {
  const [users, mealRows, entryRows, aiRows] = await Promise.all([
    listDateCounts(db, user, user.createdAt, window.start, window.endExclusive),
    listDateCounts(db, meals, meals.mealDate, window.start, window.endExclusive),
    db
      .select({ date: meals.mealDate, value: count() })
      .from(mealFoodEntries)
      .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
      .where(
        and(gte(meals.mealDate, window.start), sql`${meals.mealDate} < ${window.endExclusive}`),
      )
      .groupBy(meals.mealDate),
    listDateCounts(db, aiUsage, aiUsage.createdAt, window.start, window.endExclusive),
  ]);
  const byBucket = new Map<
    string,
    { newUsers: number; meals: number; foodEntries: number; aiRequests: number }
  >();
  for (const key of enumerateBuckets(window.start, window.endExclusive, window.granularity))
    byBucket.set(key, { newUsers: 0, meals: 0, foodEntries: 0, aiRequests: 0 });
  addDateCounts(byBucket, users, window.granularity, "newUsers");
  addDateCounts(byBucket, mealRows, window.granularity, "meals");
  addDateCounts(
    byBucket,
    entryRows.map((row) => ({ date: row.date, value: Number(row.value) })),
    window.granularity,
    "foodEntries",
  );
  addDateCounts(byBucket, aiRows, window.granularity, "aiRequests");
  return [...byBucket].map(([key, value]) => ({ key, start: key, ...value }));
}

function buildAdminNutritionBuckets(rows: MealDayRow[], window: AdminDateWindow) {
  const grouped = groupMealRows(rows, window.granularity);
  return enumerateBuckets(window.start, window.endExclusive, window.granularity).map((key) => {
    const value = grouped.get(key);
    return {
      key,
      start: key,
      calories: value?.calories ?? 0,
      proteinGrams: value?.proteinGrams ?? 0,
      carbohydratesGrams: value?.carbohydratesGrams ?? 0,
      fatGrams: value?.fatGrams ?? 0,
      meals: value?.meals ?? 0,
    };
  });
}

async function countByDate(
  db: Database,
  table: typeof user,
  column: typeof user.createdAt,
  start: string,
  endExclusive: string,
) {
  const rows = await db
    .select({ value: count() })
    .from(table)
    .where(timestampRange(column, start, endExclusive));
  return rows[0]?.value ?? 0;
}

async function listDateCounts(
  db: Database,
  table: typeof user | typeof meals | typeof aiUsage | typeof foods,
  column:
    | typeof user.createdAt
    | typeof meals.mealDate
    | typeof aiUsage.createdAt
    | typeof foods.createdAt,
  start: string,
  endExclusive: string,
) {
  const isDate = table === meals;
  const dateExpression = isDate ? column : sql<string>`to_char(${column}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({ date: dateExpression, value: count() })
    .from(table)
    .where(
      isDate
        ? sql`${column} >= ${start}::date and ${column} < ${endExclusive}::date`
        : timestampRange(column, start, endExclusive),
    )
    .groupBy(dateExpression)
    .orderBy(asc(dateExpression));
  return rows.map((row) => ({ date: String(row.date), value: Number(row.value) }));
}

async function getCatalogCounts(db: Database) {
  const rows = await db
    .select({ status: foods.status, value: count() })
    .from(foods)
    .groupBy(foods.status);
  const counts = new Map(rows.map((row) => [row.status, Number(row.value)]));
  return {
    total: [...counts.values()].reduce((total, value) => total + value, 0),
    approved: counts.get("APPROVED") ?? 0,
    pending: (counts.get("PENDING_REVIEW") ?? 0) + (counts.get("DRAFT") ?? 0),
    rejected: counts.get("REJECTED") ?? 0,
    merged: counts.get("MERGED") ?? 0,
  };
}

async function getModerationSummary(db: Database, window: AdminDateWindow) {
  const [rows, reviewRow] = await Promise.all([
    db
      .select({ status: foodSubmissions.status, value: count() })
      .from(foodSubmissions)
      .where(timestampRange(foodSubmissions.createdAt, window.start, window.endExclusive))
      .groupBy(foodSubmissions.status),
    db
      .select({
        hours: sql<number>`avg(extract(epoch from (${foodSubmissions.reviewedAt} - ${foodSubmissions.createdAt})) / 3600)`,
      })
      .from(foodSubmissions)
      .where(
        and(
          timestampRange(foodSubmissions.createdAt, window.start, window.endExclusive),
          sql`${foodSubmissions.reviewedAt} is not null`,
        ),
      ),
  ]);
  const counts = new Map(rows.map((row) => [row.status, Number(row.value)]));
  const approved = counts.get("APPROVED") ?? 0;
  const rejected = counts.get("REJECTED") ?? 0;
  const merged = counts.get("MERGED") ?? 0;
  const reviewed = approved + rejected + merged;
  return {
    submissions: [...counts.values()].reduce((total, value) => total + value, 0),
    approved,
    rejected,
    merged,
    pending: counts.get("PENDING_REVIEW") ?? 0,
    approvalRate: reviewed === 0 ? null : approved / reviewed,
    averageReviewHours: nullableNumber(reviewRow[0]?.hours),
  };
}

async function getCatalogGrowth(db: Database, window: AdminDateWindow) {
  const [foodRows, submissionRows] = await Promise.all([
    listDateCounts(db, foods, foods.createdAt, window.start, window.endExclusive),
    db
      .select({
        date: sql<string>`to_char(${foodSubmissions.createdAt}, 'YYYY-MM-DD')`,
        status: foodSubmissions.status,
        value: count(),
      })
      .from(foodSubmissions)
      .where(timestampRange(foodSubmissions.createdAt, window.start, window.endExclusive))
      .groupBy(sql`to_char(${foodSubmissions.createdAt}, 'YYYY-MM-DD')`, foodSubmissions.status),
  ]);
  const byBucket = new Map<
    string,
    {
      foodsCreated: number;
      submissions: number;
      approved: number;
      rejected: number;
      merged: number;
    }
  >();
  for (const key of enumerateBuckets(window.start, window.endExclusive, window.granularity))
    byBucket.set(key, { foodsCreated: 0, submissions: 0, approved: 0, rejected: 0, merged: 0 });
  addDateCounts(byBucket, foodRows, window.granularity, "foodsCreated");
  for (const row of submissionRows) {
    const item = byBucket.get(bucketStart(String(row.date), window.granularity));
    if (!item) continue;
    item.submissions += Number(row.value);
    if (row.status === "APPROVED") item.approved += Number(row.value);
    if (row.status === "REJECTED") item.rejected += Number(row.value);
    if (row.status === "MERGED") item.merged += Number(row.value);
  }
  return [...byBucket].map(([key, value]) => ({ key, start: key, ...value }));
}

async function getAiAggregate(db: Database, start: string, endExclusive: string) {
  const [row] = await db
    .select({
      requests: count(),
      succeeded: sql<number>`count(*) filter (where ${aiUsage.status} = 'succeeded')`,
      failed: sql<number>`count(*) filter (where ${aiUsage.status} = 'failed')`,
      averageLatencyMs: sql<number>`avg(${aiUsage.latencyMs})`,
      inputTokens: sum(aiUsage.inputTokens),
      outputTokens: sum(aiUsage.outputTokens),
      totalTokens: sum(aiUsage.totalTokens),
    })
    .from(aiUsage)
    .where(timestampRange(aiUsage.createdAt, start, endExclusive));
  return {
    requests: Number(row?.requests ?? 0),
    succeeded: Number(row?.succeeded ?? 0),
    failed: Number(row?.failed ?? 0),
    averageLatencyMs:
      row?.averageLatencyMs === null || row?.averageLatencyMs === undefined
        ? null
        : Math.round(Number(row.averageLatencyMs)),
    inputTokens: nullableNumber(row?.inputTokens),
    outputTokens: nullableNumber(row?.outputTokens),
    totalTokens: nullableNumber(row?.totalTokens),
  };
}

async function getAiActivity(db: Database, window: AdminDateWindow) {
  const dateExpression = sql<string>`to_char(${aiUsage.createdAt}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      date: dateExpression,
      requests: count(),
      succeeded: sql<number>`count(*) filter (where ${aiUsage.status} = 'succeeded')`,
      failed: sql<number>`count(*) filter (where ${aiUsage.status} = 'failed')`,
      averageLatencyMs: sql<number>`avg(${aiUsage.latencyMs})`,
      totalTokens: sum(aiUsage.totalTokens),
    })
    .from(aiUsage)
    .where(timestampRange(aiUsage.createdAt, window.start, window.endExclusive))
    .groupBy(dateExpression)
    .orderBy(asc(dateExpression));
  const byBucket = new Map<
    string,
    {
      requests: number;
      succeeded: number;
      failed: number;
      latencySum: number;
      latencyCount: number;
      totalTokens: number | null;
    }
  >();
  for (const key of enumerateBuckets(window.start, window.endExclusive, window.granularity))
    byBucket.set(key, {
      requests: 0,
      succeeded: 0,
      failed: 0,
      latencySum: 0,
      latencyCount: 0,
      totalTokens: null,
    });
  for (const row of rows) {
    const item = byBucket.get(bucketStart(String(row.date), window.granularity));
    if (!item) continue;
    item.requests += Number(row.requests);
    item.succeeded += Number(row.succeeded);
    item.failed += Number(row.failed);
    if (row.averageLatencyMs !== null && row.averageLatencyMs !== undefined) {
      item.latencySum += Number(row.averageLatencyMs) * Number(row.requests);
      item.latencyCount += Number(row.requests);
    }
    const tokens = nullableNumber(row.totalTokens);
    if (tokens !== null) item.totalTokens = (item.totalTokens ?? 0) + tokens;
  }
  return [...byBucket].map(([key, item]) => ({
    key,
    start: key,
    requests: item.requests,
    succeeded: item.succeeded,
    failed: item.failed,
    averageLatencyMs:
      item.latencyCount === 0 ? null : Math.round(item.latencySum / item.latencyCount),
    totalTokens: item.totalTokens,
  }));
}

async function getAiBreakdown(
  db: Database,
  start: string,
  endExclusive: string,
  column: typeof aiUsage.provider | typeof aiUsage.model | typeof aiUsage.feature,
) {
  const rows = await db
    .select({ key: column, requests: count() })
    .from(aiUsage)
    .where(timestampRange(aiUsage.createdAt, start, endExclusive))
    .groupBy(column)
    .orderBy(desc(count()), asc(column));
  return rows.map((row) => ({ key: row.key, requests: Number(row.requests) }));
}

function adminMetric(current: number, previous: number) {
  return {
    current,
    previous,
    delta: current - previous,
    deltaPercent: calculateDeltaPercent(current, previous),
  };
}

function toPersonalPeriod(window: DateWindow) {
  return {
    range: window.range,
    start: window.start,
    end: addDays(window.endExclusive, -1),
    days: window.days,
    granularity: window.granularity,
  };
}

function toAdminPeriod(window: AdminDateWindow) {
  return {
    range: window.range,
    start: window.start,
    end: addDays(window.endExclusive, -1),
    days: window.days,
    granularity: window.granularity,
    timezone: "UTC" as const,
  };
}

function addDateCounts<T extends Record<string, number>>(
  target: Map<string, T>,
  rows: { date: string; value: number }[],
  granularity: InsightGranularity,
  field: keyof T,
) {
  for (const row of rows) {
    const bucket = target.get(bucketStart(row.date, granularity));
    if (bucket) Object.assign(bucket, { [field]: Number(bucket[field] ?? 0) + row.value });
  }
}

export function granularityForDays(days: number): InsightGranularity {
  return days <= 31 ? "day" : days <= 120 ? "week" : "month";
}

export function bucketStart(value: string, granularity: InsightGranularity): string {
  if (granularity === "day") return value;
  if (granularity === "month") return `${value.slice(0, 7)}-01`;
  const date = new Date(`${value}T12:00:00.000Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return formatDate(new Date(date.getTime() - mondayOffset * 86_400_000));
}

export function enumerateBuckets(
  start: string,
  endExclusive: string,
  granularity: InsightGranularity,
): string[] {
  const first = bucketStart(start, granularity);
  const values: string[] = [];
  let cursor = first;
  while (cursor < endExclusive) {
    values.push(cursor);
    cursor =
      granularity === "day"
        ? addDays(cursor, 1)
        : granularity === "week"
          ? addDays(cursor, 7)
          : addMonths(cursor, 1);
  }
  return values;
}

function countRows(db: Database, table: typeof user): Promise<number> {
  return db
    .select({ value: count() })
    .from(table)
    .then((rows) => Number(rows[0]?.value ?? 0));
}

function numberValue(value: number | string | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function nullableNumber(value: number | string | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function timestampRange(
  column:
    | typeof user.createdAt
    | typeof meals.mealDate
    | typeof aiUsage.createdAt
    | typeof foods.createdAt
    | typeof foodSubmissions.createdAt,
  start: string,
  endExclusive: string,
) {
  return sql`${column} >= ${start}::timestamp and ${column} < ${endExclusive}::timestamp`;
}

function daysBetween(start: string, endExclusive: string): number {
  return Math.round(
    (Date.parse(`${endExclusive}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
  );
}

function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

function addMonths(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return formatDate(date);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
