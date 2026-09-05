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
  lonLatVersCanvas,
  porteeSelonAltitude,
  tuilesVisibles,
  zoomPourMetresParPixel,
} from './tuilesMath.js';

/** La minicarte est un GLOBE : format carré, dessin circulaire. */
const LARGEUR = 178;
const HAUTEUR = 178;
const RAYON = LARGEUR / 2 - 1;

/** Fonds de carte gratuits (sans clé, CORS ouvert) — dont le satellite Esri,
 *  qui est aussi le fond de la vue principale. */
const SOURCES = [
  { nom: 'CARTO Voyager', url: (x, y, z) => `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png` },
  { nom: '🛰 Satellite', url: (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}` },
  { nom: 'CARTO Dark', url: (x, y, z) => `https://basemaps.cartocdn.com/rastertiles/dark_all/${z}/${x}/${y}.png` },
  { nom: 'OSM Classic', url: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png` },
];

/** Filtres d'affichage de la minicarte (canvas `ctx.filter`). */
const FILTRES = [
  { nom: 'aucun', css: 'none' },
  { nom: 'nuit', css: 'brightness(0.62) saturate(0.75) hue-rotate(190deg)' },
  { nom: 'infra', css: 'grayscale(1) contrast(1.3)' },
  { nom: 'sépia', css: 'sepia(0.7) contrast(1.08)' },
  { nom: 'dur', css: 'contrast(1.6) saturate(1.25)' },
  // ▚ MATRIX : l'OSM par-dessus le satellite, le tout en vert néon.
  { nom: 'MATRIX', css: 'none', matrice: true },
];

/** Rang du satellite et de l'OSM dans `SOURCES` (robuste si on réordonne). */
const idSource = (mot) => SOURCES.findIndex((s) => s.nom.includes(mot));
const ID_SATELLITE = Math.max(0, idSource('Satellite'));
const ID_OSM = Math.max(0, idSource('OSM'));
/** Teinte « matrice » : niveaux de gris → sépia → vert néon saturé. */
const TEINTE_MATRIX = 'grayscale(1) brightness(0.55) sepia(1) hue-rotate(62deg) saturate(9) contrast(1.9)';

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
#wt-minimap .wt-mm-vid {
  width: ${LARGEUR}px; height: ${HAUTEUR}px; position: relative; background: #08111c;
  display: flex; align-items: center; justify-content: center;
}
#wt-minimap .wt-mm-vid canvas {
  display: block; width: ${LARGEUR}px; height: ${HAUTEUR}px; cursor: grab; outline: none;
  border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,212,255,0.35), 0 0 18px rgba(0,212,255,0.18);
}
/* la boussole vit DANS la minicarte, au-dessus du globe */
#wt-minimap .wt-mm-boussole { padding: 4px 0 2px; display: flex; justify-content: center; }
#wt-minimap .wt-mm-boussole:empty { display: none; }
#wt-minimap .wt-mm-boussole #wt-boussole { position: static !important; transform: none !important; }
#wt-minimap .wt-mm-note { padding: 3px 7px; font-size: 7.5px; letter-spacing: 0.5px; color: rgba(232,234,237,0.5); }
#wt-minimap .wt-mm-note b { color: #00d4ff; font-weight: 700; }
#wt-minimap-puce {
  position: fixed; left: 12px; bottom: 88px; z-index: 948; cursor: pointer;
  width: 40px; height: 40px; border-radius: 10px; background: rgba(6,10,16,0.92);
  border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; font-size: 17px;
  display: none; align-items: center; justify-content: center;
}
`;

/**
 * Visibilité réelle d'un panneau. Les panneaux WATCHTOWER sont en
 * `position: fixed` : `offsetParent` y vaut null par spécification, donc on
 * combine style calculé et boîte à l'écran.
 * @param {HTMLElement|null} el
 * @returns {boolean}
 */
export function estVisible(el) {
  if (!el || !el.isConnected) return false;
  if (el.classList?.contains('wt-mm-cachée') || el.classList?.contains('wt-dock-cache')) return false;
  if (el.style?.display === 'none') return false;
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
  }
  const r = el.getBoundingClientRect?.();
  return !r || (r.width > 0 && r.height > 0);
}

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
        <button type="button" data-a="filtre" title="Filtre d’affichage (nuit, infra, sépia…)">🎨</button>
        <button type="button" data-a="matrix" title="▚ MATRIX : la couche OpenStreetMap sur le satellite, en vert néon">▚</button>
        <button type="button" data-a="puce" title="Replier en puce">▣</button>
        <button type="button" data-a="fermer" title="Fermer (revenir via la puce 🗺)">✕</button>
      </span>
    </div>
    <div class="wt-mm-boussole"></div>
    <div class="wt-mm-vid"></div>
    <div class="wt-mm-note">🔒 suit la vue · clic/glisser = se déplacer · molette = zoom</div>`;
  document.body.appendChild(div);
  rendreDeplacable(div, div.querySelector('.wt-mm-titre'));

  const zone = div.querySelector('.wt-mm-vid');
  const logementBoussole = div.querySelector('.wt-mm-boussole');
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
  /**
   * Vue PROPRE à la minicarte (mode autonome). Quand elle est définie, la
   * minicarte ne suit plus la caméra : elle montre son propre point et son
   * propre zoom. C'est ce qui permet de jouer une animation (descente
   * « ×1 ×10 ×1000 ») DANS la minicarte sans bouger la vue principale.
   * @type {{lon:number, lat:number, altitude:number}|null}
   */
  let vue = null;
  /** Quand vrai, la minicarte reste affichée même si un panneau s'ouvre. */
  let forcee = false;
  let filtre = 0;
  /** @type {Map<string, HTMLImageElement>} */
  const tuiles = new Map();

  /** @param {number} [src] rang de la source (défaut : le fond choisi). */
  function tuile(x, y, z, src = source) {
    const cle = `${src}:${z}/${x}/${y}`; // une source = une entrée de cache
    const connue = tuiles.get(cle);
    if (connue) return connue;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (!document.hidden) dessiner(); };
    img.src = SOURCES[src].url(x, y, z);
    tuiles.set(cle, img);
    if (tuiles.size > 400) {
      const plusVieille = tuiles.keys().next().value;
      tuiles.delete(plusVieille);
    }
    return img;
  }

  /** Point visé : la vue AUTONOME de la minicarte si elle existe, sinon le
   *  centre de l'écran principal + altitude de la caméra. */
  function centreVue() {
    if (vue) return { lon: vue.lon, lat: vue.lat, altitude: vue.altitude, vise: true };
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

  /**
   * Emprise au sol de la vue PRINCIPALE (les 4 coins de l'écran projetés sur
   * l'ellipsoïde). Rend la minicarte lisible comme un vrai plan 2D à
   * l'échelle : on voit exactement ce que la caméra couvre.
   * @returns {Array<{lon:number,lat:number}>|null} null si l'horizon est dans
   * le champ (les coins hauts ne touchent pas le globe).
   */
  function empreintePrincipale() {
    try {
      const c = viewer.camera;
      const ecran = viewer.scene.canvas;
      const w = ecran.clientWidth || ecran.width;
      const h = ecran.clientHeight || ecran.height;
      if (!w || !h) return null;
      const out = [];
      for (const [px, py] of [[2, 2], [w - 2, 2], [w - 2, h - 2], [2, h - 2]]) {
        const p = c.pickEllipsoid(new Cesium.Cartesian2(px, py), viewer.scene.globe.ellipsoid);
        if (!p) return null;
        const g = Cesium.Cartographic.fromCartesian(p);
        out.push({ lon: Cesium.Math.toDegrees(g.longitude), lat: Cesium.Math.toDegrees(g.latitude) });
      }
      return out;
    } catch { return null; }
  }

  function dessiner() {
    // rien à dessiner si la minicarte est repliée, fermée ou masquée par un
    // panneau : on économise le CPU (et les tuiles) plutôt que de boucler.
    // NB : `offsetParent` vaut TOUJOURS null sur un élément `position: fixed`
    // (spécification) — s'en servir pour tester la visibilité vidait la
    // minicarte en permanence. On passe par le style calculé + la boîte.
    if (!ctx || !estVisible(div)) return;
    const centre = centreVue();
    const portee = porteeSelonAltitude(centre.altitude);
    const mpp = portee / LARGEUR;
    const z = zoomPourMetresParPixel(mpp, centre.lat);

    // ── le GLOBE : tout le dessin est découpé dans un cercle ──
    const CX = LARGEUR / 2;
    const CY = HAUTEUR / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, RAYON, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#08111c';
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

    const mode = FILTRES[filtre] || FILTRES[0];
    const matrice = Boolean(mode.matrice);
    const filtrable = 'filter' in ctx;
    // couleurs : vert néon en MATRIX, cyan WATCHTOWER sinon
    const vif = matrice ? '#7dff4a' : '#00d4ff';
    const doux = (a) => (matrice ? `rgba(125,255,74,${a})` : `rgba(0,212,255,${a})`);
    const grille = tuilesVisibles({
      lon: centre.lon, lat: centre.lat, mpp, largeur: LARGEUR, hauteur: HAUTEUR, z,
    });
    const peindre = (src, css, alpha) => {
      ctx.save();
      if (alpha < 1) ctx.globalAlpha = alpha;
      if (filtrable && css && css !== 'none') ctx.filter = css;
      for (const t of grille) {
        const img = tuile(t.x, t.y, z, src);
        if (img.complete && img.naturalWidth > 0) {
          try { ctx.drawImage(img, t.dx, t.dy, t.taille, t.taille); } catch { /* image morte */ }
        }
      }
      ctx.restore();
    };
    // 1) le fond : le satellite en MATRIX (l'OSM vient se poser dessus),
    //    sinon la source choisie avec son filtre.
    peindre(matrice ? ID_SATELLITE : source, mode.css, 1);
    // 2) ▚ MATRIX : la couche OpenStreetMap PROJETÉE sur le satellite, en
    //    vert néon — on lit la voirie et les noms par-dessus la photo.
    if (matrice) {
      peindre(ID_OSM, TEINTE_MATRIX, 0.78);
      // grille + balayage, pour l'ambiance « affichage de casque »
      ctx.save();
      ctx.strokeStyle = 'rgba(125,255,74,0.13)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= LARGEUR; gx += 12) {
        ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, HAUTEUR); ctx.stroke();
      }
      for (let gy = 0; gy <= HAUTEUR; gy += 12) {
        ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(LARGEUR, gy + 0.5); ctx.stroke();
      }
      const balayage = (Date.now() / 9) % (HAUTEUR + 40) - 20;
      const degr = ctx.createLinearGradient(0, balayage - 18, 0, balayage + 18);
      degr.addColorStop(0, 'rgba(125,255,74,0)');
      degr.addColorStop(0.5, 'rgba(125,255,74,0.16)');
      degr.addColorStop(1, 'rgba(125,255,74,0)');
      ctx.fillStyle = degr;
      ctx.fillRect(0, balayage - 18, LARGEUR, 36);
      ctx.restore();
    }

    // ——— emprise RÉELLE de la vue principale (2D, à l'échelle) ———
    const coins = empreintePrincipale();
    if (coins && coins.length >= 3) {
      const proj = coins.map((c) => lonLatVersCanvas({
        lon: c.lon,
        lat: c.lat,
        centreLon: centre.lon,
        centreLat: centre.lat,
        mpp,
        largeur: LARGEUR,
        hauteur: HAUTEUR,
        z,
      }));
      ctx.beginPath();
      proj.forEach((p, i) => (i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py)));
      ctx.closePath();
      ctx.fillStyle = doux(0.10);
      ctx.fill();
      ctx.strokeStyle = doux(0.85);
      ctx.lineWidth = 1.4;
      ctx.stroke();
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
    ctx.fillStyle = doux(0.14);
    ctx.fill();
    ctx.strokeStyle = doux(0.55);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = vif;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(LARGEUR / 2 - 7, HAUTEUR / 2);
    ctx.lineTo(LARGEUR / 2 + 7, HAUTEUR / 2);
    ctx.moveTo(LARGEUR / 2, HAUTEUR / 2 - 7);
    ctx.lineTo(LARGEUR / 2, HAUTEUR / 2 + 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(LARGEUR / 2, HAUTEUR / 2, 9, 0, Math.PI * 2);
    ctx.strokeStyle = doux(0.5);
    ctx.stroke();

    // ——— nord ———
    ctx.fillStyle = doux(0.85);
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', LARGEUR / 2, 12);
    ctx.beginPath();
    ctx.moveTo(LARGEUR / 2, 29);
    ctx.lineTo(LARGEUR / 2, 16);
    ctx.lineTo(LARGEUR / 2 - 3, 20);
    ctx.moveTo(LARGEUR / 2, 16);
    ctx.lineTo(LARGEUR / 2 + 3, 20);
    ctx.strokeStyle = doux(0.85);
    ctx.stroke();

    // ——— échelle ———
    const barre = 56;
    const bx = (LARGEUR - barre) / 2;
    ctx.strokeStyle = 'rgba(232,234,237,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, HAUTEUR - 10);
    ctx.lineTo(bx + barre, HAUTEUR - 10);
    ctx.moveTo(bx, HAUTEUR - 13);
    ctx.lineTo(bx, HAUTEUR - 7);
    ctx.moveTo(bx + barre, HAUTEUR - 13);
    ctx.lineTo(bx + barre, HAUTEUR - 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,234,237,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(formaterEchelle(barre * mpp), (LARGEUR - barre) / 2, HAUTEUR - 15);

    // ——— graticule (méridiens/parallèles) : donne le relief de sphère ———
    ctx.save();
    ctx.strokeStyle = doux(0.10);
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i += 1) {
      const y = (HAUTEUR / 6) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LARGEUR, y); ctx.stroke();
      const x = (LARGEUR / 6) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HAUTEUR); ctx.stroke();
    }
    ctx.restore();

    // ——— ombre de limbe + reflet : la sphère ———
    const limbe = ctx.createRadialGradient(CX, CY, RAYON * 0.55, CX, CY, RAYON);
    limbe.addColorStop(0, 'rgba(0,0,0,0)');
    limbe.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = limbe;
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);
    const reflet = ctx.createRadialGradient(CX - RAYON * 0.4, CY - RAYON * 0.45, 1, CX - RAYON * 0.4, CY - RAYON * 0.45, RAYON * 0.85);
    reflet.addColorStop(0, 'rgba(255,255,255,0.16)');
    reflet.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = reflet;
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);
    ctx.restore(); // fin du découpage circulaire

    // ——— anneau du globe ———
    ctx.beginPath();
    ctx.arc(CX, CY, RAYON, 0, Math.PI * 2);
    ctx.strokeStyle = doux(0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const nomFiltre = filtre ? ` · 🎨 ${FILTRES[filtre].nom}` : '';
    note.innerHTML = (suivre
      ? `🔒 suit la vue · <b>${formaterEchelle(portee)}</b> de large`
      : `✋ navigation libre · <b>${formaterEchelle(portee)}</b> de large`)
      + ` · ${SOURCES[source].nom}${nomFiltre}`;
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
  const ID_MATRIX = FILTRES.findIndex((f) => f.matrice);
  const appliquerFiltre = (n) => {
    filtre = ((n % FILTRES.length) + FILTRES.length) % FILTRES.length;
    for (const b of div.querySelectorAll('[data-a="matrix"], [data-a="filtre"]')) {
      b.classList.toggle('actif', filtre === ID_MATRIX);
    }
    dessiner();
  };
  div.querySelector('[data-a="filtre"]').addEventListener('click', () => appliquerFiltre(filtre + 1));
  // ▚ un seul clic : MATRIX (OSM vert néon sur le satellite), re-clic = retour
  div.querySelector('[data-a="matrix"]').addEventListener('click', () => appliquerFiltre(filtre === ID_MATRIX ? 0 : ID_MATRIX));
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
    if (!suivre || vue) return false;
    const c = centreVue();
    const portee = porteeSelonAltitude(c.altitude);
    return { lon: c.lon, lat: c.lat, portee };
  }

  // ——— anti-collision : laisse la place aux panneaux du dock ———
  function syncCache() {
    if (forcee) return; // animation en cours : la minicarte reste visible
    const gaucheVisible = [...document.querySelectorAll('.wt-dock-panel.gauche, #wti-gauche, #wt-fiche, #wt-pins')]
      .some(estVisible);
    div.classList.toggle('wt-mm-cachée', gaucheVisible);
  }

  dessiner();
  const timer = window.setInterval(() => { if (!document.hidden) dessiner(); }, 220);
  const timerSync = window.setInterval(syncCache, 1200);
  syncCache();

  /**
   * Bascule la minicarte sur sa propre vue (ou la rend à la caméra).
   * @param {{lon:number, lat:number, altitude:number}|null} v
   */
  function definirVue(v) {
    if (v && Number.isFinite(v.lat) && Number.isFinite(v.lon)) {
      vue = { lon: v.lon, lat: v.lat, altitude: Math.max(50, Number(v.altitude) || 1000) };
      const bouton = div.querySelector('[data-a="suivre"]');
      if (bouton) bouton.classList.remove('actif');
    } else {
      vue = null;
      const bouton = div.querySelector('[data-a="suivre"]');
      if (bouton && suivre) bouton.classList.add('actif');
    }
    dessiner();
    return vue ? { ...vue } : null;
  }

  /**
   * Anime la minicarte : descente (ou montée) progressive vers un point.
   * Interpolation LOGARITHMIQUE de l'altitude — c'est ainsi que l'œil lit un
   * zoom (passer de 20 000 km à 2 000 km doit sembler aussi long que de
   * 200 m à 20 m).
   *
   * @param {object} p
   * @param {number} p.lon @param {number} p.lat
   * @param {number} p.altitudeDepart @param {number} p.altitudeFin
   * @param {number} [p.duree] ms
   * @param {(avancement:number, altitude:number) => void} [p.surProgres]
   * @returns {Promise<boolean>} vrai si menée à son terme (faux si interrompue)
   */
  function animer(p = {}) {
    const {
      lon, lat, altitudeDepart, altitudeFin, duree = 2_000, surProgres = null,
    } = p;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return Promise.resolve(false);
    const a0 = Math.max(20, Math.log(Math.max(20, Number(altitudeDepart) || 20_000_000)));
    const a1 = Math.max(20, Math.log(Math.max(20, Number(altitudeFin) || 200)));
    const ms = Math.max(400, Number(duree) || 2_000);
    const debut = performance.now();
    let precedente = 0;
    return new Promise((res) => {
      const pas = (maintenant) => {
        if (!vue || arretAnimation) { res(false); return; }
        const t = Math.min(1, (maintenant - debut) / ms);
        // ease-in-out : départ et arrivée doux
        const k = t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
        const altitude = Math.exp(a0 + (a1 - a0) * k);
        vue = { lon, lat, altitude };
        // ~24 images/s suffisent pour une minicarte : on ménage le CPU
        if (maintenant - precedente > 40) {
          precedente = maintenant;
          dessiner();
        }
        surProgres?.(t, altitude);
        if (t >= 1) { res(true); return; }
        requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });
  }

  let arretAnimation = false;

  /**
   * Accueille la boussole DANS la fenêtre de la minicarte, juste au-dessus
   * du globe (demandé : « mets la sur la minicarte, mais dans sa fenêtre »).
   * @param {{element:HTMLElement, regler?:Function, heberger?:Function}} boussole
   */
  function accueillirBoussole(boussole) {
    if (!boussole?.element || !logementBoussole) return false;
    logementBoussole.appendChild(boussole.element);
    try {
      boussole.regler?.({ orientation: 'horizontal', longueur: LARGEUR - 6, largeur: 30, visible: true });
      boussole.heberger?.(logementBoussole);
    } catch { /* boussole absente */ }
    return true;
  }

  return {
    accueillirBoussole,
    dessiner,
    suivreCamera,
    centreVue,
    definirVue,
    animer,
    /** Interrompt une animation en cours. */
    arreterAnimation: () => { arretAnimation = true; window.setTimeout(() => { arretAnimation = false; }, 60); },
    /** Garde la minicarte affichée même si un panneau du dock s'ouvre. */
    forcer: (etat) => {
      forcee = Boolean(etat);
      if (forcee) div.classList.remove('wt-mm-cachée');
      else syncCache();
    },
    /** Boîte de la minicarte (pour coller une fenêtre dessus). */
    rect: () => div.getBoundingClientRect(),
    arreter: () => { window.clearInterval(timer); window.clearInterval(timerSync); },
    setSuivre: (v) => { suivre = Boolean(v); },
  };
}
