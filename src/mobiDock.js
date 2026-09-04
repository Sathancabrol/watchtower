/**
 * WATCHTOWER — dock MobiGlas.
 *
 * TOUTES les options passent EN BAS de l'écran, regroupées par catégories de
 * fonctions, dans un style « mobiGlas » (coins biseautés, cyan lumineux,
 * libellés majuscules). La barre principale LOCATION · VOICE · VISUEL reste
 * juste au-dessus, intacte.
 *
 *   💬 CHAT      → console de commandes textuelles (gratuit, sans clé)
 *   📍 AUTOUR    → lieux autour de toi (partage de localisation, gratuit)
 *   🗼 FRANCE    → panneau Watchtower FR (info vue, météo, domicile, vues, import, calques)
 *   🧠 INTEL     → HUD intel d'origine
 *   🎚 VISUEL+   → réglages visuels avancés
 *   🎛 PARAMS    → curseurs de paramètres
 *   ⚙ ACTIONS   → partager, réinitialiser la vue…
 *
 * Une seule catégorie « à panneau ancré » ouverte à la fois (chat/autour) ;
 * les panneaux d'origine se basculent indépendamment. Tout est mémorisé.
 */

const ETAT_KEY = 'watchtower.dock.v1';
const HUD_AUTO_KEY = 'watchtower.hudAuto.v1';

import { rendreDeplacable } from './draggable.js';

const CSS = `
#wt-dock {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 960;
  display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-end; gap: 7px;
  padding: 6px 10px 8px;
  background: linear-gradient(180deg, rgba(5,8,14,0) 0%, rgba(5,8,14,0.85) 55%);
  pointer-events: none;
  font-family: var(--font-mono, monospace);
}
.wt-dock-btn {
  pointer-events: auto; cursor: pointer; width: 74px; padding: 8px 4px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(10, 16, 24, 0.82); color: var(--text-primary, #e8eaed);
  border: 1px solid rgba(0, 212, 255, 0.28);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
}
.wt-dock-btn:hover { border-color: #00d4ff; transform: translateY(-2px); }
.wt-dock-btn .ic { font-size: 17px; line-height: 1; }
.wt-dock-btn .lb { font-size: 8px; letter-spacing: 1.5px; font-weight: 700; color: rgba(232,234,237,0.75); }
.wt-dock-btn.actif {
  background: rgba(0, 212, 255, 0.14); border-color: #00d4ff;
  box-shadow: 0 0 14px rgba(0, 212, 255, 0.35), inset 0 0 10px rgba(0, 212, 255, 0.08);
}
.wt-dock-btn.actif .lb { color: #00d4ff; }
/* la barre LOCATION/VOICE/VISUEL remonte au-dessus du dock */
#command-dock { bottom: 72px !important; }
/* panneaux ancrés (chat, autour) — au-dessus du dock, côté gauche/droit */
.wt-dock-panel {
  position: fixed; bottom: 78px; z-index: 955; width: min(360px, 92vw);
  max-height: 52vh; display: flex; flex-direction: column;
  background: rgba(8, 12, 20, 0.92); color: var(--text-primary, #e8eaed);
  border: 1px solid rgba(0, 212, 255, 0.35);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  backdrop-filter: blur(10px);
  font-family: var(--font-mono, monospace);
  animation: wt-dock-pop 160ms ease;
}
@keyframes wt-dock-pop { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
.wt-dock-panel.gauche { left: 12px; }
.wt-dock-panel.droite { right: 12px; }
.wt-dock-panel .wt-dock-titre {
  padding: 8px 12px; font-size: 9px; letter-spacing: 3px; font-weight: 700;
  color: #00d4ff; border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  display: flex; justify-content: space-between; align-items: center;
}
.wt-dock-panel .wt-dock-fermer {
  cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6);
  font-size: 12px; font-family: inherit; padding: 0 2px;
}
.wt-dock-panel .wt-dock-corps { overflow-y: auto; flex: 1; }
.wt-dock-cache { display: none !important; }
/* œil animé du bouton HQ (logo de l'app : il regarde autour puis cligne) */
.wt-oeil { display: inline-block; animation: wt-oeil 3.4s ease-in-out infinite; }
@keyframes wt-oeil {
  0%, 52%, 100% { transform: none; }
  12% { transform: translateX(-3px); }
  30% { transform: translateX(3px); }
  68% { transform: scaleY(0.15); }
  74% { transform: none; }
}
/* HUD auto-masquable : glisse élégamment hors de l'écran si inactif */
#wt-dock { transition: transform 0.5s ease, opacity 0.5s ease; }
#command-dock { transition: transform 0.5s ease, opacity 0.5s ease; }
body.wt-hud-cache #wt-dock { transform: translateY(130%); opacity: 0; pointer-events: none; }
body.wt-hud-cache #command-dock { transform: translate(-50%, 200%) !important; opacity: 0; pointer-events: none; }
`;

function lireEtat() {
  try { return JSON.parse(window.localStorage.getItem(ETAT_KEY)) || {}; } catch { return {}; }
}
function ecrireEtat(etat) {
  try { window.localStorage.setItem(ETAT_KEY, JSON.stringify(etat)); } catch { /* plein */ }
}

