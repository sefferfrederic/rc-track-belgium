"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import CertaintyPicker from "@/components/session/CertaintyPicker";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { upsertSessionEntry } from "@/lib/firebase/sessions";
import { useAuth } from "@/contexts/AuthContext";
import { todayDayKey } from "@/lib/date";
import type { Track, Taxonomy, CertaintyLevel } from "@/types";

function roundedNowTimeStr(): string {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
  return d.toTimeString().slice(0, 5);
}

function addHoursToTimeStr(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + hours * 60) % (24 * 60);
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

interface Props {
  fixedTrackId?: string; // si fourni : piste déjà choisie (rejoindre, ou "créer ici" depuis la fiche piste)
  fixedDayKey?: string; // si fourni : jour déjà choisi (ex. depuis le calendrier)
  onClose: () => void;
  onSaved: () => void;
}

export default function SessionFormModal({ fixedTrackId, fixedDayKey, onClose, onSaved }: Props) {
  const { user, profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [trackId, setTrackId] = useState(fixedTrackId ?? "");
  const [dayKey, setDayKey] = useState(fixedDayKey ?? todayDayKey());
  const [startTime, setStartTime] = useState(roundedNowTimeStr());
  const [endTime, setEndTime] = useState(addHoursToTimeStr(roundedNowTimeStr(), 2));
  const [certainty, setCertainty] = useState<CertaintyLevel>(75);
  const [disciplineId, setDisciplineId] = useState("");
  const [scaleId, setScaleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTracks(), fetchTaxonomies()]).then(([t, tax]) => {
      const sorted = t.sort((a, b) => a.name.localeCompare(b.name));
      setTracks(sorted);
      setTaxonomies(tax);
      if (!fixedTrackId && sorted.length > 0) setTrackId((prev) => prev || sorted[0].id);
    });
  }, [fixedTrackId]);

  const selectedTrack = tracks.find((t) => t.id === trackId) ?? null;

  const disciplineOptions = useMemo(
    () => taxonomies.filter((t) => t.type === "discipline" && selectedTrack?.disciplineIds.includes(t.id)),
    [taxonomies, selectedTrack]
  );
  const scaleOptions = useMemo(
    () => taxonomies.filter((t) => t.type === "scale" && selectedTrack?.scaleIds.includes(t.id)),
    [taxonomies, selectedTrack]
  );

  // Auto-sélectionne l'unique option (ou réinitialise si la piste change), pour ne demander
  // un choix à l'utilisateur que quand c'est réellement ambigu.
  useEffect(() => {
    if (disciplineOptions.length === 1) setDisciplineId(disciplineOptions[0].id);
    else if (!disciplineOptions.some((d) => d.id === disciplineId)) setDisciplineId("");
  }, [disciplineOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scaleOptions.length === 1) setScaleId(scaleOptions[0].id);
    else if (!scaleOptions.some((s) => s.id === scaleId)) setScaleId("");
  }, [scaleOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!user || !profile || !trackId) return;
    setError(null);
    const start = new Date(`${dayKey}T${startTime}:00`).getTime();
    const end = new Date(`${dayKey}T${endTime}:00`).getTime();
    if (end <= start) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSaving(true);
    try {
      await upsertSessionEntry({
        trackId,
        dayKey,
        uid: user.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        start,
        end,
        certainty,
        disciplineId: disciplineId || null,
        scaleId: scaleId || null,
      });
      onSaved();
    } catch {
      setError("Impossible d'enregistrer la session, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-xl2 border border-track-border bg-track-surface p-5 md:rounded-xl2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase">
            {fixedTrackId ? "Je roule aussi" : "Nouvelle session"}
          </h2>
          <button onClick={onClose} aria-label="Fermer">
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        {fixedTrackId ? (
          <div className="rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm">
            <span className="text-track-muted">Piste : </span>
            <span className="font-semibold text-track-white">{selectedTrack?.name ?? "…"}</span>
          </div>
        ) : (
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
        )}

        {fixedDayKey ? (
          <div className="rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm">
            <span className="text-track-muted">Date : </span>
            <span className="font-semibold text-track-white">
              {new Date(`${dayKey}T00:00:00`).toLocaleDateString("fr-BE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Date
            </label>
            <input
              type="date"
              value={dayKey}
              onChange={(e) => setDayKey(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
        )}

        {disciplineOptions.length > 1 && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Discipline
            </label>
            <select
              value={disciplineId}
              onChange={(e) => setDisciplineId(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            >
              <option value="">Non précisé</option>
              {disciplineOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {scaleOptions.length > 1 && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Échelle
            </label>
            <select
              value={scaleId}
              onChange={(e) => setScaleId(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            >
              <option value="">Non précisée</option>
              {scaleOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Début
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
              Fin
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
            />
          </div>
        </div>

        <CertaintyPicker value={certainty} onChange={setCertainty} />

        {error && <p className="text-sm text-track-red">{error}</p>}

        <Button onClick={handleSubmit} disabled={saving || !trackId} className="w-full">
          {saving ? "Enregistrement…" : "Valider ma session"}
        </Button>
      </div>
    </div>
  );
}
