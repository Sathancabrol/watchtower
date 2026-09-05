/**
 * WATCHTOWER — LA MASCOTTE (l'œil qui veille).
 *
 * « /urgence » fait apparaître l'œil en grand au centre de l'écran, puis le
 * pose dans un coin :
 *
 *  - il **regarde l'utilisateur** (pupille orientée vers la souris) ;
 *  - il **cligne** de temps en temps ;
 *  - il **se tourne vers la vue de la carte** quand il doit « aller voir »
 *    (animation de déplacement de la pupille, regard vers le centre de l'écran) ;
 *  - il **revient** à l'utilisateur ;
 *  - il se **perche toujours dans l'angle opposé à la souris** : la mascotte
 *    fuit le curseur (effet de répulsion), en glissant d'un coin à l'autre.
 *
 * Tout est en SVG + CSS : aucun asset, aucune dépendance, et l'animation est
 * *purement additive* (transform/opacity) pour rester fluide.
 */

const NS = 'http://www.w3.org/2000/svg';

/** Coins possibles (le nom dit où l'œil se pose). */
const COINS = ['haut-gauche', 'haut-droite', 'bas-gauche', 'bas-droite'];

const CSS = `
#wt-mascotte {
  position: fixed; z-index: 9998; pointer-events: none;
  width: 300px; height: 300px; margin: 0;
  transition: transform .9s cubic-bezier(.22,.8,.28,1), opacity .5s ease, filter .5s ease;
  opacity: 0; transform: scale(.7); will-change: transform;
}
#wt-mascotte.visible { opacity: 1; }
#wt-mascotte.actif { pointer-events: auto; cursor: pointer; }
#wt-mascotte svg { width: 100%; height: 100%; overflow: visible; display: block;
  filter: drop-shadow(0 0 22px rgba(0,212,255,.55)); }
#wt-mascotte .wt-pupille, #wt-mascotte .wt-paupiere { transition: transform .45s cubic-bezier(.22,.9,.3,1), opacity .12s linear; transform-origin: 0 0; }
#wt-mascotte.urgent svg { filter: drop-shadow(0 0 34px rgba(255,64,64,.75)); }
#wt-mascotte.urgent { animation: wt-mascotte-pulse 1.6s ease-in-out infinite; }
#wt-mascotte.parle .wt-anneau { animation: wt-mascotte-parle .45s ease-in-out infinite alternate; }
@keyframes wt-mascotte-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
@keyframes wt-mascotte-parle { from { opacity: .35; transform: rotate(0deg); } to { opacity: 1; transform: rotate(180deg); } }
#wt-mascotte .bulle {
  position: absolute; left: 50%; transform: translateX(-50%);
  bottom: -6px; max-width: 260px; padding: 7px 11px;
  background: rgba(4,10,18,.92); border: 1px solid rgba(0,212,255,.45);
  border-left: 3px solid #00d4ff; border-radius: 9px;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px; line-height: 1.5;
  color: rgba(232,234,237,.95); white-space: pre-wrap; opacity: 0;
  transition: opacity .3s ease, transform .3s ease; pointer-events: none;
}
#wt-mascotte .bulle.visible { opacity: 1; transform: translateX(-50%) translateY(8px); }
#wt-mascotte.urgent .bulle { border-color: rgba(255,80,80,.6); border-left-color: #ff5050; }
`;

