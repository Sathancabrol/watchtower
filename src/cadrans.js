/**
 * WATCHTOWER — CADRANS DE LA COMMUNE (découpage « Frostpunk »).
 *
 * La vue QUARTIER ne disait rien de lisible : on trace maintenant un vrai
 * quadrillage qui DIVISE LA COMMUNE EN CADRANS, avec :
 *
 *  · un **tracé animé** : le contour se dessine, puis les lignes de séparation
 *    apparaissent l'une après l'autre (façon carte tactique) ;
 *  · des **noms réels quand ils existent** : les quartiers officiels
 *    d'OpenStreetMap (`place=quarter|neighbourhood|suburb`) baptisent le
 *    cadran dans lequel ils tombent ;
 *  · sinon l'**alphabet OTAN** : ALPHA, BRAVO, CHARLIE, DELTA… et des
 *    sous-cadrans ALPHA-1, ALPHA-2, ALPHA-3, ALPHA-4.
 *
 * Chaque cadran est cliquable : on y vole, et son contenu est listé
 * (entités OpenStreetMap qu'il contient).
 *
 * Sources : OpenStreetMap (Overpass, ODbL) + l'ellipsoïde Cesium.
 * Aucune clé.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';

/** Alphabet OTAN — utilisé quand un cadran n'a pas de nom officiel. */
export const ALPHABET = Object.freeze([
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL',
  'INDIA', 'JULIETT', 'KILO', 'LIMA', 'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA',
  'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY',
  'XRAY', 'YANKEE', 'ZULU',
]);

/** Nom d'un cadran : `index` en base `ALPHABET`, suffixe `-n` en sous-cadran. */
export function nomCadran(index, sous = 0) {
  const i = Math.max(0, Math.round(Number(index) || 0));
  const base = ALPHABET[i % ALPHABET.length] || `C${i + 1}`;
  const s = Math.max(0, Math.round(Number(sous) || 0));
  return s > 0 ? `${base}-${s}` : base;
}

/** Vrai si le point [lon, lat] est dans le cadran (bbox). */
export function cadranContient(cadran, lon, lat) {
  if (!cadran) return false;
  const { ouest, sud, est, nord } = cadran.bbox;
  return lon >= ouest && lon <= est && lat >= sud && lat <= nord;
}

/**
 * Découpe une emprise en cadrans.
 * @param {{ouest:number,sud:number,est:number,nord:number}} bbox
 * @param {{colonnes?:number, lignes?:number, niveau?:number}} [options]
 * @returns {Array} cadrans {nom, niveau, index, sous, bbox, polygone, centre}
 */
export function decouper(bbox, options = {}) {
  const b = bbox || {};
  const ouest = Number(b.ouest); const sud = Number(b.sud);
  const est = Number(b.est); const nord = Number(b.nord);
  if (![ouest, sud, est, nord].every(Number.isFinite) || est <= ouest || nord <= sud) return [];
  const colonnes = Math.max(1, Math.round(options.colonnes || 2));
  const lignes = Math.max(1, Math.round(options.lignes || 2));
  const niveau = Math.max(1, Math.round(options.niveau || 1));
  const lPas = (est - ouest) / colonnes;
  const lPas2 = (nord - sud) / lignes;
  const out = [];
  let i = 0;
  // balayage « lecture » : du nord-ouest vers le sud-est
  for (let r = 0; r < lignes; r += 1) {
    for (let c = 0; c < colonnes; c += 1) {
      const o = ouest + c * lPas;
      const e = o + lPas;
      const s = sud + (lignes - 1 - r) * lPas2;   // la ligne 0 est au NORD
      const n = s + lPas2;
      const sous = niveau > 1 ? (r * colonnes + c) % 4 + 1 : 0;
      out.push({
        nom: nomCadran(i, sous),
        niveau, index: i, sous,
        bbox: { ouest: o, sud: s, est: e, nord: n },
        polygone: [[o, s], [e, s], [e, n], [o, n], [o, s]],
        centre: { lon: (o + e) / 2, lat: (s + n) / 2 },
      });
      i += 1;
    }
  }
  return out;
}

