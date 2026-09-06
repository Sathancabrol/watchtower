/**
 * WATCHTOWER — CONTOURS DE TERRITOIRE : calculs purs.
 *
 * Sert à la « vue communale » : on récupère le contour administratif de la
 * commune (geo.api.gouv.fr, gratuit et sans clé), puis on le TRACE en
 * animation (façon plan cadastral qui se dessine) avant d'activer la couche
 * AR au-dessus de la carte.
 *
 * Tout est pur (pas de Cesium, pas de DOM) → testable en node.
 */

import { M_PAR_DEG_LAT, M_PAR_DEG_LON } from './batiMath.js';

/** Distance approximative (m) entre deux points lon/lat. */
export function distanceM(a, b) {
  const latMoy = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * M_PAR_DEG_LON * Math.cos(latMoy);
  const dy = (b[1] - a[1]) * M_PAR_DEG_LAT;
  return Math.hypot(dx, dy);
}

/**
 * Extrait les anneaux d'une géométrie GeoJSON (contour de commune).
 * Accepte un Feature, une FeatureCollection, une Geometry ou un tableau brut
 * de coordonnées. Les MultiPolygon sont aplatis : on garde chaque anneau
 * extérieur, le plus grand d'abord.
 *
 * @param {object|Array} source
 * @returns {number[][][]} Anneaux, chacun = liste de [lon, lat].
 */
export function anneauxDepuisGeoJson(source) {
  if (!source) return [];
  const anneaux = [];
  const pousser = (coords, type) => {
    if (!Array.isArray(coords)) return;
    if (type === 'Polygon') {
      const [exterieur] = coords;
      if (Array.isArray(exterieur) && exterieur.length > 2) anneaux.push(exterieur);
    } else if (type === 'MultiPolygon') {
      for (const poly of coords) {
        const [exterieur] = poly || [];
        if (Array.isArray(exterieur) && exterieur.length > 2) anneaux.push(exterieur);
      }
    } else if (type === 'LineString' && coords.length > 1) {
      anneaux.push(coords);
    }
  };
  const visiter = (n) => {
    if (!n) return;
    if (Array.isArray(n) && typeof n[0] === 'number') return; // coordonnée nue
    if (n.type === 'FeatureCollection') { for (const f of n.features || []) visiter(f); return; }
    if (n.type === 'Feature') { visiter(n.geometry); return; }
    if (n.type && n.coordinates) { pousser(n.coordinates, n.type); return; }
    if (Array.isArray(n)) { for (const c of n) visiter(c); }
  };
  visiter(source);
  // le plus grand anneau d'abord (communes insulaires, enclaves…)
  return anneaux.sort((a, b) => b.length - a.length);
}

/** Boîte englobante d'un anneau (ou de plusieurs). */
export function bboxAnneaux(anneaux) {
  let ouest = 180;
  let sud = 90;
  let est = -180;
  let nord = -90;
  let n = 0;
  for (const anneau of anneaux || []) {
    for (const p of anneau || []) {
      if (!Number.isFinite(p?.[0]) || !Number.isFinite(p?.[1])) continue;
      ouest = Math.min(ouest, p[0]);
      est = Math.max(est, p[0]);
      sud = Math.min(sud, p[1]);
      nord = Math.max(nord, p[1]);
      n += 1;
    }
  }
  if (!n) return null;
  return { ouest, sud, est, nord };
}

/** Centre d'une boîte englobante. */
export function centreBBox(b) {
  if (!b) return null;
  return { lon: (b.ouest + b.est) / 2, lat: (b.sud + b.nord) / 2 };
}

/** Taille (m) d'une boîte englobante. */
export function tailleBBoxM(b) {
  if (!b) return { largeur: 0, hauteur: 0 };
  const coinA = [b.ouest, b.sud];
  const coinB = [b.est, b.sud];
  const coinC = [b.ouest, b.nord];
  return { largeur: distanceM(coinA, coinB), hauteur: distanceM(coinA, coinC) };
}

/**
 * Altitude de caméra (m) qui cadre la boîte englobante vue du dessus.
 * Cesium ouvre ~60° verticalement : on ajoute 15 % de marge pour que le
 * contour respire dans l'écran.
 */
export function altitudePourBBox(b, marge = 1.15) {
  if (!b || !Number.isFinite(b.ouest) || !Number.isFinite(b.sud)) return 900;
  const { largeur, hauteur } = tailleBBoxM(b);
  const max = Math.max(largeur, hauteur, 400);
  const altitude = (max * marge) / 1.05;
  return Number.isFinite(altitude) ? Math.max(900, altitude) : 900;
}

/** Périmètre (m) d'un anneau. */
export function perimetreAnneau(anneau) {
  let total = 0;
  for (let i = 0; i < anneau.length; i += 1) {
    total += distanceM(anneau[i], anneau[(i + 1) % anneau.length]);
  }
  return total;
}

/**
 * Portion d'anneau révélée à l'instant `t` (0 → 1) : c'est l'animation
 * « le plan cadastral se dessine ». Le dernier segment est interpolé pour
 * que le trait avance continûment (et pas sommet par sommet).
 *
 * @param {number[][]} anneau
 * @param {number} t Progression dans [0,1].
 * @returns {number[][]} Sous-anneau (au moins 2 points dès que t > 0).
 */
export function portionAnneau(anneau, t) {
  const pts = (anneau || []).filter((p) => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]));
  if (pts.length < 2) return pts.slice();
  const avancement = Math.min(1, Math.max(0, Number(t) || 0));
  if (avancement <= 0) return [pts[0]];
  const ferme = pts.length > 2;
  const segments = ferme ? pts.length : pts.length - 1;
  const pos = avancement * segments;
  const entiers = Math.floor(pos);
  const frac = pos - entiers;
  const out = [];
  for (let i = 0; i <= Math.min(entiers, segments); i += 1) out.push(pts[i % pts.length]);
  if (frac > 0 && entiers < segments) {
    const a = pts[entiers % pts.length];
    const b = pts[(entiers + 1) % pts.length];
    out.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
  }
  return out;
}

/**
 * Anneau fermé (premier point répété à la fin) — exigé par Cesium pour les
 * polygones, inutile pour les polylignes.
 */
export function fermerAnneau(anneau) {
  if (!anneau?.length) return [];
  const a = anneau[0];
  const b = anneau[anneau.length - 1];
  if (a[0] === b[0] && a[1] === b[1]) return anneau.slice();
  return [...anneau, a];
}

/** Décime un anneau administratif (les contours IGN peuvent être très denses). */
export function decimer(anneau, maxPts = 220) {
  const pts = (anneau || []).filter((p) => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]));
  if (pts.length <= maxPts) return pts;
  const out = [];
  const pas = pts.length / maxPts;
  for (let i = 0; i < maxPts; i += 1) out.push(pts[Math.floor(i * pas)]);
  return out;
}
