import { Link, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import {
  getCurrentUserOptions,
  getDailyMealsOptions,
  getDailyTargetsOptions,
} from "@boccone/api-client";
import { borderWidths, minTouchTarget, opacities, radii, spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassButton,
  Inline,
  Screen,
  Stack,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { EmptyState } from "../../components/EmptyState";
import { MealListItem } from "../../components/MealListItem";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MascotAvatar } from "../../components/MascotAvatar";
import { NutritionSummary } from "../../components/NutritionSummary";
import { useI18n } from "../../i18n/context";
import { formatReadableDate } from "../../lib/dates";
import { formatKcal } from "../../lib/format";
import { fetchPersonalInsights } from "../../lib/insights";
import { formatLocalDate } from "../../lib/meals";
import { useSession } from "../../session-context";

export function HomeScreen() {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const router = useRouter();
  const colors = useThemeColors();
  const today = formatLocalDate();
  const meQuery = useQuery({ ...getCurrentUserOptions(), enabled: Boolean(session) });
  const mealsQuery = useQuery({
    ...getDailyMealsOptions({ query: { date: today } }),
    enabled: Boolean(session),
  });
  const targetsQuery = useQuery({ ...getDailyTargetsOptions(), enabled: Boolean(session) });
  const insightsQuery = useQuery({
    queryKey: ["personal-insights", "7d", today],
    queryFn: () => fetchPersonalInsights({ range: "7d", today }),
    enabled: Boolean(session),
  });
  const user = meQuery.data?.user ?? session?.user;
  const userName = user?.name?.trim();
  const displayName = userName?.length ? userName : copy.home.fallbackName;
  const todayLabel = formatReadableDate(today, locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const calorieTarget = targetsQuery.data?.targets.calories;
  const miniChartMax = Math.max(
    ...(insightsQuery.data?.buckets ?? []).map((bucket) => bucket.calories ?? 0),
    1,
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={
              mealsQuery.isRefetching ||
              meQuery.isRefetching ||
              targetsQuery.isRefetching ||
              insightsQuery.isRefetching
            }
            onRefresh={() => {
              void Promise.all([
                mealsQuery.refetch(),
                meQuery.refetch(),
                targetsQuery.refetch(),
                insightsQuery.refetch(),
              ]);
            }}
            tintColor={colors.interactive.default}
          />
        }
      >
        <Stack gap="xl">
          <Inline align="center" justify="between" gap="md">
            <Stack gap="sm" style={styles.greetingCopy}>
              <Text variant="title">{copy.home.greeting(displayName)}</Text>
              <Text variant="bodySm" tone="secondary">
                {todayLabel}
              </Text>
            </Stack>
            <MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={56} />
          </Inline>

          <Inline align="center" justify="between" gap="md">
            <Text variant="headingLg">{copy.home.todayTitle}</Text>
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
                    insightsQuery.refetch(),
                  ]);
                }}
              >
                {copy.home.retry}
              </Button>
            </Stack>
          ) : null}

          {mealsQuery.data ? (
            <>
              <NutritionSummary
                calories={mealsQuery.data.totals.calories}
                carbohydrates={mealsQuery.data.totals.carbohydratesGrams}
                fat={mealsQuery.data.totals.fatGrams}
                incomplete={mealsQuery.data.nutritionIncomplete}
                protein={mealsQuery.data.totals.proteinGrams}
                target={calorieTarget}
              />

              {insightsQuery.data && (insightsQuery.data.summary.loggedDays.current ?? 0) > 0 ? (
                <Pressable
                  accessibilityLabel={copy.home.insightsOpen}
                  accessibilityRole="button"
                  onPress={() => router.push("/insights")}
                  style={({ pressed }) => [
                    styles.insightsSignal,
                    {
                      backgroundColor: colors.background.elevated,
                      borderColor: colors.border.subtle,
                    },
                    pressed && styles.insightsSignalPressed,
                  ]}
                >
                  <View style={styles.insightsSignalCopy}>
                    <Text variant="headingSm">{copy.home.insightsTitle}</Text>
                    <Text tone="secondary" variant="bodySm">
                      {copy.home.insightsBody(
                        formatKcal(insightsQuery.data.summary.calories.current, locale),
                        insightsQuery.data.summary.loggedDays.current ?? 0,
                      )}
                    </Text>
                  </View>
                  <View accessibilityElementsHidden style={styles.miniChart}>
                    {insightsQuery.data.buckets.map((bucket) => (
                      <View
                        key={bucket.key}
                        style={[
                          styles.miniBar,
                          {
                            backgroundColor: bucket.logged
                              ? colors.interactive.default
                              : colors.background.subtle,
                            height: bucket.logged
                              ? Math.max(
                                  spacing[1],
                                  ((bucket.calories ?? 0) / miniChartMax) * spacing[10],
                                )
                              : spacing[1],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              ) : null}

              <Stack gap="md">
                <Inline justify="between" align="center">
                  <Text variant="headingMd">{copy.home.mealsTitle}</Text>
                  <Link href="/diary" asChild>
                    <GlassButton size="sm">{copy.home.viewMeals}</GlassButton>
                  </Link>
                </Inline>
                {mealsQuery.data.meals.length === 0 ? (
                  <EmptyState
                    actionLabel={copy.home.addMeal}
                    body={copy.home.emptyBody}
                    illustration={
                      <MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />
                    }
                    onAction={() => router.push("/meals/new")}
                    title={copy.home.emptyTitle}
                  />
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
                          kind={meal.category}
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

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  greetingCopy: {
    flex: 1,
  },
  insightsSignal: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
  },
  insightsSignalPressed: {
    opacity: opacities.pressed,
  },
  insightsSignalCopy: {
    flex: 1,
    gap: spacing[1],
  },
  miniChart: {
    height: spacing[10],
    maxWidth: spacing[20],
    minWidth: spacing[12],
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[1],
  },
  miniBar: {
    minWidth: spacing[1],
    flex: 1,
    borderRadius: radii.sm,
  },
});
