import { z } from "zod";

/**
 * Recurrence for a routine reminder, evaluated in the device's local
 * wall-clock time. Weekdays are ISO-ordered: 0=Monday .. 6=Sunday.
 * An empty weekday set means "every day".
 */
export const routineWeekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .refine((days) => new Set(days).size === days.length, "Weekdays must be unique");
export type RoutineWeekdays = z.infer<typeof routineWeekdaysSchema>;

/** Local wall-clock time, HH:MM (24h). */
export const routineLocalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:MM format");

export interface RoutineSchedule {
  weekdays: number[];
  localTime: string;
  isReminderEnabled: boolean;
}

/** Parse "HH:MM" into { hours, minutes }. */
export function parseLocalTime(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * JS getDay() (0=Sunday) → ISO weekday (0=Monday..6=Sunday).
 */
export function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Does this routine fire on the given local date? Empty weekday set = every day. */
export function firesOnDate(schedule: RoutineSchedule, date: Date): boolean {
  if (!schedule.isReminderEnabled) return false;
  if (schedule.weekdays.length === 0) return true;
  return schedule.weekdays.includes(isoWeekday(date));
}

/**
 * The next firing instant (device-local wall clock) strictly after `from`.
 * Calendar-based: walks day by day and pins the wall-clock time, so DST
 * shifts keep 08:00 at 08:00 local instead of drifting by an hour.
 */
export function nextFireDate(schedule: RoutineSchedule, from: Date): Date | null {
  if (!schedule.isReminderEnabled) return null;
  const { hours, minutes } = parseLocalTime(schedule.localTime);

  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + dayOffset);
    if (!firesOnDate(schedule, day)) continue;
    const candidate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hours,
      minutes,
      0,
      0,
    );
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  return null;
}

/** Stable native-notification identifier for a routine. */
export function notificationIdFor(routineId: string): string {
  return `boccone-routine-${routineId}`;
}

/** Payload attached to every Boccone routine notification. */
export interface RoutineNotificationPayload {
  type: "ROUTINE_REMINDER";
  routineId: string;
}

export function payloadFor(routineId: string): RoutineNotificationPayload {
  return { type: "ROUTINE_REMINDER", routineId };
}

/**
 * Pure scheduler port. The Expo implementation wraps expo-notifications;
 * tests inject a fake. Schedules are calendar-based (weekly repeats pinned
 * to local wall-clock time) so DST does not cause drift.
 */
export interface ScheduledTrigger {
  routineId: string;
  /** ISO string of the next fire time (informational; platform owns repeats). */
  nextFireISO: string;
}

export interface RoutineScheduler {
  /** Current permission status: undetermined / granted / denied. */
  permission(): Promise<"undetermined" | "granted" | "denied">;
  /** Request permission. Returns the resulting status. */
  requestPermission(): Promise<"undetermined" | "granted" | "denied">;
  /** All Boccone routine notification ids currently scheduled. */
  scheduledIds(): Promise<string[]>;
  /** (Re)schedule a weekly-repeating calendar trigger. Returns the native id. */
  scheduleWeekly(routineId: string, schedule: RoutineSchedule): Promise<string>;
  /** Cancel one notification by Boccone routine id. */
  cancel(routineId: string): Promise<void>;
  /** Cancel every Boccone routine notification. */
  cancelAll(): Promise<void>;
}

export interface RoutineForSync {
  id: string;
  schedule: RoutineSchedule;
}

/**
 * Reconcile persisted routines with the device's scheduled notifications:
 * cancel stale Boccone schedules, (re)schedule enabled routines, avoid
 * duplicates. Called on app start / session ready / routine mutations —
 * never per-render. Pure over the scheduler port so tests inject a fake;
 * the Expo module re-exports it for app code.
 */
export async function syncRoutineNotifications(
  scheduler: RoutineScheduler,
  routines: RoutineForSync[],
): Promise<void> {
  const permission = await scheduler.permission();
  if (permission !== "granted") {
    // Cannot schedule: make sure nothing stale lingers.
    await scheduler.cancelAll();
    return;
  }

  const wanted = new Map<string, RoutineSchedule>();
  for (const routine of routines) {
    if (routine.schedule.isReminderEnabled) wanted.set(routine.id, routine.schedule);
  }

  const scheduled = new Set(await scheduler.scheduledIds());

  // Cancel obsolete (disabled or deleted routines).
  for (const existingId of scheduled) {
    if (!wanted.has(existingId)) await scheduler.cancel(existingId);
  }

  // (Re)schedule missing ones.
  for (const [routineId, schedule] of wanted) {
    if (!scheduled.has(routineId)) {
      await scheduler.scheduleWeekly(routineId, schedule);
    }
  }
}