/**
 * @param {object} opts
 * @param {Array<{id,icone,libelle,titre,element,cote}>} opts.panneauxAncres
 *   Panneaux fournis par l'app (chat, autour…) affichés ancrés au dock.
 * @param {Array<{id,icone,libelle,cibleId}>} opts.panneauxExistants
 *   Panneaux DOM existants basculés en visibilité.
 */
export function initMobiDock({ panneauxAncres = [], panneauxExistants = [] } = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'wt-dock';
  document.body.appendChild(dock);

  const etat = lireEtat();
  const ancres = new Map(); // id → {wrap, btn}

  function fermerAncres(sauf) {
    for (const [id, a] of ancres) {
      if (id === sauf) continue;
      a.wrap.classList.add('wt-dock-cache');
      a.btn.classList.remove('actif');
    }
  }

  // ── catégories à panneau ancré (chat, autour…) ──
  for (const p of panneauxAncres) {
    const wrap = document.createElement('div');
    wrap.className = `wt-dock-panel ${p.cote === 'droite' ? 'droite' : 'gauche'} wt-dock-cache`;
    wrap.innerHTML = `
      <div class="wt-dock-titre"><span>${p.titre}</span>
        <button class="wt-dock-fermer" title="Fermer">✕</button></div>
      <div class="wt-dock-corps"></div>`;
    wrap.querySelector('.wt-dock-corps').appendChild(p.element);
    document.body.appendChild(wrap);
    rendreDeplacable(wrap, wrap.querySelector('.wt-dock-titre'));

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wt-dock-btn';
    btn.innerHTML = `<span class="ic">${p.icone}</span><span class="lb">${p.libelle}</span>`;
    btn.addEventListener('click', () => {
      const ouvert = !wrap.classList.contains('wt-dock-cache');
      fermerAncres(p.id);
      wrap.classList.toggle('wt-dock-cache', ouvert);
      btn.classList.toggle('actif', !ouvert);
      if (!ouvert && typeof p.surOuverture === 'function') p.surOuverture();
    });
    wrap.querySelector('.wt-dock-fermer').addEventListener('click', () => {
      wrap.classList.add('wt-dock-cache');
      btn.classList.remove('actif');
    });
    dock.appendChild(btn);
    ancres.set(p.id, { wrap, btn });
  }

  // ── ouverture programmatique : « chaque bouton envoie vers sa fenêtre » ──
  function ouvrir(id) {
    const a = ancres.get(id);
    if (a && a.wrap.classList.contains('wt-dock-cache')) a.btn.click();
    return !!a;
  }
  const boutonsExistants = new Map();
  function ouvrirExistant(cibleId) {
    const b = boutonsExistants.get(cibleId);
    if (b) b.click();
    return !!b;
  }

  // ── catégories basculant des panneaux DOM existants ──
  for (const p of panneauxExistants) {
    const cible = document.getElementById(p.cibleId);
    if (!cible) continue;
    const ouvert = etat[p.cibleId] === true; // défaut : replié (écran épuré)
    if (!ouvert) cible.classList.add('wt-dock-cache');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `wt-dock-btn${ouvert ? ' actif' : ''}`;
    btn.innerHTML = `<span class="ic">${p.iconeHtml || p.icone}</span><span class="lb">${p.libelle}</span>`;
    btn.setAttribute('aria-pressed', String(ouvert));
    boutonsExistants.set(p.cibleId, btn);
    btn.addEventListener('click', () => {
      if (typeof p.surClic === 'function') p.surClic();
      const visible = !cible.classList.contains('wt-dock-cache');
      cible.classList.toggle('wt-dock-cache', visible);
      btn.classList.toggle('actif', !visible);
      btn.setAttribute('aria-pressed', String(!visible));
      const e2 = lireEtat();
      e2[p.cibleId] = !visible;
      ecrireEtat(e2);
    });
    dock.appendChild(btn);
  }

  // ── réduction élégante du HUD : bouton ⤓ + auto-masquage si inactif ──
  let hudAuto = false;
  try { hudAuto = window.localStorage.getItem(HUD_AUTO_KEY) === '1'; } catch { /* défaut off */ }
  let hudTimer = null;
  const reveiller = () => {
    document.body.classList.remove('wt-hud-cache');
    if (hudTimer) window.clearTimeout(hudTimer);
    if (hudAuto) hudTimer = window.setTimeout(() => document.body.classList.add('wt-hud-cache'), 9000);
  };
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel']) {
    window.addEventListener(ev, reveiller, { passive: true });
  }
  const btnHud = document.createElement('button');
  btnHud.type = 'button';
  btnHud.className = `wt-dock-btn${hudAuto ? ' actif' : ''}`;
  btnHud.title = 'HUD auto-masqué après 9 s d\u2019inactivité (bouge la souris pour le rappeler)';
  btnHud.innerHTML = `<span class="ic">⤓</span><span class="lb">RÉDUIRE</span>`;
  btnHud.addEventListener('click', () => {
    hudAuto = !hudAuto;
    btnHud.classList.toggle('actif', hudAuto);
    try { window.localStorage.setItem(HUD_AUTO_KEY, hudAuto ? '1' : '0'); } catch { /* plein */ }
    if (hudAuto) document.body.classList.add('wt-hud-cache');
    else { document.body.classList.remove('wt-hud-cache'); if (hudTimer) window.clearTimeout(hudTimer); }
  });
  dock.appendChild(btnHud);
  reveiller();

  return { dock, fermerAncres, ouvrir, ouvrirExistant };
}
