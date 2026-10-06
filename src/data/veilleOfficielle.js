/**
 * WATCHTOWER — VEILLE OFFICIELLE (registre des sources publiques à brancher).
 *
 * La vue INTEL ne vaut que par ses sources. Ce registre est la liste de
 * COURSES officielle : chaque entrée dit ce que la source contient, à quelle
 * cadence elle bouge, sous quelle licence, et si elle est déjà utilisée ou
 * seulement identifiée. Aucune entrée n'est inventée : soit elle vient du
 * dossier territorial (annexe A, consultée le 08/09/2026 par son auteur), soit
 * elle a été vérifiée en ligne à la date portée dans `verifieLe`.
 *
 * Règle de la maison : une source sans date de vérification n'existe pas.
 */

/** Familles de veille — les axes de l'enrichissement. */
export const FAMILLES_VEILLE = Object.freeze({
  population: { nom: 'POPULATION & SOCIÉTÉ', ic: '👥' },
  urbanisme: { nom: 'URBANISME & FONCIER', ic: '📐' },
  risques: { nom: 'RISQUES & CLIMAT', ic: '⚠️' },
  entreprises: { nom: 'ENTREPRISES', ic: '💼' },
  marches: { nom: 'MARCHÉS PUBLICS', ic: '📄' },
  mobilite: { nom: 'MOBILITÉ', ic: '🚆' },
  environnement: { nom: 'ENVIRONNEMENT', ic: '🌿' },
  chantier: { nom: 'CHANTIER & RÉSEAUX', ic: '🚧' },
  local: { nom: 'SOURCES LOCALES', ic: '🏛' },
  presse: { nom: 'PRESSE & ACTUALITÉ', ic: '📰' },
});

/**
 * Les sources publiques utiles à l'INTEL.
 * `etat` : « cité » = déjà dans la base de données Watchtower ;
 *          « identifie » = repéré, reste à brancher (URL et paramètres notés) ;
 *          « humain » = consultation manuelle (pas d'API ou pas de licence ouverte).
 */
