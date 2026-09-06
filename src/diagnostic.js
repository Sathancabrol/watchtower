/**
 * WATCHTOWER — DIAGNOSTIC DE DÉMARRAGE.
 *
 * Pourquoi ce module : l'application est assemblée à la main dans
 * `main.js` (une trentaine de modules initialisés à la suite). Quand une
 * pièce manque à l'écran, il est impossible de savoir **où** la chaîne s'est
 * rompue sans regarder la console du navigateur — et l'utilisateur n'a pas
 * cette console sous les yeux.
 *
 * Ce module fait trois choses :
 *
 *  1. **capture les erreurs** le plus tôt possible (`window.onerror`,
 *     `unhandledrejection`, `console.error`) : si un module jette au
 *     démarrage, TOUT ce qui suit dans `main.js` ne sera jamais créé — c'est
 *     la cause n°1 des « le bouton ne fait plus rien » ;
 *  2. **dresse l'inventaire** : chaque module attendu dans
 *     `window.__godsEyeView`, chaque élément DOM attendu, les boutons
 *     réellement dans le lanceur, l'état des cinq mécanismes qui peuvent
 *     vider l'écran (vue propre, mode tactique, veille, HUD réduit,
 *     mobiGlas) ;
 *  3. **répare** : « TOUT RÉAFFICHER » neutralise les cinq mécanismes d'un
 *     coup, « RÉINITIALISER L'AFFICHAGE » efface les réglages mémorisés, et
 *     « COPIER LE RAPPORT » met le diagnostic dans le presse-papier pour
 *     coller dans un ticket.
 *
 * Raccourci : **F3**.
 */

/** Modules attendus dans `window.__godsEyeView` (clé → description courte). */
export const ATTENDUS = {
  viewer: 'visionneuse 3D',
  dock: 'lanceur du bas',
  hudCentral: 'fenêtre AFFICHAGE',
  theme: 'peau néon',
  boussole: 'ruban de cap',
  minimap: 'minicarte globe',
  medaillons: 'médaillons de lieu 360°',
  calques: 'liste des calques',
  nomsLieux: 'noms de lieux',
  localisation: 'localisation',
  fiche: 'fiche lieu',
  poste: 'poste (lieux, historique, favoris)',
  intel: 'tableau INTEL',
  intelVues: 'vues INTEL élargies',
  bati: 'bâtiments 3D',
  cadastre: 'cadastre + routes',
  entites: 'entités de la carte',
  cadrans: 'cadrans de commune',
  dispositifs: 'caméras & capteurs',
  radio: 'radios',
  trajets: 'itinéraires',
  systeme: 'système solaire',
  chantier: 'hub chantier',
  vol: 'mode pilotage',
  historique: 'mode historique',
  mobiglas: 'affichage vol',
  cockpit: 'cockpit',
  veille: 'veille (auto-masquage)',
  comptes: 'comptes & clés',
  palais: 'palais mental',
  assistant: 'assistant',
  cinematique: 'cinématique & rendu vidéo',
};

/** Éléments DOM qui doivent exister. */
export const DOM_ATTENDUS = [
  ['#cesiumContainer', 'la carte 3D'],
  ['#wt-dock', 'le lanceur du bas'],
  ['#command-dock', 'barre LOCATION/VOICE/VISUEL'],
  ['#intel-hud', 'bandeau d’info live'],
  ['#wt-panel', 'panneau WATCHTOWER · FR'],
  ['#wt-intel', 'fenêtre INTEL'],
  ['#wt-minimap', 'minicarte'],
  ['#wt-hud-central', 'fenêtre AFFICHAGE'],
  ['#wt-hud-oeil', 'l’œil du logo'],
  ['#pp-toggles', 'réglages visuels'],
  ['#param-slider-panel', 'curseurs de paramètres'],
  ['#top-center-actions', 'actions'],
];

