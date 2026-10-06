/**
 * WATCHTOWER — INTEL : QUOI DIRE, SELON LA HAUTEUR OÙ L'ON SE TROUVE.
 *
 * Le defaut constate : la vue INTEL ne savait parler que du local. Depuis
 * l'espace ou au-dessus d'un pays etranger, elle n'avait rien a dire, ce qui
 * donne l'impression d'une application qui ne marche qu'a Sete.
 *
 * Ce module repare cela en declarant, pour CHAQUE echelon de
 * `../geo/echelleVue.js`, quels indicateurs ont un sens et quelle source
 * ouverte les fournit. Il ne fait aucun appel : il dit quoi demander, a qui,
 * et a quel prix. L'interface decide ensuite.
 *
 * TROIS REGLES, qui viennent des consignes du projet :
 *  1. Du gratuit, et si possible SANS CLE. Une cle a configurer par ami, c'est
 *     un ami qui abandonne.
 *  2. Ce qui est en base locale passe AVANT ce qui demande le reseau, et on
 *     DIT quand une source externe devient necessaire.
 *  3. Rien n'est affirme sans provenance. Un indicateur porte toujours sa
 *     source et son niveau de confiance.
 *
 * PUR : aucune dependance au DOM, aucun appel reseau, aucune cle.
 */

import { ECHELONS, echelleSelonAltitude } from '../geo/echelleVue.js';

/**
 * Les fournisseurs, declares une fois.
 *
 *  · `cle`     : ce qu'il faut fournir. ABSENT = rien, et c'est le cas voulu.
 *  · `horsLigne` : vrai si la reponse est deja dans l'application.
 *  · `confiance` : 'haute' quand la source est officielle et datee,
 *                  'moyenne' quand elle est ouverte mais agregee,
 *                  'faible' quand elle sert de simple indice.
 */
export const FOURNISSEURS = Object.freeze({
  base: {
    nom: 'Base locale WATCHTOWER', portee: 'local', horsLigne: true,
    url: null, confiance: 'haute',
    note: 'Donnees du bassin de Thau embarquees dans l’application. Repond sans reseau.',
  },
  gdelt: {
    nom: 'GDELT 2.0', portee: 'mondial', horsLigne: false,
    url: 'https://api.gdeltproject.org/api/v2/doc/doc', confiance: 'moyenne',
    note: 'Flux d’actualite mondial, agrege automatiquement. Donne la temperature, pas la verite.',
  },
  gdeltGeo: {
    nom: 'GDELT GEO 2.0', portee: 'mondial', horsLigne: false,
    url: 'https://api.gdeltproject.org/api/v2/geo/geo', confiance: 'moyenne',
    note: 'Meme flux, mais GEOLOCALISE et rendu en GeoJSON : se pose directement sur le globe.',
  },
  banqueMondiale: {
    nom: 'Banque mondiale', portee: 'mondial', horsLigne: false,
    url: 'https://api.worldbank.org/v2', confiance: 'haute',
    note: 'Indicateurs par pays, series longues, sans cle. La reference au niveau national.',
  },
  restcountries: {
    nom: 'REST Countries', portee: 'mondial', horsLigne: false,
    url: 'https://restcountries.com/v3.1', confiance: 'haute',
    note: 'Fiche d’identite d’un pays : capitale, langues, monnaie, superficie. Sans cle.',
  },
  eurostat: {
    nom: 'Eurostat', portee: 'europe', horsLigne: false,
    url: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data', confiance: 'haute',
    note: 'Statistiques regionales europeennes au niveau NUTS. Sans cle.',
  },
  insee: {
    nom: 'INSEE', portee: 'france', horsLigne: false,
    url: 'https://www.insee.fr', confiance: 'haute',
    note: 'La statistique publique francaise. Chiffres officiels, dates de reference explicites.',
  },
  geoApi: {
    nom: 'API Decoupage administratif', portee: 'france', horsLigne: false,
    url: 'https://geo.api.gouv.fr', confiance: 'haute',
    note: 'Communes, departements, regions et leurs populations. Sans cle.',
  },
  georisques: {
    nom: 'Géorisques', portee: 'france', horsLigne: false,
    url: 'https://www.georisques.gouv.fr', confiance: 'haute',
    note: 'Risques naturels et technologiques, par commune. Sans cle.',
  },
  usgs: {
    nom: 'USGS', portee: 'mondial', horsLigne: false,
    url: 'https://earthquake.usgs.gov/fdsnws/event/1/query', confiance: 'haute',
    note: 'Sismicite mondiale en temps quasi reel. Sans cle.',
  },
  openMeteo: {
    nom: 'Open-Meteo', portee: 'mondial', horsLigne: false,
    url: 'https://api.open-meteo.com/v1/forecast', confiance: 'haute',
    note: 'Meteo et qualite de l’air, sans cle, 10 000 requetes par jour.',
  },
  wikidata: {
    nom: 'Wikidata', portee: 'mondial', horsLigne: false,
    url: 'https://query.wikidata.org/sparql', confiance: 'moyenne',
    note: 'Graphe de connaissances collaboratif : large, mais a recouper.',
  },
});

