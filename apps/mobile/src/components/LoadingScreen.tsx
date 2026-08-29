import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@boccone/design-tokens";
import { Text } from "@boccone/ui-mobile";

import { useI18n } from "../i18n/context";

export function LoadingScreen() {
  const { copy } = useI18n();

  return (
    <View style={styles.container}>
      <Text variant="display">Boccone AI</Text>
      <Text tone="secondary">{copy.loading.tagline}</Text>
      <ActivityIndicator color={colors.accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.background.primary,
  },
});
