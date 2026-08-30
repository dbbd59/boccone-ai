import * as Notifications from "expo-notifications";

import type { RoutineSchedule, RoutineScheduler } from "./routine-schedule";
import { notificationIdFor, payloadFor } from "./routine-schedule";

/**
 * Android notification channel for routine reminders: default importance,
 * no sound/vibration abuse — a gentle nudge, not an alarm.
 */
const ANDROID_CHANNEL_ID = "boccone-routine-reminders";

let channelConfigured = false;

async function ensureAndroidChannel(): Promise<void> {
  if (typeof Notifications.setNotificationChannelAsync !== "function") return;
  if (channelConfigured) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Meal reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
    vibrationPattern: undefined,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
  channelConfigured = true;
}

/** Foreground presentation: quiet banner, no sound, no badge spam. */
export function configureForegroundPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
  });
}

export const expoRoutineScheduler: RoutineScheduler = {
  async permission() {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return "granted";
    if (String(settings.status) === "undetermined" || settings.canAskAgain) return "undetermined";
    return "denied";
  },

  async requestPermission() {
    const settings = await Notifications.requestPermissionsAsync();
    if (settings.granted) return "granted";
    if (String(settings.status) === "undetermined") return "undetermined";
    return "denied";
  },

  async scheduledIds() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled
      .map((n) => n.content.data)
      .filter(isRoutineNotificationData)
      .map((data) => data.routineId);
  },

  async scheduleWeekly(routineId: string, schedule: RoutineSchedule) {
    await ensureAndroidChannel();
    // Weekly calendar-style triggers: repeat on the chosen weekdays at local
    // wall-clock time. The OS re-derives each occurrence after DST changes,
    // so 08:00 stays 08:00. One native notification per selected weekday;
    // ids are deterministic per routine+weekday for reconciliation.
    const weekdaySet = schedule.weekdays.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : schedule.weekdays;
    for (const isoWeekday of weekdaySet) {
      const { hours, minutes } = parseTime(schedule.localTime);
      await Notifications.scheduleNotificationAsync({
        identifier: `${notificationIdFor(routineId)}-wd${isoWeekday}`,
        content: {
          title: "", // filled by caller-specific copy at schedule time
          body: "",
          sound: undefined,
          data: payloadFor(routineId) as unknown as Record<string, unknown>,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: ANDROID_CHANNEL_ID,
          // WeeklyTriggerInput weekday: 1=Sunday..7=Saturday.
          weekday: ((isoWeekday + 1) % 7) + 1,
          hour: hours,
          minute: minutes,
        },
      });
    }
    return notificationIdFor(routineId);
  },

  async cancel(routineId: string) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const prefix = notificationIdFor(routineId);
    for (const n of scheduled) {
      if (n.identifier.startsWith(prefix)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  },

  async cancelAll() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (isRoutineNotificationData(n.content.data)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  },
};

function isRoutineNotificationData(
  value: unknown,
): value is { type: "ROUTINE_REMINDER"; routineId: string } {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return data.type === "ROUTINE_REMINDER" && typeof data.routineId === "string";
}

function parseTime(value: string): { hours: number; minutes: number } {
  const [h, m] = value.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

export { syncRoutineNotifications } from "./routine-schedule";
