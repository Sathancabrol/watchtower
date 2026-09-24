/**
 * ☀ CALCUL SOLAIRE — position du soleil, phases du jour, lune.
 *
 * Portage de l'algorithme **SunCalc** (Vladimir Agafonkin, BSD-2), lui-même
 * fondé sur les formules de **Meeus, _Astronomical Algorithms_**. Réécrit ici
 * plutôt qu'installé en dépendance : le paquet npm n'est pas atteignable hors
 * ligne, et cette version est commentée en français et testée contre les
 * valeurs de référence publiées.
 *
 * ## Conventions — à lire avant d'utiliser
 *
 * - Toutes les entrées/sorties d'angles publiques sont en **degrés**.
 * - L'**azimut est compté depuis le NORD, sens horaire** (0° = nord,
 *   90° = est, 180° = sud, 270° = ouest), comme une boussole.
 *   ⚠ SunCalc renvoie, lui, un azimut compté depuis le **sud** ; la
 *   conversion est faite ici une fois pour toutes.
 * - Les longitudes sont positives vers l'**est**.
 * - Aucune dépendance, aucun accès réseau : calculable hors ligne.
 *
 * @module data/soleil/calculSolaire
 */

const RAD = Math.PI / 180;
const MS_JOUR = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;

/** Obliquité de l'écliptique (inclinaison de l'axe terrestre), en radians. */
const OBLIQUITE = RAD * 23.4397;

// ── conversions de dates ───────────────────────────────────────────────────

/** @param {Date|number} date @returns {number} jour julien */
export function versJulien(date) {
  return Number(date) / MS_JOUR - 0.5 + J1970;
}

/**
 * @param {number} j - jour julien
 * @returns {Date|null}
 *
 * ⚠ On ARRONDIT la milliseconde : le constructeur `Date` tronque, ce qui
 * faisait perdre systematiquement 1 ms a l'aller-retour.
 */
export function depuisJulien(j) {
  return Number.isFinite(j) ? new Date(Math.round((j + 0.5 - J1970) * MS_JOUR)) : null;
}

/** Jours écoulés depuis J2000. @param {Date|number} date @returns {number} */
export function versJours(date) {
  return versJulien(date) - J2000;
}

// ── position céleste ───────────────────────────────────────────────────────

function ascensionDroite(l, b) {
  return Math.atan2(
    Math.sin(l) * Math.cos(OBLIQUITE) - Math.tan(b) * Math.sin(OBLIQUITE),
    Math.cos(l),
  );
}

function declinaison(l, b) {
  return Math.asin(
    Math.sin(b) * Math.cos(OBLIQUITE)
    + Math.cos(b) * Math.sin(OBLIQUITE) * Math.sin(l),
  );
}

/** Azimut MESURÉ DEPUIS LE SUD (convention interne, comme SunCalc). */
function azimutSud(H, phi, dec) {
  return Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi),
  );
}

function hauteur(H, phi, dec) {
  return Math.asin(
    Math.sin(phi) * Math.sin(dec)
    + Math.cos(phi) * Math.cos(dec) * Math.cos(H),
  );
}

function tempsSideral(d, lw) {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}

function anomalieMoyenneSolaire(d) {
  return RAD * (357.5291 + 0.98560028 * d);
}

function longitudeEcliptique(M) {
  // équation du centre
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372; // périhélie terrestre
  return M + C + P + Math.PI;
}

function coordonneesSoleil(d) {
  const M = anomalieMoyenneSolaire(d);
  const L = longitudeEcliptique(M);
  return { dec: declinaison(L, 0), ra: ascensionDroite(L, 0) };
}

/**
 * Position du soleil pour une date et un lieu.
 *
 * @param {Date|number} date
 * @param {number} lat - latitude en degrés
 * @param {number} lon - longitude en degrés, positive vers l'est
 * @returns {{azimut:number, hauteur:number, declinaison:number}|null}
 *   `azimut` en degrés **depuis le nord**, `hauteur` en degrés au-dessus de
 *   l'horizon (négative = sous l'horizon). `null` si l'entrée est invalide.
 */
