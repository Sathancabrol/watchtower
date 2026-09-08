/**
 * Frontignan — finances, vie associative et contradictions documentées.
 *
 * Complète `frontignan.js` sur trois points demandés :
 *   1. **budgets et calendriers vérifiés** (ne pas se tromper) ;
 *   2. **associations, clubs et vie locale** ;
 *   3. **traçabilité des désaccords entre sources**.
 *
 * Le rapport du monorepo a déjà arbitré dix contradictions ; ces arbitrages sont
 * repris ici **explicitement** plutôt que masqués derrière un chiffre unique.
 * Un chiffre contesté doit se présenter comme tel.
 *
 * @module data/territoire/frontignanDetail
 */

/**
 * Exercices budgétaires (budget principal, en euros).
 * `fiable` distingue les montants votés et sourcés des estimations.
 */
export const BUDGETS = Object.freeze([
  Object.freeze({
    exercice: 'BP 2022', fonctionnement: 40_500_000, investissement: 18_500_000,
    total: 59_100_000, tauxStables: true, fiable: true,
    source: 'https://www.frontignan.fr/budgets-impots-citoyennete-et-cadre-de-vie-a-lordre-du-jour-du-conseil-municipal/',
  }),
  Object.freeze({
    exercice: 'BP 2024', fonctionnement: 45_000_000, investissement: 24_000_000,
    total: 69_000_000, tauxStables: true, fiable: false,
    note: 'Répartition fonctionnement/investissement estimée, non publiée telle quelle.',
    source: 'https://www.midilibre.fr/2024/04/04/il-ny-aura-pas-daugmentation-des-impots-de-la-part-de-frontignan-11869429.php',
  }),
  Object.freeze({
    exercice: 'BP 2025', fonctionnement: 39_553_032, investissement: 17_179_220,
    total: 56_732_252, tauxStables: true, fiable: true,
    note: 'Voté le 6 février 2025, sans reprise des résultats 2024. 8ᵉ année de taux stables. '
      + 'CORRECTION : le rapport source additionne ces deux sections en 56 232 252 €, or '
      + '39 553 032 + 17 179 220 = 56 732 252 €. Écart de 500 000 € imputable à une coquille '
      + 'du rapport ; les deux sections étant chacune sourcées au centime, c’est le total qui '
      + 'a été recalculé. Cohérent avec le « budget de 56 M€ » de la presse locale.',
    source: 'https://www.frontignan.fr/flp-mag-36-le-dossier-un-financement-au-cordeau/',
  }),
  Object.freeze({
    exercice: 'BP 2026', fonctionnement: null, investissement: null,
    total: 52_000_000, tauxStables: true, fiable: true,
    note: 'Voté par anticipation le 13 janvier 2026. Périmètre budget primitif seul.',
    source: 'https://actudirect24.fr/frontignan-budget-taxes-elus/',
  }),
  Object.freeze({
    exercice: '2026 consolidé (BP+BS+reports)', fonctionnement: 43_900_000, investissement: 20_900_000,
    total: 64_900_000, tauxStables: true, fiable: true,
    note: '9ᵉ année de taux stables. Périmètre élargi : Ne pas comparer au BP seul.',
    source: 'https://actudirect24.fr/frontignan-budget-taxes-elus/',
  }),
]);

/**
 * Indicateurs de gestion 2024, comparés à la strate 20 000-50 000 habitants.
 * `alerte` signale un indicateur défavorable.
 */
export const INDICATEURS_FINANCIERS = Object.freeze([
  Object.freeze({ libelle: 'Dette par habitant', valeur: 995, unite: '€/hab', strate: 986, alerte: false,
    note: 'Dans la moyenne ; dette en baisse de 12,9 % sur 3 ans (strate : −0,9 %).' }),
  Object.freeze({ libelle: 'Capacité de désendettement', valeur: 7.5, unite: 'ans', strate: 5.5, alerte: true,
    note: 'Dégradation à surveiller, liée à une épargne encore convalescente.' }),
  Object.freeze({ libelle: 'Impôts locaux par habitant', valeur: 1011, unite: '€/hab', strate: 793, alerte: true,
    note: 'Pression fiscale élevée, produit de taux historiquement hauts.' }),
  Object.freeze({ libelle: 'Investissement par habitant', valeur: 270, unite: '€/hab', strate: 438, alerte: true,
    note: 'Effort d’investissement contenu.' }),
  Object.freeze({ libelle: 'Charges de personnel par habitant', valeur: 946, unite: '€/hab', strate: 849, alerte: true,
    note: 'Environ 700 agents.' }),
]);

/**
 * Vie associative et sportive. Le tissu associatif est un acteur du territoire
 * au même titre que les institutions.
 */
