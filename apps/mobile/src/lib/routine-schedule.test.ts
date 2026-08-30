import { describe, expect, test } from "bun:test";

import {
  firesOnDate,
  isoWeekday,
  nextFireDate,
  notificationIdFor,
  parseLocalTime,
  payloadFor,
  type RoutineSchedule,
  type RoutineScheduler,
} from "./routine-schedule";
import { syncRoutineNotifications } from "./routine-schedule";

function schedule(overrides: Partial<RoutineSchedule> = {}): RoutineSchedule {
  return {
    weekdays: [0, 1, 2, 3, 4],
    localTime: "08:00",
    isReminderEnabled: true,
    ...overrides,
  };
}

// Wednesday 2026-07-15, 10:30 local.
const WEDNESDAY = new Date(2026, 6, 15, 10, 30, 0, 0);

describe("isoWeekday", () => {
  test("maps JS getDay to ISO order (Mon=0..Sun=6)", () => {
    expect(isoWeekday(new Date(2026, 6, 13))).toBe(0); // Monday
    expect(isoWeekday(new Date(2026, 6, 15))).toBe(2); // Wednesday
    expect(isoWeekday(new Date(2026, 6, 19))).toBe(6); // Sunday
  });
});

describe("parseLocalTime", () => {
  test("parses HH:MM", () => {
    expect(parseLocalTime("08:05")).toEqual({ hours: 8, minutes: 5 });
    expect(parseLocalTime("23:59")).toEqual({ hours: 23, minutes: 59 });
  });
});

describe("firesOnDate", () => {
  test("weekday routine fires on weekdays only", () => {
    expect(firesOnDate(schedule(), new Date(2026, 6, 15))).toBe(true); // Wed
    expect(firesOnDate(schedule(), new Date(2026, 6, 18))).toBe(false); // Sat
  });

  test("empty weekday set means every day", () => {
    expect(firesOnDate(schedule({ weekdays: [] }), new Date(2026, 6, 18))).toBe(true);
  });

  test("disabled routine never fires", () => {
    expect(firesOnDate(schedule({ isReminderEnabled: false }), new Date(2026, 6, 15))).toBe(false);
  });
});

describe("nextFireDate", () => {
  test("same day later time wins", () => {
    // Wed 10:30 → routine Wed 08:00 already passed → next is Thu 08:00.
    const next = nextFireDate(schedule(), WEDNESDAY);
    expect(next).toEqual(new Date(2026, 6, 16, 8, 0, 0, 0));
  });

  test("same day earlier time fires today", () => {
    const from = new Date(2026, 6, 15, 7, 0, 0, 0);
    const next = nextFireDate(schedule(), from);
    expect(next).toEqual(new Date(2026, 6, 15, 8, 0, 0, 0));
  });

  test("weekend-only routine skips weekdays", () => {
    const weekend = schedule({ weekdays: [5, 6] });
    const next = nextFireDate(weekend, WEDNESDAY);
    expect(next).toEqual(new Date(2026, 6, 18, 8, 0, 0, 0)); // Saturday
  });

  test("every-day routine fires tomorrow when today passed", () => {
    const everyDay = schedule({ weekdays: [] });
    const next = nextFireDate(everyDay, WEDNESDAY);
    expect(next).toEqual(new Date(2026, 6, 16, 8, 0, 0, 0));
  });

  test("DST spring-forward keeps wall-clock time (US 2026: Mar 8, 02:00 → 03:00)", () => {
    // Saturday Mar 7 2026, 12:00. Next fire: Sunday 08:00, which is only
    // 20 wall hours later despite 21 real hours elapsing.
    const before = new Date(2026, 2, 7, 12, 0, 0, 0);
    const next = nextFireDate(schedule({ weekdays: [6] }), before);
    expect(next).toEqual(new Date(2026, 2, 8, 8, 0, 0, 0));
  });

  test("disabled routine returns null", () => {
    expect(nextFireDate(schedule({ isReminderEnabled: false }), WEDNESDAY)).toBeNull();
  });
});

describe("notification payload", () => {
  test("stable id and typed payload", () => {
    expect(notificationIdFor("r-123")).toBe("boccone-routine-r-123");
    expect(payloadFor("r-123")).toEqual({ type: "ROUTINE_REMINDER", routineId: "r-123" });
  });
});

/** In-memory fake implementing the scheduler port. */
function fakeScheduler(granted = true) {
  let permission: "undetermined" | "granted" | "denied" = granted ? "granted" : "denied";
  const schedules = new Map<string, number>(); // routineId -> trigger count
  let requests = 0;
  const scheduler: RoutineScheduler = {
    permission() {
      return Promise.resolve(permission);
    },
    requestPermission() {
      requests += 1;
      permission = granted ? "granted" : "denied";
      return Promise.resolve(permission);
    },
    scheduledIds() {
      return Promise.resolve([...schedules.keys()]);
    },
    scheduleWeekly(routineId) {
      schedules.set(routineId, (schedules.get(routineId) ?? 0) + 1);
      return Promise.resolve(notificationIdFor(routineId));
    },
    cancel(routineId) {
      schedules.delete(routineId);
      return Promise.resolve();
    },
    cancelAll() {
      schedules.clear();
      return Promise.resolve();
    },
  };
  return {
    scheduler,
    schedules,
    get permissionValue() {
      return permission;
    },
    get requestCount() {
      return requests;
    },
  };
}

describe("syncRoutineNotifications", () => {
  test("schedules enabled routines", async () => {
    const fake = fakeScheduler();
    await syncRoutineNotifications(fake.scheduler, [
      { id: "r1", schedule: schedule() },
      { id: "r2", schedule: schedule() },
    ]);
    expect(fake.schedules.has("r1")).toBe(true);
    expect(fake.schedules.has("r2")).toBe(true);
  });

  test("is idempotent — no duplicate schedules on re-sync", async () => {
    const fake = fakeScheduler();
    const routines = [{ id: "r1", schedule: schedule() }];
    await syncRoutineNotifications(fake.scheduler, routines);
    const afterFirst = fake.schedules.get("r1");
    await syncRoutineNotifications(fake.scheduler, routines);
    expect(fake.schedules.get("r1")).toBe(afterFirst);
  });

  test("cancels disabled and deleted routines", async () => {
    const fake = fakeScheduler();
    await syncRoutineNotifications(fake.scheduler, [
      { id: "r1", schedule: schedule() },
      { id: "r2", schedule: schedule() },
    ]);
    // r2 disabled, r3 deleted (never comes back).
    await syncRoutineNotifications(fake.scheduler, [{ id: "r1", schedule: schedule() }]);
    expect(fake.schedules.has("r1")).toBe(true);
    expect(fake.schedules.has("r2")).toBe(false);
  });

  test("permission denied clears all and never schedules", async () => {
    const fake = fakeScheduler(false);
    await syncRoutineNotifications(fake.scheduler, [{ id: "r1", schedule: schedule() }]);
    expect(fake.schedules.size).toBe(0);
  });

  test("re-editing an existing routine does not duplicate", async () => {
    const fake = fakeScheduler();
    await syncRoutineNotifications(fake.scheduler, [
      { id: "r1", schedule: schedule({ localTime: "08:00" }) },
    ]);
    await syncRoutineNotifications(fake.scheduler, [
      { id: "r1", schedule: schedule({ localTime: "09:00" }) },
    ]);
    expect(fake.schedules.get("r1")).toBe(1);
  });
});
