import { useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { banUser, removeUser, setUserRole, unbanUser } from "../../lib/admin-api";

export function UserAccountPage({
  user,
  currentAdminId,
  onChanged,
  onRemoved,
}: {
  user: AdminUser;
  currentAdminId: string;
  onChanged: (user: AdminUser) => void;
  onRemoved: () => void;
}) {
  const [role, setRole] = useState<"user" | "admin">(user.role);
  const [banReason, setBanReason] = useState(user.banReason ?? "");
  const [banDuration, setBanDuration] = useState("");
  const [action, setAction] = useState<"role" | "ban" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSelf = user.id === currentAdminId;

  async function saveRole() {
    setAction("role");
    setError(null);
    try {
      onChanged(await setUserRole(user.id, { role }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change user role");
    } finally {
      setAction(null);
    }
  }

  async function toggleBan() {
    setAction("ban");
    setError(null);
    try {
      const updated = user.banned
        ? await unbanUser(user.id)
        : await banUser(user.id, {
            ...(banReason.trim() ? { reason: banReason.trim() } : {}),
            ...(banDuration ? { durationSeconds: Number(banDuration) } : {}),
          });
      onChanged(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update account status");
    } finally {
      setAction(null);
    }
  }

  async function deleteAccount() {
    if (!window.confirm(`Remove ${user.email}? This cannot be undone.`)) return;
    setAction("remove");
    setError(null);
    try {
      await removeUser(user.id);
      onRemoved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove user");
      setAction(null);
    }
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-route-intro">
        <div>
          <Text as="h3" variant="headingMd">
            Account access
          </Text>
          <Text tone="secondary">Explicit, audited controls for role and account state.</Text>
        </div>
      </div>
      <Surface>
        <div className="admin-action-block">
          <div>
            <Text as="h3" variant="headingMd">
              Role
            </Text>
            <Text variant="bodySm" tone="secondary">
              Controls the server-side boundary for the operations workspace.
            </Text>
          </div>
          <div className="admin-inline-form">
            <select
              aria-label="User role"
              disabled={isSelf || action !== null}
              value={role}
              onChange={(event) => setRole(event.target.value as "user" | "admin")}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              disabled={isSelf || action !== null}
              loading={action === "role"}
              type="button"
              onClick={() => void saveRole()}
            >
              Save role
            </Button>
          </div>
          {isSelf ? (
            <Text variant="bodySm" tone="secondary">
              Your own admin role cannot be changed here.
            </Text>
          ) : null}
        </div>
      </Surface>
      <Surface>
        <div className="admin-action-block">
          <div>
            <Text as="h3" variant="headingMd">
              Account status
            </Text>
            <Text variant="bodySm" tone="secondary">
              Suspension changes are recorded in the audit log.
            </Text>
          </div>
          {!user.banned ? (
            <div className="admin-form-grid">
              <Field fieldId="ban-reason" label="Ban reason">
                <Input
                  id="ban-reason"
                  value={banReason}
                  onChange={(event) => setBanReason(event.target.value)}
                />
              </Field>
              <Field fieldId="ban-duration" label="Ban duration">
                <select
                  id="ban-duration"
                  value={banDuration}
                  onChange={(event) => setBanDuration(event.target.value)}
                >
                  <option value="">Permanent</option>
                  <option value="604800">7 days</option>
                  <option value="2592000">30 days</option>
                </select>
              </Field>
            </div>
          ) : null}
          <Button
            disabled={isSelf || action !== null}
            loading={action === "ban"}
            type="button"
            onClick={() => void toggleBan()}
          >
            {user.banned ? "Unsuspend user" : "Suspend user"}
          </Button>
          {isSelf ? (
            <Text variant="bodySm" tone="secondary">
              Your own account cannot be suspended.
            </Text>
          ) : null}
        </div>
      </Surface>
      <div className="admin-danger-zone">
        <Text as="h3" variant="headingMd">
          Danger zone
        </Text>
        <Text variant="bodySm" tone="secondary">
          Removal deletes the account, sessions, linked auth accounts, targets, and meals.
        </Text>
        <Button
          disabled={isSelf || action !== null}
          loading={action === "remove"}
          type="button"
          variant="destructive"
          onClick={() => void deleteAccount()}
        >
          Remove user
        </Button>
      </div>
      {error ? <Alert tone="danger" message={error} /> : null}
    </div>
  );
}
