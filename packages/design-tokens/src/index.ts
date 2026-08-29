/**
 * Boccone AI — shared design tokens.
 *
 * Layer 0 of the design system: framework-agnostic, platform-agnostic data.
 * This module must never import React, React Native, or CSS. Consumers:
 *
 * - `packages/ui-mobile` resolves tokens to React Native styles;
 * - `packages/ui-web` resolves tokens to CSS custom properties;
 * - feature code never imports raw colors — it uses the UI packages.
 *
 * Visual language: warm cream paper, calm broccoli green, soft borders.
 * Derived from the repository brand assets (docs/images/*) — friendly,
 * clear, premium without feeling luxurious.
 */

// ---------------------------------------------------------------------------
// Primitive palettes — raw scales. Never referenced by app code directly.
// ---------------------------------------------------------------------------

export const palettes = {
  neutral: {
    0: "#ffffff",
    50: "#fffaf3",
    100: "#f7f0e6",
    200: "#efe6d8",
    300: "#e5dacb",
    400: "#c9bda9",
    500: "#8c988f",
    600: "#66736a",
    700: "#4a554d",
    800: "#2e3a33",
    900: "#1c2620",
    950: "#121a15",
  },
  brand: {
    50: "#eef7ee",
    100: "#e0f0e1",
    200: "#c4e2c6",
    300: "#9dcda2",
    400: "#6fb278",
    500: "#4f8f5b",
    600: "#367b45",
    700: "#2c6439",
    800: "#245c31",
    900: "#1c4a27",
    950: "#0f2e17",
  },
  success: {
    50: "#e9f6ec",
    500: "#2f7c4b",
    600: "#27683e",
    700: "#205333",
  },
  warning: {
    50: "#fbf3e4",
    500: "#a66b21",
    600: "#8d5a1b",
    700: "#744916",
  },
  danger: {
    50: "#fbeeee",
    500: "#b64747",
    600: "#9b2c2c",
    700: "#7f2424",
  },
  info: {
    50: "#eaf2f7",
    500: "#3a6ea5",
    600: "#305b89",
    700: "#274a70",
  },
} as const;

// ---------------------------------------------------------------------------
// Scales — spacing, radius, elevation, sizing, motion.
// ---------------------------------------------------------------------------

/** 4-pt base grid. Keys are string aliases; values are density-independent px. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  // Compatibility aliases used by the first mobile auth screens.
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radii;

/** Border widths in px (density-independent). */
export const borderWidths = {
  none: 0,
  hairline: 1,
  thick: 2,
} as const;

/**
 * Web shadows (CSS box-shadow strings) and native elevations (Android
 * elevation / iOS shadow quadruple) describing the same visual weight.
 */
