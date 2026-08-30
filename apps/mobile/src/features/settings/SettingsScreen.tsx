import { Link } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { Button, Divider, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { LanguageSelector } from "../../components/LanguageSelector";
import { SettingsRow } from "../../components/SettingsRow";
import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";

export function SettingsScreen() {
  const { copy } = useI18n();
  const { session, signOut } = useSession();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="caption" tone="default">
              {copy.appName}
            </Text>
            <Text variant="title">{copy.settings.title}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.settings.subtitle}
            </Text>
          </Stack>

          <SettingsSection title={copy.settings.accountTitle}>
            <Stack gap="sm">
              <Link href="/settings/profile" asChild>
                <SettingsRow
                  description={copy.settings.profileBody}
                  title={copy.settings.profileTitle}
                />
              </Link>
              <Link href="/settings/about" asChild>
                <SettingsRow
                  description={copy.settings.aboutBody}
                  title={copy.settings.aboutTitle}
                />
              </Link>
            </Stack>
          </SettingsSection>

          <SettingsSection title={copy.settings.preferencesTitle}>
            <Stack gap="sm">
              <Link href="/settings/appearance" asChild>
                <SettingsRow
                  description={copy.settings.appearanceBody}
                  title={copy.settings.appearanceTitle}
                />
              </Link>
              <Link href="/settings/targets" asChild>
                <SettingsRow
                  description={copy.settings.targetsBody}
                  title={copy.settings.targetsTitle}
                />
              </Link>
            </Stack>
          </SettingsSection>

          <Stack gap="md">
            <Text variant="headingMd">{copy.settings.languageTitle}</Text>
            <LanguageSelector />
          </Stack>

          <Divider />

          <Surface elevation="none" style={styles.accountSurface}>
            <Stack gap="md">
              <Stack gap="xs">
                <Text variant="label">{copy.settings.signedInTitle}</Text>
                <Text variant="bodySm" tone="secondary">
                  {copy.settings.signedInAs(session?.user.email)}
                </Text>
              </Stack>
              <Button variant="destructive" fullWidth onPress={() => void signOut()}>
                {copy.settings.signOut}
              </Button>
            </Stack>
          </Surface>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      <Text variant="headingMd">{title}</Text>
      <Surface elevation="none" padding={2}>
        {children}
      </Surface>
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  accountSurface: {
    padding: spacing[4],
  },
});
