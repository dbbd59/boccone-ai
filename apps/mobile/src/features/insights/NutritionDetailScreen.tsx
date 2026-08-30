import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet } from "react-native";

import type { InsightsMetric, InsightsRange } from "@boccone/api-client";
import { minTouchTarget, opacities, spacing } from "@boccone/design-tokens";
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
import { formatGrams, formatKcal, formatNumber } from "../../lib/format";
import { fetchPersonalNutritionDetail } from "../../lib/insights";
import { useSession } from "../../session-context";
import { InsightTrendChart } from "./InsightCharts";

const ranges: {
  value: InsightsRange;
  label: "range7d" | "range30d" | "range3m" | "range1y";
}[] = [
  { value: "7d", label: "range7d" },
  { value: "30d", label: "range30d" },
  { value: "3m", label: "range3m" },
  { value: "1y", label: "range1y" },
];

const supportedMetrics: InsightsMetric[] = ["calories", "protein", "carbs", "fat"];

export function NutritionDetailScreen() {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ metric?: string; range?: string }>();
  const metric: InsightsMetric = supportedMetrics.includes(params.metric as InsightsMetric)
    ? (params.metric as InsightsMetric)
    : "protein";
  const [range, setRange] = useState<InsightsRange>(
    ranges.some((item) => item.value === params.range) ? (params.range as InsightsRange) : "7d",
  );
  const today = formatLocalDate();
  const query = useQuery({
    queryKey: ["personal-nutrition-detail", metric, range, today],
    queryFn: () => fetchPersonalNutritionDetail({ metric, range, today }),
    enabled: Boolean(session),
  });
  const hasData =
    (query.data?.buckets.some((bucket) => bucket.logged) ?? false) && query.data?.average !== null;
  const hasPreviousData =
    query.data?.previousAverage !== null && query.data?.previousAverage !== undefined;
  const unitValue = (value: number | null | undefined) =>
    metric === "calories" ? formatKcal(value, locale) : formatGrams(value, locale);

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
              <Text variant="title">
                {copy.insights.detailTitle(copy.insights.metricLabels[metric])}
              </Text>
              <Text tone="secondary" variant="bodySm">
                {copy.insights.subtitle}
              </Text>
            </Stack>
          </Inline>

          <Inline gap="sm" wrap>
            {ranges.map((item) => (
              <Button
                key={item.value}
                onPress={() => setRange(item.value)}
                size="sm"
                variant={range === item.value ? "primary" : "secondary"}
              >
                {copy.insights[item.label]}
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
                  <Text tone="secondary" variant="caption">
                    {copy.insights.detailAverage}
                  </Text>
                  <Text variant="headingXl">{unitValue(query.data.average)}</Text>
                  <Inline gap="md" wrap>
                    <SummaryValue
                      label={copy.insights.detailTotal}
                      value={unitValue(query.data.total)}
                    />
                    <SummaryValue
                      label={copy.insights.detailCompared(
                        query.data.deltaPercent === null
                          ? "—"
                          : `${formatNumber(query.data.deltaPercent, locale, 0)}%`,
                      )}
                      value={
                        query.data.previousAverage === null
                          ? "—"
                          : unitValue(query.data.previousAverage)
                      }
                    />
                  </Inline>
                  <Text tone="secondary" variant="bodySm">
                    {formatReadableDate(query.data.period.start, locale)} —{" "}
                    {formatReadableDate(query.data.period.end, locale)}
                  </Text>
                </Stack>
              </Surface>

              <Surface>
                <Stack gap="md">
                  <Text variant="headingMd">{copy.insights.metricLabels[metric]}</Text>
                  <InsightTrendChart
                    key={`${metric}-${range}`}
                    buckets={query.data.buckets.map((bucket) => ({
                      key: bucket.key,
                      start: bucket.start,
                      calories: metric === "calories" ? bucket.value : null,
                      proteinGrams: metric === "protein" ? bucket.value : null,
                      carbohydratesGrams: metric === "carbs" ? bucket.value : null,
                      fatGrams: metric === "fat" ? bucket.value : null,
                      meals: bucket.loggedDays,
                      loggedDays: bucket.loggedDays,
                      logged: bucket.logged,
                    }))}
                    copy={copy}
                    locale={locale}
                    metric={metric}
                  />
                </Stack>
              </Surface>

              <Surface>
                <Stack gap="md">
                  <Text variant="headingMd">{copy.insights.contributors}</Text>
                  {query.data.topFoods.length === 0 ? (
                    <Text tone="secondary">{copy.insights.noContributors}</Text>
                  ) : (
                    query.data.topFoods.slice(0, 8).map((food) => (
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
                        style={({ pressed }) => [styles.contributorRow, pressed && styles.pressed]}
                      >
                        <Inline align="center" gap="md">
                          <Text style={styles.contributorRank} tone="brand" variant="label">
                            {food.entries}
                          </Text>
                          <Stack gap="xs" style={styles.contributorCopy}>
                            <Text variant="headingSm">{food.name}</Text>
                            <Text tone="secondary" variant="caption">
                              {copy.insights.foodEntries(food.entries)} ·{" "}
                              {unitValue(foodMetricValue(food, metric))}
                            </Text>
                          </Stack>
                        </Inline>
                      </Pressable>
                    ))
                  )}
                </Stack>
              </Surface>
            </Stack>
          ) : null}
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs" style={styles.summaryValue}>
      <Text tone="secondary" variant="caption">
        {label}
      </Text>
      <Text variant="headingSm">{value}</Text>
    </Stack>
  );
}

function foodMetricValue(
  food: {
    calories: number | null;
    proteinGrams: number | null;
    carbohydratesGrams: number | null;
    fatGrams: number | null;
  },
  metric: InsightsMetric,
): number | null {
  switch (metric) {
    case "calories":
      return food.calories;
    case "protein":
      return food.proteinGrams;
    case "carbs":
      return food.carbohydratesGrams;
    case "fat":
      return food.fatGrams;
  }
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  headerCopy: {
    flex: 1,
  },
  summaryValue: {
    minWidth: spacing[20],
    flex: 1,
  },
  contributorRank: {
    minWidth: spacing[6],
  },
  contributorCopy: {
    flex: 1,
  },
  contributorRow: {
    minHeight: minTouchTarget,
    justifyContent: "center",
  },
  pressed: {
    opacity: opacities.pressed,
  },
});
