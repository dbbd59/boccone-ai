import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { getCurrentUserOptions } from "@boccone/api-client";
import { colors } from "@boccone/design-tokens";
import { Button, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { LanguageSelector } from "../../components/LanguageSelector";
import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";

export default function HomeScreen() {
  const { session, signOut } = useSession();
  const { copy } = useI18n();
  const meQuery = useQuery({ ...getCurrentUserOptions(), enabled: Boolean(session) });
  const user = meQuery.data?.user ?? session?.user;
  const userName = user?.name?.trim();
  const displayName = userName?.length ? userName : copy.home.fallbackName;

  return (
    <Screen>
      <LanguageSelector />
      <Stack gap="xl">
        <Stack gap="sm">
          <Text variant="caption" tone="secondary">
            BOCCONE AI
          </Text>
          <Text variant="display">{copy.home.greeting(displayName)}</Text>
          <Text tone="secondary">{copy.home.subtitle}</Text>
        </Stack>
        <Surface>
          <Stack gap="md">
            <Text variant="display" tone="accent" style={styles.mascot}>
              {copy.home.mascotTitle}
            </Text>
            <Text variant="title">{copy.home.title}</Text>
            <Text tone="secondary">{copy.home.body}</Text>
            <Button onPress={() => void signOut()}>{copy.home.logout}</Button>
          </Stack>
        </Surface>
        {meQuery.isError ? <Text tone="negative">{copy.home.refreshError}</Text> : null}
        <Text variant="caption" tone="secondary">
          {copy.home.signedInAs(user?.email)}
        </Text>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mascot: {
    color: colors.accent.primary,
  },
});
