import { NextRequest, NextResponse } from "next/server";
import { sendPushToAllUsers } from "@/lib/server/pushNotify";

export async function POST(req: NextRequest) {
  try {
    const { title, message } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    await sendPushToAllUsers("announcements", { title, body: message ?? "", url: "/" });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur notif annonce admin :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
