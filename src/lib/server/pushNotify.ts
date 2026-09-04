import { FieldPath, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb, getAdminMessaging } from "@/lib/firebase/admin";
import { resolveNotificationPrefs } from "@/lib/notifications";
import type { NotificationPrefs } from "@/types";

/**
 * Envoi de notifications push (Firebase Cloud Messaging) depuis des routes API
 * Next.js — jamais depuis le client (SDK Admin réservé au serveur).
 * Ne jamais importer ce fichier dans un composant "use client".
 */

interface PushPayload {
  title: string;
  body: string;
  url?: string; // chemin ouvert au clic sur la notification, ex. "/agenda"
}

const SITE_URL = "https://rc-tracks-belgium.be";

/** Envoie aux tokens des documents fournis, en respectant leurs préférences,
 * puis retire du profil les tokens que FCM signale comme invalides/expirés. */
async function dispatch(
  docs: QueryDocumentSnapshot[],
  prefKey: keyof NotificationPrefs,
  payload: PushPayload
): Promise<void> {
  if (docs.length === 0) return;
  const adminDb = getAdminDb();
  const messaging = getAdminMessaging();

  const tokens: string[] = [];
  const tokenOwners = new Map<string, string>();
  for (const d of docs) {
    const data = d.data();
    const prefs = resolveNotificationPrefs(data.notificationPrefs);
    if (!prefs[prefKey]) continue;
    const userTokens: string[] = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
    for (const t of userTokens) {
      tokens.push(t);
      tokenOwners.set(t, d.id);
    }
  }
  if (tokens.length === 0) return;

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: { url: payload.url ?? "/" }, // lu par le service worker au clic
    webpush: {
      notification: { icon: "/logo.svg", badge: "/logo.svg" },
      // FCM exige une URL absolue ici (une URL relative est rejetée) ; le
      // service worker, lui, se sert plutôt du champ "data.url" ci-dessus.
      fcmOptions: { link: `${SITE_URL}${payload.url ?? "/"}` },
    },
  });

  const staleByUid = new Map<string, string[]>();
  res.responses.forEach((r, i) => {
    if (r.success) return;
    const code = r.error?.code ?? "";
    if (code.includes("registration-token-not-registered") || code.includes("invalid-argument")) {
      const token = tokens[i];
      const uid = tokenOwners.get(token);
      if (uid) staleByUid.set(uid, [...(staleByUid.get(uid) ?? []), token]);
    }
  });
  for (const [uid, staleTokens] of staleByUid) {
    const ref = adminDb.collection("users").doc(uid);
    const snap = await ref.get();
    const current: string[] = snap.data()?.fcmTokens ?? [];
    await ref.update({ fcmTokens: current.filter((t) => !staleTokens.includes(t)) });
  }
}

/** Diffuse à tous les utilisateurs (moins un éventuel exclu, ex. l'auteur). */
export async function sendPushToAllUsers(
  prefKey: keyof NotificationPrefs,
  payload: PushPayload,
  excludeUid?: string
): Promise<void> {
  const snap = await getAdminDb().collection("users").get();
  await dispatch(
    snap.docs.filter((d) => d.id !== excludeUid),
    prefKey,
    payload
  );
}

/** Cible les utilisateurs ayant cette piste dans leurs pistes favorites. */
export async function sendPushToFavoriteTrackUsers(
  trackId: string,
  prefKey: keyof NotificationPrefs,
  payload: PushPayload,
  excludeUid?: string
): Promise<void> {
  const snap = await getAdminDb()
    .collection("users")
    .where("favoriteTrackIds", "array-contains", trackId)
    .get();
  await dispatch(
    snap.docs.filter((d) => d.id !== excludeUid),
    prefKey,
    payload
  );
}

/** Cible une liste précise d'utilisateurs (ex. les participants d'une session). */
export async function sendPushToUids(
  uids: string[],
  prefKey: keyof NotificationPrefs,
  payload: PushPayload
): Promise<void> {
  if (uids.length === 0) return;
  const adminDb = getAdminDb();
  // Les requêtes "in" sur l'ID de document sont limitées à 30 éléments côté Firestore.
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const snap = await adminDb.collection("users").where(FieldPath.documentId(), "in", chunk).get();
    await dispatch(snap.docs, prefKey, payload);
  }
}
