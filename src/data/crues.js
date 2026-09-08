/**
 * Vigicrues — vigilance crues officielle (SCHAPI / ministère de la Transition écologique).
 * Source gratuite, sans clé, licence ouverte. Complète Géorisques (aléa) par le TEMPS RÉEL.
 * Ce module ne contient que des fonctions PURES : le réseau passe par /api/vigicrues.
 * @module data/crues
 */

/** Couleurs officielles de la vigilance crues (1=vert … 4=rouge). */
export const NIVEAUX_CRUE = {
  1: { cle: 'vert',   libelle: 'Pas de vigilance particulière', couleur: '#3ea55b' },
  2: { cle: 'jaune',  libelle: 'Risque de crue sans gravité',   couleur: '#e8c341' },
  3: { cle: 'orange', libelle: 'Crue génératrice de débordements', couleur: '#e08a2e' },
  4: { cle: 'rouge',  libelle: 'Crue majeure, menace directe',  couleur: '#cf3b3b' },
};

/**
 * Normalise un niveau Vigicrues en entier 1..4.
 * @param {unknown} v - Valeur brute (nombre ou chaîne).
 * @returns {number|null} Niveau borné, ou null si illisible.
 */
export function normaliserNiveau(v) {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : v;
  if (!Number.isFinite(n)) return null;
  const e = Math.trunc(n);
  return e >= 1 && e <= 4 ? e : null;
}

/**
 * Décrit un niveau pour l'affichage.
 * @param {unknown} v - Niveau brut.
 * @returns {{niveau:number, cle:string, libelle:string, couleur:string}|null}
 */
export function decrireNiveau(v) {
  const n = normaliserNiveau(v);
  return n === null ? null : { niveau: n, ...NIVEAUX_CRUE[n] };
}

/**
 * Extrait les tronçons d'une réponse Vigicrues JSON-LD, quelle que soit la clé de liste.
 * @param {any} charge - Corps JSON déjà analysé.
 * @returns {Array<object>} Tronçons bruts (jamais null).
 */
export function extraireTroncons(charge) {
  if (!charge || typeof charge !== 'object') return [];
  for (const cle of ['TronVigiCru', 'TronconVigiCru', 'tronconVigiCru', 'features']) {
    const v = charge[cle];
    if (Array.isArray(v)) return v;
  }
  const premier = Object.values(charge).find((v) => Array.isArray(v) && v.length && typeof v[0] === 'object');
  return Array.isArray(premier) ? premier : [];
}

/**
 * Convertit un tronçon brut en enregistrement stable pour la carte.
 * @param {object} t - Tronçon Vigicrues.
 * @returns {{id:string, nom:string, niveau:number, cle:string, libelle:string, couleur:string}|null}
 */
export function normaliserTroncon(t) {
  if (!t || typeof t !== 'object') return null;
  const p = t.properties && typeof t.properties === 'object' ? t.properties : t;
  const d = decrireNiveau(p.NivInfoVigiCru ?? p.niveau ?? p.NivSituVigiCru);
  if (!d) return null;
  const id = String(p.CdEntVigiCru ?? p.gid ?? p.id ?? '').trim();
  const nom = String(p.LbEntVigiCru ?? p.nom ?? p.label ?? '').trim();
  if (!id && !nom) return null;
  return { id: id || nom, nom: nom || id, ...d };
}

/**
 * Normalise une réponse complète et trie du plus grave au moins grave.
 * @param {any} charge - Corps JSON Vigicrues.
 * @returns {Array<object>} Tronçons exploitables, triés par gravité décroissante.
 */
export function normaliserReponse(charge) {
  return extraireTroncons(charge)
    .map(normaliserTroncon)
    .filter(Boolean)
    .sort((a, b) => b.niveau - a.niveau);
}

/**
 * Résume l'état national pour le bandeau du HUD.
 * @param {Array<object>} troncons - Tronçons normalisés.
 * @returns {{max:number, total:number, parNiveau:Record<number,number>, texte:string}}
 */
export function resumerVigilance(troncons) {
  const liste = Array.isArray(troncons) ? troncons : [];
  const parNiveau = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let max = 0;
  for (const t of liste) {
    const n = normaliserNiveau(t?.niveau);
    if (n === null) continue;
    parNiveau[n] += 1;
    if (n > max) max = n;
  }
  const surveilles = parNiveau[2] + parNiveau[3] + parNiveau[4];
  const texte = max <= 1
    ? 'Crues : aucune vigilance en cours'
    : `Crues : ${NIVEAUX_CRUE[max].libelle.toLowerCase()} — ${surveilles} tronçon${surveilles > 1 ? 's' : ''} surveillé${surveilles > 1 ? 's' : ''}`;
  return { max, total: liste.length, parNiveau, texte };
}
