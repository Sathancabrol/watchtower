/**
 * WATCHTOWER — options d'affichage façon Google Maps, en open source gratuit.
 *
 * Des calques (overlays) activables par bouton, superposés au fond de carte :
 *
 *  🌧 Pluie (radar)    — RainViewer, radar mondial rafraîchi ~5 min, sans clé
 *  🛰 Nuages (IR)      — RainViewer, satellite infrarouge mondial, sans clé
 *  🏔 Relief (ombrage) — Esri World Hillshade, sans clé
 *  🏷 Noms de lieux    — Esri Boundaries & Places (frontières + toponymes)
 *  📐 Cadastre (FR)    — IGN Géoplateforme, Parcellaire Express, sans clé
 *
 * Chaque calque est une ImageryLayer Cesium ajoutée AU-DESSUS du fond actif.
 * NB : visibles sur les fonds 2D (Esri/OSM/IGN…) — le mode Google 3D
 * photoréaliste masque le globe, donc les calques ne s'y affichent pas.
 * Le radar pluie se rafraîchit tout seul (nouvelle frame toutes les 5 min).
 */

import * as Cesium from 'cesium';

const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';
const RADAR_REFRESH_MS = 5 * 60_000;

/** Registre des calques proposés. */
export const DISPLAY_OVERLAYS = Object.freeze([
  Object.freeze({ id: 'pluie', label: '🌧 Pluie (radar)', type: 'rv-radar', alpha: 0.72 }),
  Object.freeze({ id: 'nuages', label: '🛰 Nuages (satellite IR)', type: 'rv-ir', alpha: 0.5 }),
  Object.freeze({ id: 'relief', label: '🏔 Relief (ombrage)', type: 'esri-hillshade', alpha: 0.42 }),
  Object.freeze({ id: 'labels', label: '🏷 Noms de lieux', type: 'esri-labels', alpha: 1.0 }),
  Object.freeze({ id: 'cadastre', label: '📐 Cadastre (France)', type: 'ign-cadastre', alpha: 0.85 }),
  Object.freeze({ id: 'rail', label: '🚆 Rails & infrastructures ferroviaires', type: 'orm', alpha: 0.85 }),
  Object.freeze({ id: 'mer', label: '⚓ Balisage marin (OpenSeaMap)', type: 'seamap', alpha: 0.9 }),
  Object.freeze({ id: 'jour', label: '🛰 Photo satellite du JOUR (NASA)', type: 'gibs', alpha: 0.85 }),
]);

/** Dernier index RainViewer (timestamps des frames radar/satellite). */
async function rainviewerPaths() {
  const data = await (await fetch(RAINVIEWER_INDEX)).json();
  const radar = data?.radar?.past?.at(-1)?.path || null;
  const ir = data?.satellite?.infrared?.at(-1)?.path || null;
  return { host: data?.host || 'https://tilecache.rainviewer.com', radar, ir };
}

/** Construit le provider Cesium d'un calque. */
async function buildProvider(type) {
  if (type === 'rv-radar' || type === 'rv-ir') {
    const { host, radar, ir } = await rainviewerPaths();
    const path = type === 'rv-radar' ? radar : ir;
    if (!path) throw new Error('RainViewer indisponible');
    // radar: schéma de couleurs 2 (universel), smooth=1, neige=1 ;
    // satellite IR: schéma 0, options 0_0. IMPORTANT : les tuiles satellite
    // RainViewer s'arrêtent au niveau 6 (au-delà = 404, calque invisible).
    const suffix = type === 'rv-radar' ? '2/1_1' : '0/0_0';
    return new Cesium.UrlTemplateImageryProvider({
      url: `${host}${path}/256/{z}/{x}/{y}/${suffix}.png`,
      maximumLevel: type === 'rv-radar' ? 12 : 6,
      credit: 'Météo © RainViewer',
    });
  }
  if (type === 'orm') {
    return new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maximumLevel: 19,
      credit: '© OpenRailwayMap (CC-BY-SA) · données OSM',
    });
  }
  if (type === 'seamap') {
    return new Cesium.UrlTemplateImageryProvider({
      url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      maximumLevel: 18,
      credit: '© OpenSeaMap · données OSM',
    });
  }
  if (type === 'gibs') {
    // image satellite MODIS de la veille (NASA GIBS, mondial, sans clé)
    const d = new Date(Date.now() - 86400000);
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return new Cesium.UrlTemplateImageryProvider({
      url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      maximumLevel: 9,
      credit: 'NASA GIBS · MODIS Terra (image de la veille)',
    });
  }
  if (type === 'esri-hillshade') {
    return Cesium.ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer',
      { credit: 'Relief: Esri World Hillshade', enablePickFeatures: false },
    );
  }
  if (type === 'esri-labels') {
    return Cesium.ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
      { credit: 'Toponymes: Esri', enablePickFeatures: false },
    );
  }
  if (type === 'ign-cadastre') {
    return new Cesium.WebMapTileServiceImageryProvider({
      url: 'https://data.geopf.fr/wmts',
      layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
      style: 'normal',
      format: 'image/png',
      tileMatrixSetID: 'PM',
      maximumLevel: 19,
      credit: 'Cadastre: IGN — Géoplateforme · Licence Ouverte',
    });
  }
  throw new Error(`Calque inconnu: ${type}`);
}

