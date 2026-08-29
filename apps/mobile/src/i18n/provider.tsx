import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { I18nContext } from "./context";
import { detectDeviceLocale, isLocale, translations, type Locale } from "./translations";

const LOCALE_STORAGE_KEY = "boccone.locale";

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(detectDeviceLocale);

  useEffect(() => {
    let active = true;
    void readStoredLocale()
      .then((storedLocale) => {
        if (active && storedLocale) setLocaleState(storedLocale);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await persistLocale(nextLocale).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ locale, copy: translations[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

async function readStoredLocale(): Promise<Locale | null> {
  const storedValue =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
      : await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
  return isLocale(storedValue) ? storedValue : null;
}

async function persistLocale(locale: Locale): Promise<void> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    return;
  }
  await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, locale);
}
