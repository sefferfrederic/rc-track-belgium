"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { firebaseApp, db } from "./client";

function buildServiceWorkerUrl(): string {
  // On passe la config Firebase en paramètres d'URL plutôt que de la coder en
  // dur dans public/firebase-messaging-sw.js (qui n'est pas traité par Next.js
  // et n'a donc pas accès à process.env) — voir commentaire dans ce fichier.
  const params = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export type EnablePushResult = "granted" | "denied" | "unsupported" | "error";

/**
 * Demande la permission de notification au navigateur, enregistre le service
 * worker, récupère un token FCM pour cet appareil et l'ajoute au profil
 * Firestore de l'utilisateur (un utilisateur peut avoir plusieurs appareils).
 */
export async function enablePushNotifications(uid: string): Promise<EnablePushResult> {
  try {
    if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
    if (!(await isSupported())) return "unsupported";

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const registration = await navigator.serviceWorker.register(buildServiceWorkerUrl());
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return "error";

    await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });

    // Notifications reçues pendant que l'app est ouverte au premier plan
    // (le service worker ne gère que l'arrière-plan/app fermée).
    onMessage(messaging, (payload) => {
      if (Notification.permission !== "granted") return;
      const title = payload.notification?.title ?? "RC Tracks Belgium";
      const body = payload.notification?.body ?? "";
      const url = payload.data?.url || "/";
      const notif = new Notification(title, { body, icon: "/logo.svg" });
      notif.onclick = () => {
        window.focus();
        if (url !== window.location.pathname) window.location.href = url;
      };
    });

    return "granted";
  } catch (err) {
    console.error("Erreur activation notifications push :", err);
    return "error";
  }
}
