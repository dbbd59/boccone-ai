import { useLocalSearchParams } from "expo-router";

import { MealComposer } from "../../../../features/meals/MealComposer";

export default function EditMealRoute() {
  const params = useLocalSearchParams<{ mealId?: string }>();
  const mealId = typeof params.mealId === "string" ? params.mealId : undefined;
  return <MealComposer mealId={mealId} />;
}
