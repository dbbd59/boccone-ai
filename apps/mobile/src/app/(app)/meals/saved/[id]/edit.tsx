import { useLocalSearchParams } from "expo-router";

import { SavedMealEditor } from "../../../../../features/saved-meals/SavedMealEditor";

export default function EditSavedMealRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  return <SavedMealEditor savedMealId={id} />;
}
