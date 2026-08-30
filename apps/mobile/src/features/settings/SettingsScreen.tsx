import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { Button, Divider, Screen, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

import { LanguageSelector } from "../../components/LanguageSelector";
import { SettingsRow } from "../../components/SettingsRow";
import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";

export function SettingsScreen() {
  const { copy } = useI18n();
  const { session, signOut } = useSession();
  const colors = useThemeColors();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.settings.title}</Text>
            <Text variant="bodySm" tone="secondary">
              {copy.settings.subtitle}
            </Text>
          </Stack>

          <SettingsSection title={copy.settings.accountTitle}>
            <Stack>
              <Link href="/settings/profile" asChild>
                <SettingsRow
                  description={copy.settings.profileBody}
                  icon={
                    <MaterialCommunityIcons
                      color={colors.interactive.default}
                      name="account-outline"
                      size={20}
                    />
                  }
                  title={copy.settings.profileTitle}
                />
              </Link>
              <Link href="/settings/about" asChild>
                <SettingsRow
                  description={copy.settings.aboutBody}
                  icon={
                    <MaterialCommunityIcons
                      color={colors.interactive.default}
                      name="information-outline"
                      size={20}
                    />
                  }
                  title={copy.settings.aboutTitle}
                />
              </Link>
            </Stack>
          </SettingsSection>

          <SettingsSection title={copy.settings.preferencesTitle}>
            <Stack>
              <Link href="/settings/appearance" asChild>
                <SettingsRow
                  description={copy.settings.appearanceBody}
                  icon={
                    <MaterialCommunityIcons
                      color={colors.interactive.default}
                      name="theme-light-dark"
                      size={20}
                    />
                  }
                  title={copy.settings.appearanceTitle}
                />
              </Link>
              <Link href="/settings/targets" asChild>
                <SettingsRow
                  description={copy.settings.targetsBody}
                  icon={
                    <MaterialCommunityIcons
                      color={colors.interactive.default}
                      name="target"
                      size={20}
                    />
                  }
                  title={copy.settings.targetsTitle}
                />
              </Link>
              <Link href="/settings/ai" asChild>
                <SettingsRow
                  description={copy.settings.aiBody}
                  icon={
                    <MaterialCommunityIcons
                      color={colors.interactive.default}
                      name="robot-outline"
                      size={20}
                    />
                  }
                  title={copy.settings.aiTitle}
                />
              </Link>
            </Stack>
          </SettingsSection>

          <Stack gap="md">
            <Text variant="headingMd">{copy.settings.languageTitle}</Text>
            <LanguageSelector />
          </Stack>

          <Divider />

          <Stack gap="md">
            <View>
              <Text variant="label">{copy.settings.signedInTitle}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.settings.signedInAs(session?.user.email)}
              </Text>
            </View>
            <Button variant="destructive" fullWidth onPress={() => void signOut()}>
              {copy.settings.signOut}
            </Button>
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="sm">
      <Text variant="headingMd">{title}</Text>
      <View>{children}</View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
});
