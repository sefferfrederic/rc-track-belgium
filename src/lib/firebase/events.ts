import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./client";
import type { RcEvent } from "@/types";

export async function fetchEvents(): Promise<RcEvent[]> {
  const snap = await getDocs(collection(db, "events"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RcEvent);
}

export interface EventInput {
  title: string;
  description: string;
  date: number;
  photoURL: string | null;
  trackId: string;
  externalLink: string | null;
}

export async function createEvent(input: EventInput, createdBy: string): Promise<void> {
  await addDoc(collection(db, "events"), {
    ...input,
    going: [],
    interested: [],
    createdAt: Date.now(),
    createdBy,
  });
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  await updateDoc(doc(db, "events", id), { ...input });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "events", id));
}

export async function setParticipation(
  eventId: string,
  uid: string,
  status: "going" | "interested" | "none"
): Promise<void> {
  const ref = doc(db, "events", eventId);
  // On retire d'abord des deux listes pour éviter les doublons, puis on ajoute si besoin
  await updateDoc(ref, { going: arrayRemove(uid), interested: arrayRemove(uid) });
  if (status === "going") await updateDoc(ref, { going: arrayUnion(uid) });
  if (status === "interested") await updateDoc(ref, { interested: arrayUnion(uid) });
}
