/**
 * WATCHTOWER — BOUSSOLE « CASQUE » (ruban de cap sur la hauteur de l'écran).
 *
 * L'ancienne boussole était un ruban horizontal de 380 px **au centre du
 * haut de l'écran** : elle recouvrait les boutons d'actions et le haut des
 * fenêtres. Demandé : l'afficher **le long de la hauteur de la page**, comme
 * un affichage tête haute de casque (vue AR « eagle eye »), et **pouvoir la
 * régler**.
 *
 * Deux présentations :
 *  · **verticale** (défaut) : un ruban pleine hauteur collé au bord gauche ou
 *    droit — rien n'est caché au centre, on lit le cap comme une échelle
 *    d'altitude d'avion ;
 *  · **horizontale** : le ruban d'origine, mais décalé sous les boutons du
 *    haut pour ne plus les recouvrir.
 *
 * Réglables à tout moment (engrenage ⚙ au bas du ruban) : présentation,
 * côté, largeur, opacité, amplitude (degrés visibles), masquage. Tout est
 * mémorisé.
 *
 * Interactions conservées : glisser = tourner la caméra, double-clic = nord.
 */

import * as Cesium from 'cesium';

/** Réglages par défaut. */
export const DEFAUTS = Object.freeze({
  orientation: 'vertical', // 'vertical' | 'horizontal'
  cote: 'gauche',          // 'gauche' | 'droite'
  largeur: 56,             // px (largeur du ruban vertical / hauteur du ruban horizontal)
  longueur: 0,             // 0 = toute la hauteur (ou 300 px en horizontal)
  opacite: 0.9,
  amplitude: 90,           // degrés visibles sur la hauteur du ruban
  visible: true,
});

const CLE = 'watchtower.boussole.v1';
const CARDINAUX = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };

/**
 * Nombre borné. `null`, `''` et le texte non numérique retombent sur `def`
 * (piège classique : `Number(null)` vaut 0 et passerait pour une valeur).
 */
