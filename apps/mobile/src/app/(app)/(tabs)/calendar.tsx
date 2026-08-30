import { useLocalSearchParams } from "expo-router";

import { CalendarScreen } from "../../../features/calendar/CalendarScreen";
import { formatLocalDate, isValidCalendarDate } from "../../../lib/dates";

export default function CalendarRoute() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = typeof params.date === "string" ? params.date : undefined;
  return (
    <CalendarScreen
      initialDate={
        date && isValidCalendarDate(date) && date <= formatLocalDate() ? date : undefined
      }
    />
  );
}
