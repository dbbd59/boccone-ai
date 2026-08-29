import { ScrollView, StyleSheet } from "react-native";

import { spacing, type ColorMode } from "@boccone/design-tokens";
import {
  Button,
  Divider,
  FloatingGlassBar,
  GlassButton,
  Inline,
  Screen,
  Stack,
  Surface,
  Text,
  useTheme,
} from "@boccone/ui-mobile";

import { LanguageSelector } from "../../../components/LanguageSelector";
import { DailyTargetsForm } from "../../../components/DailyTargetsForm";
import { useI18n } from "../../../i18n/context";
import { lightImpactFeedback } from "../../../lib/haptics";
import { useSession } from "../../../session-context";

const MODES: ColorMode[] = ["system", "light", "dark"];

export default function SettingsScreen() {
  const { copy } = useI18n();
  const { session, signOut } = useSession();
  const { colorMode, setColorMode } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="caption" tone="brand">
              BOCCONE AI
            </Text>
            <Text variant="display">{copy.settings.title}</Text>
            <Text variant="bodyLg" tone="secondary">
              {copy.settings.subtitle}
            </Text>
          </Stack>

          <Surface elevation="none" style={styles.section}>
            <Stack gap="md">
              <Stack gap="xs">
                <Text variant="headingMd">{copy.settings.appearanceTitle}</Text>
                <Text variant="bodySm" tone="secondary">
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
          </Surface>

          <DailyTargetsForm />

          <Stack gap="md">
            <Stack gap="xs">
              <Text variant="headingMd">{copy.settings.languageTitle}</Text>
            </Stack>
            <LanguageSelector />
          </Stack>

          <Divider />

          <Surface elevation="none" style={styles.section}>
            <Stack gap="sm">
              <Text variant="headingMd">{copy.settings.accountTitle}</Text>
              <Text variant="bodySm" tone="secondary">
                {copy.settings.signedInAs(session?.user.email)}
              </Text>
              <Inline justify="end">
                <Button variant="destructive" onPress={() => void signOut()}>
                  {copy.settings.signOut}
                </Button>
              </Inline>
            </Stack>
          </Surface>
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
    paddingBottom: spacing[6],
  },
  section: {
    padding: spacing[5],
  },
  modeBar: {
    alignSelf: "stretch",
  },
  modeButton: {
    flex: 1,
  },
});
