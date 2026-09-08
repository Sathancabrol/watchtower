/**
 * Reprise après incident de rendu WebGL.
 *
 * Cesium arrête définitivement sa boucle de rendu dès qu'une exception
 * survient (« An error occurred while rendering. Rendering has stopped. »),
 * et le globe disparaît. Les causes les plus fréquentes ne sont pas des bogues
 * applicatifs mais des accidents de contexte graphique :
 *   - contexte WebGL perdu (rechargement à chaud, veille, pilote qui recycle) ;
 *   - `maximumTextureSize` dépassé sur une carte graphique modeste ;
 *   - mémoire vidéo saturée après de longues sessions.
 *
 * Ces incidents sont RÉCUPÉRABLES : il suffit de relancer la boucle. Ce module
 * décide quand retenter, avec un plafond pour ne pas boucler indéfiniment sur
 * une panne réelle. Fonctions pures, testables sans navigateur.
 *
 * @module data/reprisRendu
 */

/** Nombre maximal de reprises automatiques avant d'abandonner. */
export const MAX_REPRISES = 3;

/** Au-delà de ce délai, l'incident précédent est considéré comme oublié. */
export const FENETRE_OUBLI_MS = 120_000;

/** Motifs d'erreur connus comme récupérables. */
const MOTIFS_RECUPERABLES = [
  /maximumtexturesize/i,
  /context\s*lost/i,
  /contextlost/i,
  /webgl/i,
  /out of memory/i,
  /texture/i,
  /framebuffer/i,
];

/**
 * Dit si une erreur de rendu vaut la peine d'être retentée.
 * @param {unknown} erreur - Erreur remontée par Cesium.
 * @returns {boolean} Vrai si l'incident est probablement transitoire.
 */
export function estRecuperable(erreur) {
  if (!erreur) return false;
  const texte = typeof erreur === 'string'
    ? erreur
    : `${erreur.message ?? ''} ${erreur.name ?? ''}`;
  if (!texte.trim()) return false;
  return MOTIFS_RECUPERABLES.some((m) => m.test(texte));
}

/**
 * Décide de la suite à donner à un incident de rendu.
 * @param {{erreur:unknown, reprises:number, dernierIncidentMs:number|null, maintenantMs:number}} etat
 * @returns {{reprendre:boolean, reprises:number, delaiMs:number, raison:string}}
 */
export function deciderReprise({ erreur, reprises = 0, dernierIncidentMs = null, maintenantMs = Date.now() }) {
  // Un incident isolé après une longue période saine ne doit pas compter
  // comme une récidive : on repart de zéro.
  const recidive = dernierIncidentMs !== null && maintenantMs - dernierIncidentMs < FENETRE_OUBLI_MS;
  const compte = recidive ? reprises : 0;

  if (!estRecuperable(erreur)) {
    return { reprendre: false, reprises: compte, delaiMs: 0, raison: 'erreur non récupérable' };
  }
  if (compte >= MAX_REPRISES) {
    return { reprendre: false, reprises: compte, delaiMs: 0, raison: 'trop de reprises rapprochées' };
  }
  // Attente croissante : 0,5 s puis 1 s puis 2 s — laisse le pilote souffler.
  const delaiMs = 500 * 2 ** compte;
  return { reprendre: true, reprises: compte + 1, delaiMs, raison: 'incident graphique transitoire' };
}

/**
 * Message affiché à l'utilisateur, en français et sans jargon.
 * @param {{reprendre:boolean, reprises:number}} decision - Décision de reprise.
 * @returns {string} Texte prêt à afficher.
 */
export function messageUtilisateur(decision) {
  if (decision?.reprendre) {
    return `Incident graphique — reprise du rendu (tentative ${decision.reprises}/${MAX_REPRISES})…`;
  }
  return "Le rendu 3D s'est interrompu. Recharge la page (Ctrl+Maj+R) ; si le problème persiste, "
    + 'ferme les autres onglets 3D ou réduis les calques actifs.';
}
