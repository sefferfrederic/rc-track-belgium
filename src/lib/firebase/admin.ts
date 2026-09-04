import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";

/**
 * SDK Admin Firebase — utilisé uniquement dans des routes API (côté serveur).
 * Contourne les règles de sécurité Firestore/Storage, donc à réserver aux tâches
 * de confiance (ex: nettoyage automatique planifié). Ne jamais importer ce fichier
 * dans un composant "use client".
 *
 * Initialisation VOLONTAIREMENT paresseuse (dans des fonctions, pas au chargement
 * du module) : sans ça, Next.js essaie d'évaluer ce fichier pendant "npm run build",
 * et ça fait planter TOUT le déploiement si les variables d'environnement ne sont
 * pas encore configurées sur Vercel — même pour des pages qui n'ont rien à voir.
 */
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}
