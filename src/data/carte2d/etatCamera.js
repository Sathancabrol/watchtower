/**
 * Transfert d'état de caméra entre le moteur 3D (Cesium) et le moteur 2D (MapLibre).
 *
 * Répond à la lacune **#9 de `docs/AUDIT.md`** (« 3D saturée ») et au chantier
 * **A2** : basculer en 2D quand la 3D n'apporte rien, pour cesser de saturer le
 * GPU. L'étude FOSS4G 2025 mesure, sur un même nuage de points, un *total
 * blocking time* de **21 357 ms sous Cesium contre 3 ms sous MapLibre**.
 *
 * ## Choix d'architecture : bascule franche
 *
 * Un seul moteur est actif à la fois. Faire tourner Cesium et MapLibre
 * simultanément doublerait la charge GPU — l'inverse du but recherché — et
 * imposerait de synchroniser deux caméras en continu. On transfère donc un
 * **état neutre** de l'un à l'autre, et on éteint le précédent.
 *
 * ## Le piège de la conversion d'altitude
 *
 * Cesium raisonne en **hauteur de caméra (mètres)**, MapLibre en **niveau de
 * zoom (0-24)**. La relation dépend de la latitude : à altitude égale, un degré
 * de longitude couvre moins de terrain près des pôles (facteur cos φ). Une
 * conversion naïve décale la vue de façon d'autant plus visible qu'on est loin
 * de l'équateur — à Sète (43,4° N), cos φ ≈ 0,73, soit près de 30 % d'écart.
 *
 * Fonctions pures : ni réseau, ni DOM, ni dépendance à Cesium ou MapLibre.
 * @module data/carte2d/etatCamera
 */

/** Taille d'une tuile de fond, en pixels (convention Web Mercator). */
export const TAILLE_TUILE = 512;

/** Circonférence équatoriale de la Terre, en mètres (WGS 84). */
export const CIRCONFERENCE_TERRE = 40_075_016.686;

/** Bornes de zoom acceptées par MapLibre. */
export const ZOOM_MIN = 0;
export const ZOOM_MAX = 24;

/** Champ de vision vertical de Cesium par défaut, en radians (~60°). */
export const FOV_DEFAUT = Math.PI / 3;

/**
 * Contraint une valeur dans un intervalle.
 * @param {number} v - Valeur.
 * @param {number} min - Borne basse.
 * @param {number} max - Borne haute.
 * @returns {number} Valeur bornée.
 */
