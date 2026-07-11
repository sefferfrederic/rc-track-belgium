// Types partagés de l'application RC Tracks Belgium Meeting
// Voir docs/firestore-schema.md pour le détail de chaque collection Firestore

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  displayName: string; // pseudo ou prénom
  photoURL: string | null;
  email: string | null;
  favoriteTrackId: string | null; // une seule piste favorite
  role: UserRole;
  createdAt: number; // timestamp ms
  stats: {
    sessionsCount: number;
  };
}

export interface Track {
  id: string;
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
  createdAt: number;
  createdBy: string;
}

// Catégories dynamiques créées librement par l'administrateur
export interface Taxonomy {
  id: string;
  label: string;
  type: "discipline" | "surface" | "scale";
}

export type CertaintyLevel = 25 | 50 | 75 | 100;

export interface RidingSession {
  id: string;
  trackId: string;
  dayKey: string; // "AAAA-MM-JJ", sert aussi de partie de l'ID du document (trackId__dayKey)
  createdBy: string;
  participants: SessionParticipant[];
  participantUids: string[]; // miroir de participants[].uid — utilisé par les règles de sécurité du chat
  // champs calculés côté client/Cloud Function pour l'affichage regroupé
  windowStart: number; // timestamp ms, min de tous les participants
  windowEnd: number; // timestamp ms, max de tous les participants
  peakStart: number | null;
  peakEnd: number | null;
  peakCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SessionParticipant {
  uid: string;
  displayName: string;
  photoURL: string | null;
  start: number; // timestamp ms
  end: number; // timestamp ms
  certainty: CertaintyLevel;
  disciplineId?: string | null;
  scaleId?: string | null;
  joinedAt: number;
}

export interface RcEvent {
  id: string;
  title: string;
  description: string;
  date: number;
  photoURL: string | null;
  trackId: string;
  externalLink: string | null;
  going: string[]; // uids "Je participe"
  interested: string[]; // uids "Je suis intéressé"
  createdAt: number;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: number;
  expiresAt: number; // createdAt de fin de session + 48h
}

export interface AppNotification {
  id: string;
  toUid: string;
  type: "session_created" | "session_joined" | "session_updated" | "session_cancelled" | "chat_message" | "favorite_track_alert";
  title: string;
  body: string;
  trackId: string | null;
  sessionId: string | null;
  read: boolean;
  createdAt: number;
}
