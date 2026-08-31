import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./client";
import type { Listing, ListingCategory } from "@/types";

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

export interface ListingInput {
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  photoURLs: string[];
}

/** Toutes les annonces actives (non expirées), triées de la plus récente à la plus ancienne. */
export async function fetchActiveListings(): Promise<Listing[]> {
  const q = query(collection(db, "listings"), where("expiresAt", ">", Date.now()));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Listing)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, "listings", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Listing) : null;
}

/** Mes propres annonces, actives ou déjà expirées (pour que je puisse les gérer/relister). */
export async function fetchMyListings(uid: string): Promise<Listing[]> {
  const q = query(collection(db, "listings"), where("sellerUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Listing)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createListing(
  input: ListingInput,
  sellerUid: string,
  sellerName: string
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, "listings"), {
    ...input,
    sellerUid,
    sellerName,
    sold: false,
    createdAt: now,
    expiresAt: now + THIRTY_DAYS_MS,
  });
  return ref.id;
}

export async function setListingSold(id: string, sold: boolean): Promise<void> {
  await updateDoc(doc(db, "listings", id), { sold });
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, "listings", id));
}
