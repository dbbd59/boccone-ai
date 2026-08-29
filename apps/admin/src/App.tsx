import { useEffect, useState } from "react";

import { getCurrentUser, listAdminUsers, type AdminUsersResponse } from "@boccone/api-client";
import { Button, Input, Screen, Stack, Surface, Text } from "@boccone/ui-web";

import { apiClient } from "./lib/api-client";
import { authClient } from "./lib/auth-client";
import "@boccone/ui-web/styles.css";
import "./styles.css";

export default function App() {
  const sessionState = authClient.useSession();

  if (sessionState.isPending)
    return (
      <Screen>
        <Text as="h1">Loading admin session…</Text>
      </Screen>
    );
  if (!sessionState.data) return <AdminLogin />;
  return <AdminAccessGate email={sessionState.data.user.email} />;
}

function AdminAccessGate({ email }: { email: string }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    void getCurrentUser({ client: apiClient })
      .then((result) => {
        if (result.error) throw new Error("Unable to load admin identity");
        return result.data;
      })
      .then((identity) => {
        if (mounted) setRole(identity.user.role);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <Screen>
        <Text as="h1">Checking admin access…</Text>
      </Screen>
    );
  if (error || role !== "admin") return <AccessDenied />;
  return <AdminShell email={email} />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (result.error) setError(result.error.message ?? "Unable to sign in");
  }

  return (
    <Screen>
      <div className="admin-narrow">
        <Stack>
          <Text as="span">BOCCONE AI / OPERATIONS</Text>
          <Text as="h1">Admin sign in</Text>
          <Text>Operational access only. Admin role is granted server-side.</Text>
        </Stack>
        <Surface>
          <Stack>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <label htmlFor="password">Password</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error ? <Text className="admin-error">{error}</Text> : null}
            <Button disabled={loading} onClick={() => void signIn()}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Surface>
      </div>
    </Screen>
  );
}

function AccessDenied() {
  return (
    <Screen>
      <div className="admin-narrow">
        <Surface>
          <Stack>
            <Text as="h1">No admin access</Text>
            <Text>Your account is authenticated but does not have the admin role.</Text>
            <Button onClick={() => void authClient.signOut()}>Sign out</Button>
          </Stack>
        </Surface>
      </div>
    </Screen>
  );
}

function AdminShell({ email }: { email: string }) {
  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUsers(searchValue = search) {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchAdminUsers(searchValue));
    } catch {
      setError("Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    void fetchAdminUsers("")
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch(() => {
        if (mounted) setError("Unable to load users");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen>
      <div className="admin-content">
        <header className="admin-header">
          <div>
            <Text as="span">BOCCONE AI / OPERATIONS</Text>
            <Text as="h1">Users</Text>
          </div>
          <div className="admin-header-actions">
            <Text>{email}</Text>
            <Button onClick={() => void authClient.signOut()}>Sign out</Button>
          </div>
        </header>
        <Surface>
          <Stack>
            <form
              className="admin-search"
              onSubmit={(event) => {
                event.preventDefault();
                void loadUsers();
              }}
            >
              <Input
                aria-label="Search users by email"
                placeholder="Search by email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit">Search</Button>
            </form>
            {error ? <Text className="admin-error">{error}</Text> : null}
            {loading ? <Text>Loading users…</Text> : null}
            {!loading && users?.users.length === 0 ? <Text>No users found.</Text> : null}
            {users?.users.map((user) => (
              <div className="admin-user-row" key={user.id}>
                <div>
                  <Text as="strong">{user.name}</Text>
                  <Text>{user.email}</Text>
                </div>
                <Text as="span">{user.role}</Text>
              </div>
            ))}
          </Stack>
        </Surface>
      </div>
    </Screen>
  );
}

async function fetchAdminUsers(searchValue: string): Promise<AdminUsersResponse> {
  const result = await listAdminUsers({
    client: apiClient,
    query: {
      ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
    },
  });
  if (result.error) throw new Error("Unable to load users");
  return result.data;
}
