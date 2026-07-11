# RC Tracks Belgium Meeting

> Qui roule ? Où ? Quand ? Avec quel degré de certitude ?

Application communautaire pour les pilotes RC en Belgique : voir en un coup d'œil qui roule,
sur quelle piste, et à quelle heure — pour arrêter de rouler chacun de son côté.

## État actuel du projet — Phase 0 + Phase 1 + Phase 2 + Phase 3 livrées

✅ Architecture technique complète (`docs/architecture.md`)
✅ Schéma Firestore complet (`docs/firestore-schema.md`)
✅ Règles de sécurité Firestore + Storage
✅ Structure du projet Next.js (PWA-ready, mobile-first)
✅ Identité visuelle (noir profond + dégradé jaune/orange/rouge, façon sport mécanique)
✅ Authentification Google / Apple / Email + création automatique du profil
✅ Page Profil (photo, pseudo, statistiques)
✅ 28 pistes belges importées dans Firestore (`docs/import-pistes-guide.md`)
✅ Carte interactive (Leaflet) avec filtre par discipline
✅ Liste des pistes avec filtre par discipline
✅ Création de session en 3 clics (piste + horaires + taux de certitude)
✅ Regroupement automatique des sessions (piste + jour) avec calcul du pic de fréquentation
✅ "Je roule aussi" pour rejoindre une session existante
✅ Annulation de participation
✅ Agenda : calendrier mensuel (cases colorées si activité) + menu déroulant par piste
✅ Piste favorite choisie directement dans le profil
✅ Panneau d'administration (réservé aux admins) : événements, pistes (CRUD complet), catégories dynamiques (disciplines/surfaces/échelles)
✅ Page Événements publique avec "Je participe" / "Je suis intéressé", visibles aussi dans l'Agenda
✅ Création de session possible de 3 façons : Accueil, Agenda (jour cliqué), fiche piste, carte interactive
✅ Choix de la discipline/échelle lors de la création de session (si la piste en propose plusieurs)
✅ Chat éphémère par session, réservé aux participants, supprimé automatiquement 48h après la fin
✅ Aperçu rapide des prochaines sessions sur la piste favorite (Accueil)
✅ Connexion Apple retirée (Google + Email uniquement)
✅ Application bilingue FR/NL (bouton dans la barre du haut, choix mémorisé)
✅ Navigation complète

## À venir (voir `docs/architecture.md` pour le détail des phases)

- Phase 2 (suite) : fiche piste détaillée + CRUD admin (ajouter/modifier/supprimer une piste depuis l'app)
- Phase 4 : Notifications push + Chat éphémère
- Phase 5 : Vue calendrier complète (semaine/mois) + Événements
- Phase 6 : Administration complète + mode hors-ligne + tests + déploiement final

## Démarrage rapide

**Si tu n'as jamais fait ça, suis `docs/firebase-setup-guide.md` en entier, dans l'ordre.**

Résumé pour quelqu'un de technique :

```bash
npm install
cp .env.local.example .env.local   # à remplir avec tes clés Firebase
npm run dev
```

## Structure du projet

```
src/app/            → écrans (une route par page)
src/components/     → composants UI réutilisables
src/contexts/       → état global (utilisateur connecté)
src/lib/firebase/   → connexion à Firebase
src/types/          → schéma de données TypeScript
docs/               → toute la documentation
firestore.rules     → règles de sécurité de la base de données
storage.rules       → règles de sécurité des fichiers
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — choix techniques et logique métier
- [`docs/firestore-schema.md`](docs/firestore-schema.md) — schéma complet de la base de données
- [`docs/firebase-setup-guide.md`](docs/firebase-setup-guide.md) — guide pas-à-pas sans prérequis

## Logo

Le logo actuel (`public/logo.svg`) est un placeholder. Remplace ce fichier par le logo officiel
en gardant exactement le même nom (`logo.svg`) et il apparaîtra automatiquement partout dans l'app.
