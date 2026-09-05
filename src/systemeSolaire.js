/**
 * WATCHTOWER — SYSTÈME SOLAIRE AUTOUR DE LA TERRE.
 *
 * Des entités sont ajoutées dans l'espace autour du globe pour matérialiser
 * le système solaire en suivant les VRAIES positions et rotations :
 *
 *  · les positions héliocentriques des planètes viennent des éléments
 *    képleriens moyens publiés par le JPL (Standish, « Approximate Positions
 *    of the Major Planets », domaine public) — directions réelles, phases
 *    réelles, boucles de rétrogradation réelles ;
 *  · la LUNE utilise la série ELP2000 tronquée (Meeus) : distance, latitude
 *    et phase réelles ;
 *  · les positions sont calculées dans le repère INERTIEL puis converties en
 *    repère terrestre via le temps sidéral (GMST) : la Terre tourne donc
 *    SOUS le ciel, comme dans la réalité ;
 *  · seules les DISTANCES sont comprimées (logarithmique) : sinon Neptune
 *    serait à 4,5 milliards de km et invisible. La Lune garde sa vraie
 *    distance (384 400 km).
 *
 * Domaine public / open source : aucune clé, aucun service distant.
 */

import * as Cesium from 'cesium';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

const CSS = `
#wt-systeme { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-systeme .sy-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit; font-size: 9.5px;
  font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-systeme .sy-btn:hover { background: rgba(0,212,255,0.22); }
#wt-systeme .sy-btn.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); color: rgba(232,234,237,0.75); }
#wt-systeme .sy-ligne { display: flex; align-items: center; gap: 6px; font-size: 9.5px; color: rgba(232,234,237,0.65); }
#wt-systeme .sy-ligne input[type=range] { flex: 1; accent-color: #00d4ff; }
#wt-systeme .sy-liste { display: flex; flex-direction: column; gap: 3px; max-height: 30vh; overflow-y: auto; }
#wt-systeme .sy-obj { display: flex; gap: 6px; align-items: center; padding: 4px 7px; border-radius: 7px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); font-size: 9px; }
#wt-systeme .sy-obj .pastille { width: 8px; height: 8px; border-radius: 50%; flex: none; }
#wt-systeme .sy-obj .nom { flex: 1; cursor: pointer; background: none; border: none; color: inherit; font-family: inherit; text-align: left; }
#wt-systeme .sy-obj .dist { color: rgba(232,234,237,0.5); font-variant-numeric: tabular-nums; }
#wt-systeme .sy-note { font-size: 8.5px; line-height: 1.6; color: rgba(232,234,237,0.45); }
`;

const DEG = Math.PI / 180;
const UA = 149_597_870_700; // m
const J2000 = 2451545.0;

/**
 * Éléments képleriens moyens (JPL, référence J2000, valables 1800–2050).
 * a : demi-grand axe (UA) · e : excentricité · i : inclinaison (deg) ·
 * L : longitude moyenne (deg) · peri : longitude du périhélie · node : longitude du nœud.
 */
export const ELEMENTS = Object.freeze({
  mercure: { nom: 'Mercure', a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], i: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], peri: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081], rayon: 2439.7, couleur: '#b9b0a6' },
  venus: { nom: 'Vénus', a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], i: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], peri: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418], rayon: 6051.8, couleur: '#e8c07d' },
  terre: { nom: 'Terre', a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], i: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0.0, 0.0], rayon: 6371.0, couleur: '#4a90d9' },
  mars: { nom: 'Mars', a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], i: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343], rayon: 3389.5, couleur: '#d9603b' },
  jupiter: { nom: 'Jupiter', a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], i: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], peri: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106], rayon: 69911, couleur: '#d8a878' },
  saturne: { nom: 'Saturne', a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], i: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], peri: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794], rayon: 58232, couleur: '#e3d6a0' },
  uranus: { nom: 'Uranus', a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], i: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], peri: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589], rayon: 25362, couleur: '#a8e0e6' },
  neptune: { nom: 'Neptune', a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], i: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], peri: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664], rayon: 24622, couleur: '#6f8ff0' },
});