export const elevation = {
  none: {
    web: "none",
    native: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  },
  raised: {
    web: "0 2px 8px rgb(28 38 32 / 10%)",
    native: {
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
  floating: {
    web: "0 8px 24px rgb(28 38 32 / 14%)",
    native: {
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  },
  overlay: {
    web: "0 16px 48px rgb(28 38 32 / 22%)",
    native: {
      shadowOpacity: 0.22,
      shadowRadius: 48,
      shadowOffset: { width: 0, height: 16 },
      elevation: 12,
    },
  },
} as const;

export type ElevationKey = keyof typeof elevation;

/** Icon sizes in px. */
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/**
 * Control heights in px. `md` (48) is the touch-friendly default; mobile
 * interactive elements must stay >= 44 for thumb ergonomics.
 */
export const controlHeights = {
  sm: 36,
  md: 48,
  lg: 56,
} as const;

/** Minimum touch target (Apple HIG / WCAG 2.2 target size). */
export const minTouchTarget = 44 as const;

/** Opacity steps for disabled/pressed treatments. */
export const opacities = {
  disabled: 0.45,
  pressed: 0.8,
  subtle: 0.6,
} as const;

/** Breakpoints in px for adaptive web layouts (density-independent). */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Content width caps for readable line lengths. */
export const layoutWidths = {
  text: 640,
  narrow: 480,
  wide: 1180,
} as const;

/** Z-index layers, mirroring stacking order across platforms. */
export const zIndices = {
  base: 0,
  raised: 10,
  sticky: 100,
  header: 200,
  dropdown: 300,
  overlay: 400,
  modal: 500,
  toast: 600,
} as const;

/** Motion durations in ms. */
export const durations = {
  instant: 80,
  fast: 150,
  normal: 220,
  slow: 320,
} as const;

/** Motion easing curves (CSS timing functions, usable in RN via easing libs). */
export const easings = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.3, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

// ---------------------------------------------------------------------------
// Typography — a type system, not arbitrary sizes.
// Mobile multiplies sizes by the OS font-scale so Dynamic Type works.
// ---------------------------------------------------------------------------

export const fontFamily = {
  sans: "System",
} as const;

export interface TypeSpec {
  /** Density-independent px at fontScale 1.0. */
  fontSize: number;
  /** Density-independent px line height at fontScale 1.0. */
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
  letterSpacing: number;
}

export const typography: Record<string, TypeSpec> = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700", letterSpacing: 0 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700", letterSpacing: 0 },
  headingXl: { fontSize: 26, lineHeight: 34, fontWeight: "700", letterSpacing: 0 },
  headingLg: { fontSize: 22, lineHeight: 30, fontWeight: "700", letterSpacing: 0 },
  headingMd: { fontSize: 18, lineHeight: 26, fontWeight: "600", letterSpacing: 0 },
  headingSm: { fontSize: 16, lineHeight: 24, fontWeight: "600", letterSpacing: 0 },
  bodyLg: { fontSize: 17, lineHeight: 26, fontWeight: "400", letterSpacing: 0 },
  bodyMd: { fontSize: 15, lineHeight: 23, fontWeight: "400", letterSpacing: 0 },
  bodySm: { fontSize: 13, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0.2 },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "400", letterSpacing: 0.3 },
};

export type TypographyKey = keyof typeof typography;

/** Ordered variant names for documentation and validation. */
export const typographyKeys = Object.keys(typography);

// ---------------------------------------------------------------------------
// Semantic themes — the only colors app code may reference.
// Every name exists in BOTH light and dark; ui packages fail loudly on gaps.
// ---------------------------------------------------------------------------

export interface SemanticColors {
  background: { default: string; subtle: string; elevated: string; inverse: string };
  foreground: { default: string; muted: string; subtle: string; inverse: string };
  border: { default: string; subtle: string; strong: string };
  interactive: { default: string; hover: string; pressed: string; disabled: string };
  status: {
    success: string;
    successSubtle: string;
    warning: string;
    warningSubtle: string;
    danger: string;
    dangerSubtle: string;
    info: string;
    infoSubtle: string;
  };
  nutrition: { protein: string; carbs: string; fat: string };
  focus: string;
}

export const lightColors: SemanticColors = {
  background: {
    default: palettes.neutral[50],
    subtle: palettes.neutral[100],
    elevated: palettes.neutral[0],
    inverse: palettes.neutral[900],
  },
  foreground: {
    default: palettes.neutral[800],
    muted: palettes.neutral[600],
    subtle: palettes.neutral[500],
    inverse: palettes.neutral[50],
  },
  border: {
    default: palettes.neutral[300],
    subtle: palettes.neutral[200],
    strong: palettes.neutral[400],
  },
  interactive: {
    default: palettes.brand[600],
    hover: palettes.brand[500],
    pressed: palettes.brand[800],
    disabled: palettes.neutral[300],
  },
  status: {
    success: palettes.success[500],
    successSubtle: palettes.success[50],
    warning: palettes.warning[500],
    warningSubtle: palettes.warning[50],
    danger: palettes.danger[500],
    dangerSubtle: palettes.danger[50],
    info: palettes.info[500],
    infoSubtle: palettes.info[50],
  },
  nutrition: {
    protein: palettes.brand[600],
    carbs: palettes.warning[500],
    fat: palettes.info[500],
  },
  focus: palettes.brand[500],
};

