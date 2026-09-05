/**
 * WATCHTOWER — DOSSIERS DU PALAIS MENTAL (arbre fouillable).
 *
 * Sur le mur du palais, chaque dossier est une carte (polaroïd, photo
 * aérienne, mugshot, plan, planche contact). On clique : le dossier
 * S'OUVRE et montre ses sous-éléments, et ainsi de suite **jusqu'au plus
 * petit élément**. Une recherche filtre l'arbre en direct.
 *
 * Ce module est **pur** : il normalise n'importe quel objet vivant de
 * l'application (un chantier, une analyse de commune, la liste des entités…)
 * en arbre de cartes, et sait le filtrer / l'aplatir. Aucun DOM, aucun Cesium.
 */

/** Types de cartes (voir `data/vignettes.js`). */
export const TYPES_CARTE = Object.freeze(['aerien', 'mugshot', 'polaroid', 'plan', 'video']);

/** Icône par défaut selon le type de carte. */
const IC_PAR_TYPE = Object.freeze({
  aerien: '🛰', mugshot: '🧑', polaroid: '📸', plan: '📐', video: '🎞',
});

/**
 * Normalise un nœud de dossier.
 * @param {{id?:string, nom?:string, type?:string, ic?:string, detail?:string,
 *          enfants?:Array, valeur?:any, action?:string}} brut
 * @param {number} [profondeur]
 */
export function noeud(brut = {}, profondeur = 0) {
  const b = brut && typeof brut === 'object' ? brut : {};
  const type = TYPES_CARTE.includes(String(b.type)) ? String(b.type) : 'polaroid';
  const enfants = Array.isArray(b.enfants) ? b.enfants.filter(Boolean) : [];
  return {
    id: String(b.id ?? b.nom ?? `n${Math.random().toString(36).slice(2, 8)}`),
    nom: String(b.nom ?? b.id ?? 'sans nom'),
    type,
    ic: String(b.ic || IC_PAR_TYPE[type] || '📸'),
    detail: b.detail == null ? '' : String(b.detail),
    valeur: b.valeur,
    action: typeof b.action === 'string' ? b.action : '',
    profondeur: Math.max(0, Math.round(profondeur)),
    enfants: enfants.map((e) => (e && e.enfants !== undefined ? noeud(e, profondeur + 1) : noeud(e, profondeur + 1))),
  };
}

/** Vrai si le nœud a des sous-éléments. */
export function aEnfants(n) { return Boolean(n?.enfants?.length); }

/**
 * Aplatit l'arbre (parcours en profondeur) — utile pour la recherche plein
 * texte : on retrouve le chemin menant à chaque élément.
 * @param {object} racine
 * @param {number} [max] profondeur maximale
 * @returns {Array<{noeud:object, chemin:Array<object>}>}
 */
export function aplatir(racine, max = 8) {
  const out = [];
  const aller = (n, chemin) => {
    if (!n) return;
    out.push({ noeud: n, chemin: chemin.slice() });
    if (chemin.length >= max) return;
    for (const e of n.enfants || []) aller(e, [...chemin, n]);
  };
  aller(racine, []);
  return out;
}

