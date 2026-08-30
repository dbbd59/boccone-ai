import { useEffect, useState } from "react";

import type { AdminAuditLog, AdminUser } from "@boccone/api-client";
import { Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { AdminIcon } from "../../components/AdminIcon";
import { fetchAdminAuditLogs, fetchAdminMeals, fetchAdminUsers } from "../../lib/admin-api";
import { userPath } from "../../lib/navigation";

const ACTION_LABELS: Record<AdminAuditLog["action"], string> = {
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
  food_updated: "Updated food",
  food_submission_approved: "Approved food submission",
  food_submission_rejected: "Rejected food submission",
  food_submission_merged: "Merged food submission",
};

export function OverviewPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState<number | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState<number | null>(null);
  const [mealTotal, setMealTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.allSettled([
      fetchAdminUsers({ limit: 1, offset: 0 }),
      fetchAdminAuditLogs({ limit: 5, offset: 0 }),
      fetchAdminMeals({ limit: 1, offset: 0 }),
    ])
      .then(([usersResult, auditResult, mealsResult]) => {
        if (!mounted) return;
        const errors: string[] = [];
        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value.users);
          setUserTotal(usersResult.value.total);
        } else {
          errors.push("Unable to load account summary");
        }
        if (auditResult.status === "fulfilled") {
          setLogs(auditResult.value.logs);
          setAuditTotal(auditResult.value.total);
        } else {
          errors.push("Unable to load recent activity");
        }
        if (mealsResult.status === "fulfilled") {
          setMealTotal(mealsResult.value.total);
        } else {
          errors.push("Unable to load meal summary");
        }
        setError(errors.length > 0 ? errors.join(". ") : null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <div>
          <Text as="h2" variant="headingLg">
            What needs attention?
          </Text>
          <Text tone="secondary">
            A concise operational view. Open a domain to do the detailed work.
          </Text>
        </div>
      </div>
      {error ? <Text className="admin-error">{error}</Text> : null}
      <div className="admin-stat-grid">
        <SummaryCard
          label="Accounts"
          value={loading ? "—" : userTotal === null ? "Unavailable" : String(userTotal)}
          detail="Search and manage user accounts"
          to="/users"
        />
        <SummaryCard
          label="Audited actions"
          value={loading ? "—" : auditTotal === null ? "Unavailable" : String(auditTotal)}
          detail="Review operations across the workspace"
          to="/audit-log"
        />
        <SummaryCard
          label="Meal records"
          value={loading ? "—" : mealTotal === null ? "Unavailable" : String(mealTotal)}
          detail="Inspect meal data across users"
          to="/meals"
        />
      </div>
      <div className="admin-overview-grid">
        <Surface>
          <div className="admin-section-heading">
            <div>
              <Text as="h3" variant="headingMd">
                Recent activity
              </Text>
              <Text variant="bodySm" tone="secondary">
                Latest audited changes, newest first.
              </Text>
            </div>
            <AdminLink className="admin-inline-link" to="/audit-log">
              View audit log <AdminIcon name="arrowRight" size={16} />
            </AdminLink>
          </div>
          {loading ? <Text tone="secondary">Loading activity…</Text> : null}
          {!loading && logs.length === 0 ? (
            <div className="admin-empty-state">
              <Text variant="bodySm">No audited actions yet.</Text>
              <Text variant="bodySm" tone="secondary">
                Successful account and meal changes will appear here.
              </Text>
            </div>
          ) : null}
          {!loading && logs.length > 0 ? (
            <div className="admin-activity-list">
              {logs.map((log) => (
                <div className="admin-activity-row" key={log.id}>
                  <div>
                    <Text variant="bodySm">
                      <strong>{ACTION_LABELS[log.action]}</strong>
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {log.target?.name ?? "Deleted account"} ·{" "}
                      {new Date(log.createdAt).toLocaleString()}
                    </Text>
                  </div>
                  {log.targetUserId ? (
                    <AdminLink className="admin-text-link" to={userPath(log.targetUserId)}>
                      Open user
                    </AdminLink>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Surface>
        <Surface>
          <Text as="h3" variant="headingMd">
            Shortcuts
          </Text>
          <div className="admin-shortcut-list">
            <Shortcut
              to="/users"
              title="Find a user"
              detail="Search accounts and open their workspace."
            />
            <Shortcut
              to="/meals"
              title="Review meals"
              detail="Scan meal records by user, date, or category."
            />
            <Shortcut
              to="/settings"
              title="Workspace settings"
              detail="Manage appearance and your admin session."
            />
          </div>
        </Surface>
      </div>
      {users.length > 0 ? (
        <Text variant="caption" tone="secondary">
          Latest account: {users[0]?.name}
        </Text>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  to,
}: {
  label: string;
  value: string;
  detail: string;
  to: string;
}) {
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
      <AdminLink className="admin-inline-link" to={to}>
        Open <AdminIcon name="arrowRight" size={16} />
      </AdminLink>
    </Surface>
  );
}

function Shortcut({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <AdminLink className="admin-shortcut" to={to}>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <AdminIcon name="arrowRight" size={18} />
    </AdminLink>
  );
}
