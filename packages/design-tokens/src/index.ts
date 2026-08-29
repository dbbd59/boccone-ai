export const colors = {
  background: {
    primary: "#fffaf3",
    secondary: "#f4eadb",
    elevated: "#ffffff",
  },
  text: {
    primary: "#243127",
    secondary: "#66736a",
    inverse: "#ffffff",
    muted: "#8c988f",
  },
  border: {
    default: "#e5dacb",
    focus: "#4f8f5b",
  },
  accent: {
    primary: "#367b45",
    secondary: "#e8f3e8",
    strong: "#245c31",
  },
  feedback: {
    positive: "#2f7c4b",
    warning: "#a66b21",
    negative: "#b64747",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "400" as const },
} as const;

export const shadows = {
  card: {
    shadowColor: "#243127",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;
