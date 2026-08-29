# Boccone AI — Design System

Architecture, conventions, and inventory for the shared UI foundation.

## Philosophy

1. **Calm, friendly, clear.** Warm cream paper, calm broccoli green, soft
   borders, generous whitespace. The visual language is derived from the
   repository brand assets (`docs/images/*`); the broccoli mascot is used
   sparingly (empty states, onboarding) — never plastered everywhere.
2. **Tokens before components.** No component reads a raw hex value; all
   styling flows through `@boccone/design-tokens` semantic names.
3. **Same language, native behavior.** Web and native share tokens, component
   names, APIs, variants, and state models — not forced-identical DOM.
   A mobile app should feel mobile; a web app should feel web.
4. **Accessibility is a floor, not a feature.** 44px touch targets, visible
   focus, WCAG AA contrast (tested), screen-reader semantics, OS font scaling.

## Architecture (3 packages, no bundler takeover)

```text
packages/design-tokens    Layer 0 — pure data: palettes, scales, typography,
      │                   semantic light/dark themes, contrast math, validation.
      │                   No React / RN / CSS imports, ever.
      ▼
packages/ui-mobile        Layer 2 (native) — ThemeProvider (light/dark/system
      │                   via useColorScheme), RN primitives.
packages/ui-web           Layer 2 (web) — ThemeProvider (data-bc-theme +
      │                   prefers-color-scheme), semantic HTML primitives,
      │                   styles.css with --bc-* variables for both themes.
      ▼
apps/mobile, apps/admin   Application UI — imports only from the ui packages.
```

### Why not Tamagui / cross-platform single implementation

Evaluated and deliberately not adopted (early-stage decision, cheap to revisit):

- **Bundler takeover**: Tamagui requires its babel/expo plugin in Metro *and*
  `@tamagui/vite-plugin` in the admin Vite config — it becomes the styling
  runtime of both apps. The repo's convention (AGENTS.md §4) is explicit
  source-in-workspace packages with zero bundler coupling.
- **It replaces `design-tokens` instead of building on it**: AGENTS.md and the
  PRD name `design-tokens` as the shared token source consumed by separate
  `ui-mobile`/`ui-web` packages.
- **Payoff asymmetry**: only mobile is user-facing; admin is a small
  English-only internal Vite app. Sharing tokens + APIs + state models
  captures most of the benefit with none of the build-pipeline risk.

If the product later needs a truly universal component set, the token layer
here is already Tamagui-shaped (flat scales + semantic themes) and can be
adapted without touching app code.

## Theming

- **Mobile**: `ThemeProvider` accepts `colorMode` (`light | dark | system`,
  default `system`), optional controlled `onColorModeChange`, and an
  `override` for rare per-screen color adjustments. `useTheme()` /
  `useThemeColors()` expose the resolved `SemanticColors`.
- **Web**: `ThemeProvider` writes `data-bc-theme="light|dark"` on `<html>`;
  `system` follows `prefers-color-scheme` live (media-query listener).
  `styles.css` defines `--bc-*` variables for both themes.
- **Persistence** is an app concern (mobile: `SecureStore`/`localStorage`
  pattern already used by i18n; web: localStorage + inline boot script if
  FOUC matters). The packages expose the hooks, not the storage.

## Component conventions

- **Variants, not booleans**: `variant="primary|secondary|ghost|destructive"`,
  `size="sm|md|lg"`, `tone="default|muted|…|danger"`.
- **Escape hatches exist but are not the default**: `style` /
  `labelStyle` / `override`.
- **States**: every interactive component handles default / hover (web) /
  pressed / focus-visible (web) / disabled / loading. Feedback is always
  visible.
- **Accessibility**: RN `accessibilityRole`/`accessibilityState` and web
  ARIA/semantic elements; labels associate via `htmlFor`/ids (`Field`); errors
  use `role="alert"` / `accessibilityRole="alert"`.
- **Mirroring rule**: when a component exists on both platforms, keep the
  name, props, variants, and tones identical; only the implementation differs.

## Inventory / status

| Component | API | Mobile | Web | Tests | Notes |
| --- | --- | --- | --- | --- | --- |
| ThemeProvider | ✅ | ✅ | ✅ | tokens | system mode both platforms |
| useTheme / useThemeColors | ✅ | ✅ | ✅ | — | resolved SemanticColors |
| Text | ✅ | ✅ | ✅ | tokens | 10 typography variants, 9 tones |
| Box / Stack / Inline | ✅ | ✅ | ✅ | — | layout primitives |
| Divider / Surface / Screen | ✅ | ✅ | ✅ | — | Surface = elevation card |
| Container | ✅ | — | ✅ | — | web content widths |
| Button | ✅ | ✅ | ✅ | tokens | 4 variants, 3 sizes, loading, fullWidth |
| Field / Input | ✅ | ✅ | ✅ | — | label/description/error association |
| Alert | ✅ | ✅ | ✅ | — | info/success/warning/danger |
| InlineLink | ✅ | ✅ | — | — | 44px hit area on native |

Planned next (in vertical-slice order, built when the consuming feature
needs them): Badge/Chip, Spinner/Progress/Skeleton, EmptyState/ErrorState,
Dialog/Sheet, Select/Checkbox/Switch, Tabs/AppBar, Avatar/Card/List.

## Testing

```bash
bun test packages/design-tokens   # parity, contrast, scales, motion
bun run typecheck                 # all three packages
bun run lint
```

Component behavior tests (press/disabled/loading, theme switching, a11y
semantics) should be added alongside the features that consume each component,
per the repo's vertical-slice rule.

## How to add a component

1. Design the shared API first (variants, sizes, tones, states) — write it in
   this file's inventory as "API ✅".
2. Implement native in `packages/ui-mobile/src` (tokens via `useTheme`,
   44px floor, accessibility props).
3. Implement web in `packages/ui-web/src` (+ `styles.css` if CSS is needed;
   semantic HTML, `:focus-visible`).
4. Export from the package barrel; keep names/props mirrored.
5. Typecheck + lint both packages; add tests if the component encodes logic
   (not just styling).

## How to add a token

See `packages/design-tokens/README.md` — parity and contrast tests run
automatically.
