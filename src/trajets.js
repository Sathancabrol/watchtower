/**
 * WATCHTOWER — TRACÉ DE TRAJETS.
 *
 * Mode « VOL D'OISEAU » (ligne droite, calculée localement) ou « SUIVRE LA
 * ROUTE / LE CHEMIN » : les points sont reliés par un itinéraire réel calculé
 * par OSRM (serveur de démonstration ouvert, sans clé : marche à pied, vélo,
 * voiture). Si le service ne répond pas, on retombe automatiquement sur la
 * ligne droite — le tracé existe toujours.
 *
 * Utilisation : bouton 🛣 TRAJETS dans le dock → « TRACER » → clics sur la
 * carte (un clic = une étape) → « TERMINER ». Distance et durée s'affichent
 * au fur et à mesure ; les trajets sont mémorisés.
 */

import * as Cesium from 'cesium';
import { governorRequestRender } from './renderGovernor.js';
import { spriteEpingle } from './marqueurs.js';

const CLE = 'watchtower.trajets.v1';

const CSS = `
#wt-trajets { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-trajets .t-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit;
  font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-trajets .t-btn:hover { background: rgba(0,212,255,0.2); }
#wt-trajets .t-btn.actif { background: rgba(0,212,255,0.32); }
#wt-trajets .t-btn.rouge { border-color: rgba(240,90,90,0.5); color: #f08a8a; background: rgba(240,90,90,0.07); }
#wt-trajets .t-range { display: flex; gap: 5px; }
#wt-trajets .t-range select {
  flex: 1; padding: 8px; background: rgba(0,0,0,0.45); color: inherit;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 10px; outline: none;
}
#wt-trajets .t-info { color: rgba(232,234,237,0.7); line-height: 1.6; font-size: 9.5px; }
#wt-trajets .t-liste { display: flex; flex-direction: column; gap: 4px; max-height: 22vh; overflow-y: auto; }
#wt-trajets .t-item { display: flex; align-items: center; gap: 6px; padding: 5px 7px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 9.5px; }
#wt-trajets .t-item .nom { flex: 1; cursor: pointer; text-align: left; background: none; border: none; color: inherit; font-family: inherit; }
#wt-trajets .t-item .mini { cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.5); font-size: 11px; }
`;

/** Profils OSRM (serveur public de démonstration, sans clé). */
export const PROFILS = Object.freeze([
  { id: 'vol', nom: 'VOL D’OISEAU', osrm: null, couleur: '#00d4ff' },
  { id: 'route', nom: 'ROUTE (voiture)', osrm: 'driving', couleur: '#43d17a' },
  { id: 'pied', nom: 'À PIED (chemins)', osrm: 'walking', couleur: '#ffb020' },
  { id: 'velo', nom: 'À VÉLO', osrm: 'cycling', couleur: '#a97bff' },
]);

const OSRM = 'https://router.project-osrm.org/route/v1';

/** Distance orthodromique (m) — formule de Haversine. */
export function distanceVol(a, b) {
  const R = 6371008.8;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const la1 = a.lat * rad;
  const la2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Longueur (m) d'une ligne brisée lon/lat. */
export function longueurTrace(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += distanceVol(points[i - 1], points[i]);
  return total;
}

/** Formatte une distance et une durée pour l'affichage. */
export function formaterTrajet(metres, secondes) {
  const m = Math.max(0, Math.round(metres || 0));
  const dist = m >= 1000 ? `${(m / 1000).toFixed(m >= 10_000 ? 0 : 1)} km` : `${m} m`;
  if (!Number.isFinite(secondes) || secondes <= 0) return dist;
  const h = Math.floor(secondes / 3600);
  const min = Math.round((secondes % 3600) / 60);
  const duree = h ? `${h} h ${String(min).padStart(2, '0')}` : `${min} min`;
  return `${dist} · ${duree}`;
}

/**
 * Itinéraire réel via OSRM. Retourne `null` si indisponible (le appelant
 * retombe alors sur la ligne droite).
 * @returns {Promise<{points:number[], distance:number, duree:number}|null>}
 */
export async function itineraireOSRM(points, profil) {
  if (!profil || points.length < 2) return null;
  const coords = points.map((p) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const url = `${OSRM}/${profil}/${coords}?overview=full&geometries=geojson&continue_straight=false`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    const route = d?.routes?.[0];
    const coordo = route?.geometry?.coordinates;
    if (!Array.isArray(coordo) || coordo.length < 2) return null;
    const plat = [];
    for (const [x, y] of coordo) plat.push(x, y);
    return { points: plat, distance: route.distance || 0, duree: route.duration || 0 };
  } catch {
    return null;
  }
}

function lire() {
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE) || '[]');
    return Array.isArray(brut) ? brut : [];
  } catch { return []; }
}

