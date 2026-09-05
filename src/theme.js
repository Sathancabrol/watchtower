/**
 * WATCHTOWER — PEAU NÉON (habillage sombre de toute l'interface).
 *
 * Demande : « les side bars des fenêtres font blanc, change le design ».
 * L'app d'origine (God's Eye View) dessine ses panneaux avec des bordures
 * blanches translucides (`--glass-border: rgba(255,255,255,.08)`) et des
 * ascenseurs clairs. Sur un fond satellite clair, tout le pourtour des
 * fenêtres paraît blanc.
 *
 * Cette peau remplace le blanc par le cyan WATCHTOWER :
 *  · bordures, séparateurs et ascenseurs passent au cyan ;
 *  · les barres latérales et les en-têtes de panneaux reçoivent un dégradé
 *    sombre + un liseré lumineux ;
 *  · les fonds sont légèrement assombris pour que le texte reste lisible.
 *
 * Rien n'est supprimé : la peau ne touche qu'à l'apparence, et se retire
 * d'un coup (`appliquer(false)`).
 */

/** Couleurs de la peau (une seule source de vérité). */
export const PEAU = Object.freeze({
  fond: 'rgba(6,10,18,0.88)',
  fondHaut: 'rgba(8,14,24,0.82)',
  bord: 'rgba(0,212,255,0.24)',
  bordFort: 'rgba(0,212,255,0.5)',
  texte: '#e8eaed',
  accent: '#00d4ff',
  halo: 'rgba(0,212,255,0.35)',
});

export const CSS_PEAU = `
:root {
  --glass-bg: ${PEAU.fond} !important;
  --glass-border: ${PEAU.bord} !important;
  --glass-border-hover: ${PEAU.bordFort} !important;
  --panel-radius: 12px !important;
}
/* ── ascenseurs : fin liseré cyan au lieu du blanc ── */
* { scrollbar-width: thin; scrollbar-color: rgba(0,212,255,0.42) rgba(0,0,0,0.25); }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: rgba(0,212,255,0.05); border-radius: 8px; }
*::-webkit-scrollbar-thumb {
  background: rgba(0,212,255,0.32); border-radius: 8px;
  border: 1px solid rgba(0,212,255,0.35);
}
*::-webkit-scrollbar-thumb:hover { background: rgba(0,212,255,0.55); }
*::-webkit-scrollbar-corner { background: transparent; }

/* ── barres latérales et panneaux : plus de contour blanc ── */
#left-panel-stack > *, #right-context-rail > *,
.panel-collapsible, .pp-toggle-group, .map-source-section {
  border-color: ${PEAU.bord} !important;
  box-shadow: 0 6px 24px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,212,255,0.05) !important;
}
/* en-têtes de fenêtres : dégradé sombre + liseré */
#left-panel-stack > * > *:first-child, #right-context-rail > * > *:first-child,
.pp-header-row, .panel-mini-status, .wt-tete, .wt-dock-titre,
#wt-fiche .entete, #param-slider-panel .entete, #wt-pins .t, #wt-cadrans .t,
#wt-photo .t, #wt-sv .t, #wt-ville .t, #wt-entites .t {
  background: linear-gradient(90deg, rgba(0,212,255,0.16), rgba(0,212,255,0.03)) !important;
  border-color: ${PEAU.bord} !important;
  color: ${PEAU.accent} !important;
}
/* séparateurs et filets : cyan au lieu de blanc */
hr, .panel-divider, .pp-divider { border-color: ${PEAU.bord} !important; }
select, input[type="text"], input[type="search"], input[type="number"], textarea {
  background: rgba(4,8,14,0.85) !important;
  border: 1px solid ${PEAU.bord} !important;
  color: ${PEAU.texte} !important;
}
input[type="range"] { accent-color: ${PEAU.accent}; }
`;

const CLE = 'watchtower.peau.v1';

/**
 * Applique (ou retire) la peau néon.
 * @param {{actif?:boolean}} [options]
 */
export function initTheme(options = {}) {
  const style = document.createElement('style');
  style.id = 'wt-peau-neon';
  style.textContent = CSS_PEAU;
  let actif = false;

  const lu = (() => {
    try { return window.localStorage.getItem(CLE); } catch { return null; }
  })();
  const initial = options.actif !== undefined ? Boolean(options.actif) : lu !== '0';
  appliquer(initial);

  function appliquer(on = true) {
    actif = Boolean(on);
    if (actif && !style.isConnected) document.head.appendChild(style);
    if (!actif && style.isConnected) style.remove();
    try { window.localStorage.setItem(CLE, actif ? '1' : '0'); } catch { /* plein */ }
    return actif;
  }

  return {
    appliquer,
    basculer: () => appliquer(!actif),
    actif: () => actif,
    element: style,
  };
}
