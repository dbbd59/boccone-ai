import { ScrollView, StyleSheet } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { ComingSoon, Screen, Stack, Text } from "@boccone/ui-mobile";

import { BrandMark } from "../../components/BrandMark";
import { useI18n } from "../../i18n/context";

export function DiaryScreen() {
  const { copy } = useI18n();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="caption" tone="default">
              {copy.appName}
            </Text>
            <Text variant="title">{copy.diary.title}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.diary.subtitle}
            </Text>
          </Stack>
          <ComingSoon
            title={copy.diary.comingSoonTitle}
            message={copy.diary.comingSoonMessage}
            illustration={<BrandMark size={72} />}
          />
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
