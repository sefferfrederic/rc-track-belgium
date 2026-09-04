/**
 * Traduit une liste de textes FR → NL via la route API /api/translate.
 * Retourne un tableau de même longueur : null pour les entrées vides,
 * ou en cas d'échec de traduction (l'appelant retombe alors sur le français
 * grâce à localizedText — aucune erreur ne remonte à l'utilisateur).
 */
export async function translateMany(texts: string[]): Promise<(string | null)[]> {
  const indices: number[] = [];
  const toTranslate: string[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim().length > 0) {
      indices.push(i);
      toTranslate.push(t.trim());
    }
  });

  if (toTranslate.length === 0) return texts.map(() => null);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: toTranslate }),
    });
    if (!res.ok) return texts.map(() => null);

    const data = await res.json();
    const translations: string[] = data.translations ?? [];
    const result: (string | null)[] = texts.map(() => null);
    indices.forEach((originalIndex, j) => {
      result[originalIndex] = translations[j] ?? null;
    });
    return result;
  } catch {
    return texts.map(() => null);
  }
}
