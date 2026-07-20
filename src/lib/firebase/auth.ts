import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";
import type { UserProfile } from "@/types";

/**
 * Crée le document Firestore /users/{uid} s'il n'existe pas encore.
 * Appelé après chaque connexion réussie, quel que soit le fournisseur.
 * Retourne true si c'était une toute première connexion (profil venant d'être créé).
 */
async function ensureUserProfile(user: User): Promise<boolean> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;

  // Google renvoie le nom complet ("Frédéric Seffer") ; par respect de la vie privée,
  // on ne garde que le prénom par défaut. La personne peut le personnaliser dans Profil.
  const defaultName = user.displayName
    ? user.displayName.split(" ")[0]
    : (user.email?.split("@")[0] ?? "Pilote");

  const profile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
    uid: user.uid,
    displayName: defaultName,
    photoURL: user.photoURL,
    email: user.email,
    favoriteTrackId: null,
    role: "user",
    createdAt: serverTimestamp(),
    stats: { sessionsCount: 0 },
  };

  await setDoc(ref, profile);
  return true;
}

export async function signInWithGoogle(): Promise<boolean> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return ensureUserProfile(result.user);
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<boolean> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return ensureUserProfile({ ...result.user, displayName } as User);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
