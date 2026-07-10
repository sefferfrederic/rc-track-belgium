"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import SessionCard from "@/components/session/SessionCard";
import SessionFormModal from "@/components/session/SessionFormModal";
import { fetchSessionsForDay } from "@/lib/firebase/sessions";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { todayDayKey } from "@/lib/date";
import type { RidingSession, Track, Taxonomy } from "@/types";

export default function HomePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<RidingSession[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [joinContext, setJoinContext] = useState<{ trackId: string; dayKey: string } | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchSessionsForDay(todayDayKey()), fetchTracks(), fetchTaxonomies()]).then(
      ([s, t, tax]) => {
        setSessions(s.sort((a, b) => a.windowStart - b.windowStart));
        setTracks(t);
        setTaxonomies(tax);
        setLoading(false);
      }
    );
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-8">
      <section className="pt-2">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Belgique · Modélisme RC
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight">
          Qui roule. <span className="text-gradient-flag">Où. Quand.</span>
        </h1>
        <p className="mt-3 max-w-md text-track-muted">
          Indique ta session en 3 clics et retrouve les autres pilotes de ta piste favorite,
          au lieu de rouler chacun de son côté.
        </p>
        <div className="mt-6 flex gap-3">
          {user ? (
            <Button
              onClick={() => {
                setJoinContext(null);
                setModalOpen(true);
              }}
            >
              Nouvelle session
            </Button>
          ) : (
            <Link href="/login">
              <Button>Se connecter pour rouler</Button>
            </Link>
          )}
          <Link href="/carte">
            <Button variant="secondary">Voir la carte</Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-track-muted">
          Aujourd&apos;hui
        </h2>

        {!user && (
          <p className="mt-3 text-sm text-track-muted">
            Connecte-toi pour voir qui roule aujourd&apos;hui et déclarer ta session.
          </p>
        )}

        {user && loading && <p className="mt-3 text-sm text-track-muted">Chargement…</p>}

        {user && !loading && sessions.length === 0 && (
          <p className="mt-3 text-sm text-track-muted">
            Personne n&apos;a encore déclaré de session aujourd&apos;hui. Sois le premier !
          </p>
        )}

        <div className="mt-3 flex flex-col gap-3">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              trackName={trackName(s.trackId)}
              taxonomies={taxonomies}
              onChanged={load}
              onJoinClick={() => {
                setJoinContext({ trackId: s.trackId, dayKey: s.dayKey });
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      </section>

      {modalOpen && (
        <SessionFormModal
          fixedTrackId={joinContext?.trackId}
          fixedDayKey={joinContext?.dayKey ?? todayDayKey()}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
