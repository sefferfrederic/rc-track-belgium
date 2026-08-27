"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import SessionCard from "@/components/session/SessionCard";
import SessionFormModal from "@/components/session/SessionFormModal";
import { fetchSessionsForDay, fetchUpcomingSessionsForTrack, fetchRecentSessions } from "@/lib/firebase/sessions";
import { fetchTracks, fetchTaxonomies } from "@/lib/firebase/tracks";
import { fetchRecentEvents, setParticipation } from "@/lib/firebase/events";
import { fetchPublicSetups } from "@/lib/firebase/cars";
import { todayDayKey } from "@/lib/date";
import { consumeLastVisit } from "@/lib/lastVisit";
import type { RidingSession, Track, Taxonomy, RcEvent, CarSetup } from "@/types";

type NewsItem =
  | { type: "session"; createdAt: number; session: RidingSession }
  | { type: "event"; createdAt: number; event: RcEvent }
  | { type: "setup"; createdAt: number; setup: CarSetup };

export default function HomePage() {
  const { user, profile } = useAuth();
  const { t, locale } = useLanguage();
  const [sessions, setSessions] = useState<RidingSession[]>([]);
  const [favoriteSessions, setFavoriteSessions] = useState<RidingSession[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
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

  useEffect(() => {
    if (profile?.favoriteTrackId) {
      fetchUpcomingSessionsForTrack(profile.favoriteTrackId, todayDayKey()).then(setFavoriteSessions);
    } else {
      setFavoriteSessions([]);
    }
  }, [profile?.favoriteTrackId]);

  // "Nouveautés depuis ta dernière visite" — pas de notification push, mais un
  // rappel bien visible dès que tu rouvres l'app, sans rien à déployer côté serveur.
  useEffect(() => {
    if (!user) return;
    const since = consumeLastVisit();
    Promise.all([fetchRecentSessions(since), fetchRecentEvents(since), fetchPublicSetups()])
      .then(
        ([recentSessions, recentEvents, publicSetups]) => {
          const items: NewsItem[] = [
            ...recentSessions.map((session): NewsItem => ({ type: "session", createdAt: session.createdAt, session })),
            ...recentEvents.map((event): NewsItem => ({ type: "event", createdAt: event.createdAt, event })),
            ...publicSetups
              .filter((s) => s.createdAt > since)
              .map((setup): NewsItem => ({ type: "setup", createdAt: setup.createdAt, setup })),
          ]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6);
          setNews(items);
        }
      )
      .catch((err) => {
        // L'index "réglages publics" n'est peut-être pas encore créé — on n'affiche
        // simplement pas le bandeau "Nouveautés" plutôt que de casser toute la page.
        console.error("Erreur fil nouveautés :", err);
      });
  }, [user]);

  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? id;

  async function handleEventParticipation(eventId: string, status: "going" | "interested" | "none") {
    if (!user) return;
    await setParticipation(eventId, user.uid, status);
    setNews((prev) =>
      prev.map((item) => {
        if (item.type !== "event" || item.event.id !== eventId) return item;
        const going = item.event.going.filter((u) => u !== user.uid);
        const interested = item.event.interested.filter((u) => u !== user.uid);
        if (status === "going") going.push(user.uid);
        if (status === "interested") interested.push(user.uid);
        return { ...item, event: { ...item.event, going, interested } };
      })
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <AnnouncementBanner />

      <section className="pt-2">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          Belgique · Modélisme RC
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight">
          {t("home_tagline_1")} <span className="text-gradient-flag">{t("home_tagline_2")}</span>
        </h1>
        <p className="mt-3 max-w-md text-track-muted">{t("home_subtitle")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Button
              onClick={() => {
                setJoinContext(null);
                setModalOpen(true);
              }}
            >
              {t("home_new_session")}
            </Button>
          ) : (
            <Link href="/login">
              <Button>{t("home_login_to_ride")}</Button>
            </Link>
          )}
          <Link href="/carte">
            <Button variant="secondary">{t("home_view_map")}</Button>
          </Link>
          <Link href="/reglages-publics">
            <Button variant="secondary">🔧 {t("garage_public_setups_button")}</Button>
          </Link>
        </div>
      </section>

      {user && news.length > 0 && (
        <section className="rounded-xl2 border border-track-orange/40 bg-track-orange/5 p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-track-orange">
            🔔 {t("whatsnew_title")}
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {news.map((item) => {
              if (item.type === "session") {
                const s = item.session;
                const organizer =
                  s.participants.find((p) => p.uid === s.createdBy)?.displayName ??
                  s.participants[0]?.displayName ??
                  null;
                return (
                  <div key={`s-${s.id}`} className="rounded-xl2 border border-track-border bg-track-surface p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-track-muted">
                      {t("whatsnew_new_session")}
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold">{trackName(s.trackId)}</p>
                    <p className="text-sm text-track-muted">
                      {new Date(`${s.dayKey}T00:00:00`).toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {new Date(s.windowStart).toLocaleTimeString(locale === "nl" ? "nl-BE" : "fr-BE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {organizer && (
                      <p className="text-sm text-track-muted">
                        {t("garage_by")} {organizer}
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      className="mt-2"
                      onClick={() => {
                        setJoinContext({ trackId: s.trackId, dayKey: s.dayKey });
                        setModalOpen(true);
                      }}
                    >
                      {t("session_join")}
                    </Button>
                  </div>
                );
              }
              if (item.type === "event") {
                const ev = item.event;
                const isGoing = ev.going.includes(user.uid);
                const isInterested = ev.interested.includes(user.uid);
                return (
                  <div key={`e-${ev.id}`} className="rounded-xl2 border border-track-border bg-track-surface p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-track-muted">
                      {t("whatsnew_new_event")}
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold">{ev.title}</p>
                    <p className="text-sm text-track-muted">
                      {new Date(ev.date).toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant={isGoing ? "primary" : "secondary"}
                        onClick={() => handleEventParticipation(ev.id, isGoing ? "none" : "going")}
                      >
                        {t("events_going")}
                      </Button>
                      <Button
                        variant={isInterested ? "primary" : "secondary"}
                        onClick={() => handleEventParticipation(ev.id, isInterested ? "none" : "interested")}
                      >
                        {t("events_interested")}
                      </Button>
                    </div>
                  </div>
                );
              }
              const setup = item.setup;
              return (
                <Link
                  key={`p-${setup.id}`}
                  href="/reglages-publics"
                  className="block rounded-xl2 border border-track-border bg-track-surface p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-track-muted">
                    {t("whatsnew_new_setup")}
                  </p>
                  <p className="mt-0.5 font-display text-base font-bold">{setup.carName}</p>
                  <p className="text-sm text-track-muted">
                    {t("garage_by")} {setup.authorName}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {user && profile?.favoriteTrackId && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-track-muted">
            {t("home_favorite_track")} — {trackName(profile.favoriteTrackId)}
          </h2>
          {favoriteSessions.length === 0 ? (
            <p className="mt-3 text-sm text-track-muted">{t("home_favorite_none")}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {favoriteSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl2 border border-track-border bg-track-surface p-3 text-sm"
                >
                  <span className="font-semibold">
                    {new Date(`${s.dayKey}T00:00:00`).toLocaleDateString(locale === "nl" ? "nl-BE" : "fr-BE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-track-muted">
                    {new Date(s.windowStart).toLocaleTimeString(locale === "nl" ? "nl-BE" : "fr-BE", { hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(s.windowEnd).toLocaleTimeString(locale === "nl" ? "nl-BE" : "fr-BE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-track-orange">
                    {s.participants.length} {t("home_riders")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-track-muted">
          {t("home_today")}
        </h2>

        {!user && <p className="mt-3 text-sm text-track-muted">{t("home_login_prompt")}</p>}

        {user && loading && <p className="mt-3 text-sm text-track-muted">{t("home_loading")}</p>}

        {user && !loading && sessions.length === 0 && (
          <p className="mt-3 text-sm text-track-muted">{t("home_no_sessions")}</p>
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
