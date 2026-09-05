/**
 * WATCHTOWER — MINICARTE : maths de tuiles (pures, sans DOM ni Cesium).
 *
 * La minicarte ne monte PLUS un second viewer Cesium (lourd, et fragile en
 * iframe) : c'est un simple canvas qui dessine des tuiles raster. Ce module
 * contient la projection Web Mercator / tuiles XYZ, testable en node.
 */

export const TUILE = 256;
/** Résolution (m/px) au zoom 0 à l'équateur. */
export const RES_Z0 = 156543.03392804097;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Largeur du « monde » en pixels à un zoom donné. */
export function mondePixels(z) {
  return TUILE * 2 ** z;
}

/**Longitude → pixel monde (x) au zoom z. */
export function lonVersPxMonde(lon, z) {
  return ((Number(lon) + 180) / 360) * mondePixels(z);
}

/** Latitude → pixel monde (y) au zoom z (Web Mercator). */
export function latVersPxMonde(lat, z) {
  const l = clamp(Number(lat), -85.05112878, 85.05112878) * (Math.PI / 180);
  const s = Math.sin(l);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * mondePixels(z);
}

/** Pixel monde (x) → longitude. */
export function pxMondeVersLon(x, z) {
  return (x / mondePixels(z)) * 360 - 180;
}

/** Pixel monde (y) → latitude. */
export function pxMondeVersLat(y, z) {
  const n = Math.PI - 2 * Math.PI * (y / mondePixels(z));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Résolution (mètres par pixel) au zoom z pour une latitude donnée. */
export function metresParPixel(z, lat = 0) {
  return (RES_Z0 * Math.cos(clamp(Number(lat), -89, 89) * (Math.PI / 180))) / 2 ** z;
}

/**
 * Zoom entier le plus proche d'une résolution demandée.
 * @param {number} mpp Mètres par pixel souhaités.
 * @param {number} lat Latitude du centre.
 * @param {{min?:number, max?:number}} [bornes]
 * @returns {number} Zoom entier borné.
 */
export function zoomPourMetresParPixel(mpp, lat = 0, { min = 2, max = 19 } = {}) {
  const m = Math.max(1e-6, Number(mpp) || 1);
  const z = Math.log2((RES_Z0 * Math.cos(clamp(lat, -89, 89) * (Math.PI / 180))) / m);
  return Math.round(clamp(z, min, max));
}

/** Index de tuile (x, y) contenant un point, au zoom z. */
export function indexTuile(lon, lat, z) {
  const monde = mondePixels(z);
  return {
    x: Math.floor((lonVersPxMonde(lon, z) / monde) * 2 ** z),
    y: Math.floor((latVersPxMonde(lat, z) / monde) * 2 ** z),
  };
}

/** Nombre maximal de tuiles sur un axe au zoom z. */
export function tuilesParAxe(z) {
  return 2 ** z;
}

/**
 * Liste les tuiles à dessiner pour couvrir un canvas centré sur un point.
 *
 * @param {object} p
 * @param {number} p.lon Longitude du centre.
 * @param {number} p.lat Latitude du centre.
 * @param {number} p.mpp Échelle souhaitée (mètres par pixel du canvas).
 * @param {number} p.largeur Largeur du canvas (px).
 * @param {number} p.hauteur Hauteur du canvas (px).
 * @param {number} p.z Zoom retenu.
 * @returns {Array<{x:number,y:number,dx:number,dy:number,taille:number,url?:(t:string)=>string}>}
 */
export function tuilesVisibles({ lon, lat, mpp, largeur, hauteur, z }) {
  const resTuile = metresParPixel(z, lat);
  const echelle = resTuile / (Number(mpp) || 1); // pixels canvas par pixel de tuile
  const taille = TUILE * echelle;
  const cx = lonVersPxMonde(lon, z);
  const cy = latVersPxMonde(lat, z);
  const demiW = largeur / 2;
  const demiH = hauteur / 2;
  const gauche = cx - demiW / echelle;
  const droite = cx + demiW / echelle;
  const haut = cy - demiH / echelle;
  const bas = cy + demiH / echelle;
  const x0 = Math.floor(gauche / TUILE);
  const x1 = Math.floor(droite / TUILE);
  const y0 = Math.floor(haut / TUILE);
  const y1 = Math.floor(bas / TUILE);
  const max = tuilesParAxe(z);
  const out = [];
  for (let y = y0; y <= y1; y += 1) {
    const yy = ((y % max) + max) % max; // enroulement longitudinal
    if (y < 0 || y >= max) continue; // hors latitude mercator
    for (let x = x0; x <= x1; x += 1) {
      out.push({
        x: ((x % max) + max) % max,
        y: yy,
        dx: demiW + (x * TUILE - cx) * echelle,
        dy: demiH + (y * TUILE - cy) * echelle,
        taille,
      });
    }
  }
  return out;
}

/**
 * Convertit un point écran du canvas en coordonnées géographiques
 * (clic / glisser sur la minicarte → déplacer la caméra principale).
 *
 * @param {object} p
 * @param {number} p.px Abscisse dans le canvas.
 * @param {number} p.py Ordonnée dans le canvas.
 * @returns {{lon:number,lat:number}}
 */
export function canvasVersLonLat({ px, py, lon, lat, mpp, largeur, hauteur, z }) {
  const resTuile = metresParPixel(z, lat);
  const echelle = resTuile / (Number(mpp) || 1);
  const cx = lonVersPxMonde(lon, z);
  const cy = latVersPxMonde(lat, z);
  const wx = cx + (px - largeur / 2) / echelle;
  const wy = cy + (py - hauteur / 2) / echelle;
  return { lon: pxMondeVersLon(wx, z), lat: pxMondeVersLat(wy, z) };
}

/**
 * Portée (m) couverte par la minicarte selon l'altitude de la caméra :
 * plus on est haut, plus la minicarte dézoomé pour rester lisible.
 */
export function porteeSelonAltitude(altitude) {
  const brut = Number(altitude);
  const h = Math.max(200, Number.isFinite(brut) ? brut : 1000);
  return Math.max(700, h * 1.9);
}
