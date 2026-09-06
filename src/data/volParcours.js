/**
 * WATCHTOWER — PARCOURS DE VOL (préréglages, enregistrement, rejeu).
 *
 * Le mode vol doit pouvoir **proposer** des parcours (« faire tourner un drone
 * autour de Frontignan pour scanner la ville »), les modifier, les voir tracés
 * sur la carte, enregistrer ce qu'on a réellement volé, et le rejouer.
 *
 * Tout est **pur** (aucun Cesium, aucun DOM) : un parcours est une simple liste
 * de points `{lon, lat, alt}`, et ce module sait
 *  · générer les 5 préréglages (orbite, balayage, spirale, approche, A→B→A) ;
 *  · densifier un chemin (`echantillonner`) pour un mouvement fluide ;
 *  · interpoler à un instant donné (`positionA`) pour le rejeu ;
 *  · estimer durée, longueur et altitude.
 *
 * Testé dans `volParcours.test.mjs`.
 */

const RAYON_TERRE = 6_378_137;
const DEG = Math.PI / 180;

/** Préréglages proposés à l'utilisateur. */
export const PRESETS = Object.freeze([
  { cle: 'orbite', ic: '🔄', nom: 'ORBITE', aide: 'tourner autour d’un point (scan circulaire)' },
  { cle: 'balayage', ic: '🧹', nom: 'BALAYAGE', aide: 'ratisser une zone (aller-retours)' },
  { cle: 'spirale', ic: '🌀', nom: 'SPIRALE', aide: 'descendre en tournant (inspection)' },
  { cle: 'approche', ic: '🛬', nom: 'APPROCHE', aide: 'arriver de loin et se poser' },
  { cle: 'navette', ic: '↔', nom: 'NAVETTE', aide: 'faire l’aller-retour entre deux points' },
]);

/** Paramètres par défaut (modifiables dans l'interface). */
export const DEFAUTS = Object.freeze({
  rayon: 600,        // m
  altitude: 260,     // m
  tours: 1,
  points: 48,        // points par tour / par ligne
  lignes: 6,         // lignes d'un balayage
  largeur: 900,      // m (largeur du balayage)
  hauteur: 900,      // m (profondeur du balayage)
  destination: null, // {lon, lat} pour la navette
});

/** Convertit un déplacement (m) en degrés autour d'un point. */
export function metresEnDegres(lat = 0) {
  const cosLat = Math.max(0.01, Math.cos((Number(lat) || 0) * DEG));
  return { dLat: 1 / (RAYON_TERRE * DEG), dLon: 1 / (RAYON_TERRE * DEG * cosLat) };
}

/**
 * Génère un parcours.
 * @param {string} preset une clé de `PRESETS` (repli : orbite)
 * @param {{lon:number, lat:number}} centre
 * @param {object} [options] voir `DEFAUTS`
 * @returns {Array<{lon:number,lat:number,alt:number}>}
 */
