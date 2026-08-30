import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { AiProviderDefinition } from "@boccone/api-client";
import { iconSizes, minTouchTarget, spacing } from "@boccone/design-tokens";
import { Button, Stack, Text, useThemeColors } from "@boccone/ui-mobile";

import type { TranslationCopy } from "../../i18n/translations";

type SettingsCopy = TranslationCopy["settings"];

export function AiProviderGuide({
  provider,
  copy,
  onClose,
}: {
  provider: AiProviderDefinition;
  copy: SettingsCopy;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const guide = copy.aiGuides[provider.guide.key];
  const openUrl = provider.guide.apiKeyUrl ?? provider.guide.docsUrl;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: colors.background.default }]}>
        <View style={styles.header}>
          <Text variant="headingLg">{guide.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.aiManualCancel}
            onPress={onClose}
            style={styles.close}
          >
            <MaterialCommunityIcons
              color={colors.foreground.default}
              name="close"
              size={iconSizes.lg}
            />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Stack gap="lg">
            <Text variant="bodyLg" tone="secondary">
              {guide.intro}
            </Text>
            {guide.customNeeds ? (
              <Text variant="bodySm" tone="secondary">
                {guide.customNeeds}
              </Text>
            ) : null}
            {guide.steps.length > 0 ? (
              <Stack gap="md">
                {guide.steps.map((step, index) => (
                  <View key={step} style={styles.step}>
                    <View style={[styles.number, { backgroundColor: colors.background.subtle }]}>
                      <Text variant="label">{index + 1}</Text>
                    </View>
                    <Text variant="bodyLg" style={styles.stepCopy}>
                      {step}
                    </Text>
                  </View>
                ))}
              </Stack>
            ) : null}
            {guide.billing ? (
              <Text variant="bodySm" tone="secondary">
                {guide.billing}
              </Text>
            ) : null}
            <Text variant="bodySm" tone="secondary">
              {guide.security}
            </Text>
            {openUrl ? (
              <Button fullWidth onPress={() => void WebBrowser.openBrowserAsync(openUrl)}>
                {guide.openLabel}
              </Button>
            ) : null}
          </Stack>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, padding: spacing[6] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  close: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: spacing[12] },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
  number: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: spacing[10],
    alignItems: "center",
    justifyContent: "center",
  },
  stepCopy: { flex: 1 },
});
