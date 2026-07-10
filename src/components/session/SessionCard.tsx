"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import CertaintyGauge from "@/components/ui/CertaintyGauge";
import Button from "@/components/ui/Button";
import SessionChat from "@/components/session/SessionChat";
import { cancelSessionEntry } from "@/lib/firebase/sessions";
import { useAuth } from "@/contexts/AuthContext";
import type { RidingSession, Taxonomy } from "@/types";

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

export default function SessionCard({
  session,
  trackName,
  taxonomies = [],
  onChanged,
  onJoinClick,
}: {
  session: RidingSession;
  trackName: string;
  taxonomies?: Taxonomy[];
  onChanged: () => void;
  onJoinClick: () => void;
}) {
  const { user } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const taxLabel = (id?: string | null) => (id ? taxonomies.find((t) => t.id === id)?.label : null);

  const myEntry = user ? session.participants.find((p) => p.uid === user.uid) : undefined;

  async function handleCancel() {
    if (!user) return;
    setCancelling(true);
    try {
      await cancelSessionEntry(session.trackId, session.dayKey, user.uid);
      onChanged();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-track-border bg-track-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">{trackName}</p>
          <p className="text-sm text-track-muted">
            {fmtTime(session.windowStart)} → {fmtTime(session.windowEnd)} ·{" "}
            {session.participants.length} pilote{session.participants.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex -space-x-2">
          {session.participants.slice(0, 4).map((p) => (
            <CertaintyGauge key={p.uid} value={p.certainty} size={40} />
          ))}
        </div>
      </div>

      {session.peakCount > 1 && session.peakStart && session.peakEnd && (
        <p className="mt-2 text-xs text-track-muted">
          Pic de fréquentation{" "}
          <span className="text-track-white">
            {fmtTime(session.peakStart)} → {fmtTime(session.peakEnd)}
          </span>{" "}
          ({session.peakCount} pilotes)
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {session.participants.map((p) => {
          const tags = [taxLabel(p.disciplineId), taxLabel(p.scaleId)].filter(Boolean).join(" · ");
          return (
            <li key={p.uid} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {p.photoURL ? (
                  <img src={p.photoURL} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-track-surface2" />
                )}
                {p.displayName}
                {tags && <span className="text-xs text-track-muted">({tags})</span>}
              </span>
              <span className="text-track-muted">
                {fmtTime(p.start)} - {fmtTime(p.end)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        {myEntry ? (
          <>
            <Button variant="ghost" onClick={handleCancel} disabled={cancelling} className="!px-0">
              {cancelling ? "Annulation…" : "Annuler ma participation"}
            </Button>
            <button
              onClick={() => setChatOpen(true)}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-flag-gradient px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-track-bg shadow-glow"
            >
              <MessageCircle size={15} strokeWidth={2.5} /> Chat
            </button>
          </>
        ) : (
          <Button variant="secondary" onClick={onJoinClick} className="w-full">
            Je roule aussi
          </Button>
        )}
      </div>

      {chatOpen && (
        <SessionChat
          sessionId={session.id}
          sessionWindowEnd={session.windowEnd}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
