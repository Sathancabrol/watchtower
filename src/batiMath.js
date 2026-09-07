/**
 * WATCHTOWER — BÂTI RAPIDE : calculs purs.
 *
 * Aucune dépendance à Cesium ni au DOM : ces fonctions sont testables en
 * node (voir `batiMath.test.mjs`) et servent au pipeline de bâtiments 3D
 * « rapide » (`batiRapide.js`) comme à l'ancien panneau BÂTI 3D.
 *
 * Problème résolu : le modèle 3D mettait « très longtemps » à charger.
 * Deux causes côté calcul, traitées ici :
 *  — la HAUTEUR n'est disponible que sur ~5 % des bâtiments OSM. Plutôt que
 *    d'attendre une source externe (Wikipédia : une requête par bâtiment,
 *    irréaliste), on ESTIME une hauteur plausible depuis l'emprise cadastrale
 *    et le type de bâtiment, avec une variation déterministe (même graine =
 *    même hauteur) pour garder un rendu varié mais stable entre deux chargements.
 *  — les emprises brutes OSM ont souvent 40 à 200 sommets : inutile pour un
 *    volume extrudé vu de loin. On décime à ≤ 12 sommets (visuellement
 *    identique, ~4× moins de triangles).
 */

/** Rayon terrestre moyen (m). */
export const R_TERRE = 6371008.8;
/** Longueur d'un degré de latitude (m). */
export const M_PAR_DEG_LAT = 110574;
/** Longueur d'un degré de longitude à l'équateur (m). */
export const M_PAR_DEG_LON = 111320;
/** Hauteur d'un étage courant (m) — convention OSM. */
export const HAUTEUR_ETAGE = 3.2;
/** Acrotère / rebord de toit ajouté au dernier étage (m). */
export const ACROTERE = 0.6;

/** Normalise un point : accepte `{lon, lat}` (OSM) ou `[lon, lat]`. */
export function point(p) {
  if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
  return [Number(p?.lon), Number(p?.lat)];
}

/**
 * Aire (m²) d'une emprise, projection plane locale (assez précis à
 * l'échelle d'un bâtiment : < 0,5 % d'erreur sous 10 km).
 * @param {Array<{lon:number,lat:number}|number[]>} anneau
 * @returns {number} Aire en m² (0 si l'anneau est dégénéré).
 */
export function aireEmprise(anneau) {
  if (!Array.isArray(anneau) || anneau.length < 3) return 0;
  const pts = [];
  let lat0 = 0;
  for (const brut of anneau) {
    const p = point(brut);
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return 0;
    pts.push(p);
    lat0 += p[1];
  }
  lat0 /= pts.length;
  const kx = Math.cos((lat0 * Math.PI) / 180) * M_PAR_DEG_LON;
  const ky = M_PAR_DEG_LAT;
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * kx * b[1] * ky - b[0] * kx * a[1] * ky;
  }
  return Math.abs(s / 2);
}

/** Centre (moyenne des sommets) d'une emprise — suffisant pour une étiquette. */
export function centreEmprise(anneau) {
  const pts = (Array.isArray(anneau) ? anneau : []).map(point)
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!pts.length) return null;
  let lon = 0;
  let lat = 0;
  for (const p of pts) { lon += p[0]; lat += p[1]; }
  return { lon: lon / pts.length, lat: lat / pts.length };
}

/**
 * Décime un anneau à `maxPts` sommets (échantillonnage uniforme).
 * L'anneau OSM est fermé (premier == dernier) : on retire la duplication.
 * @param {Array} anneau
 * @param {number} [maxPts=12]
 * @returns {Array<{lon:number,lat:number}>} Anneau ouvert (non fermé).
 */
export function simplifierAnneau(anneau, maxPts = 12) {
  if (!Array.isArray(anneau)) return [];
  let pts = anneau.map(point)
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length > 1
    && Math.abs(pts[0][0] - pts[pts.length - 1][0]) < 1e-9
    && Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-9) {
    pts = pts.slice(0, -1);
  }
  const max = Math.max(3, maxPts);
  if (pts.length <= max) return pts.map(([lon, lat]) => ({ lon, lat }));
  const out = [];
  const n = pts.length;
  for (let i = 0; i < max; i += 1) out.push(pts[Math.round((i * n) / max) % n]);
  return out.map(([lon, lat]) => ({ lon, lat }));
}

