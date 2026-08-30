import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

import type { InsightsMetric, InsightsRange } from "@boccone/api-client";
import { borderWidths, minTouchTarget, opacities, radii, spacing } from "@boccone/design-tokens";
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

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { useI18n } from "../../i18n/context";
import { formatLocalDate, formatReadableDate } from "../../lib/dates";
import { formatKcal, formatNumber } from "../../lib/format";
import { fetchPersonalInsights } from "../../lib/insights";
import { useSession } from "../../session-context";
import { InsightTrendChart, MacroComposition, RankedMealTypes } from "./InsightCharts";

const ranges: {
  value: InsightsRange;
  copyKey: "range7d" | "range30d" | "range3m" | "range1y";
}[] = [
  { value: "7d", copyKey: "range7d" },
  { value: "30d", copyKey: "range30d" },
  { value: "3m", copyKey: "range3m" },
  { value: "1y", copyKey: "range1y" },
];

const metrics: InsightsMetric[] = ["protein", "carbs", "fat"];

export function InsightsScreen() {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const router = useRouter();
  const colors = useThemeColors();
  const [range, setRange] = useState<InsightsRange>("7d");
  const today = formatLocalDate();
  const query = useQuery({
    queryKey: ["personal-insights", range, today],
    queryFn: () => fetchPersonalInsights({ range, today }),
    enabled: Boolean(session),
  });
  const rangeCopy = copy.insights;
  const hasData = (query.data?.summary.loggedDays.current ?? 0) > 0;
  const hasPreviousData = (query.data?.summary.loggedDays.previous ?? 0) > 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void query.refetch()}
            refreshing={query.isRefetching}
            tintColor={colors.interactive.default}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="xl">
          <Inline align="center" gap="md">
            <GlassButton
              accessibilityLabel={copy.navigation.back}
              onPress={() => router.back()}
              size="sm"
            >
              ‹
            </GlassButton>
            <Stack gap="xs" style={styles.headerCopy}>
              <Text variant="title">{copy.insights.title}</Text>
              <Text tone="secondary" variant="bodySm">
                {copy.insights.subtitle}
              </Text>
            </Stack>
          </Inline>

          <Inline gap="sm" wrap>
            {ranges.map(({ value, copyKey }) => (
              <Button
                key={value}
                onPress={() => setRange(value)}
                size="sm"
                variant={range === value ? "primary" : "secondary"}
              >
                {rangeCopy[copyKey]}
              </Button>
            ))}
          </Inline>

          {query.isPending ? <LoadingSkeleton label={copy.loading.tagline} /> : null}
          {query.isError ? (
            <Stack gap="sm">
              <Alert message={copy.insights.loadError} tone="danger" />
              <Button onPress={() => void query.refetch()} size="sm" variant="ghost">
                {copy.insights.retry}
              </Button>
            </Stack>
          ) : null}

          {query.data && !hasData ? (
            <EmptyState
              body={hasPreviousData ? copy.insights.noRangeBody : copy.insights.noDataBody}
              title={hasPreviousData ? copy.insights.noRangeTitle : copy.insights.noDataTitle}
            />
          ) : null}

          {query.data && hasData ? (
            <Stack gap="lg">
              <Surface>
                <Stack gap="md">
                  <Inline align="end" justify="between" gap="md">
                    <Stack gap="xs" style={styles.averageBlock}>
                      <Text tone="secondary" variant="caption">
                        {copy.insights.averagePerLoggedDay}
                      </Text>
                      <Text variant="headingXl">
                        {formatKcal(query.data.summary.calories.current, locale)}
                      </Text>
                    </Stack>
                    <Stack align="end" gap="xs">
                      <Text variant="headingSm">
                        {copy.insights.daysLogged(
                          query.data.summary.loggedDays.current ?? 0,
                          query.data.summary.periodDays,
                        )}
                      </Text>
                      <Text tone="secondary" variant="caption">
                        {copy.insights.mealsLogged(query.data.summary.meals.current ?? 0)}
                      </Text>
                    </Stack>
                  </Inline>
                  <Text tone="secondary" variant="bodySm">
                    {formatReadableDate(query.data.period.start, locale)} —{" "}
                    {formatReadableDate(query.data.period.end, locale)}
                  </Text>
                  <Text tone="secondary" variant="caption">
                    {query.data.targetCalories === null
                      ? copy.insights.noTarget
                      : copy.insights.currentTarget(query.data.targetCalories)}
                  </Text>
                  {query.data.summary.calories.deltaPercent !== null ? (
                    <Text tone="secondary" variant="caption">
                      {copy.insights.periodChange(
                        `${query.data.summary.calories.deltaPercent > 0 ? "+" : ""}${formatNumber(query.data.summary.calories.deltaPercent, locale, 1)}%`,
                      )}
                    </Text>
                  ) : null}
                </Stack>
              </Surface>

              <InsightSection title={copy.insights.caloriesTrend}>
                <InsightTrendChart
                  key={range}
                  buckets={query.data.buckets}
                  copy={copy}
                  locale={locale}
                  metric="calories"
                  referenceValue={query.data.targetCalories}
                />
              </InsightSection>

              <InsightSection title={copy.insights.nutritionTitle}>
                <Stack gap="md">
                  <Text tone="secondary" variant="bodySm">
                    {copy.insights.macroComposition}
                  </Text>
                  <MacroComposition
                    averages={{
                      protein: query.data.summary.proteinGrams.current,
                      carbs: query.data.summary.carbohydratesGrams.current,
                      fat: query.data.summary.fatGrams.current,
                    }}
                    copy={copy}
                    locale={locale}
                    onSelect={(metric) =>
                      router.push({ pathname: "/insights/[metric]", params: { metric, range } })
                    }
                  />
                  <Inline gap="sm" wrap>
                    {metrics.map((metric) => (
                      <Pressable
                        accessibilityLabel={copy.insights.openDetail(
                          copy.insights.metricLabels[metric],
                        )}
                        accessibilityRole="button"
                        key={metric}
                        onPress={() =>
                          router.push({ pathname: "/insights/[metric]", params: { metric, range } })
                        }
                        style={[styles.detailLink, { borderColor: colors.border.subtle }]}
                      >
                        <Text tone="brand" variant="label">
                          {copy.insights.metricLabels[metric]}
                        </Text>
                      </Pressable>
                    ))}
                  </Inline>
                </Stack>
              </InsightSection>

              <InsightSection title={copy.insights.mealTypes}>
                <RankedMealTypes copy={copy} items={query.data.mealTypes} locale={locale} />
              </InsightSection>

              <InsightSection title={copy.insights.topFoods}>
                <Stack gap="sm">
                  <Text tone="secondary" variant="bodySm">
                    {copy.insights.foodBackedNote}
                  </Text>
                  {query.data.topFoods.length === 0 ? (
                    <Text tone="secondary">{copy.insights.noContributors}</Text>
                  ) : (
                    query.data.topFoods.slice(0, 5).map((food) => (
                      <Pressable
                        accessibilityLabel={copy.insights.openFood(food.name)}
                        accessibilityRole="button"
                        key={food.foodId}
                        onPress={() =>
                          router.push({
                            pathname: "/diary",
                            params: { foodId: food.foodId, foodName: food.name },
                          })
                        }
                        style={({ pressed }) => [styles.foodRow, pressed && styles.pressed]}
                      >
                        <Inline align="center" gap="md">
                          <View
                            style={[styles.foodRank, { backgroundColor: colors.background.subtle }]}
                          >
                            <Text tone="brand" variant="label">
                              {food.entries}
                            </Text>
                          </View>
                          <Stack gap="xs" style={styles.foodCopy}>
                            <Text numberOfLines={1} variant="headingSm">
                              {food.name}
                            </Text>
                            <Text tone="secondary" variant="caption">
                              {copy.insights.foodEntries(food.entries)}
                              {food.calories === null
                                ? ""
                                : ` · ${formatKcal(food.calories, locale)}`}
                            </Text>
                          </Stack>
                        </Inline>
                      </Pressable>
                    ))
                  )}
                </Stack>
              </InsightSection>

              {query.data.highlights.length > 0 ? (
                <InsightSection title={copy.insights.highlightTitle}>
                  <Stack gap="sm">
                    {query.data.highlights.map((highlight) => (
                      <Text key={highlight.kind} variant="bodySm">
                        {highlight.kind === "most_logged_food"
                          ? copy.insights.mostLoggedFood(highlight.value, highlight.amount ?? 0)
                          : highlight.kind === "most_logged_category"
                            ? copy.insights.mostLoggedCategory(
                                copy.insights.categoryLabels[
                                  highlight.value as keyof typeof copy.insights.categoryLabels
                                ],
                                highlight.amount ?? 0,
                              )
                            : copy.insights.calorieVariation(highlight.amount ?? 0)}
                      </Text>
                    ))}
                  </Stack>
                </InsightSection>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function InsightSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface>
      <Stack gap="md">
        <Text variant="headingMd">{title}</Text>
        {children}
      </Stack>
    </Surface>
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
  averageBlock: {
    flex: 1,
  },
  detailLink: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: borderWidths.hairline,
    borderRadius: radii.pill,
  },
  foodRank: {
    alignItems: "center",
    justifyContent: "center",
    width: spacing[10],
    height: spacing[10],
    borderRadius: radii.pill,
  },
  foodCopy: {
    flex: 1,
    minWidth: 0,
  },
  foodRow: {
    minHeight: minTouchTarget,
    justifyContent: "center",
  },
  pressed: {
    opacity: opacities.pressed,
  },
});
