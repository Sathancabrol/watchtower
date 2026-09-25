/**
 * Frontignan la Peyrade — gouvernance municipale et coopération internationale.
 *
 * Données publiques, issues des sources officielles de la Ville et de la presse
 * locale. Le mandat en cours est le **second mandat de Michel Arrouy**, ouvert
 * par l'élection du 15 mars 2026.
 *
 * AVERTISSEMENT DE MÉTHODE — deux pièges documentés sur ce dossier précis :
 *
 *  1. **Ne pas confondre les mandatures.** Plusieurs annuaires (la-mairie.com,
 *     ladepeche.fr) publiaient encore, après mars 2026, l'équipe de 2020 :
 *     Caroline Suné, Caroline Sala, Renée Duranton-Portelli y figurent comme
 *     adjointes. Elles ne font pas partie de l'exécutif installé le 22/03/2026.
 *  2. **Les noms ne garantissent pas les délégations.** Une synthèse reçue en
 *     septembre 2026 donnait les dix bons noms dans le bon ordre, mais leur
 *     attribuait des délégations inventées (les finances à Youcef El Amri,
 *     l'éducation à Valérie Maillard…). Les délégations ci-dessous sont celles
 *     publiées par la Ville.
 *
 * Fonctions pures : aucun accès réseau ni DOM.
 * @module data/territoire/gouvernance
 */

/** Scrutin municipal du 15 mars 2026, acquis au premier tour. */
export const SCRUTIN_2026 = Object.freeze({
  date: '2026-03-15',
  tour: 1,
  installationConseil: '2026-03-22',
  siegesConseil: 35,
  siegesAgglo: 10,
  doyenPresidentSeance: 'Jean-Louis Patry',
  source: 'https://www.frontignan.fr/flp-mag-48-le-dossier-une-nouvelle-mandature-sengage/',
  listes: Object.freeze([
    Object.freeze({
      nom: 'Passion Frontignan La Peyrade', tete: 'Michel Arrouy', nuance: 'majorité',
      pourcentage: 51.16, sieges: 27, siegesAgglo: 8,
      note: 'En tête dans les 19 bureaux de vote de la commune.',
    }),
    Object.freeze({
      nom: 'Rassemblement national', tete: 'Cédric Delapierre', nuance: 'opposition',
      pourcentage: 35.87, sieges: 6, siegesAgglo: 2,
    }),
    Object.freeze({
      nom: 'Divers droite', tete: 'Thibaut Cléret-Villagordo', nuance: 'opposition',
      pourcentage: 12.97, sieges: 2, siegesAgglo: 0,
    }),
  ]),
});

/**
 * L'exécutif municipal installé le 22 mars 2026 : le maire et ses dix adjoints,
 * dans l'ordre du tableau du conseil.
 *
 * `delegation` vaut `null` quand la Ville ne l'a pas encore publiée : c'est une
 * absence de donnée, surtout pas une invitation à la deviner.
 */
export const EXECUTIF = Object.freeze({
  mandat: '2026-2032',
  installe: '2026-03-22',
  source: 'https://www.frontignan.fr/ma-ville/elus/elus-de-la-majorite/',
  sourceInstallation: 'https://www.frontignan.fr/michel-arrouy-elu-maire-de-frontignan-la-peyrade/',
  maire: Object.freeze({
    rang: 0, nom: 'Michel ARROUY', fonction: 'Maire de Frontignan la Peyrade',
    delegation: 'Sécurité',
    conseillerCommunautaire: true,
    note: 'Le maire a annoncé conserver personnellement la délégation à la sécurité, '
      + 'en sa qualité d\u2019officier de police judiciaire. Second mandat.',
  }),
  adjoints: Object.freeze([
    Object.freeze({ rang: 1, nom: 'Claudie MINGUEZ', delegation: 'Administration générale', premiere: true }),
    Object.freeze({ rang: 2, nom: 'Youcef EL AMRI', delegation: 'Insertion, formation et Politique de la ville' }),
    Object.freeze({ rang: 3, nom: 'Valérie MAILLARD', delegation: 'Culture et patrimoine' }),
    Object.freeze({ rang: 4, nom: 'Éric BRINGUIER', delegation: 'Cadre de vie' }),
    Object.freeze({ rang: 5, nom: 'Marie-Françoise DE MORI', delegation: null }),
    Object.freeze({ rang: 6, nom: 'Jean-Louis MOLTO', delegation: null }),
    Object.freeze({ rang: 7, nom: 'Chantal CARRION', delegation: 'Accès au logement et lutte contre l\u2019habitat indigne' }),
    Object.freeze({ rang: 8, nom: 'Georges MOUREAUX', delegation: null }),
    Object.freeze({ rang: 9, nom: 'Françoise TAILLEFER', delegation: 'Petite enfance, famille et égalité hommes/femmes' }),
    Object.freeze({ rang: 10, nom: 'Olivier LAURENT', delegation: null }),
  ]),
});

