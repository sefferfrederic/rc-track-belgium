"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMyConversations } from "@/lib/firebase/conversations";
import type { Conversation } from "@/types";

export default function MesMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchMyConversations(user.uid)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <p className="pt-8 text-center text-track-muted">{t("home_loading")}</p>;

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          {t("vente_kicker")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">{t("vente_my_messages")}</h1>
      </div>

      {loading && <p className="text-center text-sm text-track-muted">{t("home_loading")}</p>}

      {!loading && conversations.length === 0 && (
        <p className="text-center text-sm text-track-muted">{t("vente_no_messages")}</p>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map((c) => {
          const otherName = c.buyerUid === user.uid ? c.sellerName : c.buyerName;
          return (
            <Link
              key={c.id}
              href={`/mes-messages/${c.id}`}
              className="rounded-xl2 border border-track-border bg-track-surface p-3"
            >
              <p className="font-display text-sm font-bold">{c.listingTitle}</p>
              <p className="text-xs text-track-muted">
                {locale === "nl" ? "Met" : "Avec"} {otherName}
              </p>
              {c.lastMessageText && (
                <p className="mt-1 truncate text-sm text-track-white">{c.lastMessageText}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
