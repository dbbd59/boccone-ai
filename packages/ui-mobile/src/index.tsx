import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { colors, radii, shadows, spacing, typography } from "@boccone/design-tokens";

type TextVariant = keyof typeof typography;
type TextTone = keyof typeof colors.text | "accent" | "positive" | "negative";

export function Text({
  variant = "body",
  tone = "primary",
  style,
  ...props
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const color =
    tone === "accent"
      ? colors.accent.primary
      : tone === "positive"
        ? colors.feedback.positive
        : tone === "negative"
          ? colors.feedback.negative
          : colors.text[tone];
  return <NativeText {...props} style={[styles.text, typography[variant], { color }, style]} />;
}

export function Button({
  children,
  loading = false,
  disabled,
  style,
  ...props
}: PropsWithChildren<
  Omit<PressableProps, "style"> & { loading?: boolean; style?: StyleProp<ViewStyle> }
>) {
  const isDisabled = disabled === true ? true : loading;
  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <Text tone="inverse" variant="label">
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  return (
    <NativeTextInput
      {...props}
      placeholderTextColor={colors.text.muted}
      style={[styles.input, style]}
    />
  );
}

export function Screen({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.screen, style]}>
      {children}
    </View>
  );
}

export function Surface({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  return (
    <View {...props} style={[styles.surface, style]}>
      {children}
    </View>
  );
}

export function Stack({
  children,
  gap = "md",
  style,
  ...props
}: PropsWithChildren<ViewProps> & { gap?: keyof typeof spacing }) {
  return (
    <View {...props} style={[styles.stack, { gap: spacing[gap] }, style]}>
      {children}
    </View>
  );
}

export function InlineLink({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Text accessibilityRole="link" onPress={onPress} tone="accent" variant="label">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: "System",
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  surface: {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  stack: {
    flexDirection: "column",
  },
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent.primary,
  },
  buttonPressed: {
    backgroundColor: colors.accent.strong,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.background.elevated,
    fontSize: typography.body.fontSize,
  },
});