export function generer(preset = 'orbite', centre = {}, options = {}) {
  const o = { ...DEFAUTS, ...options };
  const lon0 = Number(centre?.lon);
  const lat0 = Number(centre?.lat);
  if (!Number.isFinite(lon0) || !Number.isFinite(lat0)) return [];
  const { dLat, dLon } = metresEnDegres(lat0);
  const alt = Math.max(5, Number(o.altitude) || 0);
  const pts = [];

  switch (String(preset)) {
    case 'balayage': {
      const L = Math.max(50, Number(o.largeur) || 0);
      const H = Math.max(50, Number(o.hauteur) || 0);
      const lignes = Math.max(2, Math.round(o.lignes));
      const parLigne = Math.max(2, Math.round(o.points / 2));
      for (let r = 0; r < lignes; r += 1) {
        const y = -H / 2 + (H * r) / (lignes - 1);
        const sens = r % 2 === 0 ? 1 : -1;
        for (let i = 0; i < parLigne; i += 1) {
          const x = sens > 0 ? -L / 2 + (L * i) / (parLigne - 1) : L / 2 - (L * i) / (parLigne - 1);
          pts.push({ lon: lon0 + x * dLon, lat: lat0 + y * dLat, alt });
        }
      }
      break;
    }
    case 'spirale': {
      const tours = Math.max(1, Number(o.tours) || 1);
      const n = Math.max(8, Math.round(o.points) * tours);
      const R = Math.max(20, Number(o.rayon) || 0);
      for (let i = 0; i <= n; i += 1) {
        const f = i / n;
        const a = f * tours * Math.PI * 2;
        const r = R * (1 - f * 0.85);
        pts.push({
          lon: lon0 + Math.sin(a) * r * dLon,
          lat: lat0 + Math.cos(a) * r * dLat,
          alt: alt * (1 - f * 0.9),
        });
      }
      break;
    }
    case 'approche': {
      const R = Math.max(50, Number(o.rayon) || 0);
      const n = Math.max(6, Math.round(o.points) || 24);
      const angle = Math.PI * 0.75; // on arrive par le sud-ouest
      for (let i = 0; i <= n; i += 1) {
        const f = i / n;
        const r = R * (1 - f);
        pts.push({
          lon: lon0 + Math.cos(angle) * r * dLon,
          lat: lat0 + Math.sin(angle) * r * dLat,
          alt: alt * (1 - f) + 6,
        });
      }
      break;
    }
    case 'navette': {
      const d = o.destination || {};
      const lon1 = Number(d.lon); const lat1 = Number(d.lat);
      if (!Number.isFinite(lon1) || !Number.isFinite(lat1)) break;
      const n = Math.max(4, Math.round(o.points) || 32);
      for (let i = 0; i < n; i += 1) {
        const f = i / (n - 1);
        const aller = f <= 0.5 ? f * 2 : (1 - f) * 2;
        pts.push({ lon: lon0 + (lon1 - lon0) * aller, lat: lat0 + (lat1 - lat0) * aller, alt });
      }
      break;
    }
    case 'orbite':
    default: {
      const tours = Math.max(1, Number(o.tours) || 1);
      const n = Math.max(8, Math.round(o.points) || 48);
      const R = Math.max(20, Number(o.rayon) || 0);
      for (let i = 0; i <= n * tours; i += 1) {
        const a = (i / n) * Math.PI * 2;
        pts.push({ lon: lon0 + Math.sin(a) * R * dLon, lat: lat0 + Math.cos(a) * R * dLat, alt });
      }
      break;
    }
  }
  return pts.filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat) && Number.isFinite(p.alt));
}

/** Distance (m) entre deux points du parcours (composante altitude incluse). */
export function distance3d(a = {}, b = {}) {
  const { dLat, dLon } = metresEnDegres((Number(a.lat) + Number(b.lat)) / 2);
  const dx = (Number(b.lon) - Number(a.lon)) / dLon;
  const dy = (Number(b.lat) - Number(a.lat)) / dLat;
  const dz = Number(b.alt || 0) - Number(a.alt || 0);
  return Math.hypot(dx, dy, dz);
}

/** Longueur totale (m) d'un parcours. */
export function longueur(chemin = []) {
  let total = 0;
  for (let i = 1; i < chemin.length; i += 1) total += distance3d(chemin[i - 1], chemin[i]);
  return total;
}

/** Durée estimée (s) à une vitesse donnée (m/s). */
export function duree(chemin = [], vitesse = 25) {
  const v = Math.max(0.5, Number(vitesse) || 1);
  return longueur(chemin) / v;
}

/** Altitude mini / maxi d'un parcours. */
export function altitudes(chemin = []) {
  let min = Infinity; let max = -Infinity;
  for (const p of chemin) {
    const a = Number(p?.alt);
    if (!Number.isFinite(a)) continue;
    min = Math.min(min, a); max = Math.max(max, a);
  }
  return Number.isFinite(min) ? { min, max } : { min: 0, max: 0 };
}

/**
 * Densifie le parcours : on ajoute des points pour que l'espacement maximal
 * soit `pas` mètres (mouvement fluide au rejeu).
 */
