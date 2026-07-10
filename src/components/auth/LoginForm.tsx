"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } from "@/lib/firebase/auth";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function withLoading(fn: () => Promise<void>) {
    setError(null);
    setLoading(true);
    try {
      await fn();
      router.push("/profil");
    } catch (err) {
      setError(err instanceof Error ? traduireErreur(err.message) : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 pt-6">
      <h1 className="text-center font-display text-2xl font-bold uppercase">Connexion</h1>

      <Button variant="secondary" disabled={loading} onClick={() => withLoading(signInWithGoogle)}>
        Continuer avec Google
      </Button>
      <Button variant="secondary" disabled={loading} onClick={() => withLoading(signInWithApple)}>
        Continuer avec Apple
      </Button>

      <div className="my-2 flex items-center gap-3 text-xs uppercase text-track-muted">
        <span className="h-px flex-1 bg-track-border" /> ou <span className="h-px flex-1 bg-track-border" />
      </div>

      {mode === "signup" && (
        <input
          className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
          placeholder="Pseudo ou prénom"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}
      <input
        className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-sm text-track-red">{error}</p>}

      {mode === "signin" ? (
        <Button disabled={loading} onClick={() => withLoading(() => signInWithEmail(email, password))}>
          Se connecter
        </Button>
      ) : (
        <Button disabled={loading} onClick={() => withLoading(() => signUpWithEmail(email, password, displayName))}>
          Créer mon compte
        </Button>
      )}

      <button
        type="button"
        className="text-center text-sm text-track-muted underline underline-offset-4"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
      </button>
    </div>
  );
}

function traduireErreur(message: string): string {
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("auth/email-already-in-use")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("auth/weak-password")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return "Une erreur est survenue, réessaie.";
}
