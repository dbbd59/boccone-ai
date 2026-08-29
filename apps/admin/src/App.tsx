import { useEffect, useState } from "react";

import { getCurrentUser } from "@boccone/api-client";
import type { ColorMode } from "@boccone/ui-web";
import { Button, Input, Screen, Stack, Surface, Text, ThemeProvider } from "@boccone/ui-web";

import { AdminShell } from "./components/AdminShell";
import { apiClient } from "./lib/api-client";
import { readStoredColorMode } from "./lib/color-mode";
import { authClient } from "./lib/auth-client";
import "@boccone/ui-web/styles.css";
import "./styles.css";

export default function App() {
  const sessionState = authClient.useSession();
  const [colorMode, setColorMode] = useState<ColorMode | undefined>(() => readStoredColorMode());

  if (sessionState.isPending)
    return (
      <Screen>
        <Text as="h1">Loading admin session…</Text>
      </Screen>
    );
  if (!sessionState.data) return <AdminLogin />;
  return (
    <ThemeProvider colorMode={colorMode} onColorModeChange={handleColorModeChange}>
      <AdminAccessGate email={sessionState.data.user.email} userId={sessionState.data.user.id} />
    </ThemeProvider>
  );

  function handleColorModeChange(next: ColorMode) {
    setColorMode(next);
  }
}

function AdminAccessGate({ email, userId }: { email: string; userId: string }) {
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
  return <AdminShell email={email} userId={userId} />;
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
