/* Shared UI barrel intentionally exports hooks and components together. */
/* eslint-disable react-refresh/only-export-components */

/**
 * Boccone AI — React (web) UI primitives.
 *
 * Mirrors @boccone/ui-mobile: same component names, same variant/tone
 * vocabularies, same semantic token source. Web-specific behavior lives
 * here: semantic HTML, :focus-visible rings, hover states, media-query
 * theming via CSS custom properties.
 *
 * Theme contract: styles.css defines --bc-* variables for both themes
 * ([data-bc-theme="light" | "dark"] on <html>); ThemeProvider keeps the
 * attribute in sync so "system" mode follows prefers-color-scheme.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import {
  breakpoints,
  fontFamily,
  minTouchTarget,
  themes,
  type ColorMode,
  type SemanticColors,
  type ThemeName,
} from "@boccone/design-tokens";

// ---------------------------------------------------------------------------
// Theme provider — mirrors the mobile API surface.
// ---------------------------------------------------------------------------

export type ThemeOverride = Partial<SemanticColors>;

export interface ThemeContextValue {
  themeName: ThemeName;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  colors: SemanticColors;
  override?: ThemeOverride;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

export interface ThemeProviderProps extends PropsWithChildren {
  colorMode?: ColorMode;
  defaultColorMode?: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
  override?: ThemeOverride;
}

export function ThemeProvider({
  children,
  colorMode,
  defaultColorMode = "system",
  onColorModeChange,
  override,
}: ThemeProviderProps) {
  const [internalMode, setInternalMode] = useState<ColorMode>(defaultColorMode);
  const mode = colorMode ?? internalMode;

  // Resolve "system" against prefers-color-scheme and keep <html> in sync.
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const themeName: ThemeName = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-bc-theme", themeName);
  }, [themeName]);

  const setColorMode = useCallback(
    (next: ColorMode) => {
      if (colorMode === undefined) setInternalMode(next);
      onColorModeChange?.(next);
    },
    [colorMode, onColorModeChange],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      colorMode: mode,
      setColorMode,
      colors: resolveOverride(themes[themeName], override),
      override,
    }),
    [themeName, mode, override, setColorMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside <ThemeProvider> (see @boccone/ui-web)");
  }
  return value;
}

// ---------------------------------------------------------------------------
// Text — semantic elements with typography variant classes.
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

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "label" | "strong" | "div";

const variantToElement: Record<string, TextElement> = {
  display: "h1",
  headingXl: "h1",
  headingLg: "h2",
  headingMd: "h3",
  headingSm: "h4",
};

export interface BocconeTextProps extends HTMLAttributes<HTMLElement> {
  variant?: string;
  tone?: TextTone;
  as?: TextElement;
  children?: ReactNode;
}

export function Text({
  variant = "bodyMd",
  tone = "default",
  as,
  style,
  className,
  ...props
}: BocconeTextProps) {
  const Element = as ?? variantToElement[variant] ?? "p";
  return (
    <Element
      {...props}
      data-variant={variant}
      data-tone={tone}
      className={`bc-text${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// Layout primitives — Stack / Inline / Divider / Surface / Screen / Container.
// ---------------------------------------------------------------------------

export interface StackProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  padding?: number;
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
    <div
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `var(--bc-space-${gap}, ${gap * 4}px)`,
        alignItems:
          align === "stretch"
            ? "stretch"
            : align === "start"
              ? "flex-start"
              : align === "end"
                ? "flex-end"
                : "center",
        padding: padding !== undefined ? `var(--bc-space-${padding}, ${padding * 4}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface InlineProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  gap?: number;
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
    <div
      {...props}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: `var(--bc-space-${gap}, ${gap * 4}px)`,
        alignItems:
          align === "stretch"
            ? "stretch"
            : align === "start"
              ? "flex-start"
              : align === "end"
                ? "flex-end"
                : "center",
        justifyContent:
          justify === "between"
            ? "space-between"
            : justify === "end"
              ? "flex-end"
              : justify === "center"
                ? "center"
                : "flex-start",
        flexWrap: wrap ? "wrap" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ style }: { style?: React.CSSProperties }) {
  return (
    <hr
      style={{
        border: 0,
        borderTop: "1px solid var(--bc-border-subtle)",
        width: "100%",
        margin: 0,
        ...style,
      }}
    />
  );
}

export function Surface({
  children,
  style,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section {...props} className={`bc-surface${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </section>
  );
}

export type GlassVariant = "regular" | "clear" | "prominent";

export interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  variant?: GlassVariant;
}

/** Web material for functional floating controls; content remains standard surface. */
export function GlassSurface({
  variant = "regular",
  children,
  className,
  ...props
}: PropsWithChildren<GlassSurfaceProps>) {
  return (
    <section
      {...props}
      data-glass-variant={variant}
      className={`bc-glass bc-glass-${variant}${className ? ` ${className}` : ""}`}
    >
      {children}
    </section>
  );
}

