/**
 * Frontignan la Peyrade — points d'accès du territoire, tous modes.
 *
 * Destiné à la vue INTEL : « par où entre-t-on, et sous quelle contrainte ».
 * Une donnée d'accès n'a de valeur que si elle est à jour — un horaire périmé
 * est pire que pas d'horaire, parce qu'on s'y fie.
 *
 * PIÈGE DOCUMENTÉ — le pont mobile. La page « Frontignan en bref » du site de
 * la Ville annonce encore des levées à **8h30 et 16h**. Ces horaires datent
 * d'avant la réparation de l'ouvrage (remis en service le 11/12/2025) : la
 * première levée est désormais à **9h30**, l'été compte une troisième levée,
 * et l'hiver la levée unique se fait **uniquement sur rendez-vous**. Les
 * horaires retenus ici sont ceux de la page « Halte plaisance » et du
 * communiqué VNF/Ville de décembre 2025.
 *
 * La commune s'organise en **trois pôles** distincts, ce qui explique la
 * dispersion des accès : Frontignan ville (noyau médiéval), La Peyrade (née du
 * canal) et Frontignan plage (sur le lido de 7 km).
 *
 * Fonctions pures : aucun accès réseau ni DOM.
 * @module data/territoire/accesTerritoire
 */

/** Les trois pôles urbains de la commune. */
export const POLES = Object.freeze(['Frontignan ville', 'La Peyrade', 'Frontignan plage']);

/** Accès routiers et ferroviaires. */
export const ACCES_TERRE = Object.freeze([
  Object.freeze({
    mode: 'autoroute', libelle: 'A9 « La Languedocienne »', detail: 'Sortie 33 Sète',
    minutes: 10, fiable: true,
  }),
  Object.freeze({
    mode: 'autoroute', libelle: 'A75', detail: 'Sortie 59 Sète / Pézenas',
    minutes: 15, fiable: false,
    note: 'Temps d\u2019accès non confirmé par une source officielle.',
  }),
  Object.freeze({
    mode: 'route', libelle: 'D612', detail: 'Axe principal, vers Sète ou Montpellier',
    minutes: null, fiable: true,
  }),
  Object.freeze({
    mode: 'train', libelle: 'Gare SNCF de Frontignan', detail: 'Ligne Montpellier – Sète',
    minutes: 15, fiable: true,
    note: 'Desserte TER. Objet du futur pôle d\u2019échanges multimodal (PEM), horizon 2028.',
  }),
  Object.freeze({
    mode: 'bus', libelle: 'Hérault Transport', detail: 'Ligne 102 (Sète – Montpellier)',
    minutes: null, fiable: false,
    note: 'Numéro de ligne non revérifié : le réseau régional a été réorganisé.',
  }),
]);

/** Aéroports desservant le territoire, du plus proche au plus lointain. */
export const ACCES_AIR = Object.freeze([
  Object.freeze({ nom: 'Montpellier Méditerranée', iata: 'MPL', km: 30, fiable: true }),
  Object.freeze({ nom: 'Béziers Cap d\u2019Agde', iata: 'BZR', km: 50, fiable: true }),
  Object.freeze({ nom: 'Marseille Provence', iata: 'MRS', km: 160, fiable: false }),
  Object.freeze({ nom: 'Toulouse-Blagnac', iata: 'TLS', km: 240, fiable: false }),
  Object.freeze({ nom: 'Barcelone-El Prat', iata: 'BCN', km: 280, fiable: false,
    note: 'Espagne. Distances des trois derniers non sourcées officiellement.' }),
]);

/**
 * Accès par la mer : le port de plaisance maritime.
 * Les contraintes nautiques conditionnent l'entrée, elles ne sont pas décoratives.
 */
