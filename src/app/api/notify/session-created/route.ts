import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToFavoriteTrackUsers } from "@/lib/server/pushNotify";

/**
 * Appelé côté client juste après la création d'une TOUTE NOUVELLE session
 * (pas à chaque personne qui rejoint une session existante — voir
 * lib/firebase/sessions.ts::upsertSessionEntry). Best-effort : si cet appel
 * échoue, la session est déjà enregistrée normalement, seule la notif est perdue.
 */
export async function POST(req: NextRequest) {
  try {
    const { trackId, dayKey, creatorUid } = await req.json();
    if (!trackId || !dayKey || !creatorUid) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const trackSnap = await getAdminDb().collection("tracks").doc(trackId).get();
    const trackName = (trackSnap.exists ? trackSnap.data()?.name : null) ?? "une piste";
    const dateLabel = new Date(`${dayKey}T00:00:00`).toLocaleDateString("fr-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    await sendPushToFavoriteTrackUsers(
      trackId,
      "sessionsNewOnFavorite",
      { title: `Nouvelle session à ${trackName}`, body: `Le ${dateLabel}`, url: "/agenda" },
      creatorUid
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur notif session créée :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
