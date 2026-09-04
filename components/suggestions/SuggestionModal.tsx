"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "seffer.frederic@gmail.com";

const CATEGORY_OPTIONS: Record<"fr" | "nl", { value: string; label: string }[]> = {
  fr: [
    { value: "evenement", label: "Ajouter un événement" },
    { value: "piste", label: "Ajouter/corriger une piste" },
    { value: "bug", label: "Signaler un problème" },
    { value: "autre", label: "Autre" },
  ],
  nl: [
    { value: "evenement", label: "Evenement toevoegen" },
    { value: "piste", label: "Circuit toevoegen/corrigeren" },
    { value: "bug", label: "Een probleem melden" },
    { value: "autre", label: "Andere" },
  ],
};

export default function SuggestionModal({ onClose }: { onClose: () => void }) {
  const { t, locale } = useLanguage();
  const { profile } = useAuth();
  const [category, setCategory] = useState(CATEGORY_OPTIONS[locale][0].value);
  const [message, setMessage] = useState("");

  function handleSend() {
    const categoryLabel = CATEGORY_OPTIONS[locale].find((c) => c.value === category)?.label ?? category;
    const subject = `[RC Tracks Belgium] ${categoryLabel}`;
    const body = [
      message,
      "",
      "—",
      profile ? `${locale === "nl" ? "Verzonden door" : "Envoyé par"} : ${profile.displayName}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">
            {locale === "nl" ? "Suggestie of vraag" : "Suggestion ou question"}
          </h2>
          <button onClick={onClose} aria-label={t("close")}>
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <p className="text-sm text-track-muted">
          {locale === "nl"
            ? "Dit opent je e-mailapp met een voorgevuld bericht naar de beheerder van de app."
            : "Ça ouvre ton application mail avec un message déjà prêt, à destination de l'administrateur de l'app."}
        </p>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {locale === "nl" ? "Onderwerp" : "Sujet"}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            {CATEGORY_OPTIONS[locale].map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            {locale === "nl" ? "Ton message" : "Message"}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={locale === "nl" ? "Schrijf hier je bericht…" : "Écris ton message ici…"}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <Button onClick={handleSend} disabled={!message.trim()} className="w-full">
          {locale === "nl" ? "Openen in je mailapp" : "Ouvrir dans ta messagerie"}
        </Button>
      </div>
    </div>
  );
}
