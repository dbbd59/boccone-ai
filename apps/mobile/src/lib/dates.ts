import type { Locale } from "../i18n/translations";

/** Parse a server meal date as a local calendar date, never as UTC. */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + amount);
  return next;
}

export function createCalendarDate(year: number, monthIndex: number, day = 1): Date {
  return new Date(year, monthIndex, day, 12);
}

export type WeekStartsOn = 0 | 1;

/**
 * Week-start policy stays at the date boundary instead of inside the grid.
 * Add locale overrides here as more mobile locales are introduced.
 */
export function getWeekStartsOn(locale: Locale): WeekStartsOn {
  return locale === "it" ? 1 : 0;
}

export function startOfWeek(date: Date, weekStartsOn: WeekStartsOn = 1): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  return addCalendarDays(date, -offset);
}

export function startOfMonth(date: Date): Date {
  return createCalendarDate(date.getFullYear(), date.getMonth());
}

export function addCalendarMonths(date: Date, amount: number): Date {
  return createCalendarDate(date.getFullYear(), date.getMonth() + amount);
}

export function daysInMonth(date: Date): number {
  return createCalendarDate(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function dateInMonth(month: Date, day: number): Date {
  const monthStart = startOfMonth(month);
  return createCalendarDate(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    Math.min(Math.max(day, 1), daysInMonth(monthStart)),
  );
}

export function formatMonthKey(date: Date): string {
  return formatLocalDate(startOfMonth(date)).slice(0, 7);
}

/** Always returns six rows so month changes do not move the selected-day area. */
export function getMonthGrid(date: Date, weekStartsOn: WeekStartsOn): Date[] {
  const firstDay = startOfMonth(date);
  const gridStart = startOfWeek(firstDay, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index));
}

export function getWeekdayLabels(locale: Locale, weekStartsOn: WeekStartsOn): string[] {
  const sunday = new Date(2023, 0, 1, 12);
  return Array.from({ length: 7 }, (_, index) =>
    formatWeekday(addCalendarDays(sunday, (weekStartsOn + index) % 7), locale),
  );
}

export function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function formatReadableDate(
  value: string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "long" }).format(
    parseLocalDate(value),
  );
}

export function formatMonthYear(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

export function formatMonthName(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
}

export function formatWeekday(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" })
    .format(date)
    .toLocaleUpperCase(locale);
}
