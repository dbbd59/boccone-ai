import {
  adminFoodResponseSchema,
  adminFoodSubmissionSchema,
  adminFoodsResponseSchema,
  adminFoodSubmissionsResponseSchema,
  foodSchema,
  foodSearchResponseSchema,
  foodSubmissionResponseSchema,
  type AdminFoodSubmission,
  type AdminFoodSubmissionsQuery,
  type AdminFoodUpdate,
  type AdminFoodsQuery,
  type AdminFoodsResponse,
  type CreateFoodSubmission,
  type Food,
  type FoodSearchQuery,
  type FoodSearchResponse,
  type NutritionPer100g,
} from "@boccone/contracts";
import {
  and,
  asc,
  count,
  desc,
  eq,
  foodAliases,
  foodPortions,
  foods,
  foodSubmissions,
  ilike,
  inArray,
  mealFoodEntries,
  meals,
  ne,
  or,
  type Database,
  user,
} from "@boccone/db";
import { normalizeFoodName, nutritionFromFood } from "@boccone/utils";

import { AppError } from "../errors";

export async function searchFoods(
  db: Database,
  userId: string,
  query: FoodSearchQuery,
): Promise<FoodSearchResponse> {
  const normalizedQuery = normalizeFoodName(query.query);
  const visible = or(
    eq(foods.status, "APPROVED"),
    and(eq(foods.ownerUserId, userId), ne(foods.status, "MERGED")),
  );
  const nameFilter = normalizedQuery
    ? foodSearchCondition(normalizedQuery)
    : eq(foods.isFeatured, true);

  const candidateLimit = Math.min(query.limit * 5, 100);
  const [nameRows, aliasRows] = await Promise.all([
    db
      .select()
      .from(foods)
      .where(and(visible, nameFilter))
      .orderBy(asc(foods.normalizedName), desc(foods.updatedAt))
      .limit(candidateLimit),
    normalizedQuery
      ? db
          .select({ foodId: foodAliases.foodId, normalizedName: foodAliases.normalizedName })
          .from(foodAliases)
          .where(
            and(
              or(eq(foodAliases.locale, query.locale), eq(foodAliases.locale, "en")),
              searchQueryCondition(foodAliases.normalizedName, normalizedQuery),
            ),
          )
          .orderBy(asc(foodAliases.normalizedName))
          .limit(candidateLimit)
      : Promise.resolve([]),
  ]);

  const nameIds = new Set(nameRows.map((row) => row.id));
  const aliasIds = aliasRows.map((row) => row.foodId).filter((id) => !nameIds.has(id));
  const aliasFoodRows = aliasIds.length
    ? await db
        .select()
        .from(foods)
        .where(and(visible, inArray(foods.id, aliasIds)))
        .limit(query.limit)
    : [];
  const [recentIds, frequentIds] = await Promise.all([
    listRecentFoodIds(db, userId),
    listFrequentFoodIds(db, userId),
  ]);
  const recentRank = new Map(recentIds.map((id, index) => [id, recentIds.length - index]));
  const frequentRank = new Map(frequentIds.map((id, index) => [id, frequentIds.length - index]));
  const aliasRank = new Map<string, number>();
  for (const alias of aliasRows) {
    const score = searchTextScore(alias.normalizedName, normalizedQuery);
    aliasRank.set(alias.foodId, Math.max(score, aliasRank.get(alias.foodId) ?? 0));
  }
  const resultRows = [...nameRows, ...aliasFoodRows]
    .filter((row, index, rows) => rows.findIndex((candidate) => candidate.id === row.id) === index)
    .sort((left, right) => {
      const score = (row: typeof left) => {
        if (!normalizedQuery) return 0;
        const nameScore = searchTextScore(
          `${row.normalizedName} ${normalizeFoodName(row.category ?? "")}`,
          normalizedQuery,
        );
        const aliasScore = aliasRank.get(row.id) ?? 0;
        return (
          Math.max(nameScore, aliasScore) +
          (recentRank.get(row.id) ?? 0) * 5 +
          (frequentRank.get(row.id) ?? 0) * 3
        );
      };
      return (
        score(right) - score(left) ||
        left.normalizedName.length - right.normalizedName.length ||
        left.normalizedName.localeCompare(right.normalizedName)
      );
    })
    .filter((row, index, rows) => {
      const displayKey =
        row.type === "branded"
          ? `${row.normalizedName}:${normalizeFoodName(row.brand ?? "")}`
          : row.normalizedName;
      return (
        rows.findIndex((candidate) => {
          const candidateKey =
            candidate.type === "branded"
              ? `${candidate.normalizedName}:${normalizeFoodName(candidate.brand ?? "")}`
              : candidate.normalizedName;
          return candidateKey === displayKey;
        }) === index
      );
    })
    .slice(0, query.limit);
  const [result, recent, frequent] = await Promise.all([
    hydrateFoods(db, resultRows, userId),
    hydrateFoodsByIds(db, recentIds, userId),
    hydrateFoodsByIds(db, frequentIds, userId),
  ]);

  return foodSearchResponseSchema.parse({ foods: result, recent, frequent });
}

