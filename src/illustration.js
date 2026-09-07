/**
 * WATCHTOWER — ILLUSTRATION DE LA FICHE LIEU.
 *
 * Une fiche sans image, c'est une fiche morte. Deux sources, toutes ouvertes :
 *
 *  1. **Wikimedia Commons** (libre, sans clé) : recherche GÉOLOCALISÉE autour
 *     du point, puis recherche par NOM si le géo-échec. Fournit la vignette,
 *     l'auteur, la licence et le lien vers le fichier d'origine.
 *  2. **Capture drone** : si aucune photo n'existe (un sommet perdu, un champ…),
 *     on fabrique l'illustration NOUS-MÊMES : on place une caméra virtuelle
 *     comme un drone au-dessus du point, on rend une image et on la capture
 *     depuis le canvas 3D. Aucun service externe, toujours disponible.
 *
 * `preserveDrawingBuffer` est activé dans main.js : le canvas peut donc être
 * lu à tout moment.
 */

import * as Cesium from 'cesium';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

const COMMONS = 'https://commons.wikimedia.org/w/api.php';

/** Construit l'URL de la recherche géolocalisée Commons. */
export function urlGeosearch(lat, lon, rayon = 2_500, limite = 24) {
  const p = new URLSearchParams({
    action: 'query', format: 'json', list: 'geosearch',
    gscoord: `${lat}|${lon}`, gsradius: String(Math.min(10_000, Math.max(100, rayon))),
    gslimit: String(limite), gsnamespace: '6', origin: '*',
  });
  return `${COMMONS}?${p}`;
}

/** Construit l'URL d'information (vignette + licence) d'un fichier. */
export function urlImageInfo(titre, largeur = 720) {
  const p = new URLSearchParams({
    action: 'query', format: 'json', titles: titre, prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime', iiurlwidth: String(largeur), origin: '*',
  });
  return `${COMMONS}?${p}`;
}

/** Construit l'URL de recherche plein texte (repli si pas de géo). */
export function urlRechercheNom(terme, limite = 8) {
  const p = new URLSearchParams({
    action: 'query', format: 'json', list: 'search',
    srsearch: `${terme} filetype:bitmap`, srnamespace: '6',
    srlimit: String(limite), origin: '*',
  });
  return `${COMMONS}?${p}`;
}

/** Retire le HTML renvoyé par Commons dans les champs auteur/licence. */
export function nettoyerHtml(brut = '') {
  return String(brut)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, '\u00a0')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrait les titres de fichiers d'une réponse `list=geosearch`. */
export function titresDeGeosearch(json) {
  const liste = json?.query?.geosearch;
  if (!Array.isArray(liste)) return [];
  return liste
    .filter((f) => /^File:/i.test(f.title || ''))
    .sort((a, b) => (a.dist || 1e9) - (b.dist || 1e9))
    .map((f) => ({ titre: f.title, dist: f.dist ?? null }));
}

/** Extrait les titres d'une réponse `list=search`. */
export function titresDeRecherche(json) {
  const liste = json?.query?.search;
  if (!Array.isArray(liste)) return [];
  return liste.filter((f) => /^File:/i.test(f.title || '')).map((f) => ({ titre: f.title, dist: null }));
}

/**
 * Extrait la vignette + crédits d'une réponse `prop=imageinfo`.
 * @returns {{url:string, page:string, titre:string, auteur:string, licence:string, mime:string}|null}
 */
