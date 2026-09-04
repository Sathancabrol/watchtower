/**
 * WATCHTOWER — boussole FPS en haut de l'écran.
 *
 * Ruban de cap (heading tape) comme dans les FPS : gradué en degrés, lettres
 * cardinales, repère central fixe, lecture numérique du cap. Elle suit la
 * caméra en temps réel ET elle est interactive :
 *   — GLISSER le ruban gauche/droite = tourner la caméra (vue FPS) ;
 *   — DOUBLE-CLIC = recadrage au nord.
 */

import * as Cesium from 'cesium';

const LARGEUR = 380;
const HAUTEUR = 46;
const FENETRE_DEG = 90; // amplitude visible du ruban

const CARDINAUX = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };

const CSS = `
#wt-boussole {
  position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
  z-index: 1200; width: ${LARGEUR}px; cursor: ew-resize; user-select: none;
  touch-action: none;
  font-family: var(--font-mono, monospace); text-align: center;
}
#wt-boussole canvas {
  display: block; width: ${LARGEUR}px; height: ${HAUTEUR}px;
  background: linear-gradient(180deg, rgba(10,10,15,0.78), rgba(10,10,15,0.55));
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 10px; backdrop-filter: blur(8px);
  box-shadow: 0 0 18px rgba(0, 212, 255, 0.12);
}
#wt-boussole .cap {
  position: absolute; top: ${HAUTEUR + 3}px; left: 50%; transform: translateX(-50%);
  font-size: 11px; font-weight: 700; letter-spacing: 1px;
  color: #00d4ff; text-shadow: 0 0 8px rgba(0,212,255,0.5);
  background: rgba(10,10,15,0.65); border-radius: 6px; padding: 1px 8px;
  pointer-events: none;
}
`;

function fmtCap(deg) {
  return `${String(Math.round(((deg % 360) + 360) % 360) % 360).padStart(3, '0')}°`;
}

/** Initialise la boussole. Retourne {destroy}. */
export function initCompassTape(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'wt-boussole';
  root.title = 'Cap caméra — glisser pour tourner · double-clic = nord';
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(LARGEUR * dpr);
  canvas.height = Math.round(HAUTEUR * dpr);
  const lectureCap = document.createElement('div');
  lectureCap.className = 'cap';
  lectureCap.textContent = '000°';
  root.appendChild(canvas);
  root.appendChild(lectureCap);
  document.body.appendChild(root);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  let dernierCap = -999;

  function dessiner(capDeg) {
    ctx.clearRect(0, 0, LARGEUR, HAUTEUR);
    const pxParDeg = LARGEUR / FENETRE_DEG;
    const debut = capDeg - FENETRE_DEG / 2;

    ctx.textAlign = 'center';
    const premier = Math.ceil(debut / 5) * 5;
    for (let d = premier; d <= debut + FENETRE_DEG; d += 5) {
      const x = (d - debut) * pxParDeg;
      const dn = ((d % 360) + 360) % 360;
      const haute = dn % 15 === 0;
      const cardinal = CARDINAUX[dn];
      ctx.strokeStyle = cardinal ? 'rgba(0,212,255,0.9)' : haute ? 'rgba(232,234,237,0.75)' : 'rgba(232,234,237,0.3)';
      ctx.lineWidth = cardinal ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HAUTEUR);
      ctx.lineTo(x, HAUTEUR - (cardinal ? 16 : haute ? 12 : 7));
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
    // repère central fixe
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(LARGEUR / 2 - 6, 0);
    ctx.lineTo(LARGEUR / 2 + 6, 0);
    ctx.lineTo(LARGEUR / 2, 8);
    ctx.closePath();
    ctx.fill();
    lectureCap.textContent = fmtCap(capDeg);
  }

  function capActuel() {
    try { return Cesium.Math.toDegrees(viewer.camera.heading); } catch { return 0; }
  }

  const maj = () => {
    const cap = capActuel();
    if (Math.abs(cap - dernierCap) < 0.05) return;
    dernierCap = cap;
    dessiner(cap);
  };

  // Double filet : postRender + intervalle de secours (robuste quel que soit
  // le pipeline de rendu actif).
  let removePostRender = () => {};
  try { removePostRender = viewer.scene.postRender.addEventListener(maj); } catch { /* fallback */ }
  const timer = window.setInterval(maj, 300);
  dessiner(capActuel());

  // ── Interaction : glisser = tourner la caméra sur place (vue FPS) ──
  let glisse = null;
  root.addEventListener('pointerdown', (e) => {
    glisse = { x0: e.clientX, cap0: viewer.camera.heading, bouge: false };
    root.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  root.addEventListener('pointermove', (e) => {
    if (!glisse) return;
    const dx = e.clientX - glisse.x0;
    if (Math.abs(dx) > 2) glisse.bouge = true;
    const nouveauCap = glisse.cap0 + Cesium.Math.toRadians(dx * (FENETRE_DEG / LARGEUR));
    viewer.camera.setView({
      destination: viewer.camera.position.clone(),
      orientation: { heading: nouveauCap, pitch: viewer.camera.pitch, roll: viewer.camera.roll },
    });
  });
  const finGlisse = () => { glisse = null; };
  root.addEventListener('pointerup', finGlisse);
  root.addEventListener('pointercancel', finGlisse);

  // Double-clic : recadrage au nord en douceur.
  root.addEventListener('dblclick', () => {
    viewer.camera.flyTo({
      destination: viewer.camera.position.clone(),
      orientation: { heading: 0, pitch: viewer.camera.pitch, roll: 0 },
      duration: 0.8,
    });
  });

  return {
    destroy() {
      removePostRender();
      window.clearInterval(timer);
      root.remove();
      style.remove();
    },
  };
}
