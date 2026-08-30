import { StyleSheet, View } from "react-native";

import { shape, spacing } from "@boccone/design-tokens";
import { Inline, Stack, Surface, useThemeColors } from "@boccone/ui-mobile";

export function LoadingSkeleton({ label }: { label: string }) {
  const colors = useThemeColors();
  const fill = { backgroundColor: colors.background.subtle };

  return (
    <Stack accessibilityLabel={label} accessibilityRole="progressbar" gap="md">
      <Surface elevation="none" style={styles.card}>
        <Stack gap="md">
          <View style={[styles.line, styles.lineShort, fill]} />
          <View style={[styles.line, styles.lineLong, fill]} />
          <View style={[styles.track, fill]} />
        </Stack>
      </Surface>
      <Inline gap="sm">
        <View style={[styles.rowBlock, fill]} />
        <View style={[styles.rowBlock, fill]} />
      </Inline>
    </Stack>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
  },
  line: {
    height: spacing[4],
    borderRadius: shape.compact,
  },
  lineShort: {
    width: "34%",
  },
  lineLong: {
    width: "68%",
    height: spacing[6],
  },
  track: {
    height: spacing[2],
    borderRadius: shape.capsule,
  },
  rowBlock: {
    flex: 1,
    height: spacing[16],
    borderRadius: shape.surface,
  },
});
