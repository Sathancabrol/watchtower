/**
 * WATCHTOWER — TERRITOIRE : LA HIÉRARCHIE RÉELLE (données pures, testables).
 *
 * C'est la carte mère du module TERRITOIRE / STRATEGIC VIEW :
 *
 *   FRANCE → OCCITANIE → HÉRAULT → SÈTE AGGLOPÔLE MÉDITERRANÉE
 *     → commune (14) → quartier (Frontignan : 11) → parcelle / objet
 *
 * Règle de la maison (voir `vuesIntel.js`) : une donnée affichée est SOURCÉE,
 * et quand une valeur n'est pas certaine on la MARQUE (`precision`, `confiance`)
 * au lieu de l'inventer. Trois niveaux de précision géographique :
 *
 *   · `epci`/`commune` — centre administratif, ordre de la centaine de mètres ;
 *   · `quartier`       — position INDICATIVE d'après le toponyme, à remplacer
 *                        par les contours IRIS (INSEE) ou un import GeoJSON ;
 *   · `repere`         — point d'intérêt géographique connu (étang, canal…),
 *                        position indicative elle aussi.
 *
 * Aucun Cesium, aucun DOM : ce fichier s'importe tel quel sous `node:test`.
 */

/** Les niveaux de lecture du territoire, du plus large au plus fin. */
export const NIVEAUX = Object.freeze([
  { id: 'pays', nom: 'PAYS', icone: '🇫🇷', span: 1000, echelle: 1 / 12_000_000, aide: 'maillage hexagonal grossier' },
  { id: 'region', nom: 'RÉGION', icone: '🌍', span: 320, echelle: 1 / 3_000_000, aide: 'maillage régional' },
  { id: 'departement', nom: 'DÉPARTEMENT', icone: '🗺', span: 90, echelle: 1 / 700_000, aide: 'maillage départemental' },
  { id: 'epci', nom: 'AGGLOMÉRATION', icone: '🏛', span: 14, echelle: 1 / 220_000, aide: '14 communes réelles' },
  { id: 'commune', nom: 'COMMUNE', icone: '🏘', span: 5, echelle: 1 / 45_000, aide: 'limites communales' },
  { id: 'quartier', nom: 'QUARTIER', icone: '🧱', span: 1, echelle: 1 / 9_000, aide: 'IRIS / quartiers' },
  { id: 'parcelle', nom: 'PARCELLE', icone: '📐', span: 0.2, echelle: 1 / 1_500, aide: 'cadastre IGN' },
]);

/** L'intercommunalité de référence (identité vérifiable, sans politique). */
export const AGGLO = Object.freeze({
  id: 'epci-200066355',
  nom: 'Sète Agglopôle Méditerranée',
  nomAncien: 'Communauté d’agglomération du Bassin de Thau',
  siren: '200066355',
  nature: 'Communauté d’agglomération',
  departement: 'Hérault (34)',
  region: 'Occitanie',
  siege: 'Frontignan',
  adresseSiege: '4 avenue d’Aigues, 34110 Frontignan',
  creation: '2017-01-01',
  origineFusion: ['Thau Agglo', 'Communauté de communes du Nord du Bassin de Thau'],
  nbCommunes: 14,
  superficieKm2: 310.3,
  population: 131_216,
  millesimePopulation: 2023,
  densite: 423,
  competences: 44,
  lat: 43.4507,
  lon: 3.6404,
  confiance: 'documenté',
  source: 'BANATIC / INSEE (via banatic.interieur.gouv.fr, comersis, Wikipedia FR)',
  verif: 'https://www.banatic.interieur.gouv.fr/intercommunalite/200066355-ca-sete-agglopole-mediterranee',
  note: 'Siège à Frontignan. 2e agglomération de l’Hérault. Aucune donnée politique n’est recalculée ici : les élus vivent dans le RNE (data.gouv.fr) et le BANATIC.',
});

/**
 * Communes membres — INSEE, code postal, gentilé, population de référence,
 * superficie, sièges au conseil communautaire (BANATIC), traits de territoire.
 * `centre` = lat/lon du bourg (ordre 100 m) — sert à poser la carte ET la caméra.
 */