export const ORDRE = Object.freeze(['mercure', 'venus', 'mars', 'jupiter', 'saturne', 'uranus', 'neptune']);

/** Siècles juliens écoulés depuis J2000. */
export function sieclesDepuisJ2000(date) {
  const jd = (date.getTime() / 86_400_000) + 2440587.5;
  return (jd - J2000) / 36525;
}

/** Temps sidéral de Greenwich (rad) — rotation réelle de la Terre. */
export function gmst(date) {
  const jd = (date.getTime() / 86_400_000) + 2440587.5;
  const d = jd - J2000;
  let deg = 280.46061837 + 360.98564736629 * d;
  const t = d / 36525;
  deg += 0.000387933 * t * t - (t * t * t) / 38_710_000;
  return (((deg % 360) + 360) % 360) * DEG;
}

/** Résout l'équation de Kepler (E - e·sinE = M) par Newton. */
export function anomalieExcentrique(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i += 1) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * Position héliocentrique écliptique (J2000) d'une planète, en UA.
 * @returns {{x:number,y:number,z:number, distance:number}}
 */
export function positionHeliocentrique(nom, date) {
  const el = ELEMENTS[nom];
  if (!el) return null;
  const T = sieclesDepuisJ2000(date);
  const v = (p) => p[0] + p[1] * T;
  const a = v(el.a);
  const e = v(el.e);
  const i = v(el.i) * DEG;
  const L = v(el.L) * DEG;
  const peri = v(el.peri) * DEG;
  const node = v(el.node) * DEG;
  const w = peri - node;              // argument du périhélie
  let M = L - peri;
  M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const E = anomalieExcentrique(M, e);
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
  const cw = Math.cos(w); const sw = Math.sin(w);
  const cn = Math.cos(node); const sn = Math.sin(node);
  const ci = Math.cos(i); const si = Math.sin(i);
  const x = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp;
  const y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp;
  const z = (sw * si) * xp + (cw * si) * yp;
  return { x, y, z, distance: Math.sqrt(x * x + y * y + z * z) };
}

/**
 * Position GÉOCENTRIQUE écliptique d'une planète (vecteur Terre → planète).
 * @returns {{x:number,y:number,z:number, distance:number}} en UA
 */
export function positionGeocentrique(nom, date) {
  const p = positionHeliocentrique(nom, date);
  const t = positionHeliocentrique('terre', date);
  if (!p || !t) return null;
  const x = p.x - t.x;
  const y = p.y - t.y;
  const z = p.z - t.z;
  return { x, y, z, distance: Math.sqrt(x * x + y * y + z * z) };
}

/**
 * Position de la Lune (ELP2000 tronquée, Meeus) — distance réelle en km,
 * longitude/latitude écliptiques géocentriques.
 * @returns {{x:number,y:number,z:number, distance:number, phase:number}}
 */