/** Les cinq mécanismes qui peuvent vider l'écran — et comment les annuler. */
export const MECANISMES = [
  {
    id: 'propre', nom: 'Vue propre', test: () => document.body.classList.contains('ui-clean-view'),
    texte: () => document.body.classList.contains('ui-clean-view'),
  },
  {
    id: 'tactique', nom: 'Mode tactique', test: () => Boolean(document.getElementById('hud')?.classList.contains('active')),
    texte: () => Boolean(document.getElementById('hud')?.classList.contains('active')),
  },
  {
    id: 'veille', nom: 'Veille', test: () => Boolean(window.__godsEyeView?.veille?.estActif?.()),
    texte: () => Boolean(window.__godsEyeView?.veille?.estActif?.()),
  },
  {
    id: 'reduit', nom: 'HUD réduit', test: () => document.body.classList.contains('wt-hud-cache')
      || window.localStorage.getItem('watchtower.hudAuto.v1') === '1',
    texte: () => document.body.classList.contains('wt-hud-cache'),
  },
  {
    id: 'mobiglas', nom: 'Affichage vol', test: () => Boolean(window.__godsEyeView?.mobiglas?.actif?.()),
    texte: () => Boolean(window.__godsEyeView?.mobiglas?.actif?.()),
  },
];

const erreurs = [];
let installe = false;

/**
 * Installe la capture d'erreurs. À appeler **au tout début** du démarrage,
 * avant l'init des modules : sinon une erreur de démarrage reste invisible.
 */
export function capturerErreurs() {
  if (installe || typeof window === 'undefined') return erreurs;
  installe = true;
  window.addEventListener('error', (e) => {
    erreurs.push({ quand: new Date().toISOString(), type: 'error', message: String(e?.message || e), source: e?.filename || '', ligne: e?.lineno || 0, pile: String(e?.error?.stack || '').slice(0, 600) });
  });
  window.addEventListener('unhandledrejection', (e) => {
    erreurs.push({ quand: new Date().toISOString(), type: 'promise', message: String(e?.reason?.message || e?.reason || ''), pile: String(e?.reason?.stack || '').slice(0, 600) });
  });
  const original = console.error;
  console.error = (...args) => {
    erreurs.push({ quand: new Date().toISOString(), type: 'console.error', message: args.map((a) => (a && a.message) || String(a)).join(' ').slice(0, 400) });
    original.apply(console, args);
  };
  return erreurs;
}

/** Les erreurs capturées (tableau vivant). */
export function erreursCapturees() { return erreurs.slice(); }

/** L'inventaire complet, sous forme de objet sérialisable. */
export function rapport() {
  const g = window.__godsEyeView || {};
  const modules = Object.fromEntries(Object.entries(ATTENDUS).map(([k, d]) => [k, { description: d, present: Boolean(g[k]) }]));
  const dom = Object.fromEntries(DOM_ATTENDUS.map(([sel, d]) => [sel, { description: d, present: Boolean(document.querySelector(sel)) }]));
  const dockBtns = [...document.querySelectorAll('#wt-dock .wt-dock-btn')].map((b) => b.querySelector('.lb')?.textContent || '?');
  return {
    quand: new Date().toISOString(),
    modules,
    modulesManquants: Object.entries(modules).filter(([, v]) => !v.present).map(([k]) => k),
    dom,
    domManquants: Object.entries(dom).filter(([, v]) => !v.present).map(([k]) => k),
    lanceur: { boutons: dockBtns.length, libelles: dockBtns },
    mecanismes: Object.fromEntries(MECANISMES.map((m) => [m.id, Boolean(m.test())])),
    erreurs: erreursCapturees(),
    stockage: Object.fromEntries(Object.keys(window.localStorage || {})
      .filter((k) => k.startsWith('watchtower'))
      .map((k) => [k, String(window.localStorage.getItem(k) || '').slice(0, 200)])),
  };
}

/**
 * Remet TOUT à l'écran : neutralise les cinq mécanismes de masquage,
 * déplie les panneaux de l'app, libère le bandeau live, remontre le
 * lanceur et ses catégories, et vide les masques mémorisés.
 * @returns {string[]} la liste des actions effectuées (traçabilité)
 */
