import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";

import { getDailyMealsOptions } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassButton,
  Inline,
  Screen,
  Stack,
  Surface,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { MealListItem } from "../../components/MealListItem";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { useI18n } from "../../i18n/context";
import {
  addCalendarDays,
  formatLocalDate,
  formatMonthYear,
  formatReadableDate,
  formatWeekday,
  parseLocalDate,
  startOfWeek,
} from "../../lib/dates";
import { useSession } from "../../session-context";

export function CalendarScreen() {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const today = formatLocalDate();
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => formatLocalDate(addCalendarDays(weekAnchor, index))),
    [weekAnchor],
  );
  const weekQueries = useQueries({
    queries: weekDates.map((date) => ({
      ...getDailyMealsOptions({ query: { date } }),
      enabled: Boolean(session),
      staleTime: 60_000,
    })),
  });
  const selectedQuery = useQuery({
    ...getDailyMealsOptions({ query: { date: selectedDate } }),
    enabled: Boolean(session),
  });

  function moveWeek(amount: number) {
    const nextAnchor = addCalendarDays(weekAnchor, amount * 7);
    const selectedIndex = weekDates.indexOf(selectedDate);
    setWeekAnchor(nextAnchor);
    setSelectedDate(
      formatLocalDate(addCalendarDays(nextAnchor, selectedIndex >= 0 ? selectedIndex : 0)),
    );
  }

  function selectToday() {
    setWeekAnchor(startOfWeek(new Date()));
    setSelectedDate(today);
  }

  const selectedDay = selectedQuery.data;
  const selectedMeals = selectedDay?.meals ?? [];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              selectedQuery.isRefetching || weekQueries.some((query) => query.isRefetching)
            }
            onRefresh={() => {
              void Promise.all([
                ...weekQueries.map((query) => query.refetch()),
                selectedQuery.refetch(),
              ]);
            }}
            tintColor={colors.interactive.default}
          />
        }
      >
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="caption" tone="default">
              {copy.appName}
            </Text>
            <Text variant="title">{copy.calendar.title}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.calendar.subtitle}
            </Text>
          </Stack>

          <Stack gap="md">
            <Inline align="center" justify="between">
              <GlassButton
                size="sm"
                accessibilityLabel={copy.calendar.previousWeek}
                onPress={() => moveWeek(-1)}
              >
                {copy.calendar.previousWeek}
              </GlassButton>
              <Text variant="headingMd">{formatMonthYear(weekAnchor, locale)}</Text>
              <GlassButton
                size="sm"
                accessibilityLabel={copy.calendar.nextWeek}
                onPress={() => moveWeek(1)}
              >
                {copy.calendar.nextWeek}
              </GlassButton>
            </Inline>
            <ScrollView
              horizontal
              contentContainerStyle={styles.weekStrip}
              showsHorizontalScrollIndicator={false}
            >
              {weekDates.map((date, index) => {
                const dateValue = parseLocalDate(date);
                const dayQuery = weekQueries[index];
                const mealCount = dayQuery?.data?.meals.length ?? 0;
                return (
                  <GlassButton
                    key={date}
                    prominence={selectedDate === date ? "prominent" : "regular"}
                    accessibilityLabel={copy.calendar.dayAccessibility(
                      formatReadableDate(date, locale),
                      mealCount,
                    )}
                    accessibilityState={{ selected: selectedDate === date }}
                    onPress={() => setSelectedDate(date)}
                    style={styles.dayButton}
                  >
                    {`${formatWeekday(dateValue, locale)}\n${dateValue.getDate()}${mealCount > 0 ? " •" : ""}`}
                  </GlassButton>
                );
              })}
            </ScrollView>
            <Button variant="ghost" size="sm" onPress={selectToday}>
              {copy.calendar.today}
            </Button>
          </Stack>

          {weekQueries.some((query) => query.isPending) ? (
            <LoadingSkeleton label={copy.calendar.loadingWeek} />
          ) : null}
          {selectedQuery.isError ? (
            <Stack gap="sm">
              <Alert tone="danger" message={copy.calendar.loadError} />
              <Button variant="ghost" size="sm" onPress={() => void selectedQuery.refetch()}>
                {copy.calendar.retry}
              </Button>
            </Stack>
          ) : null}

          <Stack gap="md">
            <Stack gap="xs">
              <Text variant="headingLg">{formatReadableDate(selectedDate, locale)}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.calendar.selectedDate}
              </Text>
            </Stack>
            {selectedQuery.isPending ? <LoadingSkeleton label={copy.calendar.loadingDay} /> : null}
            {selectedDay?.meals.length === 0 ? (
              <Surface>
                <Stack gap="xs">
                  <Text variant="headingMd">{copy.calendar.emptyTitle}</Text>
                  <Text tone="secondary">{copy.calendar.emptyBody}</Text>
                </Stack>
              </Surface>
            ) : null}
            {selectedMeals.length > 0 ? (
              <Stack gap="sm">
                <Surface elevation="none" style={styles.totalSurface}>
                  <Inline justify="between" align="center">
                    <Text variant="label">{copy.calendar.total}</Text>
                    <Stack align="end" gap="xs">
                      <Text variant="headingMd">
                        {copy.home.caloriesValue(selectedDay?.totals.calories ?? 0)}
                      </Text>
                      {selectedDay?.nutritionIncomplete ? (
                        <Text variant="caption" tone="secondary">
                          {copy.food.approximate}
                        </Text>
                      ) : null}
                    </Stack>
                  </Inline>
                </Surface>
                {selectedMeals.map((meal) => (
                  <Link
                    key={meal.id}
                    href={{ pathname: "/meals/[mealId]", params: { mealId: meal.id } }}
                    asChild
                  >
                    <MealListItem
                      accessibilityLabel={copy.meals.openMeal(meal.name)}
                      meta={copy.meals.mealMeta(copy.meal.categories[meal.category], meal.calories)}
                      title={meal.name}
                    />
                  </Link>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  weekStrip: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  dayButton: {
    minWidth: 52,
    paddingHorizontal: spacing[2],
  },
  totalSurface: {
    padding: spacing[4],
  },
});
