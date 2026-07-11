# Architecture — RC Tracks Belgium Meeting

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | SSR/SSG, PWA facile, un seul code pour tous les écrans |
| Style | Tailwind CSS | Rapide à maintenir, cohérent avec le design system défini dans `tailwind.config.ts` |
| Auth | Firebase Authentication (Google, Apple, Email) | Gratuit, sécurisé, intégré nativement à Firestore |
| Base de données | Cloud Firestore | Temps réel (indispensable pour voir qui roule en direct), scalable |
| Fichiers | Firebase Storage | Photos de profil, pistes, événements |
| Carte | Leaflet + OpenStreetMap | Gratuit (contrairement à Google Maps, payant au-delà d'un certain volume), suffisant pour la Belgique |
| Hébergement | Vercel (recommandé) ou Firebase Hosting | Déploiement automatique à chaque mise à jour |

## Pourquoi Leaflet plutôt que Google Maps

Le cahier des charges laisse le choix. Google Maps facture au-delà d'un quota gratuit mensuel
(cartes chargées, geocoding...). Pour une communauté belge de niche, Leaflet + tuiles OpenStreetMap
est gratuit, open-source, et largement suffisant. On pourra basculer plus tard si besoin (l'app
n'a aucune dépendance forte au fournisseur de carte).

## Organisation du code

```
src/
  app/                  → une route Next.js par écran (Accueil, Agenda, Carte, Pistes, Événements, Profil...)
  components/
    ui/                 → composants génériques réutilisables (Button, CertaintyGauge...)
    layout/             → TopBar, BottomNav
    auth/               → formulaire de connexion
  contexts/
    AuthContext.tsx     → expose l'utilisateur connecté + son profil Firestore à toute l'app
  lib/
    firebase/           → initialisation Firebase + fonctions d'authentification
  types/
    index.ts            → tous les types TypeScript = miroir du schéma Firestore (docs/firestore-schema.md)
```

## Logique de regroupement des sessions (Phase 3 — implémentée)

Le cahier des charges demande qu'un chevauchement d'horaires sur une même piste affiche
**une seule activité regroupée**, avec le détail de chaque participant conservé.

**Implémentation choisie pour cette phase** : plutôt qu'une Cloud Function (qui demanderait
un déploiement séparé, complexe pour une première version), le regroupement se fait par
**piste + jour calendaire**, directement côté client, via une transaction Firestore :

- Chaque jour et chaque piste correspond à un seul document `sessions/{trackId}__{dayKey}`
  (ID déterministe, pas de requête nécessaire pour le retrouver).
- Quand un pilote crée ou rejoint une session, une transaction Firestore relit ce document,
  met à jour son entrée dans le tableau `participants`, puis recalcule automatiquement :
  - `windowStart` / `windowEnd` (min/max des horaires de tous les participants)
  - `peakStart` / `peakEnd` / `peakCount` (pic de fréquentation, calculé par balayage des
    intervalles — testé sur l'exemple du cahier des charges : Pierre 14h-17h, Paul 15h-18h,
    Jean 13h-16h → pic correctement détecté à 15h-16h avec 3 pilotes).
- Les transactions Firestore gèrent nativement les écritures concurrentes (deux pilotes qui
  valident en même temps ne s'écrasent pas l'un l'autre).

**Limite connue de cette simplification** : deux créneaux très éloignés le même jour sur la
même piste (ex. un groupe le matin, un autre complètement différent le soir) sont regroupés
dans la même carte au lieu d'être scindés en deux activités séparées. Si ça devient gênant à
l'usage, on pourra affiner avec un vrai algorithme de fusion d'intervalles multiples par jour,
ou migrer vers une Cloud Function pour plus de robustesse à grande échelle.

## Notifications

Non incluses dans cette version, sur demande explicite (complexité de déploiement jugée trop
élevée pour l'instant — nécessiterait de déployer des Cloud Functions). Le schéma Firestore
garde la collection `notifications/{id}` prête si cette fonctionnalité est ajoutée plus tard.

## Chat éphémère (implémenté)

Sous-collection `sessions/{sessionId}/chat/{messageId}`. Chaque message stocke un champ `expiresAt`
(fin de session + 48h).

**Implémentation choisie** : plutôt qu'une Cloud Function planifiée (qui demanderait un
déploiement séparé), le nettoyage se fait **côté client, à l'ouverture du chat** — voir
`lib/firebase/chat.ts` → `cleanupExpiredMessages()`. Dès qu'un participant ouvre un chat, les
messages expirés de cette session précise sont supprimés. Les règles de sécurité Firestore
autorisent un participant à supprimer un message **uniquement s'il est déjà expiré** (jamais un
message récent), ce qui rend ce nettoyage sûr même fait côté client.

**Limite connue** : un chat que plus personne n'ouvre jamais après son expiration ne sera
jamais nettoyé (rare en pratique, et sans risque : pas de coût ni de fuite de données, juste
un peu de stockage inutilisé). Une Cloud Function planifiée reste une amélioration possible
plus tard si besoin.

## Évolutivité (prévue dès le schéma)

Le schéma Firestore (voir `docs/firestore-schema.md`) isole déjà des collections indépendantes
(`tracks`, `events`, `sessions`, `notifications`...) pour que les futures fonctionnalités
(marketplace, classements, messagerie privée, réservations, paiement, notifications push)
s'ajoutent comme de **nouvelles collections/briques** sans toucher aux existantes.

## Phases de développement

0. Architecture, schéma Firestore, règles de sécurité, structure du projet ✅
1. Authentification + Profil ✅
2. Pistes (CRUD admin) + Carte interactive ✅
3. Sessions de roulage + regroupement automatique ✅
4. Chat éphémère ✅ — Notifications push non incluses (voir ci-dessus)
5. Agenda (vue calendrier) + Événements ✅
6. Administration complète ✅ — PWA hors-ligne + tests + déploiement final : à venir

