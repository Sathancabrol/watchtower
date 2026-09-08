/**
 * Dossier territorial pré-instruit — Frontignan la Peyrade (34108).
 *
 * Données extraites du rapport d'analyse territoriale du monorepo
 * (`projects/frontignan/rapport-frontignan-analyse-territoriale.md`,
 * 826 lignes, 249 sources datées, septembre 2026).
 *
 * Sert deux usages :
 *   1. jeu d'essai réel pour le hub INTEL et la vue communale (chantier E) ;
 *   2. démonstration de l'entonnoir national → projet sur une vraie commune.
 *
 * Chaque fait porte sa certitude et ses sources : c'est la règle de
 * traçabilité du hub. Aucune donnée personnelle.
 *
 * @module data/territoire/frontignan
 */

import { creerNoeud } from './dossierTerritorial.js';

/** Code INSEE de la commune (à ne pas confondre avec le code postal 34110). */
export const CODE_INSEE = '34108';

/** Repère géographique de la commune. */
export const REPERE = Object.freeze({ lat: 43.4486, lon: 3.7561, nom: 'Frontignan la Peyrade' });

/**
 * Construit le dossier territorial complet.
 * @returns {object} Arbre INTEL prêt pour le drill-down.
 */
export function dossierFrontignan() {
  return creerNoeud({
    id: 'fr', echelle: 'national', titre: '🇫🇷 France',
    resume: 'Cadre contraignant : sobriété foncière et adaptation climatique.',
    faits: [
      { libelle: 'Zéro artificialisation nette (ZAN)', valeur: 'trajectoire 2031/2050',
        certitude: 'engage', sources: ['https://www.legifrance.gouv.fr/'] },
    ],
    enfants: [{
      id: 'occitanie', echelle: 'regional', titre: 'Occitanie / Hérault',
      resume: 'Une des régions les plus attractives de France ; littoral sous surveillance.',
      faits: [
        { libelle: 'Dynamique démographique', valeur: 'forte attractivité',
          certitude: 'annonce', sources: ['https://www.insee.fr/'] },
        { libelle: 'Risque littoral', valeur: 'érosion et submersion',
          certitude: 'engage', sources: ['https://www.georisques.gouv.fr/'] },
      ],
      enfants: [{
        id: 'sam', echelle: 'intercommunal', titre: 'Sète Agglopôle Méditerranée',
        resume: 'Bascule de gouvernance en 2025, équilibre fragile ; SCoT du bassin de Thau en approbation.',
        faits: [
          { libelle: 'SCoT bassin de Thau', valeur: 'en approbation',
            certitude: 'annonce', sources: ['https://www.agglopole.fr/'] },
        ],
        enfants: [{
          id: 'frontignan', echelle: 'communal', titre: '🍯 Frontignan la Peyrade',
          resume: "« La ville muscatière » entre sel, vin et pétrole. Fenêtre rare 2026-2032 : "
            + 'friche Mobil restituée, PEM acté, SCoT en approbation, présidence de l’agglo.',
          faits: [
            { libelle: 'Code INSEE', valeur: CODE_INSEE, certitude: 'engage', sources: ['https://www.insee.fr/'] },
            { libelle: 'Démographie', valeur: 'croissance retrouvée, vieillissement réel',
              certitude: 'annonce', sources: ['https://www.insee.fr/'] },
            { libelle: 'Mobilités', valeur: 'gare précieuse, voiture toujours reine',
              certitude: 'annonce', sources: ['https://www.agglopole.fr/'] },
          ],
          enfants: [
            {
              id: 'friche-mobil', echelle: 'projet', titre: '🏭 Friche ExxonMobil (11 ha)',
              resume: 'Le projet du siècle frontignanais : du pétrole à la transition.',
              faits: [
                { libelle: 'Dépollution achevée, site restitué à la Ville', valeur: '27 mai 2026',
                  certitude: 'engage',
                  sources: ['https://www.midilibre.fr/2026/05/27/friche-mobil-de-frontignan-un-nouveau-quartier-va-emerger-sur-lancien-site-petrolier-13390607.php'] },
                { libelle: 'Terres excavées', valeur: '170 000 m³ (moitié réutilisée sur site)',
                  certitude: 'engage', sources: ['https://echo-des-tribunes.com/herault-tribune/'] },
                { libelle: 'Programme', valeur: 'pas de logements ; tertiaire, gare/PEM, espaces publics',
                  certitude: 'annonce', sources: ['https://www.midilibre.fr/2026/05/27/'] },
                { libelle: 'Aménagements', valeur: 'à partir de ~2028',
                  certitude: 'tendance', regle: 'calendrier annoncé par les élus, non contractualisé' },
              ],
            },
            {
              id: 'pem', echelle: 'projet', titre: '🚉 Gare & pôle d’échanges multimodal',
              resume: 'Déplacement de la gare sur la friche Mobil.',
              faits: [
                { libelle: 'Budget', valeur: '25 M€ (revu depuis 41 M€)',
                  certitude: 'engage', sources: ['https://www.laregion.fr/'] },
                { libelle: 'Région Occitanie', valeur: '40 % dans la limite de 10 M€',
                  certitude: 'engage', sources: ['https://www.laregion.fr/'] },
                { libelle: 'Agglomération', valeur: '20 %', certitude: 'engage', sources: ['https://www.agglopole.fr/'] },
                { libelle: 'Livraison', valeur: '2028-2029',
                  certitude: 'tendance', regle: 'horizon répété par les élus 2025-2026' },
              ],
            },
            { id: 'coeur-de-ville', echelle: 'projet', titre: '🏘 Requalification du cœur de ville (ORU)',
              resume: 'Le projet matriciel : label Action Cœur de Ville.',
              faits: [{ libelle: 'Dispositif', valeur: 'Action Cœur de Ville + ORU',
                certitude: 'engage', sources: ['https://agence-cohesion-territoires.gouv.fr/'] }] },
            { id: 'port', echelle: 'projet', titre: '⛵ Restructuration du port de plaisance',
              faits: [{ libelle: 'Calendrier', valeur: '2026-2029', certitude: 'annonce',
                sources: ['https://www.frontignan.fr/'] }] },
            { id: 'lido', echelle: 'projet', titre: '🏖 Littoral & lido',
              faits: [{ libelle: 'Enjeu', valeur: 'protection du lido et de la station',
                certitude: 'engage', sources: ['https://www.georisques.gouv.fr/'] }] },
            { id: 'chais-botta', echelle: 'projet', titre: '🎭 Pôle culturel des chais Botta « Le Quai »',
              faits: [{ libelle: 'État', valeur: 'livré, en rodage', certitude: 'engage',
                sources: ['https://www.frontignan.fr/'] }] },
          ],
        }],
      }],
    }],
  });
}

