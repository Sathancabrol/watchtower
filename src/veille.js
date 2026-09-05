/**
 * WATCHTOWER — VEILLE DE L'ÉCRAN (le HUD s'efface quand on ne touche à rien).
 *
 * Règle demandée : **si rien n'est touché pendant 15 s, plus aucun élément de
 * HUD n'est visible**. La disparition est progressive : à 10 s le HUD commence
 * à devenir transparent, à 15 s il est totalement invisible. Le moindre
 * mouvement de souris (ou une touche, un clic, un défilement) le fait
 * réapparaître aussitôt.
 *
 * On ne touche pas à la scène 3D (la carte reste pleine et nette) : seuls les
 * éléments d'interface sont estompés. Ce qui doit rester visible porte
 * l'attribut `data-veille-exclu` (la mascotte, une alerte, le palais…).
 *
 * La partie mathématique (`opaciteVeille`) est pure et testée.
 */

export const DEFAUT_DEBUT_MS = 10_000;
export const DEFAUT_FIN_MS = 15_000;

/**
 * Opacité du HUD pour un temps d'inactivité donné.
 * @param {number} inactifMs
 * @param {{debut?:number, fin?:number}} [options]
 * @returns {number} 1 (visible) → 0 (invisible)
 */
export function opaciteVeille(inactifMs, options = {}) {
  const debut = Number.isFinite(options.debut) ? options.debut : DEFAUT_DEBUT_MS;
  const fin = Number.isFinite(options.fin) ? options.fin : DEFAUT_FIN_MS;
  const t = Number(inactifMs);
  if (!Number.isFinite(t) || t <= debut) return 1;
  if (t >= fin) return 0;
  const span = Math.max(1, fin - debut);
  const o = 1 - (t - debut) / span;
  return Math.max(0, Math.min(1, Math.round(o * 1000) / 1000));
}

const CSS = `
:root { --wt-veille: 1; }
html.wt-veille-active body > *:not([data-veille-exclu]):not(#cesiumContainer):not(#world-overlay-root):not(#wt-mascotte) {
  opacity: var(--wt-veille) !important;
  transition: none !important;
}
html.wt-veille-active body > .wt-veille-invisible { opacity: 0 !important; }
/* le HUD invisible ne doit pas capturer les clics */
html.wt-veille-masque body > *:not([data-veille-exclu]):not(#cesiumContainer):not(#world-overlay-root):not(#wt-mascotte) {
  pointer-events: none !important;
}
#wt-veille-reveil {
  position: fixed; inset: 0; z-index: 9997; display: none; cursor: none;
  background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(0,212,255,.06), transparent 22%);
}
html.wt-veille-masque #wt-veille-reveil { display: block; }
`;

/**
 * @param {{debut?:number, fin?:number, actif?:boolean, surEtat?:Function}} [options]
 * @returns {object} API
 */
export function initVeille(options = {}) {
  const cfg = {
    debut: Number.isFinite(options.debut) ? options.debut : DEFAUT_DEBUT_MS,
    fin: Number.isFinite(options.fin) ? options.fin : DEFAUT_FIN_MS,
  };
  const surEtat = typeof options.surEtat === 'function' ? options.surEtat : null;
  let actif = options.actif !== false;
  let dernier = Date.now();
  let raf = 0;
  let masque = false;

  let style = document.getElementById('wt-veille-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-veille-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  let zone = document.getElementById('wt-veille-reveil');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'wt-veille-reveil';
    document.body.appendChild(zone);
  }

  const appliquer = (o) => {
    document.documentElement.style.setProperty('--wt-veille', String(o));
    const masquer = o <= 0.001;
    if (masquer !== masque) {
      masque = masquer;
      document.documentElement.classList.toggle('wt-veille-masque', masque);
    }
  };

  function boucle() {
    raf = 0;
    if (!actif) return;
    const t = Date.now() - dernier;
    const o = opaciteVeille(t, cfg);
    document.documentElement.classList.toggle('wt-veille-active', o < 1);
    appliquer(o);
    surEtat?.(o, t);
    if (o > 0) raf = window.requestAnimationFrame(boucle);
  }

  function relancer() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = window.requestAnimationFrame(boucle);
  }

  /** Remet le compteur à zéro (appelé au moindre geste). */
  function reveiller(e) {
    dernier = Date.now();
    document.documentElement.classList.remove('wt-veille-active');
    appliquer(1);
    if (e && typeof e.clientX === 'number') {
      zone.style.setProperty('--x', `${e.clientX}px`);
      zone.style.setProperty('--y', `${e.clientY}px`);
    }
    if (actif) relancer();
  }

  const gestes = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart'];
  for (const g of gestes) window.addEventListener(g, reveiller, { passive: true });
  window.addEventListener('focus', reveiller);

  const api = {
    /** Réveille l'écran (programmatiquement). */
    reveiller,
    /** Active / désactive la veille. */
    activer(on = true) {
      actif = Boolean(on);
      if (!actif) {
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
        document.documentElement.classList.remove('wt-veille-active', 'wt-veille-masque');
        appliquer(1);
      } else revelancer();
      return actif;
    },
    estActif: () => actif,
    /** Opacité courante du HUD. */
    opacite: () => {
      const brut = document.documentElement.style.getPropertyValue('--wt-veille');
      const n = Number.parseFloat(brut);
      return Number.isFinite(n) ? n : 1;
    },
    reglage: () => ({ ...cfg }),
  };
  function revelancer() { dernier = Date.now(); relancer(); }

  revelancer();
  return api;
}
