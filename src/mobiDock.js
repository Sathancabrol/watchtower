/**
 * WATCHTOWER — dock MobiGlas : LE LANCEUR (toutes les fonctions, par
 * catégories et par préréglages).
 *
 * Pourquoi cette réécriture : avec une seule ligne de boutons, la barre
 * débordait sur plusieurs rangs et le rang du haut passait SOUS la barre
 * micro (`#command-dock`, calée à 72 px) — le bouton ✈ VOL devenait
 * invisible et inatteignable. Des modules entiers (cadastre, radio, trajets,
 * entités, cadrans, système, dispositifs…) n'avaient aucun bouton nulle part.
 *
 * Le dock devient donc un vrai lanceur, en trois étages :
 *  1. **les préréglages** (toujours visibles) : TOUT · EXPLORER · VOL ·
 *     CHANTIER · EXPERT · ÉPURÉ — chacun affiche les catégories utiles ;
 *  2. **les catégories** : une ligne par famille, avec son nom à gauche ;
 *  3. **les boutons** de la catégorie.
 *
 * Deux garanties :
 *  · **MODES fait partie de TOUS les préréglages** → ✈ VOL et 👁 AFFICHAGE
 *    restent toujours atteignables, quel que soit le préréglage choisi ;
 *  · **la hauteur du dock est publiée** dans `--wt-hauteur-dock` et la barre
 *    micro se cale AU-DESSUS : plus aucun bouton ne peut être recouvert.
 */

const ETAT_KEY = 'watchtower.dock.v1';
const HUD_AUTO_KEY = 'watchtower.hudAuto.v1';

import { rendreDeplacable } from './draggable.js';

/** Catégories par défaut (ordre d'affichage). */
export const GROUPES_DEFAUT = [
  { id: 'nav', nom: 'NAVIGATION' },
  { id: 'vues', nom: 'VUES' },
  { id: 'donnees', nom: 'DONNÉES' },
  { id: 'outils', nom: 'OUTILS' },
  { id: 'modes', nom: 'MODES' },
];

/**
 * Préréglages : quelles catégories montrer.
 * `null` = toutes. `modes` est dans tous les préréglages : c'est la règle
 * qui garantit que VOL et les réglages d'affichage ne disparaissent jamais.
 */
export const PRESETS_DEFAUT = [
  { id: 'tout', nom: 'TOUT', groupes: null },
  { id: 'explorer', nom: 'EXPLORER', groupes: ['nav', 'vues', 'modes'] },
  { id: 'vol', nom: 'VOL', groupes: ['nav', 'vues', 'modes'] },
  { id: 'chantier', nom: 'CHANTIER', groupes: ['nav', 'donnees', 'modes'] },
  { id: 'expert', nom: 'EXPERT', groupes: ['donnees', 'vues', 'outils', 'modes'] },
  { id: 'epure', nom: 'ÉPURÉ', groupes: ['modes'] },
];

