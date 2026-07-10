"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { fetchEvents, setParticipation } from "@/lib/firebase/events";
import { fetchTracks } from "@/lib/firebase/tracks";
import type { RcEvent, Track } from "@/types";

export default function EvenementsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<RcEvent[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchEvents(), fetchTracks()]).then(([e, t]) => {
      setEvents(
        e.filter((ev) => ev.date >= Date.now() - 24 * 3600 * 1000).sort((a, b) => a.date - b.date)
      );
      setTracks(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? id;

  async function handleParticipation(eventId: string, status: "going" | "interested" | "none") {
    if (!user) return;
    await setParticipation(eventId, user.uid, status);
    load();
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Belgique
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Événements</h1>
      </div>

      {loading && <p className="text-center text-sm text-track-muted">Chargement…</p>}

      {!loading && events.length === 0 && (
        <p className="text-center text-sm text-track-muted">
          Aucun événement à venir pour l&apos;instant.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {events.map((ev) => {
          const isGoing = user ? ev.going.includes(user.uid) : false;
          const isInterested = user ? ev.interested.includes(user.uid) : false;
          return (
            <div key={ev.id} className="overflow-hidden rounded-xl2 border border-track-border bg-track-surface">
              {ev.photoURL && (
                <img src={ev.photoURL} alt={ev.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="font-display text-lg font-bold">{ev.title}</p>
                <p className="text-sm text-track-muted">
                  {trackName(ev.trackId)} ·{" "}
                  {new Date(ev.date).toLocaleString("fr-BE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {ev.description && <p className="mt-2 text-sm text-track-white">{ev.description}</p>}
                {ev.externalLink && (
                  <a
                    href={ev.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-track-orange underline"
                  >
                    Plus d&apos;infos →
                  </a>
                )}
                <p className="mt-2 text-xs text-track-muted">
                  {ev.going.length} participant{ev.going.length > 1 ? "s" : ""} ·{" "}
                  {ev.interested.length} intéressé{ev.interested.length > 1 ? "s" : ""}
                </p>
                {user ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={isGoing ? "primary" : "secondary"}
                      onClick={() => handleParticipation(ev.id, isGoing ? "none" : "going")}
                    >
                      Je participe
                    </Button>
                    <Button
                      variant={isInterested ? "primary" : "secondary"}
                      onClick={() => handleParticipation(ev.id, isInterested ? "none" : "interested")}
                    >
                      Je suis intéressé
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-track-muted">Connecte-toi pour participer.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
