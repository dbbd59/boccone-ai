import { Image, type ImageStyle, type StyleProp } from "react-native";

import emblemSource from "../../assets/boccone-ai-emblem.png";

export function BrandMark({ size = 56, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      accessibilityLabel="Boccone AI"
      source={emblemSource}
      style={[{ width: size, height: size }, style]}
    />
  );
}