export function positionSoleil(date, lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const t = Number(date);
  if (!Number.isFinite(t)) return null;

  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = versJours(t);
  const c = coordonneesSoleil(d);
  const H = tempsSideral(d, lw) - c.ra;

  // +180° : on passe de l'azimut « depuis le sud » à la convention boussole.
  const az = (azimutSud(H, phi, c.dec) / RAD + 180 + 360) % 360;
  return {
    azimut: az,
    hauteur: hauteur(H, phi, c.dec) / RAD,
    declinaison: c.dec / RAD,
  };
}

// ── phases du jour ─────────────────────────────────────────────────────────

const J0 = 0.0009;

function cycleJulien(d, lw) {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

function transitApproche(Ht, lw, n) {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}

function transitSolaireJ(ds, M, L) {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}

function angleHoraire(h, phi, d) {
  return Math.acos(
    (Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)),
  );
}

/**
 * Phases du jour : hauteur du soleil (degrés) → nom du lever et du coucher.
 * L'ordre est celui de SunCalc ; `-0.833` tient compte de la réfraction
 * atmosphérique et du rayon apparent du disque solaire.
 */
export const PHASES = Object.freeze([
  Object.freeze({ angle: -0.833, lever: 'lever', coucher: 'coucher' }),
  Object.freeze({ angle: -0.3, lever: 'finLever', coucher: 'debutCoucher' }),
  Object.freeze({ angle: -6, lever: 'aubeCivile', coucher: 'crepusculeCivil' }),
  Object.freeze({ angle: -12, lever: 'aubeNautique', coucher: 'crepusculeNautique' }),
  Object.freeze({ angle: -18, lever: 'aubeAstro', coucher: 'crepusculeAstro' }),
  Object.freeze({ angle: 6, lever: 'finHeureDoree', coucher: 'heureDoree' }),
]);

/**
 * Heures clés du jour pour un lieu.
 *
 * ⚠ Aux hautes latitudes, certaines phases n'existent pas (soleil de minuit,
 * nuit polaire) : la valeur vaut alors `null`. Toujours tester avant
 * d'afficher.
 *
 * @param {Date|number} date
 * @param {number} lat
 * @param {number} lon
 * @returns {Object<string, Date|null>|null}
 */
export function heuresSolaires(date, lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const t = Number(date);
  if (!Number.isFinite(t)) return null;

  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = versJours(t);
  const n = cycleJulien(d, lw);
  const ds = transitApproche(0, lw, n);

  const M = anomalieMoyenneSolaire(ds);
  const L = longitudeEcliptique(M);
  const dec = declinaison(L, 0);
  const Jnoon = transitSolaireJ(ds, M, L);

  const res = {
    midiSolaire: depuisJulien(Jnoon),
    minuitSolaire: depuisJulien(Jnoon - 0.5),
  };

  for (const p of PHASES) {
    const w = angleHoraire(p.angle * RAD, phi, dec);
    if (!Number.isFinite(w)) {
      // Phase inexistante ce jour-là à cette latitude.
      res[p.lever] = null;
      res[p.coucher] = null;
      continue;
    }
    const a = transitApproche(w, lw, n);
    const Jset = transitSolaireJ(a, M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    res[p.lever] = depuisJulien(Jrise);
    res[p.coucher] = depuisJulien(Jset);
  }
  return res;
}

// ── lune ───────────────────────────────────────────────────────────────────

/**
 * Réfraction atmosphérique, en radians, pour une hauteur en radians.
 * Sous l'horizon on la calcule à 0 : l'astre y est invisible de toute façon.
 * @param {number} h - hauteur en radians @returns {number} correction (rad)
 */
function refractionAstro(h) {
  const a = h < 0 ? 0 : h;
  return 0.0002967 / Math.tan(a + 0.00312536 / (a + 0.08901179));
}

function coordonneesLune(d) {
  const L = RAD * (218.316 + 13.176396 * d); // longitude écliptique
  const M = RAD * (134.963 + 13.064993 * d); // anomalie moyenne
  const F = RAD * (93.272 + 13.229350 * d);  // distance moyenne au nœud

  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);   // distance en km

  return { ra: ascensionDroite(l, b), dec: declinaison(l, b), distance: dt };
}

/**
 * Position de la lune.
 * @param {Date|number} date @param {number} lat @param {number} lon
 * @returns {{azimut:number, hauteur:number, distance:number}|null}
 */