export const COMMUNES = Object.freeze([
  {
    insee: '34108', nom: 'Frontignan', gentile: 'Frontignanais', codePostal: '34110',
    population: 24_136, millesimePopulation: 2023, superficieKm2: 31.72, sieges: 9,
    centre: { lat: 43.4468, lon: 3.7564 }, littoral: true, lagune: true, gardiole: true,
    role: 'siège de l’agglomération · ville-centre de l’unité urbaine de Sète',
    confiance: 'documenté',
  },
  {
    insee: '34301', nom: 'Sète', gentile: 'Sétois', codePostal: '34200',
    population: 45_337, millesimePopulation: 2023, superficieKm2: 24.21, sieges: 19,
    centre: { lat: 43.4042, lon: 3.6968 }, littoral: true, lagune: true, gardiole: false,
    role: 'pôle urbain · port de commerce et de pêche · Mont Saint-Clair',
    confiance: 'documenté',
  },
  {
    insee: '34157', nom: 'Mèze', gentile: 'Mézois', codePostal: '34140',
    population: 12_669, millesimePopulation: 2023, superficieKm2: 34.59, sieges: 5,
    centre: { lat: 43.4257, lon: 3.6050 }, littoral: false, lagune: true, gardiole: false,
    role: 'rive nord de l’étang de Thau · port de plaisance et de pêche',
    confiance: 'documenté',
  },
  {
    insee: '34150', nom: 'Marseillan', gentile: 'Marseillanais', codePostal: '34340',
    population: 8_414, millesimePopulation: 2023, superficieKm2: 51.71, sieges: 3,
    centre: { lat: 43.3560, lon: 3.5280 }, littoral: true, lagune: true, gardiole: false,
    role: 'plus vaste commune de l’agglomération · port · conchyliculture',
    confiance: 'documenté',
  },
  {
    insee: '34023', nom: 'Balaruc-les-Bains', gentile: 'Balarucois', codePostal: '34540',
    population: 7_139, millesimePopulation: 2023, superficieKm2: 8.66, sieges: 3,
    centre: { lat: 43.4418, lon: 3.6769 }, littoral: false, lagune: true, gardiole: false,
    role: '1re station thermale de France · thermes et cure',
    confiance: 'documenté',
  },
  {
    insee: '34213', nom: 'Poussan', gentile: 'Poussannais', codePostal: '34560',
    population: 6_797, millesimePopulation: 2023, superficieKm2: 30.08, sieges: 2,
    centre: { lat: 43.4889, lon: 3.6703 }, littoral: false, lagune: false, gardiole: true,
    role: 'piémont de la Gardiole · croissance résidentielle',
    confiance: 'documenté',
  },
  {
    insee: '34113', nom: 'Gigean', gentile: 'Gigeannais', codePostal: '34770',
    population: 6_639, millesimePopulation: 2023, superficieKm2: 16.56, sieges: 2,
    centre: { lat: 43.4997, lon: 3.7111 }, littoral: false, lagune: false, gardiole: true,
    role: 'abbaye Saint-Félix-de-Montceau · piémont de la Gardiole',
    confiance: 'documenté',
  },
  {
    insee: '34341', nom: 'Villeveyrac', gentile: 'Villeveyracois', codePostal: '34560',
    population: 3_972, millesimePopulation: 2023, superficieKm2: 37.12, sieges: 1,
    centre: { lat: 43.4972, lon: 3.6011 }, littoral: false, lagune: false, gardiole: false,
    role: 'arrière-pays viticole · circuit court',
    confiance: 'documenté',
  },
  {
    insee: '34333', nom: 'Vic-la-Gardiole', gentile: 'Vicois', codePostal: '34110',
    population: 3_428, millesimePopulation: 2023, superficieKm2: 18.49, sieges: 1,
    centre: { lat: 43.4992, lon: 3.8078 }, littoral: true, lagune: true, gardiole: true,
    role: 'lido et salins · étang de Vic · interface Gardiole/littoral',
    confiance: 'documenté',
  },
  {
    insee: '34159', nom: 'Mireval', gentile: 'Mirevalais', codePostal: '34110',
    population: 3_301, millesimePopulation: 2023, superficieKm2: 11.05, sieges: 1,
    centre: { lat: 43.5094, lon: 3.7933 }, littoral: false, lagune: false, gardiole: true,
    role: 'vignoble du Muscat de Mireval · piémont de la Gardiole',
    confiance: 'documenté',
  },
  {
    insee: '34165', nom: 'Montbazin', gentile: 'Montbazinois', codePostal: '34560',
    population: 2_877, millesimePopulation: 2023, superficieKm2: 21.13, sieges: 1,
    centre: { lat: 43.5161, lon: 3.6964 }, littoral: false, lagune: false, gardiole: true,
    role: 'village circulaire médiéval · mosaïque viticole et garrigue',
    confiance: 'documenté',
  },
  {
    insee: '34024', nom: 'Balaruc-le-Vieux', gentile: 'Balarucois', codePostal: '34540',
    population: 2_737, millesimePopulation: 2023, superficieKm2: 5.92, sieges: 1,
    centre: { lat: 43.4606, lon: 3.6845 }, littoral: false, lagune: false, gardiole: true,
    role: 'village de l’arrière de Balaruc · étang de Thau à l’est',
    confiance: 'documenté',
  },
  {
    insee: '34143', nom: 'Loupian', gentile: 'Loupianais', codePostal: '34140',
    population: 2_169, millesimePopulation: 2023, superficieKm2: 16.00, sieges: 1,
    centre: { lat: 43.4500, lon: 3.6128 }, littoral: false, lagune: true, gardiole: false,
    role: 'villa gallo-romaine · conchyliculture · rive nord de Thau',
    confiance: 'documenté',
  },
  {
    insee: '34039', nom: 'Bouzigues', gentile: 'Bouzigauds', codePostal: '34140',
    population: 1_601, millesimePopulation: 2023, superficieKm2: 3.05, sieges: 1,
    centre: { lat: 43.4440, lon: 3.6584 }, littoral: false, lagune: true, gardiole: false,
    role: 'berceau de la conchyliculture de Thau · musée de l’étang',
    confiance: 'documenté',
  },
]);

