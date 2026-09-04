"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Bell } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { enablePushNotifications, type EnablePushResult } from "@/lib/firebase/messaging";
import { resolveNotificationPrefs } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NotificationPrefs } from "@/types";
import type { TranslationKey } from "@/lib/i18n/translations";

const CATEGORIES: { key: keyof NotificationPrefs; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { key: "sessionsNewOnFavorite", titleKey: "notif_cat_sessions_new_title", descKey: "notif_cat_sessions_new_desc" },
  { key: "sessionsReminder", titleKey: "notif_cat_sessions_reminder_title", descKey: "notif_cat_sessions_reminder_desc" },
  { key: "marketplaceNew", titleKey: "notif_cat_marketplace_title", descKey: "notif_cat_marketplace_desc" },
  { key: "garageNewSetup", titleKey: "notif_cat_garage_title", descKey: "notif_cat_garage_desc" },
  { key: "announcements", titleKey: "notif_cat_announcements_title", descKey: "notif_cat_announcements_desc" },
];

export default function NotificationsPreferencesPage() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [enabling, setEnabling] = useState(false);
  const [status, setStatus] = useState<EnablePushResult | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (!user || !profile) {
    return <p className="pt-8 text-center text-track-muted">…</p>;
  }

  const prefs = resolveNotificationPrefs(profile.notificationPrefs);
  const hasToken = (profile.fcmTokens?.length ?? 0) > 0;

  async function toggle(key: keyof NotificationPrefs) {
    const next: NotificationPrefs = { ...prefs, [key]: !prefs[key] };
    await updateDoc(doc(db, "users", user!.uid), { notificationPrefs: next });
  }

  async function handleEnable() {
    setEnabling(true);
    setStatus(null);
    const result = await enablePushNotifications(user!.uid);
    setStatus(result);
    setEnabling(false);
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/profil" className="flex items-center gap-1 text-sm text-track-muted hover:text-track-white">
        <ChevronLeft size={16} /> {t("notif_prefs_back")}
      </Link>

      <h1 className="font-display text-xl font-bold uppercase">{t("notif_prefs_title")}</h1>

      {!hasToken && (
        <div className="rounded-xl2 border border-track-orange/40 bg-track-orange/10 p-4">
          <p className="text-sm">{t("notif_prefs_enable_hint")}</p>
          <button
            onClick={handleEnable}
            disabled={enabling}
            className="mt-3 flex items-center gap-2 rounded-full bg-flag-gradient px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-track-bg shadow-glow disabled:opacity-60"
          >
            <Bell size={15} strokeWidth={2.5} />
            {enabling ? t("notif_prefs_enabling") : t("notif_prefs_enable_button")}
          </button>
          {status === "denied" && <p className="mt-2 text-xs text-track-red">{t("notif_prefs_denied")}</p>}
          {status === "unsupported" && <p className="mt-2 text-xs text-track-muted">{t("notif_prefs_unsupported")}</p>}
          {status === "error" && <p className="mt-2 text-xs text-track-red">{t("notif_prefs_error")}</p>}
        </div>
      )}

      {hasToken && <p className="text-xs text-track-muted">{t("notif_prefs_active_on_device")}</p>}

      <div className="flex flex-col gap-3">
        {CATEGORIES.map(({ key, titleKey, descKey }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl2 border border-track-border bg-track-surface p-4"
          >
            <div>
              <p className="text-sm font-semibold">{t(titleKey)}</p>
              <p className="text-xs text-track-muted">{t(descKey)}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={prefs[key]}
              className={`h-7 w-12 shrink-0 rounded-full transition-colors ${
                prefs[key] ? "bg-track-orange" : "bg-track-surface2"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  prefs[key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
