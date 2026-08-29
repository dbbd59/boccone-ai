import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, Text as NativeText, type StyleProp, type TextProps } from "react-native";

import { useTheme, type TextTone } from "./index";

export interface InlineLinkProps extends PropsWithChildren {
  onPress: () => void;
  tone?: Extract<TextTone, "brand" | "inverse" | "muted">;
  style?: StyleProp<TextProps["style"]>;
  children?: ReactNode;
}

/** Small inline link rendered as text with a 44px pressable hit area. */
export function InlineLink({ onPress, tone = "brand", style, children }: InlineLinkProps) {
  const { colors } = useTheme();
  const color =
    tone === "inverse"
      ? colors.foreground.inverse
      : tone === "muted"
        ? colors.foreground.muted
        : colors.interactive.default;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <NativeText style={[styles.text, { color, textDecorationLine: "underline" }, style]}>
        {children}
      </NativeText>
    </Pressable>
  );
}

const styles = {
  hit: {
    minHeight: 44,
    justifyContent: "center" as const,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {},
};
