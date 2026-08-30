import {
  createFoodSubmission as createFoodSubmissionRequest,
  searchFoods as searchFoodsRequest,
  type CreateFoodSubmissionRequest,
  type Food,
  type FoodSearchResponse,
} from "@boccone/api-client";

export async function searchFoodCatalog(
  query: string,
  locale: "en" | "it",
  signal?: AbortSignal,
): Promise<FoodSearchResponse> {
  const result = await searchFoodsRequest({ query: { query, locale, limit: 20 }, signal });
  if (result.error || result.data === undefined) throw new Error("Unable to load foods");
  return result.data;
}

export async function submitFood(input: CreateFoodSubmissionRequest): Promise<Food> {
  const result = await createFoodSubmissionRequest({ body: input });
  if (result.error || result.data === undefined) throw new Error("Unable to submit food");
  return result.data.food;
}