/** Read one catalog entry through the same visibility boundary as the user API. */
export async function getVisibleFood(
  db: Database,
  userId: string,
  foodId: string,
): Promise<Food | null> {
  const visible = or(
    eq(foods.status, "APPROVED"),
    and(eq(foods.ownerUserId, userId), ne(foods.status, "MERGED")),
  );
  const [row] = await db
    .select()
    .from(foods)
    .where(and(visible, eq(foods.id, foodId)))
    .limit(1);
  const [food] = row ? await hydrateFoods(db, [row], userId) : [];
  return food ?? null;
}

function searchTextScore(value: string, query: string): number {
  if (!query) return 0;
  const queryTokens = query.split(" ").filter(Boolean);
  const tokenScores = queryTokens.map((token) =>
    Math.max(...searchTermAlternates(token).map((term) => searchSingleTextScore(value, term))),
  );
  if (tokenScores.some((score) => score === 0)) return 0;
  if (queryTokens.length > 1) return 600 + tokenScores.reduce((sum, score) => sum + score, 0);
  return tokenScores[0] ?? 0;
}

function searchSingleTextScore(value: string, query: string): number {
  if (value === query) return 1_000;
  const valueTokens = value.split(" ").filter(Boolean);
  if (value.startsWith(`${query} `)) return 920;
  if (valueTokens.includes(query)) return 900;
  if (value.includes(` ${query} `)) return 850;
  if (query.length < 4 && value.startsWith(query)) return 400;
  return 0;
}

