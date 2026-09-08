/**
 * Registre des bascules du volant (chantier B).
 *
 * Le volant **référence** les modules existants, il ne les absorbe pas : chaque
 * entrée pointe vers un module déjà en place (par son identifiant de dock, son
 * identifiant DOM, ou une fonction d'action). Rien n'est réimplémenté, rien
 * n'est perdu.
 *
 * Ce module est **pur** : pas de DOM, pas de réseau. Il décrit *quoi* proposer
 * et mémorise *ce qui est allumé*. Le rendu vit dans `src/volant.js`.
 *
 * @module data/volant/registreBascules
 */

/** Clé de persistance des bascules dans le stockage local. */
export const CLE_ETAT = 'wt-volant-bascules';

/**
 * Familles du volant. L'ordre fixe la position autour du moyeu.
 * `urgence` vient en premier : c'est le groupe du bouton œil.
 */
export const FAMILLES = Object.freeze([
  Object.freeze({ id: 'urgence', libelle: 'Urgence', icone: '👁', couleur: '#ff5a5a' }),
  Object.freeze({ id: 'vues',    libelle: 'Vues',    icone: '🗺', couleur: '#00d4ff' }),
  Object.freeze({ id: 'donnees', libelle: 'Données', icone: '📊', couleur: '#7fe7ff' }),
  Object.freeze({ id: 'nav',     libelle: 'Navigation', icone: '🧭', couleur: '#9effa8' }),
  Object.freeze({ id: 'modes',   libelle: 'Modes',   icone: '🎛', couleur: '#ffd479' }),
  Object.freeze({ id: 'outils',  libelle: 'Outils',  icone: '🛠', couleur: '#c9a8ff' }),
]);

/**
 * Bascules d'affichage : ce qui peut être éteint pour dégager la vue.
 *
 * Répond à « les cercles volants France/ville c'est chiant, faut pouvoir
 * toggle toutes les fonctionnalités ». Chaque entrée dit **quoi** masquer
 * (`selecteur` CSS) ou **quelle** fonction appeler (`action`).
 *
 * `parDefaut: false` = éteint au premier lancement.
 */
export const BASCULES_AFFICHAGE = Object.freeze([
  Object.freeze({
    id: 'anneau-celeste', libelle: 'Anneau céleste', icone: '☀',
    aide: 'Cercle du soleil et de la lune autour du globe.',
    selecteur: '#celestial-ring-overlay', famille: 'vues', parDefaut: true,
  }),
  Object.freeze({
    id: 'medaillons', libelle: 'Médaillons flottants', icone: '🔵',
    aide: 'Pastilles de lieux qui flottent au-dessus de la carte.',
    selecteur: '.wt-medaillon, #wt-medaillons', famille: 'vues', parDefaut: true,
  }),
  Object.freeze({
    id: 'titre', libelle: 'Titre WATCHTOWER', icone: '🏷',
    aide: 'Bandeau de titre en haut à gauche.',
    selecteur: '#title-bar', famille: 'vues', parDefaut: true,
  }),
  Object.freeze({
    id: 'cadrans', libelle: 'Cadrans de la commune', icone: '🔲',
    aide: 'Quadrillage de quartiers façon Frostpunk.',
    selecteur: '#wt-cadrans', famille: 'vues', parDefaut: true,
  }),
  Object.freeze({
    id: 'fil-info', libelle: 'Fil d’actualité', icone: '📰',
    aide: 'Bandeau de dépêches en continu.',
    selecteur: '#wt-fil, .wt-fil-info', famille: 'donnees', parDefaut: true,
  }),
  Object.freeze({
    id: 'minicarte', libelle: 'Minicarte', icone: '🗺',
    aide: 'Carte ronde en bas à gauche.',
    selecteur: '#wt-minimap', famille: 'nav', parDefaut: true,
  }),
  Object.freeze({
    id: 'entites', libelle: 'Entités mobiles', icone: '✈',
    aide: 'Avions, bateaux et véhicules suivis en direct.',
    selecteur: '#wt-entites', famille: 'donnees', parDefaut: true,
  }),
  Object.freeze({
    id: 'dispositifs', libelle: 'Dispositifs au sol', icone: '📡',
    aide: 'Capteurs, caméras et bornes repérés sur le terrain.',
    selecteur: '#wt-dispositifs', famille: 'donnees', parDefaut: true,
  }),
]);

