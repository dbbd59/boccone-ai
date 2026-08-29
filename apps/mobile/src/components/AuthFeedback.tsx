import { StyleSheet } from "react-native";

import { colors } from "@boccone/design-tokens";
import { Text } from "@boccone/ui-mobile";

export function AuthFeedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" variant="caption" tone="negative" style={styles.message}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.feedback.negative,
  },
});
