import { useLocalSearchParams } from "expo-router";

import { MealComposer } from "../../../features/meals/MealComposer";
import { formatLocalDate, isValidCalendarDate } from "../../../lib/dates";

export default function NewMealRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = typeof params.date === "string" ? params.date : undefined;
  return (
    <MealComposer
      initialDate={
        date && isValidCalendarDate(date) && date <= formatLocalDate() ? date : undefined
      }
    />
  );
}
