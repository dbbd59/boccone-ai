import { useEffect, useState } from "react";

import type { AdminNutritionResponse } from "@boccone/api-client";
import { Text } from "@boccone/ui-web";

import {
  AnalyticsDateRange,
  AnalyticsError,
  AnalyticsLoading,
  AnalyticsMetricRail,
  AnalyticsNoData,
  AnalyticsRankedBars,
  AnalyticsSection,
  AnalyticsTrendChart,
} from "./AnalyticsPrimitives";
import { useAdminAnalyticsRange } from "./analytics-state";
import { fetchAdminAnalyticsNutrition } from "../../lib/admin-api";

export function AnalyticsNutritionPage() {
  const filter = useAdminAnalyticsRange();
  const [data, setData] = useState<AdminNutritionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(null);
  const requestKey = `${filter.query.range}:${filter.query.from ?? ""}:${filter.query.to ?? ""}`;

  useEffect(() => {
    let mounted = true;
    void fetchAdminAnalyticsNutrition(filter.query)
      .then((result) => {
        if (mounted) {
          setData(result);
          setLoadedRequestKey(requestKey);
          setError(null);
          setErrorRequestKey(null);
        }
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setError(reason instanceof Error ? reason.message : "Unable to load nutrition analytics");
          setErrorRequestKey(requestKey);
        }
      });
    return () => {
      mounted = false;
    };
  }, [filter.query, requestKey]);

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Nutrition analytics
        </Text>
        <Text tone="secondary">
          Global meal totals and patterns from the current product data. Manual meals remain
          included in totals.
        </Text>
      </div>
      <AnalyticsDateRange {...filter} />
      {loadedRequestKey !== requestKey && errorRequestKey !== requestKey ? (
        <AnalyticsLoading />
      ) : null}
      {errorRequestKey === requestKey && error ? (
        <AnalyticsError message={error} onRetry={() => window.location.reload()} />
      ) : null}
      {loadedRequestKey === requestKey && data && !error ? (
        <>
          <AnalyticsMetricRail
            metrics={[
              metricRail("Meals", data.totals.meals, ""),
              metricRail("Calories", data.totals.calories, " kcal"),
              metricRail("Protein", data.totals.proteinGrams, " g"),
              metricRail("Carbohydrates", data.totals.carbohydratesGrams, " g"),
              metricRail("Fat", data.totals.fatGrams, " g"),
              {
                label: "Incomplete meals",
                value: formatNumber(data.totals.incompleteMeals),
                detail: "Needs nutrition review",
              },
            ]}
          />
          <AnalyticsSection
            description="Aggregated meal nutrition by UTC reporting period."
            title="Nutrition over time"
          >
            {data.totals.meals.current > 0 ? (
              <AnalyticsTrendChart
                buckets={data.activity}
                series={[
                  { key: "calories", label: "Calories", tone: "brand" },
                  { key: "proteinGrams", label: "Protein", tone: "protein" },
                  { key: "carbohydratesGrams", label: "Carbohydrates", tone: "carbs" },
                  { key: "fatGrams", label: "Fat", tone: "fat" },
                ]}
              />
            ) : (
              <AnalyticsNoData message="Meal totals will appear after the first meal is logged." />
            )}
          </AnalyticsSection>
          <div className="analytics-two-column">
            <AnalyticsSection
              description="Share of logged calories by meal type; descriptive, not a recommendation."
              title="Calories by meal type"
            >
              <AnalyticsRankedBars
                items={data.mealTypes.map((item) => ({
                  label: capitalize(item.category),
                  value: item.calorieShare,
                  detail: `${item.meals} meals`,
                }))}
                valueLabel={(value) => `${Math.round(value * 100)}%`}
              />
            </AnalyticsSection>
            <AnalyticsSection
              description="Food-backed snapshots only. Manual meal totals are in the chart above."
              title="Top catalog foods"
            >
              <AnalyticsRankedBars
                items={data.topFoods.map((item) => ({
                  label: item.name,
                  value: item.entries,
                  detail: formatNumber(item.calories, " kcal"),
                }))}
                valueLabel={(value) => `${value} entries`}
              />
            </AnalyticsSection>
          </div>
        </>
      ) : null}
    </div>
  );
}

function metricRail(
  label: string,
  metric: { current: number; delta: number; deltaPercent: number | null },
  unit: string,
) {
  return {
    label,
    value: `${formatNumber(metric.current)}${unit}`,
    detail: `${metric.delta >= 0 ? "+" : ""}${formatNumber(metric.delta)}${unit} vs previous`,
    tone: metric.delta >= 0 ? ("positive" as const) : ("negative" as const),
  };
}

function formatNumber(value: number | null, suffix = ""): string {
  return `${value === null ? "—" : Math.round(value).toLocaleString("en-US")}${suffix}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
