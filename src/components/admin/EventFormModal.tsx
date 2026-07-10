"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { fetchTracks } from "@/lib/firebase/tracks";
import { createEvent, updateEvent, type EventInput } from "@/lib/firebase/events";
import Button from "@/components/ui/Button";
import type { Track, RcEvent } from "@/types";

export default function EventFormModal({
  event,
  createdBy,
  onClose,
  onSaved,
}: {
  event?: RcEvent | null; // fourni = mode édition
  createdBy: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [trackId, setTrackId] = useState(event?.trackId ?? "");
  const [dateStr, setDateStr] = useState(
    event ? new Date(event.date).toISOString().slice(0, 16) : ""
  );
  const [externalLink, setExternalLink] = useState(event?.externalLink ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(event?.photoURL ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks().then((t) => {
      const sorted = t.sort((a, b) => a.name.localeCompare(b.name));
      setTracks(sorted);
      if (!event && sorted.length > 0) setTrackId((prev) => prev || sorted[0].id);
    });
  }, [event]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `events/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  }

  async function handleSubmit() {
    if (!title.trim() || !trackId || !dateStr) {
      setError("Titre, piste et date sont obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: EventInput = {
        title: title.trim(),
        description: description.trim(),
        date: new Date(dateStr).getTime(),
        photoURL,
        trackId,
        externalLink: externalLink.trim() || null,
      };
      if (event) {
        await updateEvent(event.id, input);
      } else {
        await createEvent(input, createdBy);
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer l'événement, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">
            {event ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button onClick={onClose} aria-label="Fermer">
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Titre
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Course régionale TT"
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Piste
          </label>
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Date et heure
          </label>
          <input
            type="datetime-local"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Lien externe (facultatif)
          </label>
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Photo (facultatif)
          </label>
          {photoURL && (
            <img src={photoURL} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm" />
        </div>

        {error && <p className="text-sm text-track-red">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? "Enregistrement…" : event ? "Enregistrer les modifications" : "Créer l'événement"}
        </Button>
      </div>
    </div>
  );
}