const CSS = `
#wt-dock {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 960;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 4px 8px 7px;
  /* plafond : le lanceur ne doit jamais manger plus de la moitié de l'écran
     (sinon les panneaux ancrés partent au-dessus du bord haut) */
  max-height: 46vh; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;
  background: linear-gradient(180deg, rgba(5,8,14,0) 0%, rgba(5,8,14,0.88) 46%);
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  transition: transform 0.5s ease, opacity 0.5s ease;
}
#wt-dock > * { pointer-events: auto; }
#wt-dock .wt-dock-ligne {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 5px;
  max-width: 100%;
}
#wt-dock .wt-dock-presets { gap: 4px; }
#wt-dock .wt-dock-groupe {
  gap: 4px; padding: 2px 6px; border-radius: 8px;
  background: rgba(8,14,22,0.42); border: 1px solid rgba(0,212,255,0.10);
}
#wt-dock .wt-dock-gn {
  font-size: 7px; letter-spacing: 2px; font-weight: 700; opacity: .5;
  min-width: 62px; text-align: right; padding-right: 2px; white-space: nowrap;
}
.wt-dock-chip {
  cursor: pointer; padding: 3px 9px; border-radius: 999px; font-family: inherit;
  font-size: 7.5px; font-weight: 700; letter-spacing: 1.5px;
  background: rgba(10,16,24,0.8); color: rgba(232,234,237,0.7);
  border: 1px solid rgba(0,212,255,0.22);
}
.wt-dock-chip:hover { border-color: #00d4ff; color: #e8eaed; }
.wt-dock-sep { opacity: .3; font-size: 9px; }
.wt-dock-chip.actif {
  background: rgba(0,212,255,0.18); border-color: #00d4ff; color: #00d4ff;
  box-shadow: 0 0 10px rgba(0,212,255,0.3);
}
.wt-dock-btn {
  cursor: pointer; width: 58px; padding: 4px 2px 3px;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  background: rgba(10,16,24,0.82); color: var(--text-primary, #e8eaed);
  border: 1px solid rgba(0,212,255,0.28);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
}
.wt-dock-btn:hover { border-color: #00d4ff; transform: translateY(-2px); }
.wt-dock-btn .ic { font-size: 14px; line-height: 1; }
.wt-dock-btn .lb { font-size: 6.8px; letter-spacing: 1px; font-weight: 700; color: rgba(232,234,237,0.72); }
.wt-dock-btn.actif {
  background: rgba(0,212,255,0.14); border-color: #00d4ff;
  box-shadow: 0 0 12px rgba(0,212,255,0.32), inset 0 0 8px rgba(0,212,255,0.08);
}
.wt-dock-btn.actif .lb { color: #00d4ff; }
/* la barre micro se cale AU-DESSUS du dock, quelle que soit sa hauteur */
#command-dock { bottom: calc(var(--wt-hauteur-dock, 72px) + 8px) !important; transition: bottom .25s ease; }
/* panneaux ancrés (chat, autour…) */
.wt-dock-panel {
  position: fixed; bottom: min(calc(var(--wt-hauteur-dock, 72px) + 62px), 44vh); z-index: 955;
  width: min(360px, 92vw); max-height: 52vh; display: flex; flex-direction: column;
  background: rgba(8,12,20,0.92); color: var(--text-primary, #e8eaed);
  border: 1px solid rgba(0,212,255,0.35);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  backdrop-filter: blur(10px); font-family: var(--font-mono, monospace);
  animation: wt-dock-pop 160ms ease;
}
@keyframes wt-dock-pop { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
.wt-dock-panel.gauche { left: 12px; }
.wt-dock-panel.droite { right: 12px; }
.wt-dock-panel .wt-dock-titre {
  padding: 8px 12px; font-size: 9px; letter-spacing: 3px; font-weight: 700;
  color: #00d4ff; border-bottom: 1px solid rgba(0,212,255,0.2);
  display: flex; justify-content: space-between; align-items: center;
}
.wt-dock-panel .wt-dock-fermer {
  cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6);
  font-size: 12px; font-family: inherit; padding: 0 2px;
}
.wt-dock-panel .wt-dock-corps { overflow-y: auto; flex: 1; }
.wt-dock-cache { display: none !important; }
/* œil animé du bouton « ME LOCALISER » (logo de l'app) */
.wt-oeil { display: inline-block; animation: wt-oeil 3.4s ease-in-out infinite; }
@keyframes wt-oeil {
  0%, 52%, 100% { transform: none; }
  12% { transform: translateX(-3px); }
  30% { transform: translateX(3px); }
  68% { transform: scaleY(0.15); }
  74% { transform: none; }
}
body.wt-hud-cache #wt-dock { transform: translateY(130%); opacity: 0; pointer-events: none; }
body.wt-hud-cache #command-dock { opacity: 0; pointer-events: none; }
.wt-dock-replie .wt-dock-groupe { display: none; }
`;

function lireEtat() {
  try { return JSON.parse(window.localStorage.getItem(ETAT_KEY)) || {}; } catch { return {}; }
}
function ecrireEtat(etat) {
  try { window.localStorage.setItem(ETAT_KEY, JSON.stringify(etat)); } catch { /* plein */ }
}

/**
 * @param {object} opts
 * @param {Array} [opts.groupes] voir `GROUPES_DEFAUT`.
 * @param {Array} [opts.presets] voir `PRESETS_DEFAUT`.
 * @param {Array} opts.panneauxAncres panneaux fournis par l'app.
 * @param {Array} opts.panneauxExistants panneaux DOM existants basculés.
 */
