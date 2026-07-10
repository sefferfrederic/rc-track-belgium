"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import SessionCard from "@/components/session/SessionCard";
import SessionFormModal from "@/components/session/SessionFormModal";
import MonthCalendar from "@/components/agenda/MonthCalendar";
import { fetchSessionsForRange } from "@/lib/firebase/sessions";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { fetchEvents, setParticipation } from "@/lib/firebase/events";
import { todayDayKey, addMonths, monthStartKey, monthEndKey, toDayKey } from "@/lib/date";
import type { RidingSession, Track, RcEvent, Taxonomy } from "@/types";

function formatDayLabel(dayKey: string): string {
  const label = new Date(`${dayKey}T00:00:00`).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [monthDayKey, setMonthDayKey] = useState(todayDayKey());
  const [selectedDayKey, setSelectedDayKey] = useState(todayDayKey());
  const [sessions, setSessions] = useState<RidingSession[]>([]);
  const [events, setEvents] = useState<RcEvent[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [trackFilter, setTrackFilter] = useState<string>(""); // "" = toutes les pistes
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [joinContext, setJoinContext] = useState<{ trackId: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchSessionsForRange(monthStartKey(monthDayKey), monthEndKey(monthDayKey)),
      fetchTracks(),
      fetchEvents(),
      fetchTaxonomies(),
    ]).then(([s, t, e, tax]) => {
      setSessions(s);
      setTracks(t.sort((a, b) => a.name.localeCompare(b.name)));
      setEvents(e);
      setTaxonomies(tax);
      setLoading(false);
    });
  }, [monthDayKey]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSessions = useMemo(
    () => (trackFilter ? sessions.filter((s) => s.trackId === trackFilter) : sessions),
    [sessions, trackFilter]
  );

  const filteredEvents = useMemo(
    () => (trackFilter ? events.filter((e) => e.trackId === trackFilter) : events),
    [events, trackFilter]
  );

  const countsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filteredSessions) {
      map[s.dayKey] = (map[s.dayKey] ?? 0) + s.participants.length;
    }
    return map;
  }, [filteredSessions]);

  const eventDayKeys = useMemo(
    () => new Set(filteredEvents.map((e) => toDayKey(new Date(e.date)))),
    [filteredEvents]
  );

  const selectedDaySessions = filteredSessions
    .filter((s) => s.dayKey === selectedDayKey)
    .sort((a, b) => a.windowStart - b.windowStart);

  const selectedDayEvents = filteredEvents
    .filter((e) => toDayKey(new Date(e.date)) === selectedDayKey)
    .sort((a, b) => a.date - b.date);

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
          Agenda
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Qui roule ce mois-ci ?</h1>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-track-muted">
          Piste
        </label>
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="w-full rounded-lg border border-track-border bg-track-surface px-4 py-3 text-sm outline-none focus:border-track-orange"
        >
          <option value="">Toutes les pistes</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <MonthCalendar
        monthDayKey={monthDayKey}
        selectedDayKey={selectedDayKey}
        countsByDay={countsByDay}
        eventDayKeys={eventDayKeys}
        onSelectDay={setSelectedDayKey}
        onPrevMonth={() => setMonthDayKey((d) => addMonths(d, -1))}
        onNextMonth={() => setMonthDayKey((d) => addMonths(d, 1))}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          {formatDayLabel(selectedDayKey)}
        </h2>
        {user && (
          <Button
            onClick={() => {
              setJoinContext(null);
              setModalOpen(true);
            }}
          >
            Nouvelle session
          </Button>
        )}
      </div>

      {loading && <p className="text-center text-sm text-track-muted">Chargement…</p>}

      {!loading && selectedDaySessions.length === 0 && selectedDayEvents.length === 0 && (
        <p className="text-center text-sm text-track-muted">Rien de prévu ce jour-là.</p>
      )}

      <div className="flex flex-col gap-3">
        {selectedDaySessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            trackName={trackName(s.trackId)}
            taxonomies={taxonomies}
            onChanged={load}
            onJoinClick={() => {
              setJoinContext({ trackId: s.trackId });
              setModalOpen(true);
            }}
          />
        ))}

        {selectedDayEvents.map((ev) => {
          const isGoing = user ? ev.going.includes(user.uid) : false;
          const isInterested = user ? ev.interested.includes(user.uid) : false;
          return (
            <div
              key={ev.id}
              className="rounded-xl2 border border-track-red/40 bg-track-surface p-4"
            >
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-track-red">
                Événement
              </p>
              <p className="mt-1 font-display text-base font-bold">{ev.title}</p>
              <p className="text-sm text-track-muted">
                {trackName(ev.trackId)} ·{" "}
                {new Date(ev.date).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {ev.description && <p className="mt-2 text-sm text-track-white">{ev.description}</p>}
              {user && (
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
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <SessionFormModal
          fixedTrackId={joinContext?.trackId}
          fixedDayKey={selectedDayKey}
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