/**
 * Pseudo-aléatoire DÉTERMINISTE dans [0,1[ à partir d'une graine entière.
 * Deux chargements de la même zone doivent redonner la même ville : une
 * variation aléatoire ferait « clignoter » les hauteurs à chaque reload.
 */
export function hash01(graine) {
  let h = (Number(graine) || 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Hauteur par défaut (m) selon le type de bâtiment OSM. */
export const HAUTEURS_TYPE = Object.freeze({
  house: 6, detached: 6, bungalow: 5, farm: 5, farm_auxiliary: 4, cabin: 3,
  hut: 3, shed: 3, garage: 3, garages: 3, greenhouse: 4, ruins: 3, tent: 3,
  residential: 10, apartments: 16, dormitory: 14, terrace: 8, houseboat: 4,
  church: 18, cathedral: 28, chapel: 10, mosque: 16, synagogue: 14, temple: 12,
  shrine: 4, monastery: 12, wayside_shrine: 3,
  industrial: 9, warehouse: 9, factory: 9, hangar: 11, silo: 22, water_tower: 26,
  retail: 8, commercial: 12, office: 16, kiosk: 3, supermarket: 8,
  hotel: 18, hostel: 14, motel: 10, hospital: 20, clinic: 10,
  school: 11, university: 15, college: 13, kindergarten: 7, library: 10,
  train_station: 13, station: 10, transportation: 10, parking: 14,
  stadium: 22, grandstand: 10, sports_hall: 11, grand_stand: 10,
  civic: 12, public: 12, government: 15, courthouse: 15, townhall: 14,
  castle: 20, tower: 32, bridge: 5, bunker: 4, service: 4, roof: 6,
});
const HAUTEUR_DEFAUT = 8;
const HAUTEUR_MAX = 400;

/**
 * Estime la hauteur d'un bâtiment.
 *
 * Ordre de priorité (du plus fiable au plus grossier) :
 *  1. `height` / `building:height` renseigné dans OSM ;
 *  2. `building:levels` (étages) × 3,2 m + acrotère ;
 *  3. table par TYPE de bâtiment (église 18 m, hangar 11 m, pavillon 6 m…) ;
 *  4. enfin, à défaut de type : à partir de l'emprise au sol — plus
 *     l'emprise est grande, plus le bâti est haut (immeubles vs maisons).
 *
 * @param {{tags?:object, aire?:number, graine?:number}} p
 * @returns {{h:number, niveaux:number, source:'osm'|'niveaux'|'type'|'aire'}}
 */
export function estimerHauteur({ tags = {}, aire = 0, graine = 0 } = {}) {
  const brut = tags.height ?? tags['building:height'] ?? tags.est_height;
  const h = Number.parseFloat(String(brut ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  if (Number.isFinite(h) && h > 0) {
    const hh = Math.min(h, HAUTEUR_MAX);
    return { h: hh, niveaux: Math.max(1, Math.round(hh / HAUTEUR_ETAGE)), source: 'osm' };
  }
  const brutNiv = tags['building:levels'] ?? tags['building:levels:aboveground'] ?? tags.levels;
  const niv = Number.parseFloat(String(brutNiv ?? '').replace(',', '.'));
  if (Number.isFinite(niv) && niv > 0) {
    const n = Math.min(80, niv);
    return { h: Math.max(2.5, n * HAUTEUR_ETAGE + ACROTERE), niveaux: n, source: 'niveaux' };
  }
  const type = String(tags.building || '').toLowerCase();
  if (HAUTEURS_TYPE[type] !== undefined) {
    const hh = HAUTEURS_TYPE[type];
    return { h: hh, niveaux: Math.max(1, Math.round(hh / HAUTEUR_ETAGE)), source: 'type' };
  }
  const amenity = String(tags.amenity || '').toLowerCase();
  if (HAUTEURS_TYPE[amenity] !== undefined) {
    const hh = HAUTEURS_TYPE[amenity];
    return { h: hh, niveaux: Math.max(1, Math.round(hh / HAUTEUR_ETAGE)), source: 'type' };
  }
  // Dernier recours : l'emprise. Une maison ~90 m², un petit immeuble ~400 m².
  const a = Math.max(Number(aire) || 0, 20);
  const brut2 = Math.sqrt(a) / 6; // 90 m² → 1,6 étage · 400 m² → 3,3 · 1600 m² → 6,7
  const jitter = (hash01(graine) - 0.5) * 0.9; // ±0,45 étage — varié mais stable
  const niveaux = Math.max(1, Math.min(12, Math.round(brut2 + jitter)));
  return { h: Math.max(3, niveaux * HAUTEUR_ETAGE + ACROTERE), niveaux, source: 'aire' };
}

/**
 * Catégories de « civilisation » — palette saturée, contrastes francs
 * (rendu jeu vidéo / GTA : couleurs pleines, toits plus sombres).
 * L'ordre compte : la première règle vraie gagne, `logement` fait office de
 * défaut (son test renvoie toujours vrai).
 */
export const CATEGORIES_BATI = Object.freeze([
  {
    id: 'sante',
    nom: 'Santé',
    couleur: '#ff3355',
    toit: '#8d0f27',
    test: (t) => /hospital|clinic|doctors|pharmacy|dentist|nursing_home/.test(t.amenity || '')
      || t.building === 'hospital' || t.healthcare,
  },
  {
    id: 'education',
    nom: 'Éducation',
    couleur: '#2ecc71',
    toit: '#0f6b3a',
    test: (t) => /school|college|kindergarten|university|language_school|driving_school/.test(t.amenity || '')
      || ['school', 'university', 'college', 'kindergarten'].includes(t.building),
  },
  {
    id: 'services',
    nom: 'Services publics',
    couleur: '#ffb020',
    toit: '#8a5a00',
    test: (t) => /townhall|police|fire_station|library|post_office|courthouse|prison|community_centre|public_building/.test(t.amenity || '')
      || t.office === 'government' || ['civic', 'public', 'government', 'townhall', 'courthouse'].includes(t.building),
  },
  {
    id: 'culte',
    nom: 'Culte & mémoire',
    couleur: '#a97bff',
    toit: '#4b2c8f',
    test: (t) => /place_of_worship|monastery|graveyard/.test(t.amenity || '')
      || ['church', 'cathedral', 'chapel', 'mosque', 'synagogue', 'temple', 'shrine'].includes(t.building),
  },
  {
    id: 'industrie',
    nom: 'Industrie & artisanat',
    couleur: '#ff7a29',
    toit: '#8a3a05',
    test: (t) => ['industrial', 'warehouse', 'factory', 'hangar'].includes(t.building)
      || /factory|workshop|storage_tank|water_tower/.test(t.man_made || '')
      || t.industrial || t.landuse === 'industrial',
  },
  {
    id: 'commerce',
    nom: 'Commerce & vie',
    couleur: '#ffe14d',
    toit: '#8a7500',
    test: (t) => Boolean(t.shop)
      || /restaurant|cafe|bar|marketplace|theatre|museum|cinema|nightclub|bank/.test(t.amenity || '')
      || ['retail', 'commercial', 'supermarket', 'hotel', 'kiosk'].includes(t.building)
      || Boolean(t.tourism),
  },
  {
    id: 'logement',
    nom: 'Logement',
    couleur: '#5aa9e6',
    toit: '#1d5b8c',
    test: () => true,
  },
]);

/** Catégorie d'un bâtiment d'après ses tags OSM (toujours une catégorie). */
export function categoriserBati(tags = {}) {
  const t = tags || {};
  return CATEGORIES_BATI.find((c) => {
    try { return c.test(t); } catch { return false; }
  }) || CATEGORIES_BATI[CATEGORIES_BATI.length - 1];
}

/** Catégorie par identifiant (logement si inconnu). */
export function categorieParId(id) {
  return CATEGORIES_BATI.find((c) => c.id === id) || CATEGORIES_BATI[CATEGORIES_BATI.length - 1];
}

/**
 * Clé de cache d'une zone : deux chargements « proches » partagent la même
 * clé (le bâti est rechargé seulement si la vue a vraiment bougé).
 * @param {number} lat
 * @param {number} lon
 * @param {number} rayon Rayon en mètres.
 * @param {string} [suffixe] Différencie les filtres (catégorie demandée…).
 * @returns {string}
 */
export function cleZone(lat, lon, rayon, suffixe = '') {
  const pas = Math.max(1, Math.round((Number(rayon) || 700) / 250)) / 4; // ~250 m
  const la = Math.round(Number(lat) / (pas * 0.002)) * (pas * 0.002);
  const lo = Math.round(Number(lon) / (pas * 0.002)) * (pas * 0.002);
  return `${la.toFixed(5)}:${lo.toFixed(5)}:${Math.round(rayon)}${suffixe ? `:${suffixe}` : ''}`;
}

/**
 * Découpe une liste en lots (pour construire la géométrie sans bloquer
 * l'interface : on rend la main entre deux lots).
 * @template T
 * @param {T[]} liste
 * @param {number} taille
 * @returns {T[][]}
 */
export function lotir(liste, taille = 150) {
  const out = [];
  const n = Math.max(1, Number(taille) || 1);
  for (let i = 0; i < liste.length; i += n) out.push(liste.slice(i, i + n));
  return out;
}

/**
 * Vrai si le point (lon, lat) est à l'intérieur de l'emprise (ray casting).
 * Sert à rattacher un équipement (hôpital, école…) au bâtiment qui
 * l'héberge, pour la vue AR : « l'icône santé » → « les bâtiments santé ».
 *
 * @param {number} lon
 * @param {number} lat
 * @param {Array<{lon:number,lat:number}|number[]>} anneau
 * @returns {boolean}
 */
export function pointDansEmprise(lon, lat, anneau) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  const pts = (Array.isArray(anneau) ? anneau : []).map(point);
  if (pts.length < 3) return false;
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (!Number.isFinite(xi) || !Number.isFinite(yi) || !Number.isFinite(xj) || !Number.isFinite(yj)) continue;
    if ((yi > lat) !== (yj > lat)
      && lon < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi) {
      dedans = !dedans;
    }
  }
  return dedans;
}

/**
 * Grille d'altitudes : au lieu d'appeler `globe.getHeight()` pour CHAQUE
 * bâtiment (coûteux, et parfois `undefined` si la tuile de terrain n'est pas
 * encore chargée), on échantillonne une grille `n × n` puis on affecte à
 * chaque bâtiment la valeur de la case la plus proche.
 *
 * @param {{lon:number,lat:number}[]} centres
 * @param {{ouest:number,sud:number,est:number,nord:number}} bbox
 * @param {{n?:number, lire:(lon:number,lat:number)=>number}} options
 * @returns {number[]} Altitude du sol par bâtiment (m).
 */
export function altitudesParGrille(centres, bbox, { n = 6, lire } = {}) {
  const vides = centres.map(() => 0);
  if (typeof lire !== 'function' || !centres.length) return vides;
  const ouest = Math.min(bbox.ouest, bbox.est);
  const est = Math.max(bbox.ouest, bbox.est);
  const sud = Math.min(bbox.sud, bbox.nord);
  const nord = Math.max(bbox.sud, bbox.nord);
  const grille = [];
  for (let j = 0; j < n; j += 1) {
    const lat = sud + ((nord - sud) * j) / (n - 1 || 1);
    const ligne = [];
    for (let i = 0; i < n; i += 1) {
      const lon = ouest + ((est - ouest) * i) / (n - 1 || 1);
      let v = 0;
      try { v = Number(lire(lon, lat)); } catch { v = NaN; }
      ligne.push(Number.isFinite(v) ? v : 0);
    }
    grille.push(ligne);
  }
  const largeur = est - ouest || 1e-9;
  const hauteur = nord - sud || 1e-9;
  return centres.map((c) => {
    const i = Math.round(((c.lon - ouest) / largeur) * (n - 1));
    const j = Math.round(((c.lat - sud) / hauteur) * (n - 1));
    const ii = Math.min(n - 1, Math.max(0, i));
    const jj = Math.min(n - 1, Math.max(0, j));
    return grille[jj][ii];
  });
}
