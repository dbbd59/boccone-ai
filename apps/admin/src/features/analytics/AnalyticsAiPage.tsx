import { useEffect, useState } from "react";

import type { AdminAiAnalyticsResponse } from "@boccone/api-client";
import { Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
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
import { fetchAdminAnalyticsAi } from "../../lib/admin-api";

export function AnalyticsAiPage() {
  const filter = useAdminAnalyticsRange();
  const [data, setData] = useState<AdminAiAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(null);
  const requestKey = `${filter.query.range}:${filter.query.from ?? ""}:${filter.query.to ?? ""}`;

  useEffect(() => {
    let mounted = true;
    void fetchAdminAnalyticsAi(filter.query)
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
          setError(reason instanceof Error ? reason.message : "Unable to load AI analytics");
          setErrorRequestKey(requestKey);
        }
      });
    return () => {
      mounted = false;
    };
  }, [filter.query, requestKey]);

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro-row">
        <div className="admin-route-intro">
          <Text as="h2" variant="headingLg">
            AI analytics
          </Text>
          <Text tone="secondary">
            Privacy-safe provider and model usage trends. Prompt and response content never enters
            this surface.
          </Text>
        </div>
        <AdminLink className="admin-inline-link" to="/ai-usage">
          Open usage records
        </AdminLink>
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
              metric("Requests", data.summary.requests),
              metric("Succeeded", data.summary.succeeded),
              metric("Failed", data.summary.failed, true),
              {
                label: "Avg latency",
                value:
                  data.summary.averageLatencyMs === null
                    ? "—"
                    : `${Math.round(data.summary.averageLatencyMs)} ms`,
                detail: "Completed requests",
              },
              {
                label: "Total tokens",
                value: formatNumber(data.summary.totalTokens),
                detail: "Provider usage metadata",
              },
            ]}
          />
          <AnalyticsSection
            description="Request volume and outcomes by UTC reporting period."
            title="AI activity over time"
          >
            {data.summary.requests.current > 0 ? (
              <AnalyticsTrendChart
                buckets={data.activity}
                series={[
                  { key: "requests", label: "Requests", tone: "brand" },
                  { key: "succeeded", label: "Succeeded", tone: "protein" },
                  { key: "failed", label: "Failed", tone: "danger" },
                ]}
              />
            ) : (
              <AnalyticsNoData message="AI activity will appear after the first request is recorded." />
            )}
          </AnalyticsSection>
          <div className="analytics-three-column">
            <AnalyticsSection title="By provider">
              <AnalyticsRankedBars
                items={data.byProvider.map((item) => ({ label: item.key, value: item.requests }))}
              />
            </AnalyticsSection>
            <AnalyticsSection title="By model">
              <AnalyticsRankedBars
                items={data.byModel.map((item) => ({ label: item.key, value: item.requests }))}
              />
            </AnalyticsSection>
            <AnalyticsSection title="By feature">
              <AnalyticsRankedBars
                items={data.byFeature.map((item) => ({ label: item.key, value: item.requests }))}
              />
            </AnalyticsSection>
          </div>
        </>
      ) : null}
    </div>
  );
}

function metric(
  label: string,
  value: { current: number; delta: number; deltaPercent: number | null },
  negative = false,
) {
  return {
    label,
    value: formatNumber(value.current),
    detail: `${value.delta >= 0 ? "+" : ""}${formatNumber(value.delta)} vs previous`,
    tone: (negative ? value.delta <= 0 : value.delta >= 0)
      ? ("positive" as const)
      : ("negative" as const),
  };
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString("en-US");
}
