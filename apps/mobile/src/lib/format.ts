import type { Locale } from "../i18n/translations";

const localeMap: Record<Locale, string> = {
  en: "en-US",
  it: "it-IT",
};

export function formatNumber(
  value: number | null | undefined,
  locale: Locale,
  maximumFractionDigits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(localeMap[locale], { maximumFractionDigits }).format(value);
}

export function formatKcal(value: number | null | undefined, locale: Locale): string {
  return value === null || value === undefined ? "— kcal" : `${formatNumber(value, locale)} kcal`;
}

export function formatGrams(value: number | null | undefined, locale: Locale): string {
  return value === null || value === undefined ? "— g" : `${formatNumber(value, locale, 1)} g`;
}

export function formatMealTime(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeMap[locale], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
