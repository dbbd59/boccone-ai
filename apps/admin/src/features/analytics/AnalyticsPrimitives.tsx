import { useState } from "react";
import type { ReactNode } from "react";

import type { AdminAnalyticsRange } from "@boccone/api-client";
import { Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { adminRangeOptions } from "./analytics-state";

export function AnalyticsDateRange({
  range,
  from,
  to,
  setRange,
  setFrom,
  setTo,
}: {
  range: AdminAnalyticsRange;
  from: string;
  to: string;
  setRange: (range: AdminAnalyticsRange) => void;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
}) {
  return (
    <Surface className="analytics-range-bar">
      <div className="analytics-range-controls">
        <div className="analytics-range-presets" role="group" aria-label="Analytics date range">
          {adminRangeOptions.map((option) => (
            <Button
              key={option.value}
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
              size="sm"
              variant={range === option.value ? "primary" : "secondary"}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {range === "custom" ? (
          <div className="analytics-custom-range">
            <Field fieldId="analytics-from" label="From">
              <Input
                id="analytics-from"
                max={to}
                onChange={(event) => setFrom(event.target.value)}
                type="date"
                value={from}
              />
            </Field>
            <Field fieldId="analytics-to" label="To">
              <Input
                id="analytics-to"
                min={from}
                onChange={(event) => setTo(event.target.value)}
                type="date"
                value={to}
              />
            </Field>
          </div>
        ) : null}
      </div>
      <Text variant="caption" tone="secondary">
        Reporting timezone: UTC. Comparisons use the preceding period of equal length.
      </Text>
    </Surface>
  );
}

export function AnalyticsMetricRail({
  metrics,
}: {
  metrics: {
    label: string;
    value: string;
    detail?: string;
    tone?: "default" | "positive" | "negative";
    sparkline?: number[];
  }[];
}) {
  return (
    <div className="analytics-metric-rail">
      {metrics.map((metric) => (
        <div className="analytics-metric" key={metric.label}>
          <Text variant="caption" tone="secondary">
            {metric.label}
          </Text>
          <Text className="analytics-metric-value" variant="headingLg">
            {metric.value}
          </Text>
          {metric.detail ? (
            <Text
              className={`analytics-metric-detail is-${metric.tone ?? "default"}`}
              variant="caption"
            >
              {metric.detail}
            </Text>
          ) : null}
          {metric.sparkline && metric.sparkline.length > 0 ? (
            <span aria-hidden="true" className="analytics-sparkline">
              {metric.sparkline.map((value, index) => (
                <span
                  className="analytics-sparkline-bar"
                  key={`${metric.label}-${index}`}
                  style={{ height: `${sparklineHeight(value, metric.sparkline ?? [])}%` }}
                />
              ))}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsTrendChart({
  buckets,
  series,
}: {
  buckets: { key: string; start: string; [key: string]: unknown }[];
  series: { key: string; label: string; tone: ChartTone }[];
}) {
  const [selectedKey, setSelectedKey] = useState(buckets.at(-1)?.key ?? "");
  const max = Math.max(
    ...buckets.flatMap((bucket) => series.map((item) => numberValue(bucket[item.key]))),
    1,
  );
  const selected = buckets.find((bucket) => bucket.key === selectedKey) ?? buckets.at(-1);

  return (
    <div className="analytics-chart-block">
      <div className="analytics-chart-legend">
        {series.map((item) => (
          <span className="analytics-legend-item" key={item.key}>
            <span aria-hidden="true" className={`analytics-legend-dot is-${item.tone}`} />
            {item.label}
          </span>
        ))}
      </div>
      <div
        aria-label={
          selected
            ? `Activity chart. Selected period ${periodLabel(selected.start)}.`
            : "Activity chart"
        }
        className="analytics-trend-chart"
        role="img"
      >
        {buckets.map((bucket) => (
          <button
            aria-label={`${periodLabel(bucket.start)}: ${series.map((item) => `${item.label} ${numberValue(bucket[item.key])}`).join(", ")}`}
            aria-pressed={bucket.key === selectedKey}
            className={`analytics-chart-column${bucket.key === selectedKey ? " is-selected" : ""}`}
            key={bucket.key}
            onClick={() => setSelectedKey(bucket.key)}
            type="button"
          >
            <span className="analytics-chart-bars">
              {series.map((item) => (
                <span
                  className={`analytics-chart-bar is-${item.tone}`}
                  key={item.key}
                  style={{
                    height: `${Math.max(numberValue(bucket[item.key]) === 0 ? 2 : 6, (numberValue(bucket[item.key]) / max) * 100)}%`,
                  }}
                />
              ))}
            </span>
            <span className="analytics-chart-label">{shortPeriodLabel(bucket.start)}</span>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="analytics-chart-callout" aria-live="polite">
          <Text variant="bodySm">
            <strong>{periodLabel(selected.start)}</strong>
            {series.map(
              (item) => ` · ${item.label}: ${numberValue(selected[item.key]).toLocaleString()}`,
            )}
          </Text>
        </div>
      ) : null}
      <table className="analytics-sr-table">
        <caption>Chart values</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((item) => (
              <th key={item.key}>{item.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <th>{periodLabel(bucket.start)}</th>
              {series.map((item) => (
                <td key={item.key}>{numberValue(bucket[item.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsRankedBars({
  items,
  valueLabel,
}: {
  items: { label: string; value: number; detail?: string }[];
  valueLabel?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="analytics-ranked-list">
      {items.length === 0 ? <Text tone="secondary">No data for this period.</Text> : null}
      {items.map((item) => (
        <div className="analytics-ranked-row" key={item.label}>
          <div className="analytics-ranked-copy">
            <Text variant="bodySm">{item.label}</Text>
            {item.detail ? (
              <Text variant="caption" tone="secondary">
                {item.detail}
              </Text>
            ) : null}
          </div>
          <Text className="analytics-ranked-value" variant="bodySm">
            {valueLabel ? valueLabel(item.value) : item.value.toLocaleString()}
          </Text>
          <span aria-hidden="true" className="analytics-ranked-track">
            <span
              className="analytics-ranked-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Surface className="analytics-section">
      <div className="analytics-section-heading">
        <div>
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          {description ? (
            <Text variant="bodySm" tone="secondary">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
      {children}
    </Surface>
  );
}

export function AnalyticsLoading() {
  return (
    <div className="analytics-loading" aria-busy="true">
      <span /> <span /> <span />
    </div>
  );
}

export function AnalyticsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="admin-empty-state" role="alert">
      <Text className="admin-error">{message}</Text>
      <Button onClick={onRetry} size="sm" variant="secondary">
        Try again
      </Button>
    </div>
  );
}

export function AnalyticsNoData({
  message = "No activity was recorded for this period.",
}: {
  message?: string;
}) {
  return (
    <div className="admin-empty-state">
      <Text variant="bodySm">No data for this period.</Text>
      <Text variant="bodySm" tone="secondary">
        {message}
      </Text>
    </div>
  );
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sparklineHeight(value: number, values: number[]): number {
  const max = Math.max(...values, 1);
  return Math.max(value === 0 ? 4 : 12, (value / max) * 100);
}

function periodLabel(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsePeriodDate(value));
}

function shortPeriodLabel(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parsePeriodDate(value));
}

function parsePeriodDate(value: string): Date {
  const day = value.slice(0, 10);
  return new Date(`${day}T12:00:00.000Z`);
}

export type ChartTone = "brand" | "protein" | "carbs" | "fat" | "warning" | "danger" | "info";
