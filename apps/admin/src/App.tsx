import { useEffect, useState } from "react";

import { getCurrentUser } from "@boccone/api-client";
import type { ColorMode } from "@boccone/ui-web";
import { Button, Field, Input, Screen, Stack, Surface, Text, ThemeProvider } from "@boccone/ui-web";

import { AdminShell } from "./components/AdminShell";
import { BrandMark } from "./components/BrandMark";
import { apiClient } from "./lib/api-client";
import { readStoredColorMode } from "./lib/color-mode";
import { authClient } from "./lib/auth-client";
import "@boccone/ui-web/styles.css";
import "./styles.css";

export default function App() {
  const sessionState = authClient.useSession();
  const [colorMode, setColorMode] = useState<ColorMode | undefined>(() => readStoredColorMode());

  return (
    <ThemeProvider colorMode={colorMode} onColorModeChange={handleColorModeChange}>
      {sessionState.isPending ? (
        <Screen>
          <div className="admin-state">
            <Text variant="headingLg">Loading workspace</Text>
            <Text tone="secondary">Checking your secure session.</Text>
          </div>
        </Screen>
      ) : sessionState.data ? (
        <AdminAccessGate email={sessionState.data.user.email} userId={sessionState.data.user.id} />
      ) : (
        <AdminLogin />
      )}
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
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) setError(result.error.message ?? "Unable to sign in");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <div className="admin-narrow">
        <div className="admin-login-intro">
          <div className="admin-brand-lockup" aria-label="Boccone AI Operations">
            <BrandMark size={32} />
            <span>BOCCONE AI / OPERATIONS</span>
          </div>
          <Text as="h1" variant="title">
            Admin sign in
          </Text>
          <Text tone="secondary">
            A focused workspace for account operations and audit history.
          </Text>
        </div>
        <Surface>
          <form
            className="admin-login-form"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <Field fieldId="email" label="Email" required>
              <Input
                id="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field fieldId="password" label="Password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {error ? (
              <Text className="admin-error" role="alert">
                {error}
              </Text>
            ) : null}
            <Button fullWidth size="lg" loading={loading} type="submit">
              Sign in
            </Button>
          </form>
        </Surface>
        <Text variant="caption" tone="secondary">
          Admin role is granted and checked server-side.
        </Text>
      </div>
    </Screen>
  );
}

function AccessDenied() {
  return (
    <Screen>
      <div className="admin-narrow admin-denied">
        <div className="admin-brand-lockup" aria-label="Boccone AI Operations">
          <BrandMark size={32} />
          <span>BOCCONE AI / OPERATIONS</span>
        </div>
        <Surface>
          <Stack gap={4}>
            <Text as="h1" variant="title">
              No admin access
            </Text>
            <Text tone="secondary">
              Your account is signed in, but it cannot enter this workspace.
            </Text>
            <Button variant="secondary" onClick={() => void authClient.signOut()}>
              Sign out
            </Button>
          </Stack>
        </Surface>
      </div>
    </Screen>
  );
}
