import type { MealCategory } from "@boccone/contracts";
import type { AiProvider } from "@boccone/api-client";

export const supportedLocales = ["en", "it"] as const;
export type Locale = (typeof supportedLocales)[number];

export interface AiProviderGuideCopy {
  title: string;
  intro: string;
  steps: string[];
  customNeeds?: string;
  billing?: string;
  security: string;
  openLabel: string;
}

export interface TranslationCopy {
  appName: string;
  language: {
    label: string;
    english: string;
    italian: string;
  };
  loading: {
    tagline: string;
  };
  navigation: {
    home: string;
    meals: string;
    calendar: string;
    diary: string;
    settings: string;
    back: string;
  };
  auth: {
    signIn: {
      title: string;
      subtitle: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      google: string;
      apple: string;
      socialDivider: string;
      showPassword: string;
      hidePassword: string;
      forgotPassword: string;
      noAccount: string;
      createAccount: string;
    };
    signUp: {
      title: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      showPassword: string;
      hidePassword: string;
      haveAccount: string;
      signIn: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      submit: string;
      success: string;
      backToSignIn: string;
    };
    resetPassword: {
      title: string;
      subtitle: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submit: string;
      showPassword: string;
      hidePassword: string;
    };
    validation: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordLength: string;
      nameRequired: string;
    };
    errors: {
      signIn: string;
      signUp: string;
      social: (provider: string) => string;
      requestReset: string;
      reset: string;
      missingResetToken: string;
    };
  };
  home: {
    greeting: (name: string) => string;
    subtitle: string;
    mascotTitle: string;
    title: string;
    body: string;
    logout: string;
    refreshError: string;
    signedInAs: (email: string | undefined) => string;
    fallbackName: string;
    todayTitle: string;
    todayDate: (date: string) => string;
    caloriesLabel: string;
    caloriesValue: (value: number | null | undefined) => string;
    caloriesTarget: (target: number) => string;
    caloriesUnset: string;
    macrosTitle: string;
    proteinLabel: string;
    carbohydratesLabel: string;
    fatLabel: string;
    gramsValue: (value: number | null | undefined) => string;
    gramsTarget: (value: number, target: number) => string;
    mealsTitle: string;
    addMeal: string;
    editMeal: string;
    viewMeals: string;
    openMeal: (name: string) => string;
    moreMeals: (count: number) => string;
    mealSummary: (name: string, calories: number | null | undefined) => string;
    mealMeta: (category: string, calories: number | null | undefined) => string;
    emptyTitle: string;
    emptyBody: string;
    loadError: string;
    retry: string;
    insightsTitle: string;
    insightsBody: (average: string, days: number) => string;
    insightsOpen: string;
    categoryLabels: Record<MealCategory, string>;
  };
  insights: {
    title: string;
    subtitle: string;
    range7d: string;
    range30d: string;
    range3m: string;
    range1y: string;
    overview: string;
    averagePerLoggedDay: string;
    daysLogged: (current: number, total: number) => string;
    mealsLogged: (count: number) => string;
    mealTypeShare: (percent: string, count: number) => string;
    caloriesTrend: string;
    nutritionTitle: string;
    macroComposition: string;
    mealTypes: string;
    topFoods: string;
    foodEntries: (count: number) => string;
    foodBackedNote: string;
    currentTarget: (value: number) => string;
    noDataTitle: string;
    noDataBody: string;
    noRangeTitle: string;
    noRangeBody: string;
    noRangeData: string;
    loadError: string;
    retry: string;
    openDetail: (label: string) => string;
    openFood: (food: string) => string;
    detailTitle: (label: string) => string;
    detailAverage: string;
    detailTotal: string;
    detailCompared: (value: string) => string;
    contributors: string;
    noContributors: string;
    highlightTitle: string;
    mostLoggedFood: (food: string, count: number) => string;
    mostLoggedCategory: (category: string, count: number) => string;
    calorieVariation: (value: number) => string;
    periodChange: (value: string) => string;
    metricLabels: { calories: string; protein: string; carbs: string; fat: string };
    categoryLabels: Record<MealCategory, string>;
    chartAccessibility: (
      metric: string,
      average: string,
      highest: string,
      lowest: string,
      target?: string,
    ) => string;
    noTarget: string;
  };
  meals: {
    title: string;
    subtitle: string;
    today: string;
    add: string;
    addFirst: string;
    loading: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyBody: string;
    total: string;
    openMeal: (name: string) => string;
    mealSummary: (name: string, calories: number | null | undefined) => string;
    mealMeta: (category: string, calories: number | null | undefined) => string;
  };
  calendar: {
    title: string;
    subtitle: string;
    previousMonth: string;
    nextMonth: string;
    chooseMonth: string;
    monthPickerTitle: string;
    closePicker: string;
    previousYear: string;
    nextYear: string;
    gridLabel: string;
    today: string;
    todaySelected: string;
    selectedDate: string;
    loadingActivity: string;
    activityError: string;
    loadingDay: string;
    loadError: string;
    retry: string;
    emptyPastTitle: string;
    emptyTodayTitle: string;
    emptyBody: string;
    emptyTodayBody: string;
    total: string;
    addMeal: string;
    viewDiary: string;
    loggedMeals: (count: number) => string;
    dayAccessibility: (
      date: string,
      mealCount: number,
      selected: boolean,
      today: boolean,
      future: boolean,
    ) => string;
  };
  diary: {
    title: string;
    subtitle: string;
    today: string;
    yesterday: string;
    previousDay: string;
    nextDay: string;
    openCalendar: string;
    loading: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyBody: string;
    addMeal: string;
    loadMore: string;
    endOfHistory: string;
    dayTotal: string;
    openMeal: (name: string) => string;
    foodFilter: (food: string) => string;
    clearFoodFilter: string;
  };
  meal: {
    detailEyebrow: string;
    detailDate: (category: string, date: string, time?: string) => string;
    notFoundTitle: string;
    notFoundBody: string;
    editAction: string;
    retry: string;
    addTitle: string;
    editTitle: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    categoryLabel: string;
    categories: Record<MealCategory, string>;
    dateLabel: string;
    datePlaceholder: string;
    dateDescription: string;
    nutritionTitle: string;
    caloriesLabel: string;
    proteinLabel: string;
    carbohydratesLabel: string;
    fatLabel: string;
    notesLabel: string;
    notesDescription: string;
    save: string;
    saveChanges: string;
    delete: string;
    cancel: string;
    deleteTitle: string;
    deleteBody: string;
    deleteError: string;
    validation: string;
    saveError: string;
    loadError: string;
    loading: string;
  };
  saved: {
    title: string;
    subtitle: string;
    tabRecent: string;
    tabSaved: string;
    routinesTitle: string;
    savedTitle: string;
    use: string;
    useNow: string;
    edit: string;
    delete: string;
    newSavedMeal: string;
    saveFromMeal: string;
    saveAsSavedTitle: string;
    saveAsSavedBody: string;
    nameLabel: string;
    namePlaceholder: string;
    routineSection: string;
    routineOff: string;
    mealTypeLabel: string;
    daysLabel: string;
    timeLabel: string;
    reminderLabel: string;
    reminderHint: string;
    presetEveryday: string;
    presetWeekdays: string;
    presetWeekends: string;
    presetCustom: string;
    save: string;
    cancel: string;
    deleteTitle: string;
    deleteBody: string;
    loadError: string;
    saveError: string;
    emptyTitle: string;
    emptyBody: string;
    needsAttention: string;
    attentionBody: string;
    schedulePreview: (days: string, time: string) => string;
    everyDay: string;
    usage: (count: number) => string;
    kcalApprox: (kcal: number) => string;
    draftFromTemplate: (name: string) => string;
    updateSavedAction: string;
    reminderPermissionTitle: string;
    reminderPermissionBody: string;
    reminderDenied: string;
    openSystemSettings: string;
    reminderUnavailable: string;
  };
  food: {
    title: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchHint: string;
    clearSearch: string;
    quickSearchesLabel: string;
    quickSearches: string[];
    recent: string;
    frequent: string;
    suggestions: string;
    possibleMatches: string;
    resultsFor: (query: string) => string;
    noResultsFor: (query: string) => string;
    tryShorter: (query: string) => string;
    per100g: string;
    notFoundTitle: string;
    propose: (name: string) => string;
    addFood: string;
    cancel: string;
    portionTitle: string;
    quantityLabel: string;
    gramsLabel: string;
    customGrams: string;
    quickAdd: string;
    quality: {
      authoritative: string;
      branded: string;
      community: string;
      personal: string;
      estimated: string;
      verified: string;
    };
    decrement: string;
    increment: string;
    portionStep: string;
    gramsStep: string;
    addToMeal: string;
    editEntry: string;
    updateEntry: string;
    selectedFoods: string;
    remove: string;
    mealTotal: string;
    saveMeal: string;
    nameLabel: string;
    brandLabel: string;
    brandPlaceholder: string;
    typeLabel: string;
    types: { generic: string; branded: string; dish: string };
    categoryLabel: string;
    categoryPlaceholder: string;
    portionNameLabel: string;
    portionNamePlaceholder: string;
    portionGramsLabel: string;
    caloriesPer100g: string;
    proteinPer100g: string;
    carbsPer100g: string;
    fatPer100g: string;
    submitFood: string;
    submissionNote: string;
    submissionSuccess: string;
    loading: string;
    error: string;
    validation: string;
    approximate: string;
    dilloEstimate: string;
    dilloTitle: string;
    dilloHint: string;
    dilloPlaceholder: string;
    dilloSubmit: string;
    dilloReviewTitle: string;
    dilloReviewBody: string;
    dilloReviewCount: (count: number) => string;
    dilloAmbiguous: string;
    dilloUnresolved: string;
    dilloUseCandidate: string;
    dilloSearchCatalog: string;
    dilloSwitchManual: string;
    dilloNoNutrition: string;
    dilloAddCustomFood: string;
    dilloRemoveItem: string;
    dilloSaveAfterReview: string;
    dilloRetry: string;
    dilloCancel: string;
    dilloProcessing: string;
    dilloConfigure: string;
    dilloInvalidCredentials: string;
    dilloRateLimited: string;
    dilloUnavailable: string;
    dilloTimeout: string;
    dilloInvalidResponse: string;
    dilloGenericError: string;
  };
  settings: {
    title: string;
    subtitle: string;
    appearanceTitle: string;
    appearanceBody: string;
    system: string;
    light: string;
    dark: string;
    targetsTitle: string;
    targetsBody: string;
    targetsOptional: string;
    caloriesLabel: string;
    proteinLabel: string;
    carbohydratesLabel: string;
    fatLabel: string;
    saveTargets: string;
    targetsSaved: string;
    targetsLoadError: string;
    targetsSaveError: string;
    targetsInvalid: string;
    languageTitle: string;
    accountTitle: string;
    preferencesTitle: string;
    profileTitle: string;
    profileBody: string;
    profileReadOnly: string;
    profileLoadError: string;
    nameLabel: string;
    emailLabel: string;
    aboutTitle: string;
    aboutBody: string;
    aboutPrincipleTitle: string;
    aboutPrincipleBody: string;
    aboutMoreTitle: string;
    aboutMoreBody: string;
    signedInTitle: string;
    signedInAs: (email: string | undefined) => string;
    signOut: string;
    aiTitle: string;
    aiBody: string;
    aiWhy: string;
    aiProviderLabel: string;
    aiProviderHint: string;
    aiModelLabel: string;
    aiModelPlaceholder: string;
    aiSelectModel: string;
    aiSearchModels: string;
    aiRecommended: string;
    aiAllModels: string;
    aiLoadingModels: string;
    aiModelsError: string;
    aiModelsStale: string;
    aiRefreshModels: string;
    aiNoModels: string;
    aiManualFallbackTitle: string;
    aiManualFallbackBody: string;
    aiManualAction: string;
    aiManualModelLabel: string;
    aiManualModelPlaceholder: string;
    aiManualSave: string;
    aiManualCancel: string;
    aiModelNotListed: string;
    aiModelContext: (value: number) => string;
    aiApiKeyLabel: string;
    aiApiKeyPlaceholder: string;
    aiGetApiKey: string;
    aiKeyStored: string;
    aiShowKey: string;
    aiHideKey: string;
    aiBaseUrlLabel: string;
    aiBaseUrlHint: string;
    aiBaseUrlPlaceholder: string;
    aiSave: string;
    aiTest: string;
    aiDeleteKey: string;
    aiKeyDeleted: string;
    aiSaved: string;
    aiTestSuccess: string;
    aiLoadError: string;
    aiSaveError: string;
    aiTestError: string;
    aiLoading: string;
    aiInvalidCredentials: string;
    aiModelNotFound: string;
    aiModelNotAccessible: string;
    aiModelNotSelected: string;
    aiProviderUnavailable: string;
    aiRateLimited: string;
    aiTimeout: string;
    aiGuides: Record<AiProvider, AiProviderGuideCopy>;
  };
}

