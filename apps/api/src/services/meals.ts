import {
  adminMealsResponseSchema,
  dailyMealsResponseSchema,
  mealMutationResponseSchema,
  mealResponseSchema,
  type AdminMealsQuery,
  type AdminMealsResponse,
  type CreateMeal,
  type DailyMealsResponse,
  type Meal,
  type MealMutationResponse,
  type MealTotals,
  type UpdateMeal,
} from "@boccone/contracts";
import { and, asc, count, desc, eq, meals, type Database, user } from "@boccone/db";

import { AppError } from "../errors";

const EMPTY_TOTALS = {
  calories: 0,
  proteinGrams: 0,
  carbohydratesGrams: 0,
  fatGrams: 0,
} as const;

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

  return dailyMealsResponseSchema.parse({
    date,
    meals: rows.map(toMeal),
    totals: rows.reduce<MealTotals>(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        proteinGrams: totals.proteinGrams + meal.proteinGrams,
        carbohydratesGrams: totals.carbohydratesGrams + meal.carbohydratesGrams,
        fatGrams: totals.fatGrams + meal.fatGrams,
      }),
      { ...EMPTY_TOTALS },
    ),
  });
}

export async function getUserMeal(db: Database, userId: string, mealId: string): Promise<Meal> {
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  if (!row) throw new AppError("not_found", "Meal not found");
  return toMeal(row);
}

export async function createUserMeal(
  db: Database,
  userId: string,
  input: CreateMeal,
): Promise<Meal> {
  const [row] = await db
    .insert(meals)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      category: input.category,
      mealDate: input.date,
      calories: input.calories,
      proteinGrams: input.proteinGrams,
      carbohydratesGrams: input.carbohydratesGrams,
      fatGrams: input.fatGrams,
      notes: input.notes ?? null,
      source: "manual",
    })
    .returning();

  if (!row) throw new AppError("internal_error", "Meal was not created");
  return toMeal(row);
}

export async function updateUserMeal(
  db: Database,
  userId: string,
  mealId: string,
  input: UpdateMeal,
): Promise<Meal> {
  await getUserMeal(db, userId, mealId);
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
  return toMeal(row);
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
    meals: rows.map(toMeal),
    total: Number(totalRows[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getAdminMeal(db: Database, userId: string, mealId: string): Promise<Meal> {
  await assertUserExists(db, userId);
  return getUserMeal(db, userId, mealId);
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

function toMeal(row: typeof meals.$inferSelect): Meal {
  return mealResponseSchema.shape.meal.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    date: row.mealDate,
    calories: row.calories,
    proteinGrams: row.proteinGrams,
    carbohydratesGrams: row.carbohydratesGrams,
    fatGrams: row.fatGrams,
    notes: row.notes,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
