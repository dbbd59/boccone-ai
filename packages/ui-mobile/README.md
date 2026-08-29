# @boccone/ui-mobile

Layer 2 of the Boccone AI design system for React Native (Expo). Resolves
the semantic tokens from `@boccone/design-tokens` into React Native styles
and components. Mirrors the component names, props, variants, and tones of
`@boccone/ui-web`.

## Theming

Wrap your app root once (the mobile app does this in `_layout.tsx`):

```tsx
import { ThemeProvider } from "@boccone/ui-mobile";

<ThemeProvider>
  <RootLayout />
</ThemeProvider>
```

Default `colorMode` is `"system"` (follows the OS setting live via
`useColorScheme`). Pass `colorMode="light" | "dark"` to pin, or control it
through `colorMode` + `onColorModeChange`. `useTheme()` gives the resolved
`SemanticColors`; `useThemeColors()` is a shorthand for just the colors.

## Components

| Component | API |
| --- | --- |
| `Text` | `variant` (display…caption), `tone` (default…danger). Sizes scale with the OS font setting (Dynamic Type). |
| `Box` / `Stack` / `Inline` | Flex primitives with token-based `gap`, `align`, `padding`. |
| `Divider`, `Surface`, `Screen` | Structure primitives; `Screen` is the padded full-bleed root. |
| `Button` | `variant="primary|secondary|ghost|destructive"`, `size="sm|md|lg"`, `loading`, `fullWidth`. Pressed feedback via `Pressable`; ≥44px touch target always. |
| `Field` + `Input` | `label`, `description`, `error` (`accessibilityRole="alert"`), `required`. |
| `Alert` | `tone="info|success|warning|danger"`, `accessibilityRole="alert"`. |
| `InlineLink` | Underlined text link with a 44px pressable hit area. |

## Example

```tsx
import { ThemeProvider, Screen, Stack, Text, Button, Field, Input } from "@boccone/ui-mobile";

<ThemeProvider>
  <Screen>
    <Stack gap={4}>
      <Text variant="headingLg">Welcome</Text>
      <Field label="Email" required>
        <Input keyboardType="email-address" autoComplete="email" />
      </Field>
      <Button variant="primary">Continue</Button>
    </Stack>
  </Screen>
</ThemeProvider>
```

## Rules

- Never hardcode colors or sizes in app code — use components and tokens.
- Touch-first behaviors (press feedback, hit slop) live here; do not force
  them onto the web package.
- Text sizes scale with the OS font setting (Dynamic Type); do not hardcode
  `allowFontScaling={false}`.
