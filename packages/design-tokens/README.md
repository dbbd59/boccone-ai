# @boccone/design-tokens

Layer 0 of the Boccone AI design system: framework-agnostic, platform-agnostic
token data. This package must never import React, React Native, or CSS —
consumers resolve tokens into platform styles:

- `packages/ui-mobile` → React Native styles (light/dark via `ThemeProvider`)
- `packages/ui-web` → CSS custom properties (`--bc-*`) + `data-bc-theme`

## Contents

| Export | Purpose |
| --- | --- |
| `palettes` | Raw primitive color scales (neutral, brand, success, warning, danger, info). App code never imports these. |
| `spacing`, `radii`, `borderWidths` | 4-pt-grid spacing, radius, and border scales. |
| `elevation` | Shadow weights with paired `web` (CSS string) and `native` (RN shadow/elevation) forms. |
| `iconSizes`, `controlHeights`, `minTouchTarget` | Sizing tokens; `minTouchTarget` (44) is the accessibility floor. |
| `opacities`, `breakpoints`, `layoutWidths`, `zIndices` | Interaction opacity, responsive breakpoints, content caps, stacking order. |
| `durations`, `easings` | Motion tokens; durations are ordered, easings are CSS cubic-beziers. |
| `typography`, `fontFamily` | 10 named type variants (`display` … `caption`) with size/line-height/weight/letter-spacing. |
| `lightColors`, `darkColors`, `themes` | Semantic color themes — the only colors app code may reference. |
| `relativeLuminance`, `contrastRatio` | WCAG contrast math, used by tests and CI. |
| `assertThemeParity`, `themeColorLeaves` | Structural validation helpers. |
| `colors` | Backwards-compatible flat light-theme aliases (legacy consumers only). |

## Semantic color contract

Every semantic name exists in **both** themes with identical structure
(enforced by `assertThemeParity` and the test suite):

```
background.{default, subtle, elevated, inverse}
foreground.{default, muted, subtle, inverse}
border.{default, subtle, strong}
interactive.{default, hover, pressed, disabled}
status.{success, warning, danger, info}{, Subtle}
nutrition.{protein, carbs, fat}
focus
```

Contrast requirements (tested): body text ≥ 4.5:1 on its background in both
themes; status-on-subtle ≥ 3:1; white label on `interactive.default` ≥ 4.5:1.

## Adding a token

1. Add the value to the relevant scale/structure in `src/index.ts`.
2. If semantic, add it to **both** `lightColors` and `darkColors`.
3. Run `bun test` — parity and contrast checks run automatically.
4. Document the new name here.

## Adding a typography variant

Add a `TypeSpec` entry to `typography` (fontSize/lineHeight/weight/spacing),
then mirror the variant in `packages/ui-web/src/styles.css` (`.bc-<variant>`)
and in the mobile `Text` variant mapping. Line height must be ≥ font size.

## Tests

```bash
cd packages/design-tokens && bun test
```

Covers theme parity, hex validity, WCAG contrast thresholds, 4-pt grid
integrity, typography metrics, touch-target constant, and motion-token
ordering.
