// Types partagés de l'application RC Tracks Belgium Meeting
// Voir docs/firestore-schema.md pour le détail de chaque collection Firestore

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  displayName: string; // pseudo ou prénom
  photoURL: string | null;
  email: string | null;
  favoriteTrackIds: string[]; // pistes favorites (aucune contrainte d'échelle, juste la présence dans la liste)
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
  titleNl?: string | null;
  description: string;
  descriptionNl?: string | null;
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

// --- Mon Garage ---

export interface Car {
  id: string;
  ownerUid: string;
  ownerName: string;
  name: string; // ex. "Buggy Losi 8IGHT"
  disciplineId: string | null;
  scaleId: string | null;
  photoURL: string | null;
  createdAt: number;
}

export type Weather = "sec" | "nuageux" | "pluie";
export type GripLevel = "fort" | "moyen" | "glissant";
export type TireCompound = "soft" | "medium" | "hard";

export interface CarSetup {
  id: string;
  carId: string;
  carName: string; // dénormalisé pour l'affichage public sans devoir lire la voiture privée
  authorUid: string;
  authorName: string;
  trackId: string | null;
  date: string; // "AAAA-MM-JJ"
  weather: Weather | null;
  surfaceId: string | null;
  gripLevel: GripLevel | null;
  tireBrand: string | null;
  tireCompound: TireCompound | null;
  rideHeightFront: number | null; // mm
  rideHeightRear: number | null; // mm
  diffOilFront: string | null; // cst, texte libre
  diffOilCenter: string | null;
  diffOilRear: string | null;
  shockOilFront: string | null;
  shockOilRear: string | null;
  notes: string;
  isPublic: boolean;
  createdAt: number;
}

// --- Vente entre pilotes ---

export type ListingCategory =
  | "voiture_complete"
  | "chassis"
  | "electronique"
  | "moteur"
  | "esc"
  | "servo"
  | "radio";

export type ListingCondition =
  | "neuf"
  | "occasion_comme_neuf"
  | "occasion_usure"
  | "use_fonctionnel"
  | "pour_pieces";

export interface Listing {
  id: string;
  sellerUid: string;
  sellerName: string;
  category: ListingCategory;
  title: string;
  description: string;
  price: number; // euros
  photoURLs: string[]; // max 2
  sold: boolean;
  brand?: string | null; // marque véhicule/châssis — uniquement voiture_complete / chassis
  escBrand?: string | null; // marque ESC en texte libre — uniquement catégorie esc
  servoBrand?: string | null; // marque servo en texte libre — uniquement catégorie servo
  condition?: ListingCondition | null;
  soldWithTires?: boolean | null; // uniquement voiture_complete / chassis
  soldWithBody?: boolean | null; // uniquement voiture_complete / chassis
  createdAt: number;
  expiresAt: number; // createdAt + 30 jours, purgé automatiquement à cette échéance
}

// Une conversation = une paire (annonce, acheteur). Le vendeur peut avoir
// plusieurs conversations en parallèle pour la même annonce (une par acheteur intéressé).
export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerUid: string;
  sellerName: string;
  buyerUid: string;
  buyerName: string;
  participantUids: string[]; // [sellerUid, buyerUid] — utilisé par les règles de sécurité
  lastMessageText: string;
  lastMessageAt: number;
  createdAt: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: number;
}

// --- Communication (bannière admin) ---

export type AnnouncementType = "info" | "important" | "evenement";

export interface Announcement {
  id: string;
  title: string;
  titleNl?: string | null;
  message: string;
  messageNl?: string | null;
  type: AnnouncementType;
  active: boolean;
  createdAt: number;
  createdBy: string;
}
