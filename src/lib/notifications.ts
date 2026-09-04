import type { NotificationPrefs } from "@/types";

/**
 * Toutes les catégories sont activées par défaut (opt-out) : un profil qui n'a
 * jamais touché à ses préférences (champ `notificationPrefs` absent) reçoit
 * donc toutes les notifications tant qu'il ne les désactive pas lui-même.
 */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  sessionsNewOnFavorite: true,
  sessionsReminder: true,
  marketplaceNew: true,
  garageNewSetup: true,
  announcements: true,
};

/** Fusionne les préférences enregistrées avec les valeurs par défaut (migration douce). */
export function resolveNotificationPrefs(
  prefs?: Partial<NotificationPrefs> | null
): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs ?? {}) };
}
