"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import ListingCard from "@/components/vente/ListingCard";
import ListingFormModal from "@/components/vente/ListingFormModal";
import { fetchActiveListings, fetchMyListings } from "@/lib/firebase/listings";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { Listing, ListingCategory } from "@/types";

const CATEGORIES: { id: ListingCategory | "all"; labelKey: TranslationKey; emoji: string }[] = [
  { id: "all", labelKey: "vente_cat_all", emoji: "🛒" },
  { id: "voiture_complete", labelKey: "vente_cat_voiture_complete", emoji: "🚗" },
  { id: "chassis", labelKey: "vente_cat_chassis", emoji: "🔧" },
  { id: "electronique", labelKey: "vente_cat_electronique", emoji: "🔌" },
  { id: "moteur", labelKey: "vente_cat_moteur", emoji: "⚙️" },
  { id: "esc", labelKey: "vente_cat_esc", emoji: "🎛️" },
  { id: "servo", labelKey: "vente_cat_servo", emoji: "🕹️" },
  { id: "radio", labelKey: "vente_cat_radio", emoji: "📡" },
];

export default function VentePage() {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-track-muted">…</p>}>
      <VentePageInner />
    </Suspense>
  );
}

function VentePageInner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const mineOnly = searchParams.get("mine") === "1";
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState<ListingCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const promise = mineOnly && user ? fetchMyListings(user.uid) : fetchActiveListings();
    promise.then(setListings).finally(() => setLoading(false));
  }, [mineOnly, user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = category === "all" ? listings : listings.filter((l) => l.category === category);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-track-orange">
          {t("vente_kicker")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">
          {mineOnly ? t("vente_my_listings") : t("vente_title")}
        </h1>
      </div>

      {user ? (
        <Button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-1">
          <Plus size={16} />
          {t("vente_new_listing")}
        </Button>
      ) : (
        <Link href="/login">
          <Button className="w-full">{t("home_login_to_ride")}</Button>
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={clsx(
              "rounded-full border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition-colors",
              category === c.id
                ? "border-track-orange bg-track-orange/10 text-track-orange"
                : "border-track-border text-track-muted"
            )}
          >
            {c.emoji} {t(c.labelKey)}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-sm text-track-muted">{t("home_loading")}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sm text-track-muted">{t("vente_none")}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {modalOpen && user && (
        <ListingFormModal
          sellerUid={user.uid}
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