/**
 * Communes du bassin de Thau — jeu d'essai du chantier E (vue communale).
 *
 * ⚠️ Données **vérifiées à la source** le 08/09/2026 via `geo.api.gouv.fr`
 * (API officielle de l'État, Licence Ouverte). Une première version de ce
 * fichier portait trois codes INSEE erronés (Balaruc-les-Bains, Balaruc-le-Vieux,
 * Loupian) — d'où la vérification systématique désormais couverte par les tests.
 *
 * `sam` indique l'appartenance à Sète Agglopôle Méditerranée (EPCI 200066355).
 * Agde n'en fait PAS partie (CA Hérault Méditerranée, EPCI 243400819) : elle est
 * conservée car elle figure dans le jeu d'essai de l'étang de Thau.
 *
 * Population : population municipale légale en vigueur (millésime 2023).
 * Centre : coordonnées du chef-lieu. Surface en hectares.
 */
export const COMMUNES_THAU = Object.freeze([
  Object.freeze({ insee: '34108', nom: 'Frontignan',        cp: '34110', pop: 24136, lat: 43.4486, lon: 3.7493, surfaceHa: 4001.24, sam: true }),
  Object.freeze({ insee: '34301', nom: 'Sète',              cp: '34200', pop: 45337, lat: 43.3844, lon: 3.6441, surfaceHa: 4058.10, sam: true }),
  Object.freeze({ insee: '34023', nom: 'Balaruc-les-Bains', cp: '34540', pop:  7139, lat: 43.4476, lon: 3.6922, surfaceHa:  867.47, sam: true }),
  Object.freeze({ insee: '34024', nom: 'Balaruc-le-Vieux',  cp: '34540', pop:  2737, lat: 43.4650, lon: 3.6971, surfaceHa:  692.37, sam: true }),
  Object.freeze({ insee: '34039', nom: 'Bouzigues',         cp: '34140', pop:  1601, lat: 43.4450, lon: 3.6563, surfaceHa:  649.85, sam: true }),
  Object.freeze({ insee: '34143', nom: 'Loupian',           cp: '34140', pop:  2169, lat: 43.4509, lon: 3.6279, surfaceHa: 2325.60, sam: true }),
  Object.freeze({ insee: '34157', nom: 'Mèze',              cp: '34140', pop: 12669, lat: 43.4323, lon: 3.5843, surfaceHa: 4772.88, sam: true }),
  Object.freeze({ insee: '34150', nom: 'Marseillan',        cp: '34340', pop:  8414, lat: 43.3543, lon: 3.5560, surfaceHa: 5273.21, sam: true }),
  Object.freeze({ insee: '34003', nom: 'Agde',              cp: '34300', pop: 29939, lat: 43.3084, lon: 3.4838, surfaceHa: 5144.00, sam: false }),
]);

