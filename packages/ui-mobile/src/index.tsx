/**
 * Boccone AI — React Native UI primitives.
 *
 * Layer 2 of the design system: resolves shared semantic tokens
 * (@boccone/design-tokens) into React Native styles and components.
 *
 * Conventions:
 * - Every component reads semantic tokens through `useTheme()`, never raw
 *   palette colors, so light/dark/system theming works everywhere.
 * - Interactive components guarantee a >= 44px touch target
 *   (`minTouchTarget` from @boccone/design-tokens).
 * - Components accept `style`/`contentStyle` overrides as escape hatches;
 *   variants, not booleans, drive appearance.
 * - Accessibility: roles/labels map to RN accessibility APIs; text scales
 *   with the OS font setting (allowFontScaling stays on).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  View,
  useColorScheme,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import {
  borderWidths,
  controlHeights,
  elevation,
  fontFamily,
  minTouchTarget,
  opacities,
  radii,
  spacing,
  themes,
  typography,
  type ColorMode,
  type SemanticColors,
  type SpacingKey,
  type ThemeName,
  type TypographyKey,
} from "@boccone/design-tokens";

// ---------------------------------------------------------------------------
// Theme provider — light / dark / system with an overridable resolver.
// ---------------------------------------------------------------------------

export type ThemeOverride = Partial<SemanticColors>;

export interface ThemeContextValue {
  /** The active resolved theme colors. */
  colors: SemanticColors;
  /** Which theme name is active after resolution. */
  themeName: ThemeName;
  /** The requested mode ("system" follows the OS). */
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  /** Per-key color overrides merged over the active theme (rare escape hatch). */
  override?: ThemeOverride;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends PropsWithChildren {
  /** "light" | "dark" | "system" (default). */
  colorMode?: ColorMode;
  /** Uncontrolled initial mode when the consumer manages persistence itself. */
  defaultColorMode?: ColorMode;
  /** Controlled mode + change callback for apps that persist the choice. */
  onColorModeChange?: (mode: ColorMode) => void;
  /** Static color overrides merged over the active theme. */
  override?: ThemeOverride;
}

function resolveOverride(base: SemanticColors, override?: ThemeOverride): SemanticColors {
  if (!override) return base;
  return {
    background: { ...base.background, ...override.background },
    foreground: { ...base.foreground, ...override.foreground },
    border: { ...base.border, ...override.border },
    interactive: { ...base.interactive, ...override.interactive },
    status: { ...base.status, ...override.status },
    nutrition: { ...base.nutrition, ...override.nutrition },
    focus: override.focus ?? base.focus,
  };
}

