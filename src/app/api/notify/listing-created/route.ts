import { NextRequest, NextResponse } from "next/server";
import { sendPushToAllUsers } from "@/lib/server/pushNotify";

export async function POST(req: NextRequest) {
  try {
    const { sellerUid, title, price } = await req.json();
    if (!sellerUid || !title) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    await sendPushToAllUsers(
      "marketplaceNew",
      { title: "Nouvelle annonce sur Vente entre pilotes", body: `${title} — ${price} €`, url: "/vente" },
      sellerUid
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur notif nouvelle annonce :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
