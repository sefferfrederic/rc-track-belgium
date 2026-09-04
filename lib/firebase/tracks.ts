import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "./client";
import type { Track, Taxonomy } from "@/types";

export async function fetchTracks(): Promise<Track[]> {
  const snap = await getDocs(collection(db, "tracks"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Track);
}

export async function fetchTaxonomies(): Promise<Taxonomy[]> {
  const snap = await getDocs(collection(db, "taxonomies"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Taxonomy);
}

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export interface TrackInput {
  name: string;
  address: string;
  lat: number;
  lng: number;
  surfaceIds: string[];
  disciplineIds: string[];
  scaleIds: string[];
  photoURL: string | null;
  description: string;
  website?: string | null;
}

/** Crée une nouvelle piste avec un ID lisible (slug du nom), en évitant les collisions. */
export async function createTrack(input: TrackInput, createdBy: string): Promise<void> {
  const baseSlug = slugify(input.name) || "piste";
  let id = baseSlug;
  let attempt = 1;
  while ((await getDoc(doc(db, "tracks", id))).exists()) {
    attempt += 1;
    id = `${baseSlug}-${attempt}`;
  }
  await setDoc(doc(db, "tracks", id), {
    ...input,
    createdAt: Date.now(),
    createdBy,
  });
}

export async function updateTrack(id: string, input: TrackInput): Promise<void> {
  await updateDoc(doc(db, "tracks", id), { ...input });
}

export async function deleteTrack(id: string): Promise<void> {
  await deleteDoc(doc(db, "tracks", id));
}

/** Crée une nouvelle catégorie (discipline/surface/échelle) — "Tout est dynamique". */
export async function createTaxonomy(label: string, type: Taxonomy["type"]): Promise<void> {
  const id = `${type}-${slugify(label)}`;
  await setDoc(doc(db, "taxonomies", id), { label: label.trim(), type }, { merge: true });
}

export async function deleteTaxonomy(id: string): Promise<void> {
  await deleteDoc(doc(db, "taxonomies", id));
}
