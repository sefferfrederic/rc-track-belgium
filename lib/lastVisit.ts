const KEY = "rc-track-last-visit";

/**
 * Retourne le timestamp (ms) de la dernière visite connue, puis enregistre immédiatement
 * "maintenant" pour la prochaine fois. Ainsi, un "Nouveautés depuis ta dernière visite"
 * affiché à l'écran ne disparaît pas tant que la page reste ouverte, mais ne réapparaîtra
 * pas pour les mêmes éléments au prochain chargement.
 *
 * Si c'est la toute première visite (rien en mémoire), on retourne "il y a 7 jours"
 * plutôt que 0, pour éviter d'afficher des années d'historique d'un coup.
 */
export function consumeLastVisit(): number {
  if (typeof window === "undefined") return Date.now();
  const stored = window.localStorage.getItem(KEY);
  const since = stored ? Number(stored) : Date.now() - 7 * 24 * 3600 * 1000;
  window.localStorage.setItem(KEY, String(Date.now()));
  return since;
}
