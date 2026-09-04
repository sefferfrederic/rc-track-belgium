import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUids } from "@/lib/server/pushNotify";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function dayKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Envoie un rappel push aux pilotes inscrits ~2h avant le début de LEUR
 * créneau (chaque participant a son propre horaire au sein d'une session).
 * Protégé par CRON_SECRET, comme /api/cleanup-listings.
 *
 * IMPORTANT — pourquoi ce n'est PAS déclaré dans vercel.json :
 * le plan Vercel Hobby ne permet qu'un cron par jour (précision à l'heure
 * près), ce qui est incompatible avec un rappel à 2h près. Ce endpoint est
 * donc appelé toutes les ~15 min par une GitHub Action externe et gratuite
 * (voir .github/workflows/session-reminders.yml), qui envoie le même en-tête
 * Authorization que Vercel Cron. Aucun changement de code nécessaire si le
 * projet passe un jour sur Vercel Pro : il suffirait d'ajouter l'entrée dans
 * vercel.json et de désactiver la GitHub Action.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const adminDb = getAdminDb();
  const now = Date.now();
  const todayKey = dayKeyFromDate(new Date(now));
  const tomorrowKey = dayKeyFromDate(new Date(now + 24 * 3600 * 1000));

  // Bornage de la lecture aux sessions d'aujourd'hui/demain (dayKey est une
  // chaîne "AAAA-MM-JJ" donc "in" suffit, pas besoin d'un scan complet).
  const snap = await adminDb.collection("sessions").where("dayKey", "in", [todayKey, tomorrowKey]).get();

  let remindersSent = 0;
  const trackNameCache = new Map<string, string>();

  async function trackName(trackId: string): Promise<string> {
    if (trackNameCache.has(trackId)) return trackNameCache.get(trackId)!;
    const trackSnap = await adminDb.collection("tracks").doc(trackId).get();
    const name = (trackSnap.exists ? trackSnap.data()?.name : null) ?? "ta piste";
    trackNameCache.set(trackId, name);
    return name;
  }

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const participants: Array<Record<string, unknown>> = data.participants ?? [];
    let changed = false;

    const updatedParticipants = await Promise.all(
      participants.map(async (p) => {
        const start = p.start as number;
        const uid = p.uid as string;
        const alreadySent = p.reminderSentAt;
        const minutesUntil = start - now;

        if (!alreadySent && minutesUntil > 0 && minutesUntil <= TWO_HOURS_MS) {
          const name = await trackName(data.trackId as string);
          const startLabel = new Date(start).toLocaleTimeString("fr-BE", {
            hour: "2-digit",
            minute: "2-digit",
          });
          await sendPushToUids([uid], "sessionsReminder", {
            title: `Session à ${name} dans 2h`,
            body: `Départ à ${startLabel}`,
            url: "/",
          });
          remindersSent++;
          changed = true;
          return { ...p, reminderSentAt: now };
        }
        return p;
      })
    );

    if (changed) {
      await docSnap.ref.update({ participants: updatedParticipants });
    }
  }

  return NextResponse.json({ remindersSent });
}
