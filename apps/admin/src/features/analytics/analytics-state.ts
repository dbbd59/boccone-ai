import { useMemo, useState } from "react";

import type { AdminAnalyticsRange, AdminOverviewBucket } from "@boccone/api-client";

import type { AdminAnalyticsQuery } from "../../lib/admin-api";

export const adminRangeOptions: { value: AdminAnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "custom", label: "Custom" },
];

export function useAdminAnalyticsRange(): {
  query: AdminAnalyticsQuery;
  range: AdminAnalyticsRange;
  from: string;
  to: string;
  setRange: (range: AdminAnalyticsRange) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
} {
  const defaults = useMemo(() => {
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(`${to}T12:00:00.000Z`);
    fromDate.setUTCDate(fromDate.getUTCDate() - 29);
    return { from: fromDate.toISOString().slice(0, 10), to };
  }, []);
  const initial = useMemo(() => readAnalyticsLocation(defaults), [defaults]);
  const [range, setRangeState] = useState<AdminAnalyticsRange>(initial.range);
  const [from, setFromState] = useState(initial.from);
  const [to, setToState] = useState(initial.to);
  const query = useMemo<AdminAnalyticsQuery>(
    () => (range === "custom" ? { range, from, to } : { range }),
    [from, range, to],
  );

  function updateLocation(next: { range: AdminAnalyticsRange; from: string; to: string }) {
    const params = new URLSearchParams(window.location.search);
    params.set("range", next.range);
    if (next.range === "custom") {
      params.set("from", next.from);
      params.set("to", next.to);
    } else {
      params.delete("from");
      params.delete("to");
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function setRange(next: AdminAnalyticsRange) {
    setRangeState(next);
    updateLocation({ range: next, from, to });
  }

  function setFrom(next: string) {
    setFromState(next);
    if (range === "custom") updateLocation({ range, from: next, to });
  }

  function setTo(next: string) {
    setToState(next);
    if (range === "custom") updateLocation({ range, from, to: next });
  }

  return { range, from, to, query, setRange, setFrom, setTo };
}

export function overviewChartBuckets(buckets: AdminOverviewBucket[]) {
  return buckets.map((bucket) => ({
    key: bucket.key,
    start: bucket.start,
    newUsers: bucket.newUsers,
    meals: bucket.meals,
    foodEntries: bucket.foodEntries,
    aiRequests: bucket.aiRequests,
  }));
}

function readAnalyticsLocation(defaults: { from: string; to: string }): {
  range: AdminAnalyticsRange;
  from: string;
  to: string;
} {
  const params = new URLSearchParams(window.location.search);
  const rawRange = params.get("range");
  const range = adminRangeOptions.some((option) => option.value === rawRange)
    ? (rawRange as AdminAnalyticsRange)
    : "30d";
  return {
    range,
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
  };
}
