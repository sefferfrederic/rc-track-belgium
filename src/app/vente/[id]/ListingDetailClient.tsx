"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import ShareButton from "@/components/vente/ShareButton";
import { setListingSold, deleteListing } from "@/lib/firebase/listings";
import { getOrCreateConversation } from "@/lib/firebase/conversations";
import type { Listing } from "@/types";

function daysLeft(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 3600 * 1000)));
}

export default function ListingDetailClient({ initialListing }: { initialListing: Listing | null }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { locale, t } = useLanguage();
  const [listing, setListing] = useState<Listing | null>(initialListing);
  const [contacting, setContacting] = useState(false);

  async function handleContact() {
    if (!user || !listing || !profile) return;
    setContacting(true);
    try {
      const convId = await getOrCreateConversation(
        listing.id,
        listing.title,
        listing.sellerUid,
        listing.sellerName,
        user.uid,
        profile.displayName
      );
      router.push(`/mes-messages/${convId}`);
    } finally {
      setContacting(false);
    }
  }

  async function handleToggleSold() {
    if (!listing) return;
    await setListingSold(listing.id, !listing.sold);
    setListing({ ...listing, sold: !listing.sold });
  }

  async function handleDelete() {
    if (!listing) return;
    if (!confirm(locale === "nl" ? "Deze advertentie definitief verwijderen?" : "Supprimer définitivement cette annonce ?")) return;
    await deleteListing(listing.id);
    router.push("/vente");
  }

  if (!listing) return <p className="pt-8 text-center text-track-muted">{t("vente_not_found")}</p>;

  const isOwner = user?.uid === listing.sellerUid;
  const left = daysLeft(listing.expiresAt);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/vente" className="flex items-center gap-1 text-sm text-track-muted">
        <ArrowLeft size={16} />
        {t("vente_title")}
      </Link>

      {listing.photoURLs.length > 0 && (
        <div className="flex gap-2">
          {listing.photoURLs.map((url) => (
            <img key={url} src={url} alt={listing.title} className="h-48 w-full rounded-xl2 object-cover" />
          ))}
        </div>
      )}

      <div>
        {listing.sold && (
          <span className="mb-2 inline-block rounded-full bg-track-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            {locale === "nl" ? "Verkocht" : "Vendu"}
          </span>
        )}
        <h1 className="font-display text-2xl font-bold">{listing.title}</h1>
        <p className="mt-1 font-display text-3xl font-bold text-track-orange">{listing.price} €</p>
        <p className="mt-1 text-xs text-track-muted">
          {t("garage_by")} {listing.sellerName} · {locale === "nl" ? `Nog ${left} dagen` : `Expire dans ${left} j`}
        </p>
      </div>

      {listing.description && <p className="whitespace-pre-wrap text-sm text-track-white">{listing.description}</p>}

      <ShareButton title={`${listing.title} — ${listing.price} €`} url={`https://rc-tracks-belgium.be/vente/${listing.id}`} />

      {isOwner ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleToggleSold} className="flex-1">
            {listing.sold ? t("vente_mark_available") : t("vente_mark_sold")}
          </Button>
          <Button variant="ghost" onClick={handleDelete} className="flex-1">
            {t("admin_announcement_delete")}
          </Button>
        </div>
      ) : user ? (
        <Button onClick={handleContact} disabled={contacting} className="w-full">
          {contacting ? t("home_loading") : t("vente_contact_seller")}
        </Button>
      ) : (
        <Link href="/login">
          <Button className="w-full">{t("home_login_to_ride")}</Button>
        </Link>
      )}
    </div>
  );
}
