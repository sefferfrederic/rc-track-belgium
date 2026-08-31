import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";

/**
 * Supprime les annonces (module Vente) dont la date d'expiration (30 jours après
 * création) est dépassée, ainsi que leurs photos dans Storage. Déclenché
 * automatiquement chaque nuit par Vercel Cron (voir vercel.json).
 * Protégé par CRON_SECRET, que Vercel ajoute automatiquement en en-tête
 * "Authorization: Bearer ..." lors de l'exécution planifiée.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  const now = Date.now();
  const snap = await adminDb.collection("listings").where("expiresAt", "<=", now).get();

  let deletedCount = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const photoURLs: string[] = data.photoURLs ?? [];

    for (const url of photoURLs) {
      try {
        const match = decodeURIComponent(url).match(/\/o\/(.+?)\?/);
        const path = match?.[1];
        if (path) await adminStorage.bucket().file(path).delete();
      } catch (err) {
        console.error("Erreur suppression photo annonce :", err);
      }
    }

    await docSnap.ref.delete();
    deletedCount++;
  }

  return NextResponse.json({ deleted: deletedCount });
}