/** Minuscules sans accent — « tranchée » se cherche « tranchee ». */
export function normaliser(texte = '') {
  return String(texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Texte cherchable d'un nœud (nom + détail + id). */
export function texteDe(n) {
  return normaliser(`${n?.nom || ''} ${n?.detail || ''} ${n?.id || ''}`);
}

/**
 * Filtre l'arbre : ne garde que les branches contenant `recherche`.
 * @param {object|null} racine
 * @param {string} recherche
 * @returns {object|null} nouvelle racine filtrée (null si rien)
 */
export function filtrer(racine, recherche = '') {
  const q = normaliser(String(recherche || '').trim());
  if (!racine) return null;
  if (!q) return racine;
  const mots = q.split(/\s+/).filter(Boolean);
  const garder = (n) => {
    if (!n) return null;
    const enfants = (n.enfants || []).map(garder).filter(Boolean);
    const soi = mots.every((m) => texteDe(n).includes(m));
    if (soi) return { ...n, enfants: (n.enfants || []).map(garder).filter(Boolean) };
    if (enfants.length) return { ...n, enfants };
    return null;
  };
  return garder(racine);
}

/** Compte les éléments (feuilles comprises) d'un nœud. */
export function compter(n) {
  if (!n) return 0;
  return 1 + (n.enfants || []).reduce((t, e) => t + compter(e), 0);
}

/** Descend jusqu'au nœud d'identifiant donné. */
export function trouver(racine, id) {
  if (!racine) return null;
  if (racine.id === id) return racine;
  for (const e of racine.enfants || []) {
    const t = trouver(e, id);
    if (t) return t;
  }
  return null;
}

/** Type de carte deviné depuis un nom (pour un rendu parlant). */
export function typeSelonNom(nom = '') {
  const n = String(nom).toLowerCase();
  if (/chantier|zone|parcelle|phasage|terrain|emprise/.test(n)) return 'plan';
  if (/photo|aerien|aérien|vue|image|drone|scan/.test(n)) return 'aerien';
  if (/equipe|équipe|personne|personnel|ouvrier|conducteur|contact|témoin/.test(n)) return 'mugshot';
  if (/video|vidéo|timelapse|film|animation|séquence/.test(n)) return 'video';
  return 'polaroid';
}

/**
 * Convertit un OBJET VIVANT de l'application en arbre de cartes.
 * Les tableaux/objets deviennent des branches, les valeurs simples des fiches.
 * C'est ce qui permet d'ouvrir n'importe quoi (un chantier, une analyse…) sur
 * le tableau du palais et de descendre jusqu'au plus petit élément.
 *
 * @param {any} valeur
 * @param {{nom?:string, type?:string, profondeur?:number, max?:number}} [options]
 */
export function depuisObjet(valeur, options = {}) {
  const max = Math.max(1, Math.round(options.max ?? 5));
  const construire = (v, nom, profondeur) => {
    const type = options.type && profondeur === 0 ? options.type : typeSelonNom(String(nom || ''));
    if (v == null) return noeud({ nom: String(nom || '—'), detail: '∅ vide', type, valeur: v }, profondeur);
    if (typeof v !== 'object') {
      // une valeur simple : elle sert de nom (« Karim »), le détail reste vide
      // quand c'est redondant
      const nomF = String(nom || v);
      const detail = String(v) === nomF ? '' : String(v);
      return noeud({ nom: nomF, detail, type: 'polaroid', valeur: v }, profondeur);
    }
    if (profondeur >= max) {
      return noeud({ nom: String(nom || '…'), detail: `${compacter(v)}`, type, valeur: v }, profondeur);
    }
    if (Array.isArray(v)) {
      return noeud({
        nom: `${nom || 'liste'} (${v.length})`,
        type, valeur: v,
        enfants: v.slice(0, 60).map((e, i) => construire(e, libelleDe(e) || `${nom || 'élément'} ${i + 1}`, profondeur + 1)),
      }, profondeur);
    }
    const cles = Object.keys(v);
    return noeud({
      nom: String(nom || 'dossier'),
      type, valeur: v,
      enfants: cles.slice(0, 60).map((k) => construire(v[k], k, profondeur + 1)),
    }, profondeur);
  };
  return construire(valeur, options.nom || 'dossier', 0);
}

/** Nom lisible d'un élément de liste (objet nommé, ou valeur brute). */
export function libelleDe(v) {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v);
  return nomDe(v);
}

/** Nom lisible d'un élément de liste (si c'est un objet). */
export function nomDe(v) {
  if (v == null) return '';
  if (typeof v !== 'object') return '';
  for (const k of ['nom', 'name', 'titre', 'title', 'libelle', 'id']) {
    const s = v[k];
    if (typeof s === 'string' && s.trim()) return s.trim();
    if (typeof s === 'number') return String(s);
  }
  return '';
}

/** Résumé compact d'une valeur (pour les feuilles profondes). */
export function compacter(v) {
  try {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s && s.length > 120 ? `${s.slice(0, 119)}…` : (s || '∅');
  } catch {
    return '∅';
  }
}

/**
 * Regroupe plusieurs dossiers en une seule racine « MUR ».
 * @param {Array<object>} dossiers
 * @param {string} [titre]
 */
export function mur(dossiers = [], titre = 'PALAIS MENTAL') {
  return noeud({
    id: 'racine',
    nom: titre,
    type: 'plan',
    ic: '🗂',
    detail: `${dossiers.length} dossier(s)`,
    enfants: dossiers.filter(Boolean).map((d) => noeud(d, 1)),
  });
}
