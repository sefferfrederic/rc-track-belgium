import { NextRequest, NextResponse } from "next/server";

// Clé API stockée côté serveur uniquement (variable d'environnement Vercel,
// SANS préfixe NEXT_PUBLIC_) — jamais exposée au navigateur.
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/**
 * Traduit une liste de textes du français vers le néerlandais via l'API
 * Google Cloud Translation (Basic v2). Utilisé une seule fois à la création
 * d'une annonce ou d'un événement — le résultat est ensuite stocké dans
 * Firestore, donc aucune traduction répétée à chaque affichage.
 */
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Clé GOOGLE_TRANSLATE_API_KEY absente des variables d'environnement." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const texts: unknown = body?.texts;
  if (!Array.isArray(texts) || texts.length === 0 || !texts.every((t) => typeof t === "string")) {
    return NextResponse.json({ error: "Le champ 'texts' doit être un tableau de chaînes." }, { status: 400 });
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, source: "fr", target: "nl", format: "text" }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erreur Google Translate :", errText);
      return NextResponse.json({ error: "Échec de la traduction." }, { status: 502 });
    }

    const data = await res.json();
    const translations: string[] = data.data.translations.map(
      (t: { translatedText: string }) => t.translatedText
    );
    return NextResponse.json({ translations });
  } catch (err) {
    console.error("Erreur réseau traduction :", err);
    return NextResponse.json({ error: "Échec de la traduction." }, { status: 502 });
  }
}
