/**
 * WATCHTOWER — FENÊTRES : déplacer, redimensionner, changer de forme.
 *
 * Toutes les fenêtres flottantes de l'app peuvent être :
 *  · DÉPLACÉES (poignée = barre de titre — reprend `rendreDeplacable`) ;
 *  · REDIMENSIONNÉES (poignée native en bas à droite, `resize: both`) ;
 *  · MISES EN FORME (⚙ : normale → compacte → large → bandeau → pilule) ;
 *  · MÉMORISÉES : position, taille et forme sont sauvées par fenêtre
 *    (localStorage) et restaurées au démarrage suivant ; un bouton ⟲ remet
 *    la géométrie d'origine.
 *
 * Aucune dépendance à Cesium.
 */

import { rendreDeplacable } from './draggable.js';

const CLE = 'watchtower.fenetres.v1';

/** Formes disponibles : largeur/hauteur/rayon/échelle du texte. */
export const FORMES = Object.freeze({
  normale: { nom: 'normale', ic: '⚙', largeur: null, hauteur: null, rayon: null, echelle: 1 },
  compacte: { nom: 'compacte', ic: '▢', largeur: 190, hauteur: null, rayon: 8, echelle: 0.9 },
  large: { nom: 'large', ic: '▭', largeur: 420, hauteur: null, rayon: 12, echelle: 1.05 },
  bandeau: { nom: 'bandeau', ic: '▬', largeur: 520, hauteur: 74, rayon: 10, echelle: 0.95 },
  pilule: { nom: 'pilule', ic: '⬭', largeur: 240, hauteur: 40, rayon: 20, echelle: 0.85 },
});
const ORDRE = ['normale', 'compacte', 'large', 'bandeau', 'pilule'];

const CSS = `
.wt-fen-poignee {
  position: absolute; right: 1px; bottom: 1px; width: 13px; height: 13px;
  cursor: nwse-resize; z-index: 5; opacity: 0.55;
  background: linear-gradient(135deg, transparent 45%, currentColor 45%, currentColor 55%, transparent 55%, transparent 70%, currentColor 70%, currentColor 80%, transparent 80%);
}
.wt-fen-forme {
  position: absolute; top: 2px; cursor: pointer; z-index: 6; padding: 0 3px;
  background: none; border: none; color: inherit; opacity: 0.5; font-size: 10px; line-height: 1;
  font-family: var(--font-mono, monospace);
}
.wt-fen-forme:hover { opacity: 1; }
`;

function lireTout() {
  try { return JSON.parse(window.localStorage.getItem(CLE) || '{}') || {}; } catch { return {}; }
}

function ecrireTout(tout) {
  try { window.localStorage.setItem(CLE, JSON.stringify(tout)); } catch { /* plein */ }
}

