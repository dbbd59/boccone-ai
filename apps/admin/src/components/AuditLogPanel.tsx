import { useCallback, useEffect, useState } from "react";

import type { AdminAuditLog } from "@boccone/api-client";
import { Button, Stack, Text } from "@boccone/ui-web";

import { fetchAdminAuditLogs } from "../lib/admin-api";

export function AuditLogPanel({ refreshToken }: { refreshToken: number }) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminAuditLogs({ limit: 20, offset: 0 });
      setLogs(result.logs);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect synchronizes the view with the remote audit-log request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLogs();
  }, [loadLogs, refreshToken]);

  return (
    <section className="admin-audit" aria-labelledby="audit-heading">
      <div className="admin-section-heading">
        <div>
          <Text as="h2" id="audit-heading">
            Audit log
          </Text>
          <Text variant="bodySm" tone="secondary">
            Recent account-management actions.
          </Text>
        </div>
        <Button type="button" disabled={loading} onClick={() => void loadLogs()}>
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
            Successful account changes will appear here.
          </Text>
        </div>
      ) : null}
      {!loading && logs.length > 0 ? (
        <div className="admin-audit-list">
          {logs.map((log) => (
            <div className="admin-audit-row" key={log.id}>
              <Stack>
                <strong>{log.action}</strong>
                <small>
                  target {log.targetUserId ?? "—"} · actor {log.actorUserId}
                </small>
              </Stack>
              <small>{new Date(log.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
