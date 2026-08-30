import { describe, expect, test } from "bun:test";

import {
  bucketStart,
  calculateDeltaPercent,
  enumerateBuckets,
  granularityForDays,
  resolvePersonalWindow,
} from "../src/services/analytics";

describe("analytics date and comparison helpers", () => {
  test("uses display-safe granularity for each personal range", () => {
    expect(granularityForDays(7)).toBe("day");
    expect(granularityForDays(30)).toBe("day");
    expect(granularityForDays(90)).toBe("week");
    expect(granularityForDays(365)).toBe("month");
  });

  test("resolves a comparable period ending on the user's local date", () => {
    expect(resolvePersonalWindow("7d", "2026-08-30")).toMatchObject({
      start: "2026-08-24",
      endExclusive: "2026-08-31",
      previousStart: "2026-08-17",
      previousEndExclusive: "2026-08-24",
      days: 7,
      granularity: "day",
    });
  });

  test("never emits Infinity for a previous zero period", () => {
    expect(calculateDeltaPercent(10, 0)).toBeNull();
    expect(calculateDeltaPercent(10, null)).toBeNull();
    expect(calculateDeltaPercent(120, 100)).toBe(20);
  });

  test("buckets weeks from Monday and keeps missing buckets explicit", () => {
    expect(bucketStart("2026-08-26", "week")).toBe("2026-08-24");
    expect(enumerateBuckets("2026-08-24", "2026-08-31", "day")).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
      "2026-08-30",
    ]);
  });
});