/** Emprise d'un anneau [[lon,lat],…] (ou d'une liste d'anneaux). */
export function bboxDe(points = []) {
  const pts = Array.isArray(points?.[0]?.[0]) ? points.flat() : (points || []);
  if (!pts.length) return null;
  let ouest = Infinity; let sud = Infinity; let est = -Infinity; let nord = -Infinity;
  for (const p of pts) {
    const lon = Number(p?.[0]); const lat = Number(p?.[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    ouest = Math.min(ouest, lon); est = Math.max(est, lon);
    sud = Math.min(sud, lat); nord = Math.max(nord, lat);
  }
  return Number.isFinite(ouest) ? { ouest, sud, est, nord } : null;
}

/**
 * Baptise les cadrans avec les quartiers officiels OSM qui y tombent.
 * @param {Array} cadrans
 * @param {Array<{lat:number,lon:number,nom:string}>} quartiers
 * @returns {Array} cadrans (mêmes objets, `nom` et `nomOfficiel` renseignés)
 */
export function nommerDepuisQuartiers(cadrans = [], quartiers = []) {
  for (const c of cadrans) {
    const dedans = quartiers.filter((q) => cadranContient(c, Number(q.lon), Number(q.lat)));
    if (dedans.length) {
      c.nomOfficiel = dedans.map((q) => q.nom).filter(Boolean).join(' / ');
      c.nom = c.nomOfficiel;
      c.quartiers = dedans;
    } else {
      c.nomOfficiel = '';
      c.quartiers = [];
    }
  }
  return cadrans;
}

/** Requête Overpass des quartiers officiels dans une emprise. */
export function requeteQuartiers(bbox) {
  const b = bbox || {};
  const zone = `${b.sud},${b.ouest},${b.nord},${b.est}`;
  return `[out:json][timeout:20];
(
  nwr(${zone})[place=quarter];
  nwr(${zone})[place=neighbourhood];
  nwr(${zone})[place=suburb];
  nwr(${zone})[place=hamlet];
);
out center tags 300;`;
}

/** Extrait les quartiers d'une réponse Overpass. */
export function quartiersDepuisReponse(donnees) {
  const els = Array.isArray(donnees?.elements) ? donnees.elements : [];
  const out = [];
  const vus = new Set();
  for (const e of els) {
    const lat = Number.isFinite(e.lat) ? e.lat : e.center?.lat;
    const lon = Number.isFinite(e.lon) ? e.lon : e.center?.lon;
    const nom = String(e.tags?.name || '').trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !nom) continue;
    if (vus.has(nom.toLowerCase())) continue;
    vus.add(nom.toLowerCase());
    out.push({ lat, lon, nom, type: e.tags?.place || '' });
  }
  return out;
}

const CSS = `
#wt-cadrans {
  position: fixed; right: 12px; top: 132px; z-index: 966; width: 250px; display: none;
  font-family: var(--font-mono, monospace); color: #e8eaed; font-size: 10px;
  background: rgba(8,12,18,0.95); border: 1px solid rgba(0,212,255,0.45); border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0,0,0,0.55); overflow: hidden; max-height: 70vh;
}
#wt-cadrans .t { display: flex; align-items: center; gap: 6px; padding: 7px 10px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; font-weight: 700; color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-cadrans .t button { margin-left: auto; cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 12px; }
#wt-cadrans .c { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
#wt-cadrans .c .b { cursor: pointer; padding: 7px 8px; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; border-radius: 8px; background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.5); color: #00d4ff; }
#wt-cadrans .c .b.actif { background: rgba(0,212,255,0.28); color: #fff; }
#wt-cadrans .ligne { display: flex; gap: 5px; }
#wt-cadrans .liste { display: flex; flex-direction: column; gap: 3px; max-height: 34vh; overflow-y: auto; }
#wt-cadrans .cad { cursor: pointer; text-align: left; padding: 5px 7px; border-radius: 7px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: inherit; font-family: inherit; font-size: 9.5px; display: flex; gap: 6px; align-items: center; }
#wt-cadrans .cad:hover { border-color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-cadrans .cad .n { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-cadrans .cad.officiel .n { color: #7ef0c0; }
#wt-cadrans .note { color: rgba(232,234,237,0.45); line-height: 1.6; font-size: 8px; }
#wt-cadrans .note a { color: #00d4ff; text-decoration: none; }
`;

/**
 * @param {object} viewer
 * @param {{surMessage?:Function, fiche?:Function}} [options]
 */
export function initCadrans(viewer, options = {}) {
  const { surMessage = null, fiche = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-cadrans');
  viewer.dataSources.add(ds);

  // ── panneau ──
  const el = document.createElement('div');
  el.id = 'wt-cadrans';
  el.innerHTML = `
    <div class="t"><span>🔲 CADRANS DE LA COMMUNE</span><button type="button" class="fermer">✕</button></div>
    <div class="c">
      <button class="b tracer" type="button">🔲 TRACER LES CADRANS</button>
      <div class="ligne">
        <button class="b niv1" type="button">4 CADRANS</button>
        <button class="b niv2" type="button">9 CADRANS</button>
      </div>
      <button class="b sous" type="button">🔳 SOUS-CADRANS (×4)</button>
      <div class="liste"></div>
      <div class="note">Découpage lisible de la commune : les noms officiels des quartiers
      (OpenStreetMap) sont utilisés quand ils existent — sinon alphabet OTAN
      (ALPHA, BRAVO…). Clic sur un cadran pour y voler.
      <br><a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">source : OpenStreetMap (ODbL)</a></div>
    </div>`;
  document.body.appendChild(el);
  rendreDeplacable(el, el.querySelector('.t'));

  const listeEl = el.querySelector('.liste');
  let cadrans = [];
  let niveau = 1;           // 1 = 2×2, 2 = 3×3
  let avecSous = false;
  let minuteur = null;
  let actif = false;

  function rendreListe() {
    listeEl.innerHTML = '';
    if (!cadrans.length) {
      listeEl.innerHTML = '<div style="opacity:.5;font-size:8.5px">Aucun cadran tracé.</div>';
      return;
    }
    for (const c of cadrans) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `cad${c.nomOfficiel ? ' officiel' : ''}`;
      b.innerHTML = `<span>${c.nomOfficiel ? '🏘' : '🔲'}</span><span class="n">${c.nom}</span>`;
      b.title = c.nomOfficiel ? `quartier officiel OSM — ${c.nomOfficiel}` : 'cadran nommé par défaut (alphabet OTAN)';
      b.addEventListener('click', () => {
        const bbox = c.bbox;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(c.centre.lon, c.centre.lat, 1200),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 },
          duration: 1.6,
        });
        surMessage?.(`🔲 Cadran ${c.nom} — ${((bbox.est - bbox.ouest) * 111320 * Math.cos((c.centre.lat * Math.PI) / 180)).toFixed(0)} m × ${((bbox.nord - bbox.sud) * 110540).toFixed(0)} m`);
        fiche?.(c.centre.lon, c.centre.lat, `Cadran ${c.nom}`);
      });
      listeEl.appendChild(b);
    }
  }

  /** Emprise courante : le contour communal s'il est connu, sinon la vue. */
  function emprise() {
    const anneaux = window.__godsEyeView?.contours?.anneauxCommune?.() || null;
    const b = anneaux ? bboxDe(anneaux) : null;
    if (b && b.est > b.ouest && b.nord > b.sud) return b;
    const r = viewer.camera.computeViewRectangle?.();
    if (r) {
      return {
        ouest: Cesium.Math.toDegrees(r.west), est: Cesium.Math.toDegrees(r.east),
        sud: Cesium.Math.toDegrees(r.south), nord: Cesium.Math.toDegrees(r.north),
      };
    }
    return null;
  }

  async function tracer() {
    const bbox = emprise();
    if (!bbox) { surMessage?.('🔲 Emprise inconnue — approche-toi de la commune.'); return; }
    ds.entities.removeAll();
    const cols = niveau >= 2 ? 3 : 2;
    cadrans = decouper(bbox, { colonnes: cols, lignes: cols, niveau: avecSous ? 2 : 1 });

    // noms officiels (OpenStreetMap) si la source répond
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(requeteQuartiers(bbox))}`,
      });
      const d = await r.json();
      nommerDepuisQuartiers(cadrans, quartiersDepuisReponse(d));
    } catch { /* réseau : on garde l'alphabet OTAN */ }
    const officiels = cadrans.filter((c) => c.nomOfficiel).length;

    // ── tracé animé, façon carte tactique ──
    const lignes = [];
    for (const c of cadrans) {
      lignes.push({
        positions: Cesium.Cartesian3.fromDegreesArray(c.polygone.flat()),
        nom: c.nom,
      });
    }
    if (avecSous) {
      for (const c of cadrans) {
        const s = decouper(c.bbox, { colonnes: 2, lignes: 2, niveau: 2 });
        for (const x of s) {
          lignes.push({ positions: Cesium.Cartesian3.fromDegreesArray(x.polygone.flat()), nom: `${c.nom}-${x.index + 1}` });
        }
      }
    }
    if (minuteur) { window.clearInterval(minuteur); minuteur = null; }
    let i = 0;
    const pas = () => {
      if (i >= lignes.length) {
        window.clearInterval(minuteur); minuteur = null;
        // pastilles de nom au centre de chaque cadran
        for (const c of cadrans) {
          ds.entities.add({
            position: Cesium.Cartesian3.fromDegrees(c.centre.lon, c.centre.lat, 60),
            label: {
              text: c.nom,
              font: 'bold 12px "JetBrains Mono", monospace',
              fillColor: c.nomOfficiel
                ? Cesium.Color.fromCssColorString('#7ef0c0')
                : Cesium.Color.fromCssColorString('#00d4ff'),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#060c12').withAlpha(0.72),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 24000),
            },
          });
        }
        surMessage?.(`🔲 ${cadrans.length} cadran(s) tracé(s) — ${officiels} nommé(s) d’après OpenStreetMap.`);
        return;
      }
      const l = lignes[i];
      ds.entities.add({
        polyline: {
          positions: l.positions,
          width: 3,
          material: Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.75),
          clampToGround: true,
        },
      });
      i += 1;
      viewer.scene.requestRender?.();
    };
    pas();
    minuteur = window.setInterval(pas, 90);
    actif = true;
    rendreListe();
  }

  function effacer() {
    if (minuteur) { window.clearInterval(minuteur); minuteur = null; }
    ds.entities.removeAll();
    cadrans = [];
    actif = false;
    rendreListe();
  }

  function basculer(etat) {
    const on = etat === undefined ? !actif : Boolean(etat);
    if (on) { el.style.display = ''; tracer(); } else { effacer(); el.style.display = 'none'; }
    return on;
  }

  el.querySelector('.tracer').addEventListener('click', tracer);
  el.querySelector('.niv1').addEventListener('click', () => { niveau = 1; tracer(); });
  el.querySelector('.niv2').addEventListener('click', () => { niveau = 2; tracer(); });
  el.querySelector('.sous').addEventListener('click', () => { avecSous = !avecSous; el.querySelector('.sous').classList.toggle('actif', avecSous); tracer(); });
  el.querySelector('.fermer').addEventListener('click', () => { el.style.display = 'none'; });
  rendreListe();

  return {
    element: el,
    ouvrir: () => { el.style.display = ''; },
    basculer,
    tracer,
    effacer,
    cadrans: () => cadrans.slice(),
    actif: () => actif,
    niveau: () => niveau,
  };
}
