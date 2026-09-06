/**
 * WATCHTOWER — MODE HISTORIQUE (données pures, testables sans navigateur).
 *
 * Position : le mode historique ne doit rien inventer et rien coûter.
 * Il lit les dates DÉJÀ présentes dans OpenStreetMap (`start_date`,
 * `building:start_date`, `end_date`…) sur les bâtiments que WATCHTOWER
 * affiche déjà en 3D. Aucune clé, aucun service payant : les données
 * viennent de la même source ouverte (ODbL) que le bâti.
 *
 * Quand la date manque (c'est le cas de la grande majorité des bâtiments),
 * on ne simule rien par défaut : le bâtiment est rangé dans « non daté »
 * et masqué. Une option distincte — « ESTIMER LES DATES MANQUANTES » —
 * propose une répartition statistique calculée à partir des bâtiments
 * datés ; elle est TOUJOURS signalée comme hypothèse (`estimee: true`),
 * jamais mélangée aux dates réelles, pour la traçabilité.
 */

/** Balises OSM lues pour savoir quand un bâtiment est apparu. */
export const CLES_DATE_DEBUT = [
  'start_date',
  'building:start_date',
  'construction:date',
  'construction:start_date',
  'construction',
  'built',
  'established',
];

/** Balises OSM lues pour savoir quand un bâtiment a disparu. */
export const CLES_DATE_FIN = [
  'end_date',
  'building:end_date',
  'demolished:date',
  'demolition:date',
  'destroyed:date',
  'ruins:date',
];

/** Découpage lisible + palette « vieux → récent » (terre cuite → bleu actuel). */
export const PERIODES = [
  { id: 'inconnue', nom: 'Non daté', debut: null, fin: null, couleur: '#77828e', toit: '#4d545c' },
  { id: 'avant1800', nom: 'Avant 1800', debut: -10000, fin: 1799, couleur: '#6d4c34', toit: '#3d2b1d' },
  { id: 'xix', nom: 'XIXᵉ siècle', debut: 1800, fin: 1899, couleur: '#8a6338', toit: '#4d3620' },
  { id: 'belle', nom: '1900-1944', debut: 1900, fin: 1944, couleur: '#a17a41', toit: '#5c4425' },
  { id: 'trente', nom: '1945-1974', debut: 1945, fin: 1974, couleur: '#9c8a52', toit: '#574d2e' },
  { id: 'finxx', nom: '1975-1999', debut: 1975, fin: 1999, couleur: '#6f8a5e', toit: '#3d4d33' },
  { id: 'xxi', nom: 'Depuis 2000', debut: 2000, fin: 3000, couleur: '#48a9e6', toit: '#1d5b8c' },
];

/** Époques exprimées en mots clés (OSM accepte du texte libre). */
const MOTS_EPOQUES = [
  [/^(antiquit|romain|roman|gallo)/, [-400, 500]],
  [/^(moyen|mediev|médiév)/, [500, 1500]],
  [/^(renaissance)/, [1450, 1650]],
  [/^(classique|^xvii|^xviii)/, [1600, 1800]],
  [/^(moderne|contemporain)/, [1900, 3000]],
];

/** Chiffres romains utiles aux siècles (I → XXI). */
const ROMAINS = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19,
  xx: 20, xxi: 21,
};

/** Qualités possibles d'une date lue. */
export const QUALITES = {
  exacte: 'date exacte',
  decennie: 'décennie',
  siecle: 'siècle',
  approchee: 'approchée (±10 ans)',
  intervalle: 'intervalle',
  avant: 'existait déjà avant',
  apres: 'construit après',
  extraite: 'année extraite du texte',
  estimee: 'HYPOTHÈSE — date estimée',
  inconnue: 'non daté',
};

const norm = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const quatre = (s) => {
  const m = String(s).match(/(-?\d{3,4})/);
  return m ? Number(m[1]) : null;
};

/**
 * Lit une date OSM (texte libre) et la convertit en bornes exploitables.
 *
 * @param {string} brut valeur de la balise (`1850`, `1850s`, `C19`, `~1850`,
 *   `before 1900`, `1850..1870`, `1850-06-12`, `médiéval`…).
 * @returns {{debut:number|null, fin:number|null, qualite:string, brut:string}}
 *   `debut`/`fin` valent `null` quand elles sont inconnues : `null` au début
 *   signifie « existait déjà à l'ouverture de la fenêtre temporelle ».
 */
