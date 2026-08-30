import { Link, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";

import { getDailyMealsOptions } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import { Alert, Button, Inline, Screen, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

import { EmptyState } from "../../components/EmptyState";
import { MealListItem } from "../../components/MealListItem";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MascotAvatar } from "../../components/MascotAvatar";
import { NutritionSummary } from "../../components/NutritionSummary";
import { useI18n } from "../../i18n/context";
import { formatReadableDate } from "../../lib/dates";
import { formatLocalDate } from "../../lib/meals";

const CATEGORIES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function MealsScreen() {
  const { copy, locale } = useI18n();
  const router = useRouter();
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
          <Inline align="center" justify="between" gap="md">
            <Stack gap="xs" style={styles.headerCopy}>
              <Text variant="title">{copy.meals.title}</Text>
              <Text variant="bodySm" tone="secondary">
                {formatReadableDate(date, locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </Stack>
            <Inline gap="xs">
              <Link href="/meals/saved" asChild>
                <Button size="sm" variant="secondary">
                  {copy.saved.tabSaved}
                </Button>
              </Link>
              <Inline gap="xs">
                <Link href="/meals/saved" asChild>
                  <Button size="sm" variant="secondary">
                    {copy.saved.tabSaved}
                  </Button>
                </Link>
                <Link href="/meals/new" asChild>
                  <Button size="sm">{copy.meals.add}</Button>
                </Link>
              </Inline>
            </Inline>
          </Inline>

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
            <EmptyState
              actionLabel={copy.meals.addFirst}
              body={copy.meals.emptyBody}
              illustration={<MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />}
              onAction={() => router.push("/meals/new")}
              title={copy.meals.emptyTitle}
            />
          ) : null}

          {mealsQuery.data && meals.length > 0 ? (
            <Stack gap="xl">
              <NutritionSummary
                calories={mealsQuery.data.totals.calories}
                carbohydrates={mealsQuery.data.totals.carbohydratesGrams}
                compact
                fat={mealsQuery.data.totals.fatGrams}
                incomplete={mealsQuery.data.nutritionIncomplete}
                protein={mealsQuery.data.totals.proteinGrams}
              />
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
                          kind={meal.category}
                          title={meal.name}
                        />
                      </Link>
                    ))}
                  </Stack>
                );
              })}
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
});
