/**
 * WATCHTOWER — MINICARTE (bas gauche).
 *
 * Réécrite : l'ancienne version montait un SECOND viewer Cesium dans un
 * petit cadre — lourd (deux moteurs 3D, deux boucles de rendu) et fragile
 * (le deuxième viewer finissait souvent vide ou figé). Ici c'est un simple
 * CANVAS qui dessine des tuiles raster : quelques kilo-octets, pas de WebGL,
 * et ça suit la caméra principale sans la ralentir.
 *
 *  · 🔒 SUIVI : la minicarte se recentre sur la vue principale ;
 *  · clic / glisser sur la minicarte → déplace la caméra principale ;
 *  · molette → zoom ; 🛰 change le fond de carte ; ▣ replie en puce 🗺 ;
 *  · anti-collision : se met de côté quand un panneau du dock s'ouvre.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';
import {
  canvasVersLonLat,
  porteeSelonAltitude,
  tuilesVisibles,
  zoomPourMetresParPixel,
} from './tuilesMath.js';

const LARGEUR = 216;
const HAUTEUR = 150;

/** Fonds de carte gratuits (sans clé, CORS ouvert). */
const SOURCES = [
  { nom: 'CARTO Voyager', url: (x, y, z) => `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png` },
  { nom: 'CARTO Dark', url: (x, y, z) => `https://basemaps.cartocdn.com/rastertiles/dark_all/${z}/${x}/${y}.png` },
  { nom: 'OSM Classic', url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png` },
];

const CSS = `
#wt-minimap {
  position: fixed; left: 12px; bottom: 88px; z-index: 948; width: ${LARGEUR + 2}px;
  font-family: var(--font-mono, monospace);
  background: rgba(6,10,16,0.94); border: 1px solid rgba(0,212,255,0.4);
  border-radius: 10px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.5);
  transition: opacity 0.3s ease;
}
#wt-minimap.wt-mm-cachée { opacity: 0; pointer-events: none; }
#wt-minimap .wt-mm-titre {
  display: flex; align-items: center; gap: 4px; cursor: move; padding: 4px 7px;
  font-size: 8px; letter-spacing: 2px; font-weight: 700; color: #00d4ff;
  background: rgba(0,212,255,0.08); border-bottom: 1px solid rgba(0,212,255,0.25); user-select: none;
}
#wt-minimap .wt-mm-titre button {
  cursor: pointer; background: none; border: 1px solid rgba(0,212,255,0.3);
  color: #00d4ff; border-radius: 5px; font-size: 9px; padding: 1px 5px; font-family: inherit;
}
#wt-minimap .wt-mm-titre button.actif { background: rgba(0,212,255,0.25); }
#wt-minimap .wt-mm-vid { width: ${LARGEUR}px; height: ${HAUTEUR}px; position: relative; background: #08111c; }
#wt-minimap .wt-mm-vid canvas { display: block; width: ${LARGEUR}px; height: ${HAUTEUR}px; cursor: grab; outline: none; }
#wt-minimap .wt-mm-note { padding: 3px 7px; font-size: 7.5px; letter-spacing: 0.5px; color: rgba(232,234,237,0.5); }
#wt-minimap .wt-mm-note b { color: #00d4ff; font-weight: 700; }
#wt-minimap-puce {
  position: fixed; left: 12px; bottom: 88px; z-index: 948; cursor: pointer;
  width: 40px; height: 40px; border-radius: 10px; background: rgba(6,10,16,0.92);
  border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; font-size: 17px;
  display: none; align-items: center; justify-content: center;
}
`;

/** Formatte une distance pour l'échelle graphique. */
export function formaterEchelle(metres) {
  const m = Math.max(0, Number(metres) || 0);
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;
  return `${Math.round(m)} m`;
}

export function initMinimap(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const puce = document.createElement('button');
  puce.id = 'wt-minimap-puce';
  puce.type = 'button';
  puce.textContent = '🗺';
  puce.title = 'Afficher la minicarte';
  document.body.appendChild(puce);

  const div = document.createElement('div');
  div.id = 'wt-minimap';
  div.innerHTML = `
    <div class="wt-mm-titre"><span>🗺 MINICARTE</span>
      <span style="margin-left:auto;display:flex;gap:4px">
        <button type="button" data-a="suivre" class="actif" title="Suivre la vue principale">🔒</button>
        <button type="button" data-a="fond" title="Changer le fond de carte">🛰</button>
        <button type="button" data-a="puce" title="Replier en puce">▣</button>
        <button type="button" data-a="fermer" title="Fermer (revenir via la puce 🗺)">✕</button>
      </span>
    </div>
    <div class="wt-mm-vid"></div>
    <div class="wt-mm-note">🔒 suit la vue · clic/glisser = se déplacer · molette = zoom</div>`;
  document.body.appendChild(div);
  rendreDeplacable(div, div.querySelector('.wt-mm-titre'));

  const zone = div.querySelector('.wt-mm-vid');
  const note = div.querySelector('.wt-mm-note');
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  canvas.width = Math.round(LARGEUR * dpr);
  canvas.height = Math.round(HAUTEUR * dpr);
  zone.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let suivre = true;
  let source = 0;
  /** @type {Map<string, HTMLImageElement>} */
  const tuiles = new Map();

  function tuile(x, y, z) {
    const cle = `${z}/${x}/${y}`;
    const connue = tuiles.get(cle);
    if (connue) return connue;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (!document.hidden) dessiner(); };
    img.src = SOURCES[source].url(x, y, z);
    tuiles.set(cle, img);
    if (tuiles.size > 400) {
      const plusVieille = tuiles.keys().next().value;
      tuiles.delete(plusVieille);
    }
    return img;
  }

  /** Point visé par la caméra (centre de l'écran principal) + altitude. */
  function centreVue() {
    const cam = viewer.camera;
    const c = cam.positionCartographic;
    const defaut = {
      lon: Cesium.Math.toDegrees(c.longitude),
      lat: Cesium.Math.toDegrees(c.latitude),
      altitude: c.height,
    };
    try {
      const taille = viewer.scene.canvas.getBoundingClientRect();
      const milieu = new Cesium.Cartesian2(taille.width / 2, taille.height / 2);
      const vise = cam.pickEllipsoid(milieu, viewer.scene.globe.ellipsoid);
      if (vise) {
        const g = Cesium.Cartographic.fromCartesian(vise);
        return {
          lon: Cesium.Math.toDegrees(g.longitude),
          lat: Cesium.Math.toDegrees(g.latitude),
          altitude: c.height,
          vise: true,
        };
      }
    } catch { /* vue espace : on garde la position caméra */ }
    return defaut;
  }

  function dessiner() {
    // rien à dessiner si la minicarte est repliée, fermée ou masquée par un
    // panneau : on économise le CPU (et les tuiles) plutôt que de boucler.
    if (!ctx || div.classList.contains('wt-mm-cachée') || div.offsetParent === null) return;
    const centre = centreVue();
    const portee = porteeSelonAltitude(centre.altitude);
    const mpp = portee / LARGEUR;
    const z = zoomPourMetresParPixel(mpp, centre.lat);

    ctx.fillStyle = '#08111c';
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

    for (const t of tuilesVisibles({
      lon: centre.lon, lat: centre.lat, mpp, largeur: LARGEUR, hauteur: HAUTEUR, z,
    })) {
      const img = tuile(t.x, t.y, z);
      if (img.complete && img.naturalWidth > 0) {
        try { ctx.drawImage(img, t.dx, t.dy, t.taille, t.taille); } catch { /* image morte */ }
      }
    }

    // ——— réticule + cône de vue (cap de la caméra) ———
    const cap = Number.isFinite(viewer.camera.heading) ? viewer.camera.heading : 0;
    const demi = 0.42; // ~24° de part et d'autre
    const porte = Math.min(LARGEUR, HAUTEUR) * 0.72;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(LARGEUR / 2, HAUTEUR / 2);
    // en Cesium, heading 0 = nord et tourne dans le sens horaire ; sur le
    // canvas l'axe Y pointe vers le sud, d'où le passage en coordonnées écran
    const a1 = -Math.PI / 2 + cap - demi;
    const a2 = -Math.PI / 2 + cap + demi;
    ctx.lineTo(LARGEUR / 2 + Math.cos(a1) * porte, HAUTEUR / 2 + Math.sin(a1) * porte);
    ctx.lineTo(LARGEUR / 2 + Math.cos(a2) * porte, HAUTEUR / 2 + Math.sin(a2) * porte);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,212,255,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(LARGEUR / 2 - 7, HAUTEUR / 2);
    ctx.lineTo(LARGEUR / 2 + 7, HAUTEUR / 2);
    ctx.moveTo(LARGEUR / 2, HAUTEUR / 2 - 7);
    ctx.lineTo(LARGEUR / 2, HAUTEUR / 2 + 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(LARGEUR / 2, HAUTEUR / 2, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.stroke();

    // ——— nord ———
    ctx.fillStyle = 'rgba(0,212,255,0.85)';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', 12, 13);
    ctx.beginPath();
    ctx.moveTo(12, 30);
    ctx.lineTo(12, 17);
    ctx.lineTo(9, 21);
    ctx.moveTo(12, 17);
    ctx.lineTo(15, 21);
    ctx.strokeStyle = 'rgba(0,212,255,0.85)';
    ctx.stroke();

    // ——— échelle ———
    const barre = 56;
    ctx.strokeStyle = 'rgba(232,234,237,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(8, HAUTEUR - 10);
    ctx.lineTo(8 + barre, HAUTEUR - 10);
    ctx.moveTo(8, HAUTEUR - 13);
    ctx.lineTo(8, HAUTEUR - 7);
    ctx.moveTo(8 + barre, HAUTEUR - 13);
    ctx.lineTo(8 + barre, HAUTEUR - 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,234,237,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(formaterEchelle(barre * mpp), 8, HAUTEUR - 15);

    note.innerHTML = suivre
      ? `🔒 suit la vue · <b>${formaterEchelle(portee)}</b> de large · ${SOURCES[source].nom}`
      : `✋ navigation libre · <b>${formaterEchelle(portee)}</b> de large · ${SOURCES[source].nom}`;
  }

  // ——— navigation ———
  function allerA(lon, lat, altitude) {
    const cam = viewer.camera;
    const alt = Number.isFinite(altitude) ? altitude : cam.positionCartographic.height;
    try {
      cam.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(150, alt)),
        orientation: { heading: cam.heading, pitch: cam.pitch, roll: cam.roll },
      });
    } catch { /* caméra en transition */ }
  }

  let glisse = null;
  canvas.addEventListener('pointerdown', (e) => {
    const centre = centreVue();
    const portee = porteeSelonAltitude(centre.altitude);
    const mpp = portee / LARGEUR;
    const z = zoomPourMetresParPixel(mpp, centre.lat);
    glisse = {
      depart: { px: e.offsetX, py: e.offsetY },
      params: { lon: centre.lon, lat: centre.lat, mpp, largeur: LARGEUR, hauteur: HAUTEUR, z },
      origine: { lon: centre.lon, lat: centre.lat },
      bouge: 0,
    };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ok */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!glisse) return;
    glisse.bouge += 1;
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const p0 = canvasVersLonLat({ px: glisse.depart.px, py: glisse.depart.py, ...glisse.params });
    const p1 = canvasVersLonLat({ px, py, ...glisse.params });
    const dLon = p1.lon - p0.lon;
    const dLat = p1.lat - p0.lat;
    // on « attrape » la carte : le point saisi reste sous le curseur
    allerA(glisse.origine.lon - dLon, glisse.origine.lat - dLat);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!glisse) return;
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const deplacement = Math.hypot(px - glisse.depart.px, py - glisse.depart.py);
    const params = glisse.params;
    const origine = glisse.origine;
    glisse = null;
    if (deplacement < 4) {
      // clic simple → la caméra principale vole vers le point cliqué
      const cible = canvasVersLonLat({ px, py, ...params });
      const alt = viewer.camera.positionCartographic.height;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(cible.lon, cible.lat, Math.max(200, alt)),
        orientation: { heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: 0 },
        duration: 1.1,
      });
      if (!suivre) { suivre = true; div.querySelector('[data-a="suivre"]').classList.add('actif'); }
    } else if (suivre) {
      suivre = false; // un glisser franc coupe le suivi
      div.querySelector('[data-a="suivre"]').classList.remove('actif');
      origine.lon = origine.lon; // (référence conservée pour la suite du geste)
    }
  });
  canvas.addEventListener('pointercancel', () => { glisse = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const c = centreVue();
    const facteur = e.deltaY > 0 ? 1.3 : 1 / 1.3;
    allerA(c.lon, c.lat, c.altitude * facteur);
  }, { passive: false });

  // ——— boutons ———
  div.querySelector('[data-a="suivre"]').addEventListener('click', (e) => {
    suivre = !suivre;
    e.currentTarget.classList.toggle('actif', suivre);
    if (suivre) suivreCamera();
  });
  div.querySelector('[data-a="fond"]').addEventListener('click', () => {
    source = (source + 1) % SOURCES.length;
    tuiles.clear();
    dessiner();
  });
  const replier = () => { div.style.display = 'none'; puce.style.display = 'flex'; };
  div.querySelector('[data-a="puce"]').addEventListener('click', replier);
  div.querySelector('[data-a="fermer"]').addEventListener('click', replier);
  puce.addEventListener('click', () => {
    div.style.display = '';
    puce.style.display = 'none';
    dessiner();
  });

  /**
   * Recentre la minicarte sur la caméra principale (mode 🔒).
   * Exposé pour les tests et pour un recentrage manuel.
   */
  function suivreCamera() {
    if (!suivre) return false;
    const c = centreVue();
    const portee = porteeSelonAltitude(c.altitude);
    return { lon: c.lon, lat: c.lat, portee };
  }

  // ——— anti-collision : laisse la place aux panneaux du dock ———
  const visible = (el) => Boolean(el) && el.offsetParent !== null
    && window.getComputedStyle(el).display !== 'none';
  function syncCache() {
    const gaucheVisible = [...document.querySelectorAll('.wt-dock-panel.gauche, #wti-gauche, #wt-fiche, #wt-pins')]
      .some(visible);
    div.classList.toggle('wt-mm-cachée', gaucheVisible);
  }

  dessiner();
  const timer = window.setInterval(() => { if (!document.hidden) dessiner(); }, 220);
  const timerSync = window.setInterval(syncCache, 1200);
  syncCache();

  return {
    dessiner,
    suivreCamera,
    centreVue,
    arreter: () => { window.clearInterval(timer); window.clearInterval(timerSync); },
    setSuivre: (v) => { suivre = Boolean(v); },
  };
}
