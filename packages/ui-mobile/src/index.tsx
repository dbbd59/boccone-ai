/* Shared UI barrel intentionally exports hooks and components together. */
/* eslint-disable react-refresh/only-export-components */

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
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  Platform,
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
  GlassContainer as NativeGlassContainer,
  GlassView as NativeGlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

import {
  borderWidths,
  controlHeights,
  elevation,
  fontFamilies,
  glassOpacities,
  minTouchTarget,
  opacities,
  radii,
  shape,
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
    glass: { ...base.glass, ...override.glass },
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

/** System preference used by functional glass surfaces and motion primitives. */
export function useReducedTransparency(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/** System preference for future transitions; shared so screens do not guess. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

function nativeGlassIsAvailable(reducedTransparency: boolean): boolean {
  return (
    Platform.OS === "ios" &&
    !reducedTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable()
  );
}

function withAlpha(hex: string, opacity: number): string {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Liquid Glass — native iOS 26 with intentional cross-platform fallback.
// ---------------------------------------------------------------------------

export type GlassVariant = "regular" | "clear" | "prominent";

export interface GlassSurfaceProps extends ViewProps {
  variant?: GlassVariant;
  interactive?: boolean;
  tintColor?: string;
}

/** Functional material for floating controls. Content surfaces stay solid. */
export function GlassSurface({
  variant = "regular",
  interactive = false,
  tintColor,
  style,
  children,
  ...props
}: PropsWithChildren<GlassSurfaceProps>) {
  const { colors, themeName } = useTheme();
  const reducedTransparency = useReducedTransparency();
  const nativeGlass = nativeGlassIsAvailable(reducedTransparency);

  if (nativeGlass) {
    return (
      <NativeGlassView
        {...props}
        colorScheme={themeName}
        glassEffectStyle={variant === "clear" ? "clear" : "regular"}
        isInteractive={interactive}
        tintColor={variant === "prominent" ? (tintColor ?? colors.glass.tintAccent) : tintColor}
        style={[styles.glassSurface, { borderRadius: shape.floating }, style]}
      >
        {children}
      </NativeGlassView>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.glassSurface,
        {
          backgroundColor: withAlpha(colors.glass[variant], glassOpacities.fallback),
          borderColor: withAlpha(colors.glass.borderFallback, glassOpacities.border),
          borderRadius: shape.floating,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface GlassContainerProps extends PropsWithChildren<ViewProps> {
  mergeSpacing?: number;
}

/** Groups related glass controls so native iOS can merge their lensing. */
export function GlassContainer({
  mergeSpacing = spacing[2],
  style,
  children,
  ...props
}: GlassContainerProps) {
  const reducedTransparency = useReducedTransparency();
  if (nativeGlassIsAvailable(reducedTransparency)) {
    return (
      <NativeGlassContainer {...props} spacing={mergeSpacing} style={style}>
        {children}
      </NativeGlassContainer>
    );
  }
  return (
    <View {...props} style={[styles.floatingGlassBar, { gap: mergeSpacing }, style]}>
      {children}
    </View>
  );
}

export interface FloatingGlassBarProps extends PropsWithChildren<ViewProps> {
  mergeSpacing?: number;
}

export function FloatingGlassBar({
  mergeSpacing,
  style,
  children,
  ...props
}: FloatingGlassBarProps) {
  return (
    <GlassContainer {...props} mergeSpacing={mergeSpacing} style={[styles.floatingGlassBar, style]}>
      {children}
    </GlassContainer>
  );
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

function fontFamilyForWeight(weight: (typeof typography)[string]["fontWeight"]): string {
  switch (weight) {
    case "500":
      return fontFamilies.medium;
    case "600":
      return fontFamilies.semibold;
    case "700":
      return fontFamilies.bold;
    default:
      return fontFamilies.regular;
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
          fontFamily: fontFamilyForWeight(spec?.fontWeight ?? "400"),
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

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "glass" | "glassProminent";
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
        label: colors.foreground.onInteractive,
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
        label: colors.foreground.onInteractive,
      };
    case "glass":
      return {
        background: "transparent",
        pressed: "transparent",
        label: colors.foreground.default,
      };
    case "glassProminent":
      return {
        background: "transparent",
        pressed: "transparent",
        label: colors.foreground.onInteractive,
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
  const isGlass = variant === "glass" || variant === "glassProminent";

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        !isGlass && {
          minHeight,
          backgroundColor: palette.background,
          borderRadius: radii.md,
          opacity: isDisabled ? opacities.disabled : 1,
          paddingHorizontal: size === "sm" ? spacing[3] : spacing[5],
        },
        isGlass && { minHeight, borderRadius: shape.floating, overflow: "hidden" },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && !isGlass && { backgroundColor: palette.pressed },
        pressed && !isDisabled && isGlass && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {isGlass ? (
        <GlassSurface
          pointerEvents="none"
          variant={variant === "glassProminent" ? "prominent" : "regular"}
          interactive
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
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
              fontFamily: fontFamilies.semibold,
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

export interface GlassButtonProps extends Omit<ButtonProps, "variant"> {
  prominence?: "regular" | "prominent";
}

export function GlassButton({ prominence = "regular", ...props }: GlassButtonProps) {
  return <Button {...props} variant={prominence === "prominent" ? "glassProminent" : "glass"} />;
}

export interface GlassIconButtonProps extends Omit<GlassButtonProps, "children"> {
  icon: ReactNode;
  accessibilityLabel: string;
}

export function GlassIconButton({ icon, ...props }: GlassIconButtonProps) {
  return (
    <GlassButton {...props} size="sm">
      {icon}
    </GlassButton>
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
        {required ? <NativeText style={{ color: fieldColors.status.danger }}> *</NativeText> : null}
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
      selectionColor={colors.interactive.default}
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

export interface PasswordInputProps extends InputProps {
  showLabel?: string;
  hideLabel?: string;
}

/** Password field with a visible, touch-friendly show/hide control. */
export function PasswordInput({
  showLabel = "Show",
  hideLabel = "Hide",
  style,
  ...props
}: PasswordInputProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.passwordWrap}>
      <Input {...props} secureTextEntry={!visible} style={[styles.passwordInput, style]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? hideLabel : showLabel}
        accessibilityState={{ expanded: visible }}
        hitSlop={4}
        onPress={() => setVisible((current) => !current)}
        style={({ pressed }) => [styles.passwordToggle, pressed && { opacity: opacities.pressed }]}
      >
        <NativeText style={[styles.passwordToggleLabel, { color: colors.interactive.default }]}>
          {visible ? hideLabel : showLabel}
        </NativeText>
      </Pressable>
    </View>
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

export interface ComingSoonProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
}

/** Honest placeholder for planned destinations; never implies unavailable data exists. */
export function ComingSoon({
  title,
  message,
  actionLabel,
  onAction,
  illustration,
}: ComingSoonProps) {
  return (
    <View style={styles.comingSoon}>
      {illustration ? (
        <GlassSurface style={styles.comingSoonIllustration} variant="clear">
          {illustration}
        </GlassSurface>
      ) : null}
      <Stack gap="xs">
        <Text variant="headingLg">{title}</Text>
        <Text tone="secondary">{message}</Text>
      </Stack>
      {actionLabel && onAction ? (
        <Button variant="ghost" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utilities re-exported for app convenience.
// ---------------------------------------------------------------------------

export { InlineLink } from "./inline-link";

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.regular,
  },
  fieldLabelText: {
    fontFamily: fontFamilies.semibold,
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
  glassSurface: {
    overflow: "hidden",
  },
  floatingGlassBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontFamily: fontFamilies.semibold,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  field: {
    gap: spacing[1],
  },
  fieldLabel: {
    ...labelSpec,
    fontFamily: fontFamilies.semibold,
  },
  fieldHelp: {
    ...captionSpec,
    fontFamily: fontFamilies.regular,
  },
  input: {
    minHeight: controlHeights.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    fontSize: bodyMdSpec?.fontSize,
    fontFamily: fontFamilies.regular,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: spacing[10],
  },
  passwordToggle: {
    position: "absolute",
    right: spacing[1],
    top: spacing[1],
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: radii.sm,
  },
  passwordToggleLabel: {
    ...labelSpec,
    fontFamily: fontFamilies.semibold,
  },
  alert: {
    borderWidth: borderWidths.hairline,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  alertText: {
    ...bodySmSpec,
    fontFamily: fontFamilies.regular,
  },
  comingSoon: {
    gap: spacing[5],
  },
  comingSoonIllustration: {
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 148,
    padding: spacing[4],
  },
});
