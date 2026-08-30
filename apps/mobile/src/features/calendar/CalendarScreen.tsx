import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { getCalendarMonthOptions } from "@boccone/api-client";
import { minTouchTarget, opacities, shape, spacing } from "@boccone/design-tokens";
import {
  Alert,
  Button,
  GlassIconButton,
  Inline,
  Screen,
  Stack,
  Text,
  useThemeColors,
} from "@boccone/ui-mobile";

import { useI18n } from "../../i18n/context";
import {
  addCalendarMonths,
  createCalendarDate,
  dateInMonth,
  formatLocalDate,
  formatMonthKey,
  formatMonthName,
  formatMonthYear,
  formatReadableDate,
  getMonthGrid,
  getWeekdayLabels,
  getWeekStartsOn,
  isSameMonth,
  isValidCalendarDate,
  parseLocalDate,
  startOfMonth,
} from "../../lib/dates";
import { selectionFeedback } from "../../lib/haptics";
import { useSession } from "../../session-context";
import { MascotAvatar } from "../../components/MascotAvatar";

interface CalendarScreenProps {
  initialDate?: string;
}

export function CalendarScreen({ initialDate }: CalendarScreenProps = {}) {
  const { session } = useSession();
  const { copy, locale } = useI18n();
  const colors = useThemeColors();
  const today = formatLocalDate();
  const initialSelectedDate =
    initialDate && isValidCalendarDate(initialDate) && initialDate <= today ? initialDate : today;
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parseLocalDate(initialSelectedDate)),
  );
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(visibleMonth.getFullYear());
  const weekStartsOn = getWeekStartsOn(locale);
  const currentMonthKey = formatMonthKey(parseLocalDate(today));
  const visibleMonthKey = formatMonthKey(visibleMonth);
  const isCurrentMonth = visibleMonthKey === currentMonthKey;
  const gridDates = useMemo(
    () => getMonthGrid(visibleMonth, weekStartsOn),
    [visibleMonth, weekStartsOn],
  );
  const weekdayLabels = useMemo(
    () => getWeekdayLabels(locale, weekStartsOn),
    [locale, weekStartsOn],
  );
  const activityQuery = useQuery({
    ...getCalendarMonthOptions({ query: { month: visibleMonthKey } }),
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const activityByDate = useMemo(
    () => new Map((activityQuery.data?.days ?? []).map((day) => [day.date, day.mealCount])),
    [activityQuery.data?.days],
  );
  const selectedMealCount = activityByDate.get(selectedDate) ?? 0;

  function selectDate(date: Date) {
    const nextDate = formatLocalDate(date);
    if (nextDate > today) return;
    setSelectedDate(nextDate);
    setVisibleMonth(startOfMonth(date));
    selectionFeedback();
  }

  function selectMonth(month: Date, feedback = true) {
    const nextMonth = startOfMonth(month);
    if (formatMonthKey(nextMonth) > currentMonthKey) return;
    const selectedDay = parseLocalDate(selectedDate).getDate();
    const nextDate = dateInMonth(nextMonth, selectedDay);
    const nextDateValue = formatLocalDate(nextDate);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextDateValue > today ? today : nextDateValue);
    setMonthPickerVisible(false);
    if (feedback) selectionFeedback();
  }

  function moveMonth(amount: number) {
    selectMonth(addCalendarMonths(visibleMonth, amount), false);
  }

  function selectToday() {
    setVisibleMonth(startOfMonth(parseLocalDate(today)));
    setSelectedDate(today);
    selectionFeedback();
  }

  function openMonthPicker() {
    setPickerYear(visibleMonth.getFullYear());
    setMonthPickerVisible(true);
  }

  const showTodayAction = selectedDate !== today || !isCurrentMonth;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activityQuery.isRefetching}
            onRefresh={() => void activityQuery.refetch()}
            tintColor={colors.interactive.default}
          />
        }
      >
        <Stack gap="xl">
          <Stack gap="sm">
            <Text variant="title">{copy.calendar.title}</Text>
            <Text variant="bodySm" tone="secondary">
              {copy.calendar.subtitle}
            </Text>
          </Stack>

          <Stack gap="md">
            <Inline align="center" justify="between">
              <GlassIconButton
                accessibilityLabel={copy.calendar.previousMonth}
                icon={
                  <MaterialCommunityIcons
                    color={colors.foreground.default}
                    name="chevron-left"
                    size={22}
                  />
                }
                onPress={() => moveMonth(-1)}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.calendar.chooseMonth}
                onPress={openMonthPicker}
                style={({ pressed }) => [styles.monthTitleButton, pressed && styles.pressed]}
              >
                <Inline gap="xs" align="center">
                  <Text variant="headingMd">{formatMonthYear(visibleMonth, locale)}</Text>
                  <MaterialCommunityIcons
                    color={colors.foreground.muted}
                    name="chevron-down"
                    size={18}
                  />
                </Inline>
              </Pressable>
              <GlassIconButton
                accessibilityLabel={copy.calendar.nextMonth}
                disabled={isCurrentMonth}
                icon={
                  <MaterialCommunityIcons
                    color={isCurrentMonth ? colors.foreground.subtle : colors.foreground.default}
                    name="chevron-right"
                    size={22}
                  />
                }
                onPress={() => moveMonth(1)}
              />
            </Inline>

            <View accessibilityLabel={copy.calendar.gridLabel}>
              <View style={styles.weekdayRow}>
                {weekdayLabels.map((label) => (
                  <View key={label} style={styles.weekdayCell}>
                    <Text
                      variant="caption"
                      tone="secondary"
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                      style={styles.weekdayLabel}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {gridDates.map((date) => {
                  const dateValue = formatLocalDate(date);
                  const inVisibleMonth = isSameMonth(date, visibleMonth);
                  const isSelected = dateValue === selectedDate;
                  const isToday = dateValue === today;
                  const isFuture = dateValue > today;
                  const mealCount = inVisibleMonth ? (activityByDate.get(dateValue) ?? 0) : 0;
                  const hasActivity = mealCount > 0;
                  return (
                    <Pressable
                      key={dateValue}
                      accessibilityRole="button"
                      accessibilityLabel={copy.calendar.dayAccessibility(
                        formatReadableDate(dateValue, locale, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }),
                        mealCount,
                        isSelected,
                        isToday,
                        isFuture,
                      )}
                      accessibilityState={{ disabled: isFuture, selected: isSelected }}
                      disabled={isFuture}
                      onPress={() => selectDate(date)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        pressed && !isFuture && styles.pressed,
                        isFuture && styles.futureDay,
                      ]}
                    >
                      <View
                        style={[
                          styles.dayVisual,
                          !inVisibleMonth && styles.outsideMonthDay,
                          isToday &&
                            !isSelected && {
                              borderColor: colors.interactive.default,
                              borderWidth: 2,
                            },
                          isSelected && { backgroundColor: colors.interactive.default },
                        ]}
                      >
                        <Text
                          variant="headingSm"
                          maxFontSizeMultiplier={1.25}
                          style={{
                            color: isSelected
                              ? colors.foreground.onInteractive
                              : inVisibleMonth
                                ? colors.foreground.default
                                : colors.foreground.subtle,
                          }}
                        >
                          {date.getDate()}
                        </Text>
                      </View>
                      <View
                        accessibilityElementsHidden
                        style={[
                          styles.activityDot,
                          !hasActivity && styles.hiddenActivityDot,
                          isSelected && { backgroundColor: colors.foreground.onInteractive },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {activityQuery.isPending ? (
              <Text role="status" variant="caption" tone="secondary">
                {copy.calendar.loadingActivity}
              </Text>
            ) : null}
            {activityQuery.isError ? (
              <Stack gap="sm">
                <Alert tone="danger" message={copy.calendar.activityError} />
                <Button variant="ghost" size="sm" onPress={() => void activityQuery.refetch()}>
                  {copy.calendar.retry}
                </Button>
              </Stack>
            ) : null}

            {showTodayAction ? (
              <Button variant="ghost" size="sm" onPress={selectToday}>
                {copy.calendar.today}
              </Button>
            ) : null}
          </Stack>

          <Stack gap="md">
            <Inline align="end" justify="between" gap="md">
              <Stack gap="xs" style={styles.selectedDateCopy}>
                <Text variant="headingLg">
                  {formatReadableDate(selectedDate, locale, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                <Text variant="bodySm" tone="secondary">
                  {selectedDate === today
                    ? copy.calendar.todaySelected
                    : copy.calendar.selectedDate}
                </Text>
              </Stack>
            </Inline>

            {activityQuery.data ? (
              selectedMealCount === 0 ? (
                <View style={styles.mascotWrap}>
                  <MascotAvatar accessibilityLabel={copy.home.mascotTitle} size={72} />
                </View>
              ) : null
            ) : null}
            {activityQuery.data ? (
              <Text variant="bodySm" tone="secondary">
                {selectedMealCount > 0
                  ? copy.calendar.loggedMeals(selectedMealCount)
                  : selectedDate === today
                    ? copy.calendar.emptyTodayBody
                    : copy.calendar.emptyBody}
              </Text>
            ) : null}
            <Inline gap="sm" wrap>
              <Link href={{ pathname: "/diary", params: { date: selectedDate } }} asChild>
                <Button variant="ghost" size="sm">
                  {copy.calendar.viewDiary}
                </Button>
              </Link>
              <Link href={{ pathname: "/meals/new", params: { date: selectedDate } }} asChild>
                <Button size="sm" variant="secondary">
                  {copy.calendar.addMeal}
                </Button>
              </Link>
            </Inline>
          </Stack>
        </Stack>
      </ScrollView>

      <MonthPicker
        colors={colors}
        copy={copy.calendar}
        locale={locale}
        month={visibleMonth}
        onClose={() => setMonthPickerVisible(false)}
        onMonthSelect={selectMonth}
        onYearChange={(amount) =>
          setPickerYear((year) => Math.min(year + amount, parseLocalDate(today).getFullYear()))
        }
        open={monthPickerVisible}
        pickerYear={pickerYear}
        today={today}
      />
    </Screen>
  );
}

function MonthPicker({
  colors,
  copy,
  locale,
  month,
  onClose,
  onMonthSelect,
  onYearChange,
  open,
  pickerYear,
  today,
}: {
  colors: ReturnType<typeof useThemeColors>;
  copy: ReturnType<typeof useI18n>["copy"]["calendar"];
  locale: Parameters<typeof formatMonthName>[1];
  month: Date;
  onClose: () => void;
  onMonthSelect: (month: Date) => void;
  onYearChange: (amount: number) => void;
  open: boolean;
  pickerYear: number;
  today: string;
}) {
  const currentMonthKey = formatMonthKey(parseLocalDate(today));
  const months = Array.from({ length: 12 }, (_, index) => createCalendarDate(pickerYear, index));
  const currentYear = parseLocalDate(today).getFullYear();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={open}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel={copy.closePicker}
          onPress={onClose}
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: colors.background.inverse, opacity: 0.32 },
          ]}
        />
        <View
          accessibilityViewIsModal
          onStartShouldSetResponder={() => true}
          style={[styles.pickerSheet, { backgroundColor: colors.background.elevated }]}
        >
          <Stack gap="lg">
            <Inline align="center" justify="between">
              <Text variant="headingLg">{copy.monthPickerTitle}</Text>
              <GlassIconButton
                accessibilityLabel={copy.closePicker}
                icon={
                  <MaterialCommunityIcons
                    color={colors.foreground.default}
                    name="close"
                    size={20}
                  />
                }
                onPress={onClose}
              />
            </Inline>
            <Inline align="center" justify="between">
              <GlassIconButton
                accessibilityLabel={copy.previousYear}
                icon={
                  <MaterialCommunityIcons
                    color={colors.foreground.default}
                    name="chevron-left"
                    size={22}
                  />
                }
                onPress={() => onYearChange(-1)}
              />
              <Text variant="headingMd">{pickerYear}</Text>
              <GlassIconButton
                accessibilityLabel={copy.nextYear}
                disabled={pickerYear >= currentYear}
                icon={
                  <MaterialCommunityIcons
                    color={
                      pickerYear >= currentYear
                        ? colors.foreground.subtle
                        : colors.foreground.default
                    }
                    name="chevron-right"
                    size={22}
                  />
                }
                onPress={() => onYearChange(1)}
              />
            </Inline>
            <View style={styles.pickerMonthGrid}>
              {months.map((monthDate) => {
                const monthKey = formatMonthKey(monthDate);
                const disabled = monthKey > currentMonthKey;
                const selected = formatMonthKey(month) === monthKey;
                return (
                  <Pressable
                    key={monthKey}
                    accessibilityRole="button"
                    accessibilityLabel={formatMonthName(monthDate, locale)}
                    accessibilityState={{ disabled, selected }}
                    disabled={disabled}
                    onPress={() => onMonthSelect(monthDate)}
                    style={({ pressed }) => [
                      styles.pickerMonthButton,
                      selected && { backgroundColor: colors.background.subtle },
                      disabled && styles.disabledMonth,
                      pressed && !disabled && styles.pressed,
                    ]}
                  >
                    <Text
                      variant="bodySm"
                      style={{
                        color: disabled
                          ? colors.foreground.subtle
                          : selected
                            ? colors.interactive.default
                            : colors.foreground.default,
                      }}
                    >
                      {formatMonthName(monthDate, locale)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Stack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  monthTitleButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: minTouchTarget,
    paddingHorizontal: spacing[3],
  },
  weekdayRow: {
    flexDirection: "row",
    paddingBottom: spacing[2],
  },
  weekdayCell: {
    alignItems: "center",
    width: "14.2857%",
  },
  weekdayLabel: {
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    alignItems: "center",
    height: 60,
    justifyContent: "flex-start",
    paddingTop: spacing[1],
    width: "14.2857%",
  },
  dayVisual: {
    alignItems: "center",
    borderRadius: shape.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  outsideMonthDay: {
    opacity: opacities.subtle,
  },
  futureDay: {
    opacity: opacities.disabled,
  },
  activityDot: {
    backgroundColor: "transparent",
    borderRadius: shape.full,
    height: spacing[1],
    marginTop: spacing[1],
    width: spacing[1],
  },
  hiddenActivityDot: {
    opacity: 0,
  },
  selectedDateCopy: {
    flex: 1,
  },
  mascotWrap: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  pressed: {
    opacity: opacities.pressed,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: shape.floating,
    borderTopRightRadius: shape.floating,
    padding: spacing[6],
    paddingBottom: spacing[8],
  },
  pickerMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing[2],
  },
  pickerMonthButton: {
    alignItems: "center",
    borderRadius: shape.compact,
    justifyContent: "center",
    minHeight: minTouchTarget,
    width: "33.3333%",
  },
  disabledMonth: {
    opacity: opacities.disabled,
  },
});
