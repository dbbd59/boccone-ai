import {
  adminMealsResponseSchema,
  adminGlobalMealResponseSchema,
  adminGlobalMealsResponseSchema,
  calendarMonthResponseSchema,
  dailyMealsResponseSchema,
  diaryResponseSchema,
  mealMutationResponseSchema,
  mealResponseSchema,
  mealFoodEntrySchema,
  type AdminMealsQuery,
  type AdminMealsResponse,
  type AdminGlobalMealsQuery,
  type AdminGlobalMealsResponse,
  type AdminGlobalMeal,
  type CalendarMonthResponse,
  type CreateMeal,
  type DailyMealsResponse,
  type DiaryResponse,
  type Meal,
  type MealMutationResponse,
  type MealTotals,
  type UpdateMeal,
  type MealFoodEntryInput,
  type MealFoodEntryUpdateInput,
} from "@boccone/contracts";
import { calculateNutrition, nutritionFromFood, roundNutrition } from "@boccone/utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  foods,
  gte,
  ilike,
  inArray,
  lt,
  mealFoodEntries,
  meals,
  ne,
  or,
  type Database,
  user,
} from "@boccone/db";

import { AppError } from "../errors";

const EMPTY_TOTALS = {
  calories: 0,
  proteinGrams: 0,
  carbohydratesGrams: 0,
  fatGrams: 0,
} as const;

type MealFoodEntryInsert = typeof mealFoodEntries.$inferInsert;

export async function getDailyMeals(
  db: Database,
  userId: string,
  date: string,
): Promise<DailyMealsResponse> {
  const rows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.mealDate, date)))
    .orderBy(asc(meals.createdAt), asc(meals.id));

  return toDailyMealsResponse(date, rows, await hydrateMeals(db, rows));
}

export async function getCalendarMonth(
  db: Database,
  userId: string,
  month: string,
): Promise<CalendarMonthResponse> {
  const yearPart = Number(month.slice(0, 4));
  const monthPart = Number(month.slice(5, 7));
  const nextMonth = monthPart === 12 ? 1 : monthPart + 1;
  const nextYear = monthPart === 12 ? yearPart + 1 : yearPart;
  const from = `${month}-01`;
  const to = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const rows = await db
    .select({ date: meals.mealDate, mealCount: count() })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.mealDate, from), lt(meals.mealDate, to)))
    .groupBy(meals.mealDate)
    .orderBy(asc(meals.mealDate));

  return calendarMonthResponseSchema.parse({
    month,
    days: rows.map((row) => ({ date: row.date, mealCount: Number(row.mealCount) })),
  });
}

/**
 * Returns populated days strictly before `before`, newest first. Empty days
 * are intentionally omitted so a long history stays cheap to render; the
 * client owns the empty state for its current date.
 */
export async function getMealDiary(
  db: Database,
  userId: string,
  before: string,
  limit: number,
  foodId?: string,
): Promise<DiaryResponse> {
  const conditions = [eq(meals.userId, userId), lt(meals.mealDate, before)];
  if (foodId) {
    const matchingMeals = db
      .select({ mealId: mealFoodEntries.mealId })
      .from(mealFoodEntries)
      .where(eq(mealFoodEntries.foodId, foodId));
    conditions.push(inArray(meals.id, matchingMeals));
  }
  const dateRows = await db
    .select({ date: meals.mealDate })
    .from(meals)
    .where(and(...conditions))
    .groupBy(meals.mealDate)
    .orderBy(desc(meals.mealDate))
    .limit(limit + 1);
  const dates = dateRows.slice(0, limit).map((row) => row.date);
  if (dates.length === 0) {
    return diaryResponseSchema.parse({ days: [], nextBefore: null });
  }

  const mealConditions = [eq(meals.userId, userId), inArray(meals.mealDate, dates)];
  if (foodId) {
    const matchingMeals = db
      .select({ mealId: mealFoodEntries.mealId })
      .from(mealFoodEntries)
      .where(eq(mealFoodEntries.foodId, foodId));
    mealConditions.push(inArray(meals.id, matchingMeals));
  }
  const rows = await db
    .select()
    .from(meals)
    .where(and(...mealConditions))
    .orderBy(desc(meals.mealDate), asc(meals.createdAt), asc(meals.id));
  const hydrated = await hydrateMeals(db, rows);
  const mealsByDate = new Map<string, Meal[]>();
  rows.forEach((row, index) => {
    const dayMeals = mealsByDate.get(row.mealDate) ?? [];
    const meal = hydrated[index];
    if (meal) dayMeals.push(meal);
    mealsByDate.set(row.mealDate, dayMeals);
  });
  const days = dates.flatMap((date) => {
    const dayMeals = mealsByDate.get(date) ?? [];
    return [
      toDailyMealsResponse(
        date,
        rows.filter((row) => row.mealDate === date),
        dayMeals,
      ),
    ];
  });

  return diaryResponseSchema.parse({
    days,
    nextBefore: dateRows.length > limit ? (dates.at(-1) ?? null) : null,
  });
}

