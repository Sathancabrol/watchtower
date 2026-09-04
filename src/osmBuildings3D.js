/**
 * WATCHTOWER — BÂTI 3D gratuit, OPTIMISÉ (v14).
 *
 * Version open source / peu coûteuse / performante des bâtiments 3D :
 * emprises OpenStreetMap extrudées (hauteur = tag OSM `height`, sinon
 * étages × 3,2 m, sinon 8 m). Bâtiments publics (mairie, école…) en orange.
 *
 * Perf v14 (le chargement « trop long » d'avant) :
 *  — TOUS les bâtiments rendus en UNE SEULE primitive Cesium (geometries en
 *    lot + couleur par instance) au lieu d'une entité par bâtiment :
 *    ~50× moins de appels de rendu, lisible même à 900 bâtiments ;
 *  — géométries simplifiées (≤16 sommets par emprise) ;
 *  — rayon au choix : 400 m (rapide) / 700 m / 1200 m (complet) ;
 *  — compteur + messages d'état.
 *
 * Les NOMS des repères (mairie, école…) flottent au-dessus des toits et sont
 * CLIQUABLES → ouvrent la FICHE LIEU du bâtiment + surbrillance 3D.
 */

import * as Cesium from 'cesium';

const CSS = `
#wt-bati { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-bati .b-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit;
  font-size: 9.5px; font-weight: 700; letter-spacing: 1px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-bati .b-btn:hover { background: rgba(0,212,255,0.2); }
#wt-bati .b-btn.eff { border-color: rgba(240,90,90,0.5); color: #f08a8a; background: rgba(240,90,90,0.07); }
#wt-bati .statut { color: rgba(232,234,237,0.55); line-height: 1.6; font-size: 9px; }
#wt-bati .b-rang { display: flex; gap: 6px; align-items: center; }
#wt-bati select { padding: 7px 8px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 9.5px; outline: none; }
`;

const PUBLICS = new Set(['townhall', 'public', 'civic', 'government', 'school', 'hospital', 'church', 'cathedral', 'university', 'fire_station', 'train_station', 'library', 'kindergarten', 'college', 'police', 'fire_hydrant']);
const MAX_SOMMETS = 16;

/** Décime un anneau à ≤ maxPts sommets (échantillonnage uniforme). */
function simplifier(anneau, maxPts = MAX_SOMMETS) {
  // l'anneau OSM est fermé (premier == dernier) → on retire la boucle
  let pts = anneau;
  if (pts.length > 1 && Math.abs(pts[0].lon - pts[pts.length - 1].lon) < 1e-9 && Math.abs(pts[0].lat - pts[pts.length - 1].lat) < 1e-9) {
    pts = pts.slice(0, -1);
  }
  if (pts.length <= maxPts) return pts;
  const out = [];
  const n = pts.length;
  for (let i = 0; i < maxPts; i += 1) out.push(pts[Math.round((i * n) / maxPts) % n]);
  return out;
}

