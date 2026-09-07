/**
 * WATCHTOWER — BÂTI 3D RAPIDE (cache mémoire + géométrie par lots).
 *
 * Pourquoi ce module : le chargement des bâtiments 3D était « très long ».
 * Le coupable n'est pas le réseau seul, c'est la CONSTRUCTION : une entité
 * par bâtiment (des centaines d'objets Cesium à suivre), un
 * `globe.getHeight()` par bâtiment, et tout calculé d'un bloc sur le thread
 * principal — la fenêtre se figeait.
 *
 * Ici :
 *  — UNE primitive Cesium pour TOUS les corps + UNE pour les toits
 *    (2 draw-calls pour 1 000 bâtiments, au lieu de 1 000 objets) ;
 *  — géométrie créée en tâche de fond (`asynchronous: true`) et par TRANCHES
 *    de 150, avec `requestAnimationFrame` entre deux : l'interface reste
 *    fluide et une barre de progression avance ;
 *  — altitude du sol échantillonnée sur une grille 6×6, pas par bâtiment ;
 *  — HAUTEUR estimée (OSM → étages → type → emprise, voir `batiMath.js`) ;
 *  — CACHE MÉMOIRE : une zone déjà construite est ré-affichée instantanément
 *    (les primitives restent en mémoire, on les retire/remet de la scène).
 *    Revenir sur ses pas ne recalcule rien, c'est là que le gain se voit.
 *
 * Formes « jeu » : chaque bâtiment = 2 couches empilées (corps coloré + dalle
 * de toit plus sombre), aplats saturés, arêtes franches — le rendu GTA
 * San Andreas demandé, sans texture ni modèle à télécharger.
 */

import * as Cesium from 'cesium';
import {
  aireEmprise,
  altitudesParGrille,
  categorieParId,
  categoriserBati,
  centreEmprise,
  cleZone,
  estimerHauteur,
  lotir,
  simplifierAnneau,
} from './batiMath.js';
import { spriteAR } from './arIcons.js';

/** Glyphe d'icône par catégorie de bâtiment (badges posés sur les toits). */
const GLYPHE_CAT = {
  sante: 'croix-suisse',
  education: 'livre',
  services: 'mairie',
  culte: 'bouclier',
  industrie: 'sac',
  commerce: 'sac',
  logement: 'coeur',
};

/** Rend la main au navigateur (garde l'interface réactive pendant le calcul). */
function pause() {
  return new Promise((resoudre) => {
    let fait = false;
    const fin = () => { if (!fait) { fait = true; resoudre(); } };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => fin());
    else fin();
    if (typeof window !== 'undefined' && window.setTimeout) window.setTimeout(fin, 150);
  });
}

/** Nombre maximum d'emprises demandées à Overpass selon le rayon. */
export function maxEmprises(rayon) {
  const r = Number(rayon) || 700;
  if (r <= 400) return 600;
  if (r <= 700) return 900;
  return 1400;
}

/**
 * Transforme les emprises OSM en lots prêts à extruder (aucun objet Cesium :
 * réutilisable par le cache et testable).
 *
 * @param {Array} ways Éléments Overpass (`out geom tags`).
 * @param {(lon:number,lat:number)=>number} [lireSol]
 * @returns {Array<object>} Lots.
 */
export function preparerLots(ways, lireSol) {
  const lots = [];
  const centres = [];
  for (const w of ways || []) {
    if (!Array.isArray(w.geometry) || w.geometry.length < 3) continue;
    const anneau = simplifierAnneau(w.geometry, 12);
    if (anneau.length < 3) continue;
    const centre = centreEmprise(anneau);
    if (!centre) continue;
    const tags = w.tags || {};
    const aire = aireEmprise(anneau);
    const { h, source, niveaux } = estimerHauteur({ tags, aire, graine: w.id || 0 });
    const cat = categoriserBati(tags);
    const lot = {
      id: w.id,
      anneau,
      lon: centre.lon,
      lat: centre.lat,
      aire,
      h,
      niveaux,
      source,
      cat: cat.id,
      couleur: cat.couleur,
      toit: cat.toit,
      nom: tags.name || '',
      tags,
      sol: 0,
    };
    lots.push(lot);
    centres.push(centre);
  }
  if (typeof lireSol === 'function' && lots.length) {
    let ouest = 180;
    let sud = 90;
    let est = -180;
    let nord = -90;
    for (const c of centres) {
      ouest = Math.min(ouest, c.lon);
      est = Math.max(est, c.lon);
      sud = Math.min(sud, c.lat);
      nord = Math.max(nord, c.lat);
    }
    const altitudes = altitudesParGrille(centres, { ouest, sud, est, nord }, { n: 6, lire: lireSol });
    lots.forEach((lot, i) => { lot.sol = altitudes[i] || 0; });
  }
  return lots;
}