export const ACCES_MER = Object.freeze({
  nom: 'Port de plaisance de Frontignan',
  ouvertToutelAnnee: true,
  orientationPasse: 'sud-ouest',
  tirantEauM: 2.5,
  deconseille: 'Entrée déconseillée par grand vent de sud-est force 7 à 8, à cause des rouleaux.',
  source: 'https://www.frontignan.fr/ma-ville/frontignan-peyrade-bref/',
  autresPorts: Object.freeze([
    Object.freeze({ nom: 'Port de pêche « petits métiers »', pole: 'La Peyrade' }),
    Object.freeze({ nom: 'Port mytilicole', pole: 'Étang de Thau', note: 'Mas à moules.' }),
  ]),
});

/**
 * Accès fluvial : la halte plaisance du quai Voltaire, sur le canal du Rhône à
 * Sète, et son pont mobile — le point de passage contraint du territoire.
 *
 * Plus de 4 000 bateaux franchissent le pont chaque année. L'amarrage est
 * **gratuit** (30 postes) ; seuls l'eau et l'électricité sont payants.
 * Escales limitées à 72 heures consécutives.
 */
export const ACCES_FLUVIAL = Object.freeze({
  nom: 'Halte plaisance du quai Voltaire',
  voie: 'Canal du Rhône à Sète',
  exploitant: 'Voies navigables de France (VNF)',
  postesAmarrage: 30,
  amarrageGratuit: true,
  escaleMaxHeures: 72,
  bateauxParAn: 4000,
  tirantAirM: 5.15,
  mouillageM: 2.20,
  contactHalte: '06 79 73 23 05',
  contactPontHorsSaison: '06 87 74 18 16',
  source: 'https://www.frontignan.fr/ma-ville/tourisme/halte-plaisance/',
  sourceHoraires: 'https://www.midilibre.fr/2025/12/11/pont-mobile-repare-retour-a-la-normale-pour-les-plaisanciers-et-les-usagers-de-frontignan-13104241.php',
  /**
   * Levées du pont mobile, par saison. Week-ends et jours fériés compris.
   * `surRendezVous` impose une réservation préalable : sans elle, pas de levée.
   */
  levees: Object.freeze([
    Object.freeze({
      periode: 'du 1ᵉʳ avril au 30 juin et du 1ᵉʳ septembre au 10 novembre',
      debutMois: 4, finMois: 6, heures: Object.freeze(['09:30', '16:00']), surRendezVous: false,
    }),
    Object.freeze({
      periode: 'du 1ᵉʳ juillet au 31 août',
      debutMois: 7, finMois: 8, heures: Object.freeze(['09:30', '13:00', '16:30']), surRendezVous: false,
      note: 'Troisième levée estivale.',
    }),
    Object.freeze({
      periode: 'du 11 novembre au 31 mars',
      debutMois: 11, finMois: 3, heures: Object.freeze(['16:00']), surRendezVous: true,
      note: 'UNIQUEMENT sur rendez-vous, par téléphone ou SMS au 06 87 74 18 16.',
    }),
  ]),
});

/** Horaires périmés qui circulent encore. Sert de garde-fou, pas de donnée. */
export const LEVEES_PERIMEES = Object.freeze(['08:30']);

/**
 * Levées du pont applicables à un mois donné.
 * @param {number} mois - Mois sur 1-12.
 * @returns {{periode:string,heures:ReadonlyArray<string>,surRendezVous:boolean}|null} Régime applicable.
 */
export function leveesPourMois(mois) {
  const m = Number(mois);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (m === 7 || m === 8) return ACCES_FLUVIAL.levees[1];
  if (m >= 4 && m <= 10) return ACCES_FLUVIAL.levees[0];
  return ACCES_FLUVIAL.levees[2];
}

/**
 * Points d'accès dont la donnée n'est pas confirmée — à afficher avec réserve.
 * @returns {Array<object>} Entrées terre et air marquées non fiables.
 */
export function accesAVerifier() {
  return [...ACCES_TERRE, ...ACCES_AIR].filter((a) => a.fiable === false);
}
