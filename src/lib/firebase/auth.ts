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
 */
async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const profile: Omit<UserProfile, "createdAt"> & { createdAt: unknown } = {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Pilote",
    photoURL: user.photoURL,
    email: user.email,
    favoriteTrackId: null,
    role: "user",
    createdAt: serverTimestamp(),
    stats: { sessionsCount: 0 },
  };

  await setDoc(ref, profile);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfile(result.user);
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<void> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserProfile({ ...result.user, displayName } as User);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
