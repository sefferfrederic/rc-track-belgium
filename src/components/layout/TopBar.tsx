"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TopBar() {
  const { user, profile } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="sticky top-0 z-[1000] border-b border-track-border bg-track-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Retour à l'accueil">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-track-border bg-track-surface">
            <Home size={18} className="text-track-orange" />
          </span>
          {/* Remplace /public/logo.svg par le logo officiel fourni (garde le même nom de fichier) */}
          <img src="/logo.svg" alt="RC Tracks Belgium Meeting" width={28} height={28} className="rounded-md" />
          <span className="hidden font-display text-lg font-bold uppercase tracking-wide sm:inline">
            RC Tracks <span className="text-gradient-flag">Belgium</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-track-border p-0.5">
            <button
              onClick={() => setLocale("fr")}
              aria-label="Passer en français"
              className={`rounded-full px-2.5 py-1 font-display text-xs font-bold uppercase transition-colors ${
                locale === "fr" ? "bg-flag-gradient text-track-bg" : "text-track-muted"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLocale("nl")}
              aria-label="Overschakelen naar Nederlands"
              className={`rounded-full px-2.5 py-1 font-display text-xs font-bold uppercase transition-colors ${
                locale === "nl" ? "bg-flag-gradient text-track-bg" : "text-track-muted"
              }`}
            >
              NL
            </button>
          </div>

          <Link href={user ? "/profil" : "/login"} className="flex items-center gap-2">
            {user && profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="h-9 w-9 rounded-full object-cover ring-2 ring-track-orange/50" />
            ) : (
              <span className="rounded-full border border-track-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-track-muted">
                {user ? t("nav_profile") : t("nav_login")}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

