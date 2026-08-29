# @boccone/ui-web

Semantic React DOM implementation of Boccone’s design system. APIs mirror
`@boccone/ui-mobile` where platform behavior is meaningful.

Import the stylesheet once:

```tsx
import { ThemeProvider } from "@boccone/ui-web";
import "@boccone/ui-web/styles.css";

<ThemeProvider colorMode="system">
  <App />
</ThemeProvider>;
```

## Materials

```tsx
import { GlassButton, GlassSurface } from "@boccone/ui-web";

<GlassSurface variant="regular">
  <GlassButton prominence="prominent">Save</GlassButton>
</GlassSurface>;
```

`.bc-glass` uses semantic CSS variables with modest `backdrop-filter` blur as
a progressive enhancement. Unsupported browsers, high-contrast mode, and
`prefers-reduced-transparency: reduce` use an opaque themed fallback. Use
glass for functional hierarchy; keep operational data panels on `Surface`.

## Components

`Text`, `Box`, `Stack`, `Inline`, `Container`, `Divider`, `Surface`, `Screen`,
`GlassSurface`, `Button`, `GlassButton`, `GlassIconButton`, `Field`, `Input`,
`Alert`, and `ComingSoon` are exported. Buttons expose keyboard focus and
fields preserve label/description/error associations.

## Rules

- Use semantic components and CSS variables; no raw app colors or spacing.
- Keep admin English-only until product scope explicitly changes.
- Honor `prefers-reduced-motion` and use `:focus-visible` for keyboard users.
- Preserve real loading/error/empty states; do not create fake data or API
  destinations to fill a layout.
