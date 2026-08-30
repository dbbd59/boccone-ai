import { describe, expect, test } from "bun:test";

import { notificationIdFor, type RoutineScheduler, type RoutineSchedule } from "./routine-schedule";
import { syncRoutineNotifications } from "./routine-notifications";

function schedule(overrides: Partial<RoutineSchedule> = {}): RoutineSchedule {
  return {
    weekdays: [0, 1, 2, 3, 4],
    localTime: "08:00",
    isReminderEnabled: true,
    ...overrides,
  };
}

/** In-memory fake implementing the scheduler port (no expo-notifications). */
function fakeScheduler(granted = true) {
  let permission: "undetermined" | "granted" | "denied" = granted ? "granted" : "denied";
  const schedules = new Map<string, number>();
  const scheduler: RoutineScheduler = {
    permission() {
      return Promise.resolve(permission);
    },
    requestPermission() {
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
  return { scheduler, schedules };
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
    await syncRoutineNotifications(fake.scheduler, [{ id: "r1", schedule: schedule() }]);
    expect(fake.schedules.has("r1")).toBe(true);
    expect(fake.schedules.has("r2")).toBe(false);
  });

  test("permission denied clears all and never schedules", async () => {
    const fake = fakeScheduler(false);
    await syncRoutineNotifications(fake.scheduler, [{ id: "r1", schedule: schedule() }]);
    expect(fake.schedules.size).toBe(0);
  });
});
