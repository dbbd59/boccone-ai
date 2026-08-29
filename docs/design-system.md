# Boccone AI — Design System

Shared design language and implementation rules for the mobile app and admin
workspace.

## Product character

Boccone is a calm, warm food companion — not a medical tool, calorie
spreadsheet, or gamified tracker. The broccoli AI character appears at useful
brand moments and never wears headphones or sci-fi accessories.

The canvas is content-first: warm paper in light mode, deep ink-green in dark
mode, readable typography, and generous spacing. Liquid Glass is a functional
layer for navigation, floating controls, grouped choices, and transient
surfaces. It is not a default treatment for content or every card.

## Architecture

```text
packages/design-tokens    pure scales and semantic light/dark themes
        │
        ├── packages/ui-mobile   React Native / Expo primitives
        │       └── guarded iOS 26 Liquid Glass + tokenized fallbacks
        │
        └── packages/ui-web      semantic React DOM primitives + CSS
                └── backdrop-filter glass + high-opacity fallback

apps/mobile                consumer app and native navigation
apps/admin                 operational workspace and web navigation
```

Shared packages never import app packages. App code consumes semantic tokens
through the UI packages; it must not import raw palette values or invent local
color, spacing, typography, or radius values.

## Material hierarchy

Use the smallest material that communicates the role:

1. **Content canvas** — standard themed background. Food content, forms, and
   readable text live here.
2. **Standard surface** — `Surface` for a meaningful grouping such as an
   account panel, admin table, or form section.
3. **Functional glass** — `GlassSurface` for floating navigation, segmented
   choices, utility clusters, and transient hierarchy.
4. **Prominent glass** — `GlassButton` with `prominence="prominent"` for one
   primary floating action or selected control.

Avoid stacking opaque cards inside glass, large blurred hero areas, decorative
glass panels, gradients, glow, and arbitrary shadows. On web, blur is only a
progressive enhancement. On unsupported native platforms, the fallback is a
high-opacity themed surface with a tokenized border.

## Tokens

`packages/design-tokens` owns:

- semantic `lightColors` and `darkColors`, including `glass` and
  `foreground.onInteractive`;
- `spacing`, `shape`, `radii`, `borderWidths`, `elevation`, and `zIndices`;
- `typography` and `fontFamily`;
- `controlHeights` and `minTouchTarget` (`44`);
- `durations`, `easings`, and `glassOpacities`.

Every semantic color exists in both themes. Contrast and theme-parity tests are
the gate for token changes.

## Native material and navigation

The repo currently targets Expo SDK 55. `packages/ui-mobile` uses
`expo-glass-effect` only when both `isLiquidGlassAvailable()` and
`isGlassEffectAPIAvailable()` are true, on iOS, and reduced transparency is
off. The native surface receives the resolved light/dark color scheme and
does not animate opacity; Expo documents that opacity zero on a `GlassView` or
its parent can break rendering.

`GlassContainer` maps to the native container on supported iOS and keeps a
tokenized fallback elsewhere. `useReducedTransparency()` and
`useReducedMotion()` expose OS preferences to feature code. Reduced
transparency always selects the solid fallback.

The mobile app uses Expo Router SDK 55 native tabs for the two implemented
destinations: Home and Settings. This is intentionally a small, real
destination set: do not add a diary, capture, or AI tab until its route and
functionality exist. The native tab bar owns safe-area behavior and, on iOS
26, receives the system Liquid Glass treatment. The web export keeps a basic
compatible fallback.

Mobile and Admin use different navigation paradigms. Mobile is consumer-first:
native bottom tabs, one-handed reach, platform gestures, and minimal native
headers. Admin is a productivity workspace: a persistent tonal side rail on
wide screens, with identity, current page, account/theme/sign-out controls,
and one real item per implemented workspace. The rail collapses to icons with
tooltips on desktop and becomes a labeled drawer with backdrop and Escape
close behavior below tablet width. Never replace the Admin rail with mobile
bottom tabs.

