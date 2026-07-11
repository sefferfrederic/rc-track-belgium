# Guide de démarrage — pour quelqu'un qui n'a jamais fait ça

Ce guide suppose que tu ne connais rien à Firebase ni au développement. Suis les étapes dans l'ordre,
sans en sauter. Ça prend environ 20-30 minutes la première fois.

## Étape 1 — Créer le projet Firebase

1. Va sur https://console.firebase.google.com
2. Connecte-toi avec un compte Google (crée-en un si besoin).
3. Clique sur **"Ajouter un projet"**.
4. Nom du projet : `rc-track-belgium` (ou ce que tu veux).
5. Désactive Google Analytics si proposé (pas nécessaire, tu pourras l'activer plus tard).
6. Clique sur **Créer le projet**, attends ~30 secondes.

## Étape 2 — Créer l'application Web

1. Sur la page d'accueil du projet, clique sur l'icône **`</>`** ("Web").
2. Nom de l'app : `RC Tracks Belgium Meeting`.
3. Ne coche PAS "Firebase Hosting" pour l'instant (on verra ça au moment du déploiement).
4. Clique sur **Enregistrer l'application**.
5. Firebase affiche un bloc de code avec des valeurs comme `apiKey: "AIza..."`. **Garde cette page ouverte**,
   tu en auras besoin à l'étape 6.

## Étape 3 — Activer l'authentification

1. Dans le menu de gauche : **Build > Authentication**.
2. Clique sur **Get started**.
3. Onglet **Sign-in method**, active dans l'ordre :
   - **Email/Password** → active le premier interrupteur → Enregistrer.
   - **Google** → active → choisis un email de support → Enregistrer.

## Étape 4 — Créer la base de données Firestore

1. Menu de gauche : **Build > Firestore Database**.
2. Clique sur **Créer une base de données**.
3. Choisis l'emplacement **`eur3 (europe-west)`** (le plus proche de la Belgique).
4. Mode : choisis **"Commencer en mode production"**.
5. Une fois créée, va dans l'onglet **Règles**, efface tout le contenu, et colle le contenu
   du fichier `firestore.rules` fourni dans ce projet. Clique sur **Publier**.

## Étape 5 — Activer Storage (photos)

1. Menu de gauche : **Build > Storage**.
2. Clique sur **Commencer**, garde l'emplacement par défaut, mode production.
3. Onglet **Règles** → colle le contenu du fichier `storage.rules` fourni → **Publier**.

## Étape 6 — Récupérer tes clés et compléter `.env.local`

1. Retourne sur la page de l'étape 2 (ou : icône ⚙️ en haut à gauche > **Paramètres du projet**).
2. Dans "Vos applications", tu vois le bloc `firebaseConfig`.
3. Dans le projet, duplique le fichier `.env.local.example` et renomme la copie `.env.local`.
4. Remplis chaque ligne avec la valeur correspondante :

```
NEXT_PUBLIC_FIREBASE_API_KEY=        → correspond à "apiKey"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=    → correspond à "authDomain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=     → correspond à "projectId"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET= → correspond à "storageBucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= → correspond à "messagingSenderId"
NEXT_PUBLIC_FIREBASE_APP_ID=         → correspond à "appId"
```

## Étape 7 — Lancer l'application sur ton ordinateur

Il te faut **Node.js** installé (https://nodejs.org, prends la version "LTS", installation
en cliquant "suivant" partout).

Ensuite, dans un Terminal (Mac) ou PowerShell (Windows), dans le dossier du projet :

```
npm install
npm run dev
```

Ouvre ensuite http://localhost:3000 dans ton navigateur. Tu dois voir la page d'accueil.
Clique sur "Connexion" pour tester Google ou la création de compte par email.

## Étape 8 — Devenir administrateur (toi-même)

Par défaut, tout nouveau compte a le rôle `user`. Pour te donner le rôle `admin` :

1. Connecte-toi une première fois dans l'app (ça crée ton profil dans Firestore).
2. Va dans la Console Firebase > **Firestore Database** > collection `users`.
3. Trouve ton document (ton `uid`), clique dessus.
4. Modifie le champ `role` de `"user"` à `"admin"`.

## Étape 9 — Mettre l'application en ligne (déploiement)

La solution la plus simple pour quelqu'un de non-technique est **Vercel** (gratuit pour ce
type de projet) :

1. Mets le code du projet sur GitHub (Vercel peut aussi t'accompagner si tu n'as jamais utilisé GitHub).
2. Va sur https://vercel.com, connecte-toi avec GitHub.
3. **Add New > Project**, choisis ton dépôt `rc-track-belgium`.
4. Dans "Environment Variables", ajoute exactement les mêmes valeurs que ton `.env.local`.
5. Clique sur **Deploy**. Après ~2 minutes, ton application est en ligne avec une adresse
   du type `rc-track-belgium.vercel.app`.

On pourra détailler cette étape avec des captures d'écran quand tu y seras — dis-le-moi simplement.

---

**Si tu bloques à une étape, dis-moi exactement où et ce que tu vois à l'écran — je t'expliquerai
la suite pas à pas.**
