/**
 * Messages d'état du chargement des sites cartographiés (installations).
 *
 * Porté depuis le projet source (`gods-eye-view`), seul module qui manquait à
 * ce fork. Traduit en français, comportement identique.
 *
 * Principe tenu du module d'origine : **ne jamais affirmer une surcharge qu'on
 * n'a pas observée**. On rapporte ce que le serveur a répondu, pas une
 * supposition sur son état.
 *
 * @module data/installationFeedback
 */

/**
 * Décrit l'état de disponibilité des sites cartographiés.
 * @param {{loading?:boolean, retrying?:boolean, retryAt?:number, status?:string,
 *          stale?:boolean, failureReason?:string}} [stats] - État courant.
 * @param {number} [now=Date.now()] - Horodatage de référence (injectable pour les tests).
 * @returns {string} Message prêt à afficher.
 */
export function installationFeedback(stats = {}, now = Date.now()) {
  const raisons = {
    rate_limited: 'Overpass a limité le débit',
    timeout: 'Overpass n’a pas répondu à temps',
    query_failed: 'Overpass n’a pas pu exécuter la requête',
  };
  const raison = raisons[stats.failureReason] || 'Overpass momentanément indisponible';
  if (stats.loading) return stats.retrying ? 'Nouvelle tentative…' : 'Recherche des sites cartographiés…';
  if (stats.retryAt > 0) {
    const secondes = Math.max(0, Math.ceil((stats.retryAt - now) / 1000));
    return `${raison} — ${secondes ? `nouvelle tentative dans ${secondes} s` : 'tentative en attente'}`;
  }
  if (stats.status === 'unavailable') return raison;
  if (stats.status === 'zoom-in') return 'Rapproche-toi pour chercher les installations cartographiées';
  if (stats.stale) return 'Affichage des sites en cache';
  if (stats.status === 'idle') return 'Sites cartographiés non chargés';
  return 'Sites cartographiés chargés';
}
