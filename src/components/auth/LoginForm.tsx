"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginForm() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function withLoading(fn: () => Promise<boolean | void>) {
    setError(null);
    setLoading(true);
    try {
      const isFirstTime = await fn();
      router.push(isFirstTime ? "/profil?bienvenue=1" : "/profil");
    } catch (err) {
      setError(err instanceof Error ? traduireErreur(err.message, locale) : (locale === "nl" ? "Er is een fout opgetreden." : "Une erreur est survenue."));
    } finally {
      setLoading(false);
    }
  }

  function handleSignup() {
    if (!displayName.trim()) {
      setError(
        locale === "nl"
          ? "Kies een bijnaam — dit is wat andere piloten zullen zien."
          : "Choisis un pseudo — c'est ce que les autres pilotes verront."
      );
      return;
    }
    withLoading(() => signUpWithEmail(email, password, displayName.trim()));
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 pt-6">
      <h1 className="text-center font-display text-2xl font-bold uppercase">{t("login_title")}</h1>

      <Button variant="secondary" disabled={loading} onClick={() => withLoading(signInWithGoogle)}>
        {t("login_google")}
      </Button>

      <div className="my-2 flex items-center gap-3 text-xs uppercase text-track-muted">
        <span className="h-px flex-1 bg-track-border" /> {t("login_or")} <span className="h-px flex-1 bg-track-border" />
      </div>

      {mode === "signup" && (
        <input
          className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
          placeholder={t("login_nickname")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}
      <input
        className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
        placeholder={t("login_email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
        placeholder={t("login_password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-sm text-track-red">{error}</p>}

      {mode === "signin" ? (
        <Button disabled={loading} onClick={() => withLoading(() => signInWithEmail(email, password))}>
          {t("login_signin")}
        </Button>
      ) : (
        <Button disabled={loading} onClick={handleSignup}>
          {t("login_signup")}
        </Button>
      )}

      <button
        type="button"
        className="text-center text-sm text-track-muted underline underline-offset-4"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? t("login_no_account") : t("login_has_account")}
      </button>
    </div>
  );
}

function traduireErreur(message: string, locale: "fr" | "nl"): string {
  const fr = {
    badCred: "Email ou mot de passe incorrect.",
    inUse: "Un compte existe déjà avec cet email.",
    weak: "Le mot de passe doit contenir au moins 6 caractères.",
    other: "Une erreur est survenue, réessaie.",
  };
  const nl = {
    badCred: "E-mail of wachtwoord onjuist.",
    inUse: "Er bestaat al een account met dit e-mailadres.",
    weak: "Het wachtwoord moet minstens 6 tekens bevatten.",
    other: "Er is een fout opgetreden, probeer opnieuw.",
  };
  const msgs = locale === "nl" ? nl : fr;
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return msgs.badCred;
  }
  if (message.includes("auth/email-already-in-use")) {
    return msgs.inUse;
  }
  if (message.includes("auth/weak-password")) {
    return msgs.weak;
  }
  return msgs.other;
}

