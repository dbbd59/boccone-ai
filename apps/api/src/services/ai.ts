import {
  AiError,
  buildMealInterpretationPrompt,
  createAiHarness,
  createMealCatalogTools,
  discoverModels as discoverProviderModels,
  listProviderDefinitions,
  mealInterpretationSchema,
  validateModelSelection,
  type AiHarness,
  type AiInvocationRecord,
  type AiModelDescriptor,
  type AiProvider,
  type MealInterpretationFood,
} from "@boccone/ai";
import {
  adminAiUsageResponseSchema,
  aiConnectionTestResponseSchema,
  aiModelsResponseSchema,
  aiProviderSchema,
  aiSettingsResponseSchema,
  mealDraftResponseSchema,
  type AdminAiUsageQuery,
  type AdminAiUsageResponse,
  type AdminAiUsageSummary,
  type AiModelsResponse,
  type AiSettingsResponse,
  type FoodSearchQuery,
  type FoodSearchResponse,
  type MealDraftResponse,
  type MealInterpretationRequest,
  type UpdateAiSettings,
} from "@boccone/contracts";
import {
  aiProviderConfigs,
  aiUsage,
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  getTableColumns,
  sum,
  type Database,
  user,
} from "@boccone/db";
import { calculateNutrition, normalizeFoodName, roundNutrition } from "@boccone/utils";

import { AppError } from "../errors";
import type { Logger } from "../logger";
import { getVisibleFood, searchFoods } from "./foods";
import { createSecretBox, type SecretBox } from "./ai-secrets";

export interface AiService {
  getSettings(userId: string): Promise<AiSettingsResponse>;
  updateSettings(userId: string, input: UpdateAiSettings): Promise<AiSettingsResponse>;
  deleteApiKey(userId: string): Promise<AiSettingsResponse>;
  discoverModels(userId: string, refresh?: boolean): Promise<AiModelsResponse>;
  testConnection(
    userId: string,
    requestId: string,
  ): Promise<ReturnType<typeof aiConnectionTestResponseSchema.parse>>;
  interpretMeal(
    userId: string,
    requestId: string,
    input: MealInterpretationRequest,
    abortController?: AbortController,
  ): Promise<MealDraftResponse>;
  listUsage(query: AdminAiUsageQuery): Promise<AdminAiUsageResponse>;
}

export interface CreateAiServiceOptions {
  db: Database;
  encryptionKey?: string;
  harness?: AiHarness;
  logger?: Logger;
  modelDiscovery?: typeof discoverProviderModels;
}

const RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const MAX_INTERPRETATIONS_PER_WINDOW = 12;
const MAX_CONNECTION_TESTS_PER_WINDOW = 5;
const MAX_MODEL_DISCOVERIES_PER_WINDOW = 10;
const MODEL_DISCOVERY_TTL_MS = 60 * 60_000;
const DEFAULT_MEAL_INTERPRETATION_TIMEOUT_MS = 20_000;
const FREE_OPENROUTER_TIMEOUT_MS = 60_000;

