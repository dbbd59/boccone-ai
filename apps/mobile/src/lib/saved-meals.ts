import {
  createSavedMeal as createSavedMealRequest,
  deleteSavedMealRoutine as deleteSavedMealRoutineRequest,
  getSavedMeal as getSavedMealRequest,
  listSavedMeals as listSavedMealsRequest,
  useSavedMeal as markSavedMealUsedRequest,
  putSavedMealRoutine as putSavedMealRoutineRequest,
  removeSavedMeal as removeSavedMealRequest,
  updateSavedMeal as updateSavedMealRequest,
  type CreateSavedMealData,
  type Meal,
  type PutSavedMealRoutineData,
  type SavedMeal,
  type SavedMealsResponse,
  type UpdateSavedMealData,
} from "@boccone/api-client";

export type { SavedMeal, SavedMealsResponse };

export class SavedMealNotFoundError extends Error {
  constructor() {
    super("Saved meal not found");
    this.name = "SavedMealNotFoundError";
  }
}

export async function fetchSavedMeals(): Promise<SavedMeal[]> {
  const result = await listSavedMealsRequest();
  if (result.error || result.data === undefined) throw new Error("Unable to load saved meals");
  return result.data.savedMeals;
}

export async function fetchSavedMeal(id: string): Promise<SavedMeal> {
  const result = await getSavedMealRequest({ path: { id } });
  if (result.response?.status === 404) throw new SavedMealNotFoundError();
  if (result.error || result.data === undefined) throw new Error("Unable to load saved meal");
  return result.data.savedMeal;
}

export async function createSavedMeal(input: CreateSavedMealData["body"]): Promise<SavedMeal> {
  const result = await createSavedMealRequest({ body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to save meal template");
  return result.data.savedMeal;
}

export async function updateSavedMeal(
  id: string,
  input: UpdateSavedMealData["body"],
): Promise<SavedMeal> {
  const result = await updateSavedMealRequest({ path: { id }, body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to update saved meal");
  return result.data.savedMeal;
}

export async function removeSavedMeal(id: string): Promise<void> {
  const result = await removeSavedMealRequest({ path: { id } });
  if (result.error || result.data === undefined) throw new Error("Unable to delete saved meal");
}

export async function saveRoutine(
  id: string,
  input: PutSavedMealRoutineData["body"],
): Promise<SavedMeal> {
  const result = await putSavedMealRoutineRequest({ path: { id }, body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to save routine");
  return result.data.savedMeal;
}

export async function clearRoutine(id: string): Promise<SavedMeal> {
  const result = await deleteSavedMealRoutineRequest({ path: { id } });
  if (result.error || result.data === undefined) throw new Error("Unable to remove routine");
  return result.data.savedMeal;
}

/** Called only after a meal created from this template was persisted. */
export async function markUsed(id: string, mealId: string): Promise<void> {
  await markSavedMealUsedRequest({ path: { id }, body: { mealId } });
}

export type { Meal };
