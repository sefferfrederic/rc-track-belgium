import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./client";
import type { Announcement, AnnouncementType } from "@/types";

/** Toutes les annonces, les plus récentes en premier — pour le panneau admin. */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
}

/** La dernière annonce active — pour la bannière sur l'Accueil. */
export async function fetchActiveAnnouncement(): Promise<Announcement | null> {
  const q = query(
    collection(db, "announcements"),
    where("active", "==", true),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Announcement;
}

export interface AnnouncementInput {
  title: string;
  titleNl?: string | null;
  message: string;
  messageNl?: string | null;
  type: AnnouncementType;
}

export async function createAnnouncement(input: AnnouncementInput, createdBy: string): Promise<void> {
  await addDoc(collection(db, "announcements"), {
    ...input,
    active: true,
    createdAt: Date.now(),
    createdBy,
  });
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, "announcements", id), { active });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, "announcements", id));
}
