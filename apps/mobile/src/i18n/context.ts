import { createContext, useContext } from "react";

import type { Locale, TranslationCopy } from "./translations";

export interface I18nContextValue {
  locale: Locale;
  copy: TranslationCopy;
  setLocale: (locale: Locale) => Promise<void>;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
