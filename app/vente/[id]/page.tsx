import type { Metadata } from "next";
import ListingDetailClient from "./ListingDetailClient";
import { fetchListing } from "@/lib/firebase/listings";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const listing = await fetchListing(params.id);

  if (!listing) {
    return { title: "Annonce introuvable — RC Tracks Belgium" };
  }

  const description =
    listing.description?.trim() ||
    `${listing.price} € — Annonce publiée sur RC Tracks Belgium, la communauté des pilotes RC belges.`;

  return {
    title: `${listing.title} — ${listing.price} € | RC Tracks Belgium`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.photoURLs.length > 0 ? [{ url: listing.photoURLs[0] }] : undefined,
      type: "website",
      siteName: "RC Tracks Belgium",
    },
    twitter: {
      card: listing.photoURLs.length > 0 ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: listing.photoURLs.length > 0 ? [listing.photoURLs[0]] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await fetchListing(params.id);
  return <ListingDetailClient initialListing={listing} />;
}
