import { useEffect, useState } from "react";

import type { AdminCatalogResponse } from "@boccone/api-client";
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
import { fetchAdminAnalyticsFoods } from "../../lib/admin-api";

export function AnalyticsCatalogPage() {
  const filter = useAdminAnalyticsRange();
  const [data, setData] = useState<AdminCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const [errorRequestKey, setErrorRequestKey] = useState<string | null>(null);
  const requestKey = `${filter.query.range}:${filter.query.from ?? ""}:${filter.query.to ?? ""}`;

  useEffect(() => {
    let mounted = true;
    void fetchAdminAnalyticsFoods(filter.query)
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
          setError(reason instanceof Error ? reason.message : "Unable to load catalog analytics");
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
            Catalog analytics
          </Text>
          <Text tone="secondary">
            Catalog coverage, moderation throughput, and food usage. Review individual records in
            the operational catalog.
          </Text>
        </div>
        <div className="admin-action-row">
          <AdminLink className="admin-inline-link" to="/foods">
            Open catalog
          </AdminLink>
          <AdminLink className="admin-inline-link" to="/food-submissions">
            Open review queue
          </AdminLink>
        </div>
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
              {
                label: "Total foods",
                value: formatNumber(data.catalog.total),
                detail: `${formatNumber(data.catalog.approved)} approved`,
              },
              {
                label: "Pending",
                value: formatNumber(data.catalog.pending),
                detail: "Current queue",
                tone: data.catalog.pending > 0 ? "negative" : "positive",
              },
              {
                label: "Submissions",
                value: formatNumber(data.moderation.submissions),
                detail: `${formatNumber(data.moderation.pending)} pending`,
              },
              {
                label: "Approval rate",
                value:
                  data.moderation.approvalRate === null
                    ? "—"
                    : `${Math.round(data.moderation.approvalRate * 100)}%`,
                detail: "Selected period",
              },
              {
                label: "Avg review time",
                value:
                  data.moderation.averageReviewHours === null
                    ? "—"
                    : `${formatNumber(data.moderation.averageReviewHours)} h`,
                detail: "Approved, rejected, merged",
              },
            ]}
          />
          <AnalyticsSection
            description="Created foods and moderation outcomes by period."
            title="Catalog flow over time"
          >
            {data.moderation.submissions > 0 ||
            data.growth.some((bucket) => bucket.foodsCreated > 0) ? (
              <AnalyticsTrendChart
                buckets={data.growth}
                series={[
                  { key: "foodsCreated", label: "Created", tone: "brand" },
                  { key: "submissions", label: "Submissions", tone: "warning" },
                  { key: "approved", label: "Approved", tone: "protein" },
                  { key: "rejected", label: "Rejected", tone: "danger" },
                ]}
              />
            ) : (
              <AnalyticsNoData message="Catalog flow will appear when foods or submissions are recorded." />
            )}
          </AnalyticsSection>
          <AnalyticsSection
            description="Most frequently used catalog-backed foods in the selected period."
            title="Popular foods"
          >
            <AnalyticsRankedBars
              items={data.popularFoods.map((food) => ({
                label: food.name,
                value: food.entries,
                detail: `${formatNumber(food.calories)} kcal snapshot`,
              }))}
              valueLabel={(value) => `${value} entries`}
            />
          </AnalyticsSection>
        </>
      ) : null}
    </div>
  );
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString("en-US");
}