export function positionLune(date, lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const t = Number(date);
  if (!Number.isFinite(t)) return null;

  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = versJours(t);
  const c = coordonneesLune(d);
  const H = tempsSideral(d, lw) - c.ra;
  let h = hauteur(H, phi, c.dec);
  // Réfraction atmosphérique (Meeus 16.4, forme SunCalc) : TOUT est en
  // RADIANS ici. ⚠ Ne pas y mêler la variante en degrés (0,017 / tan(h +
  // 10,26/(h+5,1))) : les deux se ressemblent et donnent un résultat faux.
  h += refractionAstro(h);

  return {
    azimut: (azimutSud(H, phi, c.dec) / RAD + 180 + 360) % 360,
    hauteur: h / RAD,
    distance: c.distance,
  };
}

/** Noms des phases lunaires, du nouveau au dernier croissant. */
export const NOMS_PHASES_LUNE = Object.freeze([
  'Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Gibbeuse croissante',
  'Pleine lune', 'Gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant',
]);

/**
 * Illumination et phase de la lune.
 * @param {Date|number} date
 * @returns {{fraction:number, phase:number, nom:string}|null}
 *   `fraction` = part éclairée (0 → 1), `phase` = 0 nouvelle, 0.5 pleine.
 */
export function illuminationLune(date) {
  const t = Number(date);
  if (!Number.isFinite(t)) return null;

  const d = versJours(t);
  const s = coordonneesSoleil(d);
  const m = coordonneesLune(d);
  const sdist = 149598000; // distance Terre–Soleil, km

  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec)
    + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra),
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.distance - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec)
    - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra),
  );

  const phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;
  const index = Math.round(phase * 8) % 8;
  return {
    fraction: (1 + Math.cos(inc)) / 2,
    phase,
    nom: NOMS_PHASES_LUNE[index],
  };
}

// ── lecture humaine ────────────────────────────────────────────────────────

/** Points cardinaux, 16 secteurs de 22,5°. */
const CARDINAUX = Object.freeze([
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO',
]);

/** @param {number} azimut - degrés depuis le nord @returns {string} */
export function cardinal(azimut) {
  if (!Number.isFinite(azimut)) return '—';
  return CARDINAUX[Math.round(((azimut % 360) + 360) % 360 / 22.5) % 16];
}

/**
 * Longueur de l'ombre portée par un objet vertical, en multiples de sa
 * hauteur. Utile pour l'architecture et la photo.
 *
 * @param {number} hauteurSoleil - degrés au-dessus de l'horizon
 * @returns {number|null} rapport ombre/hauteur ; `null` si le soleil est sous
 *   l'horizon (pas d'ombre) — un rapport « infini » n'aurait aucun sens.
 */
export function longueurOmbre(hauteurSoleil) {
  if (!Number.isFinite(hauteurSoleil) || hauteurSoleil <= 0) return null;
  return 1 / Math.tan(hauteurSoleil * RAD);
}

/**
 * Qualifie la lumière du moment — vocabulaire des photographes.
 * @param {number} hauteurSoleil - degrés
 * @returns {{cle:string, nom:string, couleur:string}}
 */
export function qualiteLumiere(hauteurSoleil) {
  const h = Number(hauteurSoleil);
  if (!Number.isFinite(h)) return { cle: 'inconnu', nom: 'Inconnue', couleur: '#8a9099' };
  if (h < -18) return { cle: 'nuit', nom: 'Nuit noire', couleur: '#1b2330' };
  if (h < -12) return { cle: 'astro', nom: 'Crépuscule astronomique', couleur: '#22304a' };
  if (h < -6) return { cle: 'nautique', nom: 'Crépuscule nautique', couleur: '#2f4468' };
  if (h < -0.833) return { cle: 'civil', nom: 'Crépuscule civil', couleur: '#4a5d8a' };
  if (h < 6) return { cle: 'doree', nom: 'Heure dorée', couleur: '#f0a848' };
  if (h < 12) return { cle: 'douce', nom: 'Lumière douce', couleur: '#f3c674' };
  return { cle: 'plein', nom: 'Plein jour', couleur: '#ffe9a8' };
}
