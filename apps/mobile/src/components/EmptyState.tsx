import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@boccone/design-tokens";
import { Button, Stack, Text } from "@boccone/ui-mobile";

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  illustration,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
}) {
  return (
    <View style={styles.container}>
      {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
      <Stack gap="xs" align="center">
        <Text variant="headingMd" style={styles.title}>
          {title}
        </Text>
        <Text tone="secondary" style={styles.body}>
          {body}
        </Text>
      </Stack>
      {actionLabel && onAction ? (
        <Button size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[4],
    paddingVertical: spacing[8],
  },
  illustration: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: spacing[12],
  },
  title: {
    textAlign: "center",
  },
  body: {
    maxWidth: 300,
    textAlign: "center",
  },
});
