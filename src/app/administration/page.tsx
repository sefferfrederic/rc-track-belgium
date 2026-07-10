"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import EventFormModal from "@/components/admin/EventFormModal";
import TrackFormModal from "@/components/admin/TrackFormModal";
import TaxonomyManager from "@/components/admin/TaxonomyManager";
import { fetchEvents, deleteEvent } from "@/lib/firebase/events";
import { fetchTracks, fetchTaxonomies, deleteTrack } from "@/lib/firebase/tracks";
import type { RcEvent, Track, Taxonomy } from "@/types";

type Tab = "events" | "tracks" | "taxonomies";

export default function AdministrationPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");

  const [events, setEvents] = useState<RcEvent[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [busy, setBusy] = useState(true);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RcEvent | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const load = useCallback(() => {
    setBusy(true);
    Promise.all([fetchEvents(), fetchTracks(), fetchTaxonomies()]).then(([e, t, tax]) => {
      setEvents(e.sort((a, b) => a.date - b.date));
      setTracks(t.sort((a, b) => a.name.localeCompare(b.name)));
      setTaxonomies(tax);
      setBusy(false);
    });
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") load();
  }, [profile, load]);

  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? id;
  const taxLabel = (id: string) => taxonomies.find((t) => t.id === id)?.label ?? id;

  async function handleDeleteEvent(id: string) {
    if (!confirm("Supprimer définitivement cet événement ?")) return;
    await deleteEvent(id);
    load();
  }

  async function handleDeleteTrack(id: string) {
    if (!confirm("Supprimer définitivement cette piste ?")) return;
    await deleteTrack(id);
    load();
  }

  if (loading || !profile) {
    return <p className="pt-8 text-center text-track-muted">Chargement…</p>;
  }

  if (profile.role !== "admin") {
    return (
      <div className="pt-8 text-center">
        <p className="font-display text-lg font-bold uppercase">Accès réservé</p>
        <p className="mt-2 text-sm text-track-muted">
          Cette section est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Administration
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Gérer l&apos;application</h1>
      </div>

      <div className="flex gap-2 border-b border-track-border pb-2">
        {(
          [
            ["events", "Événements"],
            ["tracks", "Pistes"],
            ["taxonomies", "Catégories"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide",
              tab === key ? "bg-track-orange/10 text-track-white" : "text-track-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {busy && <p className="text-center text-sm text-track-muted">Chargement…</p>}

      {!busy && tab === "events" && (
        <>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setEventModalOpen(true);
            }}
          >
            Nouvel événement
          </Button>

          {events.length === 0 && (
            <p className="text-center text-sm text-track-muted">Aucun événement pour l&apos;instant.</p>
          )}

          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div key={ev.id} className="rounded-xl2 border border-track-border bg-track-surface p-4">
                <p className="font-display text-base font-bold">{ev.title}</p>
                <p className="text-sm text-track-muted">
                  {trackName(ev.trackId)} ·{" "}
                  {new Date(ev.date).toLocaleString("fr-BE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="mt-1 text-xs text-track-muted">
                  {ev.going.length} participant{ev.going.length > 1 ? "s" : ""} · {ev.interested.length}{" "}
                  intéressé{ev.interested.length > 1 ? "s" : ""}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingEvent(ev);
                      setEventModalOpen(true);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button variant="ghost" onClick={() => handleDeleteEvent(ev.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!busy && tab === "tracks" && (
        <>
          <Button
            onClick={() => {
              setEditingTrack(null);
              setTrackModalOpen(true);
            }}
          >
            Nouvelle piste
          </Button>

          <div className="flex flex-col gap-3">
            {tracks.map((t) => (
              <div key={t.id} className="rounded-xl2 border border-track-border bg-track-surface p-4">
                <p className="font-display text-base font-bold">{t.name}</p>
                {t.address && <p className="text-sm text-track-muted">{t.address}</p>}
                <p className="mt-1 flex flex-wrap gap-1 text-xs text-track-muted">
                  {[...t.disciplineIds, ...t.surfaceIds, ...t.scaleIds].map((id) => (
                    <span key={id} className="rounded-full border border-track-border px-2 py-0.5">
                      {taxLabel(id)}
                    </span>
                  ))}
                  {t.disciplineIds.length + t.surfaceIds.length + t.scaleIds.length === 0 && (
                    <span>Aucune catégorie renseignée</span>
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingTrack(t);
                      setTrackModalOpen(true);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button variant="ghost" onClick={() => handleDeleteTrack(t.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!busy && tab === "taxonomies" && (
        <TaxonomyManager taxonomies={taxonomies} onChanged={load} />
      )}

      {eventModalOpen && user && (
        <EventFormModal
          event={editingEvent}
          createdBy={user.uid}
          onClose={() => setEventModalOpen(false)}
          onSaved={() => {
            setEventModalOpen(false);
            load();
          }}
        />
      )}

      {trackModalOpen && user && (
        <TrackFormModal
          track={editingTrack}
          createdBy={user.uid}
          onClose={() => setTrackModalOpen(false)}
          onSaved={() => {
            setTrackModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
