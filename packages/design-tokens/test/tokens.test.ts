import { describe, expect, it } from "bun:test";

import {
  assertThemeParity,
  contrastRatio,
  darkColors,
  durations,
  easings,
  lightColors,
  minTouchTarget,
  relativeLuminance,
  spacing,
  themeColorLeaves,
  themes,
  typography,
} from "../src/index";

describe("design tokens", () => {
  it("keep light and dark themes structurally identical", () => {
    expect(() => assertThemeParity(lightColors, darkColors)).not.toThrow();
    expect(Object.keys(themes).sort()).toEqual(["dark", "light"]);
  });

  it("expose only valid hex colors in every theme", () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    for (const theme of [lightColors, darkColors]) {
      for (const leaf of themeColorLeaves(theme)) {
        expect(leaf).toMatch(hexPattern);
      }
    }
  });

  it("meet WCAG AA for body text contrast in both themes", () => {
    for (const theme of [lightColors, darkColors]) {
      expect(
        contrastRatio(theme.foreground.default, theme.background.default),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.foreground.muted, theme.background.default),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.foreground.inverse, theme.background.inverse),
      ).toBeGreaterThanOrEqual(4.5);
      // Primary button: white label on interactive default.
      expect(contrastRatio("#ffffff", theme.interactive.default)).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.foreground.onInteractive, theme.glass.prominent),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("meet WCAG AA for status colors on subtle backgrounds", () => {
    for (const theme of [lightColors, darkColors]) {
      expect(contrastRatio(theme.status.danger, theme.status.dangerSubtle)).toBeGreaterThanOrEqual(
        3,
      );
      expect(
        contrastRatio(theme.status.warning, theme.status.warningSubtle),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(theme.status.success, theme.status.successSubtle),
      ).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(theme.status.info, theme.status.infoSubtle)).toBeGreaterThanOrEqual(3);
    }
  });

  it("use a consistent 4pt spacing grid", () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
  });

  it("define every typography variant with positive metrics", () => {
    for (const spec of Object.values(typography)) {
      expect(spec.fontSize).toBeGreaterThan(0);
      expect(spec.lineHeight).toBeGreaterThanOrEqual(spec.fontSize);
      expect(spec.fontWeight.length).toBe(3);
    }
  });

  it("enforce the 44px minimum touch target constant", () => {
    expect(minTouchTarget).toBe(44);
  });

  it("define motion tokens with ordered durations and valid easings", () => {
    const values = Object.values(durations);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    for (const curve of Object.values(easings)) {
      expect(curve).toMatch(/^cubic-bezier\(/);
    }
  });

  it("compute WCAG luminance bounds correctly", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});