/**
 * Quartiers de Frontignan — les 11 quartiers administratifs connus.
 * `centre` est INDICATIF (position du toponyme, ±500 m) : la géométrie
 * officielle est celle des IRIS INSEE / du cadastre. On l'assume au lieu de la
 * faire passer pour un contour.
 */
export const QUARTIERS_FRONTIGNAN = Object.freeze([
  { id: 'q-coeur-ville', nom: 'Cœur de ville / Anatole-France', centre: { lat: 43.4480, lon: 3.7560 }, traits: ['patrimoine', 'commerce', 'halles'] },
  { id: 'q-frontignan-plage', nom: 'Frontignan-Plage', centre: { lat: 43.4270, lon: 3.8020 }, traits: ['littoral', 'saison', 'sports nautiques'] },
  { id: 'q-la-peyrade', nom: 'La Peyrade / Méreville', centre: { lat: 43.4334, lon: 3.7408 }, traits: ['renouvellement urbain', 'quartier prioritaire'] },
  { id: 'q-crozes-pielles', nom: 'Crozes / Pielles', centre: { lat: 43.4540, lon: 3.7420 }, traits: ['écoquartier', 'médiathèque', 'friche industrielle reconvertie'] },
  { id: 'q-terres-blanches', nom: 'Terres Blanches', centre: { lat: 43.4560, lon: 3.7690 }, traits: ['groupe scolaire', 'habitat' ] },
  { id: 'q-mas-de-chave', nom: 'Mas de Chave', centre: { lat: 43.4420, lon: 3.7330 }, traits: ['habitat', 'équipements sportifs'] },
  { id: 'q-pres-saint-martin', nom: 'Prés Saint Martin', centre: { lat: 43.4570, lon: 3.7480 }, traits: ['habitat', 'commerces de proximité'] },
  { id: 'q-lierles-felibre', nom: 'Lierles / Félibre', centre: { lat: 43.4510, lon: 3.7620 }, traits: ['habitat', 'équipements publics'] },
  { id: 'q-vignaux-europe', nom: 'Les Vignaux / Europe', centre: { lat: 43.4400, lon: 3.7460 }, traits: ['habitat', 'zone d’activités à proximité'] },
  { id: 'q-barnier', nom: 'Barnier', centre: { lat: 43.4360, lon: 3.7560 }, traits: ['habitat', 'vignes'] },
  { id: 'q-carrieres-deux-pins', nom: 'Carrières / Les Deux Pins', centre: { lat: 43.4620, lon: 3.7360 }, traits: ['garrigue', 'anciennes carrières'] },
]);

