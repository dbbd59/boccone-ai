import { useEffect, useState } from "react";

import type { AdminOverviewResponse } from "@boccone/api-client";
import { Text } from "@boccone/ui-web";

import {
  AnalyticsDateRange,
  AnalyticsError,
  AnalyticsLoading,
  AnalyticsMetricRail,
  AnalyticsNoData,
  AnalyticsSection,
  AnalyticsTrendChart,
} from "./AnalyticsPrimitives";
import { overviewChartBuckets, useAdminAnalyticsRange } from "./analytics-state";
import { fetchAdminAnalyticsOverview } from "../../lib/admin-api";

export function AnalyticsOverviewPage() {
  const filter = useAdminAnalyticsRange();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(null);
  const requestKey = `${filter.query.range}:${filter.query.from ?? ""}:${filter.query.to ?? ""}`;

  useEffect(() => {
    let mounted = true;
    void fetchAdminAnalyticsOverview(filter.query)
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
          setError(reason instanceof Error ? reason.message : "Unable to load analytics overview");
          setErrorRequestKey(requestKey);
        }
      });
    return () => {
      mounted = false;
    };
  }, [filter.query, requestKey]);

  const metrics = data
    ? [
        { label: "Total users", value: formatNumber(data.totalUsers) },
        metricRail(
          "New users",
          data.kpis.newUsers,
          data.activity.map((bucket) => bucket.newUsers),
        ),
        metricRail("Active users", data.kpis.activeUsers),
        metricRail(
          "Meals",
          data.kpis.meals,
          data.activity.map((bucket) => bucket.meals),
        ),
        metricRail(
          "Food entries",
          data.kpis.foodEntries,
          data.activity.map((bucket) => bucket.foodEntries),
        ),
        metricRail("Submissions", data.kpis.foodSubmissions),
        metricRail(
          "AI requests",
          data.kpis.aiRequests,
          data.activity.map((bucket) => bucket.aiRequests),
        ),
      ]
    : [];

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Product activity
        </Text>
        <Text tone="secondary">
          A real-data view of adoption and operational volume. Select a period to compare it with
          the previous equal period.
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
          <AnalyticsMetricRail metrics={metrics} />
          <AnalyticsSection
            description="New registrations, meals, catalog-backed entries, and AI requests by period."
            title="Activity over time"
          >
            {data.activity.some(
              (bucket) =>
                bucket.newUsers + bucket.meals + bucket.foodEntries + bucket.aiRequests > 0,
            ) ? (
              <AnalyticsTrendChart
                buckets={overviewChartBuckets(data.activity)}
                series={[
                  { key: "newUsers", label: "New users", tone: "brand" },
                  { key: "meals", label: "Meals", tone: "protein" },
                  { key: "foodEntries", label: "Food entries", tone: "carbs" },
                  { key: "aiRequests", label: "AI requests", tone: "warning" },
                ]}
              />
            ) : (
              <AnalyticsNoData />
            )}
          </AnalyticsSection>
          <AnalyticsSection title="How to read this surface">
            <div className="analytics-definition-grid">
              <div>
                <Text variant="bodySm">
                  <strong>Active user</strong>
                </Text>
                <Text variant="bodySm" tone="secondary">
                  A user with at least one meal in the selected period.
                </Text>
              </div>
              <div>
                <Text variant="bodySm">
                  <strong>Period comparison</strong>
                </Text>
                <Text variant="bodySm" tone="secondary">
                  Current values are compared with the preceding period of equal length.
                </Text>
              </div>
              <div>
                <Text variant="bodySm">
                  <strong>Timezone</strong>
                </Text>
                <Text variant="bodySm" tone="secondary">
                  Admin reporting uses UTC for consistent cross-team operations.
                </Text>
              </div>
            </div>
          </AnalyticsSection>
        </>
      ) : null}
    </div>
  );
}

function metricRail(
  label: string,
  metric: { current: number; delta: number; deltaPercent: number | null },
  sparkline?: number[],
) {
  const detail =
    metric.deltaPercent === null
      ? `Δ ${formatNumber(metric.delta)}`
      : `${formatSigned(metric.deltaPercent)}% vs previous`;
  return {
    label,
    value: formatNumber(metric.current),
    detail,
    sparkline,
    tone: metric.delta >= 0 ? ("positive" as const) : ("negative" as const),
  };
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
}
