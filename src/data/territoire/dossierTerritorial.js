/**
 * Dossier territorial — socle du hub INTEL.
 *
 * Comble trois lacunes de `docs/AUDIT.md` d'un seul coup :
 *   #3 drill-down de l'arborescence INTEL ;
 *   #4 « le Bloomberg de la ville » (croisement des données) ;
 *   #5 « analyse territoriale » (vue non câblée).
 *
 * Le modèle vient du rapport d'analyse territoriale de Frontignan
 * (monorepo `projects/frontignan`, 826 lignes, 249 sources) : l'entonnoir
 * **France → région → intercommunalité → ville → projet**. Ce module fournit la
 * structure ; les données d'une commune peuvent être fournies en dur (dossier
 * pré-instruit) ou construites depuis les API ouvertes déjà branchées.
 *
 * RÈGLE DE TRAÇABILITÉ (lacune #F de ta liste) : chaque fait porte une
 * `certitude` explicite. Rien n'est affirmé sans dire d'où ça vient.
 *
 * Fonctions pures : aucun accès réseau ni DOM.
 * @module data/territoire/dossierTerritorial
 */

/**
 * Niveaux de certitude, repris de la méthode du rapport Frontignan.
 * L'ordre est significatif : du plus sûr au plus fragile.
 */
export const CERTITUDES = Object.freeze({
  engage:   { cle: 'engage',   marque: '✅', libelle: 'Engagé',   rang: 4, infere: false },
  annonce:  { cle: 'annonce',  marque: '📅', libelle: 'Annoncé',  rang: 3, infere: false },
  tendance: { cle: 'tendance', marque: '🔮', libelle: 'Tendance', rang: 2, infere: true },
  incertain:{ cle: 'incertain',marque: '⚠️', libelle: 'Incertain',rang: 1, infere: true },
});

/** Les cinq échelles de l'entonnoir, du plus large au plus fin. */
export const ECHELLES = Object.freeze(['national', 'regional', 'intercommunal', 'communal', 'projet']);

/**
 * Normalise une certitude, quelle que soit la forme reçue.
 * @param {unknown} v - Clé, marque ou objet de certitude.
 * @returns {{cle:string,marque:string,libelle:string,rang:number,infere:boolean}} Certitude sûre.
 */
export function normaliserCertitude(v) {
  if (typeof v === 'string') {
    const parCle = CERTITUDES[v.toLowerCase()];
    if (parCle) return parCle;
    const parMarque = Object.values(CERTITUDES).find((c) => c.marque === v);
    if (parMarque) return parMarque;
  }
  if (v && typeof v === 'object' && CERTITUDES[v.cle]) return CERTITUDES[v.cle];
  return CERTITUDES.incertain;
}

/**
 * Compose un fait traçable. Un fait sans source ne peut pas être « engagé ».
 * @param {{libelle:string, valeur?:unknown, certitude?:unknown, sources?:string[], regle?:string}} brut
 * @returns {{libelle:string, valeur:unknown, certitude:object, sources:string[], regle:string|null, infere:boolean}|null}
 */
export function creerFait(brut) {
  const libelle = String(brut?.libelle ?? '').trim();
  if (!libelle) return null;
  const sources = Array.isArray(brut?.sources) ? brut.sources.filter((s) => typeof s === 'string' && s.trim()) : [];
  let certitude = normaliserCertitude(brut?.certitude);
  // Garde-fou : sans source, on ne peut pas prétendre à un fait établi.
  if (!sources.length && certitude.rang >= CERTITUDES.annonce.rang) certitude = CERTITUDES.tendance;
  return {
    libelle,
    valeur: brut?.valeur ?? null,
    certitude,
    sources,
    regle: typeof brut?.regle === 'string' && brut.regle.trim() ? brut.regle.trim() : null,
    infere: certitude.infere,
  };
}

/**
 * Rend un fait sous forme lisible, avec sa marque de certitude.
 * Les faits inférés sont préfixés par `~` — jamais présentés comme des mesures.
 * @param {object} fait - Fait créé par `creerFait`.
 * @returns {string} Ligne prête à afficher.
 */
export function rendreFait(fait) {
  if (!fait) return '';
  const val = fait.valeur === null || fait.valeur === undefined || fait.valeur === '' ? '' : ` : ${fait.valeur}`;
  const prefixe = fait.infere ? '~' : '';
  const suffixe = fait.infere
    ? ` — ${fait.certitude.libelle.toLowerCase()}${fait.regle ? ` (${fait.regle})` : ''}`
    : '';
  return `${fait.certitude.marque} ${prefixe}${fait.libelle}${val}${suffixe}`;
}

/**
 * Construit un nœud de l'arborescence INTEL (drill-down, lacune #3).
 * @param {{id:string, echelle:string, titre:string, faits?:object[], enfants?:object[], resume?:string}} brut
 * @returns {object|null} Nœud normalisé, ou null si inexploitable.
 */
export function creerNoeud(brut) {
  const id = String(brut?.id ?? '').trim();
  const titre = String(brut?.titre ?? '').trim();
  if (!id || !titre) return null;
  const echelle = ECHELLES.includes(brut?.echelle) ? brut.echelle : 'projet';
  const faits = (Array.isArray(brut?.faits) ? brut.faits : []).map(creerFait).filter(Boolean);
  const enfants = (Array.isArray(brut?.enfants) ? brut.enfants : []).map(creerNoeud).filter(Boolean);
  return {
    id,
    echelle,
    titre,
    resume: typeof brut?.resume === 'string' ? brut.resume : '',
    faits,
    enfants,
    // Un nœud est « ouvrable » s'il a de quoi montrer un niveau de plus.
    ouvrable: enfants.length > 0 || faits.length > 0,
  };
}

/**
 * Retrouve un nœud par son identifiant, à n'importe quelle profondeur.
 * @param {object} racine - Nœud de départ.
 * @param {string} id - Identifiant cherché.
 * @returns {object|null} Le nœud, ou null.
 */
export function trouverNoeud(racine, id) {
  if (!racine || !id) return null;
  if (racine.id === id) return racine;
  for (const e of racine.enfants || []) {
    const t = trouverNoeud(e, id);
    if (t) return t;
  }
  return null;
}

/**
 * Chemin de fer (fil d'Ariane) jusqu'à un nœud — indispensable au drill-down.
 * @param {object} racine - Nœud de départ.
 * @param {string} id - Identifiant cible.
 * @returns {object[]} Chemin de la racine à la cible (vide si absent).
 */
export function cheminVers(racine, id) {
  if (!racine) return [];
  if (racine.id === id) return [racine];
  for (const e of racine.enfants || []) {
    const sous = cheminVers(e, id);
    if (sous.length) return [racine, ...sous];
  }
  return [];
}

/**
 * Compte les faits par certitude sur tout un sous-arbre.
 * Sert l'honnêteté du hub : on voit d'un coup la part d'inféré.
 * @param {object} noeud - Racine du sous-arbre.
 * @returns {{total:number, parCertitude:Record<string,number>, partInferee:number}}
 */
export function bilanCertitude(noeud) {
  const parCertitude = { engage: 0, annonce: 0, tendance: 0, incertain: 0 };
  let total = 0;
  let inferes = 0;
  const parcourir = (n) => {
    if (!n) return;
    for (const f of n.faits || []) {
      total += 1;
      parCertitude[f.certitude.cle] += 1;
      if (f.infere) inferes += 1;
    }
    for (const e of n.enfants || []) parcourir(e);
  };
  parcourir(noeud);
  return { total, parCertitude, partInferee: total ? inferes / total : 0 };
}
