import { Image, type ImageStyle, type StyleProp } from "react-native";

import { radii } from "@boccone/design-tokens";

import mascotSource from "../../assets/boccone-ai-mascot.png";

export function MascotAvatar({
  size = 64,
  accessibilityLabel,
  style,
}: {
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={mascotSource}
      style={[{ width: size, height: size, borderRadius: radii.lg }, style]}
    />
  );
}
