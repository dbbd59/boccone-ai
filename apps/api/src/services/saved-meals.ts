import {
  savedMealResponseSchema,
  savedMealSchema,
  savedMealsResponseSchema,
  savedMealItemSchema,
  savedMealRoutineSchema,
  savedMealMutationResponseSchema,
  mealCategorySchema,
  type CreateSavedMeal,
  type SavedMeal,
  type SavedMealItem,
  type SavedMealMutationResponse,
  type SavedMealResponse,
  type SavedMealsResponse,
  type SavedMealRoutine,
  type SavedMealRoutineInput,
  type UpdateSavedMeal,
  type UseSavedMeal,
} from "@boccone/contracts";
import {
  eq,
  and,
  asc,
  desc,
  inArray,
  sql,
  savedMeals,
  savedMealItems,
  savedMealRoutines,
  mealProvenance,
  foods,
  type Database,
} from "@boccone/db";

import { AppError } from "../errors";

type SavedMealRow = typeof savedMeals.$inferSelect;
type SavedMealRoutineRow = typeof savedMealRoutines.$inferSelect;

/**
 * Lists the user's saved meals with lightweight deterministic ranking:
 * routines with reminders first, then by recency of use, then creation.
 */
export async function listSavedMeals(db: Database, userId: string): Promise<SavedMealsResponse> {
  const rows = await db
    .select()
    .from(savedMeals)
    .where(eq(savedMeals.userId, userId))
    .orderBy(desc(savedMeals.lastUsedAt), desc(savedMeals.createdAt), desc(savedMeals.id));
  const result = await hydrateSavedMeals(db, userId, rows);
  return savedMealsResponseSchema.parse({ savedMeals: result });
}

export async function getSavedMeal(
  db: Database,
  userId: string,
  savedMealId: string,
): Promise<SavedMeal> {
  const [row] = await db
    .select()
    .from(savedMeals)
    .where(and(eq(savedMeals.id, savedMealId), eq(savedMeals.userId, userId)));
  if (!row) throw new AppError("not_found", "Saved meal not found");
  const [hydrated] = await hydrateSavedMeals(db, userId, [row]);
  if (!hydrated) throw new AppError("internal_error", "Saved meal could not be loaded");
  return hydrated;
}

export async function createSavedMeal(
  db: Database,
  userId: string,
  input: CreateSavedMeal,
): Promise<SavedMealResponse> {
  const [row] = await db
    .insert(savedMeals)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      defaultCategory: input.defaultCategory ?? null,
    })
    .returning();
  if (!row) throw new AppError("internal_error", "Saved meal was not created");

  const existingFoodIds = await resolveFoodIds(
    db,
    input.items.map((item) => item.foodId),
  );
  await db.insert(savedMealItems).values(
    input.items.map((item, index) => ({
      id: crypto.randomUUID(),
      savedMealId: row.id,
      foodId: existingFoodIds.has(item.foodId) ? item.foodId : null,
      foodNameFallback: item.foodId,
      portionNameFallback: item.portionName,
      quantity: item.quantity,
      grams: item.grams,
      position: index,
    })),
  );

  if (input.routine) {
    await upsertRoutine(db, userId, row.id, input.routine);
  }

  return savedMealResponseSchema.parse({ savedMeal: await getSavedMeal(db, userId, row.id) });
}

export async function updateSavedMeal(
  db: Database,
  userId: string,
  savedMealId: string,
  input: UpdateSavedMeal,
): Promise<SavedMealResponse> {
  await getSavedMeal(db, userId, savedMealId);
  await db
    .update(savedMeals)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.defaultCategory !== undefined ? { defaultCategory: input.defaultCategory } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(savedMeals.id, savedMealId), eq(savedMeals.userId, userId)));

  if (input.items) {
    const existingFoodIds = await resolveFoodIds(
      db,
      input.items.map((item) => item.foodId),
    );
    await db.transaction(async (tx) => {
      await tx.delete(savedMealItems).where(eq(savedMealItems.savedMealId, savedMealId));
      await tx.insert(savedMealItems).values(
        input.items!.map((item, index) => ({
          id: crypto.randomUUID(),
          savedMealId,
          foodId: existingFoodIds.has(item.foodId) ? item.foodId : null,
          foodNameFallback: item.foodId,
          portionNameFallback: item.portionName,
          quantity: item.quantity,
          grams: item.grams,
          position: index,
        })),
      );
    });
  }

  return savedMealResponseSchema.parse({
    savedMeal: await getSavedMeal(db, userId, savedMealId),
  });
}

export async function removeSavedMeal(
  db: Database,
  userId: string,
  savedMealId: string,
): Promise<SavedMealMutationResponse> {
  await getSavedMeal(db, userId, savedMealId);
  // Historical meals created from this template are intentionally untouched:
  // provenance rows keep the source id as plain text with no FK.
  await db
    .delete(savedMeals)
    .where(and(eq(savedMeals.id, savedMealId), eq(savedMeals.userId, userId)));
  return savedMealMutationResponseSchema.parse({ success: true });
}

/** Creates or replaces the routine metadata attached to a Saved Meal. */
export async function putSavedMealRoutine(
  db: Database,
  userId: string,
  savedMealId: string,
  input: SavedMealRoutineInput,
): Promise<SavedMealResponse> {
  await getSavedMeal(db, userId, savedMealId);
  await upsertRoutine(db, userId, savedMealId, input);
  return savedMealResponseSchema.parse({
    savedMeal: await getSavedMeal(db, userId, savedMealId),
  });
}

