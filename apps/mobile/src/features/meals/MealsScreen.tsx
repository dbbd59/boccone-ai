import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";

import { getDailyMealsOptions } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
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
import { formatReadableDate } from "../../lib/dates";
import { formatLocalDate } from "../../lib/meals";

const CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function MealsScreen() {
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const date = formatLocalDate();
  const mealsQuery = useQuery({ ...getDailyMealsOptions({ query: { date } }) });
  const meals = mealsQuery.data?.meals ?? [];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={mealsQuery.isRefetching}
            onRefresh={() => void mealsQuery.refetch()}
            tintColor={colors.interactive.default}
          />
        }
      >
        <Stack gap="xl">
          <Inline align="end" justify="between" gap="md">
            <Stack gap="sm" style={styles.headerCopy}>
              <Text variant="caption" tone="default">
                {copy.appName}
              </Text>
              <Text variant="title">{copy.meals.title}</Text>
              <Text variant="bodyLg" tone="secondary">
                {copy.meals.subtitle}
              </Text>
            </Stack>
            <Link href="/meals/new" asChild>
              <Button size="sm">{copy.meals.add}</Button>
            </Link>
          </Inline>

          <Stack gap="xs">
            <Text variant="headingLg">{copy.meals.today}</Text>
            <Text variant="bodySm" tone="secondary">
              {formatReadableDate(date, locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </Stack>

          {mealsQuery.isPending ? <LoadingSkeleton label={copy.meals.loading} /> : null}
          {mealsQuery.isError ? (
            <Stack gap="sm">
              <Alert tone="danger" message={copy.meals.loadError} />
              <Button variant="ghost" size="sm" onPress={() => void mealsQuery.refetch()}>
                {copy.meals.retry}
              </Button>
            </Stack>
          ) : null}

          {mealsQuery.data && meals.length === 0 ? (
            <Surface>
              <Stack gap="md">
                <Stack gap="xs">
                  <Text variant="headingMd">{copy.meals.emptyTitle}</Text>
                  <Text tone="secondary">{copy.meals.emptyBody}</Text>
                </Stack>
                <Link href="/meals/new" asChild>
                  <Button>{copy.meals.addFirst}</Button>
                </Link>
              </Stack>
            </Surface>
          ) : null}

          {mealsQuery.data && meals.length > 0 ? (
            <Stack gap="xl">
              {CATEGORIES.map((category) => {
                const categoryMeals = meals.filter((meal) => meal.category === category);
                if (categoryMeals.length === 0) return null;
                return (
                  <Stack key={category} gap="sm">
                    <Text variant="label" tone="secondary">
                      {copy.meal.categories[category]}
                    </Text>
                    {categoryMeals.map((meal) => (
                      <Link
                        key={meal.id}
                        href={{ pathname: "/meals/[mealId]", params: { mealId: meal.id } }}
                        asChild
                      >
                        <MealListItem
                          accessibilityLabel={copy.meals.openMeal(meal.name)}
                          meta={copy.meals.mealMeta(
                            copy.meal.categories[meal.category],
                            meal.calories,
                          )}
                          title={meal.name}
                        />
                      </Link>
                    ))}
                  </Stack>
                );
              })}
              <Surface elevation="none" style={styles.totalSurface}>
                <Inline justify="between" align="center">
                  <Text variant="label">{copy.meals.total}</Text>
                  <Stack gap="xs" style={styles.totalCopy}>
                    <Text variant="headingMd">
                      {copy.home.caloriesValue(mealsQuery.data.totals.calories)}
                    </Text>
                    {mealsQuery.data.nutritionIncomplete ? (
                      <Text variant="caption" tone="secondary">
                        {copy.food.approximate}
                      </Text>
                    ) : null}
                  </Stack>
                </Inline>
              </Surface>
            </Stack>
          ) : null}
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
  headerCopy: {
    flex: 1,
  },
  totalSurface: {
    padding: spacing[4],
  },
  totalCopy: {
    alignItems: "flex-end",
  },
});
