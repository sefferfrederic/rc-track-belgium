import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";
import type { Conversation, ConversationMessage } from "@/types";

/**
 * Trouve la conversation existante entre cet acheteur et cette annonce, ou en crée
 * une nouvelle. Une conversation = une paire (annonce, acheteur) ; le vendeur peut
 * avoir plusieurs conversations pour la même annonce, une par acheteur intéressé.
 */
export async function getOrCreateConversation(
  listingId: string,
  listingTitle: string,
  sellerUid: string,
  sellerName: string,
  buyerUid: string,
  buyerName: string
): Promise<string> {
  const q = query(
    collection(db, "conversations"),
    where("listingId", "==", listingId),
    where("buyerUid", "==", buyerUid)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  const ref = await addDoc(collection(db, "conversations"), {
    listingId,
    listingTitle,
    sellerUid,
    sellerName,
    buyerUid,
    buyerName,
    participantUids: [sellerUid, buyerUid],
    lastMessageText: "",
    lastMessageAt: Date.now(),
    createdAt: Date.now(),
  });
  return ref.id;
}

/** Mes conversations (comme acheteur ou vendeur), les plus récentes en premier. */
export async function fetchMyConversations(uid: string): Promise<Conversation[]> {
  const q = query(collection(db, "conversations"), where("participantUids", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, "conversations", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}

export function listenConversationMessages(
  conversationId: string,
  callback: (messages: ConversationMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ConversationMessage));
  });
}

export async function sendConversationMessage(
  conversationId: string,
  authorUid: string,
  authorName: string,
  text: string
): Promise<void> {
  const trimmed = text.trim().slice(0, 500);
  if (!trimmed) return;
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    conversationId,
    authorUid,
    authorName,
    text: trimmed,
    createdAt: Date.now(),
  });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessageText: trimmed,
    lastMessageAt: Date.now(),
  });
}
