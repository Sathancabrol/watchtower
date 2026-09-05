/**
 * WATCHTOWER — HUD CENTRAL : « je ne trouve plus mes boutons ».
 *
 * Le problème : l'interface est faite de ~30 blocs indépendants (barres,
 * panneaux, fenêtres) et CINQ mécanismes différents peuvent les masquer —
 * la vue propre (V), le HUD tactique (H), la veille (HUD qui s'efface),
 * la réduction automatique du dock, le mode vol compact. Quand un bloc
 * disparaît, rien n'indique qu'il existe, ni comment le faire revenir.
 *
 * La réponse, en trois pièces :
 *  1. **UN ŒIL TOUJOURS VISIBLE** (`#wt-hud-oeil`, en haut à gauche, et le
 *     logo WATCHTOWER) : un clic et TOUT le HUD revient, quoi qu'il soit
 *     arrivé. Impossible de perdre l'interface.
 *  2. **LA FENÊTRE « AFFICHAGE »** : la liste exhaustive de tous les blocs
 *     d'interface, chacun avec une case à cocher, une recherche, des
 *     préréglages (TOUT AFFICHER · ÉPURÉ · VOL · LECTURE) et l'état des cinq
 *     modes qui masquent l'écran. Réglages mémorisés.
 *  3. **LE HUD PROGRESSIF** (option) : au démarrage, l'écran est nu — seule
 *     la carte et l'œil ; un clic sur l'œil fait apparaître l'interface
 *     bloc par bloc, en cascade.
 *
 * Aucune dépendance à Cesium : ce module ne manipule que le DOM.
 */

import { appliquerPreset, cataloguer, filtrer, grouper, resumer } from './data/hudCatalogue.js';
import { rendreDeplacable } from './draggable.js';

const CLE = 'watchtower.hudCentral.v1';
/** Éléments qu'on ne propose jamais (carte, surcouches, ce panneau, l'œil). */
const IGNORES = new Set([
  'cesiumContainer', 'world-overlay-root', 'world-overlay-actions', 'loading-screen',
  'wt-hud-central', 'wt-hud-oeil', 'wt-veille-reveil', 'safe-frame-box', 'toast',
]);

