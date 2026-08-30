import { useLocalSearchParams } from "expo-router";

import { SavedMealUse } from "../../../../../features/saved-meals/SavedMealUse";

export default function UseSavedMealRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  return <SavedMealUse savedMealId={id} />;
}
