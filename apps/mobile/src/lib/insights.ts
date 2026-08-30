import {
  getPersonalInsights,
  getPersonalNutritionDetail,
  type InsightsMetric,
  type InsightsRange,
  type PersonalInsightsResponse,
  type PersonalNutritionDetail,
} from "@boccone/api-client";

export async function fetchPersonalInsights(input: {
  range: InsightsRange;
  today: string;
}): Promise<PersonalInsightsResponse> {
  const result = await getPersonalInsights({ query: input });
  if (result.error || result.data === undefined) throw new Error("Unable to load insights");
  return result.data;
}

export async function fetchPersonalNutritionDetail(input: {
  range: InsightsRange;
  today: string;
  metric: InsightsMetric;
}): Promise<PersonalNutritionDetail> {
  const result = await getPersonalNutritionDetail({ query: input });
  if (result.error || result.data === undefined) throw new Error("Unable to load nutrition detail");
  return result.data;
}
