import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function runHaptic(action: () => Promise<void>): void {
  if (Platform.OS === "web") return;
  void action().catch(() => undefined);
}

export function selectionFeedback(): void {
  runHaptic(() => Haptics.selectionAsync());
}

export function lightImpactFeedback(): void {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