export function toutReafficher() {
  const fait = [];

  document.body.classList.remove('ui-clean-view');
  fait.push('vue propre désactivée');

  document.getElementById('hud')?.classList.remove('active');
  fait.push('mode tactique désactivé');

  try { window.__godsEyeView?.veille?.arreter?.(); } catch { /* absent */ }
  document.body.classList.remove('wt-veille-active', 'wt-veille-masque');
  document.documentElement.classList.remove('wt-veille-masque');
  document.documentElement.style.setProperty('--wt-veille', '1');
  fait.push('veille arrêtée');

  document.body.classList.remove('wt-hud-cache');
  try { window.localStorage.setItem('watchtower.hudAuto.v1', '0'); } catch { /* plein */ }
  fait.push('HUD réduit désactivé');

  try { if (window.__godsEyeView?.mobiglas?.actif?.()) window.__godsEyeView.mobiglas.ouvrir?.(); } catch { /* absent */ }
  fait.push('affichage vol quitté');

  // bandeau d'info live : intelTwin le masque en !important au démarrage
  const bandeau = document.getElementById('intel-hud');
  if (bandeau) {
    bandeau.style.removeProperty('display');
    bandeau.style.display = '';
    fait.push('bandeau d’info live réaffiché');
  }

  // éléments masqués par la fenêtre AFFICHAGE
  for (const n of document.querySelectorAll('.wt-hud-off')) n.classList.remove('wt-hud-off');
  try {
    window.localStorage.setItem('watchtower.hudCentral.v1', JSON.stringify({ masques: [], progressif: false, modes: [] }));
  } catch { /* plein */ }
  window.__godsEyeView?.hudCentral?.appliquer?.(true);
  window.__godsEyeView?.hudCentral?.reveler?.();
  fait.push('masques AFFICHAGE levés');

  // panneaux de l'app d'origine repliés
  for (const n of document.querySelectorAll('.panel-collapsible.collapsed')) n.classList.remove('collapsed');
  fait.push('panneaux dépliés');

  // lanceur : toutes les catégories
  const dock = window.__godsEyeView?.dock;
  if (dock?.appliquerPreset) { dock.appliquerPreset('tout'); fait.push('lanceur : toutes les catégories'); }

  // vitres masquées par le lanceur (INTEL, PARAMS, ACTIONS…)
  for (const cible of ['wt-intel', 'pp-toggles', 'param-slider-panel', 'top-center-actions', 'wt-panel', 'wt-pins', 'wt-minimap']) {
    document.getElementById(cible)?.classList.remove('wt-dock-cache');
  }
  try {
    const etat = JSON.parse(window.localStorage.getItem('watchtower.dock.v1') || '{}');
    etat.replie = false;
    etat.preset = 'tout';
    window.localStorage.setItem('watchtower.dock.v1', JSON.stringify(etat));
  } catch { /* plein */ }
  fait.push('vitres du lanceur rouvertes');

  return fait;
}

/** Efface les réglages d'affichage mémorisés, puis recharge. */
export function reinitialiserAffichage() {
  for (const k of Object.keys(window.localStorage || {})) {
    if (/^watchtower\.(hudCentral|dock|hudAuto|veille)\./.test(k)) {
      try { window.localStorage.removeItem(k); } catch { /* plein */ }
    }
  }
  window.location.reload();
}

const CSS = `
#wt-diag {
  position: fixed; z-index: 990; right: 12px; top: 64px; width: min(420px, 94vw);
  max-height: 76vh; display: none; flex-direction: column;
  background: rgba(6,10,18,0.96); color: #e8eaed; border: 1px solid rgba(0,212,255,0.4);
  border-radius: 10px; font-family: var(--font-mono, monospace); font-size: 11px;
  box-shadow: 0 18px 50px rgba(0,0,0,0.65);
}
#wt-diag.ouvert { display: flex; }
#wt-diag .dg-tete {
  display: flex; justify-content: space-between; align-items: center; gap: 6px;
  padding: 8px 10px; border-bottom: 1px solid rgba(0,212,255,0.25);
  font-size: 10px; letter-spacing: 2px; font-weight: 700; color: #00d4ff;
}
#wt-diag .dg-corps { overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
#wt-diag .dg-rang { display: flex; flex-wrap: wrap; gap: 4px; }
#wt-diag button {
  cursor: pointer; padding: 6px 8px; border-radius: 7px; font-family: inherit; font-size: 9px;
  font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.12);
  border: 1px solid rgba(0,212,255,0.35); color: #00d4ff;
}
#wt-diag button:hover { background: rgba(0,212,255,0.26); }
#wt-diag button.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); color: rgba(232,234,237,0.8); }
#wt-diag .dg-k { font-size: 8px; letter-spacing: 2px; opacity: .5; margin-top: 4px; }
#wt-diag .dg-ligne { display: flex; justify-content: space-between; gap: 6px; line-height: 1.5; }
#wt-diag .dg-ok { color: #7dff4a; }
#wt-diag .dg-ko { color: #ff6f6f; font-weight: 700; }
#wt-diag .dg-err { color: #ffb040; font-size: 9px; line-height: 1.45; word-break: break-word; }
#wt-diag pre {
  margin: 0; max-height: 130px; overflow: auto; font-size: 8.5px; line-height: 1.4;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); padding: 6px; border-radius: 6px;
}
`;

