"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTracks } from "@/lib/firebase/tracks";
import Button from "@/components/ui/Button";
import Link from "next/link";
import type { Track } from "@/types";

export default function ProfilPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) setDisplayName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    fetchTracks().then((t) => setTracks(t.sort((a, b) => a.name.localeCompare(b.name))));
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "users", user.uid), { displayName });
      setMessage("Profil mis à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return <p className="pt-8 text-center text-track-muted">Chargement du profil…</p>;
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 pt-6">
      <label className="group relative cursor-pointer">
        <img
          src={profile.photoURL ?? "/logo.svg"}
          alt={profile.displayName}
          className="h-24 w-24 rounded-full object-cover ring-2 ring-track-orange/60"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-semibold uppercase opacity-0 transition-opacity group-hover:opacity-100">
          Changer
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </label>

      <div className="w-full">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
          Pseudo / Prénom
        </label>
        <input
          className="w-full rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="w-full rounded-xl2 border border-track-border bg-track-surface p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-track-muted">
          Piste favorite
        </label>
        <p className="mt-1 text-xs text-track-muted">
          Utilisée pour l&apos;aperçu rapide des prochaines sessions sur l&apos;Accueil.
        </p>
        <select
          value={profile.favoriteTrackId ?? ""}
          onChange={async (e) => {
            if (!user) return;
            const value = e.target.value || null;
            await updateDoc(doc(db, "users", user.uid), { favoriteTrackId: value });
          }}
          className="mt-2 w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
        >
          <option value="">Aucune piste favorite</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid w-full grid-cols-2 gap-4 text-center">
        <div className="rounded-xl2 border border-track-border bg-track-surface p-4">
          <p className="font-display text-2xl font-bold">{profile.stats.sessionsCount}</p>
          <p className="text-xs text-track-muted">Sessions</p>
        </div>
        <div className="rounded-xl2 border border-track-border bg-track-surface p-4">
          <p className="font-display text-2xl font-bold uppercase">{profile.role}</p>
          <p className="text-xs text-track-muted">Rôle</p>
        </div>
      </div>

      {profile.role === "admin" && (
        <Link href="/administration" className="w-full">
          <Button variant="secondary" className="w-full">
            Panneau d&apos;administration
          </Button>
        </Link>
      )}

      {message && <p className="text-sm text-track-orange">{message}</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
      <Button variant="ghost" onClick={() => signOut().then(() => router.push("/"))}>
        Se déconnecter
      </Button>
    </div>
  );
}