export function Screen({
  children,
  style,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div {...props} className={`bc-screen${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}

export function Container({
  children,
  width = "wide",
  style,
}: PropsWithChildren<{ width?: "narrow" | "text" | "wide"; style?: React.CSSProperties }>) {
  const maxWidth = width === "narrow" ? 480 : width === "text" ? 640 : breakpoints.lg;
  return (
    <div style={{ maxWidth, marginLeft: "auto", marginRight: "auto", width: "100%", ...style }}>
      {children}
    </div>
  );
}

export interface BoxProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  padding?: number;
  backgroundColor?: "default" | "subtle" | "elevated" | "inverse";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "pill";
}

export function Box({
  padding,
  backgroundColor,
  borderRadius,
  children,
  className,
  style,
  ...props
}: BoxProps) {
  return (
    <div
      {...props}
      className={`bc-box${className ? ` ${className}` : ""}`}
      data-background={backgroundColor}
      data-radius={borderRadius}
      style={{
        padding: padding !== undefined ? `var(--bc-space-${padding}, ${padding * 4}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions — Button with variants/sizes/loading; focus-visible ring in CSS.
// ---------------------------------------------------------------------------

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "destructive" | "glass" | "glassProminent";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`bc-button bc-button-${variant} bc-button-${size}${fullWidth ? " bc-button-full" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {loading ? <span className="bc-spinner" aria-hidden="true" /> : null}
      <span className="bc-button-label">{children}</span>
    </button>
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
  "aria-label": string;
}

export function GlassIconButton({ icon, ...props }: GlassIconButtonProps) {
  return (
    <GlassButton {...props} size="sm">
      {icon}
    </GlassButton>
  );
}

// ---------------------------------------------------------------------------
// Forms — Field with label/description/error association via ids.
// ---------------------------------------------------------------------------

export interface FieldProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  fieldId: string;
}

export function Field({
  label,
  description,
  error,
  required,
  fieldId,
  children,
  ...props
}: FieldProps) {
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  return (
    <div {...props} className="bc-field">
      <label className="bc-field-label" htmlFor={fieldId}>
        {label}
        {required ? (
          <span className="bc-required" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {description && !error ? (
        <p id={descriptionId} className="bc-field-help">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="bc-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  describedBy?: string;
}

export function Input({ invalid = false, describedBy, className, style, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={`bc-input${invalid ? " bc-input-invalid" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// Feedback — Alert.
// ---------------------------------------------------------------------------

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  message: string;
}

export function Alert({ tone = "info", message }: AlertProps) {
  return (
    <div role="alert" className={`bc-alert bc-alert-${tone}`}>
      {message}
    </div>
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
    <Surface className="bc-coming-soon">
      {illustration ? <div className="bc-coming-soon-illustration">{illustration}</div> : null}
      <Stack gap={2}>
        <Text variant="headingLg">{title}</Text>
        <Text tone="secondary">{message}</Text>
      </Stack>
      {actionLabel && onAction ? (
        <Button variant="ghost" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Surface>
  );
}

// Theme tokens re-exported for consumers that need the SemanticColors type.
export type { SemanticColors, ThemeName, ColorMode } from "@boccone/design-tokens";
export { fontFamily, minTouchTarget };

export function useThemeColors(): SemanticColors {
  return useTheme().colors;
}