/** Aplat lon/lat → tableau Cesium. */
function positions(anneau) {
  const out = [];
  for (const p of anneau) out.push(p.lon, p.lat);
  return Cesium.Cartesian3.fromDegreesArray(out);
}

/**
 * Construit les primitives d'un lot de bâtiments (corps + dalles de toit).
 * @param {Array<object>} lots
 * @param {{surProgres?:Function, opacite?:number, epaisseurToit?:number}} [options]
 * @returns {Promise<{corps:object|null, toits:object|null}>}
 */
export async function construirePrimitives(lots, options = {}) {
  const {
    surProgres,
    opacite = 0.94,
    epaisseurToit = 0.9,
    tailleLot = 150,
  } = options || {};
  const corps = [];
  const toits = [];
  const tranches = lotir(lots, tailleLot);
  for (let t = 0; t < tranches.length; t += 1) {
    for (const lot of tranches[t]) {
      const hier = new Cesium.PolygonHierarchy(positions(lot.anneau));
      const couleur = Cesium.Color.fromCssColorString(lot.couleur || '#5aa9e6');
      corps.push(new Cesium.GeometryInstance({
        id: `wt-bati-${lot.id}`,
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: hier,
          height: lot.sol,
          extrudedHeight: lot.sol + (lot.h || 8),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(couleur.withAlpha(opacite)) },
      }));
      // 2ᵉ couche : la dalle de toit, plus sombre → relief lisible de loin
      toits.push(new Cesium.GeometryInstance({
        id: `wt-toit-${lot.id}`,
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions(lot.anneau)),
          height: lot.sol + (lot.h || 8),
          extrudedHeight: lot.sol + (lot.h || 8) + epaisseurToit,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(lot.toit || '#1d5b8c').withAlpha(Math.min(1, opacite + 0.06)),
          ),
        },
      }));
    }
    surProgres?.((t + 1) / Math.max(1, tranches.length), corps.length);
    if (t < tranches.length - 1) await pause();
  }
  const primitive = (instances) => (instances.length ? new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
    // création de la géométrie sur un worker : le thread principal respire
    asynchronous: true,
    releaseGeometryInstances: false,
  }) : null);
  return { corps: primitive(corps), toits: primitive(toits) };
}

/**
 * Pipeline complet : récupère (ou sort du cache) puis affiche le bâti 3D.
 *
 * @param {object} viewer Viewer Cesium.
 * @param {{rayon?:number, surProgres?:Function, surMessage?:Function, tailleCache?:number}} [options]
 */