/**
 * Repères géographiques de la zone de référence (étangs, canal, massif, salins).
 * Ce ne sont pas des POI administratifs : ce sont les traits qui commandent
 * l'eau, le risque et le paysage.
 */
export const REPERES = Object.freeze([
  { id: 'rep-ingril', nom: 'Étang d’Ingril', type: 'lagune', centre: { lat: 43.4370, lon: 3.8150 }, communes: ['34108', '34333'], note: 'Lagune littorale entre Frontignan-Plage et Vic-la-Gardiole ; kitesurf, roselière, qualité d’eau suivie.' },
  { id: 'rep-vic', nom: 'Étang de Vic', type: 'lagune', centre: { lat: 43.4740, lon: 3.8300 }, communes: ['34333'], note: 'Lagune derrière le lido, entre Vic-la-Gardiole et Mireval.' },
  { id: 'rep-thau', nom: 'Étang de Thau', type: 'lagune', centre: { lat: 43.4000, lon: 3.6100 }, communes: ['34301', '34108', '34157', '34150', '34023', '34024', '34143', '34039', '34150'], note: 'Plus grand plan d’eau lagunaire d’Occitanie (~7 500 ha) ; conchyliculture, pêche, nautisme.' },
  { id: 'rep-canal-rhone-sete', nom: 'Canal du Rhône à Sète', type: 'canal', centre: { lat: 43.4400, lon: 3.7600 }, communes: ['34108', '34301'], note: 'Canal de navigation et de connexion des lagunes ; berges et quais réaménagés à Frontignan.' },
  { id: 'rep-gardiole', nom: 'Massif de la Gardiole', type: 'massif', centre: { lat: 43.5100, lon: 3.7600 }, communes: ['34108', '34333', '34113', '34024', '34165', '34213', '34159'], note: 'Massif calcaire en grande partie en zone Natura 2000 ; risque incendie élevé en été.' },
  { id: 'rep-lido', nom: 'Lido (cordon littoral)', type: 'littoral', centre: { lat: 43.4900, lon: 3.8600 }, communes: ['34108', '34333', '34159'], note: 'Cordon sableux entre mer et lagunes — zone d’érosion et de submersion marines.' },
  { id: 'rep-salins', nom: 'Salins et anciens salins', type: 'zone humide', centre: { lat: 43.4450, lon: 3.8150 }, communes: ['34108', '34333'], note: 'Anciens salins et zones humides — avifaune, gestion hydraulique, site sensible.' },
]);

