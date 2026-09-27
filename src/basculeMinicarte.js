/**
 * WATCHTOWER — INTERRUPTEUR DE LA MINICARTE.
 *
 * La fenêtre de la minicarte gêne : il faut pouvoir l'éteindre d'un geste,
 * sans aller la chercher dans un tiroir. On pose donc un bouton **juste sous
 * le bouton « Vue 3D / 2D »** (`#wt-bascule2d`, en bas à gauche).
 *
 * RÈGLE DU PROJET : on n'enlève aucune fonction. La minicarte n'est pas
 * détruite, seulement masquée — l'entrée GLOBE du dock et le volant
 * continuent de fonctionner, et l'état est mémorisé d'une session à l'autre.
 *
 * @module basculeMinicarte
 */

/** Clé de mémorisation de l'état. */
export const CLE_MINICARTE = 'wt-minicarte-visible';

/** Identifiant du bouton. */
export const ID_BOUTON = 'wt-bascule-minicarte';

const CSS = `
#${ID_BOUTON} {
  position: fixed; left: 12px; bottom: 24px; z-index: 949;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 6px;
  background: rgba(4, 12, 20, 0.82); color: #7fe7ff;
  border: 1px solid rgba(0, 212, 255, 0.35);
  font: 600 11px/1 system-ui, sans-serif; letter-spacing: 0.06em;
  cursor: pointer; text-transform: uppercase;
}
#${ID_BOUTON}:hover { background: rgba(0, 212, 255, 0.16); }
#${ID_BOUTON} .wt-bm-etat { color: #fff; }
#${ID_BOUTON}[aria-pressed="false"] { color: rgba(127,231,255,0.5); border-color: rgba(0,212,255,0.18); }
#${ID_BOUTON}[aria-pressed="false"] .wt-bm-etat { color: rgba(255,255,255,0.55); }
/* Masquage de la minicarte : on neutralise aussi les clics, sinon une
   fenêtre invisible continue d'intercepter la souris au-dessus du globe. */
#wt-minimap.wt-minicarte-off { display: none !important; }
`;

/** Lit l'état mémorisé. Par défaut la minicarte reste visible. */
export function etatMemorise(stockage) {
  try {
    const s = stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
    return s?.getItem(CLE_MINICARTE) !== '0';
  } catch {
    return true;
  }
}

/** Écrit l'état mémorisé, sans jamais faire échouer l'appelant. */
export function memoriser(visible, stockage) {
  try {
    const s = stockage || (typeof localStorage !== 'undefined' ? localStorage : null);
    s?.setItem(CLE_MINICARTE, visible ? '1' : '0');
  } catch { /* mode privé : on continue sans mémoire */ }
}

/**
 * Applique l'état à la minicarte.
 * @param {boolean} visible
 * @param {Document} doc
 * @returns {boolean} vrai si la minicarte existait
 */
export function appliquer(visible, doc = globalThis.document) {
  const mini = doc?.getElementById?.('wt-minimap');
  if (!mini) return false;
  mini.classList?.[visible ? 'remove' : 'add']?.('wt-minicarte-off');
  return true;
}

/**
 * Installe le bouton MINICARTE sous le bouton « Vue 3D ».
 * @param {Document} [doc]
 * @param {{stockage?:object, surMessage?:Function}} [options]
 * @returns {{bouton:HTMLElement|null, basculer:Function, estVisible:Function}}
 */
export function initBasculeMinicarte(doc = globalThis.document, options = {}) {
  const vide = { bouton: null, basculer() {}, estVisible: () => true };
  if (!doc?.createElement) return vide;

  if (!doc.getElementById('wt-bascule-minicarte-css')) {
    const st = doc.createElement('style');
    st.id = 'wt-bascule-minicarte-css';
    st.textContent = CSS;
    doc.head?.appendChild(st);
  }

  let visible = etatMemorise(options.stockage);

  let b = doc.getElementById(ID_BOUTON);
  if (!b) {
    b = doc.createElement('button');
    b.id = ID_BOUTON;
    b.type = 'button';
    b.title = 'Afficher ou masquer la fenêtre de la minicarte';
    doc.body?.appendChild(b);
  }

  const peindre = () => {
    b.innerHTML = `🗺 Minicarte <span class="wt-bm-etat">${visible ? 'ON' : 'OFF'}</span>`;
    b.setAttribute('aria-pressed', visible ? 'true' : 'false');
  };

  const poser = () => {
    appliquer(visible, doc);
    peindre();
  };

  const basculer = (force) => {
    visible = typeof force === 'boolean' ? force : !visible;
    memoriser(visible, options.stockage);
    poser();
    options.surMessage?.(visible ? '🗺 Minicarte affichée' : '🗺 Minicarte masquée');
    return visible;
  };

  b.addEventListener('click', () => basculer());
  poser();

  // La minicarte est construite après coup selon l'ordre de montage : on
  // repose l'état quelques fois pour ne pas rater sa création.
  for (const delai of [400, 1200, 2500]) setTimeout(() => appliquer(visible, doc), delai);

  return { bouton: b, basculer, estVisible: () => visible };
}
