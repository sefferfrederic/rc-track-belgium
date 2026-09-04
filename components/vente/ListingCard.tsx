"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Listing } from "@/types";

function daysLeft(expiresAt: number): number {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 3600 * 1000)));
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const { locale } = useLanguage();
  const left = daysLeft(listing.expiresAt);

  return (
    <Link
      href={`/vente/${listing.id}`}
      className="flex flex-col overflow-hidden rounded-xl2 border border-track-border bg-track-surface"
    >
      <div className="relative aspect-video w-full bg-track-surface2">
        {listing.photoURLs[0] ? (
          <Image
            src={listing.photoURLs[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-track-muted">🛒</div>
        )}
        {listing.sold && (
          <span className="absolute right-2 top-2 rounded-full bg-track-red px-2 py-0.5 text-xs font-bold uppercase text-white">
            {locale === "nl" ? "Verkocht" : "Vendu"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="font-display text-sm font-bold">{listing.title}</p>
        <p className="font-display text-lg font-bold text-track-orange">{listing.price} €</p>
        <p className="mt-auto text-xs text-track-muted">
          {locale === "nl" ? `Nog ${left} dagen` : `Expire dans ${left} j`}
        </p>
      </div>
    </Link>
  );
}