export const darkColors: SemanticColors = {
  background: {
    default: palettes.neutral[950],
    subtle: palettes.neutral[900],
    elevated: palettes.neutral[800],
    inverse: palettes.neutral[50],
  },
  foreground: {
    default: palettes.neutral[100],
    muted: palettes.neutral[400],
    subtle: palettes.neutral[500],
    inverse: palettes.neutral[900],
  },
  border: {
    default: palettes.neutral[700],
    subtle: palettes.neutral[800],
    strong: palettes.neutral[600],
  },
  interactive: {
    default: palettes.brand[700],
    hover: palettes.brand[600],
    pressed: palettes.brand[800],
    disabled: palettes.neutral[700],
  },
  status: {
    success: palettes.success[500],
    successSubtle: palettes.neutral[950],
    warning: palettes.warning[500],
    warningSubtle: palettes.neutral[950],
    danger: palettes.danger[500],
    dangerSubtle: palettes.neutral[950],
    info: palettes.info[500],
    infoSubtle: palettes.neutral[950],
  },
  nutrition: {
    protein: palettes.brand[400],
    carbs: palettes.warning[500],
    fat: palettes.info[500],
  },
  focus: palettes.brand[300],
};

export const themes = { light: lightColors, dark: darkColors } as const;
export type ThemeName = keyof typeof themes;
export type ColorMode = ThemeName | "system";

// ---------------------------------------------------------------------------
// Helpers — relative luminance / contrast (WCAG 2.2 relative contrast).
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a #rrggbb color. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two #rrggbb colors (>= 1, <= 21). */
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Validation — structural guarantees used by tests and CI.
// ---------------------------------------------------------------------------

/** Recursively collect every leaf string of a theme. */
export function themeColorLeaves(theme: SemanticColors): string[] {
  return collectColorLeaves(theme);
}

function collectColorLeaves(value: object): string[] {
  const leaves: string[] = [];
  for (const child of Object.values(asRecord(value))) {
    if (typeof child === "string") leaves.push(child);
    else if (typeof child === "object" && child !== null) {
      leaves.push(...collectColorLeaves(child));
    }
  }
  return leaves;
}

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/** Assert two themes expose the identical semantic key structure. */
export function assertThemeParity(a: SemanticColors, b: SemanticColors): void {
  const keysOf = (theme: object, prefix = ""): string[] => {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(asRecord(theme))) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") keys.push(path);
      else if (typeof value === "object" && value !== null) keys.push(...keysOf(value, path));
    }
    return keys;
  };
  const aKeys = keysOf(a).sort();
  const bKeys = keysOf(b).sort();
  if (aKeys.length !== bKeys.length || aKeys.some((key, index) => key !== bKeys[index])) {
    throw new Error(
      `Theme parity violated: light has ${aKeys.length} color keys, dark has ${bKeys.length}`,
    );
  }
}

// Backwards-compatible flat aliases used by the first UI primitives and apps.
export const colors = {
  background: {
    primary: lightColors.background.default,
    secondary: lightColors.background.subtle,
    elevated: lightColors.background.elevated,
  },
  text: {
    primary: lightColors.foreground.default,
    secondary: lightColors.foreground.muted,
    inverse: lightColors.foreground.inverse,
    muted: lightColors.foreground.subtle,
  },
  border: {
    default: lightColors.border.default,
    focus: lightColors.focus,
  },
  accent: {
    primary: lightColors.interactive.default,
    secondary: lightColors.status.successSubtle,
    strong: lightColors.interactive.pressed,
  },
  feedback: {
    positive: lightColors.status.success,
    warning: lightColors.status.warning,
    negative: lightColors.status.danger,
  },
} as const;