export function positionLune(date) {
  const T = sieclesDepuisJ2000(date);
  const rad = (d) => ((d % 360) + 360) % 360 * DEG;
  const Lp = rad(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const D = rad(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const M = rad(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = rad(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const F = rad(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);
  const lambda = Lp + 6.289 * DEG * Math.sin(Mp)
    + 1.274 * DEG * Math.sin(2 * D - Mp)
    + 0.658 * DEG * Math.sin(2 * D)
    + 0.214 * DEG * Math.sin(2 * Mp)
    - 0.186 * DEG * Math.sin(M)
    - 0.114 * DEG * Math.sin(2 * F);
  const beta = 5.128 * DEG * Math.sin(F)
    + 0.280 * DEG * Math.sin(Mp + F)
    + 0.277 * DEG * Math.sin(Mp - F)
    + 0.173 * DEG * Math.sin(2 * D - F);
  const dist = 385_000.6 - 20_905.4 * Math.cos(Mp)
    - 3_699.0 * Math.cos(2 * D - Mp)
    - 2_956.9 * Math.cos(2 * D)
    - 569.9 * Math.cos(2 * Mp);
  // phase : fraction éclairée depuis l'élongation Lune-Soleil
  const elong = Math.acos(Math.max(-1, Math.min(1, Math.cos(lambda - (Lp + Math.PI))))); // ≈ D
  const phase = (1 - Math.cos(D)) / 2;
  return {
    x: dist * Math.cos(beta) * Math.cos(lambda),
    y: dist * Math.cos(beta) * Math.sin(lambda),
    z: dist * Math.sin(beta),
    distance: dist,
    phase,
    elong,
  };
}

/**
 * Comprime une distance réelle (UA) pour l'affichage : les planètes restent
 * dans le champ de la caméra terrestre. Échelle logarithmique pure.
 * @param {number} ua distance réelle en unités astronomiques
 */
export function rayonAffiche(ua, echelle = 1) {
  const r = Math.max(0.05, Number(ua) || 1);
  return (11e6 * ((r / 0.387) ** 0.28)) * Number(echelle || 1);
}

/** Rayon affiché d'un astre (m) depuis son rayon réel (km). */
export function rayonSphere(km, echelle = 1) {
  return 200_000 * ((Math.max(100, km) / 2439.7) ** 0.55) * Number(echelle || 1);
}

/** Repère écliptique J2000 → repère équatorial (obliquité 23,4393°). */
export function ecliptiqueVersEquatorial(v) {
  const eps = 23.4392911 * DEG;
  const ce = Math.cos(eps); const se = Math.sin(eps);
  return { x: v.x, y: v.y * ce - v.z * se, z: v.y * se + v.z * ce };
}

/** Repère inertiel équatorial → repère terrestre (ECEF) via le GMST. */
export function inertielVersFixe(v, date) {
  const g = gmst(date);
  const c = Math.cos(g); const s = Math.sin(g);
  return { x: v.x * c + v.y * s, y: -v.x * s + v.y * c, z: v.z };
}

/** Distance lisible : km, millions de km ou UA. */
export function etiquetteDistance(metres) {
  const m = Math.abs(Number(metres) || 0);
  if (m >= 0.2 * UA) return `${(m / UA).toFixed(2)} UA`;
  if (m >= 1e9) return `${(m / 1e6).toFixed(0)} M km`;
  if (m >= 1000) return `${Math.round(m / 1000).toLocaleString('fr-FR')} km`;
  return `${Math.round(m)} m`;
}

/**
 * @param {object} viewer
 * @param {{surMessage?:Function}} [options]
 */
export function initSystemeSolaire(viewer, options = {}) {
  const { surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-systeme-solaire');
  viewer.dataSources.add(ds);
  ds.show = false; // activé à la demande

  const el = document.createElement('div');
  el.id = 'wt-systeme';
  el.innerHTML = `
    <button class="sy-btn" data-a="activer">🪐 AFFICHER LE SYSTÈME SOLAIRE</button>
    <div class="sy-ligne"><span>échelle</span><input type="range" min="0.5" max="2.5" step="0.05" value="1"><span class="sy-ech">×1.00</span></div>
    <div class="sy-ligne"><span>date</span><input type="range" min="-365" max="365" step="1" value="0"><span class="sy-date">maintenant</span></div>
    <button class="sy-btn gris" data-a="orbites">⭕ ORBITES : OUI</button>
    <button class="sy-btn gris" data-a="reinitialiser">↺ MAINTENANT</button>
    <div class="sy-liste"></div>
    <div class="sy-note">Positions réelles : éléments képleriens du JPL (domaine public) + série
    lunaire ELP2000. Les directions et rotations sont vraies ; seules les DISTANCES des planètes
    sont comprimées (échelle logarithmique) — la Lune garde sa distance réelle de 384 400 km.</div>`;
  const listeEl = el.querySelector('.sy-liste');
  const btnActiver = el.querySelector('[data-a="activer"]');
  const btnOrbites = el.querySelector('[data-a="orbites"]');
  const curseurEchelle = el.querySelector('input[type=range]');
  const curseurDate = el.querySelectorAll('input[type=range]')[1];
  const texteEch = el.querySelector('.sy-ech');
  const texteDate = el.querySelector('.sy-date');

  let actif = false;
  let orbites = true;
  let echelle = 1;
  let decalageJours = 0;
  let timer = null;
  const entites = new Map();

  function dateSimulee() {
    return new Date(Date.now() + decalageJours * 86_400_000);
  }

  function cartesien(v, uniteEnMetres) {
    const m = { x: v.x * uniteEnMetres, y: v.y * uniteEnMetres, z: v.z * uniteEnMetres };
    const eq = ecliptiqueVersEquatorial(m);
    const fixe = inertielVersFixe(eq, dateSimulee());
    return new Cesium.Cartesian3(fixe.x, fixe.y, fixe.z);
  }

  /** Construit une entité (sphère + étiquette) pour un astre. */
  function entite(nom, couleur, tailleKm) {
    const r = rayonSphere(tailleKm, echelle);
    return ds.entities.add({
      name: nom,
      ellipsoid: {
        radii: new Cesium.Cartesian3(r, r, r),
        material: Cesium.Color.fromCssColorString(couleur),
        shadows: Cesium.ShadowMode.DISABLED,
      },
      label: {
        text: nom.toUpperCase(),
        font: 'bold 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString(couleur),
        outlineColor: Cesium.Color.fromCssColorString('#05080d'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1e6, 1.2, 6e8, 0.5),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4e9),
      },
    });
  }

  /** Trace la boucle réellement parcourue dans le ciel (rétrogradations). */
  function orbiteDe(nom) {
    const points = [];
    const maintenant = dateSimulee();
    for (let i = 0; i <= 220; i += 1) {
      const d = new Date(maintenant.getTime() + (i / 220) * 400 * 86_400_000);
      const g = positionGeocentrique(nom, d);
      if (!g) continue;
      points.push(cartesien(g, 1)); // placé au rayon affiché plus bas
    }
    return points;
  }

  function construire() {
    ds.entities.removeAll();
    entites.clear();

    // SOLEIL (direction réelle, distance comprimée)
    const t = positionHeliocentrique('terre', dateSimulee());
    const dirSoleil = { x: -t.x, y: -t.y, z: -t.z };
    const nS = Math.hypot(dirSoleil.x, dirSoleil.y, dirSoleil.z) || 1;
    const rS = rayonAffiche(1, echelle) * 4.2;
    const soleil = entite('Soleil', '#ffd24a', 696_000);
    soleil.position = new Cesium.Cartesian3(
      ...Object.values(inertielVersFixe(ecliptiqueVersEquatorial({
        x: (dirSoleil.x / nS) * rS, y: (dirSoleil.y / nS) * rS, z: (dirSoleil.z / nS) * rS,
      }), dateSimulee())),
    );
    entites.set('soleil', { entite: soleil, distance: 1 * UA });

    // LUNE (vraie distance)
    const lune = entite('Lune', '#dfe6ee', 1737.4);
    const gL = positionLune(dateSimulee());
    lune.position = cartesien(gL, 1000); // km → m
    lune.label.text = `LUNE · ${Math.round(gL.phase * 100)} %`;
    entites.set('lune', { entite: lune, distance: gL.distance * 1000 });

    // PLANÈTES
    for (const nom of ORDRE) {
      const e = ELEMENTS[nom];
      const g = positionGeocentrique(nom, dateSimulee());
      if (!g) continue;
      const n = Math.hypot(g.x, g.y, g.z) || 1;
      const r = rayonAffiche(g.distance, echelle);
      const pos = cartesien({ x: (g.x / n) * r, y: (g.y / n) * r, z: (g.z / n) * r }, 1);
      const ent = entite(e.nom, e.couleur, e.rayon);
      ent.position = pos;
      entites.set(nom, { entite: ent, distance: g.distance * UA });
      if (orbites) {
        const anneau = [];
        const maintenant = dateSimulee();
        for (let i = 0; i <= 200; i += 1) {
          const d = new Date(maintenant.getTime() + (i / 200) * 420 * 86_400_000);
          const gg = positionGeocentrique(nom, d);
          if (!gg) continue;
          const nn = Math.hypot(gg.x, gg.y, gg.z) || 1;
          const rr = rayonAffiche(gg.distance, echelle);
          anneau.push(cartesien({ x: (gg.x / nn) * rr, y: (gg.y / nn) * rr, z: (gg.z / nn) * rr }, 1));
        }
        ds.entities.add({
          polyline: {
            positions: anneau,
            width: 1,
            material: Cesium.Color.fromCssColorString(e.couleur).withAlpha(0.28),
          },
        });
      }
    }
    rendreListe();
    governorRequestRender('wt-systeme');
  }

  function rendreListe() {
    const lignes = [];
    for (const [cle, v] of entites) {
      const e = ELEMENTS[cle];
      const nom = cle === 'soleil' ? '☀ Soleil' : cle === 'lune' ? '🌙 Lune' : `● ${e?.nom || cle}`;
      const coul = cle === 'soleil' ? '#ffd24a' : cle === 'lune' ? '#dfe6ee' : (e?.couleur || '#fff');
      lignes.push(`<div class="sy-obj">
        <span class="pastille" style="background:${coul}"></span>
        <button class="nom" data-cle="${cle}">${nom}</button>
        <span class="dist">${etiquetteDistance(v.distance)}</span>
      </div>`);
    }
    listeEl.innerHTML = lignes.join('');
    listeEl.querySelectorAll('.nom').forEach((b) => b.addEventListener('click', () => {
      const v = entites.get(b.dataset.cle);
      if (!v?.entite?.position) return;
      const p = v.entite.position.getValue(Cesium.JulianDate.now());
      if (!p) return;
      const dist = Math.max(Cesium.Cartesian3.magnitude(p) * 0.35, 2e6);
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromElements(p.x, p.y, p.z + dist),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25), roll: 0 },
        duration: 3.2,
      });
    }));
  }

  function majTexte() {
    texteEch.textContent = `×${Number(echelle).toFixed(2)}`;
    const d = dateSimulee();
    texteDate.textContent = decalageJours === 0
      ? 'maintenant'
      : `${decalageJours > 0 ? '+' : ''}${decalageJours} j (${d.toLocaleDateString('fr-FR')})`;
  }

  function activer(etat) {
    actif = Boolean(etat);
    ds.show = actif;
    btnActiver.textContent = actif ? '🪐 MASQUER LE SYSTÈME SOLAIRE' : '🪐 AFFICHER LE SYSTÈME SOLAIRE';
    if (actif) {
      construire();
      // rafraîchissement : les vraies rotations (la Terre tourne sous le ciel)
      holdContinuousRender('wt-systeme');
      timer = window.setInterval(() => { if (actif) construire(); }, 20_000);
      surMessage?.('🪐 Système solaire activé — positions réelles (JPL/ELP2000), distances comprimées.');
      // vue d'ensemble
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromElements(0, 0, 120e6),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        duration: 2.6,
      });
    } else {
      if (timer) window.clearInterval(timer);
      timer = null;
      releaseContinuousRender('wt-systeme');
      ds.entities.removeAll();
      entites.clear();
    }
    majTexte();
  }

  btnActiver.addEventListener('click', () => activer(!actif));
  btnOrbites.addEventListener('click', () => {
    orbites = !orbites;
    btnOrbites.textContent = `⭕ ORBITES : ${orbites ? 'OUI' : 'NON'}`;
    if (actif) construire();
  });
  el.querySelector('[data-a="reinitialiser"]').addEventListener('click', () => {
    decalageJours = 0;
    curseurDate.value = '0';
    majTexte();
    if (actif) construire();
  });
  curseurEchelle.addEventListener('input', () => {
    echelle = Number(curseurEchelle.value) || 1;
    majTexte();
    if (actif) construire();
  });
  curseurDate.addEventListener('input', () => {
    decalageJours = Number(curseurDate.value) || 0;
    majTexte();
    if (actif) construire();
  });

  return {
    element: el,
    activer,
    construire,
    positions: (date = new Date()) => ({
      lune: positionLune(date),
      planetes: ORDRE.map((n) => ({ nom: n, ...positionGeocentrique(n, date) })),
    }),
    visible: () => ds.show,
  };
}