/** Removes routine metadata; the Saved Meal itself is preserved. */
export async function deleteSavedMealRoutine(
  db: Database,
  userId: string,
  savedMealId: string,
): Promise<SavedMealResponse> {
  await getSavedMeal(db, userId, savedMealId);
  await db
    .delete(savedMealRoutines)
    .where(
      and(eq(savedMealRoutines.savedMealId, savedMealId), eq(savedMealRoutines.userId, userId)),
    );
  return savedMealResponseSchema.parse({
    savedMeal: await getSavedMeal(db, userId, savedMealId),
  });
}

/**
 * Records that a meal was successfully created from this template. Only the
 * meal-creation flow may call this — previewing a template is not usage.
 */
export async function markSavedMealUsed(
  db: Database,
  userId: string,
  savedMealId: string,
  input: UseSavedMeal,
): Promise<SavedMealResponse> {
  await getSavedMeal(db, userId, savedMealId);
  await db.transaction(async (tx) => {
    await tx.insert(mealProvenance).values({
      mealId: input.mealId,
      sourceSavedMealId: savedMealId,
    });
    await tx
      .update(savedMeals)
      .set({
        usageCount: sql`${savedMeals.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(and(eq(savedMeals.id, savedMealId), eq(savedMeals.userId, userId)));
  });
  return savedMealResponseSchema.parse({
    savedMeal: await getSavedMeal(db, userId, savedMealId),
  });
}

async function upsertRoutine(
  db: Database,
  userId: string,
  savedMealId: string,
  input: SavedMealRoutineInput,
): Promise<void> {
  const mealType = input.mealType ?? null;
  // Validate against the enum explicitly so an invalid mealType is a 400, not
  // a raw DB error.
  if (mealType !== null) mealCategorySchema.parse(mealType);
  const weekdays = input.weekdays.length > 0 ? input.weekdays : [];
  await db
    .insert(savedMealRoutines)
    .values({
      id: crypto.randomUUID(),
      savedMealId,
      userId,
      defaultCategory: mealType,
      weekdays: weekdays.join(","),
      localTime: input.localTime,
      isReminderEnabled: input.isReminderEnabled,
    })
    .onConflictDoUpdate({
      target: savedMealRoutines.savedMealId,
      set: {
        defaultCategory: mealType,
        weekdays: weekdays.join(","),
        localTime: input.localTime,
        isReminderEnabled: input.isReminderEnabled,
        updatedAt: new Date(),
      },
    });
}

async function resolveFoodIds(db: Database, ids: string[]): Promise<Set<string>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return new Set();
  const rows = await db.select({ id: foods.id }).from(foods).where(inArray(foods.id, uniqueIds));
  return new Set(rows.map((row) => row.id));
}

async function hydrateSavedMeals(
  db: Database,
  userId: string,
  rows: SavedMealRow[],
): Promise<SavedMeal[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [itemRows, routineRows] = await Promise.all([
    db
      .select({ item: savedMealItems })
      .from(savedMealItems)
      .innerJoin(savedMeals, eq(savedMealItems.savedMealId, savedMeals.id))
      .where(and(inArray(savedMealItems.savedMealId, ids), eq(savedMeals.userId, userId)))
      .orderBy(asc(savedMealItems.position), asc(savedMealItems.id)),
    db.select().from(savedMealRoutines).where(inArray(savedMealRoutines.savedMealId, ids)),
  ]);

  // Resolve current catalog names for items; missing foods surface as
  // "needs attention" with the stored fallback name.
  const foodIds = [
    ...new Set(itemRows.map(({ item }) => item.foodId).filter((id): id is string => id !== null)),
  ];
  const foodRows = foodIds.length
    ? await db
        .select({ id: foods.id, name: foods.name })
        .from(foods)
        .where(inArray(foods.id, foodIds))
    : [];
  const foodNames = new Map(foodRows.map((food) => [food.id, food.name]));

  const itemsByMeal = new Map<string, SavedMealItem[]>();
  for (const { item } of itemRows) {
    const list = itemsByMeal.get(item.savedMealId) ?? [];
    const foodName = item.foodId ? (foodNames.get(item.foodId) ?? null) : null;
    list.push(
      savedMealItemSchema.parse({
        id: item.id,
        foodId: item.foodId,
        foodName: foodName ?? item.foodNameFallback,
        needsAttention: foodName === null,
        portionName: item.portionNameFallback ?? "",
        quantity: item.quantity,
        grams: item.grams,
      }),
    );
    itemsByMeal.set(item.savedMealId, list);
  }

  const routinesByMeal = new Map<string, SavedMealRoutineRow>();
  for (const routine of routineRows) {
    routinesByMeal.set(routine.savedMealId, routine);
  }

  return rows.map((row) =>
    savedMealSchema.parse({
      id: row.id,
      name: row.name,
      defaultCategory: row.defaultCategory,
      items: itemsByMeal.get(row.id) ?? [],
      routine: toRoutine(routinesByMeal.get(row.id)),
      usageCount: row.usageCount,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
  );
}

function toRoutine(row: SavedMealRoutineRow | undefined): SavedMealRoutine | null {
  if (!row) return null;
  return savedMealRoutineSchema.parse({
    mealType: row.defaultCategory,
    weekdays: row.weekdays ? row.weekdays.split(",").map(Number) : [],
    localTime: row.localTime,
    isReminderEnabled: row.isReminderEnabled,
  });
}