/**
 * Normalise un état de bascules lu depuis le stockage.
 * Une clé inconnue est ignorée ; une bascule absente prend sa valeur par défaut.
 * @param {unknown} brut - Contenu du stockage.
 * @param {Array<object>} [bascules=BASCULES_AFFICHAGE] - Référentiel.
 * @returns {Record<string, boolean>} État complet et sûr.
 */
export function normaliserEtat(brut, bascules = BASCULES_AFFICHAGE) {
  const lu = brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {};
  const etat = {};
  for (const b of bascules) {
    etat[b.id] = typeof lu[b.id] === 'boolean' ? lu[b.id] : b.parDefaut !== false;
  }
  return etat;
}

/**
 * Inverse une bascule et renvoie un nouvel état (sans muter l'entrée).
 * @param {Record<string, boolean>} etat - État courant.
 * @param {string} id - Identifiant de la bascule.
 * @returns {Record<string, boolean>} Nouvel état.
 */
export function basculer(etat, id) {
  const e = { ...etat };
  if (Object.prototype.hasOwnProperty.call(e, id)) e[id] = !e[id];
  return e;
}

/**
 * Éteint tout ce qui encombre la vue — le « dégagement d'urgence ».
 * Ne touche qu'aux bascules d'affichage : les panneaux restent accessibles.
 * @param {Record<string, boolean>} etat - État courant.
 * @param {Array<object>} [bascules=BASCULES_AFFICHAGE] - Référentiel.
 * @returns {Record<string, boolean>} Tout éteint.
 */
export function toutEteindre(etat, bascules = BASCULES_AFFICHAGE) {
  const e = { ...etat };
  for (const b of bascules) e[b.id] = false;
  return e;
}

/**
 * Rallume tout.
 * @param {Record<string, boolean>} etat - État courant.
 * @param {Array<object>} [bascules=BASCULES_AFFICHAGE] - Référentiel.
 * @returns {Record<string, boolean>} Tout allumé.
 */
export function toutAllumer(etat, bascules = BASCULES_AFFICHAGE) {
  const e = { ...etat };
  for (const b of bascules) e[b.id] = true;
  return e;
}

/**
 * Compte ce qui est allumé — sert la pastille du moyeu.
 * @param {Record<string, boolean>} etat - État courant.
 * @param {Array<object>} [bascules=BASCULES_AFFICHAGE] - Référentiel.
 * @returns {{allumes:number, total:number}} Décompte.
 */
export function compter(etat, bascules = BASCULES_AFFICHAGE) {
  const e = normaliserEtat(etat, bascules);
  return { allumes: bascules.filter((b) => e[b.id]).length, total: bascules.length };
}

/**
 * Regroupe les bascules par famille, dans l'ordre de `FAMILLES`.
 * @param {Array<object>} [bascules=BASCULES_AFFICHAGE] - Référentiel.
 * @returns {Array<{famille:object, entrees:Array<object>}>} Groupes non vides.
 */
export function parFamille(bascules = BASCULES_AFFICHAGE) {
  return FAMILLES
    .map((famille) => ({ famille, entrees: bascules.filter((b) => b.famille === famille.id) }))
    .filter((g) => g.entrees.length > 0);
}

/**
 * Position d'un rayon du volant, en coordonnées écran.
 * Le volant s'ouvre en éventail vers la droite (il est ancré à gauche),
 * de -70° à +70° : au-delà, les boutons sortiraient de l'écran.
 * @param {number} index - Rang du rayon.
 * @param {number} total - Nombre de rayons.
 * @param {number} [rayon=96] - Distance au moyeu, en pixels.
 * @returns {{x:number, y:number, angleDeg:number}} Décalage depuis le moyeu.
 */
export function positionRayon(index, total, rayon = 96) {
  if (!Number.isFinite(total) || total <= 0) return { x: 0, y: 0, angleDeg: 0 };
  const etendue = 140; // degrés balayés
  const pas = total === 1 ? 0 : etendue / (total - 1);
  const angleDeg = total === 1 ? 0 : -etendue / 2 + index * pas;
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * rayon, y: Math.sin(a) * rayon, angleDeg };
}