/** Traits de risque — QUALITATIFS et marqués comme tels (à confirmer par commune). */
export const RISQUES_PAR_COMMUNE = Object.freeze({
  inondation: { nom: 'Inondation (ruissellement / débordement)', verif: 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi' },
  submersion: { nom: 'Submersion marine', verif: 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi' },
  incendie: { nom: 'Incendie de forêt (Massif de la Gardiole)', verif: 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi' },
  secheresse: { nom: 'Sécheresse / retrait-gonflement des argiles', verif: 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi' },
});

/** Série démographique de Frontignan — base du curseur TEMPS du module. */
export const SERIE_FRONTIGNAN = Object.freeze([
  { annee: 1968, population: 11_141 },
  { annee: 1975, population: 12_238 },
  { annee: 1982, population: 14_951 },
  { annee: 1990, population: 16_245 },
  { annee: 1999, population: 19_145 },
  { annee: 2006, population: 22_410 },
  { annee: 2011, population: 22_719 },
  { annee: 2015, population: 22_771 },
  { annee: 2016, population: 22_521 },
  { annee: 2019, population: 23_028 },
  { annee: 2020, population: 23_485 },
  { annee: 2021, population: 23_808 },
  { annee: 2022, population: 23_788 },
  { annee: 2023, population: 24_136 },
]);

/**
 * Les lentilles (façons de regarder) proposées par la carte stratégique.
 * `metrique` désigne le champ lu sur la commune, ou `fiches` (comptage dans la
 * base locale) / `lien` (pas de valeur locale : on renvoie vérifier la source).
 */
export const LENTILLES = Object.freeze([
  { id: 'territoire', nom: 'TERRITOIRE', icone: '🗺', metrique: 'aucune', aide: 'la forme du territoire et sa hiérarchie' },
  { id: 'population', nom: 'POPULATION', icone: '👥', metrique: 'population', unite: 'hab.', aide: 'population municipale de référence (INSEE)' },
  { id: 'densite', nom: 'DENSITÉ', icone: '📊', metrique: 'densite', unite: 'hab./km²', aide: 'population / superficie (calculée)' },
  { id: 'logement', nom: 'URBANISME', icone: '🏗', metrique: 'fiches', filtre: 'urbanisme', aide: 'ZAC, permis, chantiers et transformations de la base locale' },
  { id: 'economie', nom: 'ÉCONOMIE', icone: '💼', metrique: 'fiches', filtre: 'commerce', aide: 'commerces, entreprises et activités recensés' },
  { id: 'associations', nom: 'ASSOCIATIONS', icone: '🤝', metrique: 'fiches', filtre: 'association', aide: 'vie associative du guide municipal (à importer)' },
  { id: 'culture', nom: 'CULTURE', icone: '🎭', metrique: 'fiches', filtre: 'evenement', aide: 'agenda culturel, festivals, saisons' },
  { id: 'reseaux', nom: 'RÉSEAUX', icone: '🔧', metrique: 'fiches', filtre: 'reseau', aide: 'eau, assainissement, électricité, gaz, télécom, éclairage public' },
  { id: 'risques', nom: 'RISQUES', icone: '⚠️', metrique: 'risques', aide: 'aléas enregistrés — renvoi systématique à Géorisques' },
  { id: 'environnement', nom: 'ENVIRONNEMENT', icone: '🌿', metrique: 'fiches', filtre: 'nature', aide: 'lagunes, zones humides, Natura 2000, littoral' },
  { id: 'travaux', nom: 'CHANTIERS', icone: '🚧', metrique: 'fiches', filtre: 'chantier', aide: 'chantiers et projets — lien vers le hub CHANTIER' },
  { id: 'imprevus', nom: 'IMPRÉVUS', icone: '🎲', metrique: 'imprevus', aide: 'ce qui peut mal tourner à cette étape — base TP (amorçage)' },
]);

const PAR_ID = new Map();
const PAR_INSEE = new Map();

for (const c of COMMUNES) {
  PAR_INSEE.set(c.insee, c);
  PAR_ID.set(`com-${c.insee}`, c);
}

/** Retrouve une commune par son code INSEE. */
export function commune(insee) {
  return PAR_INSEE.get(String(insee || '')) || null;
}

/** Retrouve un quartier de Frontignan par son identifiant. */
export function quartier(id) {
  return QUARTIERS_FRONTIGNAN.find((q) => q.id === id) || null;
}

/** Retrouve un repère géographique par son identifiant. */
export function repere(id) {
  return REPERES.find((r) => r.id === id) || null;
}

/** Densité (hab./km²) arrondie à l'unité, ou null si la donnée manque. */
export function densite(c) {
  if (!c || !c.population || !c.superficieKm2) return null;
  return Math.round(c.population / c.superficieKm2);
}

/** Population totale de l'agglomération, recalculée à partir des communes. */
export function populationTotale(liste = COMMUNES) {
  return liste.reduce((s, c) => s + (Number(c.population) || 0), 0);
}

/**
 * Les 14 communes triées selon la lentille active.
 * `sens` = 'desc' (les plus gros d'abord) ou 'asc'.
 */
export function classerCommunes(lentilleId, sens = 'desc') {
  const l = LENTILLES.find((x) => x.id === lentilleId);
  const signe = sens === 'asc' ? 1 : -1;
  const valeur = (c) => {
    if (!l || l.metrique === 'aucune') return 0;
    if (l.metrique === 'population') return c.population || 0;
    if (l.metrique === 'densite') return densite(c) || 0;
    if (l.metrique === 'risques') return (risquesCommune(c.insee) || []).length;
    return 0;
  };
  return [...COMMUNES].sort((a, b) => signe * (valeur(a) - valeur(b)) || a.nom.localeCompare(b.nom, 'fr'));
}

/**
 * Risques « plausibles » d'une commune, déduits de SES traits de territoire
 * (littoral, lagune, Gardiole) — pas d'un fichier officiel. C'est une AIDE À
 * L'INTERROGATION : chaque entrée renvoie vers Géorisques, seule source
 * opposable. `confiance: 'déduit'` est explicite.
 */
export function risquesCommune(insee) {
  const c = commune(insee);
  if (!c) return [];
  const out = [{ cle: 'inondation', ...RISQUES_PAR_COMMUNE.inondation, confiance: 'déduit' }];
  if (c.littoral) out.push({ cle: 'submersion', ...RISQUES_PAR_COMMUNE.submersion, confiance: 'déduit' });
  if (c.gardiole) out.push({ cle: 'incendie', ...RISQUES_PAR_COMMUNE.incendie, confiance: 'déduit' });
  out.push({ cle: 'secheresse', ...RISQUES_PAR_COMMUNE.secheresse, confiance: 'déduit' });
  return out;
}

/**
 * Chemin hiérarchique d'un objet : pays → … → objet.
 * Sert au fil d'Ariane du module et à la « profondeur de connaissance ».
 */
export function chemin(cible) {
  const c = typeof cible === 'string' ? { insee: cible } : (cible || {});
  const base = [
    { id: 'fr', nom: 'France', niveau: 'pays' },
    { id: 'fr-76', nom: 'Occitanie', niveau: 'region' },
    { id: 'fr-34', nom: 'Hérault', niveau: 'departement' },
    { id: AGGLO.id, nom: AGGLO.nom, niveau: 'epci' },
  ];
  const com = commune(c.insee);
  if (com) base.push({ id: `com-${com.insee}`, nom: com.nom, niveau: 'commune' });
  if (c.quartier) {
    const q = quartier(c.quartier);
    if (q) base.push({ id: q.id, nom: q.nom, niveau: 'quartier' });
  }
  return base;
}

/** Texte du fil d'Ariane : « FRANCE › OCCITANIE › … ». */
export function filAriane(cible, separateur = ' › ') {
  return chemin(cible).map((e) => e.nom).join(separateur);
}

/** Palette de la carte stratégique, du plus faible au plus fort. */
export const PALETTE = Object.freeze(['#16222e', '#1d3a4a', '#2a5d6e', '#3f8f92', '#6fc0a8', '#e3b24a']);

/**
 * Couleur de chloroplèthe d'une valeur dans une échelle [min, max].
 * Retourne une couleur de `PALETTE` ; `null` si la valeur n'est pas un nombre.
 */
export function couleurChoroplethe(valeur, min, max, palette = PALETTE) {
  if (!Number.isFinite(valeur)) return palette[0];
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return palette[palette.length - 1];
  const t = (valeur - min) / (max - min);
  const i = Math.min(palette.length - 1, Math.max(0, Math.round(t * (palette.length - 1))));
  return palette[i];
}

/** Bornes [min, max] d'une série de valeurs numériques. */
export function bornes(valeurs) {
  const nombres = (valeurs || []).filter((v) => Number.isFinite(v));
  if (!nombres.length) return { min: 0, max: 0 };
  return { min: Math.min(...nombres), max: Math.max(...nombres) };
}

/**
 * Projection équirectangulaire locale (suffisante pour poser des hexagones et
 * des points à l'échelle d'un département) → { x, y } en unités arbitraires.
 * `latRef` cale l'échelle verticale pour que la carte ne soit pas écrasée.
 */
export function projeter(lat, lon, { latRef = 43.45, lonRef = 3.7, echelle = 100 } = {}) {
  const k = Math.cos((latRef * Math.PI) / 180);
  return {
    x: (Number(lon) - lonRef) * k * echelle,
    y: -(Number(lat) - latRef) * echelle,
  };
}

/** Distance orthodromique en mètres (même formule que le hub CHANTIER). */
export function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Liens de vérification pour une commune (les sources officielles, sans clé). */
export function liensCommune(insee) {
  const c = commune(insee);
  if (!c) return [];
  return [
    { nom: `${c.nom} — dossier INSEE`, url: `https://www.insee.fr/fr/statistiques/2011101?geo=COM-${c.insee}` },
    { nom: 'Géorisques', url: 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi' },
    { nom: 'Géoportail (cadastre, ortho)', url: 'https://www.geoportail.gouv.fr/' },
    { nom: 'Cadastre Etalab (parcelles)', url: 'https://cadastre.data.gouv.fr/' },
    { nom: 'Annuaire de l’administration', url: `https://lannuaire.service-public.fr/recherche?q=${encodeURIComponent(c.nom)}` },
    { nom: 'Wikidata (entité à retrouver par nom)', url: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(c.nom)}&ns0=1` },
  ];
}
