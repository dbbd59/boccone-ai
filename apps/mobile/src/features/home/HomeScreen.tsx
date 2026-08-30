import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import {
  getCurrentUserOptions,
  getDailyMealsOptions,
  getDailyTargetsOptions,
} from "@boccone/api-client";
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
import { formatLocalDate } from "../../lib/meals";
import { useSession } from "../../session-context";

export function HomeScreen() {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const today = formatLocalDate();
  const meQuery = useQuery({ ...getCurrentUserOptions(), enabled: Boolean(session) });
  const mealsQuery = useQuery({
    ...getDailyMealsOptions({ query: { date: today } }),
    enabled: Boolean(session),
  });
  const targetsQuery = useQuery({ ...getDailyTargetsOptions(), enabled: Boolean(session) });
  const user = meQuery.data?.user ?? session?.user;
  const userName = user?.name?.trim();
  const displayName = userName?.length ? userName : copy.home.fallbackName;
  const todayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const calorieTarget = targetsQuery.data?.targets.calories;
  const calories = mealsQuery.data?.totals.calories;
  const calorieProgress =
    calorieTarget && calories !== null && calories !== undefined
      ? Math.min(Math.max(calories / calorieTarget, 0), 1)
      : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              mealsQuery.isRefetching || meQuery.isRefetching || targetsQuery.isRefetching
            }
            onRefresh={() => {
              void Promise.all([mealsQuery.refetch(), meQuery.refetch(), targetsQuery.refetch()]);
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
            <Text variant="title">{copy.home.greeting(displayName)}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.home.subtitle}
            </Text>
          </Stack>

          <Inline align="end" justify="between" gap="md">
            <Stack gap="xs" style={styles.contextCopy}>
              <Text variant="headingLg">{copy.home.todayTitle}</Text>
              <Text variant="bodySm" tone="secondary">
                {todayLabel}
              </Text>
            </Stack>
            <Link href="/meals/new" asChild>
              <Button size="sm">{copy.home.addMeal}</Button>
            </Link>
          </Inline>

          {mealsQuery.isPending ? <LoadingSkeleton label={copy.loading.tagline} /> : null}
          {mealsQuery.isError || meQuery.isError || targetsQuery.isError ? (
            <Stack gap="sm">
              <Alert tone="danger" message={copy.home.loadError} />
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  void Promise.all([
                    mealsQuery.refetch(),
                    meQuery.refetch(),
                    targetsQuery.refetch(),
                  ]);
                }}
              >
                {copy.home.retry}
              </Button>
            </Stack>
          ) : null}

          {mealsQuery.data ? (
            <>
              <Surface style={styles.summary}>
                <Stack gap="md">
                  <Stack gap="xs">
                    <Text variant="caption" tone="secondary">
                      {copy.home.caloriesLabel}
                    </Text>
                    <Text variant="title">
                      {copy.home.caloriesValue(mealsQuery.data.totals.calories)}
                    </Text>
                    <Text variant="bodySm" tone="secondary">
                      {targetsQuery.data?.targets.calories
                        ? copy.home.caloriesTarget(targetsQuery.data.targets.calories)
                        : copy.home.caloriesUnset}
                    </Text>
                    {mealsQuery.data.nutritionIncomplete ? (
                      <Text variant="bodySm" tone="secondary">
                        {copy.food.approximate}
                      </Text>
                    ) : null}
                    {calorieProgress !== null ? (
                      <View
                        accessibilityLabel={copy.home.caloriesTarget(calorieTarget ?? 0)}
                        accessibilityRole="progressbar"
                        style={[
                          styles.progressTrack,
                          { backgroundColor: colors.background.subtle },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: colors.interactive.default,
                              width: `${calorieProgress * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    ) : null}
                  </Stack>
                  <Stack gap="sm">
                    <Text variant="label">{copy.home.macrosTitle}</Text>
                    <Inline justify="between" gap="sm">
                      <MacroValue
                        label={copy.home.proteinLabel}
                        value={mealsQuery.data.totals.proteinGrams}
                        target={targetsQuery.data?.targets.proteinGrams}
                      />
                      <MacroValue
                        label={copy.home.carbohydratesLabel}
                        value={mealsQuery.data.totals.carbohydratesGrams}
                        target={targetsQuery.data?.targets.carbohydratesGrams}
                      />
                      <MacroValue
                        label={copy.home.fatLabel}
                        value={mealsQuery.data.totals.fatGrams}
                        target={targetsQuery.data?.targets.fatGrams}
                      />
                    </Inline>
                  </Stack>
                </Stack>
              </Surface>

              <Stack gap="md">
                <Inline justify="between" align="center">
                  <Text variant="headingMd">{copy.home.mealsTitle}</Text>
                  <Link href="/meals" asChild>
                    <GlassButton size="sm">{copy.home.viewMeals}</GlassButton>
                  </Link>
                </Inline>
                {mealsQuery.data.meals.length === 0 ? (
                  <Surface>
                    <Stack gap="xs">
                      <Text variant="headingSm">{copy.home.emptyTitle}</Text>
                      <Text tone="secondary">{copy.home.emptyBody}</Text>
                    </Stack>
                  </Surface>
                ) : (
                  <Stack gap="sm">
                    {mealsQuery.data.meals.slice(0, 2).map((meal) => (
                      <Link
                        key={meal.id}
                        href={{ pathname: "/meals/[mealId]", params: { mealId: meal.id } }}
                        asChild
                      >
                        <MealListItem
                          accessibilityLabel={copy.home.openMeal(meal.name)}
                          meta={copy.home.mealMeta(
                            copy.home.categoryLabels[meal.category],
                            meal.calories,
                          )}
                          title={meal.name}
                        />
                      </Link>
                    ))}
                    {mealsQuery.data.meals.length > 2 ? (
                      <Text variant="caption" tone="secondary">
                        {copy.home.moreMeals(mealsQuery.data.meals.length - 2)}
                      </Text>
                    ) : null}
                  </Stack>
                )}
              </Stack>
            </>
          ) : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function MacroValue({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number | null | undefined;
}) {
  const { copy } = useI18n();
  return (
    <Stack gap="xs" style={styles.macroValue}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="headingSm">
        {target === null || target === undefined
          ? copy.home.gramsValue(value)
          : copy.home.gramsTarget(value, target)}
      </Text>
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  contextCopy: {
    flex: 1,
  },
  summary: {
    padding: spacing[5],
  },
  macroValue: {
    flex: 1,
  },
  progressTrack: {
    height: spacing[1],
    borderRadius: spacing[1],
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: spacing[1],
  },
});
