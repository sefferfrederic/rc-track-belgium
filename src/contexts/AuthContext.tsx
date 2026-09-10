"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { normalizeProfile } from "@/lib/firebase/auth";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    let unsubscribeProfile: (() => void) | undefined;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const subscribe = () => {
      const ref = doc(db, "users", user.uid);
      unsubscribeProfile = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? normalizeProfile(snap.data()) : null);
          setLoading(false);
        },
        (error) => {
          // Juste après une connexion, le token d'auth peut ne pas encore être
          // propagé au moment où ce listener démarre : Firestore renvoie alors
          // un unique "permission-denied" avant de se stabiliser. On réessaie
          // une fois plutôt que de laisser planter l'app.
          if (error.code === "permission-denied" && !cancelled) {
            retryTimeout = setTimeout(subscribe, 500);
          } else {
            console.error("Erreur chargement profil :", error);
            setLoading(false);
          }
        }
      );
    };
    subscribe();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubscribeProfile?.();
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
