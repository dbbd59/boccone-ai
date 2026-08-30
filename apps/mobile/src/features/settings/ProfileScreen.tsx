import { useQuery } from "@tanstack/react-query";
import { Stack as RouterStack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { getCurrentUserOptions } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import { Alert, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";

export function ProfileScreen() {
  const { copy } = useI18n();
  const { session } = useSession();
  const userQuery = useQuery({ ...getCurrentUserOptions() });
  const user = userQuery.data?.user ?? session?.user;

  return (
    <Screen>
      <RouterStack.Screen options={{ title: copy.settings.profileTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.settings.profileTitle}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.settings.profileBody}
            </Text>
          </Stack>
          {userQuery.isError ? (
            <Alert tone="danger" message={copy.settings.profileLoadError} />
          ) : null}
          {userQuery.isPending ? (
            <Text role="status" tone="secondary">
              {copy.loading.tagline}
            </Text>
          ) : null}
          {user ? (
            <Surface>
              <Stack gap="lg">
                <ProfileField label={copy.settings.nameLabel} value={user.name} />
                <ProfileField label={copy.settings.emailLabel} value={user.email} />
              </Stack>
            </Surface>
          ) : null}
          <Text variant="bodySm" tone="secondary">
            {copy.settings.profileReadOnly}
          </Text>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs">
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyLg">{value}</Text>
    </Stack>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
});
