import { useEffect, useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Button, Screen, Surface, Text } from "@boccone/ui-web";

import { AuditLogPanel } from "./AuditLogPanel";
import { CreateUserForm } from "./CreateUserForm";
import { ThemeToggle } from "./ThemeToggle";
import { UserDetail } from "./UserDetail";
import { UserDirectory } from "./UserDirectory";
import { fetchAdminUsers } from "../lib/admin-api";
import { authClient } from "../lib/auth-client";

const PAGE_SIZE = 20;

export function AdminShell({ email, userId }: { email: string; userId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the view with the remote directory request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminUsers({ search: activeSearch, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!mounted) return;
        setUsers(result.users);
        setTotal(result.total);
        const firstUser = result.users[0];
        if (firstUser) {
          setSelectedUserId((current) => current ?? firstUser.id);
        }
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load users");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeSearch, offset, refreshToken]);

  function handleChanged(user: AdminUser) {
    setUsers((current) => current.map((entry) => (entry.id === user.id ? user : entry)));
    setRefreshToken((value) => value + 1);
  }

  function handleCreated(user: AdminUser) {
    setShowCreate(false);
    setSelectedUserId(user.id);
    setOffset(0);
    setRefreshToken((value) => value + 1);
  }

  function handleRemoved(userIdToRemove: string) {
    setSelectedUserId(null);
    setRefreshToken((value) => value + 1);
    setUsers((current) => current.filter((user) => user.id !== userIdToRemove));
  }

  return (
    <Screen>
      <div className="admin-content">
        <header className="admin-header">
          <div>
            <Text as="span">BOCCONE AI / OPERATIONS</Text>
            <Text as="h1">User management</Text>
            <Text className="admin-muted">Anagraphic data, account status and access roles.</Text>
          </div>
          <div className="admin-header-actions">
            <Text>{email}</Text>
            <ThemeToggle />
            <Button onClick={() => void authClient.signOut()}>Sign out</Button>
          </div>
        </header>
        <div className="admin-toolbar">
          <Text className="admin-muted">Changes are server-authorized and audited.</Text>
          <Button type="button" onClick={() => setShowCreate((visible) => !visible)}>
            {showCreate ? "Close create form" : "New user"}
          </Button>
        </div>
        {showCreate ? <CreateUserForm onCreated={handleCreated} /> : null}
        {error ? <Text className="admin-error">{error}</Text> : null}
        <div className="admin-management-grid">
          <Surface>
            <UserDirectory
              users={users}
              total={total}
              limit={PAGE_SIZE}
              offset={offset}
              search={search}
              loading={loading}
              selectedUserId={selectedUserId}
              onSearchChange={setSearch}
              onSearch={() => {
                setOffset(0);
                setActiveSearch(search.trim());
              }}
              onSelect={setSelectedUserId}
              onPrevious={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
              onNext={() => setOffset((value) => value + PAGE_SIZE)}
            />
          </Surface>
          <UserDetail
            userId={selectedUserId}
            currentAdminId={userId}
            refreshToken={refreshToken}
            onChanged={handleChanged}
            onRemoved={handleRemoved}
          />
        </div>
        <Surface>
          <AuditLogPanel refreshToken={refreshToken} />
        </Surface>
      </div>
    </Screen>
  );
}
