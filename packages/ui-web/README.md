# @boccone/ui-web

Layer 2 of the Boccone AI design system for web (React DOM). Resolves the
semantic tokens from `@boccone/design-tokens` into CSS custom properties and
renders semantic HTML. Mirrors the component names, props, variants, and
tones of `@boccone/ui-mobile`.

Import `@boccone/ui-web/styles.css` once at your app's entry point (the
admin app does this in `App.tsx`).

## Theming

Wrap your app once:

```tsx
import { ThemeProvider } from "@boccone/ui-web";

<ThemeProvider colorMode="system">
  <App />
</ThemeProvider>
```

`ThemeProvider` sets `data-bc-theme="light" | "dark"` on `<html>`. In
`system` mode it follows `prefers-color-scheme` live. All styles resolve
through CSS variables, so switching themes never re-renders component trees.

## Components

| Component | API |
| --- | --- |
| `Text` | `variant` (display…caption), `tone` (default…danger), optional `as` element override. Headings default to the right semantic element per variant. |
| `Stack` / `Inline` | Flex column/row with token-based `gap`, `align`, `justify`, `wrap`. |
| `Box` / `Container` | Padding/background/radius box; content width caps (narrow/text/wide). |
| `Divider`, `Surface`, `Screen` | Structure primitives. |
| `Button` | `variant="primary|secondary|ghost|destructive"`, `size="sm|md|lg"`, `loading`, `fullWidth`. Hover/active/`:focus-visible` handled in CSS. |
| `Field` + `Input` | Label association via `fieldId`, `description`, `error` (`role="alert"`), `invalid` state. |
| `Alert` | `tone="info|success|warning|danger"`, `role="alert"`. |

## Example

```tsx
import { ThemeProvider, Screen, Stack, Text, Button, Field, Input } from "@boccone/ui-web";
import "@boccone/ui-web/styles.css";

<ThemeProvider>
  <Screen>
    <Stack gap={4}>
      <Text variant="headingLg">Welcome</Text>
      <Field label="Email" fieldId="email" required>
        <Input id="email" type="email" />
      </Field>
      <Button variant="primary">Continue</Button>
    </Stack>
  </Screen>
</ThemeProvider>
```

## Rules

- Never hardcode colors or sizes in app code — use components and tokens.
- Web-specific behaviors (hover, focus rings, tooltips) live here; do not
  force them onto the mobile package.
- Reduced-motion preferences disable all transitions via
  `prefers-reduced-motion`.