export function imageDeInfo(json) {
  const pages = json?.query?.pages || {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  const mime = info.mime || '';
  if (!/^image\//.test(mime)) return null; // pas les PDF/sons
  return {
    url: info.thumburl || info.url,
    page: info.descriptionurl || '',
    titre: String(page.title || '').replace(/^File:/i, ''),
    auteur: nettoyerHtml(meta.Artist?.value || '') || 'auteur non précisé',
    licence: nettoyerHtml(meta.LicenseShortName?.value || '') || 'voir Commons',
    mime,
  };
}

async function jsonOuNull(url, delai = 8_000) {
  try {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    const j = await r.json();
    clearTimeout(minuteur);
    return j;
  } catch {
    return null;
  }
}

/**
 * Liste les photos libres autour du lieu (géolocalisation d'abord, nom ensuite).
 * @param {number} lat
 * @param {number} lon
 * @param {string} [nom] nom du lieu (repli texte)
 * @param {number} [rayon] m
 * @param {number} [limite] nombre maximum de photos
 * @returns {Promise<Array<object>>}
 */
export async function listerCommons(lat, lon, nom = '', rayon = 2_500, limite = 6) {
  const geo = await jsonOuNull(urlGeosearch(lat, lon, rayon));
  let candidats = titresDeGeosearch(geo);
  if (!candidats.length && nom && nom.length > 3) {
    const txt = await jsonOuNull(urlRechercheNom(nom));
    candidats = titresDeRecherche(txt);
  }
  const out = [];
  for (const c of candidats.slice(0, Math.max(2, limite * 2))) {
    if (out.length >= limite) break;
    const info = imageDeInfo(await jsonOuNull(urlImageInfo(c.titre)));
    if (info?.url) {
      out.push({
        ...info,
        dist: c.dist,
        source: 'Wikimedia Commons',
        credit: `${info.auteur} · ${info.licence}`,
      });
    }
  }
  return out;
}

/**
 * Cherche UNE photo libre illustrant le lieu (la plus proche).
 * @returns {Promise<object|null>}
 */
export async function chercherCommons(lat, lon, nom = '', rayon = 2_500) {
  const liste = await listerCommons(lat, lon, nom, rayon, 1);
  return liste[0] || null;
}

/** Même chose en élargissant le rayon (quand le lieu est isolé). */
export async function chercherCommonsLarge(lat, lon, nom = '') {
  return chercherCommons(lat, lon, nom, 10_000);
}

/**
 * Angles de prise de vue « drone » : plusieurs passages autour du point.
 */
export const CADRAGES_DRONE = Object.freeze([
  { cle: 'large', nom: 'VUE LARGE', altitude: 320, distance: 900, cap: 0, tangage: -38 },
  { cle: 'approche', nom: 'APPROCHE', altitude: 160, distance: 420, cap: 90, tangage: -30 },
  { cle: 'rase', nom: 'VUE RASE', altitude: 90, distance: 260, cap: 200, tangage: -16 },
  { cle: 'pique', nom: 'PIQUÉ', altitude: 240, distance: 120, cap: 300, tangage: -62 },
]);

/**
 * Capture une vue drone du point : on place la caméra, on rend une image, on
 * la lit dans le canvas, puis on restaure exactement la vue d'avant.
 *
 * @param {object} viewer
 * @param {{lat:number, lon:number}} point
 * @param {object} [cadrage] entrée de CADRAGES_DRONE
 * @returns {Promise<{url:string, altitude:number, cadrage:string}|null>}
 */
export async function capturerDrone(viewer, point, cadrage = CADRAGES_DRONE[1]) {
  const { lat, lon } = point || {};
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const camera = viewer.camera;
  // — mémoire de la vue courante (pour la rendre intacte) —
  const avant = {
    position: camera.positionWC.clone(new Cesium.Cartesian3()),
    direction: camera.directionWC.clone(new Cesium.Cartesian3()),
    haut: camera.upWC.clone(new Cesium.Cartesian3()),
    fov: Cesium.Math.toDegrees(camera.frustum.fov ?? 1),
    aspect: camera.frustum.aspectRatio,
  };
  const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat)) || 0;
  const altitude = Math.max(40, cadrage.altitude + sol);
  const cible = Cesium.Cartesian3.fromDegrees(lon, lat, sol);

  const id = holdContinuousRender('wt-capture-drone');
  let url = null;
  try {
    camera.lookAt(
      cible,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(cadrage.cap),
        Cesium.Math.toRadians(cadrage.tangage),
        cadrage.distance,
      ),
    );
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // figer la position
    // hausse artificielle pour dominer le relief
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, altitude);
    camera.setView({
      destination: pos,
      orientation: {
        heading: Cesium.Math.toRadians(cadrage.cap),
        pitch: Cesium.Math.toRadians(cadrage.tangage),
        roll: 0,
      },
    });
    viewer.scene.render();
    url = viewer.scene.canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    url = null;
  } finally {
    // — retour à la vue d'origine, sans que l'utilisateur voie la coupe —
    try {
      camera.setView({
        destination: avant.position,
        orientation: { direction: avant.direction, up: avant.haut },
      });
      if (Number.isFinite(avant.fov)) camera.frustum.fov = Cesium.Math.toRadians(avant.fov);
      if (Number.isFinite(avant.aspect)) camera.frustum.aspectRatio = avant.aspect;
    } catch { /* tant pis */ }
    releaseContinuousRender(id);
    governorRequestRender('wt-capture-drone');
  }
  return url ? { url, altitude: Math.round(altitude), cadrage: cadrage.nom, source: 'capture drone WATCHTOWER' } : null;
}

/**
 * Illustration garantie : la photo libre si elle existe, sinon une capture
 * drone fabriquée localement (donc jamais de fiche vide).
 */
export async function illustrationPour(viewer, lat, lon, nom = '') {
  const photo = await chercherCommons(lat, lon, nom, 2_500);
  if (photo) return photo;
  const large = await chercherCommonsLarge(lat, lon, nom);
  if (large) return large;
  const drone = await capturerDrone(viewer, { lat, lon });
  return drone || null;
}