export function echantillonner(chemin = [], pas = 40) {
  const pMax = Math.max(1, Number(pas) || 1);
  if (chemin.length < 2) return chemin.slice();
  const out = [chemin[0]];
  for (let i = 1; i < chemin.length; i += 1) {
    const a = chemin[i - 1]; const b = chemin[i];
    const d = distance3d(a, b);
    const n = Math.max(1, Math.ceil(d / pMax));
    for (let k = 1; k <= n; k += 1) {
      const f = k / n;
      out.push({
        lon: Number(a.lon) + (Number(b.lon) - Number(a.lon)) * f,
        lat: Number(a.lat) + (Number(b.lat) - Number(a.lat)) * f,
        alt: Number(a.alt || 0) + (Number(b.alt || 0) - Number(a.alt || 0)) * f,
      });
    }
  }
  return out;
}

/** Distance cumulée (m) à chaque point — sert à interpoler proprement. */
export function cumulees(chemin = []) {
  const out = [0];
  for (let i = 1; i < chemin.length; i += 1) out.push(out[i - 1] + distance3d(chemin[i - 1], chemin[i]));
  return out;
}

/**
 * Position le long du parcours à l'avancement `t` (0 → 1), avec le cap (rad).
 * @param {Array} chemin
 * @param {number} t
 * @param {Array<number>} [cumul] distances cumulées précalculées
 * @returns {{lon:number, lat:number, alt:number, cap:number, avancement:number}}
 */
export function positionA(chemin = [], t = 0, cumul = null) {
  const n = chemin.length;
  if (!n) return { lon: 0, lat: 0, alt: 0, cap: 0, avancement: 0 };
  if (n === 1) return { ...chemin[0], cap: 0, avancement: 0 };
  const c = cumul || cumulees(chemin);
  const total = c[n - 1] || 1;
  const f = Math.max(0, Math.min(1, Number(t) || 0));
  const cible = f * total;
  let i = 1;
  while (i < n - 1 && c[i] < cible) i += 1;
  const d0 = c[i - 1]; const d1 = c[i];
  const local = d1 > d0 ? (cible - d0) / (d1 - d0) : 0;
  const a = chemin[i - 1]; const b = chemin[i];
  const lon = Number(a.lon) + (Number(b.lon) - Number(a.lon)) * local;
  const lat = Number(a.lat) + (Number(b.lat) - Number(a.lat)) * local;
  const alt = Number(a.alt || 0) + (Number(b.alt || 0) - Number(a.alt || 0)) * local;
  const { dLat, dLon } = metresEnDegres(lat);
  const dx = (Number(b.lon) - Number(a.lon)) / dLon;
  const dy = (Number(b.lat) - Number(a.lat)) / dLat;
  const cap = Math.atan2(dx, dy); // Cesium : 0 = nord, π/2 = est
  return { lon, lat, alt, cap, avancement: f };
}

/** Résumé affichable d'un parcours. */
export function resumer(chemin = [], vitesse = 25) {
  const { min, max } = altitudes(chemin);
  return {
    points: chemin.length,
    longueur: Math.round(longueur(chemin)),
    duree: Math.round(duree(chemin, vitesse)),
    altMin: Math.round(min),
    altMax: Math.round(max),
  };
}

/** Parcours « propre » : points valides, doublons consécutifs retirés. */
export function nettoyer(chemin = []) {
  const out = [];
  for (const p of chemin || []) {
    if (!Number.isFinite(Number(p?.lon)) || !Number.isFinite(Number(p?.lat))) continue;
    const q = { lon: Number(p.lon), lat: Number(p.lat), alt: Number(p.alt) || 0 };
    const prev = out[out.length - 1];
    if (prev && distance3d(prev, q) < 0.5) continue;
    out.push(q);
  }
  return out;
}

/** Sous-échantillonne un vol réel pour ne garder que l'utile. */
export function simplifier(chemin = [], toleranceM = 3) {
  const net = nettoyer(chemin);
  if (net.length < 3) return net;
  const out = [net[0]];
  for (const p of net.slice(1, -1)) {
    if (distance3d(out[out.length - 1], p) >= toleranceM) out.push(p);
  }
  out.push(net[net.length - 1]);
  return out;
}
