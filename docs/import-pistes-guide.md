# Importer les 28 pistes dans Firestore

Ce guide t'explique comment récupérer automatiquement les 28 pistes (extraites de ta carte
Google My Maps) dans ta base de données, sans devoir les recréer une par une.

## Étape 1 — Récupérer la clé d'administration Firebase

Cette clé donne un accès total à ta base de données — **elle ne doit jamais être partagée
ni mise en ligne publiquement** (elle est déjà exclue du projet via `.gitignore`).

1. Va dans la Console Firebase → icône ⚙️ **Paramètres du projet**
2. Onglet **Comptes de service**
3. Clique sur **Générer une nouvelle clé privée**
4. Confirme → un fichier `.json` se télécharge (nom du type `rc-track-belgium-meet-firebase-adminsdk-xxxxx.json`)
5. **Renomme ce fichier en exactement** `serviceAccountKey.json`
6. **Place-le à la racine du projet** (au même niveau que `package.json`, PAS dans un sous-dossier)

## Étape 2 — Lancer l'import

Dans PowerShell, toujours dans le dossier du projet :

```
npm install
node scripts/seed-tracks.js
```

Tu dois voir :
```
Import de 11 taxonomies...
✅ Taxonomies importées.
Import de 28 pistes...
✅ Pistes importées.
🎉 Import terminé !
```

## Étape 3 — Vérifier

1. Console Firebase → **Firestore Database** → onglet **Données**
2. Tu dois voir deux nouvelles collections : `tracks` (28 documents) et `taxonomies` (11 documents)

## Ce qui a été importé

Pour chaque piste : nom, coordonnées GPS, discipline (déduite de la couleur du marqueur sur
ta carte), et site web/Facebook s'il était présent. Les champs `address`, `surfaceIds`,
`scaleIds` et `photoURL` sont vides pour l'instant — l'interface d'administration
(Phase 2, à venir) permettra de les compléter directement depuis l'application, piste par piste.

## Sécurité

Une fois l'import terminé, tu peux supprimer le fichier `serviceAccountKey.json` de ton
ordinateur si tu veux (tu peux toujours en regénérer un autre plus tard depuis la Console
Firebase si besoin pour un futur import).