export async function getUserMeal(db: Database, userId: string, mealId: string): Promise<Meal> {
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  if (!row) throw new AppError("not_found", "Meal not found");
  return toMeal(row, await listMealEntries(db, mealId));
}

export async function createUserMeal(
  db: Database,
  userId: string,
  input: CreateMeal,
): Promise<Meal> {
  if ("entries" in input) return createFoodBackedMeal(db, userId, input);
  const manualInput = asManualMeal(input);
  const [row] = await db
    .insert(meals)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: manualInput.name,
      category: manualInput.category,
      mealDate: manualInput.date,
      calories: manualInput.calories,
      proteinGrams: manualInput.proteinGrams,
      carbohydratesGrams: manualInput.carbohydratesGrams,
      fatGrams: manualInput.fatGrams,
      notes: manualInput.notes ?? null,
      source: "manual",
    })
    .returning();

  if (!row) throw new AppError("internal_error", "Meal was not created");
  return toMeal(row, []);
}

export async function updateUserMeal(
  db: Database,
  userId: string,
  mealId: string,
  input: UpdateMeal,
): Promise<Meal> {
  const current = await getUserMeal(db, userId, mealId);
  if (input.entries) {
    const calculated = await calculateUpdatedEntries(db, userId, current.entries, input.entries);
    await db.transaction(async (tx) => {
      await tx.delete(mealFoodEntries).where(eq(mealFoodEntries.mealId, mealId));
      await tx
        .insert(mealFoodEntries)
        .values(calculated.entries.map((entry) => ({ ...entry, mealId })));
      await tx
        .update(meals)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.date !== undefined ? { mealDate: input.date } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          calories: calculated.totals.calories,
          proteinGrams: calculated.totals.proteinGrams,
          carbohydratesGrams: calculated.totals.carbohydratesGrams,
          fatGrams: calculated.totals.fatGrams,
          nutritionIncomplete: calculated.nutritionIncomplete,
          updatedAt: new Date(),
        })
        .where(eq(meals.id, mealId));
    });
    return getUserMeal(db, userId, current.id);
  }
  const [row] = await db
    .update(meals)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.date !== undefined ? { mealDate: input.date } : {}),
      ...(input.calories !== undefined ? { calories: input.calories } : {}),
      ...(input.proteinGrams !== undefined ? { proteinGrams: input.proteinGrams } : {}),
      ...(input.carbohydratesGrams !== undefined
        ? { carbohydratesGrams: input.carbohydratesGrams }
        : {}),
      ...(input.fatGrams !== undefined ? { fatGrams: input.fatGrams } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .returning();

  if (!row) throw new AppError("not_found", "Meal not found");
  return toMeal(row, current.entries);
}

export async function removeUserMeal(
  db: Database,
  userId: string,
  mealId: string,
): Promise<MealMutationResponse> {
  await getUserMeal(db, userId, mealId);
  await db.delete(meals).where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  return mealMutationResponseSchema.parse({ success: true });
}

