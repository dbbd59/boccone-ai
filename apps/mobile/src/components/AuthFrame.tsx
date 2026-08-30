import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

import { spacing } from "@boccone/design-tokens";
import { Screen, Stack, Text } from "@boccone/ui-mobile";

import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "../i18n/context";
import { MascotAvatar } from "./MascotAvatar";

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { copy } = useI18n();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <MascotAvatar accessibilityLabel={copy.appName} size={56} />
            <LanguageSelector />
          </View>
          <Stack gap="sm">
            <Text variant="caption" tone="brand">
              {copy.appName}
            </Text>
            <Text variant="title">{title}</Text>
            <Text variant="bodyLg" tone="secondary">
              {subtitle}
            </Text>
          </Stack>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing[8],
    paddingVertical: spacing[4],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
