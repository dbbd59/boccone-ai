import { describe, expect, test } from "bun:test";

import {
  addCalendarMonths,
  createCalendarDate,
  dateInMonth,
  daysInMonth,
  formatLocalDate,
  getMonthGrid,
  getWeekdayLabels,
  getWeekStartsOn,
  isValidCalendarDate,
  parseLocalDate,
} from "./dates";

describe("calendar date utilities", () => {
  test("creates a stable six-row month grid", () => {
    const grid = getMonthGrid(new Date(2026, 7, 1, 12), 1);

    expect(grid).toHaveLength(42);
    expect(formatLocalDate(grid[0])).toBe("2026-07-27");
    expect(formatLocalDate(grid[41])).toBe("2026-09-06");
    expect(grid.filter((date) => date.getMonth() === 7)).toHaveLength(31);
  });

  test("handles leap-year February", () => {
    expect(daysInMonth(new Date(2024, 1, 1, 12))).toBe(29);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isValidCalendarDate("2025-02-29")).toBe(false);
  });

  test("keeps locale week-start policy outside rendering", () => {
    expect(getWeekStartsOn("it")).toBe(1);
    expect(getWeekStartsOn("en")).toBe(0);
    expect(getWeekdayLabels("it", getWeekStartsOn("it"))[0]).toBe("LUN");
    expect(getWeekdayLabels("en", getWeekStartsOn("en"))[0]).toBe("SUN");
  });

  test("handles year boundaries without changing the calendar day", () => {
    expect(formatLocalDate(addCalendarMonths(new Date(2026, 11, 1, 12), 1))).toBe("2027-01-01");
    expect(formatLocalDate(addCalendarMonths(new Date(2026, 0, 1, 12), -1))).toBe("2025-12-01");
  });

  test("clamps month selection to the target month's last day", () => {
    expect(formatLocalDate(dateInMonth(createCalendarDate(2026, 1), 31))).toBe("2026-02-28");
  });

  test("parses date-only meal values as local calendar dates", () => {
    const date = parseLocalDate("2026-08-30");
    expect(formatLocalDate(date)).toBe("2026-08-30");
    expect(date.getHours()).toBe(12);
  });
});