export function initMobiDock({
  groupes = GROUPES_DEFAUT,
  presets = PRESETS_DEFAUT,
  panneauxAncres = [],
  panneauxExistants = [],
} = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'wt-dock';
  document.body.appendChild(dock);

  const etat = lireEtat();
  const ancres = new Map();
  const boutonsExistants = new Map();
  const rangs = new Map(); // id de catégorie → élément ligne

  const barrePresets = document.createElement('div');
  barrePresets.className = 'wt-dock-ligne wt-dock-presets';
  dock.appendChild(barrePresets);

  // ── catégories ─────────────────────────────────────────────────────────
  function rangDe(idGroupe) {
    if (rangs.has(idGroupe)) return rangs.get(idGroupe);
    const g = groupes.find((x) => x.id === idGroupe) || groupes[groupes.length - 1];
    const ligne = document.createElement('div');
    ligne.className = 'wt-dock-ligne wt-dock-groupe';
    ligne.dataset.groupe = g.id;
    const nom = document.createElement('span');
    nom.className = 'wt-dock-gn';
    nom.textContent = g.nom;
    ligne.appendChild(nom);
    dock.appendChild(ligne);
    rangs.set(g.id, ligne);
    return ligne;
  }

  function fermerAncres(sauf) {
    for (const [id, a] of ancres) {
      if (id === sauf) continue;
      a.wrap.classList.add('wt-dock-cache');
      a.btn.classList.remove('actif');
    }
  }

  /** Crée un bouton de dock standard. */
  function bouton({ icone, libelle, titre, surClic, classe = '' }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `wt-dock-btn ${classe}`.trim();
    btn.innerHTML = `<span class="ic">${icone}</span><span class="lb">${libelle}</span>`;
    if (titre) btn.title = titre;
    if (surClic) btn.addEventListener('click', surClic);
    return btn;
  }

  // toutes les catégories sont créées d'avance, dans l'ordre voulu
  for (const g of groupes) rangDe(g.id);

  // ── panneaux à ancre ───────────────────────────────────────────────────
  function creerAncre(p) {
    const wrap = document.createElement('div');
    wrap.className = `wt-dock-panel ${p.cote === 'droite' ? 'droite' : 'gauche'} wt-dock-cache`;
    wrap.id = `wt-dock-${p.id}`;
    wrap.innerHTML = `
      <div class="wt-dock-titre"><span>${p.titre}</span>
        <button class="wt-dock-fermer" title="Fermer">✕</button></div>
      <div class="wt-dock-corps"></div>`;
    wrap.querySelector('.wt-dock-corps').appendChild(p.element);
    document.body.appendChild(wrap);
    rendreDeplacable(wrap, wrap.querySelector('.wt-dock-titre'));

    const btn = bouton({
      icone: p.icone,
      libelle: p.libelle,
      titre: p.titre,
      surClic: () => {
        const ouvert = !wrap.classList.contains('wt-dock-cache');
        fermerAncres(p.id);
        wrap.classList.toggle('wt-dock-cache', ouvert);
        btn.classList.toggle('actif', !ouvert);
        if (!ouvert && typeof p.surOuverture === 'function') p.surOuverture();
      },
    });
    wrap.querySelector('.wt-dock-fermer').addEventListener('click', () => {
      wrap.classList.add('wt-dock-cache');
      btn.classList.remove('actif');
    });
    rangDe(p.groupe || 'outils').appendChild(btn);
    ancres.set(p.id, { wrap, btn });
    return { wrap, btn };
  }

  for (const p of panneauxAncres) creerAncre(p);

  function ouvrir(id) {
    const a = ancres.get(id);
    if (a && a.wrap.classList.contains('wt-dock-cache')) a.btn.click();
    return !!a;
  }
  function ouvrirExistant(cibleId) {
    const b = boutonsExistants.get(cibleId);
    if (b) b.click();
    return !!b;
  }

  // ── panneaux existants ─────────────────────────────────────────────────
  for (const p of panneauxExistants) {
    const cible = document.getElementById(p.cibleId);
    if (!cible) continue;
    const ouvert = etat[p.cibleId] === true;
    if (!ouvert) cible.classList.add('wt-dock-cache');
    const btn = bouton({
      icone: p.iconeHtml || p.icone,
      libelle: p.libelle,
      titre: p.titre || p.libelle,
      classe: ouvert ? 'actif' : '',
      surClic: () => {
        if (typeof p.surClic === 'function') p.surClic();
        const visible = !cible.classList.contains('wt-dock-cache');
        cible.classList.toggle('wt-dock-cache', visible);
        btn.classList.toggle('actif', !visible);
        btn.setAttribute('aria-pressed', String(!visible));
        const e2 = lireEtat();
        e2[p.cibleId] = !visible;
        ecrireEtat(e2);
      },
    });
    btn.setAttribute('aria-pressed', String(ouvert));
    boutonsExistants.set(p.cibleId, btn);
    rangDe(p.groupe || 'outils').appendChild(btn);
  }

  // ── préréglages + réduction ────────────────────────────────────────────
  let preset = typeof etat.preset === 'string' ? etat.preset : 'tout';
  let replie = etat.replie === true;
  /** Catégories affichées. Une pastille par catégorie permet de les remettre
   *  une à une : c'est le filet qui garantit que rien n'est jamais perdu. */
  const actifs = new Set(
    etat.groupes && typeof etat.groupes === 'object'
      ? groupes.filter((g) => etat.groupes[g.id] !== false).map((g) => g.id)
      : groupes.map((g) => g.id),
  );

  function rendreGroupes() {
    for (const [gid, ligne] of rangs) {
      ligne.style.display = actifs.has(gid) && ligne.children.length > 1 ? '' : 'none';
    }
    for (const c of barrePresets.querySelectorAll('.wt-dock-chip[data-groupe]')) {
      c.classList.toggle('actif', actifs.has(c.dataset.groupe));
    }
    for (const c of barrePresets.querySelectorAll('.wt-dock-chip[data-preset]')) {
      c.classList.toggle('actif', c.dataset.preset === preset);
    }
    dock.classList.toggle('wt-dock-replie', replie);
    const e2 = lireEtat();
    e2.preset = preset;
    e2.groupes = Object.fromEntries(groupes.map((g) => [g.id, actifs.has(g.id)]));
    ecrireEtat(e2);
    mesurer();
  }

  function appliquerPreset(id) {
    const pr = presets.find((x) => x.id === id) || presets[0];
    preset = pr.id;
    actifs.clear();
    for (const g of pr.groupes || groupes.map((x) => x.id)) actifs.add(g);
    rendreGroupes();
  }

  /** Bascule une catégorie (pastille) — jamais bloquée. */
  function basculerGroupe(id) {
    if (actifs.has(id)) actifs.delete(id); else actifs.add(id);
    preset = 'libre';
    rendreGroupes();
  }

  for (const p of presets) {
    const c = bouton({});
    c.className = `wt-dock-chip${p.id === preset ? ' actif' : ''}`;
    c.dataset.preset = p.id;
    c.textContent = p.nom;
    c.title = p.groupes ? `Catégories : ${p.groupes.join(', ')}` : 'Toutes les catégories';
    c.addEventListener('click', () => { replie = false; appliquerPreset(p.id); });
    barrePresets.appendChild(c);
  }

  const separateur = document.createElement('span');
  separateur.className = 'wt-dock-sep';
  separateur.textContent = '│';
  barrePresets.appendChild(separateur);
  for (const g of groupes) {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'wt-dock-chip';
    c.dataset.groupe = g.id;
    c.textContent = g.nom;
    c.title = `Afficher / masquer la catégorie ${g.nom}`;
    c.addEventListener('click', () => basculerGroupe(g.id));
    barrePresets.appendChild(c);
  }

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
  const btnHud = bouton({
    icone: '⤓', libelle: 'RÉDUIRE', classe: hudAuto ? 'actif' : '',
    titre: 'HUD auto-masqué après 9 s d’inactivité (bouge la souris pour le rappeler)',
    surClic: () => {
      hudAuto = !hudAuto;
      btnHud.classList.toggle('actif', hudAuto);
      try { window.localStorage.setItem(HUD_AUTO_KEY, hudAuto ? '1' : '0'); } catch { /* plein */ }
      if (hudAuto) document.body.classList.add('wt-hud-cache');
      else { document.body.classList.remove('wt-hud-cache'); if (hudTimer) window.clearTimeout(hudTimer); }
    },
  });
  barrePresets.appendChild(btnHud);
  btnHud.className = `wt-dock-chip${hudAuto ? ' actif' : ''}`;
  const btnReplier = bouton({
    icone: '▾', libelle: 'CACHER', classe: '',
    titre: 'Replier / déplier les catégories du lanceur',
    surClic: () => {
      replie = !replie;
      dock.classList.toggle('wt-dock-replie', replie);
      btnReplier.querySelector('.ic').textContent = replie ? '▸' : '▾';
      const e2 = lireEtat();
      e2.replie = replie;
      ecrireEtat(e2);
      mesurer();
    },
  });
  barrePresets.appendChild(btnReplier);
  btnReplier.className = 'wt-dock-chip';
  if (replie) btnReplier.querySelector('.ic').textContent = '▸';

  // ── hauteur publiée : la barre micro ne recouvre plus rien ──────────────
  function mesurer() {
    const h = Math.round(dock.getBoundingClientRect().height) || 72;
    document.documentElement.style.setProperty('--wt-hauteur-dock', `${h}px`);
  }
  mesurer();
  if (typeof ResizeObserver !== 'undefined') {
    try { new ResizeObserver(mesurer).observe(dock); } catch { /* ancien navigateur */ }
  }
  window.addEventListener('resize', mesurer);
  window.setTimeout(mesurer, 600);
  window.setTimeout(mesurer, 2500);

  appliquerPreset(preset);
  reveiller();

  return {
    dock,
    fermerAncres,
    ouvrir,
    ouvrirExistant,
    ajouter: (p) => creerAncre(p),
    /** Place un bouton déjà construit dans une catégorie. */
    ranger: (btn, idGroupe = 'outils') => { rangDe(idGroupe).appendChild(btn); mesurer(); },
    preset: () => preset,
    appliquerPreset,
    basculerGroupe,
    categories: () => [...actifs],
    mesurer,
  };
}
