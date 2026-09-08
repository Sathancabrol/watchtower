/**
 * Sources de données du bassin de Thau — socle hors ligne et traçable.
 *
 * Objectif posé par l'utilisateur : « mettre un max de données en source pour
 * parer aux questions d'IA ou d'utilisateur ». Cette base sert deux usages :
 *
 *   1. **répondre sans réseau** — chaque fait porte sa valeur et sa source, donc
 *      une réponse reste possible même si toutes les API sont injoignables ;
 *   2. **citer systématiquement** — aucune affirmation sans origine vérifiable.
 *
 * Périmètre actuel : les 15 communes du bassin de Thau (voir `frontignan.js`).
 * Il est prévu pour s'étendre : `ajouterCommune()` accepte n'importe quelle
 * commune française sans changement de structure.
 *
 * Toutes les sources sont **publiques, gratuites et sans clé**.
 *
 * @module data/territoire/sourcesThau
 */

/**
 * Flux de transport en commun du bassin, publiés sur le Point d'Accès National
 * (`transport.data.gouv.fr`). GTFS = horaires théoriques, GTFS-RT = temps réel.
 */
export const TRANSPORTS = Object.freeze([
  Object.freeze({
    id: 'sam-mobilite', reseau: 'SAMobilité', exploitant: 'Keolis',
    autorite: 'Sète Agglopôle Méditerranée', couvre: ['34108', '34301', '34023', '34024', '34039', '34143', '34157', '34150'],
    pan: 'https://transport.data.gouv.fr/datasets?q=Sete+Agglopole',
    formats: ['GTFS'], licence: 'Licence Ouverte 2.0', cle: false,
    note: 'DSP 2022-2030. Versement mobilité 1,65 % depuis 2022.',
  }),
  Object.freeze({
    id: 'capbus', reseau: 'Cap’Bus', exploitant: 'Carpostal',
    autorite: 'CA Hérault Méditerranée', couvre: ['34003'],
    pan: 'https://transport.data.gouv.fr/datasets/gtfs-du-reseau-capbus-en-lien-avec-le-temps-reel-zenbus/',
    formats: ['GTFS', 'GTFS-RT'], licence: 'Licence Ouverte 2.0', cle: false,
    note: 'Temps réel Zenbus : positions de véhicules et mises à jour de trajets. Dessert Agde.',
  }),
  Object.freeze({
    id: 'tam-montpellier', reseau: 'TaM', exploitant: 'TaM',
    autorite: 'Montpellier Méditerranée Métropole', couvre: [],
    pan: 'https://transport.data.gouv.fr/datasets/offre-de-transport-tam-en-temps-reel-gtfs-rt-urbain-et-suburbain',
    formats: ['GTFS', 'GTFS-RT'], licence: 'Licence Ouverte 2.0', cle: false,
    note: 'Hors bassin, mais 67 % des actifs de Frontignan travaillent hors commune (bassin Montpellier/Sète).',
  }),
  Object.freeze({
    id: 'ter-occitanie', reseau: 'TER liO', exploitant: 'SNCF',
    autorite: 'Région Occitanie', couvre: ['34108', '34301', '34150', '34003'],
    pan: 'https://transport.data.gouv.fr/datasets?q=TER+Occitanie',
    formats: ['GTFS'], licence: 'Licence Ouverte 2.0', cle: false,
    note: 'Ligne Montpellier-Sète-Agde. Gare de Frontignan concernée par le PEM (25 M€).',
  }),
]);

/**
 * Jeux de données nationaux couvrant le bassin, tous téléchargeables en masse
 * (donc embarquables pour un fonctionnement hors ligne).
 */
