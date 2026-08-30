import { Button, Surface, Text, useTheme } from "@boccone/ui-web";

import { ThemeToggle } from "../../components/ThemeToggle";
import { authClient } from "../../lib/auth-client";

export function SettingsPage({ email }: { email: string }) {
  const { themeName, colorMode } = useTheme();

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro">
        <Text as="h2" variant="headingLg">
          Settings
        </Text>
        <Text tone="secondary">Workspace preferences and the current admin session.</Text>
      </div>
      <div className="admin-settings-grid">
        <Surface>
          <div className="admin-section-heading">
            <div>
              <Text as="h3" variant="headingMd">
                Appearance
              </Text>
              <Text variant="bodySm" tone="secondary">
                Choose light, dark, or system appearance. Your choice is stored locally.
              </Text>
            </div>
            <ThemeToggle />
          </div>
          <Text variant="bodySm" tone="secondary">
            Active theme: <strong>{themeName}</strong> · Mode: <strong>{colorMode}</strong>
          </Text>
        </Surface>
        <Surface>
          <Text as="h3" variant="headingMd">
            Admin session
          </Text>
          <dl className="admin-definition-grid">
            <div>
              <dt>Email</dt>
              <dd>{email}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Administrator</dd>
            </div>
          </dl>
          <Button type="button" variant="secondary" onClick={() => void authClient.signOut()}>
            Sign out
          </Button>
        </Surface>
      </div>
      <Surface>
        <Text as="h3" variant="headingMd">
          System configuration
        </Text>
        <Text tone="secondary">
          No editable global configuration is exposed by the current API. Secrets, AI keys, and
          session security remain outside this surface.
        </Text>
      </Surface>
    </div>
  );
}
