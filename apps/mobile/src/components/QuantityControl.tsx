import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { borderWidths, minTouchTarget, opacities, shape, spacing } from "@boccone/design-tokens";
import { Input, Text, useThemeColors } from "@boccone/ui-mobile";

import { selectionFeedback } from "../lib/haptics";

export function QuantityControl({
  value,
  onChangeText,
  onDecrement,
  onIncrement,
  label,
  decrementLabel,
  incrementLabel,
  stepLabel,
  disabled = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  stepLabel?: string;
  disabled?: boolean;
}) {
  const colors = useThemeColors();

  function press(action: () => void) {
    if (disabled) return;
    selectionFeedback();
    action();
  }

  return (
    <View>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.control,
          { backgroundColor: colors.background.elevated, borderColor: colors.border.default },
          disabled && { opacity: opacities.disabled },
        ]}
      >
        <Pressable
          accessibilityLabel={decrementLabel}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => press(onDecrement)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.background.subtle, opacity: opacities.pressed },
          ]}
        >
          <MaterialCommunityIcons color={colors.foreground.default} name="minus" size={20} />
        </Pressable>
        <Input
          accessibilityLabel={label}
          editable={!disabled}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
        <Pressable
          accessibilityLabel={incrementLabel}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => press(onIncrement)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: colors.background.subtle, opacity: opacities.pressed },
          ]}
        >
          <MaterialCommunityIcons color={colors.foreground.default} name="plus" size={20} />
        </Pressable>
      </View>
      {stepLabel ? (
        <Text variant="caption" tone="secondary" style={styles.stepLabel}>
          {stepLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing[1],
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: borderWidths.hairline,
    borderRadius: shape.control,
    padding: spacing[1],
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    borderRadius: shape.compact,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: minTouchTarget,
    borderWidth: 0,
    paddingHorizontal: spacing[1],
    textAlign: "center",
  },
  stepLabel: {
    marginTop: spacing[1],
  },
});
