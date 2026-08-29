# @boccone/ui-mobile

React Native / Expo implementation of Boccone’s semantic design system. APIs
mirror `@boccone/ui-web` where platform behavior is meaningful.

## Theme

```tsx
import { ThemeProvider } from "@boccone/ui-mobile";

<ThemeProvider colorMode="system">
  <RootLayout />
</ThemeProvider>;
```

`colorMode` accepts `system`, `light`, or `dark`; controlled mode also accepts
`onColorModeChange`. `useTheme()` exposes resolved semantic colors.

## Materials

```tsx
import { GlassButton, GlassContainer, GlassSurface } from "@boccone/ui-mobile";

<GlassContainer>
  <GlassSurface variant="clear">
    <GlassButton prominence="prominent">Save</GlassButton>
  </GlassSurface>
</GlassContainer>;
```

`GlassView`/`GlassContainer` from `expo-glass-effect` are used only on iOS
when the runtime APIs are available and reduced transparency is disabled.
Other platforms use a high-opacity tokenized surface. `useReducedTransparency`
and `useReducedMotion` expose the system preferences. Do not fade a native
glass view with opacity.

## Components

`Text`, `Box`, `Stack`, `Inline`, `Divider`, `Surface`, `Screen`, `Button`,
`GlassButton`, `GlassIconButton`, `Field`, `Input`, `PasswordInput`, `Alert`,
and `ComingSoon` are exported. Buttons and fields preserve a 44px minimum
target; text respects Dynamic Type by default.

## Rules

- Resolve colors from `useTheme()` or shared components; no raw app colors.
- Keep mobile copy in the typed English/Italian localization layer.
- Provide labels for icon-only actions and alert semantics for errors.
- Honor reduced motion/transparency, safe areas, keyboard avoidance, and
  loading/error/empty states.
