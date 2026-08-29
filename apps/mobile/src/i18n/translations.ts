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
  };
}

export const translations: Record<Locale, TranslationCopy> = {
  en: {
    language: { label: "Language", english: "English", italian: "Italian" },
    loading: { tagline: "Making food tracking feel lighter." },
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
      body: "Nutrition and meal tracking will arrive in the next product slice.",
      logout: "Log out",
      refreshError: "Could not refresh your account. Pull to retry later.",
      signedInAs: (email) => `Signed in as ${email ?? "your account"}`,
      fallbackName: "there",
    },
  },
  it: {
    language: { label: "Lingua", english: "Inglese", italian: "Italiano" },
    loading: { tagline: "Rendere più semplice seguire ciò che mangi." },
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
      body: "Il monitoraggio di alimenti e pasti arriverà nel prossimo blocco di prodotto.",
      logout: "Esci",
      refreshError: "Impossibile aggiornare l’account. Riprova più tardi.",
      signedInAs: (email) => `Accesso effettuato come ${email ?? "il tuo account"}`,
      fallbackName: "te",
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