export function creerBatiRapide(viewer, options = {}) {
  const tailleCache = Math.max(1, Number(options.tailleCache) || 4);
  /** @type {Map<string, {cle:string, lots:Array, primitives:{corps,toits}|null}>} */
  const cache = new Map();
  const ordre = [];
  const dsIcones = new Cesium.CustomDataSource('wt-bati-rapide-icones');
  viewer.dataSources.add(dsIcones);

  let cleCourante = null;
  let enCours = null;

  const dire = (m) => { try { options.surMessage?.(m); } catch { /* ok */ } };
  const ajouter = (p) => { if (p) viewer.scene.primitives.add(p); };
  const retirer = (p) => { try { if (p) viewer.scene.primitives.remove(p); } catch { /* ok */ } };
  const detruire = (p) => {
    try { retirer(p); p.destroy?.(); } catch { /* déjà détruite */ }
  };

  function mémoriser(entree) {
    cache.set(entree.cle, entree);
    const i = ordre.indexOf(entree.cle);
    if (i >= 0) ordre.splice(i, 1);
    ordre.push(entree.cle);
    while (ordre.length > tailleCache) {
      const vieille = ordre.shift();
      const e = cache.get(vieille);
      if (e && vieille !== cleCourante) {
        if (e.primitives) { detruire(e.primitives.corps); detruire(e.primitives.toits); }
        cache.delete(vieille);
      } else if (e) ordre.push(vieille); // zone affichée : on la garde
    }
  }

  async function interroger(lat, lon, rayon, filtre, signal) {
    const requete = `[out:json][timeout:25];way(around:${Math.round(rayon)},${lat.toFixed(5)},${lon.toFixed(5)})[building]${filtre ? `[${filtre}]` : ''};out geom tags ${maxEmprises(rayon)};`;
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(requete)}`,
      signal,
    });
    const d = await r.json();
    if (d?.remark && /rate|too many/i.test(String(d.remark))) throw new Error('saturee');
    return d?.elements || [];
  }

  /** Extrait les lots d'une zone (cache d'abord). */
  async function obtenirLots({ lat, lon, rayon = 700, filtre = null, surProgres }) {
    const cle = cleZone(lat, lon, rayon, filtre ? `f${filtre.length}:${filtre}` : '');
    const connu = cache.get(cle);
    if (connu) return connu;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    dire(`🔍 Emprises cadastrales (${rayon} m)…`);
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), 30000);
    let ways = [];
    try {
      ways = await interroger(lat, lon, rayon, filtre, controle.signal);
    } finally {
      clearTimeout(minuteur);
    }
    const lireSol = (lo, la) => viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lo, la)) || 0;
    const lots = preparerLots(ways, lireSol);
    const entree = { cle, lots, primitives: null };
    mémoriser(entree);
    const dt = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
    dire(lots.length
      ? `📦 ${lots.length} emprises récupérées en ${dt} ms — construction 3D…`
      : '⚠ Aucune emprise de bâtiment ici (zoome sur une zone urbaine).');
    surProgres?.(0.15, 0);
    return entree;
  }

  /** Construit (si besoin) et affiche les primitives d'une entrée de cache. */
  async function afficher(entree, { surProgres } = {}) {
    if (!entree?.lots?.length) return { n: 0, depuisCache: true };
    if (cleCourante && cleCourante !== entree.cle) {
      const precedente = cache.get(cleCourante);
      if (precedente?.primitives) {
        retirer(precedente.primitives.corps);
        retirer(precedente.primitives.toits);
      }
    }
    dsIcones.entities.removeAll();
    if (!entree.primitives) {
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      entree.primitives = await construirePrimitives(entree.lots, {
        surProgres: (f, n) => surProgres?.(0.15 + f * 0.85, n),
      });
      entree.dt = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
    }
    ajouter(entree.primitives.corps);
    ajouter(entree.primitives.toits);
    cleCourante = entree.cle;
    poserIcones(entree.lots);
    viewer.scene.requestRender?.();
    return { n: entree.lots.length, depuisCache: Boolean(entree.dt === undefined), ms: entree.dt };
  }

  /** Badges cliquables au-dessus des bâtiments NOMMÉS (catégorie + nom). */
  function poserIcones(lots) {
    let n = 0;
    for (const lot of lots) {
      if (!lot.nom || n >= 40) continue;
      const cat = categorieParId(lot.cat);
      const image = spriteAR({
        nom: lot.nom.slice(0, 18),
        couleur: lot.couleur,
        glyphe: GLYPHE_CAT[lot.cat] || 'bouclier',
      }, { taille: 128 });
      if (!image) break; // hors navigateur : pas de sprite, on s'arrête
      dsIcones.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lot.lon, lot.lat, lot.sol + lot.h + 9),
        properties: {
          wtBatiIcone: true,
          wtNom: lot.nom,
          wtCat: cat.nom,
          wtLon: lot.lon,
          wtLat: lot.lat,
        },
        billboard: {
          image,
          width: 54,
          height: 54,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(300, 1, 9000, 0.35),
        },
      });
      n += 1;
    }
  }

  /**
   * Charge (et affiche) le bâti de la zone.
   * @param {{lat?:number, lon?:number, rayon?:number, filtre?:string|null, surProgres?:Function}} p
   */
  async function charger(p = {}) {
    if (enCours) return enCours;
    const c = viewer.camera.positionCartographic;
    const lat = Number.isFinite(p.lat) ? p.lat : Cesium.Math.toDegrees(c.latitude);
    const lon = Number.isFinite(p.lon) ? p.lon : Cesium.Math.toDegrees(c.longitude);
    const rayon = Number(p.rayon) || 700;
    enCours = (async () => {
      try {
        const entree = await obtenirLots({ lat, lon, rayon, filtre: p.filtre || null, surProgres: p.surProgres });
        const r = await afficher(entree, { surProgres: p.surProgres });
        const sources = {};
        for (const lot of entree.lots) sources[lot.source] = (sources[lot.source] || 0) + 1;
        const message = r.n
          ? `✅ ${r.n} bâtiments (2 draw-calls${r.ms ? `, ${r.ms} ms` : ', cache'}) · ${Object.entries(sources).map(([k, v]) => `${k} ${v}`).join(' · ')}`
          : '⚠ Aucun bâtiment à modéliser.';
        dire(message);
        return { ...r, lots: entree.lots };
      } catch (e) {
        const msg = /abort/i.test(String(e?.name || e)) ? '⚠ Source OSM trop lente — réessaie.'
          : '⚠ Source OSM saturée — réessaie dans quelques secondes.';
        dire(msg);
        return { n: 0, erreur: String(e?.message || e) };
      } finally {
        enCours = null;
      }
    })();
    return enCours;
  }

  /** Retire le bâti de la scène (le cache est conservé). */
  function effacer() {
    if (cleCourante) {
      const e = cache.get(cleCourante);
      if (e?.primitives) {
        retirer(e.primitives.corps);
        retirer(e.primitives.toits);
      }
      cleCourante = null;
    }
    dsIcones.entities.removeAll();
    viewer.scene.requestRender?.();
  }

  /** Lots de la zone affichée (servent à l'appariement AR : POI → bâtiment). */
  function lots() {
    const e = cleCourante ? cache.get(cleCourante) : null;
    return e?.lots || [];
  }

  /**
   * Extrait un sous-ensemble de lots (vue AR : « les bâtiments SANTÉ »).
   * @param {Array<object>} sousLots
   * @param {{couleur?:string, toit?:string, surhausse?:number}} [options]
   * @returns {{corps:object|null, toits:object|null}}
   */
  function extruder(sousLots, options = {}) {
    const surhausse = Number(options.surhausse) || 0;
    const lots = (sousLots || []).map((l) => ({
      ...l,
      couleur: options.couleur || l.couleur,
      toit: options.toit || l.toit,
      h: (l.h || 8) + surhausse,
    }));
    const corps = [];
    const toits = [];
    for (const lot of lots) {
      const hier = new Cesium.PolygonHierarchy(positions(lot.anneau));
      corps.push(new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: hier,
          height: lot.sol,
          extrudedHeight: lot.sol + lot.h,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(lot.couleur || '#ff2d55').withAlpha(0.95),
          ),
        },
      }));
      toits.push(new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions(lot.anneau)),
          height: lot.sol + lot.h,
          extrudedHeight: lot.sol + lot.h + 1.1,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.fromCssColorString(lot.toit || '#8d0f27').withAlpha(1),
          ),
        },
      }));
    }
    const faire = (instances) => (instances.length ? new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({ flat: true, translucent: true }),
      asynchronous: true,
      releaseGeometryInstances: false,
    }) : null);
    return { corps: faire(corps), toits: faire(toits) };
  }

  function statistiques() {
    const e = cleCourante ? cache.get(cleCourante) : null;
    return {
      zones: cache.size,
      courante: cleCourante,
      lots: e?.lots?.length || 0,
      construit: Boolean(e?.primitives),
      ms: e?.dt ?? null,
    };
  }

  function viderCache() {
    effacer();
    for (const e of cache.values()) {
      if (e.primitives) { detruire(e.primitives.corps); detruire(e.primitives.toits); }
    }
    cache.clear();
    ordre.length = 0;
  }

  return {
    charger,
    effacer,
    extruder,
    lots,
    statistiques,
    viderCache,
    ajouter,
    retirer,
    sourceIcones: dsIcones,
    solDe: (lon, lat) => viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat)) || 0,
  };
}
