/**
 * Catalogue des sources publiques officielles de l'État français.
 *
 * Objectif : que watchtower sache **où** chercher une donnée territoriale, et
 * surtout qu'il puisse fonctionner **hors ligne ou sans clé d'API**.
 *
 * Chaque entrée précise :
 *   - `cle` : accès sans authentification ?
 *   - `horsLigne` : le jeu est-il téléchargeable en masse (donc embarquable) ?
 *   - `licence` : conditions de réutilisation.
 *
 * Toutes les URL ont été vérifiées le 08/09/2026. Aucune n'exige de compte
 * payant : c'est le critère d'entrée dans ce catalogue.
 *
 * @module data/territoire/sourcesOfficielles
 */

/** Licence Ouverte v2.0 (Etalab) — réutilisation libre avec attribution. */
export const LICENCE_OUVERTE = 'Licence Ouverte 2.0 (Etalab)';

/**
 * Sources officielles, classées par domaine.
 * @type {Readonly<Array<object>>}
 */
export const SOURCES_OFFICIELLES = Object.freeze([
  {
    id: 'geo-api', domaine: 'referentiel', nom: 'API Géo (découpage administratif)',
    editeur: 'DINUM / Etalab', url: 'https://geo.api.gouv.fr/communes',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['code INSEE', 'population légale', 'centre', 'surface', 'EPCI', 'codes postaux'],
    note: 'Source de vérité du référentiel communal. Utilisée pour valider COMMUNES_THAU.',
  },
  {
    id: 'insee-comparateur', domaine: 'statistiques', nom: 'INSEE — comparateur de territoires',
    editeur: 'INSEE', url: 'https://www.insee.fr/fr/statistiques/1405599',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['population', 'ménages', 'logement', 'niveau de vie', 'taux de pauvreté'],
  },
  {
    id: 'insee-dossier', domaine: 'statistiques', nom: 'INSEE — dossier complet',
    editeur: 'INSEE', url: 'https://www.insee.fr/fr/statistiques/2011101',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['CSP', 'diplômes', 'emploi', 'familles', 'mobilités domicile-travail'],
  },
  {
    id: 'sirene', domaine: 'economie', nom: 'Recherche d’entreprises (SIRENE)',
    editeur: 'DINUM', url: 'https://recherche-entreprises.api.gouv.fr/search',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['SIREN/SIRET', 'code NAF', 'tranche d’effectifs', 'nature juridique', 'adresse'],
    note: 'Déjà appelée dans src/chatConsole.js. La nature juridique 92xx isole les associations.',
  },
  {
    id: 'rna', domaine: 'associations', nom: 'Répertoire National des Associations (RNA)',
    editeur: 'Ministère de l’Intérieur', url: 'https://www.data.gouv.fr/datasets/repertoire-national-des-associations',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['numéro RNA', 'objet social', 'date de création', 'siège', 'dissolution'],
    note: 'Export mensuel (waldec ~94 Mo zip, import ~390 Mo). Exclut Moselle, Bas-Rhin, Haut-Rhin.',
  },
  {
    id: 'comptes-collectivites', domaine: 'finances', nom: 'Comptes individuels des collectivités',
    editeur: 'DGFiP / data.economie.gouv.fr', url: 'https://data.economie.gouv.fr/explore/dataset/comptes-individuels-des-collectivites',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['budget', 'dette', 'épargne', 'fiscalité', 'ratios de strate'],
    note: 'Source primaire pour tout chiffre budgétaire : prime sur la presse.',
  },
  {
    id: 'ign-wmts', domaine: 'cartographie', nom: 'IGN Géoplateforme — WMTS',
    editeur: 'IGN', url: 'https://data.geopf.fr/wmts',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['plan IGN', 'orthophotos', 'ortho 1950-1965', 'cartes topographiques', 'cadastre'],
    note: 'Déjà branché : 5 couches dans src/displayOptions.js.',
  },
  {
    id: 'ign-wfs', domaine: 'cartographie', nom: 'IGN Géoplateforme — WFS',
    editeur: 'IGN', url: 'https://data.geopf.fr/wfs/ows',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['BD TOPO', 'Parcellaire Express (PCI)', 'limites administratives'],
    note: 'NON branché. C’est la source du tracé cadastral animé du chantier E.',
  },
  {
    id: 'cadastre-etalab', domaine: 'cartographie', nom: 'Plan cadastral informatisé (Etalab)',
    editeur: 'DGFiP / Etalab', url: 'https://cadastre.data.gouv.fr/datasets/plan-cadastral-informatise',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['parcelles', 'bâtiments', 'sections'],
    note: 'Téléchargeable par commune en GeoJSON : idéal pour le mode hors ligne.',
  },
  {
    id: 'georisques', domaine: 'risques', nom: 'Géorisques',
    editeur: 'BRGM / MTE', url: 'https://www.georisques.gouv.fr/',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: false,
    fournit: ['PPRI', 'PPRT', 'Seveso', 'retrait-gonflement', 'submersion marine'],
  },
  {
    id: 'base-adresse', domaine: 'referentiel', nom: 'Base Adresse Nationale',
    editeur: 'DINUM / IGN', url: 'https://api-adresse.data.gouv.fr/search/',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['géocodage', 'adresses normalisées'],
  },
  {
    id: 'annuaire-sp', domaine: 'services', nom: 'Annuaire de l’administration',
    editeur: 'DILA', url: 'https://api-lannuaire.service-public.fr/',
    licence: LICENCE_OUVERTE, cle: false, horsLigne: true,
    fournit: ['mairies', 'services publics', 'horaires', 'contacts'],
  },
]);

/**
 * Filtre les sources selon des critères.
 * @param {{domaine?:string, sansCle?:boolean, horsLigne?:boolean}} [criteres]
 * @returns {Array<object>} Sources correspondantes.
 */
export function chercherSources(criteres = {}) {
  return SOURCES_OFFICIELLES.filter((s) => {
    if (criteres.domaine && s.domaine !== criteres.domaine) return false;
    if (criteres.sansCle === true && s.cle !== false) return false;
    if (criteres.horsLigne === true && !s.horsLigne) return false;
    return true;
  });
}

/**
 * Sources embarquables — celles qui permettent à watchtower de fonctionner
 * sans réseau. C'est la réponse à « robuste si outils offline ou pas gratuits ».
 * @returns {Array<object>} Sources téléchargeables en masse.
 */
export function sourcesEmbarquables() {
  return chercherSources({ horsLigne: true, sansCle: true });
}

/**
 * Domaines couverts par le catalogue.
 * @returns {string[]} Liste triée et dédoublonnée.
 */
export function domaines() {
  return [...new Set(SOURCES_OFFICIELLES.map((s) => s.domaine))].sort();
}
