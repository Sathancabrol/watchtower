/**
 * Correctifs de lisibilité, appliqués à toute l'application.
 *
 * Défauts signalés : « les fenêtres des fiches sur la gauche s'ouvrent trop
 * petites, et les boutons pour quitter ou modifier sont trop petits, pas
 * visibles — valable partout ».
 *
 * Plutôt que de retoucher les vingt modules un par un — au risque d'en oublier
 * et de créer des incohérences —, on pose une feuille de style **transversale**
 * qui impose des planchers. Elle est chargée en dernier et cible les classes
 * déjà utilisées par les panneaux existants.
 *
 * Principe : **des planchers, pas des tailles fixes.** Un panneau qui était déjà
 * assez grand n'est pas touché ; seuls les trop petits sont corrigés.
 *
 * @module lisibilite
 */

const STYLE_ID = 'wt-lisibilite-css';

/**
 * Taille minimale d'une cible tactile, en pixels.
 * 28 px est un compromis : les recommandations d'accessibilité visent 44 px,
 * inatteignable dans un HUD dense sans tout casser.
 */
export const CIBLE_MIN_PX = 28;

/** Largeur minimale d'un panneau flottant, en pixels. */
export const PANNEAU_MIN_PX = 300;

const CSS = `
/* ── Panneaux : largeur et hauteur planchers ─────────────────────────────── */
.wt-dock-panel,
.wt-fiche, #wt-fiche,
#wt-intel, #wt-pins, #wt-minimap-menu,
.wt-panneau, .wt-fenetre {
  min-width: ${PANNEAU_MIN_PX}px;
  max-width: min(96vw, 560px);
  max-height: 80vh;
  overflow: auto;
}

/* Les fiches ancrées à gauche débordaient sous le dock : on les borne. */
.wt-fiche, #wt-fiche { min-height: 220px; }

/* ── Boutons de fenêtre : fermer, réduire, modifier ──────────────────────── */
.wt-dock-panel .fermer, .wt-fiche .fermer, .wt-panneau .fermer,
.wt-dock-panel .modifier, .wt-fiche .modifier,
.wt-dock-panel .reduire, .wt-fiche .reduire,
button.fermer, button.modifier, button.reduire,
.wt-x, .wt-close {
  min-width: ${CIBLE_MIN_PX}px;
  min-height: ${CIBLE_MIN_PX}px;
  font-size: 16px !important;
  line-height: 1;
  display: inline-grid;
  place-items: center;
  border-radius: 5px;
  color: #eaf8ff;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.22);
  cursor: pointer;
}
.wt-dock-panel .fermer:hover, .wt-fiche .fermer:hover, button.fermer:hover,
.wt-x:hover, .wt-close:hover {
  background: rgba(255, 90, 90, 0.30);
  border-color: rgba(255, 120, 120, 0.75);
}
.wt-dock-panel .modifier:hover, .wt-fiche .modifier:hover, button.modifier:hover {
  background: rgba(0, 212, 255, 0.26);
  border-color: rgba(0, 212, 255, 0.75);
}

/* ── Barres de titre : assez hautes pour qu'on puisse viser ──────────────── */
.wt-dock-panel .t, .wt-fiche .t, .wt-panneau .t {
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* ── Plancher de lisibilité du texte ─────────────────────────────────────── */
.wt-dock-panel, .wt-fiche, .wt-panneau { font-size: 12.5px; line-height: 1.5; }
.wt-dock-panel small, .wt-fiche small { font-size: 11px; }

/* ── Petits boutons d'action : plus jamais sous la cible minimale ────────── */
.wt-dock-panel button:not(.wt-bf-btn),
.wt-fiche button:not(.wt-bf-btn),
.wt-panneau button:not(.wt-bf-btn) {
  min-height: 26px;
  font-size: 11.5px;
  padding: 4px 9px;
  cursor: pointer;
}

/* ── Champs de saisie ────────────────────────────────────────────────────── */
.wt-dock-panel input, .wt-dock-panel select, .wt-dock-panel textarea,
.wt-fiche input, .wt-fiche select, .wt-fiche textarea {
  min-height: 26px;
  font-size: 12px;
}

/* Sur petit écran, un panneau prend la largeur utile plutôt que de se tasser. */
@media (max-width: 640px) {
  .wt-dock-panel, .wt-fiche, #wt-fiche, .wt-panneau {
    min-width: min(94vw, ${PANNEAU_MIN_PX}px);
    max-width: 94vw;
  }
}
`;

/**
 * Applique les correctifs de lisibilité.
 * Idempotent : un second appel ne duplique pas la feuille.
 * @param {Document} [doc] - Document hôte.
 * @returns {{detruire:function}} Permet de retirer la feuille.
 */
export function initLisibilite(doc = globalThis.document) {
  if (!doc?.head) return { detruire() {} };
  let st = doc.getElementById(STYLE_ID);
  if (!st) {
    st = doc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    // En dernier dans <head> : gagne à spécificité égale sur les styles injectés
    // par les modules, sans avoir besoin de `!important` partout.
    doc.head.appendChild(st);
  }
  return { detruire() { st?.remove(); } };
}