/**
 * Ce qu'INTEL raconte a chaque echelon.
 *
 * Les cles correspondent EXACTEMENT a celles de `ECHELONS` : un test le
 * verifie, pour qu'un echelon ajoute plus tard ne puisse pas rester muet.
 */
export const NIVEAUX = Object.freeze({
  espace: {
    titre: 'MONDE', sous: 'VUE ORBITALE',
    question: 'Que se passe-t-il sur la planete en ce moment ?',
    indicateurs: Object.freeze([
      { id: 'actualite-mondiale', libelle: 'Tensions et evenements du jour', fournisseur: 'gdelt' },
      { id: 'seismes', libelle: 'Seismes des 24 dernieres heures', fournisseur: 'usgs' },
      { id: 'points-chauds', libelle: 'Couverture mediatique geolocalisee', fournisseur: 'gdeltGeo' },
    ]),
  },
  continent: {
    titre: 'CONTINENT', sous: 'ENSEMBLE REGIONAL',
    question: 'Quelle est la situation de cette partie du monde ?',
    indicateurs: Object.freeze([
      { id: 'actualite-zone', libelle: 'Actualite de la zone', fournisseur: 'gdeltGeo' },
      { id: 'seismes', libelle: 'Activite sismique', fournisseur: 'usgs' },
      { id: 'pays-de-la-zone', libelle: 'Pays couverts par la vue', fournisseur: 'restcountries' },
    ]),
  },
  pays: {
    titre: 'PAYS', sous: 'ECHELON NATIONAL',
    question: 'Quel est ce pays, et comment va-t-il ?',
    indicateurs: Object.freeze([
      { id: 'identite', libelle: 'Capitale, langues, monnaie, superficie', fournisseur: 'restcountries' },
      { id: 'population', libelle: 'Population et esperance de vie', fournisseur: 'banqueMondiale' },
      { id: 'economie', libelle: 'PIB par habitant et chomage', fournisseur: 'banqueMondiale' },
      { id: 'actualite-nationale', libelle: 'Actualite nationale', fournisseur: 'gdelt' },
    ]),
  },
  region: {
    titre: 'RÉGION', sous: 'ECHELON REGIONAL',
    question: 'Qu’est-ce qui distingue cette region de son pays ?',
    indicateurs: Object.freeze([
      { id: 'population-regionale', libelle: 'Population de la region', fournisseur: 'geoApi' },
      { id: 'economie-regionale', libelle: 'PIB regional et emploi', fournisseur: 'eurostat' },
      { id: 'meteo', libelle: 'Conditions du moment', fournisseur: 'openMeteo' },
    ]),
  },
  departement: {
    titre: 'DÉPARTEMENT', sous: 'ECHELON DEPARTEMENTAL',
    question: 'Comment ce departement est-il organise ?',
    indicateurs: Object.freeze([
      { id: 'communes', libelle: 'Communes et populations', fournisseur: 'geoApi' },
      { id: 'risques', libelle: 'Risques recenses', fournisseur: 'georisques' },
      { id: 'meteo', libelle: 'Conditions du moment', fournisseur: 'openMeteo' },
    ]),
  },
  commune: {
    titre: 'COMMUNE', sous: 'ECHELON COMMUNAL',
    question: 'Que faut-il savoir de cette commune ?',
    indicateurs: Object.freeze([
      { id: 'fiche-commune', libelle: 'Population, superficie, code INSEE', fournisseur: 'base' },
      { id: 'gouvernance', libelle: 'Municipalite et intercommunalite', fournisseur: 'base' },
      { id: 'risques-communaux', libelle: 'Risques de la commune', fournisseur: 'georisques' },
      { id: 'statistiques', libelle: 'Revenus, emploi, logement', fournisseur: 'insee' },
    ]),
  },
  quartier: {
    titre: 'QUARTIER', sous: 'ECHELON LOCAL',
    question: 'Qu’y a-t-il exactement ici ?',
    indicateurs: Object.freeze([
      { id: 'lieux', libelle: 'Equipements et commerces', fournisseur: 'wikidata' },
      { id: 'vie-locale', libelle: 'Associations, clubs, evenements', fournisseur: 'base' },
      { id: 'meteo', libelle: 'Conditions du moment', fournisseur: 'openMeteo' },
    ]),
  },
});