export async function listAdminMeals(
  db: Database,
  userId: string,
  query: AdminMealsQuery,
): Promise<AdminMealsResponse> {
  await assertUserExists(db, userId);
  const where = query.date
    ? and(eq(meals.userId, userId), eq(meals.mealDate, query.date))
    : eq(meals.userId, userId);
  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(meals)
      .where(where)
      .orderBy(desc(meals.mealDate), desc(meals.createdAt), desc(meals.id))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: count() }).from(meals).where(where),
  ]);

  return adminMealsResponseSchema.parse({
    userId,
    meals: await hydrateMeals(db, rows),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getAdminMeal(db: Database, userId: string, mealId: string): Promise<Meal> {
  await assertUserExists(db, userId);
  return getUserMeal(db, userId, mealId);
}

export async function listAdminMealsGlobal(
  db: Database,
  query: AdminGlobalMealsQuery,
): Promise<AdminGlobalMealsResponse> {
  const where = buildGlobalMealsWhere(query);
  const [rows, totalRows] = await Promise.all([
    db
      .select({
        meal: meals,
        owner: { id: user.id, name: user.name, email: user.email },
      })
      .from(meals)
      .innerJoin(user, eq(meals.userId, user.id))
      .where(where)
      .orderBy(desc(meals.mealDate), desc(meals.createdAt), desc(meals.id))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: count() })
      .from(meals)
      .innerJoin(user, eq(meals.userId, user.id))
      .where(where),
  ]);

  return adminGlobalMealsResponseSchema.parse({
    meals: await Promise.all(
      rows.map(async (row) =>
        toAdminGlobalMeal(row.meal, row.owner, await listMealEntries(db, row.meal.id)),
      ),
    ),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getAdminGlobalMeal(db: Database, mealId: string): Promise<AdminGlobalMeal> {
  const [row] = await db
    .select({
      meal: meals,
      owner: { id: user.id, name: user.name, email: user.email },
    })
    .from(meals)
    .innerJoin(user, eq(meals.userId, user.id))
    .where(eq(meals.id, mealId));
  if (!row) throw new AppError("not_found", "Meal not found");
  return toAdminGlobalMeal(row.meal, row.owner, await listMealEntries(db, row.meal.id));
}

export async function createAdminMeal(
  db: Database,
  userId: string,
  input: CreateMeal,
): Promise<Meal> {
  await assertUserExists(db, userId);
  return createUserMeal(db, userId, input);
}

export async function updateAdminMeal(
  db: Database,
  userId: string,
  mealId: string,
  input: UpdateMeal,
): Promise<Meal> {
  await assertUserExists(db, userId);
  return updateUserMeal(db, userId, mealId, input);
}

export async function removeAdminMeal(
  db: Database,
  userId: string,
  mealId: string,
): Promise<MealMutationResponse> {
  await assertUserExists(db, userId);
  return removeUserMeal(db, userId, mealId);
}

async function assertUserExists(db: Database, userId: string): Promise<void> {
  const [account] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!account) throw new AppError("not_found", "User not found");
}

async function createFoodBackedMeal(
  db: Database,
  userId: string,
  input: Extract<CreateMeal, { entries: MealFoodEntryInput[] }>,
): Promise<Meal> {
  const calculated = await calculateEntries(db, userId, input.entries);
  const [row] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(meals)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: input.name,
        category: input.category,
        mealDate: input.date,
        calories: calculated.totals.calories,
        proteinGrams: calculated.totals.proteinGrams,
        carbohydratesGrams: calculated.totals.carbohydratesGrams,
        fatGrams: calculated.totals.fatGrams,
        nutritionIncomplete: calculated.nutritionIncomplete,
        notes: input.notes ?? null,
        source: "manual",
      })
      .returning();
    if (!created) throw new AppError("internal_error", "Meal was not created");
    await tx
      .insert(mealFoodEntries)
      .values(calculated.entries.map((entry) => ({ ...entry, mealId: created.id })));
    return [created] as const;
  });
  if (!row) throw new AppError("internal_error", "Meal was not created");
  return getUserMeal(db, userId, row.id);
}

async function calculateEntries(db: Database, userId: string, inputs: MealFoodEntryInput[]) {
  if (inputs.length === 0) return summarizeEntries([]);
  const foodIds = [...new Set(inputs.map((entry) => entry.foodId))];
  const visible = or(
    eq(foods.status, "APPROVED"),
    and(eq(foods.ownerUserId, userId), ne(foods.status, "MERGED")),
  );
  const foodRows = await db
    .select()
    .from(foods)
    .where(and(visible, inArray(foods.id, foodIds)));
  const byId = new Map(foodRows.map((food) => [food.id, food]));
  const entries = inputs.map((input) => {
    const food = byId.get(input.foodId);
    if (!food) throw new AppError("not_found", "Food not found or unavailable");
    const nutrition = roundNutrition(calculateNutrition(nutritionFromFood(food), input.grams));
    return {
      id: crypto.randomUUID(),
      mealId: "",
      foodId: food.id,
      foodNameSnapshot: food.name,
      portionNameSnapshot: input.portionName,
      quantity: input.quantity,
      grams: input.grams,
      energyKcalSnapshot: nutrition.energyKcal,
      proteinGSnapshot: nutrition.proteinG,
      carbohydratesGSnapshot: nutrition.carbohydratesG,
      fatGSnapshot: nutrition.fatG,
      fiberGSnapshot: nutrition.fiberG ?? null,
      sugarGSnapshot: nutrition.sugarG ?? null,
      saturatedFatGSnapshot: nutrition.saturatedFatG ?? null,
      sodiumMgSnapshot: nutrition.sodiumMg ?? null,
    };
  });
  return summarizeEntries(entries);
}