function ecrire(liste) {
  try { window.localStorage.setItem(CLE, JSON.stringify(liste.slice(-40))); } catch { /* plein */ }
}

/**
 * @param {object} viewer
 * @param {{fiche?:Function, surMessage?:Function}} [options]
 */
export function initTrajets(viewer, options = {}) {
  const { fiche = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-trajets');
  viewer.dataSources.add(ds);

  let trajets = lire();
  let brouillon = []; // points du tracé en cours
  let armé = false;
  let profil = 'route';

  const el = document.createElement('div');
  el.id = 'wt-trajets';
  el.innerHTML = `
    <div class="t-range">
      <select class="f-profil">
        ${PROFILS.map((p) => `<option value="${p.id}">${p.nom}</option>`).join('')}
      </select>
    </div>
    <button class="t-btn tracer" type="button">🛣 TRACER UN TRAJET</button>
    <button class="t-btn fin" type="button" style="display:none">✅ TERMINER LE TRAJET</button>
    <div class="t-info">Choisis un mode puis « TRACER » : chaque clic sur la carte ajoute une étape.
    Le tracé suit la voirie réelle (OSRM, gratuit) et retombe en ligne droite si le service est indisponible.</div>
    <div class="t-liste"></div>
    <button class="t-btn rouge vider" type="button">🗑 EFFACER LES TRAJETS</button>`;
  const listeEl = el.querySelector('.t-liste');
  const infoEl = el.querySelector('.t-info');
  const selectProfil = el.querySelector('.f-profil');
  selectProfil.value = profil;

  function couleurCourante() {
    return (PROFILS.find((p) => p.id === profil) || PROFILS[0]).couleur;
  }

  /** (Re)dessine tous les trajets mémorisés + le brouillon. */
  function redessiner() {
    ds.entities.removeAll();
    const tous = [...trajets.map((t) => ({ ...t, brouillon: false }))];
    if (brouillon.length >= 2) {
      tous.push({ id: 'brouillon', points: brouillon, profil, nom: 'Trajet en cours', brouillon: true });
    } else if (brouillon.length === 1 && armé) {
      // simple marqueur de départ pendant la saisie
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(brouillon[0].lon, brouillon[0].lat, 12),
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString(couleurCourante()), outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
      });
    }
    for (const t of tous) {
      const aplati = [];
      for (const p of t.points || []) aplati.push(p.lon, p.lat);
      if (aplati.length < 4) continue;
      const coul = Cesium.Color.fromCssColorString((PROFILS.find((p) => p.id === t.profil) || PROFILS[0]).couleur);
      ds.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(aplati),
          width: t.brouillon ? 4 : 6,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: coul.withAlpha(t.brouillon ? 0.85 : 0.95),
            outlineColor: Cesium.Color.fromCssColorString('#05080d'),
            outlineWidth: 2,
          }),
          clampToGround: true,
        },
        properties: { wtTrajet: t.id || 'brouillon' },
      });
      // étapes
      (t.points || []).forEach((p, i) => {
        const image = spriteEpingle({
          couleur: i === 0 ? '#43d17a' : i === (t.points.length - 1) ? '#f05252' : '#00d4ff',
          texte: String(i + 1),
          taille: 96,
        });
        if (!image) return;
        ds.entities.add({
          position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 8),
          billboard: {
            image,
            width: 26,
            height: 26,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(200, 1.1, 20_000, 0.4),
          },
        });
      });
    }
    governorRequestRender('wt-trajets');
  }

  function rendreListe() {
    listeEl.innerHTML = '';
    if (!trajets.length) {
      listeEl.innerHTML = '<div class="t-info">Aucun trajet enregistré.</div>';
      return;
    }
    trajets.slice().reverse().forEach((t) => {
      const l = document.createElement('div');
      l.className = 't-item';
      l.innerHTML = `<span>🛣</span><button class="nom" type="button">${t.nom || 'Trajet'}</button>
        <button class="mini" data-a="vol" title="Y voler">✈</button>
        <button class="mini" data-a="sup" title="Supprimer">🗑</button>`;
      l.querySelector('.nom').addEventListener('click', () => {
        if (t.points?.length) viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(t.points[0].lon, t.points[0].lat, 1200), duration: 1.6 });
      });
      l.querySelector('[data-a="vol"]').addEventListener('click', () => {
        if (t.points?.length) viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(t.points[0].lon, t.points[0].lat, 1200), duration: 1.6 });
      });
      l.querySelector('[data-a="sup"]').addEventListener('click', () => {
        trajets = trajets.filter((x) => x.id !== t.id);
        ecrire(trajets);
        redessiner();
        rendreListe();
      });
      listeEl.appendChild(l);
    });
  }

  function armer(etat) {
    armé = Boolean(etat);
    window.__wtTrajetArme = armé;
    el.querySelector('.tracer').style.display = armé ? 'none' : '';
    el.querySelector('.fin').style.display = armé ? '' : 'none';
    viewer.scene.canvas.style.cursor = armé ? 'crosshair' : '';
    if (armé) {
      brouillon = [];
      surMessage?.('🛣 Clique sur la carte pour ajouter les étapes du trajet.');
    }
  }

  async function terminer() {
    if (brouillon.length < 2) { armer(false); return; }
    const prof = PROFILS.find((p) => p.id === profil);
    let plat = [];
    let distance = 0;
    let duree = 0;
    let modeUtilise = 'vol';
    if (prof?.osrm) {
      const iti = await itineraireOSRM(brouillon, prof.osrm);
      if (iti) { plat = iti.points; distance = iti.distance; duree = iti.duree; modeUtilise = profil; }
    }
    if (!plat.length) {
      for (const p of brouillon) plat.push(p.lon, p.lat);
      distance = longueurTrace(brouillon);
      duree = 0;
    }
    const trajet = {
      id: `${Date.now().toString(36)}`,
      nom: `Trajet ${trajets.length + 1} · ${(PROFILS.find((p) => p.id === modeUtilise) || PROFILS[0]).nom}`,
      profil: modeUtilise,
      distance,
      duree,
      plat,
      points: brouillon.slice(),
      t: Date.now(),
    };
    trajets.push(trajet);
    ecrire(trajets);
    // on garde la GÉOMÉTRIE réelle de l'itinéraire (pas seulement les étapes)
    ds.entities.removeAll();
    brouillon = [];
    armer(false);
    // tracé final : la polyligne OSRM si disponible
    plat = trajet.plat;
    const coul = Cesium.Color.fromCssColorString((PROFILS.find((p) => p.id === trajet.profil) || PROFILS[0]).couleur);
    ds.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(plat),
        width: 6,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: coul.withAlpha(0.95),
          outlineColor: Cesium.Color.fromCssColorString('#05080d'),
          outlineWidth: 2,
        }),
        clampToGround: true,
      },
    });
    redessiner();
    rendreListe();
    surMessage?.(`🛣 Trajet enregistré — ${formaterTrajet(trajet.distance, trajet.duree)}.`);
    governorRequestRender('wt-trajets');
  }

  // ——— clic carte : ajoute une étape ———
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((clic) => {
    if (!window.__wtTrajetArme) return;
    let cart = null;
    try {
      if (viewer.scene.pickPositionSupported) cart = viewer.scene.pickPosition(clic.position);
    } catch { /* repli */ }
    if (!cart) cart = viewer.camera.pickEllipsoid(clic.position, viewer.scene.globe.ellipsoid);
    if (!cart) return;
    const g = Cesium.Cartographic.fromCartesian(cart);
    brouillon.push({ lon: Cesium.Math.toDegrees(g.longitude), lat: Cesium.Math.toDegrees(g.latitude) });
    const d = longueurTrace(brouillon);
    infoEl.textContent = `${brouillon.length} étape(s) · ${formaterTrajet(d, 0)} — « TERMINER LE TRAJET » pour calculer l'itinéraire réel.`;
    redessiner();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  el.querySelector('.tracer').addEventListener('click', () => armer(true));
  el.querySelector('.fin').addEventListener('click', terminer);
  el.querySelector('.vider').addEventListener('click', () => {
    trajets = [];
    ecrire(trajets);
    redessiner();
    rendreListe();
  });
  selectProfil.addEventListener('change', () => { profil = selectProfil.value; });

  rendreListe();
  redessiner();

  return {
    element: el,
    armer,
    terminer,
    liste: () => trajets.slice(),
    effacer: () => { trajets = []; brouillon = []; ecrire(trajets); redessiner(); rendreListe(); },
    distance: (points) => longueurTrace(points),
  };
}