export const JEUX_NATIONAUX = Object.freeze([
  Object.freeze({
    id: 'bnlc', nom: 'Base nationale des lieux de covoiturage',
    url: 'https://transport.data.gouv.fr/datasets/base-nationale-des-lieux-de-covoiturage',
    format: 'CSV', licence: 'ODbL', cle: false, horsLigne: true,
    fournit: ['aires de covoiturage', 'capacité', 'coordonnées'],
  }),
  Object.freeze({
    id: 'bnls', nom: 'Base nationale des lieux de stationnement',
    url: 'https://transport.data.gouv.fr/datasets/base-nationale-des-lieux-de-stationnement',
    format: 'CSV', licence: 'ODbL', cle: false, horsLigne: true,
    fournit: ['parkings hors voirie', 'capacité', 'tarification'],
  }),
  Object.freeze({
    id: 'bnzfe', nom: 'Base nationale des zones à faibles émissions',
    url: 'https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions',
    format: 'GeoJSON', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: true,
    fournit: ['périmètres ZFE', 'voies concernées'],
  }),
  Object.freeze({
    id: 'ban', nom: 'Base Adresse Nationale',
    url: 'https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/',
    format: 'CSV par département', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: true,
    fournit: ['adresses normalisées', 'géocodage'],
    note: 'Le fichier du département 34 suffit pour tout le bassin.',
  }),
  Object.freeze({
    id: 'cadastre-34', nom: 'Plan cadastral informatisé (Hérault)',
    url: 'https://cadastre.data.gouv.fr/data/etalab-cadastre/latest/geojson/communes/34/',
    format: 'GeoJSON par commune', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: true,
    fournit: ['parcelles', 'bâtiments', 'sections', 'lieux-dits'],
    note: 'Téléchargeable commune par commune : idéal pour embarquer les 15 du bassin.',
  }),
  Object.freeze({
    id: 'rna-34', nom: 'Répertoire National des Associations',
    url: 'https://www.data.gouv.fr/datasets/repertoire-national-des-associations',
    format: 'ZIP mensuel', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: true,
    fournit: ['associations loi 1901', 'objet social', 'siège', 'date de création'],
    note: 'Filtrable par code commune. Frontignan subventionne 100+ associations (508 150 € en 2025).',
  }),
  Object.freeze({
    id: 'sirene-etab', nom: 'SIRENE — établissements géolocalisés',
    url: 'https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret',
    format: 'CSV', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: true,
    fournit: ['SIRET', 'code NAF', 'effectifs', 'adresse', 'nature juridique'],
    note: 'La nature juridique 92xx isole les associations ; 9220 = association déclarée.',
  }),
  Object.freeze({
    id: 'georisques-34', nom: 'Géorisques — risques par commune',
    url: 'https://www.georisques.gouv.fr/',
    format: 'API + export', licence: 'Licence Ouverte 2.0', cle: false, horsLigne: false,
    fournit: ['PPRI', 'PPRT', 'Seveso', 'submersion marine', 'retrait-gonflement'],
    note: 'Frontignan : 2 sites Seveso seuil haut, 1ʳᵉ commune du bassin exposée à la submersion.',
  }),
  Object.freeze({
    id: 'hubeau', nom: 'Hub’Eau — qualité des eaux',
    url: 'https://hubeau.eaufrance.fr/', format: 'API REST',
    licence: 'Licence Ouverte 2.0', cle: false, horsLigne: false,
    fournit: ['qualité des eaux de baignade', 'hydrométrie', 'piézométrie', 'poissons'],
    note: 'Enjeu majeur du bassin : la qualité de l’eau de l’étang conditionne la conchyliculture.',
  }),
  Object.freeze({
    id: 'panoramax', nom: 'Panoramax — photos de rue libres',
    url: 'https://api.panoramax.xyz/api/search', format: 'STAC',
    licence: 'CC-BY-SA', cle: false, horsLigne: false,
    fournit: ['photos de rue géolocalisées'],
    note: 'Alternative libre à Street View (IGN / OSM France). Déjà branchée dans ce fork.',
  }),
]);

/**
 * Sources maritimes libres — le bassin de Thau est un territoire d'eau.
 *
 * ⚠️ Point de vérité : **il n'existe pas de flux AIS mondial libre et sans clé.**
 * Les réseaux ouverts sont régionaux (Norvège, Finlande, Danemark) et ne
 * couvrent pas la Méditerranée. Ne pas laisser croire le contraire.
 */
export const MARITIME = Object.freeze([
  Object.freeze({
    id: 'openwaters', nom: 'aiscast (Open Waters)', url: 'https://ais.openwaters.io/v1/stream',
    licence: 'code MIT, données selon la source', cle: false, couvreMediterranee: false,
    note: 'Réseau AIS ouvert par WebSocket, sans jeton en anonyme (2 connexions/IP, zone ~10°×10°). '
      + 'Agrège Kystverket, BarentsWatch, Fintraffic et des récepteurs bénévoles — donc surtout '
      + 'Europe du Nord. Compatible avec les clients aisstream.',
  }),
  Object.freeze({
    id: 'kystverket', nom: 'Kystverket (Norvège)', url: 'https://ais-public.kystverket.no/',
    licence: 'NLOD 2.0', cle: false, couvreMediterranee: false,
    note: 'Flux AIS ouvert et sans inscription, mais limité à la zone économique norvégienne.',
  }),
  Object.freeze({
    id: 'aisstream', nom: 'aisstream.io', url: 'https://aisstream.io',
    licence: 'non publiée', cle: true, couvreMediterranee: true,
    note: 'Mondial, clé gratuite sur inscription. C’est la voie retenue pour voir les navires '
      + 'de Sète : la couche reste désactivée proprement tant qu’aucune clé n’est fournie.',
  }),
]);

/**
 * Retourne les réseaux de transport desservant une commune.
 * @param {string} insee - Code INSEE.
 * @returns {Array<object>} Réseaux concernés.
 */
export function transportsDe(insee) {
  return TRANSPORTS.filter((t) => t.couvre.includes(insee));
}

/**
 * Jeux de données utilisables sans réseau.
 * @returns {Array<object>} Jeux téléchargeables en masse.
 */
export function jeuxEmbarquables() {
  return JEUX_NATIONAUX.filter((j) => j.horsLigne && !j.cle);
}

/**
 * Sources maritimes réellement exploitables en Méditerranée.
 * @param {{sansCle?:boolean}} [options] - Filtre.
 * @returns {Array<object>} Sources couvrant la Méditerranée.
 */
export function maritimeMediterranee({ sansCle = false } = {}) {
  return MARITIME.filter((m) => m.couvreMediterranee && (!sansCle || !m.cle));
}

/**
 * Toutes les sources, à plat, pour un inventaire ou une recherche.
 * @returns {Array<object>} Inventaire complet avec sa catégorie.
 */
export function inventaire() {
  return [
    ...TRANSPORTS.map((s) => ({ ...s, categorie: 'transport' })),
    ...JEUX_NATIONAUX.map((s) => ({ ...s, categorie: 'national' })),
    ...MARITIME.map((s) => ({ ...s, categorie: 'maritime' })),
  ];
}