/**
 * Anciens adjoints de la mandature 2020-2026, conservés UNIQUEMENT comme
 * garde-fou : ils circulent encore dans des annuaires présentés comme à jour.
 * Toute source qui les donne pour adjoints en exercice est périmée.
 */
export const ADJOINTS_MANDATURE_PRECEDENTE = Object.freeze([
  'Caroline SUNÉ', 'Caroline SALA', 'Renée DURANTON-PORTELLI',
]);

/**
 * Jumelages et coopération internationale.
 *
 * La Ville tisse des liens de coopération **depuis 1995**, avec des communes de
 * pays dont une partie de sa population est originaire — c'est la logique
 * revendiquée de « terre d'accueil », et non un classement de prestige.
 *
 * `depuis` n'est renseigné que lorsque la date est sourcée. Gaeta (1997) et
 * M'Diq (2018) le sont ; les années avancées ailleurs pour Vizela et Pineda de
 * Mar n'ont pas été retrouvées dans une source officielle.
 */
export const JUMELAGES = Object.freeze([
  Object.freeze({
    ville: 'Gaeta', pays: 'Italie', depuis: 1997, actif: true,
    note: 'Comité de jumelage Frontignan/Gaeta constitué.',
  }),
  Object.freeze({
    ville: 'Vizela', pays: 'Portugal', depuis: null, actif: true,
    note: 'Jumelage actif : accueil de stagiaires frontignanais (lycée Maurice-Clavel).',
  }),
  Object.freeze({
    ville: 'Pineda de Mar', pays: 'Espagne', depuis: null, actif: true,
    note: 'Province de Barcelone. Échanges lors des festivités de la ville.',
  }),
  Object.freeze({
    ville: 'M\u2019Diq', pays: 'Maroc', depuis: 2018, actif: true,
    note: 'Convention signée au 6\u1d49 Forum international des médinas. Porté par '
      + 'l\u2019association Les MédiTerriennes et le CENDEP côté marocain.',
    axes: Object.freeze([
      'Jeunesse et apprentissage de la citoyenneté',
      'Handicap',
      'Culture et sport',
      'Patrimoine',
      'Tourisme et plaisance',
      'Économie et artisanat',
    ]),
  }),
]);

/**
 * Jumelage cité par des annuaires tiers mais absent des listes officielles de
 * la Ville. Conservé en réserve, non compté parmi les jumelages actifs.
 */
export const JUMELAGES_NON_CONFIRMES = Object.freeze([
  Object.freeze({
    ville: 'Rubí', pays: 'Espagne', source: 'communes.com',
    note: 'Jamais mentionné par frontignan.fr, qui parle constamment de « 4 villes ». À vérifier.',
  }),
]);

/**
 * La Ville est la seule commune du bassin de Thau dotée d'un service dédié à la
 * mobilité internationale (échanges de jeunes, stages à l'étranger).
 */
export const MOBILITE_INTERNATIONALE = Object.freeze({
  serviceDedie: true,
  uniqueDansBassinDeThau: true,
  cooperationDepuis: 1995,
  source: 'https://www.occitanie-tribune.com/articles/18336/frontignan-la-mobilite-une-veritable-opportunite',
});

/**
 * Nombre d'adjoints dont la délégation reste à publier.
 * @returns {number} Compte des délégations manquantes.
 */
export function delegationsManquantes() {
  return EXECUTIF.adjoints.filter((a) => a.delegation === null).length;
}

/**
 * Vérifie qu'un nom n'est pas un adjoint de la mandature précédente.
 * @param {string} nom - Nom à contrôler.
 * @returns {boolean} Vrai si le nom provient d'une source périmée.
 */
export function estAdjointPerime(nom) {
  const n = String(nom || '').normalize('NFC').toUpperCase();
  return ADJOINTS_MANDATURE_PRECEDENTE.some((a) => a.normalize('NFC').toUpperCase() === n);
}
