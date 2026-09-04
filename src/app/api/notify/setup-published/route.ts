import { NextRequest, NextResponse } from "next/server";
import { sendPushToAllUsers } from "@/lib/server/pushNotify";

export async function POST(req: NextRequest) {
  try {
    const { authorUid, authorName, carName } = await req.json();
    if (!authorUid || !carName) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    await sendPushToAllUsers(
      "garageNewSetup",
      {
        title: "Nouveau setup public",
        body: `${carName} par ${authorName ?? "un pilote"}`,
        url: "/reglages-publics",
      },
      authorUid
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur notif nouveau setup :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
