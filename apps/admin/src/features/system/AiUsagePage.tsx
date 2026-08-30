import { useCallback, useEffect, useState } from "react";

import type { AdminAiUsage, AdminAiUsageSummary } from "@boccone/api-client";
import { Button, Surface, Text } from "@boccone/ui-web";

import { fetchAdminAiUsage } from "../../lib/admin-api";

const PAGE_SIZE = 50;

export function AiUsagePage() {
  const [usage, setUsage] = useState<AdminAiUsage[]>([]);
  const [summary, setSummary] = useState<AdminAiUsageSummary | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminAiUsage({ limit: PAGE_SIZE, offset: nextOffset });
      setUsage(result.usage);
      setSummary(result.summary);
      setOffset(result.offset);
      setTotal(result.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load the first page when the operations view opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(offset);
  }, [load, offset]);

  const lastItem = Math.min(offset + usage.length, total);
  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          AI usage
        </Text>
        <Text tone="secondary">
          Operational metadata only. Prompts, responses, and API keys are never shown.
        </Text>
      </div>
      {summary ? (
        <>
          <div className="admin-stat-grid">
            <SummaryCard
              label="Requests"
              value={String(summary.requestCount)}
              detail="All recorded AI invocations"
            />
            <SummaryCard
              label="Succeeded"
              value={String(summary.succeededCount)}
              detail="Completed provider requests"
            />
            <SummaryCard
              label="Failed"
              value={String(summary.failedCount)}
              detail={`${summary.cancelledCount} cancelled`}
            />
            <SummaryCard
              label="Failure rate"
              value={
                summary.requestCount === 0
                  ? "0%"
                  : `${Math.round((summary.failedCount / summary.requestCount) * 100)}%`
              }
              detail="Failed requests only"
            />
            <SummaryCard
              label="Average latency"
              value={`${summary.averageLatencyMs} ms`}
              detail="Across filtered requests"
            />
            <SummaryCard
              label="Tokens"
              value={summary.totalTokens === null ? "—" : String(summary.totalTokens)}
              detail={`In ${summary.inputTokens ?? "—"} · out ${summary.outputTokens ?? "—"}`}
            />
          </div>
          <Surface>
            <div className="admin-section-heading">
              <div>
                <Text as="h3" variant="headingMd">
                  Distribution
                </Text>
                <Text variant="bodySm" tone="secondary">
                  Requests grouped by provider, model, and feature.
                </Text>
              </div>
            </div>
            <div className="admin-definition-grid">
              <Breakdown title="Providers" values={summary.byProvider} />
              <Breakdown title="Models" values={summary.byModel} />
              <Breakdown title="Features" values={summary.byFeature} />
            </div>
          </Surface>
        </>
      ) : null}
      <Surface>
        <div className="admin-section-heading">
          <Text variant="bodySm" tone="secondary">
            {total === 0 ? "No AI requests yet." : `Showing ${offset + 1}–${lastItem} of ${total}`}
          </Text>
          <Button type="button" disabled={loading} onClick={() => void load(offset)}>
            Refresh
          </Button>
        </div>
        {error ? <Text className="admin-error">{error}</Text> : null}
        {loading ? (
          <Text role="status" tone="secondary">
            Loading AI usage…
          </Text>
        ) : null}
        {!loading && usage.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Feature</th>
                  <th>Provider / model</th>
                  <th>Status</th>
                  <th>Tokens in / out / total</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{item.user?.email ?? item.userId}</td>
                    <td>{item.feature}</td>
                    <td>
                      {item.provider} · {item.model}
                    </td>
                    <td>
                      {item.status}
                      {item.errorCode ? ` · ${item.errorCode}` : ""}
                    </td>
                    <td>
                      {item.inputTokens ?? "—"} / {item.outputTokens ?? "—"} /{" "}
                      {item.totalTokens ?? "—"}
                    </td>
                    <td>{item.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!loading && total > 0 ? (
          <div className="admin-pagination-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || lastItem >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </Surface>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Surface className="admin-stat-card">
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text as="p" variant="headingXl">
        {value}
      </Text>
      <Text variant="bodySm" tone="secondary">
        {detail}
      </Text>
    </Surface>
  );
}

function Breakdown({
  title,
  values,
}: {
  title: string;
  values: AdminAiUsageSummary["byProvider"];
}) {
  return (
    <div>
      <Text variant="label">{title}</Text>
      {values.length === 0 ? (
        <Text variant="bodySm" tone="secondary">
          —
        </Text>
      ) : (
        values.map((value) => (
          <div className="admin-definition-row" key={value.key}>
            <Text variant="bodySm">{value.key}</Text>
            <Text variant="bodySm" tone="secondary">
              {value.requests}
            </Text>
          </div>
        ))
      )}
    </div>
  );
}