async function calculateUpdatedEntries(
  db: Database,
  userId: string,
  currentEntries: Meal["entries"],
  inputs: MealFoodEntryUpdateInput[],
) {
  const currentById = new Map(currentEntries.map((entry) => [entry.id, entry]));
  const seenIds = new Set<string>();
  const entries: (MealFoodEntryInsert | undefined)[] = Array.from({ length: inputs.length });
  const recalculationInputs: MealFoodEntryInput[] = [];
  const recalculationIndexes: number[] = [];

  inputs.forEach((input, index) => {
    if (input.id) {
      if (seenIds.has(input.id)) {
        throw new AppError("bad_request", "A meal entry cannot be included twice");
      }
      seenIds.add(input.id);
      const current = currentById.get(input.id);
      if (!current) throw new AppError("bad_request", "Meal entry does not belong to this meal");
      if (isUnchangedEntry(current, input)) {
        entries[index] = toMealEntryInsert(current);
        return;
      }
    }
    recalculationIndexes.push(index);
    recalculationInputs.push(input);
  });

  const recalculated = await calculateEntries(db, userId, recalculationInputs);
  recalculationIndexes.forEach((inputIndex, recalculatedIndex) => {
    const entry = recalculated.entries[recalculatedIndex];
    if (!entry) throw new AppError("internal_error", "Meal entry was not calculated");
    const requestedId = inputs[inputIndex]?.id;
    entries[inputIndex] = requestedId ? { ...entry, id: requestedId } : entry;
  });

  return summarizeEntries(
    entries.filter((entry): entry is MealFoodEntryInsert => entry !== undefined),
  );
}

function isUnchangedEntry(
  current: Meal["entries"][number],
  input: MealFoodEntryUpdateInput,
): boolean {
  return (
    current.foodId === input.foodId &&
    current.portionName === input.portionName &&
    current.quantity === input.quantity &&
    current.grams === input.grams
  );
}

function toMealEntryInsert(entry: Meal["entries"][number]): MealFoodEntryInsert {
  return {
    id: entry.id,
    mealId: "",
    foodId: entry.foodId,
    foodNameSnapshot: entry.foodName,
    portionNameSnapshot: entry.portionName,
    quantity: entry.quantity,
    grams: entry.grams,
    energyKcalSnapshot: entry.energyKcal,
    proteinGSnapshot: entry.proteinG,
    carbohydratesGSnapshot: entry.carbohydratesG,
    fatGSnapshot: entry.fatG,
    fiberGSnapshot: entry.fiberG,
    sugarGSnapshot: entry.sugarG,
    saturatedFatGSnapshot: entry.saturatedFatG,
    sodiumMgSnapshot: entry.sodiumMg,
  };
}

function summarizeEntries(entries: MealFoodEntryInsert[]) {
  return {
    entries,
    nutritionIncomplete: entries.some((entry) =>
      [
        entry.energyKcalSnapshot,
        entry.proteinGSnapshot,
        entry.carbohydratesGSnapshot,
        entry.fatGSnapshot,
        entry.fiberGSnapshot,
        entry.sugarGSnapshot,
        entry.saturatedFatGSnapshot,
        entry.sodiumMgSnapshot,
      ].some((value) => value === null || value === undefined),
    ),
    totals: {
      calories: Math.round(
        entries.reduce((sum, entry) => sum + (entry.energyKcalSnapshot ?? 0), 0),
      ),
      proteinGrams: Math.round(
        entries.reduce((sum, entry) => sum + (entry.proteinGSnapshot ?? 0), 0),
      ),
      carbohydratesGrams: Math.round(
        entries.reduce((sum, entry) => sum + (entry.carbohydratesGSnapshot ?? 0), 0),
      ),
      fatGrams: Math.round(entries.reduce((sum, entry) => sum + (entry.fatGSnapshot ?? 0), 0)),
    },
  };
}