function svgEl(nom, attrs = {}) {
  const e = document.createElementNS(NS, nom);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** Racines : centre (grand) ou coin (posé). */
export function racineMascotte() {
  let el = document.getElementById('wt-mascotte');
  if (el) return el;
  let style = document.getElementById('wt-mascotte-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-mascotte-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  el = document.createElement('div');
  el.id = 'wt-mascotte';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = dessinOeil();
  document.body.appendChild(el);
  el.addEventListener('click', () => {
    if (el.classList.contains('actif')) el.dispatchEvent(new CustomEvent('wt-mascotte-clic'));
  });
  return el;
}

/** Dessin de l'œil (SVG). Les `#` de classe permettent l'animation. */
export function dessinOeil({ couleur = '#00d4ff' } = {}) {
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="wt-oeil-globe" cx="38%" cy="32%" r="78%">
      <stop offset="0%" stop-color="#eafcff"/>
      <stop offset="55%" stop-color="#bfeefb"/>
      <stop offset="100%" stop-color="#12718c"/>
    </radialGradient>
    <radialGradient id="wt-oeil-iris" cx="42%" cy="38%" r="70%">
      <stop offset="0%" stop-color="${couleur}"/>
      <stop offset="70%" stop-color="#0b7fa6"/>
      <stop offset="100%" stop-color="#04222e"/>
    </radialGradient>
  </defs>
  <circle class="wt-anneau" cx="0" cy="0" r="76" fill="none" stroke="${couleur}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 10"/>
  <ellipse cx="0" cy="0" rx="66" ry="46" fill="url(#wt-oeil-globe)" stroke="#04222e" stroke-width="3"/>
  <g class="wt-pupille">
    <circle cx="0" cy="0" r="27" fill="url(#wt-oeil-iris)"/>
    <circle cx="0" cy="0" r="12" fill="#01151c"/>
    <circle cx="-8" cy="-9" r="6" fill="#ffffff" fill-opacity=".85"/>
  </g>
  <ellipse class="wt-paupiere" cx="0" cy="0" rx="68" ry="48" fill="#061019" opacity="0"/>
  <ellipse cx="0" cy="0" rx="66" ry="46" fill="none" stroke="${couleur}" stroke-width="1.5" stroke-opacity=".5"/>
  <path d="M -66 0 A 66 46 0 0 1 66 0" fill="none" stroke="${couleur}" stroke-width="3" stroke-opacity=".8"/>
  <path d="M -66 0 A 66 46 0 0 0 66 0" fill="none" stroke="${couleur}" stroke-width="3" stroke-opacity=".35"/>
  <g fill="${couleur}" fill-opacity=".55" font-family="monospace" font-size="15" letter-spacing="3">
    <text x="-54" y="74">WATCH</text>
    <text x="14" y="74">TOWER</text>
  </g>
</svg>
<div class="bulle"></div>`;
}

/**
 * Crée la mascotte.
 * @param {{couleur?:string}} [options]
 * @returns {object} `montrer`, `cacher`, `dire`, `regarderCarte`,
 *   `regarderUtilisateur`, `coinOppose`, `suivreSouris`, `detruire`, `el`.
 */
export function creerMascotte({ couleur } = {}) {
  const el = racineMascotte();
  if (couleur) el.innerHTML = dessinOeil({ couleur });
  const pupille = el.querySelector('.wt-pupille');
  const paupiere = el.querySelector('.wt-paupiere');
  const bulle = el.querySelector('.bulle');
  const etat = { coin: 'bas-droite', souris: null, clignote: 0, parle: 0, bulle: 0, regardCarte: 0, visible: false };
  let detruit = false;

  const poser = (coin) => {
    const m = 18; const w = el.offsetWidth || 300; const h = el.offsetHeight || 300;
    const x = /droite/.test(coin) ? window.innerWidth - w - m : m;
    const y = /bas/.test(coin) ? window.innerHeight - h - m : m;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.transform = `translate(${x}px, ${y}px) scale(1)`;
    etat.coin = coin;
  };

  const centrer = () => {
    const w = el.offsetWidth || 300; const h = el.offsetHeight || 300;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.transform = `translate(${(window.innerWidth - w) / 2}px, ${(window.innerHeight - h) / 2}px) scale(1.25)`;
  };

  /** Coin le plus éloigné du curseur. */
  function coinOppose(x = etat.souris?.x, y = etat.souris?.y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return etat.coin;
    const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
    const horizontal = x >= cx ? 'gauche' : 'droite';
    const vertical = y >= cy ? 'haut' : 'bas';
    return `${vertical}-${horizontal}`;
  }

  /** Orientation de la pupille vers un point écran (en unités viewBox). */
  function regarderVers(px, py) {
    if (!pupille) return;
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    const dx = px - cx; const dy = py - cy;
    const d = Math.max(1, Math.hypot(dx, dy));
    const amplitude = 26;
    const k = Math.min(1, d / (Math.max(window.innerWidth, window.innerHeight) * 0.55));
    const ux = (dx / d) * amplitude * k;
    const uy = (dy / d) * amplitude * k * 0.62;
    pupille.setAttribute('transform', `translate(${ux.toFixed(2)} ${uy.toFixed(2)})`);
  }

  function suivreSouris() {
    if (etat.regardCarte > 0) return;
    if (!etat.souris) return;
    regarderVers(etat.souris.x, etat.souris.y);
  }

  // ── cycle de vie ──────────────────────────────────────────────────────
  const api = {
    el,
    /** Coin courant. */
    get coin() { return etat.coin; },
    /** Coin opposé au curseur (ou au point donné). */
    coinOppose,
    /**
     * L'œil se tourne vers la vue de la carte : il « va voir » ce qui se
     * passe à l'écran, puis revient à l'utilisateur.
     * @param {number} [ms=1600] durée du regard vers la carte
     * @returns {Promise<void>}
     */
    regarderCarte(ms = 1600) { return api.tournerVers('carte', ms); },
    /** L'œil revient se poser sur l'utilisateur. */
    regarderUtilisateur() { return api.tournerVers('utilisateur', 0); },
    tournerVers(cible, ms = 1600) {
      return new Promise((resoudre) => {
        if (!pupille) { resoudre(); return; }
        if (cible === 'carte') {
          etat.regardCarte = 1;
          regarderVers(window.innerWidth / 2, window.innerHeight * 0.52);
          window.setTimeout(() => { etat.regardCarte = 0; suivreSouris(); resoudre(); }, Math.max(200, ms));
        } else {
          etat.regardCarte = 0;
          suivreSouris();
          window.setTimeout(resoudre, 240);
        }
      });
    },
    /** Petite phrase affichée sous l'œil (0 = jusqu'à nouvel ordre). */
    dire(texte, ms = 4200) {
      if (!bulle) return;
      bulle.textContent = String(texte || '');
      bulle.classList.toggle('visible', Boolean(texte));
      window.clearTimeout(etat.bulle);
      if (ms > 0) etat.bulle = window.setTimeout(() => bulle.classList.remove('visible'), ms);
    },
    /** Met l'œil en « écoute/parole » (anneau qui tourne). */
    parle(actif = true) { el.classList.toggle('parle', Boolean(actif)); },
    /** Passe l'œil en rouge « alerte ». */
    urgent(actif = true) { el.classList.toggle('urgent', Boolean(actif)); },
    /** Affiche l'œil au centre, en grand. */
    montrer({ centre = true, delai = 0 } = {}) {
      el.classList.add('visible');
      etat.visible = true;
      if (centre) {
        centrer();
        window.setTimeout(() => api.percher(delai ? 0 : 900), delai || 900);
      } else {
        poser(etat.coin);
      }
      return api;
    },
    /** Pose l'œil dans un coin (par défaut : opposé à la souris). */
    percher(delai = 0, coinForce) {
      const coin = coinForce || coinOppose();
      if (delai <= 0) { poser(coin); return api; }
      window.setTimeout(() => poser(coin), delai);
      etat.coin = coin;
      return api;
    },
    /** Active la répulsion : l'œil change de coin quand la souris s'approche. */
    suivreSouris(actif = true) { etat.repulsion = actif !== false; return api; },
    cacher() {
      el.classList.remove('visible', 'actif', 'urgent', 'parle');
      bulle?.classList.remove('visible');
      window.clearTimeout(etat.bulle);
      etat.visible = false;
      etat.repulsion = false;
      return api;
    },
    /** Rend l'œil cliquable. */
    cliquable(actif = true) { el.classList.toggle('actif', Boolean(actif)); return api; },
    /** Retire la mascotte du DOM (et son style partagé si plus personne). */
    detruire() {
      detruit = true;
      window.clearTimeout(etat.clignote);
      window.clearTimeout(etat.bulle);
      el.classList.remove('visible');
      el.style.display = 'none';
      el.querySelectorAll('*').forEach(() => {});
      el.innerHTML = '';
      return api;
    },
    get visible() { return etat.visible; },
  };

  // ── écoute souris : regard + répulsion ────────────────────────────────
  const surSouris = (e) => {
    if (detruit) return;
    etat.souris = { x: e.clientX, y: e.clientY };
    suivreSouris();
    if (etat.repulsion && etat.visible) {
      const coin = coinOppose(e.clientX, e.clientY);
      if (coin !== etat.coin) poser(coin);
    }
  };
  window.addEventListener('pointermove', surSouris, { passive: true });
  window.addEventListener('resize', () => { if (etat.visible) poser(etat.coin); }, { passive: true });

  // ── clignement ────────────────────────────────────────────────────────
  const cligner = () => {
    if (detruit) return;
    if (paupiere) {
      paupiere.setAttribute('opacity', '1');
      paupiere.setAttribute('transform', 'scale(1 0.08)');
      window.setTimeout(() => {
        paupiere.setAttribute('opacity', '0');
        paupiere.setAttribute('transform', 'scale(1 1)');
      }, 130);
    }
    etat.clignote = window.setTimeout(cligner, 2600 + Math.random() * 4200);
  };
  etat.clignote = window.setTimeout(cligner, 1800);

  el._wtMascotte = api;
  return api;
}

export { COINS };
