import { Button, useTheme, type ColorMode } from "@boccone/ui-web";

import { storeColorMode } from "../lib/color-mode";

const NEXT_MODE: Record<ColorMode, ColorMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<ColorMode, string> = {
  light: "☀ Light",
  dark: "☾ Dark",
  system: "◐ System",
};

/** Cycles light → dark → system and persists the choice in localStorage. */
export function ThemeToggle() {
  const { colorMode, setColorMode } = useTheme();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label={`Color theme: ${colorMode}. Click to switch to ${NEXT_MODE[colorMode]}.`}
      title={`Color theme: ${colorMode}`}
      onClick={() => {
        const next = NEXT_MODE[colorMode];
        storeColorMode(next);
        setColorMode(next);
      }}
    >
      {LABEL[colorMode]}
    </Button>
  );
}