/**
 * Initialise la section AFFICHAGE dans un conteneur du panneau Watchtower.
 * @param {object} viewer - Cesium viewer
 * @param {HTMLElement} container - conteneur des boutons
 */
export function initDisplayOptions(viewer, container) {
  /** id → {layer, def} des calques actifs */
  const actifs = new Map();
  let radarTimer = null;

  const boutons = new Map();
  container.innerHTML = `
    <div class="wt-note" style="margin:0 0 6px">Calques superposés au fond de carte
    (fonds 2D — pas visibles sur Google 3D).</div>
    <div class="wt-calques"></div>
  `;
  const zone = container.querySelector('.wt-calques');

  for (const def of DISPLAY_OVERLAYS) {
    const btn = document.createElement('button');
    btn.className = 'wt-btn wt-calque';
    btn.textContent = def.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => toggle(def, btn));
    zone.appendChild(btn);
    boutons.set(def.id, btn);
  }

  async function toggle(def, btn) {
    if (actifs.has(def.id)) {
      // désactivation
      const { layer } = actifs.get(def.id);
      viewer.imageryLayers.remove(layer, true);
      actifs.delete(def.id);
      btn.classList.remove('actif');
      btn.setAttribute('aria-pressed', 'false');
      syncRadarTimer();
      return;
    }
    btn.disabled = true;
    btn.textContent = `${def.label} …`;
    try {
      const provider = await buildProvider(def.type);
      const layer = viewer.imageryLayers.addImageryProvider(provider);
      layer.alpha = def.alpha;
      actifs.set(def.id, { layer, def });
      btn.classList.add('actif');
      btn.setAttribute('aria-pressed', 'true');
      syncRadarTimer();
    } catch (err) {
      window.alert(`Calque indisponible (${def.label}) : ${err?.message || err}`);
    } finally {
      btn.disabled = false;
      btn.textContent = def.label;
    }
  }

  /** Le radar/IR RainViewer vieillit vite → remplacement de frame ~5 min. */
  function syncRadarTimer() {
    const besoin = actifs.has('pluie') || actifs.has('nuages');
    if (besoin && !radarTimer) {
      radarTimer = window.setInterval(rafraichirMeteo, RADAR_REFRESH_MS);
    } else if (!besoin && radarTimer) {
      window.clearInterval(radarTimer);
      radarTimer = null;
    }
  }

  async function rafraichirMeteo() {
    for (const id of ['pluie', 'nuages']) {
      const actif = actifs.get(id);
      if (!actif) continue;
      try {
        const provider = await buildProvider(actif.def.type);
        const nouveau = viewer.imageryLayers.addImageryProvider(provider);
        nouveau.alpha = actif.def.alpha;
        viewer.imageryLayers.remove(actif.layer, true);
        actifs.set(id, { layer: nouveau, def: actif.def });
      } catch { /* frame suivante au prochain tick */ }
    }
  }

  return {
    /** ids des calques actuellement actifs (pour tests/debug). */
    actifs: () => [...actifs.keys()],
    /** Bascule un calque par id ('pluie', 'nuages', 'relief', 'labels', 'cadastre'). */
    basculer: (id) => {
      const def = DISPLAY_OVERLAYS.find((d) => d.id === id);
      const btn = boutons.get(id);
      if (def && btn) { toggle(def, btn); return true; }
      return false;
    },
  };
}
