import { Stack as RouterStack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { Screen, Stack, Text } from "@boccone/ui-mobile";

import { DailyTargetsForm } from "../../components/DailyTargetsForm";
import { useI18n } from "../../i18n/context";

export function TargetsScreen() {
  const { copy } = useI18n();

  return (
    <Screen>
      <RouterStack.Screen options={{ title: copy.settings.targetsTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.settings.targetsTitle}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.settings.targetsBody}
            </Text>
          </Stack>
          <DailyTargetsForm />
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
});
