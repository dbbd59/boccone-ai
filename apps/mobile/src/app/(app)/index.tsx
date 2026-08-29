import { Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet } from "react-native";

import { getCurrentUserOptions } from "@boccone/api-client";
import { spacing } from "@boccone/design-tokens";
import {
  Alert,
  ComingSoon,
  GlassButton,
  GlassSurface,
  Inline,
  Screen,
  Stack,
  Text,
} from "@boccone/ui-mobile";

import { BrandMark } from "../../components/BrandMark";
import { LanguageSelector } from "../../components/LanguageSelector";
import { useI18n } from "../../i18n/context";
import { useSession } from "../../session-context";

export default function HomeScreen() {
  const { session } = useSession();
  const { copy } = useI18n();
  const meQuery = useQuery({ ...getCurrentUserOptions(), enabled: Boolean(session) });
  const user = meQuery.data?.user ?? session?.user;
  const userName = user?.name?.trim();
  const displayName = userName?.length ? userName : copy.home.fallbackName;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Inline align="start" justify="between">
            <Stack gap="sm" style={styles.greeting}>
              <Text variant="caption" tone="brand">
                BOCCONE AI
              </Text>
              <Text variant="display">{copy.home.greeting(displayName)}</Text>
              <Text variant="bodyLg" tone="secondary">
                {copy.home.subtitle}
              </Text>
            </Stack>
            <LanguageSelector />
          </Inline>

          <ComingSoon
            title={copy.home.title}
            message={copy.home.body}
            illustration={<BrandMark size={112} />}
          />

          {meQuery.isError ? <Alert tone="danger" message={copy.home.refreshError} /> : null}

          <GlassSurface variant="regular" style={styles.accountPeek}>
            <Inline align="center" justify="between" gap="md">
              <Stack gap="xs" style={styles.accountCopy}>
                <Text variant="label">{copy.home.mascotTitle}</Text>
                <Text variant="bodySm" tone="secondary">
                  {copy.home.signedInAs(user?.email)}
                </Text>
              </Stack>
              <Link href="/(app)/settings" asChild>
                <GlassButton size="sm" accessibilityLabel={copy.navigation.settings}>
                  {copy.navigation.settings}
                </GlassButton>
              </Link>
            </Inline>
          </GlassSurface>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing[6],
  },
  accountPeek: {
    padding: spacing[4],
  },
  accountCopy: {
    flex: 1,
  },
});
