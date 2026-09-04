/**
 * Retourne le texte néerlandais si disponible et que la langue active est "nl",
 * sinon retourne le texte français par défaut (repli automatique).
 */
export function localizedText(fr: string, nl: string | null | undefined, locale: "fr" | "nl"): string {
  if (locale === "nl" && nl && nl.trim().length > 0) return nl;
  return fr;
}
