import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";
import type { ChatMessage } from "@/types";

/**
 * Envoie un message dans le chat d'une session. expiresAt = fin de la session + 48h,
 * utilisé par cleanupExpiredMessages() ci-dessous pour savoir quels messages purger.
 */
export async function sendChatMessage(params: {
  sessionId: string;
  sessionWindowEnd: number;
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
}): Promise<void> {
  const expiresAt = params.sessionWindowEnd + 48 * 3600 * 1000;
  await addDoc(collection(db, "sessions", params.sessionId, "chat"), {
    sessionId: params.sessionId,
    authorUid: params.authorUid,
    authorName: params.authorName,
    authorPhotoURL: params.authorPhotoURL,
    text: params.text.trim().slice(0, 500),
    createdAt: Date.now(),
    expiresAt,
  });
}

/** Écoute en temps réel les messages du chat d'une session, triés du plus ancien au plus récent. */
export function listenChatMessages(
  sessionId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, "sessions", sessionId, "chat"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
  });
}

/**
 * Supprime les messages déjà expirés (48h après la fin de session) de CE chat précis.
 * Pas de Cloud Function ici : on nettoie simplement à chaque fois que quelqu'un ouvre
 * le chat concerné — largement suffisant vu le volume attendu, et zéro déploiement
 * technique supplémentaire à faire.
 */
export async function cleanupExpiredMessages(sessionId: string): Promise<void> {
  const q = query(
    collection(db, "sessions", sessionId, "chat"),
    where("expiresAt", "<=", Date.now())
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
