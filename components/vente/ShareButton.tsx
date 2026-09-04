"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShareClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // L'utilisateur a annulé le partage — rien à faire.
      }
      return;
    }
    setMenuOpen((v) => !v);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="relative">
      <button
        onClick={handleShareClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm font-semibold text-track-white"
      >
        <Share2 size={16} />
        {t("vente_share")}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 flex flex-col gap-1 rounded-xl2 border border-track-border bg-track-surface p-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-track-surface2"
            >
              {copied ? <Check size={16} className="text-track-orange" /> : <Copy size={16} />}
              {copied ? t("vente_link_copied") : t("vente_copy_link")}
            </button>
            <a
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-sm hover:bg-track-surface2"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-sm hover:bg-track-surface2"
            >
              Facebook
            </a>
            <a
              href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
              className="rounded-lg px-3 py-2 text-sm hover:bg-track-surface2"
            >
              Email
            </a>
          </div>
        </>
      )}
    </div>
  );
}
