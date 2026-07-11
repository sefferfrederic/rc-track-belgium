# Schéma Firestore — RC Tracks Belgium Meeting

Toutes les interfaces TypeScript correspondantes sont dans `src/types/index.ts`.

## `users/{uid}`
Créé automatiquement à la première connexion.

| Champ | Type | Notes |
|---|---|---|
| uid | string | = id du document |
| displayName | string | pseudo ou prénom |
| photoURL | string \| null | |
| email | string \| null | |
| favoriteTrackId | string \| null | **une seule** piste favorite |
| role | "admin" \| "user" | modifiable uniquement par un admin |
| createdAt | timestamp | |
| stats.sessionsCount | number | mis à jour par Cloud Function |

## `taxonomies/{id}`
Disciplines, surfaces, échelles — créées librement par l'admin.

| Champ | Type |
|---|---|
| label | string |
| type | "discipline" \| "surface" \| "scale" |

## `tracks/{trackId}`

| Champ | Type |
|---|---|
| name, address, description | string |
| lat, lng | number |
| surfaceIds, disciplineIds, scaleIds | string[] (références vers `taxonomies`) |
| photoURL | string \| null |
| createdAt, createdBy | timestamp, string |

## `sessions/{sessionId}`
Représente l'activité **regroupée** sur une piste pour une plage horaire donnée.

| Champ | Type |
|---|---|
| trackId | string |
| participants | tableau de `{ uid, displayName, photoURL, start, end, certainty, joinedAt }` |
| windowStart, windowEnd | timestamp — bornes globales calculées |
| peakStart, peakEnd, peakCount | pic de fréquentation calculé |
| createdAt, updatedAt | timestamp |

### `sessions/{sessionId}/chat/{messageId}` (sous-collection)

| Champ | Type |
|---|---|
| authorUid, authorName, authorPhotoURL | |
| text | string |
| createdAt | timestamp |
| expiresAt | timestamp = fin de session + 48h (purge automatique par Cloud Function planifiée) |

## `events/{eventId}`

| Champ | Type |
|---|---|
| title, description | string |
| date | timestamp |
| photoURL | string \| null |
| trackId | string |
| externalLink | string \| null |
| going, interested | string[] (uids) |
| createdAt, createdBy | |

## `notifications/{notifId}`

| Champ | Type |
|---|---|
| toUid | string — destinataire |
| type | "session_created" \| "session_joined" \| "session_updated" \| "session_cancelled" \| "chat_message" \| "favorite_track_alert" |
| title, body | string |
| trackId, sessionId | string \| null |
| read | boolean |
| createdAt | timestamp |

## Collections prévues pour les phases futures (non créées maintenant, pour ne rien casser)

- `marketplace_listings` — petites annonces RC
- `shops` — magasins partenaires
- `race_results` — résultats de courses / classements
- `private_messages` — messagerie privée
- `track_bookings` — réservations de piste
- `payments` — transactions
- `clubs` — gestion des clubs

Comme chaque futur module est une collection indépendante, aucune migration de données
existantes ne sera nécessaire pour les ajouter.
