// Script d'import ponctuel : crée les taxonomies (disciplines/surfaces/échelles)
// et les pistes extraites de la carte Google My Maps de l'utilisateur.
//
// Utilise le SDK Admin Firebase, qui a un accès total à Firestore
// (contourne volontairement les règles de sécurité, car c'est un script de
// confiance exécuté par l'administrateur du projet, pas par un utilisateur final).
//
// PRÉREQUIS : un fichier de clé de compte de service, voir docs/import-pistes-guide.md
//
// Utilisation :
//   node scripts/seed-tracks.js

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "\n❌ Fichier serviceAccountKey.json introuvable à la racine du projet.\n" +
      "Suis les instructions dans docs/import-pistes-guide.md pour l'obtenir.\n"
  );
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  const taxonomies = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "taxonomies-seed.json"), "utf-8")
  );
  const tracks = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "tracks-seed.json"), "utf-8")
  );

  console.log(`Import de ${taxonomies.length} taxonomies...`);
  const taxBatch = db.batch();
  for (const tax of taxonomies) {
    const ref = db.collection("taxonomies").doc(tax.id);
    taxBatch.set(ref, { label: tax.label, type: tax.type }, { merge: true });
  }
  await taxBatch.commit();
  console.log("✅ Taxonomies importées.");

  console.log(`Import de ${tracks.length} pistes...`);
  const trackBatch = db.batch();
  const now = Date.now();
  for (const track of tracks) {
    const ref = db.collection("tracks").doc(track.id);
    trackBatch.set(
      ref,
      {
        name: track.name,
        address: track.address,
        lat: track.lat,
        lng: track.lng,
        surfaceIds: track.surfaceIds,
        disciplineIds: track.disciplineIds,
        scaleIds: track.scaleIds,
        photoURL: track.photoURL,
        description: track.description,
        website: track.website,
        createdAt: now,
        createdBy: "seed-script",
      },
      { merge: true }
    );
  }
  await trackBatch.commit();
  console.log("✅ Pistes importées.");

  console.log("\n🎉 Import terminé ! Va vérifier dans la Console Firebase > Firestore Database.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erreur pendant l'import :", err);
  process.exit(1);
});
