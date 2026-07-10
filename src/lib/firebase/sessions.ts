import { doc, runTransaction, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./client";
import type { RidingSession, SessionParticipant, CertaintyLevel } from "@/types";

/**
 * Un document "sessions/{trackId}__{dayKey}" représente l'activité regroupée
 * d'une piste pour un jour donné. Chaque pilote garde sa propre entrée
 * (horaires + taux) dans le tableau "participants" ; les champs windowStart/
 * windowEnd/peak* sont recalculés à chaque écriture (voir computeAggregates).
 *
 * Simplification volontaire de la Phase 3 : le regroupement se fait par piste
 * + jour calendaire plutôt que par calcul fin des plages qui se chevauchent
 * heure par heure (qui nécessiterait une Cloud Function pour rester cohérent
 * en cas d'écritures concurrentes). Documenté dans docs/architecture.md.
 */
function sessionDocId(trackId: string, dayKey: string): string {
  return `${trackId}__${dayKey}`;
}

interface Aggregates {
  windowStart: number;
  windowEnd: number;
  peakStart: number | null;
  peakEnd: number | null;
  peakCount: number;
}

function computeAggregates(participants: SessionParticipant[]): Aggregates {
  const starts = participants.map((p) => p.start);
  const ends = participants.map((p) => p.end);
  const windowStart = Math.min(...starts);
  const windowEnd = Math.max(...ends);

  const points = Array.from(new Set(participants.flatMap((p) => [p.start, p.end]))).sort(
    (a, b) => a - b
  );

  let peakCount = 0;
  let peakIntervals: [number, number][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i];
    const e = points[i + 1];
    if (s === e) continue;
    const mid = (s + e) / 2;
    const count = participants.filter((p) => p.start <= mid && p.end > mid).length;
    if (count > peakCount) {
      peakCount = count;
      peakIntervals = [[s, e]];
    } else if (count === peakCount && count > 0) {
      peakIntervals.push([s, e]);
    }
  }

  // Fusionne les intervalles de pic contigus, garde le plus long
  let peakStart: number | null = null;
  let peakEnd: number | null = null;
  if (peakIntervals.length > 0) {
    const merged: [number, number][] = [[...peakIntervals[0]]];
    for (let i = 1; i < peakIntervals.length; i++) {
      const last = merged[merged.length - 1];
      if (peakIntervals[i][0] <= last[1]) {
        last[1] = Math.max(last[1], peakIntervals[i][1]);
      } else {
        merged.push([...peakIntervals[i]]);
      }
    }
    merged.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
    [peakStart, peakEnd] = merged[0];
  }

  return { windowStart, windowEnd, peakStart, peakEnd, peakCount };
}

export interface UpsertSessionParams {
  trackId: string;
  dayKey: string;
  uid: string;
  displayName: string;
  photoURL: string | null;
  start: number;
  end: number;
  certainty: CertaintyLevel;
  disciplineId?: string | null;
  scaleId?: string | null;
}

/** Crée ou rejoint une session : ajoute/remplace l'entrée du pilote et recalcule le regroupement. */
export async function upsertSessionEntry(params: UpsertSessionParams): Promise<void> {
  const ref = doc(db, "sessions", sessionDocId(params.trackId, params.dayKey));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? (snap.data() as RidingSession) : null;

    let participants: SessionParticipant[] = existing?.participants ?? [];
    participants = participants.filter((p) => p.uid !== params.uid);
    participants.push({
      uid: params.uid,
      displayName: params.displayName,
      photoURL: params.photoURL,
      start: params.start,
      end: params.end,
      certainty: params.certainty,
      disciplineId: params.disciplineId ?? null,
      scaleId: params.scaleId ?? null,
      joinedAt: Date.now(),
    });

    const agg = computeAggregates(participants);

    tx.set(ref, {
      trackId: params.trackId,
      dayKey: params.dayKey,
      participants,
      participantUids: participants.map((p) => p.uid),
      windowStart: agg.windowStart,
      windowEnd: agg.windowEnd,
      peakStart: agg.peakStart,
      peakEnd: agg.peakEnd,
      peakCount: agg.peakCount,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  });
}

/** Retire un pilote d'une session (annulation). Supprime le document si plus personne ne roule. */
export async function cancelSessionEntry(
  trackId: string,
  dayKey: string,
  uid: string
): Promise<void> {
  const ref = doc(db, "sessions", sessionDocId(trackId, dayKey));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const existing = snap.data() as RidingSession;
    const participants = existing.participants.filter((p) => p.uid !== uid);

    if (participants.length === 0) {
      tx.delete(ref);
      return;
    }

    const agg = computeAggregates(participants);
    tx.update(ref, {
      participants,
      participantUids: participants.map((p) => p.uid),
      windowStart: agg.windowStart,
      windowEnd: agg.windowEnd,
      peakStart: agg.peakStart,
      peakEnd: agg.peakEnd,
      peakCount: agg.peakCount,
      updatedAt: Date.now(),
    });
  });
}

/** Toutes les sessions (toutes pistes confondues) d'un jour donné, pour l'Accueil et l'Agenda. */
export async function fetchSessionsForDay(dayKey: string): Promise<RidingSession[]> {
  const q = query(collection(db, "sessions"), where("dayKey", "==", dayKey));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RidingSession);
}

/**
 * Toutes les sessions entre deux jours inclus (ex. début et fin de mois), pour la vue calendrier.
 * Comparaison de chaînes "AAAA-MM-JJ" = comparaison chronologique, donc une requête par plage
 * sur un seul champ suffit (pas d'index composite Firestore à créer).
 */
export async function fetchSessionsForRange(
  startDayKey: string,
  endDayKey: string
): Promise<RidingSession[]> {
  const q = query(
    collection(db, "sessions"),
    where("dayKey", ">=", startDayKey),
    where("dayKey", "<=", endDayKey)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RidingSession);
}

/** Prochaines sessions à venir sur une piste donnée (ex. piste favorite), triées par date. */
export async function fetchUpcomingSessionsForTrack(
  trackId: string,
  fromDayKey: string,
  max = 5
): Promise<RidingSession[]> {
  const q = query(collection(db, "sessions"), where("trackId", "==", trackId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as RidingSession)
    .filter((s) => s.dayKey >= fromDayKey)
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey) || a.windowStart - b.windowStart)
    .slice(0, max);
}