/** Géométrie courante d'une fenêtre (ce qu'on sauvegarde). */
export function geometrie(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: Math.round(r.left),
    top: Math.round(r.top),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

/**
 * Applique une forme prédéfinie. `normale` restaure les dimensions d'origine
 * (celles relevées au premier enregistrement).
 * @param {HTMLElement} el
 * @param {string} forme
 * @param {{largeur?:number, hauteur?:number}} [origine]
 */
export function appliquerForme(el, forme, origine = {}) {
  if (!el) return forme;
  const f = FORMES[forme] ? forme : 'normale';
  const def = FORMES[f];
  if (def.largeur) el.style.width = `${def.largeur}px`;
  else if (origine.largeur) el.style.width = `${origine.largeur}px`;
  else el.style.width = '';
  if (def.hauteur) { el.style.height = `${def.hauteur}px`; el.style.maxHeight = `${def.hauteur}px`; }
  else if (def.largeur && origine.hauteur) { el.style.height = ''; el.style.maxHeight = ''; }
  else { el.style.maxHeight = ''; if (!def.largeur) el.style.height = ''; }
  el.style.borderRadius = def.rayon ? `${def.rayon}px` : '';
  el.style.fontSize = def.echelle !== 1 ? `calc(1em * ${def.echelle})` : '';
  el.style.transition = 'width .18s ease, height .18s ease, border-radius .18s ease';
  return f;
}

/**
 * Rend une fenêtre déplaçable, redimensionnable, transformable et mémorisée.
 *
 * @param {HTMLElement} el
 * @param {object} [options]
 * @param {string} [options.cle] Identifiant de mémorisation (sinon l'id).
 * @param {HTMLElement} [options.poignee] Barre de titre (sinon tout l'élément).
 * @param {boolean} [options.formes=true] Ajoute le bouton ⚙ de forme.
 * @param {boolean} [options.redimensionnable=true]
 * @param {number} [options.minW=150]
 * @param {number} [options.minH=48]
 */
export function amenagerFenetre(el, options = {}) {
  if (!el) return null;
  const {
    cle = el.id || el.className,
    poignee = null,
    formes = true,
    redimensionnable = true,
    minW = 150,
    minH = 48,
  } = options;
  if (!document.getElementById('wt-fen-style')) {
    const style = document.createElement('style');
    style.id = 'wt-fen-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const origine = { largeur: Math.round(el.getBoundingClientRect().width) || null, hauteur: null };
  const sauver = () => {
    const tout = lireTout();
    tout[cle] = { ...geometrie(el), forme: el.dataset.wtForme || 'normale' };
    ecrireTout(tout);
  };
  const restaurer = () => {
    const g = lireTout()[cle];
    if (!g) return;
    if (Number.isFinite(g.left) && Number.isFinite(g.top)) {
      el.style.left = `${Math.max(0, g.left)}px`;
      el.style.top = `${Math.max(0, g.top)}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = 'none';
    }
    if (Number.isFinite(g.width)) el.style.width = `${g.width}px`;
    if (Number.isFinite(g.height) && !g.forme) el.style.height = `${g.height}px`;
    if (g.forme && g.forme !== 'normale') appliquerForme(el, g.forme, origine);
    el.dataset.wtForme = g.forme || 'normale';
  };

  rendreDeplacable(el, poignee);
  if (redimensionnable) {
    el.style.resize = 'both';
    el.style.overflow = 'auto';
    el.style.minWidth = `${minW}px`;
    el.style.minHeight = `${minH}px`;
  }
  if (formes) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'wt-fen-forme';
    bouton.title = 'Changer la forme de la fenêtre (normale · compacte · large · bandeau · pilule)';
    bouton.textContent = '⚙';
    // le bouton se cale à gauche de la poignée de la barre de titre
    bouton.style.right = '18px';
    bouton.addEventListener('click', (e) => {
      e.stopPropagation();
      const actuel = el.dataset.wtForme || 'normale';
      const suivant = ORDRE[(ORDRE.indexOf(actuel) + 1) % ORDRE.length];
      el.dataset.wtForme = appliquerForme(el, suivant, origine);
      bouton.textContent = FORMES[el.dataset.wtForme].ic;
      sauver();
    });
    if (poignee) poignee.appendChild(bouton);
    else el.appendChild(bouton);
    // double-clic sur le bouton ⟲ : géométrie d'origine
    bouton.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const tout = lireTout();
      delete tout[cle];
      ecrireTout(tout);
      el.dataset.wtForme = appliquerForme(el, 'normale', origine);
      el.style.width = ''; el.style.height = ''; el.style.left = ''; el.style.top = '';
      bouton.textContent = '⚙';
    });
  }

  // mémorisation : au relâchement du pointeur + périodiquement
  const finGeste = () => sauver();
  el.addEventListener('pointerup', finGeste);
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => sauver());
    ro.observe(el);
  }
  restaurer();
  return { sauver, restaurer, geometrie: () => geometrie(el) };
}

/**
 * Aménage plusieurs fenêtres d'un coup (sélecteurs CSS).
 * @param {Array<string|{selecteur:string, poignee?:string, cle?:string}>} cibles
 */
export function amenagerFenetres(cibles = []) {
  const resultats = [];
  for (const c of cibles) {
    const selecteur = typeof c === 'string' ? c : c.selecteur;
    const el = document.querySelector(selecteur);
    if (!el) continue;
    const poignee = typeof c === 'string' ? null : (c.poignee ? el.querySelector(c.poignee) : null);
    const r = amenagerFenetre(el, { cle: typeof c === 'string' ? undefined : c.cle, poignee });
    if (r) resultats.push(r);
  }
  return resultats;
}

export function oublierGeometries() {
  try { window.localStorage.removeItem(CLE); } catch { /* ok */ }
}
