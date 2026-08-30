import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Screen, Text, useThemeColors } from "@boccone/ui-mobile";
import { spacing } from "@boccone/design-tokens";

import { useI18n } from "../i18n/context";
import { MascotAvatar } from "./MascotAvatar";

export function LoadingScreen() {
  const { copy } = useI18n();
  const colors = useThemeColors();

  return (
    <Screen>
      <View style={styles.container}>
        <MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />
        <Text variant="title">Boccone AI</Text>
        <Text tone="secondary">{copy.loading.tagline}</Text>
        <ActivityIndicator color={colors.interactive.default} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
});
