/**
 * WATCHTOWER — VUES DE CAMÉRA DU MODE VOL (maths pures, sans Cesium).
 *
 * Trois façons de regarder, une seule physique :
 *
 *  · **POV**  — caméra embarquée : elle regarde où va l'appareil ;
 *  · **VTOL** — l'appareil fait du SUR-PLACE et la caméra devient une NACELLE
 *    d'observation : lacet 360° continu, site borné, indépendante du cap ;
 *  · **TPS**  — 3ᵉ personne : la caméra recule derrière l'appareil (toujours
 *    dans l'axe de la nacelle) et l'appareil devient visible.
 *
 * Ce module ne connaît ni le DOM ni Cesium : il est donc testable, et les
 * limites (site, distance, arrondi des caps) sont définies une seule fois.
 */

/** Vues disponibles, dans l'ordre de rotation de la touche V. */
export const VUES_VOL = Object.freeze([
  { cle: 'pov', ic: '👁', nom: 'POV', aide: 'caméra embarquée (pilotage)' },
  { cle: 'vtol', ic: '🧭', nom: 'VTOL', aide: 'sur-place + nacelle d’observation 360°' },
  { cle: 'tps', ic: '🎥', nom: '3ᵉ PERSONNE', aide: 'appareil visible, caméra en retrait' },
]);

/** Bornes du site (inclinaison verticale) de la nacelle, en radians. */
export const SITE_MIN = -1.45;
export const SITE_MAX = 0.55;

/** Recul de la caméra 3ᵉ personne (m). */
export const TPS_DEFAUT = Object.freeze({ distance: 42, hauteur: 12, min: 12, max: 220 });

const TAU = Math.PI * 2;
const RAYON_TERRE = 111320; // m par degré de latitude

/** Ramène un cap dans [0, 2π[ — le lacet de la nacelle tourne sans fin. */
export function normaliserCap(cap) {
  if (!Number.isFinite(cap)) return 0;
  const c = cap % TAU;
  return c < 0 ? c + TAU : c;
}

/** Borne le site (tangage) de la nacelle. */
export function bornerSite(site, min = SITE_MIN, max = SITE_MAX) {
  if (!Number.isFinite(site)) return 0;
  return Math.max(min, Math.min(max, site));
}

/** Orientation réellement appliquée à la caméra. */
export function orientationCamera({ cap = 0, tangage = 0 } = {}, nacelle = { cap: 0, tangage: 0 }) {
  return {
    cap: normaliserCap(cap + (Number(nacelle.cap) || 0)),
    tangage: bornerSite((Number(tangage) || 0) + (Number(nacelle.tangage) || 0)),
  };
}

/**
 * Position de la caméra en 3ᵉ personne : on recule de `distance` mètres dans
 * la direction opposée au regard, et on monte de `hauteur` mètres.
 * @returns {{lon:number, lat:number, alt:number, cap:number}}
 */
export function cameraTroisiemePersonne({ lon = 0, lat = 0, alt = 0, cap = 0 }, options = {}) {
  const d = Math.max(TPS_DEFAUT.min, Math.min(TPS_DEFAUT.max, Number(options.distance) ?? TPS_DEFAUT.distance));
  const h = Number.isFinite(options.hauteur) ? options.hauteur : TPS_DEFAUT.hauteur;
  // On recule : la caméra se place à l'opposé de la direction du regard.
  // (Cesium : cap 0 = nord, π/2 = est.)
  const c = normaliserCap(cap);
  const cosLat = Math.max(0.01, Math.cos((Number(lat) || 0) * Math.PI / 180));
  return {
    lat: (Number(lat) || 0) - (d * Math.cos(c)) / RAYON_TERRE,
    lon: (Number(lon) || 0) - (d * Math.sin(c)) / (RAYON_TERRE * cosLat),
    alt: (Number(alt) || 0) + h,
    cap: c,
  };
}

/**
 * Translation au sol en VTOL : `avant` et `cote` valent -1, 0 ou 1 et
 * `pas` est la distance parcourue, en mètres, dans le repère de l'APPAREIL
 * (jamais dans celui de la nacelle : sinon regarder derrière inverserait
 * les commandes).
 */
export function translationVtol({ lat = 0, lon = 0, cap = 0 }, { avant = 0, cote = 0, pas = 0 } = {}) {
  const cosLat = Math.max(0.01, Math.cos((Number(lat) || 0) * Math.PI / 180));
  const c = Number(cap) || 0;
  const a = Number(avant) || 0;
  const l = Number(cote) || 0;
  const p = Number(pas) || 0;
  return {
    lat: (Number(lat) || 0) + (a * Math.cos(c) - l * Math.sin(c)) * p / RAYON_TERRE,
    lon: (Number(lon) || 0) + (a * Math.sin(c) + l * Math.cos(c)) * p / (RAYON_TERRE * cosLat),
  };
}

/** Recul de caméra modifié par [ / ], borné. */
export function ajusterDistance(distance, delta) {
  const d = (Number.isFinite(distance) ? distance : TPS_DEFAUT.distance) + (Number(delta) || 0);
  return Math.max(TPS_DEFAUT.min, Math.min(TPS_DEFAUT.max, d));
}
