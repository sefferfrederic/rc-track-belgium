import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * SDK Admin Firebase — utilisé uniquement dans des routes API (côté serveur).
 * Contourne les règles de sécurité Firestore/Storage, donc à réserver aux tâches
 * de confiance (ex: nettoyage automatique planifié). Ne jamais importer ce fichier
 * dans un composant "use client".
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

export const adminDb = getFirestore(getAdminApp());
export const adminStorage = getStorage(getAdminApp());