## Web material

`packages/ui-web` emits `.bc-glass` with semantic CSS variables and a modest
blur/saturation enhancement. `prefers-reduced-transparency: reduce` and
unsupported `backdrop-filter` select the opaque fallback. High-contrast mode
strengthens the border and removes transparency. Admin utility controls may
use `GlassSurface`; operational data panels remain standard surfaces.

## Component inventory

| Component                                  | Mobile          | Web          | Role                                     |
| ------------------------------------------ | --------------- | ------------ | ---------------------------------------- |
| `ThemeProvider`, `useTheme`                | yes             | yes          | light/dark/system theme resolution       |
| `Text`, `Box`, `Stack`, `Inline`           | yes             | yes          | semantic type and layout primitives      |
| `Screen`, `Surface`, `Divider`             | yes             | yes          | canvas and meaningful content grouping   |
| `GlassSurface`                             | native/fallback | CSS fallback | functional glass layer                   |
| `GlassContainer` / `FloatingGlassBar`      | native/fallback | —            | merged and floating native controls      |
| `Button`, `GlassButton`, `GlassIconButton` | yes             | yes          | labeled actions and floating actions     |
| `Field`, `Input`, `PasswordInput`          | yes             | yes          | accessible forms and recovery            |
| `Alert`, `ComingSoon`                      | yes             | yes          | feedback and honest planned destinations |

Mirrored components keep names, variants, tones, and state models aligned where
the platform permits. Native implementation may use platform behavior rather
than forcing DOM behavior onto mobile.

## Interaction and accessibility

- Interactive mobile controls are at least 44px; icon-only controls require an
  accessible label.
- Web controls expose keyboard focus with `:focus-visible`; errors use alert
  semantics and fields keep label/description associations.
- Text uses semantic typography and respects Dynamic Type / browser scaling.
- Motion is short and purposeful. Honor reduced motion; never use opacity
  fades on native glass surfaces.
- Use haptics only for meaningful selection, confirmation, or destructive
  actions once the platform capability is available; never use vibration as
  decoration.
- Check light/dark contrast, reduced transparency, reduced motion, larger
  text, screen-reader order, keyboard flow, safe areas, and keyboard avoidance.

## App rules

Mobile user-facing copy belongs in the typed English/Italian translations.
Admin remains English-only. Preserve real API/auth behavior and show loading,
error, empty, and planned states honestly. `ComingSoon` must not imply that an
endpoint, data source, or product flow already exists.

The daily-targets vertical owns one optional target set per user. Mobile edits
it from Settings through the authenticated generated client; Admin can inspect,
edit, and delete the same values from User details. Blank fields are stored as
null, not as invented zeroes. Destructive admin actions require confirmation
and create audit records.

Admin is operational: it may manage users and inspect audit data, but never
exposes secrets or silently impersonates users. Keep its layout denser than
mobile while retaining the same tokens and material hierarchy.

## Verification

```bash
bun test packages/design-tokens
bun run typecheck
bun run lint
bun run build --filter @boccone/admin
bun run build --filter @boccone/mobile
```

For UI changes, visually inspect mobile auth, Home, Settings, and the admin
login/access-denied/directory/detail/audit states in both themes at narrow and
wide widths. Native iOS 26 material still requires a device or simulator pass;
web and static export checks do not prove native rendering.

## Official references

- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Expo SDK 55 — GlassEffect](https://docs.expo.dev/versions/v55.0.0/sdk/glass-effect/)
- [Expo Router SDK 55 — Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [Expo SDK 55 — BlurView](https://docs.expo.dev/versions/v55.0.0/sdk/blur-view/)
- [Expo SDK 55 — Haptics](https://docs.expo.dev/versions/v55.0.0/sdk/haptics/)
- [React Native — AccessibilityInfo](https://reactnative.dev/docs/0.76/accessibilityinfo)