export function createAiService(options: CreateAiServiceOptions): AiService {
  const secretBox = createSecretBox(options.encryptionKey);
  const rateLimiter = new UserRateLimiter();
  const modelCache = new ModelDiscoveryCache();
  const modelDiscovery = options.modelDiscovery ?? discoverProviderModels;
  const harness =
    options.harness ??
    createAiHarness({
      onInvocation: async (record) => {
        logAiCompletion(options.logger, record);
        await persistAiInvocation(options.db, record);
      },
    });

  return {
    getSettings: (userId) => getSettings(options.db, userId),
    updateSettings: async (userId, input) => {
      const result = await updateSettings(options.db, userId, input, secretBox);
      modelCache.invalidate(userId);
      return result;
    },
    deleteApiKey: async (userId) => {
      const result = await deleteApiKey(options.db, userId);
      modelCache.invalidate(userId);
      return result;
    },
    discoverModels: (userId, refresh = false) => {
      rateLimiter.consume(userId, MAX_MODEL_DISCOVERIES_PER_WINDOW);
      return discoverUserModels(options.db, userId, secretBox, modelCache, modelDiscovery, refresh);
    },
    testConnection: async (userId, requestId) => {
      rateLimiter.consume(userId, MAX_CONNECTION_TESTS_PER_WINDOW);
      const configured = await getConfiguredProvider(options.db, userId, secretBox);
      logAiStart(options.logger, {
        userId,
        feature: "AI_CONNECTION_TEST",
        provider: configured.provider,
        model: configured.model,
        requestId,
      });
      try {
        await harness.runText({
          context: {
            userId,
            feature: "AI_CONNECTION_TEST",
            provider: configured.provider,
            model: configured.model,
            locale: "en",
            timezone: "UTC",
            requestId,
          },
          apiKey: configured.apiKey,
          baseUrl: configured.baseUrl,
          messages: [{ role: "user", content: "Connection test." }],
          systemPrompt: "Reply with the single word OK.",
          timeoutMs: 10_000,
        });
      } catch (error) {
        throw toAppError(error);
      }
      return aiConnectionTestResponseSchema.parse({
        success: true,
        provider: configured.provider,
        model: configured.model,
      });
    },
    interpretMeal: async (userId, requestId, input, abortController) => {
      rateLimiter.consume(userId, MAX_INTERPRETATIONS_PER_WINDOW);
      const configured = await getConfiguredProvider(options.db, userId, secretBox);
      logAiStart(options.logger, {
        userId,
        feature: "MEAL_NATURAL_LANGUAGE",
        provider: configured.provider,
        model: configured.model,
        requestId,
      });
      const prompt = buildMealInterpretationPrompt({
        text: input.text,
        locale: input.locale,
        timezone: input.timezone,
        localTime: new Intl.DateTimeFormat(input.locale, {
          timeZone: input.timezone,
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date()),
      });
      const tools =
        configured.provider === "openrouter"
          ? undefined
          : createMealCatalogTools({
              search: async ({ query, locale, limit }) => {
                const result = await searchFoods(options.db, userId, { query, locale, limit });
                return result.foods.map(toCatalogToolFood);
              },
              details: async ({ foodId }) => {
                const food = await getVisibleFood(options.db, userId, foodId);
                return food ? toCatalogToolFood(food) : null;
              },
              portions: async ({ foodId }) => {
                const food = await getVisibleFood(options.db, userId, foodId);
                return (
                  food?.portions.map((portion) => ({
                    name: portion.name,
                    amount: portion.amount,
                    unit: portion.unit,
                    gramWeight: portion.gramWeight,
                    isDefault: portion.isDefault,
                  })) ?? []
                );
              },
            });
      try {
        const result = await harness.runStructured({
          context: {
            userId,
            feature: "MEAL_NATURAL_LANGUAGE",
            provider: configured.provider,
            model: configured.model,
            locale: input.locale,
            timezone: input.timezone,
            requestId,
          },
          apiKey: configured.apiKey,
          baseUrl: configured.baseUrl,
          messages: [{ role: "user", content: prompt.user }],
          systemPrompt: prompt.system,
          outputSchema: mealInterpretationSchema,
          tools,
          abortController,
          timeoutMs: mealInterpretationTimeoutMs(configured.provider, configured.model),
        });
        return mealDraftResponseSchema.parse({
          draft: await buildMealDraft(options.db, userId, input.locale, result.output),
        });
      } catch (error) {
        throw toAppError(error);
      }
    },
    listUsage: (query) => listUsage(options.db, query),
  };
}

function mealInterpretationTimeoutMs(provider: AiProvider, model: string): number {
  if (provider === "openrouter" && (model === "openrouter/free" || model.endsWith(":free"))) {
    return FREE_OPENROUTER_TIMEOUT_MS;
  }
  return DEFAULT_MEAL_INTERPRETATION_TIMEOUT_MS;
}

async function getSettings(db: Database, userId: string): Promise<AiSettingsResponse> {
  const [config] = await db
    .select({
      provider: aiProviderConfigs.provider,
      model: aiProviderConfigs.model,
      baseUrl: aiProviderConfigs.baseUrl,
      encryptedApiKey: aiProviderConfigs.encryptedApiKey,
    })
    .from(aiProviderConfigs)
    .where(eq(aiProviderConfigs.userId, userId));
  return aiSettingsResponseSchema.parse({
    settings: config
      ? {
          provider: config.provider,
          model: config.model,
          baseUrl: config.baseUrl,
          hasApiKey: Boolean(config.encryptedApiKey),
        }
      : null,
    providers: listProviderDefinitions(),
  });
}

async function updateSettings(
  db: Database,
  userId: string,
  input: UpdateAiSettings,
  secretBox: SecretBox,
): Promise<AiSettingsResponse> {
  if (!validateProviderModel(input.provider, input.model)) {
    throw new AppError("ai_model_unsupported", "AI model is not supported");
  }
  const [current] = await db
    .select()
    .from(aiProviderConfigs)
    .where(eq(aiProviderConfigs.userId, userId));
  const sameProvider = current?.provider === input.provider;
  const model = input.model ?? (sameProvider ? (current?.model ?? null) : null);
  const baseUrl =
    input.baseUrl !== undefined ? input.baseUrl : sameProvider ? (current?.baseUrl ?? null) : null;
  if (input.provider === "openai-compatible" && !baseUrl) {
    throw new AppError(
      "validation_error",
      "A base URL is required for an OpenAI-compatible provider",
    );
  }
  let encryptedApiKey: string | null;
  if (input.apiKey !== undefined) {
    try {
      encryptedApiKey = secretBox.encrypt(input.apiKey);
    } catch (error) {
      throw toAppError(error);
    }
  } else {
    encryptedApiKey = sameProvider ? (current?.encryptedApiKey ?? null) : null;
  }
  await db
    .insert(aiProviderConfigs)
    .values({
      userId,
      provider: input.provider,
      model,
      baseUrl,
      encryptedApiKey,
    })
    .onConflictDoUpdate({
      target: aiProviderConfigs.userId,
      set: {
        provider: input.provider,
        model,
        baseUrl,
        encryptedApiKey,
        updatedAt: new Date(),
      },
    });
  return getSettings(db, userId);
}

async function deleteApiKey(db: Database, userId: string): Promise<AiSettingsResponse> {
  await db
    .update(aiProviderConfigs)
    .set({ encryptedApiKey: null, updatedAt: new Date() })
    .where(eq(aiProviderConfigs.userId, userId));
  return getSettings(db, userId);
}

async function getConfiguredProvider(db: Database, userId: string, secretBox: SecretBox) {
  const [config] = await db
    .select()
    .from(aiProviderConfigs)
    .where(eq(aiProviderConfigs.userId, userId));
  if (!config?.encryptedApiKey)
    throw new AppError("ai_not_configured", "Configure an AI API key first");
  const model = config.model;
  if (!model) throw new AppError("ai_model_not_selected", "Select an AI model first");
  if (!validateProviderModel(config.provider, model)) {
    throw new AppError("ai_model_unsupported", "AI model is not supported");
  }
  try {
    return {
      provider: config.provider as
        "openai" | "anthropic" | "gemini" | "openrouter" | "openai-compatible",
      model,
      baseUrl: config.baseUrl,
      apiKey: secretBox.decrypt(config.encryptedApiKey),
    };
  } catch (error) {
    if (error instanceof AiError && error.code === "AI_SECRET_UNAVAILABLE") {
      throw new AppError("ai_secret_unavailable", error.message);
    }
    throw error;
  }
}

function validateProviderModel(provider: string, model: string | undefined): boolean {
  if (model === undefined) return true;
  const definition = listProviderDefinitions().find((item) => item.id === provider);
  if (!definition) return false;
  return validateModelSelection(definition.id, model);
}

async function discoverUserModels(
  db: Database,
  userId: string,
  secretBox: SecretBox,
  cache: ModelDiscoveryCache,
  modelDiscovery: typeof discoverProviderModels,
  refresh: boolean,
): Promise<AiModelsResponse> {
  const [config] = await db
    .select({
      provider: aiProviderConfigs.provider,
      baseUrl: aiProviderConfigs.baseUrl,
      encryptedApiKey: aiProviderConfigs.encryptedApiKey,
    })
    .from(aiProviderConfigs)
    .where(eq(aiProviderConfigs.userId, userId));
  if (!config?.encryptedApiKey)
    throw new AppError("ai_not_configured", "Configure an AI API key first");

  const providerResult = aiProviderSchema.safeParse(config.provider);
  if (!providerResult.success) throw new AppError("validation_error", "AI provider is invalid");
  const provider = providerResult.data;
  const cached = cache.get(userId, provider, config.baseUrl);
  const cacheIsFresh = cached && Date.now() - cached.cachedAt.getTime() <= MODEL_DISCOVERY_TTL_MS;
  if (cached && cacheIsFresh && !refresh)
    return modelsResponse(provider, cached.models, false, cached.cachedAt);

  let apiKey: string;
  try {
    apiKey = secretBox.decrypt(config.encryptedApiKey);
  } catch (error) {
    if (error instanceof AiError && error.code === "AI_SECRET_UNAVAILABLE") {
      throw new AppError("ai_secret_unavailable", error.message);
    }
    throw error;
  }

  try {
    const models = await modelDiscovery({
      provider,
      apiKey,
      baseUrl: config.baseUrl,
    });
    const cachedAt = new Date();
    cache.set(userId, provider, config.baseUrl, models, cachedAt);
    return modelsResponse(provider, models, false, cachedAt);
  } catch (error) {
    const aiError = error instanceof AiError ? error : new AiError("AI_UNKNOWN_ERROR");
    if (
      cached &&
      !["AI_INVALID_CREDENTIALS", "AI_SECRET_UNAVAILABLE", "AI_CANCELLED"].includes(aiError.code)
    ) {
      return modelsResponse(provider, cached.models, true, cached.cachedAt);
    }
    throw toAppError(aiError);
  }
}

function modelsResponse(
  provider: AiModelDescriptor["provider"],
  models: AiModelDescriptor[],
  stale: boolean,
  cachedAt: Date,
): AiModelsResponse {
  return aiModelsResponseSchema.parse({
    provider,
    models,
    stale,
    cachedAt: cachedAt.toISOString(),
  });
}

class ModelDiscoveryCache {
  private readonly entries = new Map<string, CachedModels>();

  get(userId: string, provider: AiModelDescriptor["provider"], baseUrl: string | null) {
    const entry = this.entries.get(userId);
    if (entry?.provider !== provider || entry?.baseUrl !== baseUrl) return undefined;
    return entry;
  }

  set(
    userId: string,
    provider: AiModelDescriptor["provider"],
    baseUrl: string | null,
    models: AiModelDescriptor[],
    cachedAt: Date,
  ): void {
    this.entries.set(userId, { provider, baseUrl, models, cachedAt });
  }

  invalidate(userId: string): void {
    this.entries.delete(userId);
  }
}

interface CachedModels {
  provider: AiModelDescriptor["provider"];
  baseUrl: string | null;
  models: AiModelDescriptor[];
  cachedAt: Date;
}

async function buildMealDraft(
  db: Database,
  userId: string,
  locale: "en" | "it",
  interpretation: {
    mealType?: "breakfast" | "lunch" | "dinner" | "snack" | null;
    mealName?: string | null;
    foods: MealInterpretationFood[];
    notes?: string | null;
  },
) {
  return buildMealDraftFromCatalog(locale, interpretation, (query) =>
    searchFoods(db, userId, query),
  );
}

/** Deterministic catalog/resolution stage, isolated from the provider harness. */
export async function buildMealDraftFromCatalog(
  locale: "en" | "it",
  interpretation: {
    mealType?: "breakfast" | "lunch" | "dinner" | "snack" | null;
    mealName?: string | null;
    foods: MealInterpretationFood[];
    notes?: string | null;
  },
  searchCatalog: (query: FoodSearchQuery) => Promise<FoodSearchResponse>,
) {
  const foods = await Promise.all(
    interpretation.foods.map((food) => resolveDraftFood(locale, food, searchCatalog)),
  );
  const totals = sumDraftNutrition(foods.map((food) => food.nutrition));
  return {
    mealType: interpretation.mealType ?? null,
    mealName: interpretation.mealName ?? null,
    foods,
    notes: interpretation.notes ?? null,
    totals: totals.values,
    nutritionIncomplete: totals.incomplete,
  };
}

async function resolveDraftFood(
  locale: "en" | "it",
  input: MealInterpretationFood,
  searchCatalog: (query: FoodSearchQuery) => Promise<FoodSearchResponse>,
) {
  const query = [input.normalizedName, input.brand].filter(Boolean).join(" ");
  const searchResult = await searchCatalog({ query, locale, limit: 5 });
  const normalizedQuery = normalizeFoodName(input.normalizedName);
  const ranked = searchResult.foods
    .map((food) => ({ food, score: matchScore(food, normalizedQuery, input.brand) }))
    .sort(
      (left, right) => right.score - left.score || left.food.name.localeCompare(right.food.name),
    );
  const best = ranked[0];
  const tied = best ? ranked.filter((item) => item.score === best.score && item.score > 0) : [];
  if (!best || best.score === 0) {
    return unresolvedDraftFood(input, searchResult.foods);
  }
  if (tied.length > 1 && best.score < 1_000) {
    return unresolvedDraftFood(
      input,
      tied.map((item) => item.food),
      "Multiple catalog matches need review",
    );
  }
  const portion = choosePortion(best.food, input);
  const grams = input.grams ?? (portion ? (input.quantity ?? 1) * portion.gramWeight : null);
  const catalogNutrition =
    grams === null ? null : toDraftNutrition(calculateNutrition(best.food.nutritionPer100g, grams));
  const nutrition = catalogNutrition ?? toEstimatedDraftNutrition(input.estimatedNutrition);
  const complete =
    grams !== null &&
    nutrition !== null &&
    Object.values(nutrition).every((value) => value !== null);
  return {
    sourceText: input.sourceText,
    normalizedName: best.food.name,
    food: best.food,
    candidates: [],
    portionName: portion?.name ?? portionLabel(input, grams),
    quantity: input.quantity ?? 1,
    grams,
    nutrition,
    confidence: Math.min(1, Math.max(input.confidence, best.score >= 1_000 ? 0.95 : 0.75)),
    resolutionStatus: complete ? ("RESOLVED" as const) : ("ESTIMATED" as const),
    reviewNote: complete ? null : "Catalog nutrition or portion data is incomplete",
  };
}

function unresolvedDraftFood(
  input: MealInterpretationFood,
  candidates: Awaited<ReturnType<typeof searchFoods>>["foods"],
  reviewNote = "No unique catalog match was found",
) {
  const nutrition = toEstimatedDraftNutrition(input.estimatedNutrition);
  return {
    sourceText: input.sourceText,
    normalizedName: input.normalizedName,
    food: null,
    candidates: candidates.slice(0, 5),
    portionName: portionLabel(input, input.grams ?? null),
    quantity: input.quantity ?? 1,
    grams: input.grams ?? null,
    nutrition,
    confidence: input.confidence,
    resolutionStatus: candidates.length > 1 ? ("AMBIGUOUS" as const) : ("UNRESOLVED" as const),
    reviewNote: nutrition ? "AI nutrition estimate — verify before saving" : reviewNote,
  };
}

function matchScore(
  food: Awaited<ReturnType<typeof searchFoods>>["foods"][number],
  query: string,
  brand?: string,
): number {
  const names = [food.name, ...food.aliases.map((alias) => alias.name)].map(normalizeFoodName);
  const brandMatch =
    brand && food.brand ? normalizeFoodName(food.brand) === normalizeFoodName(brand) : false;
  if (names.some((name) => name === query)) return brandMatch ? 1_050 : 1_000;
  if (names.some((name) => name.startsWith(query) || query.startsWith(name)))
    return brandMatch ? 950 : 900;
  return brandMatch ? 500 : 0;
}

function choosePortion(
  food: Awaited<ReturnType<typeof searchFoods>>["foods"][number],
  input: MealInterpretationFood,
) {
  const description = normalizeFoodName(
    [input.portionDescription, input.unit].filter(Boolean).join(" "),
  );
  if (description) {
    const described = food.portions.find((portion) => {
      const name = normalizeFoodName(portion.name);
      return name.includes(description) || description.includes(name);
    });
    if (described) return described;
  }
  return food.portions.find((portion) => portion.isDefault) ?? food.portions[0];
}

function portionLabel(input: MealInterpretationFood, grams: number | null): string {
  if (input.portionDescription) return input.portionDescription;
  if (grams !== null) return `${grams} g`;
  return input.unit ? `${input.quantity ?? 1} ${input.unit}` : "portion";
}

function toDraftNutrition(values: ReturnType<typeof calculateNutrition>) {
  const rounded = roundNutrition(values);
  return {
    calories: rounded.energyKcal,
    proteinGrams: rounded.proteinG,
    carbohydratesGrams: rounded.carbohydratesG,
    fatGrams: rounded.fatG,
  };
}

function toEstimatedDraftNutrition(values: MealInterpretationFood["estimatedNutrition"]) {
  if (!values) return null;
  return {
    calories: values.calories,
    proteinGrams: values.proteinGrams,
    carbohydratesGrams: values.carbohydratesGrams,
    fatGrams: values.fatGrams,
  };
}

function sumDraftNutrition(nutrition: (ReturnType<typeof toDraftNutrition> | null)[]) {
  const keys = ["calories", "proteinGrams", "carbohydratesGrams", "fatGrams"] as const;
  const values = Object.fromEntries(
    keys.map((key) => {
      const known = nutrition
        .map((item) => item?.[key])
        .filter((value): value is number => value !== null && value !== undefined);
      return [
        key,
        known.length === nutrition.length
          ? Number(known.reduce((sum, value) => sum + value, 0).toFixed(2))
          : null,
      ];
    }),
  ) as Record<(typeof keys)[number], number | null>;
  return {
    values,
    incomplete: nutrition.some((item) => item === null || keys.some((key) => item[key] === null)),
  };
}

function toCatalogToolFood(food: Awaited<ReturnType<typeof searchFoods>>["foods"][number]) {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    category: food.category,
    portions: food.portions.map((portion) => ({
      name: portion.name,
      amount: portion.amount,
      unit: portion.unit,
      gramWeight: portion.gramWeight,
      isDefault: portion.isDefault,
    })),
  };
}

