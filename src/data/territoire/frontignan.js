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
 * Communes de l'étang de Thau — jeu d'essai du chantier E (vue communale).
 * Codes INSEE réels, repères approximatifs de centre-bourg.
 */
export const COMMUNES_THAU = Object.freeze([
  Object.freeze({ insee: '34108', nom: 'Frontignan',  lat: 43.4486, lon: 3.7561 }),
  Object.freeze({ insee: '34301', nom: 'Sète',        lat: 43.4075, lon: 3.6936 }),
  Object.freeze({ insee: '34022', nom: 'Balaruc-les-Bains', lat: 43.4436, lon: 3.6811 }),
  Object.freeze({ insee: '34023', nom: 'Balaruc-le-Vieux',  lat: 43.4589, lon: 3.6864 }),
  Object.freeze({ insee: '34039', nom: 'Bouzigues',   lat: 43.4494, lon: 3.6564 }),
  Object.freeze({ insee: '34152', nom: 'Loupian',     lat: 43.4489, lon: 3.6142 }),
  Object.freeze({ insee: '34157', nom: 'Mèze',        lat: 43.4256, lon: 3.6053 }),
  Object.freeze({ insee: '34150', nom: 'Marseillan',  lat: 43.3567, lon: 3.5289 }),
  Object.freeze({ insee: '34003', nom: 'Agde',        lat: 43.3097, lon: 3.4756 }),
]);