function borne(brut, min, max, def) {
  const vide = brut === null || brut === undefined || brut === '';
  const n = Number(brut);
  if (vide || !Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

/**
 * Normalise des réglages (tout ce qui n'est pas valide retombe au défaut).
 * Fonction pure, testée.
 */
export function reglagesValides(p = {}) {
  const o = String(p.orientation || DEFAUTS.orientation);
  const c = String(p.cote || DEFAUTS.cote);
  return {
    orientation: o === 'horizontal' ? 'horizontal' : 'vertical',
    cote: c === 'droite' ? 'droite' : 'gauche',
    largeur: Math.round(borne(p.largeur, 34, 130, DEFAUTS.largeur)),
    longueur: Math.round(borne(p.longueur, 0, 4000, DEFAUTS.longueur)),
    opacite: Math.round(borne(p.opacite, 0.2, 1, DEFAUTS.opacite) * 100) / 100,
    amplitude: Math.round(borne(p.amplitude, 30, 360, DEFAUTS.amplitude)),
    visible: p.visible !== false,
  };
}

/**
 * Géométrie du ruban : où le poser et quelle taille de canvas.
 * Fonction pure, testée.
 */
export function disposition(r, viewport = {}) {
  const g = reglagesValides(r);
  const vw = Number(viewport.largeur) || 1920;
  const vh = Number(viewport.hauteur) || 1080;
  if (g.orientation === 'horizontal') {
    const longueur = g.longueur || 380;
    return {
      ...g,
      canvasLargeur: Math.max(120, Math.min(vw - 24, longueur)),
      canvasHauteur: g.largeur,
      style: {
        left: '50%', right: 'auto', top: '8px', bottom: 'auto',
        transform: 'translateX(-50%)', width: `${Math.max(120, Math.min(vw - 24, longueur))}px`,
        height: 'auto',
      },
    };
  }
  const hauteur = g.longueur || vh;
  return {
    ...g,
    canvasLargeur: g.largeur,
    canvasHauteur: Math.max(200, Math.min(vh, hauteur)),
    style: {
      left: g.cote === 'gauche' ? '0px' : 'auto',
      right: g.cote === 'droite' ? '0px' : 'auto',
      top: '0px', bottom: 'auto', transform: 'none',
      width: `${g.largeur}px`, height: `${Math.max(200, Math.min(vh, hauteur))}px`,
    },
  };
}

const CSS = `
#wt-boussole {
  position: fixed; z-index: 900; user-select: none; touch-action: none;
  font-family: var(--font-mono, monospace); pointer-events: auto;
}
#wt-boussole canvas {
  display: block;
  background: linear-gradient(180deg, rgba(8,12,20,0.82), rgba(8,12,20,0.55));
  border: 1px solid rgba(0,212,255,0.3);
  border-radius: 8px; backdrop-filter: blur(6px);
  box-shadow: 0 0 18px rgba(0,212,255,0.12);
}
#wt-boussole.horizontal canvas { border-radius: 10px; }
#wt-boussole .cap {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #00d4ff;
  text-shadow: 0 0 8px rgba(0,212,255,0.6); background: rgba(6,10,16,0.85);
  border: 1px solid rgba(0,212,255,0.35); border-radius: 6px; padding: 1px 5px;
  pointer-events: none; white-space: nowrap;
}
#wt-boussole.horizontal .cap { top: auto; bottom: -20px; }
#wt-boussole .wt-b-reglages {
  position: absolute; left: 2px; bottom: 2px; width: calc(100% - 4px);
  display: none; flex-direction: column; gap: 3px; padding: 5px;
  background: rgba(6,10,18,0.96); border: 1px solid rgba(0,212,255,0.4);
  border-radius: 8px; font-size: 8px; color: #e8eaed;
}
#wt-boussole .wt-b-reglages.ouvert { display: flex; }
#wt-boussole .wt-b-reglages button {
  cursor: pointer; background: rgba(0,212,255,0.1); color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.35); border-radius: 5px;
  padding: 3px 4px; font-family: inherit; font-size: 8px; letter-spacing: 1px;
}
#wt-boussole .wt-b-reglages button.actif { background: rgba(0,212,255,0.32); }
#wt-boussole .wt-b-reglages label { display: flex; align-items: center; gap: 3px; opacity: .8; }
#wt-boussole .wt-b-reglages input[type=range] { flex: 1; accent-color: #00d4ff; min-width: 0; }
#wt-boussole .wt-b-roue {
  position: absolute; left: 50%; transform: translateX(-50%); bottom: 3px;
  cursor: pointer; background: rgba(6,10,18,0.9); color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.4); border-radius: 50%;
  width: 16px; height: 16px; font-size: 9px; line-height: 1; padding: 0;
}
`;

/** Cap lisible : 0 → 359. */
export function fmtCap(deg) {
  return `${String(Math.round(((deg % 360) + 360) % 360) % 360).padStart(3, '0')}°`;
}

/** Initialise la boussole. */
export function initCompassTape(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const racine = document.createElement('div');
  racine.id = 'wt-boussole';
  racine.title = 'Cap caméra — glisser pour tourner · double-clic = nord · ⚙ = réglages';
  racine.innerHTML = `
    <canvas></canvas>
    <div class="cap">000°</div>
    <button type="button" class="wt-b-roue" title="Réglages de la boussole">⚙</button>
    <div class="wt-b-reglages">
      <div style="display:flex;gap:3px">
        <button type="button" data-r="vertical" style="flex:1">↕ HAUTEUR</button>
        <button type="button" data-r="horizontal" style="flex:1">↔ LARGEUR</button>
      </div>
      <div style="display:flex;gap:3px">
        <button type="button" data-c="gauche" style="flex:1">◀ GAUCHE</button>
        <button type="button" data-c="droite" style="flex:1">DROITE ▶</button>
      </div>
      <label>épais <input type="range" data-v="largeur" min="34" max="130" step="2"></label>
      <label>opacité <input type="range" data-v="opacite" min="20" max="100" step="5"></label>
      <label>degrés <input type="range" data-v="amplitude" min="30" max="360" step="10"></label>
      <button type="button" data-m="1">🙈 MASQUER LA BOUSSOLE</button>
    </div>`;
  document.body.appendChild(racine);

  const canvas = racine.querySelector('canvas');
  const lecture = racine.querySelector('.cap');
  const panneau = racine.querySelector('.wt-b-reglages');
  const ctx = canvas.getContext('2d');

  const lire = () => {
    try { return reglagesValides(JSON.parse(window.localStorage.getItem(CLE) || '{}')); } catch { return { ...DEFAUTS }; }
  };
  const ecrire = () => { try { window.localStorage.setItem(CLE, JSON.stringify(reglages)); } catch { /* plein */ } };
  let reglages = lire();

  // ── hébergement : dans la minicarte, ou au bord de l'écran ─────────────
  let hote = null;
  function heberger(conteneur) {
    hote = conteneur || null;
    if (hote) hote.appendChild(racine); else document.body.appendChild(racine);
    placer();
    return Boolean(hote);
  }

  // ── mise en page ───────────────────────────────────────────────────────
  let geo = null;
  function placer() {
    geo = disposition(reglages, { largeur: window.innerWidth, hauteur: window.innerHeight });
    Object.assign(racine.style, geo.style);
    racine.style.opacity = String(geo.opacite);
    racine.style.display = geo.visible ? '' : 'none';
    racine.classList.toggle('horizontal', geo.orientation === 'horizontal');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(geo.canvasLargeur * dpr);
    canvas.height = Math.round(geo.canvasHauteur * dpr);
    canvas.style.width = `${geo.canvasLargeur}px`;
    canvas.style.height = `${geo.canvasHauteur}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    panneau.classList.toggle('ouvert', panneau.classList.contains('ouvert'));
    majReglages();
    dessiner(capActuel(), true);
  }

  function majReglages() {
    for (const b of panneau.querySelectorAll('button[data-r]')) b.classList.toggle('actif', reglages.orientation === b.dataset.r);
    for (const b of panneau.querySelectorAll('button[data-c]')) b.classList.toggle('actif', reglages.cote === b.dataset.c);
    for (const i of panneau.querySelectorAll('input[data-v]')) {
      const cle = i.dataset.v;
      i.value = String(cle === 'opacite' ? Math.round(reglages.opacite * 100) : reglages[cle]);
    }
  }

  // ── dessin ─────────────────────────────────────────────────────────────
  const norm = (d) => ((d % 360) + 360) % 360;

  function dessinerVertical(cap) {
    const W = geo.canvasLargeur;
    const H = geo.canvasHauteur;
    const pxParDeg = H / geo.amplitude;
    const debut = cap - geo.amplitude / 2;
    const interieur = reglages.cote === 'gauche' ? W - 2 : 2; // bord côté centre de l'écran
    const sens = reglages.cote === 'gauche' ? -1 : 1;

    ctx.clearRect(0, 0, W, H);
    // fond
    const fond = ctx.createLinearGradient(0, 0, 0, H);
    fond.addColorStop(0, 'rgba(8,12,20,0.9)');
    fond.addColorStop(0.5, 'rgba(8,12,20,0.55)');
    fond.addColorStop(1, 'rgba(8,12,20,0.9)');
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, W, H);

    // filet central + repère
    ctx.strokeStyle = 'rgba(0,212,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(interieur, H / 2);
    ctx.lineTo(interieur + sens * W * 0.55, H / 2);
    ctx.stroke();

    const premier = Math.ceil(debut / 5) * 5;
    ctx.textAlign = reglages.cote === 'gauche' ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    const bordTexte = reglages.cote === 'gauche' ? 3 : W - 3;
    for (let d = premier; d <= debut + geo.amplitude; d += 5) {
      const y = (d - debut) * pxParDeg;
      if (y < -10 || y > H + 10) continue;
      const dn = norm(d);
      const cardinal = CARDINAUX[dn];
      const majeur = dn % 15 === 0;
      ctx.strokeStyle = cardinal ? 'rgba(0,212,255,0.95)' : majeur ? 'rgba(232,234,237,0.75)' : 'rgba(232,234,237,0.3)';
      ctx.lineWidth = cardinal ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(interieur, y);
      ctx.lineTo(interieur + sens * (cardinal ? 20 : majeur ? 14 : 8), y);
      ctx.stroke();
      if (cardinal) {
        ctx.fillStyle = '#00d4ff';
        ctx.font = '700 11px JetBrains Mono, monospace';
        ctx.fillText(cardinal, bordTexte, y);
      } else if (dn % 30 === 0) {
        ctx.fillStyle = 'rgba(232,234,237,0.6)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(String(dn), bordTexte, y);
      }
    }

    // index fixe au centre (triangle vers l'intérieur de l'écran)
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(interieur + sens * 10, H / 2 - 5);
    ctx.lineTo(interieur + sens * 10, H / 2 + 5);
    ctx.lineTo(interieur + sens * 2, H / 2);
    ctx.closePath();
    ctx.fill();

    // cadre « casque » : coins
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    const c = 8;
    for (const [x, y, sx, sy] of [[1, 1, 1, 1], [W - 1, 1, -1, 1], [1, H - 1, 1, -1], [W - 1, H - 1, -1, -1]]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * c);
      ctx.stroke();
    }
  }

  function dessinerHorizontal(cap) {
    const W = geo.canvasLargeur;
    const H = geo.canvasHauteur;
    const pxParDeg = W / geo.amplitude;
    const debut = cap - geo.amplitude / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const premier = Math.ceil(debut / 5) * 5;
    for (let d = premier; d <= debut + geo.amplitude; d += 5) {
      const x = (d - debut) * pxParDeg;
      const dn = norm(d);
      const cardinal = CARDINAUX[dn];
      const majeur = dn % 15 === 0;
      ctx.strokeStyle = cardinal ? 'rgba(0,212,255,0.9)' : majeur ? 'rgba(232,234,237,0.75)' : 'rgba(232,234,237,0.3)';
      ctx.lineWidth = cardinal ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x, H - (cardinal ? 16 : majeur ? 12 : 7));
      ctx.stroke();
      if (cardinal) {
        ctx.fillStyle = '#00d4ff';
        ctx.font = '700 12px JetBrains Mono, monospace';
        ctx.fillText(cardinal, x, 14);
      } else if (dn % 30 === 0) {
        ctx.fillStyle = 'rgba(232,234,237,0.75)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(String(dn), x, 14);
      }
    }
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 6, 0);
    ctx.lineTo(W / 2 + 6, 0);
    ctx.lineTo(W / 2, 8);
    ctx.closePath();
    ctx.fill();
  }

  function dessiner(cap, force = false) {
    if (!geo) return;
    lecture.textContent = fmtCap(cap);
    if (geo.orientation === 'vertical') dessinerVertical(cap); else dessinerHorizontal(cap);
    void force;
  }

  function capActuel() {
    try { return Cesium.Math.toDegrees(viewer.camera.heading); } catch { return 0; }
  }

  let dernierCap = -999;
  const maj = () => {
    const cap = capActuel();
    if (Math.abs(cap - dernierCap) < 0.05) return;
    dernierCap = cap;
    dessiner(cap);
  };

  let removePostRender = () => {};
  try { removePostRender = viewer.scene.postRender.addEventListener(maj); } catch { /* repli */ }
  const timer = window.setInterval(maj, 300);
  window.addEventListener('resize', placer);

  // ── interactions : glisser = tourner, double-clic = nord ───────────────
  let glisse = null;
  racine.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.wt-b-reglages') || e.target.closest('.wt-b-roue')) return;
    glisse = { y0: e.clientY, x0: e.clientX, cap0: viewer.camera.heading };
    racine.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  racine.addEventListener('pointermove', (e) => {
    if (!glisse) return;
    const vertical = geo?.orientation === 'vertical';
    const deplacement = vertical ? (e.clientY - glisse.y0) : (e.clientX - glisse.x0);
    const etendue = vertical ? geo.canvasHauteur : geo.canvasLargeur;
    const delta = Cesium.Math.toRadians(deplacement * (geo.amplitude / etendue));
    viewer.camera.setView({
      destination: viewer.camera.position.clone(),
      orientation: { heading: glisse.cap0 + delta, pitch: viewer.camera.pitch, roll: viewer.camera.roll },
    });
  });
  const finGlisse = () => { glisse = null; };
  racine.addEventListener('pointerup', finGlisse);
  racine.addEventListener('pointercancel', finGlisse);
  racine.addEventListener('dblclick', (e) => {
    if (e.target.closest('.wt-b-reglages') || e.target.closest('.wt-b-roue')) return;
    viewer.camera.flyTo({
      destination: viewer.camera.position.clone(),
      orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 },
      duration: 0.8,
    });
  });

  // ── réglages ───────────────────────────────────────────────────────────
  racine.querySelector('.wt-b-roue').addEventListener('click', () => panneau.classList.toggle('ouvert'));
  for (const b of panneau.querySelectorAll('button[data-r]')) {
    b.addEventListener('click', () => {
      // Repasser en ruban vertical alors qu'on est dans la minicarte ?
      // On se détache : le ruban retourne au bord de l'écran.
      if (b.dataset.r === 'vertical' && hote) heberger(null);
      reglages = reglagesValides({ ...reglages, orientation: b.dataset.r });
      ecrire();
      placer();
    });
  }
  for (const b of panneau.querySelectorAll('button[data-c]')) {
    b.addEventListener('click', () => { reglages = reglagesValides({ ...reglages, cote: b.dataset.c }); ecrire(); placer(); });
  }
  for (const i of panneau.querySelectorAll('input[data-v]')) {
    i.addEventListener('input', () => {
      const cle = i.dataset.v;
      const brut = Number(i.value);
      reglages = reglagesValides({ ...reglages, [cle]: cle === 'opacite' ? brut / 100 : brut });
      ecrire();
      placer();
    });
  }
  panneau.querySelector('[data-m]').addEventListener('click', () => {
    reglages = reglagesValides({ ...reglages, visible: false });
    ecrire();
    placer();
    try { window.__wtToast?.('🧭 Boussole masquée — AFFICHAGE (F2) ou ⚙ pour la remettre.'); } catch { /* ok */ }
  });

  placer();

  return {
    destroy() {
      removePostRender();
      window.clearInterval(timer);
      window.removeEventListener('resize', placer);
      racine.remove();
      style.remove();
    },
    /** Applique des réglages (voir `DEFAUTS`). */
    regler(patch = {}) {
      reglages = reglagesValides({ ...reglages, ...patch });
      ecrire();
      placer();
      return { ...reglages };
    },
    reglages: () => ({ ...reglages }),
    /** Pose la boussole dans un conteneur (`null` = retour au bord d'écran). */
    heberger,
    hebergement: () => hote,
    /** Masque / affiche (depuis la fenêtre AFFICHAGE par exemple). */
    visible(on = true) { return this.regler({ visible: Boolean(on) }).visible; },
    element: racine,
  };
}
