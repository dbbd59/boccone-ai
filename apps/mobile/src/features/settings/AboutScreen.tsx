import { Stack as RouterStack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { ComingSoon, Screen, Stack, Surface, Text } from "@boccone/ui-mobile";

import { BrandMark } from "../../components/BrandMark";
import { useI18n } from "../../i18n/context";

export function AboutScreen() {
  const { copy } = useI18n();

  return (
    <Screen>
      <RouterStack.Screen options={{ title: copy.settings.aboutTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm" align="center">
            <BrandMark size={72} />
            <Text variant="title">{copy.settings.aboutTitle}</Text>
            <Text variant="bodyLg" tone="secondary" style={styles.centeredText}>
              {copy.settings.aboutBody}
            </Text>
          </Stack>
          <Surface elevation="none">
            <Stack gap="sm">
              <Text variant="headingMd">{copy.settings.aboutPrincipleTitle}</Text>
              <Text tone="secondary">{copy.settings.aboutPrincipleBody}</Text>
            </Stack>
          </Surface>
          <ComingSoon title={copy.settings.aboutMoreTitle} message={copy.settings.aboutMoreBody} />
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  centeredText: {
    textAlign: "center",
  },
});
