import type { ColorMode } from "@boccone/ui-web";

const STORAGE_KEY = "boccone.admin.colorMode";

export function readStoredColorMode(): ColorMode | undefined {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : undefined;
  } catch {
    return undefined;
  }
}

export function storeColorMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private mode / storage disabled — the toggle still works this session.
  }
}