async function hydrateMeals(db: Database, rows: (typeof meals.$inferSelect)[]): Promise<Meal[]> {
  if (rows.length === 0) return [];
  const entryRows = await db
    .select()
    .from(mealFoodEntries)
    .where(
      inArray(
        mealFoodEntries.mealId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(mealFoodEntries.createdAt), asc(mealFoodEntries.id));
  const entriesByMeal = new Map<string, Meal["entries"]>();
  for (const entry of entryRows) {
    const mealEntries = entriesByMeal.get(entry.mealId) ?? [];
    mealEntries.push(toMealEntry(entry));
    entriesByMeal.set(entry.mealId, mealEntries);
  }
  return rows.map((row) => toMeal(row, entriesByMeal.get(row.id) ?? []));
}

async function listMealEntries(db: Database, mealId: string): Promise<Meal["entries"]> {
  const rows = await db
    .select()
    .from(mealFoodEntries)
    .where(eq(mealFoodEntries.mealId, mealId))
    .orderBy(asc(mealFoodEntries.createdAt), asc(mealFoodEntries.id));
  return rows.map((entry) => toMealEntry(entry));
}

function toMealEntry(entry: typeof mealFoodEntries.$inferSelect): Meal["entries"][number] {
  return mealFoodEntrySchema.parse({
    id: entry.id,
    foodId: entry.foodId,
    foodName: entry.foodNameSnapshot,
    portionName: entry.portionNameSnapshot,
    quantity: entry.quantity,
    grams: entry.grams,
    energyKcal: entry.energyKcalSnapshot,
    proteinG: entry.proteinGSnapshot,
    carbohydratesG: entry.carbohydratesGSnapshot,
    fatG: entry.fatGSnapshot,
    fiberG: entry.fiberGSnapshot,
    sugarG: entry.sugarGSnapshot,
    saturatedFatG: entry.saturatedFatGSnapshot,
    sodiumMg: entry.sodiumMgSnapshot,
  });
}

function toDailyMealsResponse(
  date: string,
  rows: (typeof meals.$inferSelect)[],
  hydratedMeals: Meal[],
): DailyMealsResponse {
  return dailyMealsResponseSchema.parse({
    date,
    meals: hydratedMeals,
    totals: rows.reduce<MealTotals>(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        proteinGrams: totals.proteinGrams + meal.proteinGrams,
        carbohydratesGrams: totals.carbohydratesGrams + meal.carbohydratesGrams,
        fatGrams: totals.fatGrams + meal.fatGrams,
      }),
      { ...EMPTY_TOTALS },
    ),
    nutritionIncomplete: rows.some((meal) => meal.nutritionIncomplete),
  });
}

function toMeal(row: typeof meals.$inferSelect, entries: Meal["entries"]): Meal {
  return mealResponseSchema.shape.meal.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    date: row.mealDate,
    calories: row.calories,
    proteinGrams: row.proteinGrams,
    carbohydratesGrams: row.carbohydratesGrams,
    fatGrams: row.fatGrams,
    nutritionIncomplete: row.nutritionIncomplete,
    notes: row.notes,
    source: row.source,
    entries,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function asManualMeal(input: CreateMeal): Extract<CreateMeal, { calories: number }> {
  if (!("calories" in input)) {
    throw new AppError("bad_request", "A meal must contain nutrition values or food entries");
  }
  return input;
}

function toAdminGlobalMeal(
  row: typeof meals.$inferSelect,
  owner: { id: string; name: string; email: string },
  entries: Meal["entries"],
): AdminGlobalMeal {
  return adminGlobalMealResponseSchema.shape.meal.parse({ ...toMeal(row, entries), user: owner });
}

function buildGlobalMealsWhere(query: AdminGlobalMealsQuery) {
  const filters = [
    query.search
      ? or(
          ilike(meals.name, `%${escapeLike(query.search)}%`),
          ilike(user.name, `%${escapeLike(query.search)}%`),
          ilike(user.email, `%${escapeLike(query.search)}%`),
        )
      : undefined,
    query.date ? eq(meals.mealDate, query.date) : undefined,
    query.category ? eq(meals.category, query.category) : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== undefined);

  return filters.length > 0 ? and(...filters) : undefined;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
