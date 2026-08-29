import type { MealCategory } from "@boccone/contracts";

export const supportedLocales = ["en", "it"] as const;
export type Locale = (typeof supportedLocales)[number];

export interface TranslationCopy {
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
    settings: string;
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
    caloriesValue: (value: number) => string;
    caloriesTarget: (target: number) => string;
    caloriesUnset: string;
    macrosTitle: string;
    proteinLabel: string;
    carbohydratesLabel: string;
    fatLabel: string;
    gramsValue: (value: number) => string;
    gramsTarget: (value: number, target: number) => string;
    mealsTitle: string;
    addMeal: string;
    editMeal: string;
    mealSummary: (name: string, calories: number) => string;
    emptyTitle: string;
    emptyBody: string;
    loadError: string;
    categoryLabels: Record<MealCategory, string>;
  };
  meal: {
    addTitle: string;
    editTitle: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    categoryLabel: string;
    categories: Record<MealCategory, string>;
    dateLabel: string;
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
    signedInAs: (email: string | undefined) => string;
    signOut: string;
  };
}

export const translations: Record<Locale, TranslationCopy> = {
  en: {
    language: { label: "Language", english: "English", italian: "Italian" },
    loading: { tagline: "Making food tracking feel lighter." },
    navigation: { home: "Home", settings: "Settings" },
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
      caloriesValue: (value) => `${value} kcal`,
      caloriesTarget: (target) => `of ${target} kcal target`,
      caloriesUnset: "No calorie target set",
      macrosTitle: "Macros",
      proteinLabel: "Protein",
      carbohydratesLabel: "Carbohydrates",
      fatLabel: "Fat",
      gramsValue: (value) => `${value} g`,
      gramsTarget: (value, target) => `${value} / ${target} g`,
      mealsTitle: "Meals",
      addMeal: "Add meal",
      editMeal: "Edit meal",
      mealSummary: (name, calories) => `${name} · ${calories} kcal`,
      emptyTitle: "Nothing logged yet",
      emptyBody: "Add your first meal manually. You can review it here anytime.",
      loadError: "Could not load today's meals. Try again later.",
      categoryLabels: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
    },
    meal: {
      addTitle: "Add a meal",
      editTitle: "Edit meal",
      subtitle: "Record what you ate with values you trust.",
      nameLabel: "Meal name",
      namePlaceholder: "e.g. Pasta with tomato sauce",
      categoryLabel: "Category",
      categories: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" },
      dateLabel: "Date",
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
      signedInAs: (email) => `Signed in as ${email ?? "your account"}`,
      signOut: "Log out",
    },
  },
  it: {
    language: { label: "Lingua", english: "Inglese", italian: "Italiano" },
    loading: { tagline: "Rendere più semplice seguire ciò che mangi." },
    navigation: { home: "Home", settings: "Impostazioni" },
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
      caloriesValue: (value) => `${value} kcal`,
      caloriesTarget: (target) => `su ${target} kcal obiettivo`,
      caloriesUnset: "Nessun obiettivo calorico impostato",
      macrosTitle: "Macronutrienti",
      proteinLabel: "Proteine",
      carbohydratesLabel: "Carboidrati",
      fatLabel: "Grassi",
      gramsValue: (value) => `${value} g`,
      gramsTarget: (value, target) => `${value} / ${target} g`,
      mealsTitle: "Pasti",
      addMeal: "Aggiungi pasto",
      editMeal: "Modifica pasto",
      mealSummary: (name, calories) => `${name} · ${calories} kcal`,
      emptyTitle: "Nessun pasto registrato",
      emptyBody: "Aggiungi il tuo primo pasto manualmente. Potrai rivederlo quando vuoi.",
      loadError: "Impossibile caricare i pasti di oggi. Riprova più tardi.",
      categoryLabels: {
        breakfast: "Colazione",
        lunch: "Pranzo",
        dinner: "Cena",
        snack: "Spuntino",
      },
    },
    meal: {
      addTitle: "Aggiungi un pasto",
      editTitle: "Modifica pasto",
      subtitle: "Registra ciò che hai mangiato con valori che conosci.",
      nameLabel: "Nome del pasto",
      namePlaceholder: "es. Pasta al pomodoro",
      categoryLabel: "Categoria",
      categories: { breakfast: "Colazione", lunch: "Pranzo", dinner: "Cena", snack: "Spuntino" },
      dateLabel: "Data",
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
