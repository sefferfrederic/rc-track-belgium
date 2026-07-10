"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { sendChatMessage, listenChatMessages, cleanupExpiredMessages } from "@/lib/firebase/chat";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/types";

export default function SessionChat({
  sessionId,
  sessionWindowEnd,
  onClose,
}: {
  sessionId: string;
  sessionWindowEnd: number;
  onClose: () => void;
}) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cleanupExpiredMessages(sessionId).catch(() => {});
    const unsub = listenChatMessages(sessionId, setMessages);
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !user || !profile) return;
    setSending(true);
    try {
      await sendChatMessage({
        sessionId,
        sessionWindowEnd,
        authorUid: user.uid,
        authorName: profile.displayName,
        authorPhotoURL: profile.photoURL,
        text,
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-xl2 border border-track-border bg-track-surface md:h-[70vh] md:rounded-xl2">
        <div className="flex items-center justify-between border-b border-track-border p-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase">Chat de session</h2>
            <p className="text-xs text-track-muted">
              Visible uniquement par les participants — supprimé 48h après la fin de la session.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X size={20} className="text-track-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="pt-8 text-center text-sm text-track-muted">
              Aucun message pour l&apos;instant. Sois le premier à écrire !
            </p>
          )}
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const isMine = m.authorUid === user?.uid;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-xl2 px-3 py-2 text-sm ${
                      isMine ? "bg-flag-gradient text-track-bg" : "bg-track-surface2 text-track-white"
                    }`}
                  >
                    {!isMine && (
                      <p className="mb-0.5 text-xs font-semibold opacity-70">{m.authorName}</p>
                    )}
                    <p>{m.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="flex gap-2 border-t border-track-border p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Écris un message…"
            className="flex-1 rounded-full border border-track-border bg-track-surface2 px-4 py-2.5 text-sm outline-none focus:border-track-orange"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            aria-label="Envoyer"
            className="flex items-center justify-center rounded-full bg-flag-gradient px-4 text-track-bg disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