export function anneeDepuisBalise(brut) {
  const texte = norm(brut);
  const base = { debut: null, fin: null, qualite: 'inconnue', brut: String(brut ?? '').trim() };
  if (!texte) return base;

  // « 1850..1870 », « 1850-1870 », « 1850 à 1870 » (mais pas la date ISO).
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(texte)) {
    const morceaux = texte.split(/\.\.|[–—]|(?:\s+à\s+)|(?:\s+a\s+)|(?:\s+to\s+)|(?:\s*-\s*)|(?:\s*\/\s*)/).map((m) => m.trim());
    const bornes = morceaux.map(quatre).filter((n) => Number.isFinite(n));
    if (bornes.length >= 2) {
      const a = Math.min(bornes[0], bornes[1]);
      const b = Math.max(bornes[0], bornes[1]);
      if (b - a <= 400) return { ...base, debut: a, fin: b, qualite: 'intervalle' };
    }
  }

  const iso = texte.match(/^(\d{4})-\d{1,2}-\d{1,2}$/);
  if (iso) return { ...base, debut: Number(iso[1]), qualite: 'exacte' };

  // « avant / jusqu'à / before 1900 » → existait déjà à cette date.
  const avant = texte.match(/^(?:avant|before|pre|jusqu['’]?a|jusqu['’]?en|<)\s*(?:en\s*)?(-?\d{3,4})/);
  if (avant) return { ...base, fin: Number(avant[1]), qualite: 'avant' };

  // « après / after 1900 » → apparu après.
  const apres = texte.match(/^(?:apres|après|after|post|>)\s*(?:en\s*)?(-?\d{3,4})/);
  if (apres) return { ...base, debut: Number(apres[1]), qualite: 'apres' };

  // « 1850s », « années 1850 »
  const dec = texte.match(/^(?:annees|années|an)?\s*(-?\d{3,4})s$/);
  if (dec) return { ...base, debut: Number(dec[1]), qualite: 'decennie' };

  // « C19 », « 19e siècle », « 19th century »
  const cent1 = texte.match(/^c\.?\s*(\d{1,2})$/);
  const cent2 = texte.match(/^(\d{1,2})(?:e|er|ere|ère|eme|ème|th|st|nd|rd)?\s*(?:siecle|s\.|century)$/);
  const cent = cent1 || cent2;
  if (cent) {
    const c = Number(cent[1]);
    if (c >= 1 && c <= 21) return { ...base, debut: (c - 1) * 100 + 1, fin: c * 100, qualite: 'siecle' };
  }

  // « ~1850 », « vers 1850 », « circa 1850 »
  const appr = texte.match(/^(?:~|env|environ|vers|ca\.?|c\.?|circa|about|around)\s*(?:en\s*)?(-?\d{3,4})/);
  if (appr) return { ...base, debut: Number(appr[1]) - 10, qualite: 'approchee' };

  // « 1850 » tout court
  const simple = texte.match(/^(-?\d{3,4})$/);
  if (simple) return { ...base, debut: Number(simple[1]), qualite: 'exacte' };

  // « XIXe siècle », « xviii e »
  const romain = texte.match(/^(m{0,2}|cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})e?(?:\s*(?:siecle|s\.|century))?$/);
  const chiffre = romain ? `${romain[1]}${romain[2]}${romain[3]}` : '';
  if (chiffre && ROMAINS[chiffre]) {
    const c = ROMAINS[chiffre];
    return { ...base, debut: (c - 1) * 100 + 1, fin: c * 100, qualite: 'siecle' };
  }

  const mot = MOTS_EPOQUES.find(([re]) => re.test(texte));
  if (mot) return { ...base, debut: mot[1][0], fin: mot[1][1], qualite: 'intervalle' };

  const an = quatre(texte);
  if (Number.isFinite(an) && an > -3000 && an < 3000) return { ...base, debut: an, qualite: 'extraite' };

  return base;
}