export const SOURCES_VEILLE = Object.freeze([
  // ── population ─────────────────────────────────────────────────────────
  {
    id: 'insee-dossier-complet',
    nom: 'INSEE — Dossier complet d’une commune',
    famille: 'population',
    url: 'https://www.insee.fr/fr/statistiques/2011101?geo=COM-34108',
    api: null,
    donnees: '≈ 700 indicateurs par commune (population, ménages, logement, diplômes, emploi, revenus), sur 4 recensements',
    cadence: 'mise à jour annuelle (populations légales en décembre, dossier complet au fil de l’eau)',
    licence: 'Licence Ouverte (données INSEE publiques)',
    etat: 'cité',
    usage: 'Fiche COMMUNAL de l’INTEL : socle de tous les chiffres de population et de société.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'insee-base-dossier-complet',
    nom: 'INSEE — Base du dossier complet (fichier national)',
    famille: 'population',
    url: 'https://www.insee.fr/fr/statistiques/5359146',
    api: null,
    donnees: 'Le même contenu que le dossier complet, en CSV/parquet, tous niveaux géographiques (commune, EPCI, IRIS via bases dédiées)',
    cadence: 'plusieurs éditions par an',
    licence: 'Licence Ouverte',
    etat: 'identifie',
    usage: 'Charger d’un coup les 14 communes de l’agglo sans requêter page par page.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'insee-donnees-locales',
    nom: 'INSEE — Données locales (portail)',
    famille: 'population',
    url: 'https://www.insee.fr/fr/information/3544265',
    api: null,
    donnees: 'Point d’entrée : dossier complet, bases téléchargeables, IRIS, carreaux, QPV, Filosofi, Flores',
    cadence: 'au fil de l’eau',
    licence: 'Licence Ouverte',
    etat: 'identifie',
    usage: 'Trouver en un endroit la bonne base selon le niveau (commune, quartier, agglo).',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },

  // ── urbanisme & foncier ────────────────────────────────────────────────
  {
    id: 'gpu-api',
    nom: 'Géoportail de l’urbanisme — API et WFS',
    famille: 'urbanisme',
    url: 'https://www.geoportail-urbanisme.gouv.fr/api/',
    api: 'https://wxs-gpu.mongeoportail.ign.fr/externe/{cle}/wfs',
    donnees: 'Documents d’urbanisme opposables (PLU, PLUi, POS, cartes communales, SCoT, PSMV) et servitudes d’utilité publique ; zonage interrogeable par parcelle',
    cadence: 'dépôt continu par les collectivités (mise à jour du PLU de Frontignan attendue avec le SCoT)',
    licence: 'Licence Ouverte',
    etat: 'identifie',
    usage: 'Croiser un projet avec le zonage réel du PLU + les SUP (PPRI, PPRT, canalisations Seveso).',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'apicarto',
    nom: 'API Carto (IGN) — cadastre, urbanisme, nature',
    famille: 'urbanisme',
    url: 'https://apicarto.ign.fr/api/doc/',
    api: 'https://apicarto.ign.fr/api/cadastre | /api/gpu | /api/nature',
    donnees: 'Parcelles cadastrales, zonage d’urbanisme par parcelle, servitudes, ZNIEFF et Natura 2000 par géométrie',
    cadence: 'temps réel (interrogation à la demande)',
    licence: 'Licence Ouverte / Etalab 2.0',
    etat: 'cité',
    usage: 'Base du niveau INDIVIDUEL : la parcelle et sa règle d’urbanisme.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'dvf',
    nom: 'DVF — Demandes de valeurs foncières',
    famille: 'urbanisme',
    url: 'https://app.dvf.etalab.gouv.fr',
    api: null,
    donnees: 'Transactions immobilières géolocalisées (5 dernières années et plus) : prix, surface, date, nature',
    cadence: 'mise à jour semestrielle',
    licence: 'Licence Ouverte',
    etat: 'identifie',
    usage: 'Vérifier un prix de référence au m² quartier par quartier (et repérer la spéculation sur le littoral).',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },

  // ── risques & climat ───────────────────────────────────────────────────
  {
    id: 'georisques-api',
    nom: 'Géorisques — API v1 (BRGM/Ministère)',
    famille: 'risques',
    url: 'https://www.data.gouv.fr/dataservices/api-georisques',
    api: 'https://georisques.gouv.fr/api/v1/',
    donnees: 'Risques naturels et technologiques par commune ou par point : inondation, submersion, séisme, radon, cavités, pollution des sols, ICPE, canalisations, CatNat',
    cadence: 'temps réel ; limite 1 000 requêtes/min par IP',
    licence: 'Licence Ouverte',
    etat: 'cité',
    usage: 'Le bloc RISQUES de la fiche communale et de la fiche parcelle (déjà branché via empreinte.js).',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'ppri-ddtm34',
    nom: 'DDTM 34 — Règlement PPRI du bassin de Thau',
    famille: 'risques',
    url: 'https://www.herault.gouv.fr/Politiques-publiques/Risques-naturels-et-technologiques/Prevention-des-risques-naturels/PPRI-de-l-Herault',
    api: null,
    donnees: 'Règlement et zonage du PPRI (PHE retenue 2,00 m), prescriptions par zone, PPRT des sites Seveso (GDH, SCORI, Hexis)',
    cadence: 'révision par enquête publique',
    licence: 'Documents administratifs publics',
    etat: 'identifie',
    usage: 'Dire ce qui est permis à quelle cote dans une zone exposée — le cœur des projets de recomposition du littoral.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
  {
    id: 'mrae-occitanie',
    nom: 'MRAe Occitanie — avis environnementaux',
    famille: 'risques',
    url: 'https://www.mrae.developpement-durable.gouv.fr/IMG/pdf/2025ao18.pdf',
    api: null,
    donnees: 'Avis n° 2025AO18 du 20/02/2025 sur la révision du SCoT du bassin de Thau (ressource en eau, changement climatique, ruissellement)',
    cadence: 'un avis par dossier soumis',
    licence: 'Document public',
    etat: 'cité',
    usage: 'La pièce à lire avant de croire un scénario de développement : elle dit ce que le document d’urbanisme ne démontre pas.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'cerema-trait-de-cote',
    nom: 'Cerema — Indicateur national trait de côte & zones basses',
    famille: 'risques',
    url: 'https://www.cerema.fr/fr/actualites/evaluation-enjeux-exposes-au-recul-du-trait-cote-court-moyen',
    api: null,
    donnees: 'Érosion côtière (~20 % des côtes en recul) ; cartographie nationale des zones basses sur Géolittoral ; horizons 2050 et 2100',
    cadence: 'mise à jour dans le cadre du PNACC 3',
    licence: 'Licence Ouverte',
    etat: 'identifie',
    usage: 'Asseoir les cartes 30/100 ans annoncées par le PPA de recomposition spatiale.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },

  // ── entreprises ────────────────────────────────────────────────────────
  {
    id: 'recherche-entreprises',
    nom: 'API Recherche d’entreprises (DINUM)',
    famille: 'entreprises',
    url: 'https://annuaire-entreprises.data.gouv.fr/donnees/api-entreprises',
    api: 'https://recherche-entreprises.api.gouv.fr',
    donnees: 'Dénomination, SIREN/SIRET, code NAF, adresse, état administratif, dirigeants, effectif, ratios financiers ; recherche textuelle OU géographique (rayon)',
    cadence: 'plusieurs fois par jour (RNE + Sirene)',
    licence: 'Licence Ouverte',
    etat: 'cité',
    usage: 'Le niveau ÉCONOMIQUE : qui travaille autour du point, par rayon, sans clé d’API.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'bodacc',
    nom: 'BODACC — annonces civiles et commerciales (DILA)',
    famille: 'entreprises',
    url: 'https://www.bodacc.fr/',
    api: 'https://boamp-datadila.opendatasoft.com/api/explore/v2.0/catalog/datasets',
    donnees: 'Immatriculations, radiations, ventes et cessions, procédures collectives, dépôts de comptes',
    cadence: 'quotidienne',
    licence: 'Licence Ouverte 2.0',
    etat: 'cité',
    usage: 'Voir une entreprise qui se crée ou tombe — six mois avant que ça se voie dans le paysage.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },

  // ── marchés publics ────────────────────────────────────────────────────
  {
    id: 'boamp-api',
    nom: 'BOAMP — Bulletin officiel des annonces de marchés publics (API)',
    famille: 'marches',
    url: 'https://www.data.gouv.fr/dataservices/api-bulletin-officiel-des-annonces-des-marches-publics-boamp',
    api: 'https://boamp-datadila.opendatasoft.com/api/explore/v2.0',
    donnees: 'Avis d’appel public à la concurrence et avis d’attribution (État, collectivités) ; filtrables par acheteur, lieu, mots-clés',
    cadence: 'publication 2 fois par jour, 7 j/7',
    licence: 'Licence Ouverte 2.0',
    etat: 'identifie',
    usage: 'Alimenter la fiche CHANTIER dès l’annonce : c’est là qu’un chantier public devient visible.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'decp',
    nom: 'DECP — Données essentielles de la commande publique',
    famille: 'marches',
    url: 'https://www.data.gouv.fr/datasets/api-decp',
    api: 'https://www.data.economie.gouv.fr/explore/dataset/decp-2022-marches-valides/api/',
    donnees: 'Marchés attribués : montant, titulaire, acheteur, procédure, durée — obligatoires pour tout marché (> 40 k€)',
    cadence: 'flux continu (dépôt des acheteurs)',
    licence: 'Licence Ouverte 2.0',
    etat: 'identifie',
    usage: 'Compléter l’entreprise et le montant sur la fiche chantier, même quand l’avis BOAMP a disparu.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },

  // ── mobilité ───────────────────────────────────────────────────────────
  {
    id: 'sncf-liO',
    nom: 'Région Occitanie — liO Train (données voyageurs)',
    famille: 'mobilite',
    url: 'https://www.laregion.fr/liO-Train',
    api: null,
    donnees: 'Fréquentation des gares, dessertes, travaux du Plan Littoral 21 et du SERM ; la fréquentation de la gare de Frontignan reste un angle mort (annexe B du dossier)',
    cadence: 'au fil des publications régionales',
    licence: 'Données publiques (à confirmer pour l’API)',
    etat: 'humain',
    usage: 'Mesurer la promesse du PEM : une gare livrée mais pas desservie ne vaut rien.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },

  // ── environnement ──────────────────────────────────────────────────────
  {
    id: 'inpn',
    nom: 'INPN — Inventaire national du patrimoine naturel',
    famille: 'environnement',
    url: 'https://inpn.mnhn.fr/accueil/index',
    api: 'https://apicarto.ign.fr/api/nature (relais IGN)',
    donnees: 'Natura 2000, ZNIEFF 1 et 2, espaces protégés, espèces et habitats, sites géologiques',
    cadence: 'mises à jour continues',
    licence: 'Licence Ouverte (certaines données sensibles masquées)',
    etat: 'identifie',
    usage: 'Le compteur environnemental de la fiche parcelle : 4 sites Natura 2000 et 10 ZNIEFF à Frontignan.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },

  // ── chantier & réseaux ─────────────────────────────────────────────────
  {
    id: 'reseaux-canalisations',
    nom: 'Guichet unique des réseaux (INERIS) — DT/DICT',
    famille: 'chantier',
    url: 'https://www.reseaux-et-canalisations.gouv.fr/',
    api: null,
    donnees: 'Déclaration de projet de travaux (DT) et déclaration d’intention de commencement de travaux (DICT), récépissés, exploitants de réseaux, zones d’implantation',
    cadence: 'temps réel (guichet) ; DT à déposer 3 mois avant le début des travaux',
    licence: 'Service public gratuit (compte obligatoire)',
    etat: 'identifie',
    usage: 'Pièce n°1 de la fiche chantier : sans DT/DICT, aucune fouille n’est couverte.',
    verifieLe: '2026-10-07',
    verifiePar: 'agent',
  },
  {
    id: 'pappers-societe',
    nom: 'Pappers / société.com — comptes et dirigeants',
    famille: 'entreprises',
    url: 'https://www.pappers.fr/',
    api: null,
    donnees: 'Comptes déposés, dirigeants, effectifs, procédures collectives consolidés',
    cadence: 'quotidienne',
    licence: 'Réutilisation de données publiques (conditions propres au site)',
    etat: 'cité',
    usage: 'Vérification humaine d’une entreprise candidate à un marché local.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },

  // ── sources locales ────────────────────────────────────────────────────
  {
    id: 'frontignan-site',
    nom: 'Ville de Frontignan la Peyrade — site officiel',
    famille: 'local',
    url: 'https://www.frontignan.fr/',
    api: null,
    donnees: 'Délibérations, budgets, PLU, concertations, projets (Cœur de Ville, Mas de Chave, port), PCS, journal municipal FLP Mag',
    cadence: 'plusieurs publications par mois',
    licence: 'Documents administratifs publics',
    etat: 'cité',
    usage: 'La source primaire pour tout ce qui concerne la commune — et le point de départ de chaque chiffre du dossier territorial.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
  {
    id: 'agglopole',
    nom: 'Sète Agglopôle Méditerranée — site officiel',
    famille: 'local',
    url: 'https://www.agglopole.fr/',
    api: null,
    donnees: 'Compétences, budget (242 M€ en 2026 dont 68 M€ d’investissement), GEMAPI et bassins de rétention, PPA de recomposition spatiale, ZAE du Barnier, centre aquatique des Hiérles',
    cadence: 'plusieurs publications par mois',
    licence: 'Documents administratifs publics',
    etat: 'cité',
    usage: 'Distinguer ce qui est communal de ce qui est intercommunal — la confusion la plus fréquente du dossier.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
  {
    id: 'smbt',
    nom: 'SMBT — Syndicat mixte du bassin de Thau',
    famille: 'local',
    url: 'https://www.smbt.fr/',
    api: null,
    donnees: 'SCoT du bassin de Thau, qualité de l’eau, Natura 2000, gestion intégrée du littoral',
    cadence: 'au rythme du SCoT et des suivis de lagune',
    licence: 'Documents administratifs publics',
    etat: 'cité',
    usage: 'Le niveau « bassin » : c’est là que se décident la ressource en eau et le SCoT qui contraint le PLU.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
  {
    id: 'thau-infos',
    nom: 'Thau Infos — comptes rendus de conseils',
    famille: 'presse',
    url: 'https://thau-infos.fr/',
    api: null,
    donnees: 'Comptes rendus détaillés des conseils municipaux et communautaires (délibérations, montants, votes)',
    cadence: 'après chaque séance',
    licence: 'Presse (citation avec lien)',
    etat: 'cité',
    usage: 'Reconstituer un budget ligne à ligne quand le site officiel ne publie que la synthèse.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },

  // ── presse & actualité ─────────────────────────────────────────────────
  {
    id: 'gdelt',
    nom: 'GDELT — flux de presse mondial (filtrable en français)',
    famille: 'presse',
    url: 'https://api.gdeltproject.org/api/v2/doc/doc',
    api: 'https://api.gdeltproject.org/api/v2/doc/doc?query=…&mode=artlist&format=json',
    donnees: 'Derniers articles de presse mentionnant un terme, filtrables par langue et par fenêtre de temps',
    cadence: 'toutes les 15 minutes',
    licence: 'Open (GDELT Project)',
    etat: 'cité',
    usage: 'Le fil défilant de l’INTEL : ce qui se dit du territoire dans les dernières heures.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
  {
    id: 'midi-libre',
    nom: 'Midi Libre — édition de Sète et du bassin de Thau',
    famille: 'presse',
    url: 'https://www.midilibre.fr/',
    api: null,
    donnees: 'Actualité locale : chantiers, budgets, conflits, événements, faits divers industriels',
    cadence: 'quotidienne',
    licence: 'Presse (citation avec lien, pas de republication)',
    etat: 'cité',
    usage: 'Source principale de l’actualité du dossier territorial ; à recouper systématiquement avec les documents officiels.',
    verifieLe: '2026-09-08',
    verifiePar: 'annexe A du dossier territorial',
  },
]);

/** Les sources d'une famille (ou toutes). */
export function veilleDeFamille(famille) {
  return famille ? SOURCES_VEILLE.filter((s) => s.famille === famille) : [...SOURCES_VEILLE];
}

/** Les sources selon leur état : « cité », « identifie », « humain ». */
export function veilleParEtat(etat) {
  return etat ? SOURCES_VEILLE.filter((s) => s.etat === etat) : [...SOURCES_VEILLE];
}

/** Les sources qui portent une API exploitable directement. */
export function veilleAvecApi() {
  return SOURCES_VEILLE.filter((s) => Boolean(s.api));
}

/** Ce qui reste à brancher — la liste de travail, avec son pourquoi. */
export function veilleABrancher() {
  return SOURCES_VEILLE.filter((s) => s.etat === 'identifie').map((s) => ({
    id: s.id,
    nom: s.nom,
    famille: s.famille,
    api: s.api,
    usage: s.usage,
    verifieLe: s.verifieLe,
  }));
}

/** Ce que la veille contient, par famille et par état. */
export function statistiquesVeille() {
  const parFamille = {};
  const parEtat = {};
  for (const s of SOURCES_VEILLE) {
    parFamille[s.famille] = (parFamille[s.famille] || 0) + 1;
    parEtat[s.etat] = (parEtat[s.etat] || 0) + 1;
  }
  return {
    total: SOURCES_VEILLE.length,
    parFamille,
    parEtat,
    avecApi: veilleAvecApi().length,
    familles: Object.keys(FAMILLES_VEILLE).length,
    verifiees: SOURCES_VEILLE.filter((s) => s.verifieLe).length,
  };
}

/** Contrôle : une source sans URL, sans date ou sans usage ne passe pas. */
export function verifierVeille() {
  const problemes = [];
  const ids = new Set();
  for (const s of SOURCES_VEILLE) {
    if (ids.has(s.id)) problemes.push('identifiant en double : ' + s.id);
    ids.add(s.id);
    if (!/^https:\/\//.test(s.url || '')) problemes.push(s.id + ' : URL manquante ou non HTTPS');
    if (!FAMILLES_VEILLE[s.famille]) problemes.push(s.id + ' : famille inconnue ' + s.famille);
    if (!s.verifieLe) problemes.push(s.id + ' : sans date de vérification');
    if (!s.usage) problemes.push(s.id + ' : sans usage décrit');
    if (s.api && !/^https:\/\//.test(s.api.split(' ')[0])) problemes.push(s.id + ' : API mal formée');
  }
  return { ok: problemes.length === 0, problemes, controle: SOURCES_VEILLE.length };
}
