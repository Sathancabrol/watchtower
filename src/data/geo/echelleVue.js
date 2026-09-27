/**
 * WATCHTOWER — ÉCHELLE DE LA VUE : dire ce qu'on REGARDE, pas ce qu'il y a
 * sous le pixel central.
 *
 * Le repère de position annonçait « FRONTIGNAN — COMMUNE · 34 » alors que la
 * caméra était à 500 km : le nom était exact mais la réponse hors sujet, car
 * à cette hauteur l'écran montre un quart de l'Europe. Une commune n'a de sens
 * que quand elle remplit l'image.
 *
 * Ce module fait deux choses, SANS RÉSEAU :
 *  · `echelleSelonAltitude()` — quel échelon territorial l'image montre
 *    réellement (espace → continent → pays → région → département → commune
 *    → quartier) ;
 *  · `zoneMondiale()` — à l'échelle « continent », le nom du continent ou de
 *    la mer survolée, lu dans une base locale de boîtes géographiques.
 *
 * Aux échelons larges, interroger un annuaire de communes n'a plus de sens :
 * c'est cette base locale qui répond, instantanément et hors ligne.
 */

/**
 * Échelons, du plus large au plus fin. `altMin` est la hauteur de caméra (m)
 * à partir de laquelle l'échelon s'applique.
 *
 * Les seuils viennent de ce que l'image COUVRE : avec un champ vertical de 60°,
 * la vue embrasse à peu près la hauteur de caméra. À 3 000 km on voit un
 * continent, à 500 km un grand pays, à 120 km une région, à 30 km un
 * département, à 6 km une commune, en dessous un quartier.
 */
export const ECHELONS = Object.freeze([
  { cle: 'espace', altMin: 9_000_000, nom: 'ESPACE', sous: 'ORBITE', zoomOsm: 2 },
  { cle: 'continent', altMin: 2_200_000, nom: 'CONTINENT', sous: 'CONTINENT', zoomOsm: 3 },
  { cle: 'pays', altMin: 550_000, nom: 'PAYS', sous: 'PAYS', zoomOsm: 4 },
  { cle: 'region', altMin: 140_000, nom: 'RÉGION', sous: 'RÉGION', zoomOsm: 6 },
  { cle: 'departement', altMin: 32_000, nom: 'DÉPARTEMENT', sous: 'DÉPARTEMENT', zoomOsm: 8 },
  { cle: 'commune', altMin: 4_000, nom: 'COMMUNE', sous: 'COMMUNE', zoomOsm: 10 },
  { cle: 'quartier', altMin: 0, nom: 'QUARTIER', sous: 'QUARTIER', zoomOsm: 14 },
]);

/**
 * Échelon territorial correspondant à une hauteur de caméra.
 * @param {number} altitude Hauteur de la caméra en mètres.
 * @returns {{cle:string, altMin:number, nom:string, sous:string, zoomOsm:number}}
 */
export function echelleSelonAltitude(altitude) {
  const h = Number.isFinite(Number(altitude)) ? Math.max(0, Number(altitude)) : 0;
  for (const e of ECHELONS) if (h >= e.altMin) return e;
  return ECHELONS[ECHELONS.length - 1];
}

/**
 * Vrai si l'échelon est assez fin pour qu'un nom de commune veuille dire
 * quelque chose — donc pour qu'il vaille la peine d'interroger un annuaire.
 * @param {string} cle
 * @returns {boolean}
 */
export function echelonDemandeUneCommune(cle) {
  return cle === 'commune' || cle === 'quartier';
}

/**
 * Terres émergées, en boîtes lat/lon grossières. Volontairement découpées en
 * morceaux serrés plutôt qu'en un seul rectangle par continent : un rectangle
 * « Europe » unique avalerait la Méditerranée, et la vue depuis l'espace
 * au-dessus de la mer annoncerait « Europe » au lieu de la mer.
 *
 * Chaque entrée : [latMin, latMax, lonMin, lonMax, nom, precision].
 */