export function borner(v, min, max) {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/**
 * Normalise une longitude dans [-180, 180].
 * Évite qu'une rotation continue vers l'est n'envoie la carte hors du monde.
 * @param {number} lon - Longitude en degrés.
 * @returns {number} Longitude normalisée.
 */
export function normaliserLongitude(lon) {
  if (!Number.isFinite(lon)) return 0;
  // Cas courant : deja dans la plage. On sort tel quel pour eviter que le
  // double modulo n introduise une derive flottante (3.7493 -> 3.74929...).
  if (lon >= -180 && lon <= 180) return Object.is(lon, -0) ? 0 : lon;
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  if (Object.is(l, -0)) l = 0;
  return l;
}

/**
 * Normalise un cap dans [0, 360[.
 * @param {number} deg - Cap en degrés.
 * @returns {number} Cap normalisé.
 */
export function normaliserCap(deg) {
  if (!Number.isFinite(deg)) return 0;
  return ((deg % 360) + 360) % 360;
}

/**
 * Résolution au sol, en mètres par pixel, pour un zoom et une latitude donnés.
 * @param {number} zoom - Niveau de zoom.
 * @param {number} latitude - Latitude en degrés.
 * @returns {number} Mètres par pixel.
 */
export function resolutionAuSol(zoom, latitude) {
  const lat = borner(latitude, -85.051129, 85.051129);
  return (CIRCONFERENCE_TERRE * Math.cos((lat * Math.PI) / 180))
    / (TAILLE_TUILE * 2 ** zoom);
}

/**
 * Convertit une hauteur de caméra Cesium en niveau de zoom MapLibre.
 * @param {number} hauteurM - Hauteur de la caméra en mètres.
 * @param {number} latitude - Latitude en degrés (corrige la projection).
 * @param {number} [hauteurVuePx=800] - Hauteur du canevas en pixels.
 * @param {number} [fov=FOV_DEFAUT] - Champ de vision vertical en radians.
 * @returns {number} Zoom borné à [0, 24].
 */
export function hauteurVersZoom(hauteurM, latitude, hauteurVuePx = 800, fov = FOV_DEFAUT) {
  const h = Number.isFinite(hauteurM) && hauteurM > 0 ? hauteurM : 1;
  const px = Number.isFinite(hauteurVuePx) && hauteurVuePx > 0 ? hauteurVuePx : 800;
  // Emprise verticale au sol couverte par le tronc de vision.
  const empriseM = 2 * h * Math.tan(fov / 2);
  const metresParPixel = empriseM / px;
  const lat = borner(latitude, -85.051129, 85.051129);
  const zoom = Math.log2(
    (CIRCONFERENCE_TERRE * Math.cos((lat * Math.PI) / 180)) / (TAILLE_TUILE * metresParPixel),
  );
  return borner(zoom, ZOOM_MIN, ZOOM_MAX);
}

/**
 * Convertit un niveau de zoom MapLibre en hauteur de caméra Cesium.
 * Réciproque exacte de `hauteurVersZoom` à paramètres identiques.
 * @param {number} zoom - Niveau de zoom.
 * @param {number} latitude - Latitude en degrés.
 * @param {number} [hauteurVuePx=800] - Hauteur du canevas en pixels.
 * @param {number} [fov=FOV_DEFAUT] - Champ de vision vertical en radians.
 * @returns {number} Hauteur en mètres, toujours strictement positive.
 */
export function zoomVersHauteur(zoom, latitude, hauteurVuePx = 800, fov = FOV_DEFAUT) {
  const z = borner(zoom, ZOOM_MIN, ZOOM_MAX);
  const px = Number.isFinite(hauteurVuePx) && hauteurVuePx > 0 ? hauteurVuePx : 800;
  const metresParPixel = resolutionAuSol(z, latitude);
  const empriseM = metresParPixel * px;
  return Math.max(1, empriseM / (2 * Math.tan(fov / 2)));
}

/**
 * Construit un état de caméra neutre, indépendant des deux moteurs.
 * C'est le format d'échange de la bascule.
 * @param {{lon?:number, lat?:number, hauteurM?:number, capDeg?:number, tangageDeg?:number}} [brut]
 * @returns {{lon:number, lat:number, hauteurM:number, capDeg:number, tangageDeg:number}} État sûr.
 */
export function etatNeutre(brut = {}) {
  const b = brut && typeof brut === 'object' ? brut : {};
  return {
    lon: normaliserLongitude(b.lon ?? 0),
    lat: borner(b.lat ?? 0, -85.051129, 85.051129),
    hauteurM: Number.isFinite(b.hauteurM) && b.hauteurM > 0 ? b.hauteurM : 1000,
    capDeg: normaliserCap(b.capDeg ?? 0),
    // MapLibre n'accepte pas plus de 60° d'inclinaison ; au-delà on aplatit.
    tangageDeg: borner(b.tangageDeg ?? 0, -90, 90),
  };
}

/**
 * Traduit un état neutre en paramètres MapLibre.
 * @param {object} etat - État issu de `etatNeutre`.
 * @param {number} [hauteurVuePx=800] - Hauteur du canevas en pixels.
 * @returns {{center:[number,number], zoom:number, bearing:number, pitch:number}} Vue MapLibre.
 */
export function versMapLibre(etat, hauteurVuePx = 800) {
  const e = etatNeutre(etat);
  // MapLibre plafonne l'inclinaison à 60° et n'accepte pas de valeur négative.
  const pitch = borner(Math.abs(e.tangageDeg) > 90 ? 0 : 90 - Math.abs(e.tangageDeg), 0, 60);
  return {
    center: [e.lon, e.lat],
    zoom: hauteurVersZoom(e.hauteurM, e.lat, hauteurVuePx),
    bearing: e.capDeg,
    pitch,
  };
}

/**
 * Traduit une vue MapLibre en état neutre.
 * @param {{center?:[number,number]|{lng:number,lat:number}, zoom?:number, bearing?:number, pitch?:number}} vue
 * @param {number} [hauteurVuePx=800] - Hauteur du canevas en pixels.
 * @returns {object} État neutre.
 */
export function depuisMapLibre(vue, hauteurVuePx = 800) {
  const c = vue?.center;
  const lon = Array.isArray(c) ? c[0] : c?.lng;
  const lat = Array.isArray(c) ? c[1] : c?.lat;
  const latSure = borner(lat ?? 0, -85.051129, 85.051129);
  return etatNeutre({
    lon,
    lat: latSure,
    hauteurM: zoomVersHauteur(vue?.zoom ?? 0, latSure, hauteurVuePx),
    capDeg: vue?.bearing ?? 0,
    // Cesium mesure le tangage depuis l'horizontale, vers le bas : -90° = nadir.
    tangageDeg: -(90 - borner(vue?.pitch ?? 0, 0, 60)),
  });
}

/**
 * Décide si la bascule vers la 2D est pertinente.
 *
 * La 3D ne sert à rien quand la caméra regarde droit vers le bas, ou quand on
 * est trop haut pour distinguer le moindre relief. Dans ces cas, elle ne fait
 * que consommer du GPU.
 *
 * @param {object} etat - État neutre courant.
 * @param {{fpsMoyen?:number, seuilFps?:number}} [perf] - Mesures de performance.
 * @returns {{basculer:boolean, raison:string}} Décision motivée.
 */
export function conseillerBascule2D(etat, perf = {}) {
  const e = etatNeutre(etat);
  const seuil = Number.isFinite(perf.seuilFps) ? perf.seuilFps : 25;
  if (Number.isFinite(perf.fpsMoyen) && perf.fpsMoyen < seuil) {
    return { basculer: true, raison: `Rendu à ${Math.round(perf.fpsMoyen)} i/s : la 2D soulagera le GPU.` };
  }
  if (Math.abs(e.tangageDeg) > 80) {
    return { basculer: true, raison: 'Vue au nadir : le relief n’apporte rien ici.' };
  }
  if (e.hauteurM > 2_000_000) {
    return { basculer: true, raison: 'Altitude orbitale : la 2D est plus lisible et bien plus légère.' };
  }
  return { basculer: false, raison: 'La 3D reste pertinente à cette échelle.' };
}
