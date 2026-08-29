# @boccone/design-tokens

Framework-agnostic tokens for Boccone AI. This package never imports React,
React Native, or CSS. `ui-mobile` resolves the values into native styles;
`ui-web` resolves them into CSS variables.

## Exports

| Export                                          | Purpose                                              |
| ----------------------------------------------- | ---------------------------------------------------- |
| `palettes`                                      | Raw primitive scales; app code must not import them. |
| `spacing`, `shape`, `radii`, `borderWidths`     | Layout and semantic geometry.                        |
| `elevation`, `zIndices`                         | Cross-platform depth and stacking roles.             |
| `iconSizes`, `controlHeights`, `minTouchTarget` | Sizing; touch floor is `44`.                         |
| `opacities`, `glassOpacities`                   | Interaction and material guidance.                   |
| `durations`, `easings`                          | Purposeful motion tokens.                            |
| `typography`, `fontFamily`                      | Semantic type roles and DM Sans/system fallbacks.    |
| `lightColors`, `darkColors`, `themes`           | Paired semantic themes, including `glass`.           |
| `relativeLuminance`, `contrastRatio`            | WCAG contrast helpers used by tests.                 |

## Semantic color contract

Both themes have the same structure, enforced by `assertThemeParity`:

```text
background, foreground, border, interactive, status, nutrition, focus, glass
```

Use `foreground.onInteractive` for labels on dark/colored actions. Use the
`glass` roles only through a UI package so native Liquid Glass and web/native
fallbacks stay platform-aware.

## Adding tokens

1. Add semantic values to both `lightColors` and `darkColors`.
2. Keep geometry and motion on named scales; do not add screen-local values.
3. Run parity, contrast, grid, typography, and motion tests:

```bash
bun test packages/design-tokens
```