export const TERRES = Object.freeze([
  [36, 43.8, -9.6, -1.5, 'Europe', 'Péninsule Ibérique'],
  [37.5, 43.5, -1.5, 3.3, 'Europe', 'Espagne méditerranéenne'],
  [42.3, 51.5, -5, 8.5, 'Europe', 'France'],
  [49.8, 61, -11, 2, 'Europe', 'Îles Britanniques'],
  [44.5, 55, 8.5, 24, 'Europe', 'Europe centrale'],
  [36.6, 47, 6.5, 18.6, 'Europe', 'Italie'],
  [34.8, 46, 18.6, 29.8, 'Europe', 'Balkans'],
  [55, 71.5, 4, 32, 'Europe', 'Scandinavie'],
  [44, 60, 24, 45, 'Europe', 'Europe orientale'],
  [45, 70, 32, 60, 'Europe', 'Russie d’Europe'],
  [20, 37.3, -17, 11.6, 'Afrique', 'Maghreb'],
  [19, 33, 11.6, 25, 'Afrique', 'Libye & Sahara oriental'],
  [15, 32, 25, 37, 'Afrique', 'Vallée du Nil'],
  [4, 20, -18, 15, 'Afrique', 'Afrique de l’Ouest'],
  [-6, 15, 8, 32, 'Afrique', 'Afrique centrale'],
  [-1, 18, 32, 51.5, 'Afrique', 'Corne de l’Afrique'],
  [-35, -6, 11, 41, 'Afrique', 'Afrique australe'],
  [-26, -11.5, 43, 51, 'Afrique', 'Madagascar'],
  [29, 42, 26, 45, 'Asie', 'Anatolie & Levant'],
  [12, 32, 34, 60, 'Asie', 'Péninsule Arabique'],
  [24, 48, 45, 80, 'Asie', 'Asie centrale'],
  [50, 78, 60, 180, 'Asie', 'Sibérie'],
  [20, 50, 73, 135, 'Asie', 'Chine & Mongolie'],
  [6, 35, 68, 90, 'Asie', 'Sous-continent indien'],
  [5, 29, 90, 110, 'Asie', 'Indochine'],
  [30, 46, 126, 146, 'Asie', 'Japon & Corée'],
  [-11, 7, 95, 141, 'Asie', 'Insulinde'],
  [5, 19, 117, 127, 'Asie', 'Philippines'],
  [-44, -10, 112, 154, 'Océanie', 'Australie'],
  [-47.5, -34, 166, 179, 'Océanie', 'Nouvelle-Zélande'],
  [54, 72, -169, -130, 'Amérique du Nord', 'Alaska'],
  [25, 72, -130, -52, 'Amérique du Nord', 'Canada & États-Unis'],
  [59, 84, -73, -11, 'Amérique du Nord', 'Groenland'],
  [14, 33, -118, -86, 'Amérique du Nord', 'Mexique'],
  [7, 18, -93, -77, 'Amérique du Nord', 'Amérique centrale'],
  [-5, 13, -82, -34, 'Amérique du Sud', 'Amérique du Sud septentrionale'],
  [-56, -5, -76, -34, 'Amérique du Sud', 'Amérique du Sud méridionale'],
  [-90, -60, -180, 180, 'Antarctique', 'Antarctique'],
]);

/**
 * Mers fermées et golfes nommés, testés APRÈS les terres : un point sur la
 * côte doit donner le continent, un point au large la mer.
 */
export const MERS = Object.freeze([
  // Les mers les plus etroites d'abord : la boite Mediterranee, volontairement
  // large, avalerait sinon la mer Noire qui la jouxte par les Detroits.
  [40.5, 47.5, 27, 42, 'Mer Noire'],
  [36, 41.5, 26, 30, 'Mer Égée'],
  [30, 46, -6, 36, 'Mer Méditerranée'],
  [12, 30, 32, 44, 'Mer Rouge'],
  [23, 30, 47, 57, 'Golfe Persique'],
  [48.5, 51.5, -6, 2, 'Manche'],
  [51, 61, -4, 9, 'Mer du Nord'],
  [53, 66, 9, 30, 'Mer Baltique'],
  [8, 23, -89, -59, 'Mer des Caraïbes'],
  [18, 31, -98, -80, 'Golfe du Mexique'],
  [33, 52, 127, 142, 'Mer du Japon'],
  [2, 23, 105, 121, 'Mer de Chine méridionale'],
  [10, 25, 60, 78, 'Mer d’Arabie'],
  [5, 22, 80, 95, 'Golfe du Bengale'],
]);

/** Vrai si le point tombe dans la boîte [latMin, latMax, lonMin, lonMax]. */
function dansBoite(b, lat, lon) {
  return lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];
}

/**
 * Grands océans, en dernier recours : bandes de latitude et de longitude.
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
export function oceanDeReplique(lat, lon) {
  if (lat > 66) return 'Océan Arctique';
  if (lat < -60) return 'Océan Austral';
  const pacifique = lon >= 120 || lon <= -100;
  if (lat >= 0) {
    if (pacifique) return 'Océan Pacifique Nord';
    if (lon >= 20 && lon < 120) return 'Océan Indien';
    return 'Océan Atlantique Nord';
  }
  if (lon >= 120 || lon <= -70) return 'Océan Pacifique Sud';
  if (lon >= 20 && lon < 120) return 'Océan Indien';
  return 'Océan Atlantique Sud';
}

/**
 * Ce que l'on survole, à l'échelle où l'on voit la Terre entière ou presque :
 * un continent, une mer nommée, ou un océan.
 *
 * Réponse LOCALE et immédiate — c'est tout l'intérêt : depuis l'espace, aucune
 * requête réseau n'est lancée.
 *
 * @param {number} lat Latitude en degrés décimaux.
 * @param {number} lon Longitude en degrés décimaux, ramenée dans [-180, 180].
 * @returns {{type:'continent'|'mer'|'ocean', nom:string, precision:string}}
 */
export function zoneMondiale(lat, lon) {
  const la = Number(lat);
  let lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    return { type: 'ocean', nom: 'Terre', precision: 'position inconnue' };
  }
  lo = ((((lo + 180) % 360) + 360) % 360) - 180;
  for (const t of TERRES) {
    if (dansBoite(t, la, lo)) return { type: 'continent', nom: t[4], precision: t[5] };
  }
  for (const m of MERS) {
    if (dansBoite(m, la, lo)) return { type: 'mer', nom: m[4], precision: 'mer' };
  }
  const o = oceanDeReplique(la, lo);
  return { type: 'ocean', nom: o, precision: 'océan' };
}
