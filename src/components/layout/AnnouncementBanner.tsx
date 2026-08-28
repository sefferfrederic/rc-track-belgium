"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchActiveAnnouncement } from "@/lib/firebase/announcements";
import { localizedText } from "@/lib/localize";
import type { Announcement } from "@/types";

const DISMISSED_KEY = "rc-track-dismissed-announcement";

const TYPE_STYLES: Record<Announcement["type"], string> = {
  info: "border-track-border bg-track-surface",
  important: "border-track-red bg-track-red/5",
  evenement: "border-track-orange bg-track-orange/5",
};

const TYPE_ICON: Record<Announcement["type"], string> = {
  info: "ℹ️",
  important: "⚠️",
  evenement: "🎉",
};

export default function AnnouncementBanner() {
  const { t, locale } = useLanguage();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchActiveAnnouncement()
      .then((a) => {
        if (!a) return;
        // Ne pas réafficher un message déjà fermé par cet utilisateur sur cet appareil.
        const dismissedId = typeof window !== "undefined" ? window.localStorage.getItem(DISMISSED_KEY) : null;
        if (dismissedId === a.id) return;
        setAnnouncement(a);
      })
      .catch((err) => {
        // Pas d'index encore créé ou erreur réseau — on n'affiche simplement pas la bannière.
        console.error("Erreur bannière annonce :", err);
      });
  }, []);

  if (!announcement) return null;

  function handleDismiss() {
    if (!announcement) return;
    window.localStorage.setItem(DISMISSED_KEY, announcement.id);
    setAnnouncement(null);
  }

  return (
    <section
      className={clsx("relative rounded-xl2 border p-4 pr-10", TYPE_STYLES[announcement.type])}
    >
      <button
        onClick={handleDismiss}
        aria-label={t("announcement_close")}
        className="absolute right-3 top-3 text-track-muted hover:text-track-white"
      >
        <X size={18} />
      </button>
      <p className="font-display text-sm font-bold">
        {TYPE_ICON[announcement.type]} {localizedText(announcement.title, announcement.titleNl, locale)}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-track-muted">
        {localizedText(announcement.message, announcement.messageNl, locale)}
      </p>
    </section>
  );
}