/** Le niveau INTEL correspondant a une hauteur de camera. */
export function niveauSelonAltitude(altitude) {
  const e = echelleSelonAltitude(altitude);
  return { cle: e.cle, ...NIVEAUX[e.cle] };
}

/**
 * Les indicateurs d'un echelon, chacun accompagne de sa provenance complete.
 * C'est cette forme-la que l'interface affiche : jamais un chiffre nu.
 *
 * @param {string} cle Echelon ('espace', 'pays', 'commune'…).
 * @returns {object[]}
 */
export function indicateursDe(cle) {
  const n = NIVEAUX[cle];
  if (!n) return [];
  return n.indicateurs.map((i) => {
    const f = FOURNISSEURS[i.fournisseur];
    return {
      ...i,
      source: f.nom,
      url: f.url,
      horsLigne: f.horsLigne,
      confiance: f.confiance,
      cleRequise: Boolean(f.cle),
      note: f.note,
    };
  });
}

/**
 * Vrai si cet echelon exige d'aller sur le reseau. Sert a prevenir
 * l'utilisateur AVANT de le laisser attendre — consigne explicite : toujours
 * dire quand une source externe est necessaire.
 * @param {string} cle
 * @returns {boolean}
 */
export function demandeLeReseau(cle) {
  return indicateursDe(cle).some((i) => !i.horsLigne);
}

/**
 * Ce que l'on sait repondre SANS reseau. Au niveau communal autour de Thau,
 * ce n'est pas vide — c'est tout l'interet d'avoir enrichi la base.
 * @param {string} cle
 * @returns {object[]}
 */
export function repondSansReseau(cle) {
  return indicateursDe(cle).filter((i) => i.horsLigne);
}

/**
 * Aucun indicateur ne doit reclamer de cle : on le verifie ici plutot que de
 * l'esperer. Renvoie la liste des fautifs, vide quand tout va bien.
 * @returns {string[]}
 */
export function indicateursAvecCle() {
  return Object.keys(NIVEAUX)
    .flatMap((c) => indicateursDe(c))
    .filter((i) => i.cleRequise)
    .map((i) => i.id);
}

/** Les echelons declares, dans l'ordre du plus large au plus fin. */
export function echelonsCouverts() {
  return ECHELONS.map((e) => e.cle);
}
