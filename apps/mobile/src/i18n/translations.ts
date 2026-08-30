import type { MealCategory } from "@boccone/contracts";

export const supportedLocales = ["en", "it"] as const;
export type Locale = (typeof supportedLocales)[number];

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
    categoryLabels: Record<MealCategory, string>;
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
    previousWeek: string;
    nextWeek: string;
    today: string;
    selectedDate: string;
    loadingWeek: string;
    loadingDay: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyBody: string;
    total: string;
    dayAccessibility: (date: string, mealCount: number) => string;
  };
  diary: {
    title: string;
    subtitle: string;
    comingSoonTitle: string;
    comingSoonMessage: string;
  };
  meal: {
    detailEyebrow: string;
    detailDate: (category: string, date: string) => string;
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
  food: {
    title: string;
    searchPlaceholder: string;
    searchHint: string;
    recent: string;
    frequent: string;
    suggestions: string;
    possibleMatches: string;
    results: string;
    noResults: string;
    notFoundTitle: string;
    propose: (name: string) => string;
    addFood: string;
    cancel: string;
    portionTitle: string;
    quantityLabel: string;
    gramsLabel: string;
    customGrams: string;
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
      viewMeals: "See all",
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
      categoryLabels: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
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
      previousWeek: "Previous week",
      nextWeek: "Next week",
      today: "Back to today",
      selectedDate: "Selected day",
      loadingWeek: "Checking this week…",
      loadingDay: "Loading this day…",
      loadError: "Could not load this day. Try again later.",
      retry: "Try again",
      emptyTitle: "Nothing logged for this day",
      emptyBody: "When you add a meal for this date, it will appear here.",
      total: "Day total",
      dayAccessibility: (date, mealCount) =>
        `${date}, ${mealCount} ${mealCount === 1 ? "meal" : "meals"}`,
    },
    diary: {
      title: "Diary",
      subtitle: "Your longer view of meals and food memories.",
      comingSoonTitle: "Your history is taking shape",
      comingSoonMessage:
        "A calm chronological view of your meals is coming soon. Your logged meals already live in Meals and Calendar.",
    },
    meal: {
      detailEyebrow: "MEAL DETAIL",
      detailDate: (category, date) => `${category} · ${date}`,
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
      searchPlaceholder: "Search food…",
      searchHint: "Search by name, like apple or pasta.",
      recent: "Recent",
      frequent: "Frequent",
      suggestions: "Try these",
      possibleMatches: "Possible matches",
      results: "Results",
      noResults: "No matching food yet.",
      notFoundTitle: "Can’t find it?",
      propose: (name) => `Add “${name}” to your foods`,
      addFood: "Add food",
      cancel: "Cancel",
      portionTitle: "Choose a portion",
      quantityLabel: "Quantity",
      gramsLabel: "Grams",
      customGrams: "Custom grams",
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
    },
    settings: {
      title: "Your space",
      subtitle: "A few quiet choices, kept close.",
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
      viewMeals: "Vedi tutti",
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
      categoryLabels: {
        breakfast: "Colazione",
        lunch: "Pranzo",
        dinner: "Cena",
        snack: "Spuntino",
      },
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
      previousWeek: "Settimana precedente",
      nextWeek: "Settimana successiva",
      today: "Torna a oggi",
      selectedDate: "Giorno selezionato",
      loadingWeek: "Controllo la settimana…",
      loadingDay: "Caricamento del giorno…",
      loadError: "Impossibile caricare questo giorno. Riprova più tardi.",
      retry: "Riprova",
      emptyTitle: "Nessun dato per questo giorno",
      emptyBody: "Quando aggiungerai un pasto per questa data, apparirà qui.",
      total: "Totale del giorno",
      dayAccessibility: (date, mealCount) =>
        `${date}, ${mealCount} ${mealCount === 1 ? "pasto" : "pasti"}`,
    },
    diary: {
      title: "Diario",
      subtitle: "Una visione nel tempo dei tuoi pasti e dei tuoi ricordi.",
      comingSoonTitle: "La tua storia sta prendendo forma",
      comingSoonMessage:
        "Una vista cronologica e calma dei tuoi pasti arriverà presto. Quelli che hai registrato sono già in Pasti e Calendario.",
    },
    meal: {
      detailEyebrow: "DETTAGLIO PASTO",
      detailDate: (category, date) => `${category} · ${date}`,
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
      searchPlaceholder: "Cerca un alimento…",
      searchHint: "Cerca per nome, ad esempio mela o pasta.",
      recent: "Recenti",
      frequent: "Più usati",
      suggestions: "Puoi provare",
      possibleMatches: "Possibili corrispondenze",
      results: "Risultati",
      noResults: "Nessun alimento trovato.",
      notFoundTitle: "Non lo trovi?",
      propose: (name) => `Aggiungi “${name}” ai tuoi alimenti`,
      addFood: "Aggiungi alimento",
      cancel: "Annulla",
      portionTitle: "Scegli una porzione",
      quantityLabel: "Quantità",
      gramsLabel: "Grammi",
      customGrams: "Grammi personalizzati",
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
    },
    settings: {
      title: "Il tuo spazio",
      subtitle: "Poche scelte tranquille, sempre a portata di mano.",
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
