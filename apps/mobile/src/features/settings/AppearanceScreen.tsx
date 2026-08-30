import { Stack as RouterStack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { spacing, type ColorMode } from "@boccone/design-tokens";
import { FloatingGlassBar, GlassButton, Screen, Stack, Text, useTheme } from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import { lightImpactFeedback } from "../../lib/haptics";

const MODES: ColorMode[] = ["system", "light", "dark"];

export function AppearanceScreen() {
  const { copy } = useI18n();
  const { colorMode, setColorMode } = useTheme();

  return (
    <Screen>
      <RouterStack.Screen options={{ title: copy.settings.appearanceTitle }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.settings.appearanceTitle}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.settings.appearanceBody}
            </Text>
          </Stack>
          <FloatingGlassBar mergeSpacing={6} style={styles.modeBar}>
            {MODES.map((mode) => (
              <GlassButton
                key={mode}
                prominence={colorMode === mode ? "prominent" : "regular"}
                accessibilityState={{ selected: colorMode === mode }}
                onPress={() => {
                  if (colorMode !== mode) lightImpactFeedback();
                  setColorMode(mode);
                }}
                style={styles.modeButton}
              >
                {modeLabel(copy, mode)}
              </GlassButton>
            ))}
          </FloatingGlassBar>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

function modeLabel(copy: ReturnType<typeof useI18n>["copy"], mode: ColorMode): string {
  if (mode === "system") return copy.settings.system;
  if (mode === "light") return copy.settings.light;
  return copy.settings.dark;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  modeBar: {
    alignSelf: "stretch",
  },
  modeButton: {
    flex: 1,
  },
});