const CSS = `
.wt-hud-off { display: none !important; }
#wt-hud-oeil {
  position: fixed; top: 6px; left: 6px; z-index: 9998;
  width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  background: rgba(6,12,20,0.72); color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.45); box-shadow: 0 0 12px rgba(0,212,255,0.25);
  transition: transform 160ms ease, background 160ms ease;
}
#wt-hud-oeil:hover { transform: scale(1.12); background: rgba(0,212,255,0.18); }
#wt-hud-oeil.cligne { animation: wt-oeil-pulse 1.6s ease-in-out infinite; }
@keyframes wt-oeil-pulse { 0%,100% { box-shadow: 0 0 0 rgba(0,212,255,0); } 50% { box-shadow: 0 0 18px rgba(0,212,255,0.7); } }
#wt-hud-central {
  position: fixed; left: 12px; top: 96px; z-index: 9990; width: min(360px, 94vw);
  max-height: 74vh; display: flex; flex-direction: column;
  background: rgba(6,10,18,0.94); color: #e8eaed;
  border: 1px solid rgba(0,212,255,0.4); border-radius: 10px;
  backdrop-filter: blur(10px); font-family: var(--font-mono, monospace); font-size: 10px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.55);
}
#wt-hud-central .hc-tete {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 8px 10px; cursor: grab; font-size: 9px; letter-spacing: 2px; font-weight: 700;
  color: #00d4ff; border-bottom: 1px solid rgba(0,212,255,0.22);
}
#wt-hud-central .hc-tete button { cursor: pointer; background: none; border: none; color: inherit; font-size: 13px; opacity: .6; }
#wt-hud-central .hc-tete button:hover { opacity: 1; }
#wt-hud-central .hc-corps { overflow-y: auto; padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 6px; }
#wt-hud-central .hc-chercher {
  width: 100%; padding: 6px 8px; border-radius: 6px; font-family: inherit; font-size: 10px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); color: #e8eaed;
}
#wt-hud-central .hc-rang { display: flex; flex-wrap: wrap; gap: 4px; }
#wt-hud-central .hc-btn {
  cursor: pointer; flex: 1 1 auto; padding: 6px 6px; border-radius: 6px;
  font-family: inherit; font-size: 8.5px; font-weight: 700; letter-spacing: 1px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.35); color: #00d4ff;
}
#wt-hud-central .hc-btn:hover { background: rgba(0,212,255,0.22); }
#wt-hud-central .hc-btn.fort { background: rgba(67,209,122,0.16); border-color: rgba(67,209,122,0.5); color: #7ee6a8; }
#wt-hud-central .hc-titre-groupe {
  margin-top: 4px; font-size: 8px; letter-spacing: 2px; opacity: .5; font-weight: 700;
}
#wt-hud-central .hc-item { display: flex; align-items: center; gap: 6px; padding: 2px 0; cursor: pointer; }
#wt-hud-central .hc-item span { flex: 1; }
#wt-hud-central .hc-item input { accent-color: #00d4ff; }
#wt-hud-central .hc-note { font-size: 8.5px; line-height: 1.5; opacity: .55; }
#wt-hud-central .hc-compte { font-size: 8.5px; opacity: .6; text-align: right; }
/* HUD progressif : au démarrage, l'écran est nu ; un clic sur l'œil révèle tout */
body.wt-hud-boot > *:not(#cesiumContainer):not(#world-overlay-root):not(#wt-hud-oeil):not(#title-bar) {
  opacity: 0 !important; pointer-events: none !important;
}
body.wt-hud-boot #title-bar { opacity: .85; pointer-events: auto; }
#wt-hud-indice {
  position: fixed; top: 46px; left: 8px; z-index: 9997; display: none;
  padding: 6px 9px; border-radius: 8px; font-family: var(--font-mono, monospace); font-size: 9px;
  background: rgba(0,212,255,0.14); border: 1px solid rgba(0,212,255,0.45); color: #bff0ff;
}
body.wt-hud-boot #wt-hud-indice { display: block; }
.wt-hud-revele { animation: wt-hud-entre 380ms ease both; }
@keyframes wt-hud-entre { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
`;

/** Les cinq mécanismes qui peuvent vider l'écran — et comment les piloter. */
export const MODES = [
  { id: 'propre', nom: 'Vue propre (touche V)', aide: 'masque tout sauf la carte' },
  { id: 'tactique', nom: 'HUD tactique (touche H)', aide: 'le HUD d’origine' },
  { id: 'veille', nom: 'Veille auto', aide: 'le HUD s’efface après 15 s sans contact' },
  { id: 'reduit', nom: 'Réduction auto du dock', aide: 'la barre du bas se replie' },
  { id: 'mobiglas', nom: 'Mode vol compact (touche M)', aide: 'fenêtres estompées en vol' },
];

/**
 * @param {{surMessage?:Function, activer?:Function}} [options]
 */
