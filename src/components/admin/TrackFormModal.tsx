"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { fetchTaxonomies, createTrack, updateTrack, type TrackInput } from "@/lib/firebase/tracks";
import Button from "@/components/ui/Button";
import type { Taxonomy, Track } from "@/types";

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Taxonomy[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              selected.includes(opt.id)
                ? "border-track-orange bg-track-orange/10 text-track-white"
                : "border-track-border text-track-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-track-muted">
            Aucune option — ajoute-en dans &quot;Gérer les catégories&quot; ci-dessous.
          </p>
        )}
      </div>
    </div>
  );
}

export default function TrackFormModal({
  track,
  createdBy,
  onClose,
  onSaved,
}: {
  track?: Track | null; // fourni = mode édition
  createdBy: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [name, setName] = useState(track?.name ?? "");
  const [address, setAddress] = useState(track?.address ?? "");
  const [lat, setLat] = useState(track ? String(track.lat) : "");
  const [lng, setLng] = useState(track ? String(track.lng) : "");
  const [description, setDescription] = useState(track?.description ?? "");
  const [website, setWebsite] = useState(track?.website ?? "");
  const [photoURL, setPhotoURL] = useState<string | null>(track?.photoURL ?? null);
  const [disciplineIds, setDisciplineIds] = useState<string[]>(track?.disciplineIds ?? []);
  const [surfaceIds, setSurfaceIds] = useState<string[]>(track?.surfaceIds ?? []);
  const [scaleIds, setScaleIds] = useState<string[]>(track?.scaleIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaxonomies().then(setTaxonomies);
  }, []);

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `tracks/${track?.id ?? "new"}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  }

  async function handleSubmit() {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!name.trim() || isNaN(latNum) || isNaN(lngNum)) {
      setError("Le nom et des coordonnées GPS valides sont obligatoires.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: TrackInput = {
        name: name.trim(),
        address: address.trim(),
        lat: latNum,
        lng: lngNum,
        surfaceIds,
        disciplineIds,
        scaleIds,
        photoURL,
        description: description.trim(),
        website: website.trim() || null,
      };
      if (track) {
        await updateTrack(track.id, input);
      } else {
        await createTrack(input, createdBy);
      }
      onSaved();
    } catch {
      setError("Impossible d'enregistrer la piste, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const disciplines = taxonomies.filter((t) => t.type === "discipline");
  const surfaces = taxonomies.filter((t) => t.type === "surface");
  const scales = taxonomies.filter((t) => t.type === "scale");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">
            {track ? "Modifier la piste" : "Nouvelle piste"}
          </h2>
          <button onClick={onClose} aria-label="Fermer">
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Nom
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
            Adresse
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Latitude
            </label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="ex : 50.6520"
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Longitude
            </label>
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="ex : 5.4629"
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-track-muted">
          Astuce : clique droit sur l&apos;emplacement dans Google Maps → les coordonnées sont le
          premier élément du menu, à copier-coller ici.
        </p>

        <CheckboxGroup
          label="Disciplines"
          options={disciplines}
          selected={disciplineIds}
          onToggle={(id) => toggle(disciplineIds, setDisciplineIds, id)}
        />
        <CheckboxGroup
          label="Surfaces"
          options={surfaces}
          selected={surfaceIds}
          onToggle={(id) => toggle(surfaceIds, setSurfaceIds, id)}
        />
        <CheckboxGroup
          label="Échelles compatibles"
          options={scales}
          selected={scaleIds}
          onToggle={(id) => toggle(scaleIds, setScaleIds, id)}
        />

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
            Site web (facultatif)
          </label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
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
          {saving ? "Enregistrement…" : track ? "Enregistrer les modifications" : "Créer la piste"}
        </Button>
      </div>
    </div>
  );
}