/**
 * Les 14 communes de Sète Agglopôle Méditerranée non déjà listées ci-dessus.
 * Complète la couverture de l'EPCI pour la vue intercommunale.
 */
export const COMMUNES_SAM_COMPLEMENT = Object.freeze([
  Object.freeze({ insee: '34113', nom: 'Gigean',          cp: '34770', pop: 6639, lat: 43.4953, lon: 3.7242, surfaceHa: 1630.09, sam: true }),
  Object.freeze({ insee: '34159', nom: 'Mireval',         cp: '34110', pop: 3301, lat: 43.5158, lon: 3.8022, surfaceHa: 1122.66, sam: true }),
  Object.freeze({ insee: '34165', nom: 'Montbazin',       cp: '34560', pop: 2877, lat: 43.5325, lon: 3.6694, surfaceHa: 2148.52, sam: true }),
  Object.freeze({ insee: '34213', nom: 'Poussan',         cp: '34560', pop: 6797, lat: 43.4976, lon: 3.6623, surfaceHa: 2991.74, sam: true }),
  Object.freeze({ insee: '34333', nom: 'Vic-la-Gardiole', cp: '34110', pop: 3428, lat: 43.4838, lon: 3.8046, surfaceHa: 3071.74, sam: true }),
  Object.freeze({ insee: '34341', nom: 'Villeveyrac',     cp: '34560', pop: 3972, lat: 43.4956, lon: 3.5931, surfaceHa: 3726.49, sam: true }),
]);

/** Identifiant SIREN de l'EPCI Sète Agglopôle Méditerranée. */
export const EPCI_SAM = '200066355';

/**
 * Toutes les communes connues, dédoublonnées par code INSEE.
 * @returns {Array<object>} Référentiel complet (15 communes).
 */
export function toutesCommunes() {
  return [...COMMUNES_THAU, ...COMMUNES_SAM_COMPLEMENT];
}

/**
 * Retrouve une commune par code INSEE.
 * @param {string} insee - Code INSEE à 5 caractères.
 * @returns {object|null} La commune, ou null.
 */
export function communeParInsee(insee) {
  return toutesCommunes().find((c) => c.insee === insee) || null;
}
