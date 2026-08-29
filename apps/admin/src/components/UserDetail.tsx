import { useEffect, useState } from "react";

import type { AdminUser, DailyTargets } from "@boccone/api-client";
import { Button, Field, Input, Stack, Surface, Text } from "@boccone/ui-web";

import { AdminDailyTargetsPanel } from "./AdminDailyTargetsPanel";
import {
  banUser,
  fetchAdminUser,
  fetchAdminUserDailyTargets,
  removeUser,
  setUserRole,
  unbanUser,
  updateUser,
} from "../lib/admin-api";

interface UserDetailProps {
  userId: string | null;
  currentAdminId: string;
  refreshToken: number;
  onChanged: (user: AdminUser) => void;
  onRemoved: (userId: string) => void;
}

export function UserDetail({
  userId,
  currentAdminId,
  refreshToken,
  onChanged,
  onRemoved,
}: UserDetailProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      // Reset the selected record when the directory selection is cleared.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      setTargets(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setTargetsLoading(true);
    setError(null);
    void Promise.all([fetchAdminUser(userId), fetchAdminUserDailyTargets(userId)])
      .then(([nextUser, nextTargets]) => {
        if (!mounted) return;
        setUser(nextUser);
        setTargets(nextTargets);
        setName(nextUser.name);
        setEmail(nextUser.email);
        setRole(nextUser.role);
        setBanReason(nextUser.banReason ?? "");
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load user");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setTargetsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [userId, refreshToken]);

  if (!userId) {
    return (
      <Surface>
        <Text as="h2">User details</Text>
        <Text tone="secondary">Select an account to inspect and manage it.</Text>
      </Surface>
    );
  }

  if (loading && !user) {
    return (
      <Surface>
        <Text role="status" tone="secondary">
          Loading account…
        </Text>
      </Surface>
    );
  }

  if (!user) {
    return (
      <Surface>
        <Text className="admin-error">{error ?? "User unavailable"}</Text>
      </Surface>
    );
  }

  const currentUser = user;
  const isSelf = currentUser.id === currentAdminId;

  async function saveProfile() {
    setAction("profile");
    setError(null);
    try {
      const updatedUser = await updateUser(currentUser.id, {
        name: name.trim(),
        email: email.trim(),
      });
      setUser(updatedUser);
      onChanged(updatedUser);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update user");
    } finally {
      setAction(null);
    }
  }

  async function saveRole() {
    setAction("role");
    setError(null);
    try {
      const updatedUser = await setUserRole(currentUser.id, { role });
      setUser(updatedUser);
      onChanged(updatedUser);
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
      const updatedUser = currentUser.banned
        ? await unbanUser(currentUser.id)
        : await banUser(currentUser.id, {
            ...(banReason.trim() ? { reason: banReason.trim() } : {}),
            ...(banDuration ? { durationSeconds: Number(banDuration) } : {}),
          });
      setUser(updatedUser);
      onChanged(updatedUser);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update account status");
    } finally {
      setAction(null);
    }
  }

  async function deleteAccount() {
    if (!window.confirm(`Remove ${currentUser.email}? This cannot be undone.`)) return;
    setAction("delete");
    setError(null);
    try {
      await removeUser(currentUser.id);
      onRemoved(currentUser.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove user");
      setAction(null);
    }
  }

  return (
    <Surface>
      <Stack>
        <div className="admin-detail-heading">
          <div>
            <Text as="h2">User details</Text>
            <Text variant="bodySm" tone="secondary">
              {currentUser.id}
            </Text>
          </div>
          <span
            className={`admin-status ${currentUser.banned ? "is-banned" : "is-active"}`}
            role="status"
          >
            {currentUser.banned ? "Banned" : "Active"}
          </span>
        </div>
        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <Field fieldId="detail-name" label="Name" required>
            <Input
              id="detail-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field fieldId="detail-email" label="Email" required>
            <Input
              id="detail-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button
            type="submit"
            loading={action === "profile"}
            disabled={action !== null && action !== "profile"}
          >
            Save profile
          </Button>
        </form>
        <div className="admin-detail-meta">
          <Text variant="bodySm">
            Email verified: <strong>{currentUser.emailVerified ? "Yes" : "No"}</strong>
          </Text>
          <Text variant="bodySm">
            Created: <strong>{new Date(currentUser.createdAt).toLocaleString()}</strong>
          </Text>
          {currentUser.banned ? (
            <Text variant="bodySm">
              Ban reason: <strong>{currentUser.banReason ?? "No reason"}</strong>
              {currentUser.banExpires
                ? ` · expires ${new Date(currentUser.banExpires).toLocaleString()}`
                : " · permanent"}
            </Text>
          ) : null}
        </div>
        <AdminDailyTargetsPanel
          loading={targetsLoading}
          targets={targets}
          userId={currentUser.id}
          onChanged={setTargets}
        />
        <div className="admin-action-block">
          <Text as="h3" variant="headingSm">
            Role
          </Text>
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
              type="button"
              loading={action === "role"}
              disabled={isSelf || action !== null}
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
        <div className="admin-action-block">
          <Text as="h3" variant="headingSm">
            Account status
          </Text>
          {!currentUser.banned ? (
            <>
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
            </>
          ) : null}
          <Button
            type="button"
            loading={action === "ban"}
            disabled={isSelf || action !== null}
            onClick={() => void toggleBan()}
          >
            {currentUser.banned ? "Unban user" : "Ban user"}
          </Button>
          {isSelf ? (
            <Text variant="bodySm" tone="secondary">
              Your own account cannot be banned.
            </Text>
          ) : null}
        </div>
        <div className="admin-danger-zone">
          <Text as="h3" variant="headingSm">
            Danger zone
          </Text>
          <Text variant="bodySm" tone="secondary">
            Removal deletes the account, sessions and linked auth accounts.
          </Text>
          <Button
            type="button"
            loading={action === "delete"}
            disabled={isSelf || action !== null}
            onClick={() => void deleteAccount()}
          >
            Remove user
          </Button>
        </div>
        {error ? (
          <Text className="admin-error" role="alert">
            {error}
          </Text>
        ) : null}
      </Stack>
    </Surface>
  );
}