export async function persistAiInvocation(db: Database, record: AiInvocationRecord): Promise<void> {
  await db.insert(aiUsage).values({
    id: crypto.randomUUID(),
    userId: record.context.userId,
    feature: record.context.feature,
    provider: record.context.provider,
    model: record.context.model,
    inputTokens: record.usage.inputTokens,
    outputTokens: record.usage.outputTokens,
    totalTokens: record.usage.totalTokens,
    latencyMs: record.latencyMs,
    status: record.status,
    errorCode: record.errorCode,
    providerRequestId: record.providerRequestId,
  });
}

async function listUsage(db: Database, query: AdminAiUsageQuery): Promise<AdminAiUsageResponse> {
  const filters = [
    query.feature ? eq(aiUsage.feature, query.feature) : undefined,
    query.provider ? eq(aiUsage.provider, query.provider) : undefined,
    query.status ? eq(aiUsage.status, query.status) : undefined,
  ].filter((value): value is NonNullable<typeof value> => value !== undefined);
  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows, summaryRow, providerRows, modelRows, featureRows] = await Promise.all([
    db
      .select({
        usage: getTableColumns(aiUsage),
        principal: { id: user.id, name: user.name, email: user.email },
      })
      .from(aiUsage)
      .leftJoin(user, eq(aiUsage.userId, user.id))
      .where(where)
      .orderBy(desc(aiUsage.createdAt), desc(aiUsage.id))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(aiUsage).where(where),
    db
      .select({
        requestCount: count(),
        averageLatencyMs: avg(aiUsage.latencyMs),
        inputTokens: sum(aiUsage.inputTokens),
        outputTokens: sum(aiUsage.outputTokens),
        totalTokens: sum(aiUsage.totalTokens),
      })
      .from(aiUsage)
      .where(where),
    db
      .select({ key: aiUsage.provider, requests: count() })
      .from(aiUsage)
      .where(where)
      .groupBy(aiUsage.provider)
      .orderBy(desc(count()), asc(aiUsage.provider)),
    db
      .select({ key: aiUsage.model, requests: count() })
      .from(aiUsage)
      .where(where)
      .groupBy(aiUsage.model)
      .orderBy(desc(count()), asc(aiUsage.model)),
    db
      .select({ key: aiUsage.feature, requests: count() })
      .from(aiUsage)
      .where(where)
      .groupBy(aiUsage.feature)
      .orderBy(desc(count()), asc(aiUsage.feature)),
  ]);
  const statusRows = await Promise.all(
    (["succeeded", "failed", "cancelled"] as const).map(async (status) => {
      const [row] = await db
        .select({ requests: count() })
        .from(aiUsage)
        .where(and(where ?? undefined, eq(aiUsage.status, status)));
      return [status, Number(row?.requests ?? 0)] as const;
    }),
  );
  const statusCounts = Object.fromEntries(statusRows) as Record<
    "succeeded" | "failed" | "cancelled",
    number
  >;
  const summary: AdminAiUsageSummary = {
    requestCount: Number(summaryRow[0]?.requestCount ?? 0),
    succeededCount: statusCounts.succeeded,
    failedCount: statusCounts.failed,
    cancelledCount: statusCounts.cancelled,
    averageLatencyMs: Math.round(Number(summaryRow[0]?.averageLatencyMs ?? 0)),
    inputTokens: nullableAggregate(summaryRow[0]?.inputTokens),
    outputTokens: nullableAggregate(summaryRow[0]?.outputTokens),
    totalTokens: nullableAggregate(summaryRow[0]?.totalTokens),
    byProvider: providerRows.map((row) => ({ key: row.key, requests: Number(row.requests) })),
    byModel: modelRows.map((row) => ({ key: row.key, requests: Number(row.requests) })),
    byFeature: featureRows.map((row) => ({ key: row.key, requests: Number(row.requests) })),
  };
  return adminAiUsageResponseSchema.parse({
    usage: rows.map((row) => ({ ...row.usage, user: row.principal })),
    summary,
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

function nullableAggregate(value: number | string | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function logAiStart(
  logger: Logger | undefined,
  context: Pick<
    AiInvocationRecord["context"],
    "userId" | "feature" | "provider" | "model" | "requestId"
  >,
): void {
  logger?.info("ai.request.started", {
    requestId: context.requestId,
    userId: context.userId,
    feature: context.feature,
    provider: context.provider,
    model: context.model,
  });
}

function logAiCompletion(logger: Logger | undefined, record: AiInvocationRecord): void {
  const fields = {
    requestId: record.context.requestId,
    userId: record.context.userId,
    feature: record.context.feature,
    provider: record.context.provider,
    model: record.context.model,
    status: record.status,
    latencyMs: record.latencyMs,
    inputTokens: record.usage.inputTokens,
    outputTokens: record.usage.outputTokens,
    totalTokens: record.usage.totalTokens,
    errorCode: record.errorCode,
    providerRequestId: record.providerRequestId,
  };
  if (record.status === "succeeded") logger?.info("ai.request.completed", fields);
  else logger?.warn("ai.request.failed", fields);
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const aiError = error instanceof AiError ? error : new AiError("AI_UNKNOWN_ERROR");
  const codeByAiCode = {
    AI_NOT_CONFIGURED: "ai_not_configured",
    AI_INVALID_CREDENTIALS: "ai_invalid_credentials",
    AI_RATE_LIMITED: "ai_rate_limited",
    AI_PROVIDER_UNAVAILABLE: "ai_provider_unavailable",
    AI_MODEL_NOT_FOUND: "ai_model_not_found",
    AI_MODEL_NOT_ACCESSIBLE: "ai_model_not_accessible",
    AI_MODEL_NOT_SELECTED: "ai_model_not_selected",
    AI_MODEL_DISCOVERY_UNAVAILABLE: "ai_model_discovery_unavailable",
    AI_MODEL_UNSUPPORTED: "ai_model_unsupported",
    AI_TIMEOUT: "ai_timeout",
    AI_CANCELLED: "ai_cancelled",
    AI_INVALID_RESPONSE: "ai_invalid_response",
    AI_SECRET_UNAVAILABLE: "ai_secret_unavailable",
    AI_UNKNOWN_ERROR: "ai_unknown_error",
  } as const;
  return new AppError(codeByAiCode[aiError.code], aiError.message);
}

class UserRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  consume(userId: string, max: number): void {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recent = (this.attempts.get(userId) ?? []).filter((timestamp) => timestamp > cutoff);
    if (recent.length >= max)
      throw new AppError("ai_rate_limited", "Too many AI requests; try again later");
    recent.push(Date.now());
    this.attempts.set(userId, recent);
  }
}