export function initHudCentral(options = {}) {
  const surMessage = typeof options.surMessage === 'function' ? options.surMessage : null;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── état ────────────────────────────────────────────────────────────────
  const lu = (() => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}') || {}; } catch { return {}; } })();
  const masques = new Set(Array.isArray(lu.masques) ? lu.masques : []);
  let progressif = lu.progressif === true;
  const modesActifs = new Set(Array.isArray(lu.modes) ? lu.modes : []);
  const sauver = () => {
    try {
      window.localStorage.setItem(CLE, JSON.stringify({
        masques: [...masques], progressif, modes: [...modesActifs],
      }));
    } catch { /* stockage plein */ }
  };

  // ── l'œil, toujours visible quoi qu'il arrive ──────────────────────────
  const oeil = document.createElement('button');
  oeil.type = 'button';
  oeil.id = 'wt-hud-oeil';
  oeil.title = 'AFFICHAGE — rouvre TOUT le HUD et ouvre les réglages (touche F2)';
  oeil.setAttribute('aria-label', 'Affichage : rouvre tout le HUD et ouvre les réglages');
  oeil.setAttribute('data-veille-exclu', '1');
  oeil.textContent = '👁';
  document.body.appendChild(oeil);

  const indice = document.createElement('div');
  indice.id = 'wt-hud-indice';
  indice.setAttribute('data-veille-exclu', '1');
  indice.textContent = '👁 Clique sur l’œil pour afficher l’interface';
  document.body.appendChild(indice);

  // ── la fenêtre de réglages ─────────────────────────────────────────────
  const el = document.createElement('aside');
  el.id = 'wt-hud-central';
  el.setAttribute('data-veille-exclu', '1');
  el.className = 'wt-hud-off';
  el.innerHTML = `
    <div class="hc-tete"><span>🖥 AFFICHAGE — TOUT LE HUD</span>
      <button type="button" title="Fermer">✕</button></div>
    <div class="hc-corps">
      <input class="hc-chercher" type="search" placeholder="🔍 chercher un bouton, une fenêtre…">
      <div class="hc-rang">
        <button class="hc-btn fort" data-p="reafficher">👁 TOUT RÉAFFICHER</button>
      </div>
      <div class="hc-rang">
        <button class="hc-btn" data-p="complet">TOUT AFFICHER</button>
        <button class="hc-btn" data-p="epure">ÉPURÉ</button>
        <button class="hc-btn" data-p="vol">VOL</button>
        <button class="hc-btn" data-p="lecture">LECTURE</button>
      </div>
      <div class="hc-titre-groupe">MODES QUI MASQUENT L’ÉCRAN</div>
      <div class="hc-modes"></div>
      <label class="hc-item"><input type="checkbox" class="hc-progressif"><span>🕰 HUD progressif au démarrage (écran nu → clic sur l’œil)</span></label>
      <div class="hc-liste"></div>
      <div class="hc-compte"></div>
      <div class="hc-note">Tout est mémorisé. L’œil en haut à gauche reste
        toujours visible : un clic et l’interface entière revient, même en
        vue propre ou après la veille.</div>
    </div>`;
  document.body.appendChild(el);
  const corps = el.querySelector('.hc-corps');
  const chercher = el.querySelector('.hc-chercher');
  const listeEl = el.querySelector('.hc-liste');
  const compteEl = el.querySelector('.hc-compte');
  const modesEl = el.querySelector('.hc-modes');
  const cbProgressif = el.querySelector('.hc-progressif');
  rendreDeplacable(el, el.querySelector('.hc-tete'));
  el.querySelector('.hc-tete button').addEventListener('click', () => basculer(false));

  // ── découverte des éléments ────────────────────────────────────────────
  function decouvrir() {
    const ids = new Set();
    for (const n of document.body.children) {
      if (!n.id || IGNORES.has(n.id)) continue;
      if (n.classList?.contains('wt-dock-panel')) continue; // pilotés par le dock
      ids.add(n.id);
    }
    for (const id of ['hud', 'wt-minimap', 'wt-panel', 'wt-intel', 'wt-fiche', 'wt-pins']) {
      if (document.getElementById(id)) ids.add(id);
    }
    return [...ids];
  }

  const elements = new Map(); // id → Element
  function resoudre(ids) {
    for (const id of ids) {
      const n = document.getElementById(id);
      if (n) elements.set(id, n);
    }
  }

  /**
   * Applique les cases à cocher.
   * @param {boolean} [deplier] déplie aussi les panneaux repliés de l'app
   *   d'origine (`panel-collapsible collapsed`) — utile pour « tout afficher »,
   *   jamais pour une case cochée une par une (l'utilisateur reste maître).
   */
  function appliquer(deplier = false) {
    for (const [id, n] of elements) {
      if (IGNORES.has(id)) continue;
      const masque = masques.has(id);
      n.classList.toggle('wt-hud-off', masque);
      if (deplier && !masque && n.classList.contains('panel-collapsible')) n.classList.remove('collapsed');
    }
  }

  // ── les cinq modes ─────────────────────────────────────────────────────
  const lireMode = (id) => {
    const g = window.__godsEyeView || {};
    if (id === 'propre') return document.body.classList.contains('ui-clean-view');
    if (id === 'tactique') return Boolean(document.getElementById('hud')?.classList.contains('active'));
    if (id === 'veille') return Boolean(g.veille?.estActif?.());
    if (id === 'reduit') return document.body.classList.contains('wt-hud-cache')
      || window.localStorage.getItem('watchtower.hudAuto.v1') === '1';
    if (id === 'mobiglas') return Boolean(g.mobiglas?.actif?.());
    return false;
  };

  const ecrireMode = (id, on) => {
    const g = window.__godsEyeView || {};
    if (id === 'propre') {
      const cible = on ? 'clean-view-toggle' : 'clean-view-exit';
      const b = document.getElementById(cible);
      if (b) b.click();
      else document.body.classList.toggle('ui-clean-view', on);
    } else if (id === 'tactique') {
      const hud = document.getElementById('hud');
      const actif = Boolean(hud?.classList.contains('active'));
      if (actif !== on) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
      }
    } else if (id === 'veille') {
      g.veille?.activer?.(on);
    } else if (id === 'reduit') {
      document.body.classList.toggle('wt-hud-cache', on);
      try { window.localStorage.setItem('watchtower.hudAuto.v1', on ? '1' : '0'); } catch { /* plein */ }
    } else if (id === 'mobiglas') {
      if (on) g.mobiglas?.activer?.(); else g.mobiglas?.desactiver?.();
    }
  };

  function rendreModes() {
    modesEl.innerHTML = MODES.map((m) => `<label class="hc-item" title="${m.aide}">
        <input type="checkbox" data-m="${m.id}"><span>${m.nom}</span></label>`).join('');
    for (const cb of modesEl.querySelectorAll('input[data-m]')) {
      cb.checked = lireMode(cb.dataset.m);
      cb.addEventListener('change', () => {
        ecrireMode(cb.dataset.m, cb.checked);
        sauver();
      });
    }
  }

  // ── rendu de la liste ──────────────────────────────────────────────────
  let items = [];
  function reconstruire() {
    const ids = decouvrir();
    resoudre(ids);
    items = cataloguer(ids, { visibles: ids.filter((i) => !masques.has(i)) });
  }

  function rendre() {
    const trouves = filtrer(items, chercher.value);
    listeEl.innerHTML = grouper(trouves).map((g) => `<div class="hc-titre-groupe">${g.nom}</div>`
      + g.items.map((i) => `<label class="hc-item"><input type="checkbox" data-i="${i.id}"${i.visible ? ' checked' : ''}>`
        + `<span>${i.icone} ${i.nom}</span></label>`).join('')).join('');
    for (const cb of listeEl.querySelectorAll('input[data-i]')) {
      cb.addEventListener('change', () => {
        if (cb.checked) masques.delete(cb.dataset.i); else masques.add(cb.dataset.i);
        const it = items.find((x) => x.id === cb.dataset.i);
        if (it) it.visible = cb.checked;
        appliquer();
        sauver();
        compteEl.textContent = resumer(items);
      });
    }
    compteEl.textContent = resumer(items);
    if (!trouves.length) listeEl.innerHTML = '<div class="hc-note">Rien ne correspond — essaye « dock », « carte », « vol »…</div>';
  }

  // ── révélation (l'œil) ─────────────────────────────────────────────────
  function reveler() {
    document.body.classList.remove('wt-hud-boot');
    // on sort de tous les modes qui vident l'écran
    for (const m of MODES) if (lireMode(m.id) && m.id !== 'tactique') ecrireMode(m.id, false);
    // on réveille la veille (opacité + pointeur) : sinon le HUD revient
    // « transparent » et on croit encore qu'il manque des boutons.
    document.documentElement.classList.remove('wt-veille-masque', 'wt-veille-active');
    document.documentElement.style.setProperty('--wt-veille', '1');
    try { window.__godsEyeView?.veille?.reveiller?.(); } catch { /* pas de veille */ }
    masques.clear();
    sauver();
    reconstruire();
    for (const it of items) it.visible = true;
    appliquer(true);
    // apparition en cascade : le HUD « se charge »
    let i = 0;
    for (const [id, n] of elements) {
      if (IGNORES.has(id) || n.classList.contains('wt-hud-off')) continue;
      n.classList.remove('wt-hud-revele');
      void n.offsetWidth; // force le redémarrage de l'animation
      n.style.animationDelay = `${Math.min(i, 14) * 45}ms`;
      n.classList.add('wt-hud-revele');
      i += 1;
    }
    if (surMessage) surMessage('👁 HUD réaffiché — la liste complète est dans « AFFICHAGE » (F2).');
    if (!el.classList.contains('wt-hud-off')) rendre();
    rendreModes();
    cbProgressif.checked = progressif;
  }

  function basculer(force) {
    const ouvert = force === undefined ? el.classList.contains('wt-hud-off') : force;
    if (ouvert) { reconstruire(); rendre(); rendreModes(); cbProgressif.checked = progressif; }
    el.classList.toggle('wt-hud-off', !ouvert);
  }

  oeil.addEventListener('click', () => {
    const nu = document.body.classList.contains('wt-hud-boot');
    reveler();
    if (!nu) basculer();
    else basculer(true);
  });
  // le logo WATCHTOWER (l'œil du titre) fait la même chose
  const logo = document.querySelector('#title-bar .title-logo, #title-bar h1');
  if (logo) {
    logo.style.pointerEvents = 'auto';
    logo.style.cursor = 'pointer';
    logo.title = 'Afficher / régler l’interface (F2)';
    logo.addEventListener('click', () => { reveler(); basculer(true); });
  }
  el.querySelector('[data-p="reafficher"]').addEventListener('click', reveler);
  for (const b of el.querySelectorAll('[data-p]')) {
    if (b.dataset.p === 'reafficher') continue;
    b.addEventListener('click', () => {
      items = appliquerPreset(items, b.dataset.p);
      masques.clear();
      for (const it of items) if (!it.visible) masques.add(it.id);
      appliquer(true);
      sauver();
      rendre();
    });
  }
  cbProgressif.addEventListener('change', () => {
    progressif = cbProgressif.checked;
    sauver();
    surMessage?.(progressif
      ? '🕰 HUD progressif activé : au prochain démarrage, l’écran sera nu — un clic sur l’œil fait apparaître l’interface.'
      : '🕰 HUD progressif désactivé : l’interface s’affichera entièrement au démarrage.');
  });
  chercher.addEventListener('input', rendre);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') { e.preventDefault(); basculer(); }
    else if (e.key === 'Escape' && !el.classList.contains('wt-hud-off')) basculer(false);
  });

  // ── démarrage ──────────────────────────────────────────────────────────
  reconstruire();
  appliquer();
  if (progressif) {
    document.body.classList.add('wt-hud-boot');
    oeil.classList.add('cligne');
  }
  // première visite (aucun réglage enregistré) : on dit où est l'œil, sinon
  // personne ne devine qu'il existe — c'est tout l'objet de ce module.
  if (!Object.keys(lu).length) {
    setTimeout(() => {
      if (surMessage) surMessage('👁 L’œil en haut à gauche rouvre TOUT le HUD '
        + 'et ouvre les réglages d’affichage (touche F2).');
    }, 2200);
  }

  return {
    element: el,
    oeil,
    ouvrir: () => basculer(true),
    fermer: () => basculer(false),
    basculer: () => basculer(),
    reveler,
    /** Cache un élément (id) — utilisable par les autres modules. */
    masquer: (id, on = true) => {
      if (on) masques.add(id); else masques.delete(id);
      appliquer();
      sauver();
    },
    rafraichir: () => { reconstruire(); rendre(); rendreModes(); },
    progressif: () => progressif,
    statistiques: () => ({ elements: items.length, masques: masques.size, progressif }),
  };
}
