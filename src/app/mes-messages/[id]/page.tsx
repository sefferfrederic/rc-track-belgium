"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchConversation, listenConversationMessages, sendConversationMessage } from "@/lib/firebase/conversations";
import type { Conversation, ConversationMessage } from "@/types";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    fetchConversation(id).then(setConversation);
  }, [id]);

  useEffect(() => {
    const unsub = listenConversationMessages(id, setMessages);
    return unsub;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!user || !profile || !text.trim()) return;
    setSending(true);
    try {
      await sendConversationMessage(id, user.uid, profile.displayName, text);
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (authLoading || !user) return <p className="pt-8 text-center text-track-muted">{t("home_loading")}</p>;

  const otherName = conversation
    ? conversation.buyerUid === user.uid
      ? conversation.sellerName
      : conversation.buyerName
    : "";

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Link href="/mes-messages" className="flex items-center gap-1 text-sm text-track-muted">
        <ArrowLeft size={16} />
        {t("vente_my_messages")}
      </Link>

      {conversation && (
        <div>
          <p className="font-display text-lg font-bold">{conversation.listingTitle}</p>
          <p className="text-xs text-track-muted">
            {locale === "nl" ? "Gesprek met" : "Conversation avec"} {otherName}
          </p>
        </div>
      )}

      <div className="flex min-h-[300px] flex-col gap-2 rounded-xl2 border border-track-border bg-track-surface p-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-track-muted">{t("vente_no_messages_yet")}</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "max-w-[80%] rounded-xl2 px-3 py-2 text-sm",
              m.authorUid === user.uid
                ? "self-end bg-track-orange text-track-bg"
                : "self-start bg-track-surface2 text-track-white"
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t("vente_message_placeholder")}
          className="flex-1 rounded-lg border border-track-border bg-track-surface2 px-4 py-3 text-sm outline-none focus:border-track-orange"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="Envoyer"
          className="flex items-center justify-center rounded-lg bg-track-orange px-4 text-track-bg disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
