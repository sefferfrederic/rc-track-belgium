"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import SessionFormModal from "@/components/session/SessionFormModal";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import type { Track, Taxonomy } from "@/types";

const DISCIPLINE_COLORS: Record<string, string> = {
  "discipline-tt": "#E8102B",
  "discipline-onroad": "#FF6A00",
  "discipline-indoor": "#FFC700",
  "discipline-crawler": "#F5F5F7",
};

export default function PistesPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [disciplines, setDisciplines] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [sessionTrackId, setSessionTrackId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTracks(), fetchTaxonomies()]).then(([t, tax]) => {
      setTracks(t.sort((a, b) => a.name.localeCompare(b.name)));
      setDisciplines(tax.filter((x) => x.type === "discipline"));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (active ? tracks.filter((t) => t.disciplineIds.includes(active)) : tracks),
    [tracks, active]
  );

  const disciplineLabel = (id: string) => disciplines.find((d) => d.id === id)?.label ?? id;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
            Belgique
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold">Pistes</h1>
        </div>
        <Link
          href="/carte"
          className="rounded-full border border-track-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-track-muted hover:text-track-white"
        >
          Voir sur la carte
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActive(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide ${
            active === null ? "border-track-orange bg-track-orange/10 text-track-white" : "border-track-border text-track-muted"
          }`}
        >
          Toutes ({tracks.length})
        </button>
        {disciplines.map((d) => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-display font-semibold uppercase tracking-wide ${
              active === d.id ? "border-track-orange bg-track-orange/10 text-track-white" : "border-track-border text-track-muted"
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: DISCIPLINE_COLORS[d.id] ?? "#8C8C96" }} />
            {d.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="pt-8 text-center text-sm text-track-muted">Chargement des pistes…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((track) => (
            <li
              key={track.id}
              className="rounded-xl2 border border-track-border bg-track-surface p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-base font-bold">{track.name}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs uppercase tracking-wide text-track-muted">
                    {track.disciplineIds.map((id) => (
                      <span key={id} className="flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: DISCIPLINE_COLORS[id] ?? "#8C8C96" }}
                        />
                        {disciplineLabel(id)}
                      </span>
                    ))}
                  </p>
                </div>
                {track.website && (
                  <a
                    href={track.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full border border-track-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-track-muted hover:text-track-white"
                  >
                    Site du club
                  </a>
                )}
              </div>
              {user && (
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => setSessionTrackId(track.id)}
                >
                  Créer une session ici
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {sessionTrackId && (
        <SessionFormModal
          fixedTrackId={sessionTrackId}
          onClose={() => setSessionTrackId(null)}
          onSaved={() => setSessionTrackId(null)}
        />
      )}
    </div>
  );
}
