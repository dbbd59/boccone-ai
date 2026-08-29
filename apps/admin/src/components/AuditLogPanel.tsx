import { useCallback, useEffect, useState } from "react";

import type { AdminAuditAction, AdminAuditLog } from "@boccone/api-client";
import { Button, Stack, Text } from "@boccone/ui-web";

import { fetchAdminAuditLogs } from "../lib/admin-api";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  user_created: "Created user",
  user_updated: "Updated user profile",
  user_role_changed: "Changed user role",
  user_banned: "Banned user",
  user_unbanned: "Unbanned user",
  user_removed: "Removed user",
  user_targets_updated: "Updated daily targets",
  user_targets_removed: "Removed daily targets",
  user_meal_created: "Created meal",
  user_meal_updated: "Updated meal",
  user_meal_removed: "Removed meal",
};

const FIELD_LABELS: Record<string, string> = {
  banReason: "Ban reason",
  carbohydratesGrams: "Carbohydrates",
  calories: "Calories",
  email: "Email",
  fatGrams: "Fat",
  name: "Name",
  proteinGrams: "Protein",
  role: "Role",
};

const FIELD_UNITS: Record<string, string> = {
  carbohydratesGrams: "g",
  calories: "kcal",
  fatGrams: "g",
  proteinGrams: "g",
};

export function AuditLogPanel({ refreshToken }: { refreshToken: number }) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminAuditLogs({ limit: PAGE_SIZE, offset: nextOffset });
      setLogs(result.logs);
      setOffset(result.offset);
      setTotal(result.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect synchronizes the view with the remote audit-log request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs(offset);
  }, [loadLogs, offset, refreshToken]);

  const firstItem = total === 0 ? 0 : offset + 1;
  const lastItem = Math.min(offset + logs.length, total);
  const hasPrevious = offset > 0;
  const hasNext = lastItem < total;

  return (
    <section className="admin-audit" aria-labelledby="audit-heading">
      <div className="admin-section-heading">
        <div>
          <Text as="h2" id="audit-heading">
            Audit log
          </Text>
          <Text variant="bodySm" tone="secondary">
            Account and application-data changes, newest first.
          </Text>
        </div>
        <Button type="button" disabled={loading} onClick={() => void loadLogs(offset)}>
          Refresh
        </Button>
      </div>
      {error ? <Text className="admin-error">{error}</Text> : null}
      {loading ? (
        <Text role="status" tone="secondary">
          Loading audit log…
        </Text>
      ) : null}
      {!loading && logs.length === 0 ? (
        <div className="admin-empty-state">
          <Text variant="headingSm">No actions yet</Text>
          <Text variant="bodySm" tone="secondary">
            Successful account and data changes will appear here.
          </Text>
        </div>
      ) : null}
      {!loading && logs.length > 0 ? (
        <>
          <div className="admin-audit-list">
            {logs.map((log) => (
              <div className="admin-audit-row" key={log.id}>
                <Stack>
                  <strong>{ACTION_LABELS[log.action]}</strong>
                  <small>{formatAuditPart(log)}</small>
                  {formatMetadata(log) ? <small>{formatMetadata(log)}</small> : null}
                </Stack>
                <small>{new Date(log.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
          <div className="admin-audit-pagination" aria-label="Audit log pagination">
            <Text variant="bodySm" tone="secondary">
              Showing {firstItem}–{lastItem} of {total}
            </Text>
            <div className="admin-pagination-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || !hasPrevious}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || !hasNext}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatAuditPart(log: AdminAuditLog): string {
  const target = log.target
    ? `${log.target.name} · ${log.target.email}`
    : log.targetUserId
      ? `Deleted account · ${log.targetUserId}`
      : "System-wide";
  const actor = log.actor ? `${log.actor.name} · ${log.actor.email}` : log.actorUserId;
  return `Target: ${target} · By: ${actor}`;
}

function formatMetadata(log: AdminAuditLog): string | null {
  const fields = log.metadata["fields"];
  if (typeof fields !== "string" || !fields) return null;
  const labels = fields.split(",").map((field) => FIELD_LABELS[field] ?? field);
  const values = fields.split(",").flatMap((field) => {
    const value = log.metadata[field];
    if (value === undefined) return [];
    const unit = FIELD_UNITS[field] ?? "";
    return `${FIELD_LABELS[field] ?? field}: ${value}${unit ? ` ${unit}` : ""}`;
  });
  return `Changed: ${labels.join(", ")}${values.length ? ` · Values: ${values.join(", ")}` : ""}`;
}