/** Première balise non vide trouvée dans les tags OSM. */
export function lireBalise(tags, cles) {
  const t = tags || {};
  for (const c of cles || []) {
    const v = t[c];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return '';
}

/** Période (couleur, nom) contenant une année — `inconnue` si non daté. */
export function periodeDe(debut, fin) {
  if (!Number.isFinite(debut) && !Number.isFinite(fin)) {
    return PERIODES.find((p) => p.id === 'inconnue');
  }
  const a = Number.isFinite(debut) ? debut : (Number.isFinite(fin) ? -10000 : null);
  if (a === null) return PERIODES.find((p) => p.id === 'inconnue');
  return PERIODES.find((p) => p.id !== 'inconnue' && a >= p.debut && a <= p.fin)
    || PERIODES.find((p) => p.id === 'inconnue');
}

/** Nom lisible d'une qualité de date (pour l'infobulle / la fiche). */
export function nomQualite(q) {
  return QUALITES[q] || QUALITES.inconnue;
}

/**
 * Analyse une liste de lots (issus de `batiRapide`) : date de début, de fin,
 * période et statistiques. Ne modifie pas les lots reçus.
 *
 * @param {Array<object>} lots lots 3D (avec leurs `tags` OSM).
 * @returns {{lots:Array, dates:Array, nonDates:Array, total:number,
 *   parPeriode:Record<string,number>, min:number, max:number, sources:string[]}}
 */
export function analyser(lots, options = {}) {
  const maintenant = Number(options.maintenant) || new Date().getFullYear();
  const liste = (lots || []).map((lot) => {
    const brut = lireBalise(lot.tags, CLES_DATE_DEBUT);
    const brutFin = lireBalise(lot.tags, CLES_DATE_FIN);
    const d = anneeDepuisBalise(brut);
    const f = anneeDepuisBalise(brutFin);
    const datee = Boolean(brut) && d.qualite !== 'inconnue';
    const periode = periodeDe(d.debut, d.fin ?? null);
    return {
      ...lot,
      debut: d.debut ?? null,
      fin: d.fin ?? (Number.isFinite(f.debut) ? f.debut : null),
      qualite: d.qualite,
      brutDate: brut,
      brutFin,
      datee,
      estimee: false,
      periode: periode.id,
    };
  });
  const dates = liste.filter((l) => l.datee);
  const annees = dates.map((l) => l.debut).filter((n) => Number.isFinite(n));
  const min = Math.min(1800, annees.length ? Math.floor(Math.min(...annees) / 10) * 10 : 1800);
  const max = Math.max(maintenant, annees.length ? Math.ceil(Math.max(...annees) / 10) * 10 : maintenant);
  const parPeriode = {};
  for (const p of PERIODES) parPeriode[p.id] = 0;
  for (const l of liste) parPeriode[l.periode] = (parPeriode[l.periode] || 0) + 1;
  const sources = dates.length ? ['start_date OSM (ODbL)'] : [];
  return {
    lots: liste,
    dates,
    nonDates: liste.filter((l) => !l.datee),
    total: liste.length,
    parPeriode,
    min,
    max,
    sources,
  };
}

/**
 * Lots existants à une année donnée.
 *
 * @param {object} analyse sortie de `analyser`.
 * @param {number} annee
 * @param {{inclureNonDates?:boolean, inclureEstimes?:boolean}} [options]
 */
export function visiblesA(analyse, annee, options = {}) {
  const { inclureNonDates = false, inclureEstimes = false } = options || {};
  const a = Number(annee);
  if (!Number.isFinite(a)) return [];
  return (analyse?.lots || []).filter((lot) => {
    if (a < (lot.debut ?? -Infinity)) return false;
    if (lot.fin != null && a > lot.fin) return false;
    if (lot.estimee && !inclureEstimes) return false;
    if (!lot.datee && !lot.estimee && !inclureNonDates) return false;
    return true;
  });
}

/** Décennie (multiple de 10) d'une année ; `null` si non daté. */
export function decennieDe(annee) {
  if (!Number.isFinite(annee)) return null;
  return Math.floor(annee / 10) * 10;
}

/**
 * Regroupe les lots par décennie (et sépare datés / estimés / non datés)
 * pour construire une primitive Cesium par groupe : changer d'année revient
 * alors à afficher/masquer quelques primitives, sans reconstruire la scène.
 */
export function groupesParDecennie(analyse, options = {}) {
  const { pas = 10 } = options || {};
  const groupes = new Map();
  for (const lot of analyse?.lots || []) {
    const brut = Number.isFinite(lot.debut) ? lot.debut : (Number.isFinite(lot.fin) ? analyse.min : null);
    const cle = brut == null
      ? 'inconnue'
      : `${Math.floor(brut / pas) * pas}|${lot.estimee ? 'estime' : 'date'}`;
    if (!groupes.has(cle)) {
      const periode = periodeDe(Number.isFinite(lot.debut) ? lot.debut : null, null);
      groupes.set(cle, {
        cle,
        decennie: brut == null ? null : Math.floor(brut / pas) * pas,
        estime: Boolean(lot.estimee),
        periode: periode.id,
        couleur: periode.couleur,
        toit: periode.toit,
        lots: [],
      });
    }
    groupes.get(cle).lots.push(lot);
  }
  return [...groupes.values()].sort((a, b) => (a.decennie ?? Infinity) - (b.decennie ?? Infinity));
}

/** Groupes à afficher pour une année (clés de `groupesParDecennie`). */
export function groupesVisibles(groupes, annee, options = {}) {
  const { inclureNonDates = false, inclureEstimes = false } = options || {};
  return (groupes || []).filter((g) => {
    if (g.decennie == null) return inclureNonDates;
    if (g.estime && !inclureEstimes) return false;
    return annee >= g.decennie;
  });
}

/**
 * Courbe de croissance (cumul des constructions par pas de temps).
 * @returns {Array<{annee:number, presents:number, construits:number}>}
 */
export function courbeCroissance(analyse, options = {}) {
  const pas = Number(options.pas) || 10;
  const debut = Math.floor((Number(options.debut) || analyse?.min || 1800) / pas) * pas;
  const fin = Number(options.fin) || analyse?.max || new Date().getFullYear();
  const out = [];
  for (let a = debut; a <= fin; a += pas) {
    const presents = visiblesA(analyse, a, { inclureNonDates: false, inclureEstimes: false }).length;
    const construits = (analyse?.lots || []).filter((l) => l.datee && (l.debut ?? -Infinity) === a).length;
    out.push({ annee: a, presents, construits });
  }
  return out;
}

/** Petit générateur pseudo-aléatoire déterministe (graine → suite stable). */
function pseudo(graine) {
  let x = (Number(graine) || 1) >>> 0 || 1;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

/**
 * HYPOTHÈSE (désactivée par défaut) : attribue une année aux bâtiments non
 * datés en suivant la répartition observée des bâtiments datés. Les lots
 * concernés sont marqués `estimee: true` — jamais confondus avec une vraie
 * date OSM, pour rester traçable.
 */
export function estimerNonDates(analyse, options = {}) {
  const graine = Number(options.graine) || 7;
  const maintenant = Number(options.maintenant) || new Date().getFullYear();
  if (!analyse?.nonDates?.length) return analyse;
  const modele = (analyse.dates || [])
    .map((l) => l.debut)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const tirer = pseudo(graine);
  const lots = (analyse.lots || []).map((lot) => {
    if (lot.datee) return lot;
    const annee = modele.length >= 2
      ? modele[Math.min(modele.length - 1, Math.floor(tirer() * modele.length))]
      : Math.round(analyse.min + tirer() * Math.max(1, analyse.max - analyse.min));
    const per = periodeDe(annee, null);
    return { ...lot, debut: annee, estimee: true, qualite: 'estimee', periode: per.id, hypothese: 'répartition statistique' };
  });
  const dates = lots.filter((l) => l.datee);
  const estimes = lots.filter((l) => l.estimee);
  const parPeriode = {};
  for (const p of PERIODES) parPeriode[p.id] = 0;
  for (const l of lots) parPeriode[l.periode] = (parPeriode[l.periode] || 0) + 1;
  return {
    ...analyse,
    lots,
    dates,
    nonDates: lots.filter((l) => !l.datee && !l.estimee),
    estimes,
    parPeriode,
    max: Math.max(analyse.max, maintenant),
  };
}

/** Phrase de statut affichée sous le curseur d'année. */
export function resumer(analyse, annee, visibles = null, options = {}) {
  const n = visibles ? visibles.length : visiblesA(analyse, annee, options).length;
  const dates = analyse?.dates?.length || 0;
  const estimes = (analyse?.lots || []).filter((l) => l.estimee).length;
  const nonDates = (analyse?.lots || []).filter((l) => !l.datee && !l.estimee).length;
  const morceaux = [`En <b>${Math.round(annee)}</b> : <b>${n}</b> bâtiment${n > 1 ? 's' : ''} debout`];
  morceaux.push(`${dates} daté${dates > 1 ? 's' : ''} par OSM`);
  if (estimes) morceaux.push(`${estimes} estimé${estimes > 1 ? 's' : ''} (hypothèse)`);
  if (!options.inclureNonDates && nonDates) morceaux.push(`${nonDates} non daté${nonDates > 1 ? 's' : ''} masqué${nonDates > 1 ? 's' : ''}`);
  return morceaux.join(' · ');
}
