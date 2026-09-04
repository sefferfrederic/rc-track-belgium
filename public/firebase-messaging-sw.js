/* eslint-disable no-undef */
// Service worker de notifications push (Firebase Cloud Messaging).
// La config Firebase n'est PAS codée en dur ici : elle est passée dans les
// paramètres de l'URL au moment de l'enregistrement (voir lib/firebase/messaging.ts),
// pour ne pas dupliquer les valeurs déjà présentes dans .env.local. Ce sont des
// clés publiques (NEXT_PUBLIC_...), déjà exposées dans le bundle client — aucun secret ici.
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

// Notification reçue alors que l'app/onglet est fermé ou en arrière-plan.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "RC Tracks Belgium";
  const body = payload.notification?.body ?? "";
  const url = payload.fcmOptions?.link || payload.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/logo.svg",
    badge: "/logo.svg",
    data: { url },
  });
});

// Clic sur la notification : ouvre (ou réutilise) un onglet sur la bonne page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