export function initOsmBuildings3D(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let primitive = null; // TOUTE la ville en un seul objet de rendu
  const dsNom = new Cesium.CustomDataSource('wt-bati3d-noms');
  viewer.dataSources.add(dsNom);
  let entiteSurlignee = null;

  /** Raccordé par main.js : (lon, lat, nom) → ouvre la FICHE LIEU. */
  let surFiche = null;
  const setSurFiche = (fn) => { surFiche = fn; };

  const el = document.createElement('div');
  el.id = 'wt-bati';
  el.innerHTML = `
    <button class="b-btn charger" type="button">🏙 CHARGER LES BÂTIMENTS DE LA VUE</button>
    <div class="b-rang">
      <select class="f-rayon">
        <option value="400">🚀 400 m — rapide</option>
        <option value="700" selected>🏙 700 m — standard</option>
        <option value="1200">🏰 1200 m — complet (lent)</option>
      </select>
      <button class="b-btn eff" type="button">🗑 EFFACER</button>
    </div>
    <div class="statut">Volumes OSM (gratuit, mondial, 1 seul draw-call — rapide).
    Hauteur : OSM, sinon étages × 3,2 m, sinon 8 m · publics en orange.
    Les noms 🏛 au-dessus des toits sont CLIQUABLES → fiche du bâtiment.</div>`;
  const statut = el.querySelector('.statut');

  function effacer() {
    if (primitive) { viewer.scene.primitives.remove(primitive); primitive = null; }
    dsNom.entities.removeAll();
    entiteSurlignee = null;
  }

  function surbriller(cx, cy, plat, h) {
    if (entiteSurlignee) { viewer.entities.remove(entiteSurlignee); entiteSurlignee = null; }
    const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cx, cy)) || 0;
    entiteSurlignee = viewer.entities.add({
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(plat),
        material: Cesium.Color.YELLOW.withAlpha(0.25),
        height: sol, extrudedHeight: sol + h + 2,
        outline: true, outlineColor: Cesium.Color.YELLOW,
      },
    });
    window.setTimeout(() => { if (entiteSurlignee) { viewer.entities.remove(entiteSurlignee); entiteSurlignee = null; } }, 4000);
  }

  async function charger() {
    const c = viewer.camera.positionCartographic;
    if (c.height > 30000) { statut.textContent = '⚠ Zoome davantage (moins de 30 km d\u2019altitude) puis relance.'; return; }
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const rayon = Number(el.querySelector('.f-rayon').value) || 700;
    const MAX = rayon <= 400 ? 400 : rayon <= 700 ? 700 : 1000;
    statut.textContent = `🔍 Récupération des emprises OSM (rayon ${rayon} m, max ${MAX} bâtiments)…`;
    effacer();
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(`[out:json][timeout:30];way(around:${rayon},${lat},${lon})[building];out geom tags ${MAX};`)}`,
      });
      const d = await r.json();
      if (d?.remark === 'Too many requests') { statut.textContent = '⚠ Source OSM saturée — réessaie dans 20 s.'; return; }
      const ways = (d?.elements || []).filter((e) => Array.isArray(e.geometry) && e.geometry.length > 2);
      const geos = [];
      let nNom = 0;
      const t0 = performance.now();
      for (const w of ways) {
        const anneau = simplifier(w.geometry);
        if (anneau.length < 3) continue;
        const plat = [];
        let cx = 0; let cy = 0;
        for (const g of anneau) { plat.push(g.lon, g.lat); cx += g.lon; cy += g.lat; }
        cx /= anneau.length; cy /= anneau.length;
        const tags = w.tags || {};
        const h = parseFloat(tags.height) || (parseFloat(tags['building:levels']) || 0) * 3.2 || 8;
        const publique = PUBLICS.has(tags.building) || tags.amenity || tags.tourism;
        // hauteurs ABSOLUES (sol mesuré) — le pattern fiable
        const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cx, cy)) || 0;
        const couleur = (publique ? Cesium.Color.fromCssColorString('#ff9d2e') : Cesium.Color.fromCssColorString('#7fd4ff'))
          .withAlpha(publique ? 0.92 : 0.75);
        geos.push({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(plat)),
            height: sol,
            extrudedHeight: sol + h,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(couleur) },
        });
        // nom du repère = étiquette flottante CLIQUABLE (fiche + surlignage)
        if (tags.name && nNom < 80) {
          dsNom.entities.add({
            position: Cesium.Cartesian3.fromDegrees(cx, cy, sol + h + 7),
            properties: { batiLon: cx, batiLat: cy, batiNom: tags.name, batiPlat: plat, batiH: h },
            label: {
              text: `${publique ? '🏛 ' : '🏢 '}${tags.name}`,
              font: '11px JetBrains Mono, monospace',
              fillColor: publique ? Cesium.Color.fromCssColorString('#ffb066') : Cesium.Color.WHITE,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#0a0a0f').withAlpha(0.72),
              disableDepthTestDistance: Infinity,
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 9000, 0),
            },
          });
          nNom += 1;
        }
      }
      if (geos.length) {
        primitive = new Cesium.Primitive({
          geometries: geos,
          appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
          releaseGeometryInstances: false,
          asynchronous: false,
        });
        viewer.scene.primitives.add(primitive);
      }
      const dt = Math.round(performance.now() - t0);
      statut.textContent = geos.length
        ? `✅ ${geos.length} bâtiments en 1 seul draw-call (${dt} ms de traitement) + ${nNom} repères cliquables (publics en orange). Déplace-toi puis recharge.`
        : 'Aucune emprise de bâtiment OSM ici — zoome sur une zone urbaine et relance.';
    } catch {
      statut.textContent = '⚠ Source OSM saturée — réessaie dans quelques secondes.';
    }
  }

  // clic sur une étiquette de nom → FICHE LIEU du bâtiment + surbrillance
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    if (window.__wtDessin) return;
    let picked = null;
    try { picked = viewer.scene.pick(click.position); } catch { return; }
    const entite = picked?.id;
    if (entite?.properties?.batiLon?.getValue) {
      const lon = entite.properties.batiLon.getValue();
      const lat = entite.properties.batiLat.getValue();
      const nom = entite.properties.batiNom.getValue();
      const plat = entite.properties.batiPlat?.getValue?.() || [];
      const h = Number(entite.properties.batiH?.getValue?.()) || 8;
      surbriller(lon, lat, plat, h);
      surFiche?.(lon, lat, nom);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  el.querySelector('.charger').addEventListener('click', charger);
  el.querySelector('.eff').addEventListener('click', () => {
    effacer();
    statut.textContent = 'Bâtiments effacés.';
  });

  return { element: el, charger, effacer, setSurFiche };
}