export const translations: Record<Locale, TranslationCopy> = {
  en: {
    appName: "BOCCONE AI",
    language: { label: "Language", english: "English", italian: "Italian" },
    loading: { tagline: "Making food tracking feel lighter." },
    navigation: {
      home: "Home",
      meals: "Meals",
      calendar: "Calendar",
      diary: "Diary",
      settings: "Settings",
      back: "Back",
    },
    auth: {
      signIn: {
        title: "Welcome back",
        subtitle: "Track your food with calm, useful estimates.",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        passwordLabel: "Password",
        passwordPlaceholder: "Your password",
        submit: "Sign in",
        google: "Continue with Google",
        apple: "Continue with Apple",
        socialDivider: "or continue with",
        showPassword: "Show password",
        hidePassword: "Hide password",
        forgotPassword: "Forgot password?",
        noAccount: "New to Boccone?",
        createAccount: "Create an account",
      },
      signUp: {
        title: "Create your account",
        subtitle: "A small step toward a clearer food diary.",
        nameLabel: "Name",
        namePlaceholder: "Your name",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        passwordLabel: "Password",
        passwordPlaceholder: "At least 8 characters",
        submit: "Create account",
        showPassword: "Show password",
        hidePassword: "Hide password",
        haveAccount: "Already registered?",
        signIn: "Sign in",
      },
      forgotPassword: {
        title: "Reset your password",
        subtitle: "Enter your email. We’ll send a secure reset link.",
        submit: "Send reset link",
        success: "Check your email for the reset link.",
        backToSignIn: "Back to sign in",
      },
      resetPassword: {
        title: "Choose a new password",
        subtitle: "Use at least eight characters.",
        passwordLabel: "New password",
        passwordPlaceholder: "At least 8 characters",
        submit: "Update password",
        showPassword: "Show password",
        hidePassword: "Hide password",
      },
      validation: {
        emailRequired: "Enter your email address.",
        emailInvalid: "Enter a valid email address.",
        passwordRequired: "Enter your password.",
        passwordLength: "Use at least 8 characters.",
        nameRequired: "Enter your name.",
      },
      errors: {
        signIn: "Unable to sign in",
        signUp: "Unable to create account",
        social: (provider) => `Unable to sign in with ${provider}`,
        requestReset: "Unable to request password reset",
        reset: "Unable to reset password",
        missingResetToken: "Reset link is missing or invalid",
      },
    },
    home: {
      greeting: (name) => `Good morning, ${name}`,
      subtitle: "Your food diary is ready when you are.",
      mascotTitle: "Boccone AI",
      title: "Your diary starts here",
      body: "Your diary will have a home here soon. We are keeping the first step simple.",
      logout: "Log out",
      refreshError: "Could not refresh your account. Pull to retry later.",
      signedInAs: (email) => `Signed in as ${email ?? "your account"}`,
      fallbackName: "there",
      todayTitle: "Today",
      todayDate: (date) => date,
      caloriesLabel: "Calories",
      caloriesValue: (value) => (value === null || value === undefined ? "—" : `${value} kcal`),
      caloriesTarget: (target) => `of ${target} kcal target`,
      caloriesUnset: "No calorie target set",
      macrosTitle: "Macros",
      proteinLabel: "Protein",
      carbohydratesLabel: "Carbohydrates",
      fatLabel: "Fat",
      gramsValue: (value) => (value === null || value === undefined ? "—" : `${value} g`),
      gramsTarget: (value, target) => `${value} / ${target} g`,
      mealsTitle: "Meals",
      addMeal: "Add meal",
      editMeal: "Edit meal",
      viewMeals: "View diary",
      openMeal: (name) => `Open ${name}`,
      moreMeals: (count) => `+${count} more today`,
      mealSummary: (name, calories) =>
        `${name} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      mealMeta: (category, calories) =>
        `${category} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      emptyTitle: "Nothing logged yet",
      emptyBody: "Add your first meal manually. You can review it here anytime.",
      loadError: "Could not load today's meals. Try again later.",
      retry: "Try again",
      insightsTitle: "Your week at a glance",
      insightsBody: (average, days) => `${average} average across ${days} logged days`,
      insightsOpen: "Open insights",
      categoryLabels: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
    },
    insights: {
      title: "Insights",
      subtitle: "A calm view of how you have been eating.",
      range7d: "7D",
      range30d: "30D",
      range3m: "3M",
      range1y: "1Y",
      overview: "Overview",
      averagePerLoggedDay: "Average per logged day",
      daysLogged: (current, total) => `${current} of ${total} days logged`,
      mealsLogged: (count) => `${count} meals logged`,
      mealTypeShare: (percent, count) => `${percent}% of logged calories · ${count} meals`,
      caloriesTrend: "Calories over time",
      nutritionTitle: "Nutrition",
      macroComposition: "Average macros per logged day",
      mealTypes: "Meal types",
      topFoods: "Most logged foods",
      foodEntries: (count) => `${count} catalog entries`,
      foodBackedNote:
        "Based on food entries with catalog nutrition. Manual meals stay in the totals.",
      currentTarget: (value) => `Current target · ${value.toLocaleString()} kcal`,
      noDataTitle: "Your insights will appear here",
      noDataBody: "Log a few meals to start seeing patterns in your food history.",
      noRangeTitle: "Nothing logged in this period",
      noRangeBody: "Try another range or keep logging meals to extend this view.",
      noRangeData: "Nothing logged in this period.",
      loadError: "Could not load your insights. Try again later.",
      retry: "Try again",
      openDetail: (label) => `Open ${label} details`,
      openFood: (food) => `Show meals with ${food}`,
      detailTitle: (label) => `${label} details`,
      detailAverage: "Average per logged day",
      detailTotal: "Period total",
      detailCompared: (value) => `${value} vs previous period`,
      contributors: "Top contributors",
      noContributors: "Food contributors will appear when catalog entries are logged.",
      highlightTitle: "A few things your log shows",
      mostLoggedFood: (food, count) => `${food} appeared ${count} times.`,
      mostLoggedCategory: (category, count) =>
        `${category} was your most logged meal type (${count}).`,
      calorieVariation: (value) =>
        `Calories varied by ${value.toLocaleString()} kcal across logged days.`,
      periodChange: (value) => `Change vs previous period · ${value}`,
      metricLabels: {
        calories: "Calories",
        protein: "Protein",
        carbs: "Carbohydrates",
        fat: "Fat",
      },
      categoryLabels: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
      chartAccessibility: (metric, average, highest, lowest, target) =>
        `${metric}. Average ${average}. Highest ${highest}. Lowest ${lowest}.${target ? ` ${target}.` : ""}`,
      noTarget: "No calorie target set",
    },
    meals: {
      title: "Meals",
      subtitle: "Keep the food you log in one clear place.",
      today: "Today",
      add: "Add meal",
      addFirst: "Log your first meal",
      loading: "Loading today's meals…",
      loadError: "Could not load today's meals. Try again later.",
      retry: "Try again",
      emptyTitle: "No meals today",
      emptyBody: "Start with a meal you want to remember.",
      total: "Today's total",
      openMeal: (name) => `Open ${name}`,
      mealSummary: (name, calories) =>
        `${name} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      mealMeta: (category, calories) =>
        `${category} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
    },
    calendar: {
      title: "Calendar",
      subtitle: "Choose a day to see what you logged.",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      chooseMonth: "Choose a month",
      monthPickerTitle: "Choose a month",
      closePicker: "Close month picker",
      previousYear: "Previous year",
      nextYear: "Next year",
      gridLabel: "Calendar month",
      today: "Back to today",
      todaySelected: "Today",
      selectedDate: "Selected day",
      loadingActivity: "Checking logged days…",
      activityError: "Could not load logged days. Try again.",
      loadingDay: "Loading this day…",
      loadError: "Could not load this day. Try again later.",
      retry: "Try again",
      emptyPastTitle: "Nothing logged this day",
      emptyTodayTitle: "Nothing logged yet",
      emptyBody: "When you add a meal for this date, it will appear here.",
      emptyTodayBody: "Add a meal whenever you are ready.",
      total: "Day total",
      addMeal: "Add meal",
      viewDiary: "View diary",
      loggedMeals: (count) => `${count} ${count === 1 ? "meal" : "meals"} logged on this day.`,
      dayAccessibility: (date, mealCount, selected, today, future) =>
        [
          date,
          selected ? "selected" : null,
          today ? "today" : null,
          future ? "future date unavailable" : null,
          mealCount > 0
            ? `${mealCount} ${mealCount === 1 ? "meal" : "meals"} logged`
            : "no meals logged",
        ]
          .filter(Boolean)
          .join(", "),
    },
    diary: {
      title: "Diary",
      subtitle: "Browse the meals you have logged over time.",
      today: "Today",
      yesterday: "Yesterday",
      previousDay: "Previous day",
      nextDay: "Next day",
      openCalendar: "Open calendar",
      loading: "Loading your history…",
      loadError: "Could not load your history. Try again.",
      retry: "Try again",
      emptyTitle: "Your history is still quiet",
      emptyBody: "Log a meal and it will stay here as part of your food story.",
      addMeal: "Log a meal",
      loadMore: "Show older days",
      endOfHistory: "That’s the beginning of your history.",
      dayTotal: "Day total",
      openMeal: (name) => `Open ${name}`,
      foodFilter: (food) => `Showing meals with ${food}`,
      clearFoodFilter: "Show all meals",
    },
    saved: {
      title: "Saved meals",
      subtitle: "Reusable meals and routines. Tap Use to start pre-filled.",
      tabRecent: "Today",
      tabSaved: "Saved",
      routinesTitle: "Routines",
      savedTitle: "Saved meals",
      use: "Use",
      useNow: "Use now",
      edit: "Edit",
      delete: "Delete",
      newSavedMeal: "New saved meal",
      saveFromMeal: "Save meal",
      saveAsSavedTitle: "Save this meal",
      saveAsSavedBody: "Name it and it becomes a reusable template.",
      nameLabel: "Name",
      namePlaceholder: "e.g. Work breakfast",
      routineSection: "Routine",
      routineOff: "No routine — just a saved meal",
      mealTypeLabel: "Typical meal",
      daysLabel: "Days",
      timeLabel: "Time",
      reminderLabel: "Reminder",
      reminderHint: "Boccone can remind you at the time you pick.",
      presetEveryday: "Every day",
      presetWeekdays: "Weekdays",
      presetWeekends: "Weekends",
      presetCustom: "Custom",
      save: "Save",
      cancel: "Cancel",
      deleteTitle: "Delete this saved meal?",
      deleteBody: "Meals you already logged are not affected.",
      loadError: "Could not load saved meals. Try again later.",
      saveError: "Could not save. Try again.",
      emptyTitle: "Nothing saved yet",
      emptyBody:
        "Save the meals you eat often and reuse them in a tap. Open a meal and choose Save meal.",
      needsAttention: "Needs attention",
      attentionBody: "A food in this template is no longer in the catalog. Edit and replace it.",
      schedulePreview: (days, time) => `${days} · ${time}`,
      everyDay: "Every day",
      usage: (count) => (count === 1 ? "used once" : `used ${count} times`),
      kcalApprox: (kcal) => `≈ ${kcal} kcal`,
      draftFromTemplate: (name) => `${name} (from saved meal)`,
      updateSavedAction: "Update saved meal",
      reminderPermissionTitle: "Reminders need permission",
      reminderPermissionBody:
        "Boccone can remind you at the time you choose. Allow notifications to enable this.",
      reminderDenied: "Notifications are off in device settings.",
      openSystemSettings: "Open Settings",
      reminderUnavailable: "Reminder unavailable",
    },
    meal: {
      detailEyebrow: "MEAL DETAIL",
      detailDate: (category, date, time) => `${category} · ${date}${time ? ` · ${time}` : ""}`,
      notFoundTitle: "This meal is no longer available",
      notFoundBody: "It may have been removed. You can return to your diary.",
      editAction: "Edit meal",
      retry: "Try again",
      addTitle: "Add a meal",
      editTitle: "Edit meal",
      subtitle: "Record what you ate with values you trust.",
      nameLabel: "Meal name",
      namePlaceholder: "e.g. Pasta with tomato sauce",
      categoryLabel: "Category",
      categories: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
      dateLabel: "Date",
      datePlaceholder: "YYYY-MM-DD",
      dateDescription: "Use your local calendar date: YYYY-MM-DD.",
      nutritionTitle: "Nutrition",
      caloriesLabel: "Calories (kcal)",
      proteinLabel: "Protein (g)",
      carbohydratesLabel: "Carbohydrates (g)",
      fatLabel: "Fat (g)",
      notesLabel: "Notes",
      notesDescription: "Optional details to help you remember this meal.",
      save: "Save meal",
      saveChanges: "Save changes",
      delete: "Delete meal",
      cancel: "Cancel",
      deleteTitle: "Delete this meal?",
      deleteBody: "This removes the meal from your diary.",
      deleteError: "Could not delete the meal. Try again.",
      validation: "Enter a name, valid date, and whole numbers for nutrition values.",
      saveError: "Could not save the meal. Try again.",
      loadError: "Could not load this meal. Try again later.",
      loading: "Loading meal…",
    },
    food: {
      title: "Add food",
      searchLabel: "Food",
      searchPlaceholder: "Try apple or apple fruit…",
      searchHint: "Search by name, brand, or category. You can combine words, like apple fruit.",
      clearSearch: "Clear",
      quickSearchesLabel: "Quick picks",
      quickSearches: ["Apple", "Pasta", "Coffee"],
      recent: "Recent",
      frequent: "Frequent",
      suggestions: "Try these",
      possibleMatches: "Possible matches",
      resultsFor: (query) => `Results for “${query}”`,
      noResultsFor: (query) => `Nothing found for “${query}”. Try fewer words or add it yourself.`,
      tryShorter: (query) => `Try “${query}”`,
      per100g: "per 100 g",
      notFoundTitle: "Can’t find it?",
      propose: (name) => `Add “${name}” to your foods`,
      addFood: "Add food",
      cancel: "Cancel",
      portionTitle: "Choose a portion",
      quantityLabel: "Quantity",
      gramsLabel: "Grams",
      customGrams: "Custom grams",
      quickAdd: "Add default portion",
      quality: {
        authoritative: "Verified source",
        branded: "Package label",
        community: "Community checked",
        personal: "Your food",
        estimated: "Estimated",
        verified: "Boccone checked",
      },
      decrement: "Decrease quantity",
      increment: "Increase quantity",
      portionStep: "Use 0.5 steps or type a value",
      gramsStep: "Use 10 g steps or type a value",
      addToMeal: "Add to meal",
      editEntry: "Edit",
      updateEntry: "Update entry",
      selectedFoods: "In this meal",
      remove: "Remove",
      mealTotal: "Meal total",
      saveMeal: "Save meal",
      nameLabel: "Food name",
      brandLabel: "Brand (optional)",
      brandPlaceholder: "e.g. local bakery",
      typeLabel: "Food type",
      types: { generic: "Generic", branded: "Branded", dish: "Dish" },
      categoryLabel: "Category (optional)",
      categoryPlaceholder: "e.g. dessert",
      portionNameLabel: "Typical portion",
      portionNamePlaceholder: "e.g. 1 slice",
      portionGramsLabel: "Portion grams",
      caloriesPer100g: "Calories / 100 g",
      proteinPer100g: "Protein / 100 g",
      carbsPer100g: "Carbs / 100 g",
      fatPer100g: "Fat / 100 g",
      submitFood: "Use and propose food",
      submissionNote: "You can use it now. An admin will review it before it appears for everyone.",
      submissionSuccess: "Food added to your private foods.",
      loading: "Looking in your food catalog…",
      error: "Could not load foods. Try again.",
      validation: "Enter a name, portion grams, and valid nutrition values.",
      approximate: "Approximate",
      dilloEstimate: "AI estimate",
      dilloTitle: "Dillo a Boccone",
      dilloHint: "Write what you ate. Boccone will prepare a draft for you to review.",
      dilloPlaceholder: "e.g. 80 g of pasta with tomato and a coffee",
      dilloSubmit: "Prepare meal draft",
      dilloReviewTitle: "Review the draft",
      dilloReviewBody:
        "Check each suggestion before saving. You can use a catalog match, add a private food, or remove it from the meal.",
      dilloReviewCount: (count) =>
        count === 1 ? "1 food needs your review" : `${count} foods need your review`,
      dilloAmbiguous: "This food has more than one possible catalog match.",
      dilloUnresolved: "This food is not in the catalog yet. Add it manually below.",
      dilloUseCandidate: "Use this match",
      dilloSearchCatalog: "Search the catalog",
      dilloSwitchManual: "Search the catalog instead",
      dilloNoNutrition: "Nutrition is incomplete and needs your review.",
      dilloAddCustomFood: "Review and add private food",
      dilloRemoveItem: "Remove from meal",
      dilloSaveAfterReview: "Review the suggestions before saving this meal.",
      dilloRetry: "Try again",
      dilloCancel: "Cancel",
      dilloProcessing: "Preparing your draft…",
      dilloConfigure: "Configure an AI provider in Settings to use Dillo a Boccone.",
      dilloInvalidCredentials: "The AI provider key seems invalid. Check it in Settings.",
      dilloRateLimited: "The AI provider is busy. Try again in a little while.",
      dilloUnavailable: "The AI provider is temporarily unavailable. Try again.",
      dilloTimeout: "That took too long. Your text is still here; try again.",
      dilloInvalidResponse: "Boccone could not prepare a safe draft. Try again.",
      dilloGenericError: "Could not prepare the meal draft. Try again.",
    },
    settings: {
      title: "Settings",
      subtitle: "Keep your account and preferences close.",
      appearanceTitle: "Appearance",
      appearanceBody: "Choose how Boccone looks on this device.",
      system: "System",
      light: "Light",
      dark: "Dark",
      targetsTitle: "Daily targets",
      targetsBody: "Set only the numbers that are useful to you. Each target is optional.",
      targetsOptional: "Leave a field blank to keep that target unset.",
      caloriesLabel: "Calories (kcal)",
      proteinLabel: "Protein (g)",
      carbohydratesLabel: "Carbohydrates (g)",
      fatLabel: "Fat (g)",
      saveTargets: "Save targets",
      targetsSaved: "Targets saved.",
      targetsLoadError: "Could not load your targets. Try again later.",
      targetsSaveError: "Could not save your targets. Try again.",
      targetsInvalid: "Use a whole number or leave the field blank.",
      languageTitle: "Language",
      accountTitle: "Account",
      preferencesTitle: "Preferences",
      profileTitle: "Profile",
      profileBody: "The account details Boccone currently has for you.",
      profileReadOnly:
        "Profile editing will be available here when the account update flow is ready.",
      profileLoadError: "Could not load your profile. Showing the signed-in account instead.",
      nameLabel: "Name",
      emailLabel: "Email",
      aboutTitle: "About Boccone",
      aboutBody: "A calm, transparent companion for remembering what you eat.",
      aboutPrincipleTitle: "Estimates stay estimates",
      aboutPrincipleBody:
        "Boccone helps you record food and understand your own patterns. It is not medical advice or a clinical nutrition tool.",
      aboutMoreTitle: "More details are coming",
      aboutMoreBody:
        "Version and privacy details will have a dedicated home as those product surfaces land.",
      signedInTitle: "Signed in",
      signedInAs: (email) => `Signed in as ${email ?? "your account"}`,
      signOut: "Log out",
      aiTitle: "AI provider",
      aiBody: "Bring your own provider key. Boccone stores it encrypted and never shows it again.",
      aiWhy: "Boccone uses your AI provider account. Usage is billed directly by that provider.",
      aiProviderLabel: "Provider",
      aiProviderHint: "Choose where your AI usage should run.",
      aiModelLabel: "Model",
      aiModelPlaceholder: "e.g. gpt-5-mini",
      aiSelectModel: "Choose a model",
      aiSearchModels: "Search models…",
      aiRecommended: "Recommended",
      aiAllModels: "All available models",
      aiLoadingModels: "Loading available models…",
      aiModelsError: "Couldn’t load models. You can try again or enter a model ID manually.",
      aiModelsStale: "Showing your last available list. It may be out of date.",
      aiRefreshModels: "Refresh models",
      aiNoModels: "No usable models were returned by this provider.",
      aiManualFallbackTitle: "Can’t find your model?",
      aiManualFallbackBody: "Enter the model ID exactly as your provider documents it.",
      aiManualAction: "Enter model ID manually",
      aiManualModelLabel: "Model ID",
      aiManualModelPlaceholder: "e.g. my-private-model",
      aiManualSave: "Use this model",
      aiManualCancel: "Cancel",
      aiModelNotListed: "This model is not currently listed by the provider.",
      aiModelContext: (value) => `Context: ${value.toLocaleString()} tokens`,
      aiApiKeyLabel: "API key",
      aiApiKeyPlaceholder: "Paste a key to store it securely",
      aiGetApiKey: "How do I get an API key?",
      aiKeyStored: "A key is stored. Leave blank to keep it unchanged.",
      aiShowKey: "Show key",
      aiHideKey: "Hide key",
      aiBaseUrlLabel: "Base URL (optional)",
      aiBaseUrlHint: "Required only for OpenAI-compatible providers.",
      aiBaseUrlPlaceholder: "https://api.example.com/v1",
      aiSave: "Save & load models",
      aiTest: "Test connection",
      aiDeleteKey: "Delete stored key",
      aiKeyDeleted: "Stored key deleted.",
      aiSaved: "AI provider saved.",
      aiTestSuccess: "Connection successful.",
      aiLoadError: "Could not load AI settings. Try again later.",
      aiSaveError: "Could not save AI settings.",
      aiTestError: "The AI connection test failed.",
      aiLoading: "Loading AI settings…",
      aiInvalidCredentials: "This API key was rejected. Check it with your provider.",
      aiModelNotFound: "This model ID was not found by the provider.",
      aiModelNotAccessible: "This model is not accessible with the current key.",
      aiModelNotSelected: "Choose or enter a model before testing the connection.",
      aiProviderUnavailable: "The provider is temporarily unavailable. Try again later.",
      aiRateLimited: "The provider is busy. Try again in a little while.",
      aiTimeout: "The provider took too long to respond. Try again.",
      aiGuides: {
        openai: {
          title: "How to get an OpenAI API key",
          intro: "Create a key in the OpenAI API Platform, then paste it here.",
          steps: [
            "Open the OpenAI API Platform.",
            "Sign in or create an account.",
            "Open API Keys and choose Create secret key.",
            "Copy the key immediately and paste it into Boccone.",
          ],
          billing: "ChatGPT and OpenAI API billing are separate products.",
          security: "Treat API keys like passwords. The full key is shown only when you create it.",
          openLabel: "Open OpenAI API Keys",
        },
        anthropic: {
          title: "How to get an Anthropic API key",
          intro: "Create a key in the Claude Platform, not in the consumer Claude chat app.",
          steps: [
            "Open the Claude Platform Console.",
            "Sign in or create an account.",
            "Open Settings, then API keys.",
            "Create a key, choose its workspace or expiration if asked, and copy it into Boccone.",
          ],
          billing:
            "API access and billing are managed in the Claude Platform Console, not the consumer Claude app.",
          security: "Treat API keys like passwords. Don’t share them publicly.",
          openLabel: "Open Anthropic API Keys",
        },
        gemini: {
          title: "How to get a Gemini API key",
          intro: "Google AI Studio can create a project and key for you when you get started.",
          steps: [
            "Open Google AI Studio.",
            "Open the API keys page and choose Create API key.",
            "Select or create the Google Cloud project for the key.",
            "Copy the key and paste it into Boccone.",
          ],
          billing: "Higher limits may require Google Cloud billing on the selected project.",
          security: "Treat API keys like passwords. Don’t share them publicly.",
          openLabel: "Open Google AI Studio API Keys",
        },
        openrouter: {
          title: "How to get an OpenRouter API key",
          intro: "One OpenRouter key can give Boccone access to models from multiple providers.",
          steps: [
            "Open OpenRouter and sign in or create an account.",
            "Open API Keys and choose Create key.",
            "Set a spending limit or expiration if you want one.",
            "Copy the key and paste it into Boccone.",
          ],
          billing:
            "Review your OpenRouter credits, limits, and model pricing before using the connection.",
          security: "Treat API keys like passwords. Don’t share them publicly.",
          openLabel: "Open OpenRouter API Keys",
        },
        "openai-compatible": {
          title: "Custom provider",
          intro: "There is no universal key-creation flow for a custom provider.",
          steps: [],
          customNeeds:
            "You’ll need an API base URL, an API key or token if required, and a model ID. Check your provider’s documentation for these values.",
          security: "Treat API keys and tokens like passwords. Don’t share them publicly.",
          openLabel: "Open provider documentation",
        },
      },
    },
  },
  it: {
    appName: "BOCCONE AI",
    language: { label: "Lingua", english: "Inglese", italian: "Italiano" },
    loading: { tagline: "Rendere più semplice seguire ciò che mangi." },
    navigation: {
      home: "Home",
      meals: "Pasti",
      calendar: "Calendario",
      diary: "Diario",
      settings: "Impostazioni",
      back: "Indietro",
    },
    auth: {
      signIn: {
        title: "Bentornato",
        subtitle: "Segui ciò che mangi con stime chiare e utili.",
        emailLabel: "Email",
        emailPlaceholder: "tu@esempio.com",
        passwordLabel: "Password",
        passwordPlaceholder: "La tua password",
        submit: "Accedi",
        google: "Continua con Google",
        apple: "Continua con Apple",
        socialDivider: "oppure continua con",
        showPassword: "Mostra password",
        hidePassword: "Nascondi password",
        forgotPassword: "Hai dimenticato la password?",
        noAccount: "È la tua prima volta su Boccone?",
        createAccount: "Crea un account",
      },
      signUp: {
        title: "Crea il tuo account",
        subtitle: "Un piccolo passo verso un diario alimentare più chiaro.",
        nameLabel: "Nome",
        namePlaceholder: "Il tuo nome",
        emailLabel: "Email",
        emailPlaceholder: "tu@esempio.com",
        passwordLabel: "Password",
        passwordPlaceholder: "Almeno 8 caratteri",
        submit: "Crea account",
        showPassword: "Mostra password",
        hidePassword: "Nascondi password",
        haveAccount: "Hai già un account?",
        signIn: "Accedi",
      },
      forgotPassword: {
        title: "Reimposta la password",
        subtitle: "Inserisci la tua email. Ti invieremo un link sicuro.",
        submit: "Invia il link",
        success: "Controlla la tua email per il link di recupero.",
        backToSignIn: "Torna all’accesso",
      },
      resetPassword: {
        title: "Scegli una nuova password",
        subtitle: "Usa almeno otto caratteri.",
        passwordLabel: "Nuova password",
        passwordPlaceholder: "Almeno 8 caratteri",
        submit: "Aggiorna password",
        showPassword: "Mostra password",
        hidePassword: "Nascondi password",
      },
      validation: {
        emailRequired: "Inserisci il tuo indirizzo email.",
        emailInvalid: "Inserisci un indirizzo email valido.",
        passwordRequired: "Inserisci la password.",
        passwordLength: "Usa almeno 8 caratteri.",
        nameRequired: "Inserisci il tuo nome.",
      },
      errors: {
        signIn: "Accesso non riuscito",
        signUp: "Impossibile creare l’account",
        social: (provider) => `Accesso con ${provider} non riuscito`,
        requestReset: "Impossibile richiedere il recupero password",
        reset: "Impossibile reimpostare la password",
        missingResetToken: "Il link di recupero è mancante o non valido",
      },
    },
    home: {
      greeting: (name) => `Buongiorno, ${name}`,
      subtitle: "Il tuo diario alimentare ti aspetta.",
      mascotTitle: "Boccone AI",
      title: "Il tuo diario inizia qui",
      body: "Il tuo diario avrà presto uno spazio qui. Partiamo da un primo passo semplice.",
      logout: "Esci",
      refreshError: "Impossibile aggiornare l’account. Riprova più tardi.",
      signedInAs: (email) => `Accesso effettuato come ${email ?? "il tuo account"}`,
      fallbackName: "te",
      todayTitle: "Oggi",
      todayDate: (date) => date,
      caloriesLabel: "Calorie",
      caloriesValue: (value) => (value === null || value === undefined ? "—" : `${value} kcal`),
      caloriesTarget: (target) => `su ${target} kcal obiettivo`,
      caloriesUnset: "Nessun obiettivo calorico impostato",
      macrosTitle: "Macronutrienti",
      proteinLabel: "Proteine",
      carbohydratesLabel: "Carboidrati",
      fatLabel: "Grassi",
      gramsValue: (value) => (value === null || value === undefined ? "—" : `${value} g`),
      gramsTarget: (value, target) => `${value} / ${target} g`,
      mealsTitle: "Pasti",
      addMeal: "Aggiungi pasto",
      editMeal: "Modifica pasto",
      viewMeals: "Vedi diario",
      openMeal: (name) => `Apri ${name}`,
      moreMeals: (count) => `+${count} altri oggi`,
      mealSummary: (name, calories) =>
        `${name} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      mealMeta: (category, calories) =>
        `${category} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      emptyTitle: "Nessun pasto registrato",
      emptyBody: "Aggiungi il tuo primo pasto manualmente. Potrai rivederlo quando vuoi.",
      loadError: "Impossibile caricare i pasti di oggi. Riprova più tardi.",
      retry: "Riprova",
      insightsTitle: "La tua settimana in breve",
      insightsBody: (average, days) => `${average} di media su ${days} giorni registrati`,
      insightsOpen: "Apri analisi",
      categoryLabels: {
        breakfast: "Colazione",
        lunch: "Pranzo",
        dinner: "Cena",
        snack: "Spuntino",
      },
    },
    insights: {
      title: "Analisi",
      subtitle: "Una vista calma di come hai mangiato.",
      range7d: "7G",
      range30d: "30G",
      range3m: "3M",
      range1y: "1A",
      overview: "Panoramica",
      averagePerLoggedDay: "Media per giorno registrato",
      daysLogged: (current, total) => `${current} giorni su ${total} registrati`,
      mealsLogged: (count) => `${count} pasti registrati`,
      mealTypeShare: (percent, count) => `${percent}% delle calorie registrate · ${count} pasti`,
      caloriesTrend: "Calorie nel tempo",
      nutritionTitle: "Nutrizione",
      macroComposition: "Media dei macro per giorno registrato",
      mealTypes: "Tipi di pasto",
      topFoods: "Alimenti più registrati",
      foodEntries: (count) => `${count} voci da catalogo`,
      foodBackedNote:
        "Basato sugli alimenti con valori nutrizionali in catalogo. I pasti manuali restano nei totali.",
      currentTarget: (value) => `Obiettivo attuale · ${value.toLocaleString()} kcal`,
      noDataTitle: "Le tue analisi appariranno qui",
      noDataBody:
        "Registra alcuni pasti per iniziare a vedere gli schemi della tua storia alimentare.",
      noRangeTitle: "Nessun dato in questo periodo",
      noRangeBody: "Prova un altro intervallo o continua a registrare pasti per ampliare la vista.",
      noRangeData: "Nessun pasto registrato in questo periodo.",
      loadError: "Impossibile caricare le analisi. Riprova più tardi.",
      retry: "Riprova",
      openDetail: (label) => `Apri i dettagli di ${label}`,
      openFood: (food) => `Mostra i pasti con ${food}`,
      detailTitle: (label) => `Dettagli ${label}`,
      detailAverage: "Media per giorno registrato",
      detailTotal: "Totale del periodo",
      detailCompared: (value) => `${value} rispetto al periodo precedente`,
      contributors: "Principali alimenti",
      noContributors: "Gli alimenti compariranno quando registrerai voci dal catalogo.",
      highlightTitle: "Cosa mostra il tuo diario",
      mostLoggedFood: (food, count) => `${food} è comparso ${count} volte.`,
      mostLoggedCategory: (category, count) =>
        `${category} è il tipo di pasto più registrato (${count}).`,
      calorieVariation: (value) =>
        `Le calorie sono variate di ${value.toLocaleString()} kcal nei giorni registrati.`,
      periodChange: (value) => `Variazione rispetto al periodo precedente · ${value}`,
      metricLabels: {
        calories: "Calorie",
        protein: "Proteine",
        carbs: "Carboidrati",
        fat: "Grassi",
      },
      categoryLabels: {
        breakfast: "Colazione",
        lunch: "Pranzo",
        dinner: "Cena",
        snack: "Spuntino",
      },
      chartAccessibility: (metric, average, highest, lowest, target) =>
        `${metric}. Media ${average}. Massimo ${highest}. Minimo ${lowest}.${target ? ` ${target}.` : ""}`,
      noTarget: "Nessun obiettivo calorico impostato",
    },
    meals: {
      title: "Pasti",
      subtitle: "Tieni ciò che registri in un unico spazio chiaro.",
      today: "Oggi",
      add: "Aggiungi pasto",
      addFirst: "Registra il primo pasto",
      loading: "Caricamento dei pasti di oggi…",
      loadError: "Impossibile caricare i pasti di oggi. Riprova più tardi.",
      retry: "Riprova",
      emptyTitle: "Nessun pasto oggi",
      emptyBody: "Inizia da un pasto che vuoi ricordare.",
      total: "Totale di oggi",
      openMeal: (name) => `Apri ${name}`,
      mealSummary: (name, calories) =>
        `${name} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
      mealMeta: (category, calories) =>
        `${category} · ${calories === null || calories === undefined ? "—" : `${calories} kcal`}`,
    },
    calendar: {
      title: "Calendario",
      subtitle: "Scegli un giorno per vedere cosa hai registrato.",
      previousMonth: "Mese precedente",
      nextMonth: "Mese successivo",
      chooseMonth: "Scegli un mese",
      monthPickerTitle: "Scegli un mese",
      closePicker: "Chiudi la scelta del mese",
      previousYear: "Anno precedente",
      nextYear: "Anno successivo",
      gridLabel: "Mese del calendario",
      today: "Torna a oggi",
      todaySelected: "Oggi",
      selectedDate: "Giorno selezionato",
      loadingActivity: "Controllo i giorni registrati…",
      activityError: "Impossibile caricare i giorni registrati. Riprova.",
      loadingDay: "Caricamento del giorno…",
      loadError: "Impossibile caricare questo giorno. Riprova più tardi.",
      retry: "Riprova",
      emptyPastTitle: "Nessun dato per questo giorno",
      emptyTodayTitle: "Nessun dato ancora",
      emptyBody: "Quando aggiungerai un pasto per questa data, apparirà qui.",
      emptyTodayBody: "Aggiungi un pasto quando vuoi.",
      total: "Totale del giorno",
      addMeal: "Aggiungi pasto",
      viewDiary: "Vedi diario",
      loggedMeals: (count) =>
        `${count} ${count === 1 ? "pasto" : "pasti"} registrati in questo giorno.`,
      dayAccessibility: (date, mealCount, selected, today, future) =>
        [
          date,
          selected ? "selezionato" : null,
          today ? "oggi" : null,
          future ? "data futura non disponibile" : null,
          mealCount > 0
            ? `${mealCount} ${mealCount === 1 ? "pasto" : "pasti"} registrati`
            : "nessun pasto registrato",
        ]
          .filter(Boolean)
          .join(", "),
    },
    diary: {
      title: "Diario",
      subtitle: "Rivedi nel tempo i pasti che hai registrato.",
      today: "Oggi",
      yesterday: "Ieri",
      previousDay: "Giorno precedente",
      nextDay: "Giorno successivo",
      openCalendar: "Apri calendario",
      loading: "Caricamento della tua cronologia…",
      loadError: "Impossibile caricare la cronologia. Riprova.",
      retry: "Riprova",
      emptyTitle: "La tua cronologia è ancora vuota",
      emptyBody: "Registra un pasto: resterà qui come parte della tua storia alimentare.",
      addMeal: "Registra un pasto",
      loadMore: "Mostra giorni precedenti",
      endOfHistory: "Questo è l’inizio della tua cronologia.",
      dayTotal: "Totale del giorno",
      openMeal: (name) => `Apri ${name}`,
      foodFilter: (food) => `Pasti con ${food}`,
      clearFoodFilter: "Mostra tutti i pasti",
    },
    saved: {
      title: "Pasti salvati",
      subtitle: "Pasti riutilizzabili e routine. Tocca Usa per partire già pronto.",
      tabRecent: "Oggi",
      tabSaved: "Salvati",
      routinesTitle: "Routine",
      savedTitle: "Pasti salvati",
      use: "Usa",
      useNow: "Usa ora",
      edit: "Modifica",
      delete: "Elimina",
      newSavedMeal: "Nuovo pasto salvato",
      saveFromMeal: "Salva pasto",
      saveAsSavedTitle: "Salva questo pasto",
      saveAsSavedBody: "Dai un nome: diventerà un modello riutilizzabile.",
      nameLabel: "Nome",
      namePlaceholder: "es. Colazione ufficio",
      routineSection: "Routine",
      routineOff: "Nessuna routine — solo pasto salvato",
      mealTypeLabel: "Pasto tipico",
      daysLabel: "Giorni",
      timeLabel: "Ora",
      reminderLabel: "Promemoria",
      reminderHint: "Boccone può ricordartelo all’ora che scegli.",
      presetEveryday: "Tutti i giorni",
      presetWeekdays: "Feriali",
      presetWeekends: "Weekend",
      presetCustom: "Personalizzato",
      save: "Salva",
      cancel: "Annulla",
      deleteTitle: "Eliminare questo pasto salvato?",
      deleteBody: "I pasti già registrati non vengono toccati.",
      loadError: "Impossibile caricare i pasti salvati. Riprova più tardi.",
      saveError: "Impossibile salvare. Riprova.",
      emptyTitle: "Ancora nessun salvataggio",
      emptyBody:
        "Salva i pasti che mangi spesso e riusali in un attimo. Apri un pasto e scegli Salva pasto.",
      needsAttention: "Da controllare",
      attentionBody:
        "Un alimento di questo modello non è più nel catalogo. Modifica e sostituiscilo.",
      schedulePreview: (days, time) => `${days} · ${time}`,
      everyDay: "Tutti i giorni",
      usage: (count) => (count === 1 ? "usato una volta" : `usato ${count} volte`),
      kcalApprox: (kcal) => `≈ ${kcal} kcal`,
      draftFromTemplate: (name) => `${name} (da pasto salvato)`,
      updateSavedAction: "Aggiorna pasto salvato",
      reminderPermissionTitle: "Serve il permesso notifiche",
      reminderPermissionBody:
        "Boccone può ricordartelo all’ora che scegli. Consenti le notifiche per attivarlo.",
      reminderDenied: "Le notifiche sono disattivate nelle impostazioni del dispositivo.",
      openSystemSettings: "Apri Impostazioni",
      reminderUnavailable: "Promemoria non disponibile",
    },
    meal: {
      detailEyebrow: "DETTAGLIO PASTO",
      detailDate: (category, date, time) => `${category} · ${date}${time ? ` · ${time}` : ""}`,
      notFoundTitle: "Questo pasto non è più disponibile",
      notFoundBody: "Potrebbe essere stato eliminato. Puoi tornare al diario.",
      editAction: "Modifica pasto",
      retry: "Riprova",
      addTitle: "Aggiungi un pasto",
      editTitle: "Modifica pasto",
      subtitle: "Registra ciò che hai mangiato con valori che conosci.",
      nameLabel: "Nome del pasto",
      namePlaceholder: "es. Pasta al pomodoro",
      categoryLabel: "Categoria",
      categories: { breakfast: "Colazione", lunch: "Pranzo", dinner: "Cena", snack: "Spuntino" },
      dateLabel: "Data",
      datePlaceholder: "AAAA-MM-GG",
      dateDescription: "Usa la data del tuo calendario locale: AAAA-MM-GG.",
      nutritionTitle: "Valori nutrizionali",
      caloriesLabel: "Calorie (kcal)",
      proteinLabel: "Proteine (g)",
      carbohydratesLabel: "Carboidrati (g)",
      fatLabel: "Grassi (g)",
      notesLabel: "Note",
      notesDescription: "Dettagli facoltativi per ricordare meglio questo pasto.",
      save: "Salva pasto",
      saveChanges: "Salva modifiche",
      delete: "Elimina pasto",
      cancel: "Annulla",
      deleteTitle: "Eliminare questo pasto?",
      deleteBody: "Il pasto verrà rimosso dal diario.",
      deleteError: "Impossibile eliminare il pasto. Riprova.",
      validation: "Inserisci un nome, una data valida e numeri interi per i valori nutrizionali.",
      saveError: "Impossibile salvare il pasto. Riprova.",
      loadError: "Impossibile caricare questo pasto. Riprova più tardi.",
      loading: "Caricamento del pasto…",
    },
    food: {
      title: "Aggiungi alimento",
      searchLabel: "Alimento",
      searchPlaceholder: "Prova mela o mela frutto…",
      searchHint:
        "Cerca per nome, marca o categoria. Puoi unire le parole, ad esempio mela frutto.",
      clearSearch: "Pulisci",
      quickSearchesLabel: "Scelte rapide",
      quickSearches: ["Mela", "Pasta", "Caffè"],
      recent: "Recenti",
      frequent: "Più usati",
      suggestions: "Puoi provare",
      possibleMatches: "Possibili corrispondenze",
      resultsFor: (query) => `Risultati per “${query}”`,
      noResultsFor: (query) =>
        `Nessun risultato per “${query}”. Prova con meno parole o aggiungilo tu.`,
      tryShorter: (query) => `Prova “${query}”`,
      per100g: "per 100 g",
      notFoundTitle: "Non lo trovi?",
      propose: (name) => `Aggiungi “${name}” ai tuoi alimenti`,
      addFood: "Aggiungi alimento",
      cancel: "Annulla",
      portionTitle: "Scegli una porzione",
      quantityLabel: "Quantità",
      gramsLabel: "Grammi",
      customGrams: "Grammi personalizzati",
      quickAdd: "Aggiungi porzione predefinita",
      quality: {
        authoritative: "Fonte verificata",
        branded: "Etichetta confezione",
        community: "Controllato dalla community",
        personal: "Il tuo alimento",
        estimated: "Stima",
        verified: "Verificato da Boccone",
      },
      decrement: "Diminuisci quantità",
      increment: "Aumenta quantità",
      portionStep: "Usa passi da 0,5 o scrivi un valore",
      gramsStep: "Usa passi da 10 g o scrivi un valore",
      addToMeal: "Aggiungi al pasto",
      editEntry: "Modifica",
      updateEntry: "Aggiorna voce",
      selectedFoods: "Nel pasto",
      remove: "Rimuovi",
      mealTotal: "Totale pasto",
      saveMeal: "Salva pasto",
      nameLabel: "Nome alimento",
      brandLabel: "Marca (facoltativa)",
      brandPlaceholder: "es. panificio di quartiere",
      typeLabel: "Tipo di alimento",
      types: { generic: "Generico", branded: "Confezionato", dish: "Piatto" },
      categoryLabel: "Categoria (facoltativa)",
      categoryPlaceholder: "es. dolce",
      portionNameLabel: "Porzione abituale",
      portionNamePlaceholder: "es. 1 fetta",
      portionGramsLabel: "Grammi porzione",
      caloriesPer100g: "Calorie / 100 g",
      proteinPer100g: "Proteine / 100 g",
      carbsPer100g: "Carboidrati / 100 g",
      fatPer100g: "Grassi / 100 g",
      submitFood: "Usa e proponi alimento",
      submissionNote:
        "Puoi usarlo subito. Un admin lo verificherà prima di renderlo disponibile a tutti.",
      submissionSuccess: "Alimento aggiunto ai tuoi alimenti privati.",
      loading: "Cerco nel tuo catalogo…",
      error: "Impossibile caricare gli alimenti. Riprova.",
      validation: "Inserisci nome, grammi della porzione e valori nutrizionali validi.",
      approximate: "Valore approssimativo",
      dilloEstimate: "Stima AI",
      dilloTitle: "Dillo a Boccone",
      dilloHint: "Scrivi cosa hai mangiato. Boccone preparerà una bozza da controllare.",
      dilloPlaceholder: "es. 80 g di pasta al pomodoro e un caffè",
      dilloSubmit: "Prepara bozza pasto",
      dilloReviewTitle: "Controlla la bozza",
      dilloReviewBody:
        "Controlla ogni suggerimento prima di salvare. Puoi usare una corrispondenza, aggiungere un alimento privato o rimuoverlo dal pasto.",
      dilloReviewCount: (count) =>
        count === 1 ? "1 alimento richiede una scelta" : `${count} alimenti richiedono una scelta`,
      dilloAmbiguous: "Questo alimento ha più corrispondenze possibili nel catalogo.",
      dilloUnresolved: "Questo alimento non è ancora nel catalogo. Aggiungilo manualmente sotto.",
      dilloUseCandidate: "Usa questa corrispondenza",
      dilloSearchCatalog: "Cerca nel catalogo",
      dilloSwitchManual: "Cerca invece nel catalogo",
      dilloNoNutrition: "I valori nutrizionali sono incompleti e richiedono una verifica.",
      dilloAddCustomFood: "Controlla e aggiungi alimento privato",
      dilloRemoveItem: "Rimuovi dal pasto",
      dilloSaveAfterReview: "Controlla i suggerimenti prima di salvare il pasto.",
      dilloRetry: "Riprova",
      dilloCancel: "Annulla",
      dilloProcessing: "Preparo la tua bozza…",
      dilloConfigure: "Configura un provider AI nelle Impostazioni per usare Dillo a Boccone.",
      dilloInvalidCredentials:
        "La chiave del provider AI non sembra valida. Controllala nelle Impostazioni.",
      dilloRateLimited: "Il provider AI è occupato. Riprova tra poco.",
      dilloUnavailable: "Il provider AI non è momentaneamente disponibile. Riprova.",
      dilloTimeout: "Ci è voluto troppo tempo. Il testo è ancora qui: riprova.",
      dilloInvalidResponse: "Boccone non è riuscito a preparare una bozza sicura. Riprova.",
      dilloGenericError: "Impossibile preparare la bozza del pasto. Riprova.",
    },
    settings: {
      title: "Impostazioni",
      subtitle: "Gestisci account e preferenze.",
      appearanceTitle: "Aspetto",
      appearanceBody: "Scegli come appare Boccone su questo dispositivo.",
      system: "Sistema",
      light: "Chiaro",
      dark: "Scuro",
      targetsTitle: "Obiettivi giornalieri",
      targetsBody: "Imposta solo i numeri che ti sono utili. Ogni obiettivo è facoltativo.",
      targetsOptional: "Lascia vuoto un campo per non impostare quell’obiettivo.",
      caloriesLabel: "Calorie (kcal)",
      proteinLabel: "Proteine (g)",
      carbohydratesLabel: "Carboidrati (g)",
      fatLabel: "Grassi (g)",
      saveTargets: "Salva obiettivi",
      targetsSaved: "Obiettivi salvati.",
      targetsLoadError: "Impossibile caricare gli obiettivi. Riprova più tardi.",
      targetsSaveError: "Impossibile salvare gli obiettivi. Riprova.",
      targetsInvalid: "Usa un numero intero o lascia vuoto il campo.",
      languageTitle: "Lingua",
      accountTitle: "Account",
      preferencesTitle: "Preferenze",
      profileTitle: "Profilo",
      profileBody: "I dati dell’account che Boccone ha attualmente per te.",
      profileReadOnly:
        "La modifica del profilo sarà disponibile qui quando il flusso di aggiornamento dell’account sarà pronto.",
      profileLoadError: "Impossibile caricare il profilo. Mostro comunque l’account attivo.",
      nameLabel: "Nome",
      emailLabel: "Email",
      aboutTitle: "Informazioni su Boccone",
      aboutBody: "Un compagno calmo e trasparente per ricordare ciò che mangi.",
      aboutPrincipleTitle: "Le stime restano stime",
      aboutPrincipleBody:
        "Boccone ti aiuta a registrare il cibo e a capire i tuoi schemi. Non offre consigli medici e non è uno strumento di nutrizione clinica.",
      aboutMoreTitle: "Altri dettagli in arrivo",
      aboutMoreBody:
        "Versione e dettagli sulla privacy avranno uno spazio dedicato quando queste funzioni saranno disponibili.",
      signedInTitle: "Account attivo",
      signedInAs: (email) => `Accesso effettuato come ${email ?? "il tuo account"}`,
      signOut: "Esci",
      aiTitle: "Provider AI",
      aiBody: "Usa la chiave del tuo provider. Boccone la salva cifrata e non la mostra più.",
      aiWhy:
        "Boccone usa il tuo account del provider AI. L’utilizzo viene addebitato direttamente dal provider.",
      aiProviderLabel: "Provider",
      aiProviderHint: "Scegli dove eseguire l’utilizzo AI.",
      aiModelLabel: "Modello",
      aiModelPlaceholder: "es. gpt-5-mini",
      aiSelectModel: "Scegli un modello",
      aiSearchModels: "Cerca modelli…",
      aiRecommended: "Consigliati",
      aiAllModels: "Tutti i modelli disponibili",
      aiLoadingModels: "Caricamento dei modelli disponibili…",
      aiModelsError: "Impossibile caricare i modelli. Puoi riprovare o inserire manualmente un ID.",
      aiModelsStale: "Mostro l’ultimo elenco disponibile. Potrebbe non essere aggiornato.",
      aiRefreshModels: "Aggiorna modelli",
      aiNoModels: "Il provider non ha restituito modelli utilizzabili.",
      aiManualFallbackTitle: "Non trovi il modello?",
      aiManualFallbackBody: "Inserisci l’ID esattamente come indicato dal provider.",
      aiManualAction: "Inserisci ID manualmente",
      aiManualModelLabel: "ID modello",
      aiManualModelPlaceholder: "es. mio-modello-privato",
      aiManualSave: "Usa questo modello",
      aiManualCancel: "Annulla",
      aiModelNotListed: "Questo modello non è attualmente elencato dal provider.",
      aiModelContext: (value) => `Contesto: ${value.toLocaleString()} token`,
      aiApiKeyLabel: "Chiave API",
      aiApiKeyPlaceholder: "Incolla una chiave da salvare in sicurezza",
      aiGetApiKey: "Come ottengo una chiave API?",
      aiKeyStored: "Una chiave è salvata. Lascia vuoto per mantenerla.",
      aiShowKey: "Mostra chiave",
      aiHideKey: "Nascondi chiave",
      aiBaseUrlLabel: "URL base (facoltativo)",
      aiBaseUrlHint: "Obbligatorio solo per provider compatibili con OpenAI.",
      aiBaseUrlPlaceholder: "https://api.esempio.com/v1",
      aiSave: "Salva e carica modelli",
      aiTest: "Prova connessione",
      aiDeleteKey: "Elimina chiave salvata",
      aiKeyDeleted: "Chiave salvata eliminata.",
      aiSaved: "Provider AI salvato.",
      aiTestSuccess: "Connessione riuscita.",
      aiLoadError: "Impossibile caricare le impostazioni AI. Riprova più tardi.",
      aiSaveError: "Impossibile salvare le impostazioni AI.",
      aiTestError: "La prova di connessione AI non è riuscita.",
      aiLoading: "Caricamento impostazioni AI…",
      aiInvalidCredentials: "Il provider ha rifiutato questa chiave API. Controllala.",
      aiModelNotFound: "Il provider non ha trovato questo ID modello.",
      aiModelNotAccessible: "Questo modello non è accessibile con la chiave attuale.",
      aiModelNotSelected: "Scegli o inserisci un modello prima di provare la connessione.",
      aiProviderUnavailable: "Il provider non è momentaneamente disponibile. Riprova più tardi.",
      aiRateLimited: "Il provider è occupato. Riprova tra poco.",
      aiTimeout: "Il provider ha impiegato troppo tempo a rispondere. Riprova.",
      aiGuides: {
        openai: {
          title: "Come ottenere una chiave API OpenAI",
          intro: "Crea una chiave nella Piattaforma API OpenAI, poi incollala qui.",
          steps: [
            "Apri la Piattaforma API OpenAI.",
            "Accedi o crea un account.",
            "Apri API Keys e scegli Create secret key.",
            "Copia subito la chiave e incollala in Boccone.",
          ],
          billing: "La fatturazione ChatGPT e quella dell’API OpenAI sono separate.",
          security:
            "Tratta le chiavi API come password. La chiave completa appare solo quando la crei.",
          openLabel: "Apri le API Keys OpenAI",
        },
        anthropic: {
          title: "Come ottenere una chiave API Anthropic",
          intro: "Crea la chiave nella Claude Platform, non nell’app consumer Claude.",
          steps: [
            "Apri la Console Claude Platform.",
            "Accedi o crea un account.",
            "Apri Settings, poi API keys.",
            "Crea una chiave, scegli workspace o scadenza se richiesto e incollala in Boccone.",
          ],
          billing:
            "Accesso e fatturazione API sono gestiti nella Console Claude Platform, non nell’app consumer Claude.",
          security: "Tratta le chiavi API come password. Non condividerle pubblicamente.",
          openLabel: "Apri le API Keys Anthropic",
        },
        gemini: {
          title: "Come ottenere una chiave API Gemini",
          intro: "Google AI Studio può creare un progetto e una chiave durante il primo accesso.",
          steps: [
            "Apri Google AI Studio.",
            "Apri la pagina API keys e scegli Create API key.",
            "Seleziona o crea il progetto Google Cloud della chiave.",
            "Copia la chiave e incollala in Boccone.",
          ],
          billing:
            "Limiti più alti possono richiedere la fatturazione Google Cloud sul progetto scelto.",
          security: "Tratta le chiavi API come password. Non condividerle pubblicamente.",
          openLabel: "Apri le API Keys Google AI Studio",
        },
        openrouter: {
          title: "Come ottenere una chiave API OpenRouter",
          intro: "Una chiave OpenRouter può dare a Boccone accesso a modelli di più provider.",
          steps: [
            "Apri OpenRouter e accedi o crea un account.",
            "Apri API Keys e scegli Create key.",
            "Imposta un limite di spesa o una scadenza se vuoi.",
            "Copia la chiave e incollala in Boccone.",
          ],
          billing:
            "Controlla crediti, limiti e prezzi dei modelli OpenRouter prima di usare la connessione.",
          security: "Tratta le chiavi API come password. Non condividerle pubblicamente.",
          openLabel: "Apri le API Keys OpenRouter",
        },
        "openai-compatible": {
          title: "Provider personalizzato",
          intro:
            "Non esiste un flusso universale per creare una chiave con un provider personalizzato.",
          steps: [],
          customNeeds:
            "Ti servono un URL base API, una chiave o un token se richiesto e un ID modello. Cerca questi valori nella documentazione del provider.",
          security: "Tratta chiavi e token come password. Non condividerli pubblicamente.",
          openLabel: "Apri la documentazione del provider",
        },
      },
    },
  },
};

export function detectDeviceLocale(): Locale {
  const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return deviceLocale.startsWith("it") ? "it" : "en";
}

export function isLocale(value: string | null): value is Locale {
  return value !== null && supportedLocales.includes(value as Locale);
}
