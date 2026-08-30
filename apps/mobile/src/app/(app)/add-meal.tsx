import { Redirect, useLocalSearchParams } from "expo-router";

/** Preserve the pre-IA meal link while keeping /meals/new canonical. */
export default function LegacyAddMealRoute() {
  const params = useLocalSearchParams<{ mealId?: string }>();
  const mealId = typeof params.mealId === "string" ? params.mealId : undefined;

  if (mealId) {
    return <Redirect href={{ pathname: "/meals/[mealId]/edit", params: { mealId } }} />;
  }

  return <Redirect href="/meals/new" />;
}