export function ThemeProvider({
  children,
  colorMode,
  defaultColorMode = "system",
  onColorModeChange,
  override,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [internalMode, setInternalMode] = useState<ColorMode>(defaultColorMode);

  const mode = colorMode ?? internalMode;
  const themeName: ThemeName =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const setColorMode = useCallback(
    (next: ColorMode) => {
      if (colorMode === undefined) setInternalMode(next);
      onColorModeChange?.(next);
    },
    [colorMode, onColorModeChange],
  );

  const value = useMemo<ThemeContextValue>(() => {
    const base = themes[themeName];
    return {
      colors: resolveOverride(base, override),
      themeName,
      colorMode: mode,
      setColorMode,
      override,
    };
  }, [themeName, mode, override, setColorMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside <ThemeProvider> (see @boccone/ui-mobile)");
  }
  return value;
}

/** Convenience hook returning just the resolved semantic colors. */
export function useThemeColors(): SemanticColors {
  return useTheme().colors;
}

// ---------------------------------------------------------------------------
// Text — typography variants + semantic tones, scaled by the OS font setting.
// ---------------------------------------------------------------------------

export type TextTone =
  | "default"
  | "muted"
  | "subtle"
  | "inverse"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "accent"
  | "positive"
  | "negative";

export interface BocconeTextProps extends TextProps {
  variant?: TypographyKey;
  tone?: TextTone;
}

function toneColor(colors: SemanticColors, tone: TextTone): string {
  switch (tone) {
    case "default":
      return colors.foreground.default;
    case "muted":
      return colors.foreground.muted;
    case "subtle":
      return colors.foreground.subtle;
    case "inverse":
      return colors.foreground.inverse;
    case "brand":
      return colors.interactive.default;
    case "success":
      return colors.status.success;
    case "warning":
      return colors.status.warning;
    case "danger":
      return colors.status.danger;
    case "info":
      return colors.status.info;
    case "secondary":
      return colors.foreground.muted;
    case "accent":
      return colors.interactive.default;
    case "positive":
      return colors.status.success;
    case "negative":
      return colors.status.danger;
  }
}

export function Text({ variant = "bodyMd", tone = "default", style, ...props }: BocconeTextProps) {
  const { colors } = useTheme();
  const spec = typography[variant] ?? typography["bodyMd"];
  return (
    <NativeText
      {...props}
      style={[
        styles.text,
        {
          fontSize: spec?.fontSize,
          lineHeight: spec?.lineHeight,
          fontWeight: spec?.fontWeight,
          letterSpacing: spec?.letterSpacing,
          color: toneColor(colors, tone),
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Layout primitives — Box / Stack / Inline / Divider / Surface / Screen.
// ---------------------------------------------------------------------------

export interface BoxProps extends ViewProps {
  padding?: SpacingKey;
  paddingX?: SpacingKey;
  paddingY?: SpacingKey;
  margin?: SpacingKey;
  backgroundColor?: keyof SemanticColors["background"];
  borderRadius?: keyof typeof radii;
}

export function Box({
  padding,
  paddingX,
  paddingY,
  margin,
  backgroundColor,
  borderRadius,
  style,
  ...props
}: BoxProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        padding !== undefined && { padding: spacing[padding] },
        paddingX !== undefined && { paddingHorizontal: spacing[paddingX] },
        paddingY !== undefined && { paddingVertical: spacing[paddingY] },
        margin !== undefined && { margin: spacing[margin] },
        backgroundColor !== undefined && { backgroundColor: colors.background[backgroundColor] },
        borderRadius !== undefined && { borderRadius: radii[borderRadius] },
        style,
      ]}
    />
  );
}

export interface StackProps extends PropsWithChildren<ViewProps> {
  gap?: SpacingKey;
  align?: "start" | "center" | "end" | "stretch";
  padding?: SpacingKey;
}

export function Stack({
  gap = 4,
  align = "stretch",
  padding,
  style,
  children,
  ...props
}: StackProps) {
  return (
    <View
      {...props}
      style={[
        styles.stack,
        { gap: spacing[gap], alignItems: alignMap[align] },
        padding !== undefined && { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface InlineProps extends PropsWithChildren<ViewProps> {
  gap?: SpacingKey;
  align?: "start" | "center" | "end" | "stretch";
  wrap?: boolean;
  justify?: "start" | "center" | "end" | "between";
}

export function Inline({
  gap = 2,
  align = "center",
  wrap = false,
  justify = "start",
  style,
  children,
  ...props
}: InlineProps) {
  return (
    <View
      {...props}
      style={[
        styles.inline,
        { gap: spacing[gap], alignItems: alignMap[align], justifyContent: justifyMap[justify] },
        wrap && { flexWrap: "wrap" },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const alignMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;
const justifyMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
} as const;

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border.subtle }, style]} />;
}

export interface SurfaceProps extends PropsWithChildren<ViewProps> {
  elevation?: keyof typeof elevation;
  padding?: SpacingKey;
}

export function Surface({
  elevation: elevationKey = "raised",
  padding = 6,
  style,
  children,
  ...props
}: SurfaceProps) {
  const { colors } = useTheme();
  const shadow = elevation[elevationKey].native;
  return (
    <View
      {...props}
      style={[
        styles.surface,
        {
          backgroundColor: colors.background.elevated,
          borderRadius: radii.lg,
          padding: spacing[padding],
          borderColor: colors.border.subtle,
          borderWidth: borderWidths.hairline,
          shadowColor: colors.foreground.default,
          shadowOpacity: shadow.shadowOpacity,
          shadowRadius: shadow.shadowRadius,
          shadowOffset: shadow.shadowOffset,
          elevation: shadow.elevation,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface ScreenProps extends PropsWithChildren<ViewProps> {
  /** Disable the default screen padding for full-bleed layouts. */
  bleed?: boolean;
}

export function Screen({ bleed = false, style, children, ...props }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.screen,
        { backgroundColor: colors.background.default },
        !bleed && styles.screenPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Actions — Button with variants, sizes, loading, and 44px+ touch targets.
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

interface ButtonPalette {
  background: string;
  pressed: string;
  label: string;
}

function buttonPalette(colors: SemanticColors, variant: ButtonVariant): ButtonPalette {
  switch (variant) {
    case "primary":
      return {
        background: colors.interactive.default,
        pressed: colors.interactive.pressed,
        label: colors.foreground.inverse,
      };
    case "secondary":
      return {
        background: colors.background.subtle,
        pressed: colors.border.subtle,
        label: colors.foreground.default,
      };
    case "ghost":
      return {
        background: "transparent",
        pressed: colors.background.subtle,
        label: colors.interactive.default,
      };
    case "destructive":
      return {
        background: colors.status.danger,
        pressed: colors.status.danger,
        label: "#ffffff",
      };
  }
}

const buttonHeights: Record<ButtonSize, number> = {
  sm: controlHeights.sm,
  md: controlHeights.md,
  lg: controlHeights.lg,
};

const buttonLabelVariants: Record<ButtonSize, TypographyKey> = {
  sm: "label",
  md: "label",
  lg: "bodyLg",
};

const labelSpec = typography["label"];
const bodyLgSpec = typography["bodyLg"];
const bodyMdSpec = typography["bodyMd"];
const bodySmSpec = typography["bodySm"];
const captionSpec = typography["caption"];

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  labelStyle,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = buttonPalette(colors, variant);
  const isDisabled = disabled === true || loading;
  const minHeight = Math.max(buttonHeights[size], minTouchTarget);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight,
          backgroundColor: palette.background,
          borderRadius: radii.md,
          opacity: isDisabled ? opacities.disabled : 1,
          paddingHorizontal: size === "sm" ? spacing[3] : spacing[5],
        },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && { backgroundColor: palette.pressed },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.label} />
      ) : (
        <NativeText
          style={[
            styles.buttonLabel,
            {
              color: palette.label,
              fontSize: (buttonLabelVariants[size] === "bodyLg" ? bodyLgSpec : labelSpec)?.fontSize,
              fontWeight: labelSpec?.fontWeight,
            },
            labelStyle,
          ]}
        >
          {children}
        </NativeText>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Forms — labeled inputs with error/help text wired for screen readers.
// ---------------------------------------------------------------------------

export interface FieldProps extends PropsWithChildren<ViewProps> {
  label: string;
  /** Optional helper text rendered under the control. */
  description?: string;
  /** Error message; sets invalid state and links it for assistive tech. */
  error?: string;
  required?: boolean;
  /** Stable id used to associate label/control on web (no-op on native). */
  fieldId?: string;
}

export function Field({
  label,
  description,
  error,
  required,
  style,
  children,
  ...props
}: FieldProps) {
  const { colors: fieldColors } = useTheme();
  return (
    <View {...props} accessibilityLabel={label} style={[styles.field, style]}>
      <NativeText style={[styles.fieldLabel, { color: fieldColors.foreground.default }]}>
        {label}
        {required ? <NativeText style={styles.required}> *</NativeText> : null}
      </NativeText>
      {children}
      {description && !error ? (
        <NativeText style={[styles.fieldHelp, { color: fieldColors.foreground.muted }]}>
          {description}
        </NativeText>
      ) : null}
      {error ? (
        <NativeText
          accessibilityRole="alert"
          style={[styles.fieldHelp, { color: fieldColors.status.danger }]}
        >
          {error}
        </NativeText>
      ) : null}
    </View>
  );
}

export interface InputProps extends TextInputProps {
  invalid?: boolean;
}

export function Input({ invalid = false, style, ...props }: InputProps) {
  const { colors } = useTheme();
  return (
    <NativeTextInput
      {...props}
      placeholderTextColor={colors.foreground.subtle}
      style={[
        styles.input,
        {
          color: colors.foreground.default,
          backgroundColor: colors.background.elevated,
          borderColor: invalid ? colors.status.danger : colors.border.default,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Feedback — inline alert used for auth/domain errors and confirmations.
// ---------------------------------------------------------------------------

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  message: string;
}

export function Alert({ tone = "info", message }: AlertProps) {
  const { colors } = useTheme();
  const palette = {
    info: { fg: colors.status.info, bg: colors.status.infoSubtle },
    success: { fg: colors.status.success, bg: colors.status.successSubtle },
    warning: { fg: colors.status.warning, bg: colors.status.warningSubtle },
    danger: { fg: colors.status.danger, bg: colors.status.dangerSubtle },
  }[tone];
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.alert, { backgroundColor: palette.bg, borderColor: palette.fg }]}
    >
      <NativeText style={[styles.alertText, { color: palette.fg }]}>{message}</NativeText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utilities re-exported for app convenience.
// ---------------------------------------------------------------------------

export { InlineLink } from "./inline-link";

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamily.sans,
  },
  fieldLabelText: {
    fontFamily: fontFamily.sans,
  },
  screen: {
    flex: 1,
  },
  screenPadding: {
    padding: spacing[6],
  },
  stack: {
    flexDirection: "column",
  },
  inline: {
    flexDirection: "row",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  surface: {},
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontFamily: fontFamily.sans,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  field: {
    gap: spacing[1],
  },
  fieldLabel: {
    ...labelSpec,
    fontFamily: fontFamily.sans,
  },
  required: {
    color: "#b64747",
  },
  fieldHelp: {
    ...captionSpec,
    fontFamily: fontFamily.sans,
  },
  input: {
    minHeight: controlHeights.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    fontSize: bodyMdSpec?.fontSize,
    fontFamily: fontFamily.sans,
  },
  alert: {
    borderWidth: borderWidths.hairline,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  alertText: {
    ...bodySmSpec,
    fontFamily: fontFamily.sans,
  },
});