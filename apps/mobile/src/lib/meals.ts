import {
  createMeal as createMealRequest,
  getMeal as getMealRequest,
  removeMeal as removeMealRequest,
  updateMeal as updateMealRequest,
  type CreateMealRequest,
  type Meal,
  type UpdateMealRequest,
} from "@boccone/api-client";

export { formatLocalDate } from "./dates";

export class MealNotFoundError extends Error {
  constructor() {
    super("Meal not found");
    this.name = "MealNotFoundError";
  }
}

export async function createMeal(input: CreateMealRequest): Promise<Meal> {
  const result = await createMealRequest({ body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to save meal");
  return result.data.meal;
}

export async function updateMeal(mealId: string, input: UpdateMealRequest): Promise<Meal> {
  const result = await updateMealRequest({ path: { id: mealId }, body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to save meal");
  return result.data.meal;
}

export async function fetchMeal(mealId: string): Promise<Meal> {
  const result = await getMealRequest({ path: { id: mealId } });
  if (result.response?.status === 404) throw new MealNotFoundError();
  if (result.error || result.data === undefined) throw new Error("Unable to load meal");
  return result.data.meal;
}

export async function removeMeal(mealId: string): Promise<void> {
  const result = await removeMealRequest({ path: { id: mealId } });
  if (result.error || result.data === undefined) throw new Error("Unable to remove meal");
}
