import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import { controlHeights, spacing } from "@boccone/design-tokens";
import {
  ThemeProvider,
  useTheme,
  Text,
  Button,
  Field,
  Input,
  Alert,
  Surface,
  Stack,
  Inline,
  Divider,
  Screen,
} from "@boccone/ui-mobile";

/**
 * Dev-only design-system showcase. Not reachable from production navigation;
 * open it explicitly via Expo Router: /dev/design-system
 */
export default function DesignSystemShowcase() {
  return (
    <ThemeProvider>
      <ShowcaseBody />
    </ThemeProvider>
  );
}

function ShowcaseBody() {
  const { themeName, colorMode, setColorMode } = useTheme();
  const [fieldValue, setFieldValue] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Stack gap={8}>
          <Stack gap={2}>
            <Text variant="caption" tone="muted">
              BOCCONE AI / DEV
            </Text>
            <Text variant="display">Design system showcase</Text>
            <Text tone="muted">
              Theme: {themeName} (mode: {colorMode}). This screen is dev-only.
            </Text>
          </Stack>

          <Inline gap={2}>
            <Button size="sm" variant="secondary" onPress={() => setColorMode("light")}>
              Light
            </Button>
            <Button size="sm" variant="secondary" onPress={() => setColorMode("dark")}>
              Dark
            </Button>
            <Button size="sm" variant="secondary" onPress={() => setColorMode("system")}>
              System
            </Button>
          </Inline>

          <Stack gap={3}>
            <Text variant="headingLg">Typography</Text>
            {(Object.keys(TYPOGRAPHY_SAMPLES) as (keyof typeof TYPOGRAPHY_SAMPLES)[]).map(
              (variant) => (
                <Stack key={variant} gap={0}>
                  <Text variant="caption" tone="muted">
                    {variant}
                  </Text>
                  <Text variant={variant}>{TYPOGRAPHY_SAMPLES[variant]}</Text>
                </Stack>
              ),
            )}
          </Stack>

          <Divider />

          <Stack gap={3}>
            <Text variant="headingLg">Buttons</Text>
            <Inline gap={2}>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </Inline>
            <Inline gap={2}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Inline>
            <Inline gap={2}>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </Inline>
          </Stack>

          <Divider />

          <Stack gap={3}>
            <Text variant="headingLg">Forms & feedback</Text>
            <Field
              label="Sample field"
              description="Helper text under the control."
              error={fieldError}
              required
            >
              <Input
                value={fieldValue}
                invalid={Boolean(fieldError)}
                onChangeText={(next) => {
                  setFieldValue(next);
                  setFieldError(next.length === 0 ? "Value is required" : undefined);
                }}
              />
            </Field>
            <Alert tone="info" message="Info alert — neutral guidance." />
            <Alert tone="success" message="Success alert — the action worked." />
            <Alert tone="warning" message="Warning alert — check before continuing." />
            <Alert tone="danger" message="Danger alert — something failed." />
          </Stack>

          <Divider />

          <Stack gap={3}>
            <Text variant="headingLg">Surfaces</Text>
            <Surface>
              <Stack gap={2}>
                <Text variant="headingSm">Surface (raised)</Text>
                <Text tone="muted">
                  Cards use the elevated background with a soft border and shadow.
                </Text>
              </Stack>
            </Surface>
            <View style={styles.demoRow}>
              <Text tone="muted">Inline layout · gap=2</Text>
            </View>
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
}

const TYPOGRAPHY_SAMPLES = {
  display: "Display 32",
  headingXl: "Heading XL 26",
  headingLg: "Heading LG 22",
  headingMd: "Heading MD 18",
  headingSm: "Heading SM 16",
  bodyLg: "Body LG 17 — the quick brown fox jumps over the lazy dog.",
  bodyMd: "Body MD 15 — the quick brown fox jumps over the lazy dog.",
  bodySm: "Body SM 13 — the quick brown fox jumps over the lazy dog.",
  label: "Label 14",
  caption: "Caption 12",
} as const;

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing[12],
  },
  demoRow: {
    height: controlHeights.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