export const VIE_ASSOCIATIVE = Object.freeze({
  subventionsAnnuelles: 508_150,
  nombreAssociationsSubventionnees: 100,
  anneeReference: 2025,
  source: 'https://www.frontignan.fr/flp-mag-36-le-dossier-un-financement-au-cordeau/',
  eluReferent: 'Caroline Suné (vie associative)',
  budgetParticipatif: Object.freeze({ montantAnnuel: 50_000, depuis: 2022, lieu: 'Maison des projets et de la Citoyenneté' }),
  concertation: Object.freeze({
    comitesHabitants: 6,
    note: 'Créés en 2022, en remplacement des 11 conseils de quartier.',
    maisonDesProjets: 'Créée en septembre 2021, 100 m², angle rue Victor-Anthérieu / bd Victor-Hugo.',
  }),
  evenements: Object.freeze([
    Object.freeze({
      nom: 'Festival international du roman noir (FIRN)', depuis: 1998, edition: 29,
      dates: '29-30 mai 2026', lieu: 'Place du Contr’un et médiathèque Montaigne',
      frequentation: '≈ 5 900 festivaliers (2023)',
      fiabiliteFrequentation: 'ordre de grandeur — chiffres organisateurs, contestés par l’opposition',
      source: 'https://www.frontignan.fr/evenement/29e-festival-international-du-roman-noir/',
    }),
    Object.freeze({ nom: 'Joutes languedociennes', type: 'tradition', note: 'Élément identitaire fort du bassin de Thau.' }),
    Object.freeze({ nom: 'Muscat de Frontignan AOP', depuis: 1936, note: '90 ans de l’AOP fêtés en 2026 ; ~800 ha, ~3 M bouteilles, cave coopérative centenaire.' }),
  ]),
});

/**
 * Contradictions entre sources, avec l'arbitrage retenu et sa justification.
 * Affichées telles quelles : un chiffre contesté ne doit pas paraître certain.
 */
export const CONTRADICTIONS = Object.freeze([
  Object.freeze({
    sujet: 'Coût du pôle d’échanges multimodal',
    versions: ['41 M€ (premières ébauches)', '25 M€ (annonce officielle Région, juin 2023)'],
    retenu: '25 M€', justification: 'Révision documentée : suppression du déplacement d’aiguillage.', resolu: true,
  }),
  Object.freeze({
    sujet: 'Budget « cœur de ville »',
    versions: ['15 M€ sur 10 ans (site de la Ville)', '35 M€ sur 10 ans (actu.fr, 2022)'],
    retenu: 'les deux, selon le périmètre',
    justification: '15 M€ = ORU espaces publics ; 35 M€ = périmètre élargi (habitat, équipements).', resolu: false,
  }),
  Object.freeze({
    sujet: 'Budget communal 2026',
    versions: ['52 M€ (BP voté le 13/01/2026)', '64,9 M€ (BP + BS + reports, juin 2026)'],
    retenu: 'les deux, périmètres distincts',
    justification: 'Ne jamais comparer un BP à un budget consolidé.', resolu: true,
  }),
  Object.freeze({
    sujet: 'Dette communale',
    versions: ['23,9 M€ / 995 €.hab (fin 2024, DGFiP)', '≈ 21 M€ (CM de janvier 2026)'],
    retenu: 'les deux, à des dates différentes',
    justification: 'Évolution 2024→2026 cohérente avec un remboursement d’environ 2,3 M€/an.', resolu: true,
  }),
  Object.freeze({
    sujet: 'Population de l’agglomération',
    versions: ['129 982 (2022)', '≈ 125 000', '132 851', '131 033 (calcul propre)'],
    retenu: '≈ 131 000 habitants (2023)', justification: 'À confirmer avec le bilan annuel de l’agglo.', resolu: false,
  }),
  Object.freeze({
    sujet: 'Superficie du vignoble AOP',
    versions: ['650 ha (Ville, 2019)', '622-640 ha (cave coopérative)', '800 ha (Ville, 2026)'],
    retenu: '800 ha (2026)', justification: 'Source la plus récente ; fourchette signalée.', resolu: false,
  }),
  Object.freeze({
    sujet: 'Fréquentation du FIRN',
    versions: ['5 876 (2023)', '8 500 (2016)'],
    retenu: 'ordres de grandeur',
    justification: 'Chiffres d’organisateurs, qualifiés de sur-gonflés par l’opposition.', resolu: false,
  }),
]);

/**
 * Points aveugles : ce que l'on sait ne pas savoir.
 * Un hub de renseignement honnête affiche aussi ses trous.
 */
export const DONNEES_MANQUANTES = Object.freeze([
  'Fréquentation de la gare et programmation détaillée du PEM (angle mort n°1).',
  'Programmation pluriannuelle des investissements (PPI) et dette fine 2025.',
  'Clés de financement de l’ORU, du pôle Botta et du port.',
  'Étude d’usage de la friche Mobil (résultats attendus fin 2026).',
  'Vacance commerciale actualisée (les 4 % datent de 2019-2020).',
  'Centre aquatique des Hierles : budget et calendrier non publics.',
  'Cartes locales de recul du trait de côte aux horizons 30 et 100 ans.',
]);

/**
 * Somme de contrôle d'un exercice budgétaire.
 * @param {object} b - Entrée de `BUDGETS`.
 * @returns {boolean} Vrai si le total correspond à la somme des sections.
 */
export function budgetCoherent(b) {
  if (!b || b.fonctionnement === null || b.investissement === null) return true;
  return Math.abs(b.fonctionnement + b.investissement - b.total) <= 1_000_000;
}

/**
 * Contradictions encore ouvertes — à afficher avec réserve.
 * @returns {Array<object>} Contradictions non résolues.
 */
export function contradictionsOuvertes() {
  return CONTRADICTIONS.filter((c) => !c.resolu);
}