export async function createFoodSubmission(
  db: Database,
  userId: string,
  input: CreateFoodSubmission,
): Promise<ReturnType<typeof foodSubmissionResponseSchema.parse>> {
  const normalizedName = normalizeFoodName(input.name);
  if (!hasCompleteCoreNutrition(input.nutritionPer100g)) {
    throw new AppError(
      "validation_error",
      "Calories, protein, carbohydrates, and fat are required",
    );
  }
  const [existingName] = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(and(eq(foods.status, "APPROVED"), eq(foods.normalizedName, normalizedName)))
    .limit(1);
  const [existingAlias] = await db
    .select({ foodId: foodAliases.foodId })
    .from(foodAliases)
    .where(eq(foodAliases.normalizedName, normalizedName))
    .limit(1);
  if (existingName || existingAlias) {
    throw new AppError("conflict", "A food with this name already exists in the catalog");
  }
  const foodId = crypto.randomUUID();
  const now = new Date();
  const [food] = await db
    .insert(foods)
    .values({
      id: foodId,
      name: input.name,
      normalizedName,
      type: input.type,
      category: input.category ?? null,
      brand: input.brand ?? null,
      energyKcalPer100g: input.nutritionPer100g.energyKcal,
      proteinGPer100g: input.nutritionPer100g.proteinG,
      carbohydratesGPer100g: input.nutritionPer100g.carbohydratesG,
      fatGPer100g: input.nutritionPer100g.fatG,
      fiberGPer100g: input.nutritionPer100g.fiberG,
      sugarGPer100g: input.nutritionPer100g.sugarG,
      saturatedFatGPer100g: input.nutritionPer100g.saturatedFatG,
      sodiumMgPer100g: input.nutritionPer100g.sodiumMg,
      sourceType: "USER_SUBMITTED",
      qualityLevel: "user_private",
      status: "PENDING_REVIEW",
      ownerUserId: userId,
      sourceName: input.name,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!food) throw new AppError("internal_error", "Food was not created");

  await db.insert(foodPortions).values({
    id: crypto.randomUUID(),
    foodId,
    name: input.portionName,
    amount: 1,
    unit: "serving",
    gramWeight: input.portionGrams,
    isDefault: true,
    sourceType: "USER_SUBMITTED",
  });
  const [submission] = await db
    .insert(foodSubmissions)
    .values({ id: crypto.randomUUID(), foodId, submittedBy: userId })
    .returning();
  if (!submission) throw new AppError("internal_error", "Food submission was not created");

  const [hydrated] = await hydrateFoods(db, [food], userId);
  if (!hydrated) throw new AppError("internal_error", "Food was not readable after creation");
  return foodSubmissionResponseSchema.parse({ food: hydrated, submission });
}

export async function listAdminFoods(
  db: Database,
  query: AdminFoodsQuery,
): Promise<AdminFoodsResponse> {
  const filters = [
    query.search ? foodSearchCondition(normalizeFoodName(query.search)) : undefined,
    query.status ? eq(foods.status, query.status) : undefined,
    query.sourceType ? eq(foods.sourceType, query.sourceType) : undefined,
  ].filter((value): value is NonNullable<typeof value> => value !== undefined);
  const where = filters.length ? and(...filters) : undefined;
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(foods)
      .where(where)
      .orderBy(desc(foods.updatedAt), asc(foods.name))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(foods).where(where),
  ]);
  return adminFoodsResponseSchema.parse({
    foods: await hydrateFoods(db, rows, null),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getAdminFood(db: Database, foodId: string): Promise<Food> {
  const [row] = await db.select().from(foods).where(eq(foods.id, foodId));
  if (!row) throw new AppError("not_found", "Food not found");
  const [food] = await hydrateFoods(db, [row], null);
  if (!food) throw new AppError("not_found", "Food not found");
  return adminFoodResponseSchema.parse({ food }).food;
}

export async function updateAdminFood(
  db: Database,
  foodId: string,
  input: AdminFoodUpdate,
): Promise<Food> {
  const [current] = await db.select().from(foods).where(eq(foods.id, foodId));
  if (!current) throw new AppError("not_found", "Food not found");
  const nutrition = input.nutritionPer100g;
  const nextNutrition = nutrition ?? nutritionFromFood(current);
  if (current.status === "APPROVED" && !hasCompleteCoreNutrition(nextNutrition)) {
    throw new AppError(
      "validation_error",
      "Approved foods require calories, protein, carbohydrates, and fat",
    );
  }
  const [updated] = await db
    .update(foods)
    .set({
      ...(input.name !== undefined
        ? { name: input.name, normalizedName: normalizeFoodName(input.name) }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(nutrition ? nutritionColumns(nutrition) : {}),
      updatedAt: new Date(),
    })
    .where(eq(foods.id, foodId))
    .returning();
  if (!updated) throw new AppError("not_found", "Food not found");
  if (input.aliases) {
    await db.delete(foodAliases).where(eq(foodAliases.foodId, foodId));
    if (input.aliases.length) {
      await db.insert(foodAliases).values(
        input.aliases.map((alias) => ({
          id: crypto.randomUUID(),
          foodId,
          locale: alias.locale,
          name: alias.name,
          normalizedName: normalizeFoodName(alias.name),
        })),
      );
    }
  }
  if (input.portions) {
    await db.delete(foodPortions).where(eq(foodPortions.foodId, foodId));
    const defaultIndex = Math.max(
      0,
      input.portions.findIndex((portion) => portion.isDefault),
    );
    if (input.portions.length) {
      await db.insert(foodPortions).values(
        input.portions.map((portion, index) => ({
          id: crypto.randomUUID(),
          foodId,
          name: portion.name,
          amount: portion.amount,
          unit: portion.unit,
          gramWeight: portion.gramWeight,
          isDefault: index === defaultIndex,
          sourceType: "BOCCONE_CURATED" as const,
        })),
      );
    }
  }
  return getAdminFood(db, foodId);
}

export async function listAdminFoodSubmissions(
  db: Database,
  query: AdminFoodSubmissionsQuery,
): Promise<ReturnType<typeof adminFoodSubmissionsResponseSchema.parse>> {
  const where = eq(foodSubmissions.status, query.status);
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        submission: foodSubmissions,
        food: foods,
        submitter: { id: user.id, name: user.name, email: user.email },
      })
      .from(foodSubmissions)
      .innerJoin(foods, eq(foodSubmissions.foodId, foods.id))
      .innerJoin(user, eq(foodSubmissions.submittedBy, user.id))
      .where(where)
      .orderBy(asc(foodSubmissions.createdAt))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(foodSubmissions).where(where),
  ]);
  const submissions = await Promise.all(
    rows.map((row) => toAdminFoodSubmission(db, row.submission, row.food, row.submitter)),
  );
  return adminFoodSubmissionsResponseSchema.parse({
    submissions,
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getAdminFoodSubmission(
  db: Database,
  submissionId: string,
): Promise<AdminFoodSubmission> {
  const [row] = await db
    .select({
      submission: foodSubmissions,
      food: foods,
      submitter: { id: user.id, name: user.name, email: user.email },
    })
    .from(foodSubmissions)
    .innerJoin(foods, eq(foodSubmissions.foodId, foods.id))
    .innerJoin(user, eq(foodSubmissions.submittedBy, user.id))
    .where(eq(foodSubmissions.id, submissionId));
  if (!row) throw new AppError("not_found", "Food submission not found");
  return toAdminFoodSubmission(db, row.submission, row.food, row.submitter);
}

export async function approveFoodSubmission(
  db: Database,
  adminId: string,
  submissionId: string,
): Promise<AdminFoodSubmission> {
  const submission = await requirePendingSubmission(db, submissionId);
  const [food] = await db.select().from(foods).where(eq(foods.id, submission.foodId));
  if (!food || !hasCompleteCoreNutrition(nutritionFromFood(food))) {
    throw new AppError(
      "validation_error",
      "Complete calories, protein, carbohydrates, and fat before approval",
    );
  }
  await db
    .update(foods)
    .set({
      status: "APPROVED",
      qualityLevel: "community_approved",
      ownerUserId: null,
      updatedAt: new Date(),
    })
    .where(eq(foods.id, submission.foodId));
  await db
    .update(foodSubmissions)
    .set({ status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(foodSubmissions.id, submissionId));
  return getAdminFoodSubmission(db, submissionId);
}

export async function rejectFoodSubmission(
  db: Database,
  adminId: string,
  submissionId: string,
  reason?: string | null,
): Promise<AdminFoodSubmission> {
  const submission = await requirePendingSubmission(db, submissionId);
  await db
    .update(foods)
    .set({ status: "REJECTED", updatedAt: new Date() })
    .where(eq(foods.id, submission.foodId));
  await db
    .update(foodSubmissions)
    .set({
      status: "REJECTED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(foodSubmissions.id, submissionId));
  return getAdminFoodSubmission(db, submissionId);
}

export async function mergeFoodSubmission(
  db: Database,
  adminId: string,
  submissionId: string,
  targetFoodId: string,
): Promise<AdminFoodSubmission> {
  const submission = await requirePendingSubmission(db, submissionId);
  if (submission.foodId === targetFoodId)
    throw new AppError("conflict", "A food cannot be merged into itself");
  const [target] = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(eq(foods.id, targetFoodId));
  if (!target) throw new AppError("not_found", "Target food not found");
  const [submittedFood] = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(eq(foods.id, submission.foodId));
  await db
    .update(foods)
    .set({ status: "MERGED", updatedAt: new Date() })
    .where(eq(foods.id, submission.foodId));
  await db
    .update(foodSubmissions)
    .set({
      status: "MERGED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      mergedIntoFoodId: targetFoodId,
      updatedAt: new Date(),
    })
    .where(eq(foodSubmissions.id, submissionId));
  if (submittedFood && normalizeFoodName(submittedFood.name) !== normalizeFoodName(target.name)) {
    const normalizedAlias = normalizeFoodName(submittedFood.name);
    const [existingAlias] = await db
      .select({ id: foodAliases.id })
      .from(foodAliases)
      .where(
        and(eq(foodAliases.foodId, targetFoodId), eq(foodAliases.normalizedName, normalizedAlias)),
      )
      .limit(1);
    if (!existingAlias) {
      await db.insert(foodAliases).values({
        id: crypto.randomUUID(),
        foodId: targetFoodId,
        locale: "it",
        name: submittedFood.name,
        normalizedName: normalizedAlias,
      });
    }
  }
  return getAdminFoodSubmission(db, submissionId);
}

async function requirePendingSubmission(db: Database, submissionId: string) {
  const [submission] = await db
    .select()
    .from(foodSubmissions)
    .where(eq(foodSubmissions.id, submissionId));
  if (!submission) throw new AppError("not_found", "Food submission not found");
  if (submission.status !== "PENDING_REVIEW")
    throw new AppError("conflict", "Food submission is already reviewed");
  return submission;
}

async function toAdminFoodSubmission(
  db: Database,
  submission: typeof foodSubmissions.$inferSelect,
  food: typeof foods.$inferSelect,
  submitter: { id: string; name: string; email: string },
): Promise<AdminFoodSubmission> {
  const [hydratedFood] = await hydrateFoods(db, [food], null);
  if (!hydratedFood) throw new AppError("internal_error", "Food is not readable");
  const duplicateTokens = unique(
    food.normalizedName.split(" ").filter((token) => token.length >= 3),
  );
  const duplicateMatches = [
    ...duplicateTokens.map((token) => ilike(foods.normalizedName, `%${escapeLike(token)}%`)),
    ...(food.barcode ? [eq(foods.barcode, food.barcode)] : []),
  ];
  const duplicateRows = duplicateMatches.length
    ? await db
        .select()
        .from(foods)
        .where(and(eq(foods.status, "APPROVED"), or(...duplicateMatches)))
        .limit(5)
    : [];
  const duplicateAliasRows = duplicateTokens.length
    ? await db
        .select({ foodId: foodAliases.foodId })
        .from(foodAliases)
        .where(
          or(
            ...duplicateTokens.map((token) =>
              ilike(foodAliases.normalizedName, `%${escapeLike(token)}%`),
            ),
          ),
        )
        .limit(5)
    : [];
  const candidateIds = unique([
    ...duplicateRows.map((row) => row.id),
    ...duplicateAliasRows.map((row) => row.foodId),
  ]).filter((id) => id !== food.id);
  const candidateRows = candidateIds.length
    ? await db
        .select()
        .from(foods)
        .where(and(eq(foods.status, "APPROVED"), inArray(foods.id, candidateIds)))
    : [];
  const duplicates = await hydrateFoods(db, candidateRows, null);
  return adminFoodSubmissionSchema.parse({
    ...submission,
    food: hydratedFood,
    submitter,
    possibleDuplicates: duplicates,
    validationFlags: validateNutrition(nutritionFromFood(food)),
  });
}

async function hydrateFoods(
  db: Database,
  rows: (typeof foods.$inferSelect)[],
  viewerUserId: string | null,
): Promise<Food[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const [aliases, portions] = await Promise.all([
    db
      .select()
      .from(foodAliases)
      .where(inArray(foodAliases.foodId, ids))
      .orderBy(asc(foodAliases.name)),
    db
      .select()
      .from(foodPortions)
      .where(inArray(foodPortions.foodId, ids))
      .orderBy(desc(foodPortions.isDefault), asc(foodPortions.name)),
  ]);
  return rows.map((row) =>
    foodSchema.parse({
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      brand: row.brand,
      barcode: row.barcode,
      nutritionPer100g: nutritionFromFood(row),
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      qualityLevel: row.qualityLevel,
      status: row.status,
      portions: portions
        .filter((portion) => portion.foodId === row.id)
        .map((portion) => ({
          id: portion.id,
          name: portion.name,
          amount: portion.amount,
          unit: portion.unit,
          gramWeight: portion.gramWeight,
          isDefault: portion.isDefault,
          sourceType: portion.sourceType,
        })),
      aliases: aliases
        .filter((alias) => alias.foodId === row.id)
        .map((alias) => ({ id: alias.id, locale: alias.locale, name: alias.name })),
      isPrivate:
        viewerUserId !== null && row.ownerUserId === viewerUserId && row.status !== "APPROVED",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
  );
}

async function hydrateFoodsByIds(
  db: Database,
  ids: string[],
  viewerUserId: string,
): Promise<Food[]> {
  if (!ids.length) return [];
  const visible = or(
    eq(foods.status, "APPROVED"),
    and(eq(foods.ownerUserId, viewerUserId), ne(foods.status, "MERGED")),
  );
  const rows = await db
    .select()
    .from(foods)
    .where(and(visible, inArray(foods.id, ids)));
  const hydrated = await hydrateFoods(db, rows, viewerUserId);
  const byId = new Map(hydrated.map((food) => [food.id, food]));
  return ids.map((id) => byId.get(id)).filter((food): food is Food => food !== undefined);
}

async function listRecentFoodIds(db: Database, userId: string): Promise<string[]> {
  const rows = await db
    .select({ foodId: mealFoodEntries.foodId })
    .from(mealFoodEntries)
    .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
    .where(eq(meals.userId, userId))
    .orderBy(desc(mealFoodEntries.createdAt))
    .limit(30);
  return unique(rows.map((row) => row.foodId)).slice(0, 6);
}

async function listFrequentFoodIds(db: Database, userId: string): Promise<string[]> {
  const rows = await db
    .select({ foodId: mealFoodEntries.foodId, uses: count() })
    .from(mealFoodEntries)
    .innerJoin(meals, eq(mealFoodEntries.mealId, meals.id))
    .where(eq(meals.userId, userId))
    .groupBy(mealFoodEntries.foodId)
    .orderBy(desc(count()))
    .limit(6);
  return rows.map((row) => row.foodId);
}

function nutritionColumns(nutrition: NutritionPer100g) {
  return {
    energyKcalPer100g: nutrition.energyKcal,
    proteinGPer100g: nutrition.proteinG,
    carbohydratesGPer100g: nutrition.carbohydratesG,
    fatGPer100g: nutrition.fatG,
    fiberGPer100g: nutrition.fiberG,
    sugarGPer100g: nutrition.sugarG,
    saturatedFatGPer100g: nutrition.saturatedFatG,
    sodiumMgPer100g: nutrition.sodiumMg,
  };
}

export function validateNutrition(nutrition: NutritionPer100g | LegacyNutrition): string[] {
  const values: Record<keyof NutritionPer100g, number | null | undefined> =
    "energyKcal" in nutrition
      ? nutrition
      : {
          energyKcal: nutrition.energyKcalPer100g,
          proteinG: nutrition.proteinGPer100g,
          carbohydratesG: nutrition.carbohydratesGPer100g,
          fatG: nutrition.fatGPer100g,
          fiberG: nutrition.fiberGPer100g,
          sugarG: nutrition.sugarGPer100g,
          saturatedFatG: nutrition.saturatedFatGPer100g,
          sodiumMg: nutrition.sodiumMgPer100g,
        };
  const flags: string[] = [];
  const { energyKcal, proteinG, carbohydratesG, fatG } = values;
  if (energyKcal == null) flags.push("Missing calories");
  if (proteinG == null || carbohydratesG == null || fatG == null) {
    flags.push("Missing one or more core macros");
  }
  if (energyKcal != null && energyKcal > 1_000) flags.push("Calories are unusually high");
  if (proteinG != null && proteinG > 100) flags.push("Protein is unusually high");
  if (carbohydratesG != null && carbohydratesG > 100) {
    flags.push("Carbohydrates are unusually high");
  }
  if (fatG != null && fatG > 100) flags.push("Fat is unusually high");
  if (values.sodiumMg != null && values.sodiumMg > 10_000) {
    flags.push("Sodium is unusually high");
  }
  if (energyKcal != null && proteinG != null && carbohydratesG != null && fatG != null) {
    const calculated = proteinG * 4 + carbohydratesG * 4 + fatG * 9;
    if (
      Math.abs(energyKcal - calculated) > 40 &&
      Math.abs(energyKcal - calculated) / Math.max(energyKcal, calculated, 1) > 0.25
    ) {
      flags.push("Energy is inconsistent with macros");
    }
  }
  return flags;
}

function hasCompleteCoreNutrition(nutrition: NutritionPer100g): boolean {
  return (
    nutrition.energyKcal !== null &&
    nutrition.proteinG !== null &&
    nutrition.carbohydratesG !== null &&
    nutrition.fatG !== null
  );
}

interface LegacyNutrition {
  energyKcalPer100g: number | null | undefined;
  proteinGPer100g: number | null | undefined;
  carbohydratesGPer100g: number | null | undefined;
  fatGPer100g: number | null | undefined;
  fiberGPer100g: number | null | undefined;
  sugarGPer100g: number | null | undefined;
  saturatedFatGPer100g: number | null | undefined;
  sodiumMgPer100g: number | null | undefined;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const searchTermAlternatesMap: Record<string, string[]> = {
  bevanda: ["bevanda", "bevande", "beverage", "beverages"],
  bevande: ["bevanda", "bevande", "beverage", "beverages"],
  carne: ["carne", "carni", "meat"],
  cereale: ["cereale", "cereali", "cereal", "cereals"],
  cereali: ["cereale", "cereali", "cereal", "cereals"],
  frutta: ["frutta", "frutto", "frutti", "fruit", "fruits"],
  frutto: ["frutta", "frutto", "frutti", "fruit", "fruits"],
  frutti: ["frutta", "frutto", "frutti", "fruit", "fruits"],
  latticino: ["latticino", "latticini", "dairy"],
  latticini: ["latticino", "latticini", "dairy"],
  ortaggio: ["ortaggio", "ortaggi", "verdura", "vegetable", "vegetables"],
  ortaggi: ["ortaggio", "ortaggi", "verdura", "vegetable", "vegetables"],
  pesce: ["pesce", "fish"],
  verdura: ["verdura", "verdure", "ortaggio", "ortaggi", "vegetable", "vegetables"],
  verdure: ["verdura", "verdure", "ortaggio", "ortaggi", "vegetable", "vegetables"],
};

function searchTermAlternates(token: string): string[] {
  return unique(searchTermAlternatesMap[token] ?? [token]);
}

function searchQueryCondition(
  column: typeof foods.normalizedName | typeof foodAliases.normalizedName,
  query: string,
) {
  const tokens = query.split(" ").filter(Boolean);
  return and(
    ...tokens.map((token) =>
      or(...searchTermAlternates(token).map((term) => searchTextCondition(column, term))),
    ),
  );
}

function foodSearchCondition(query: string) {
  const tokens = query.split(" ").filter(Boolean);
  return and(
    ...tokens.map((token) =>
      or(
        ...searchTermAlternates(token).flatMap((term) => [
          searchTextCondition(foods.normalizedName, term),
          searchTextCondition(foods.category, term),
        ]),
      ),
    ),
  );
}

function searchTextCondition(
  column: typeof foods.normalizedName | typeof foods.category | typeof foodAliases.normalizedName,
  query: string,
) {
  const escaped = escapeLike(query);
  const tokenBoundary = or(
    eq(column, query),
    ilike(column, escaped),
    ilike(column, `${escaped} %`),
    ilike(column, `% ${escaped} %`),
    ilike(column, `% ${escaped}`),
  );
  return query.length < 4
    ? or(tokenBoundary, ilike(column, `${escaped}%`), ilike(column, `% ${escaped}%`))
    : tokenBoundary;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