/**
 * @param {{surMessage?:Function}} [options]
 */
export function initDiagnostic(options = {}) {
  const surMessage = typeof options.surMessage === 'function' ? options.surMessage : null;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-diag';
  el.innerHTML = `
    <div class="dg-tete"><span>🐞 DIAGNOSTIC — ÉTAT DE L’APPLICATION</span>
      <button type="button" class="gris" data-d="fermer">✕</button></div>
    <div class="dg-corps">
      <div class="dg-rang">
        <button type="button" data-d="reafficher">👁 TOUT RÉAFFICHER</button>
        <button type="button" data-d="reinit">♻ RÉINITIALISER L’AFFICHAGE</button>
      </div>
      <div class="dg-rang">
        <button type="button" class="gris" data-d="copier">📋 COPIER LE RAPPORT</button>
        <button type="button" class="gris" data-d="rafraichir">🔄 RAFRAÎCHIR</button>
      </div>
      <div class="dg-k">MODULES</div><div data-d="modules"></div>
      <div class="dg-k">ÉCRAN</div><div data-d="dom"></div>
      <div class="dg-k">MÉCANISMES DE MASQUAGE</div><div data-d="mecanismes"></div>
      <div class="dg-k">ERREURS CAPTURÉES</div><div data-d="erreurs"></div>
      <div class="dg-k">RAPPORT (à coller dans un ticket)</div><pre data-d="json"></pre>
    </div>`;
  document.body.appendChild(el);

  function rendre() {
    const r = rapport();
    el.querySelector('[data-d="modules"]').innerHTML = Object.entries(r.modules)
      .sort((a, b) => Number(a[1].present) - Number(b[1].present))
      .map(([k, v]) => `<div class="dg-ligne"><span>${v.description}</span>
        <span class="${v.present ? 'dg-ok' : 'dg-ko'}">${v.present ? '✓' : `✗ ${k}`}</span></div>`).join('');
    el.querySelector('[data-d="dom"]').innerHTML = Object.entries(r.dom)
      .map(([sel, v]) => `<div class="dg-ligne"><span>${v.description}</span>
        <span class="${v.present ? 'dg-ok' : 'dg-ko'}">${v.present ? '✓' : `✗ ${sel}`}</span></div>`).join('');
    el.querySelector('[data-d="mecanismes"]').innerHTML = MECANISMES
      .map((m) => `<div class="dg-ligne"><span>${m.nom}</span>
        <span class="${m.test() ? 'dg-ko' : 'dg-ok'}">${m.test() ? 'masque l’écran' : 'inactif'}</span></div>`).join('');
    el.querySelector('[data-d="erreurs"]').innerHTML = r.erreurs.length
      ? r.erreurs.slice(-8).reverse().map((e) => `<div class="dg-err">[${e.type}] ${e.message}</div>`).join('')
      : '<div class="dg-ok">aucune erreur capturée</div>';
    el.querySelector('[data-d="json"]').textContent = JSON.stringify(r, null, 1).slice(0, 6000);
  }

  const ouvrir = (on) => { el.classList.toggle('ouvert', on !== false); if (el.classList.contains('ouvert')) rendre(); };
  const basculer = () => ouvrir(!el.classList.contains('ouvert'));

  el.querySelector('[data-d="fermer"]').addEventListener('click', () => ouvrir(false));
  el.querySelector('[data-d="rafraichir"]').addEventListener('click', rendre);
  el.querySelector('[data-d="reafficher"]').addEventListener('click', () => {
    const fait = toutReafficher();
    surMessage?.(`👁 Tout réaffiché : ${fait.length} action(s)`);
    rendre();
  });
  el.querySelector('[data-d="reinit"]').addEventListener('click', reinitialiserAffichage);
  el.querySelector('[data-d="copier"]').addEventListener('click', async () => {
    const texte = JSON.stringify(rapport(), null, 1);
    try {
      await navigator.clipboard.writeText(texte);
      surMessage?.('📋 Rapport copié dans le presse-papier.');
    } catch {
      el.querySelector('[data-d="json"]').textContent = texte;
      surMessage?.('⚠ Presse-papier refusé : le rapport est affiché, sélectionne-le.');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F3') { e.preventDefault(); basculer(); }
  });

  rendre();
  return {
    element: el,
    ouvrir,
    fermer: () => ouvrir(false),
    basculer,
    rendre,
    rapport,
    toutReafficher,
    erreurs: erreursCapturees,
  };
}
