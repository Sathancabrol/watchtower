/**
 * WATCHTOWER — COUCHE CADASTRE « LÉGÈRE ».
 *
 * Pour que la carte raconte l'environnement sans noyer l'écran : le contour
 * des parcelles cadastrales est tracé en trait fin, avec un remplissage
 * presque transparent. La source est l'API **apicarto** de l'IGN (données
 * ouvertes Etalab, sans clé).
 *
 * La couche est volontairement sobre :
 *   · elle ne se charge qu'en dessous de ~2 500 m d'altitude (au-delà, le
 *     cadastre n'est qu'une bouillie de traits) ;
 *   · l'emprise demandée est plafonnée (la source reste rapide pour tout le
 *     monde) ;
 *   · tout est mis en cache par tuile d'emprise : on ne redemande jamais deux
 *     fois le même quartier ;
 *   · en cas d'indisponibilité, la couche reste vide et silencieuse.
 */

import * as Cesium from 'cesium';
import { governorRequestRender } from './renderGovernor.js';
import { anneauxDe } from './localisation.js';

const CSS = `
#wt-cadastre { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-cadastre .c-btn {
  cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit; font-size: 9.5px;
  font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1);
  border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-cadastre .c-btn:hover { background: rgba(0,212,255,0.22); }
#wt-cadastre .c-btn.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); color: rgba(232,234,237,0.75); }
#wt-cadastre .c-ligne { display: flex; align-items: center; gap: 6px; font-size: 9px; color: rgba(232,234,237,0.6); }
#wt-cadastre .c-ligne input[type=range] { flex: 1; accent-color: #43d17a; }
#wt-cadastre .c-info { font-size: 9px; line-height: 1.6; color: rgba(232,234,237,0.55); }
`;

/** Altitude max d'affichage (m) : au-delà, le cadastre n'a plus de sens. */
export const ALTITUDE_MAX = 2_500;
/** Demi-côté max de l'emprise demandée (m) — protège la source. */
export const EMPRISE_MAX = 320;
/** Altitude max quand l'utilisateur FORCE l'affichage (vue satellite). */
export const ALTITUDE_FORCEE = 22_000;
/** Nombre max de tuiles d'emprise gardées en mémoire. */
const TAILLE_CACHE = 24;

/** Arrondit une emprise sur une grille : la clé de cache. */
export function cleTuile(lat, lon, pas = 0.002) {
  return `${Math.round(lat / pas)}:${Math.round(lon / pas)}`;
}

/** Construit l'URL de requête des parcelles dans un carré. */
export function urlParcelles(ouest, sud, est, nord) {
  const geom = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [ouest, sud], [est, sud], [est, nord], [ouest, nord], [ouest, sud],
    ]],
  });
  return `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${encodeURIComponent(geom)}`;
}

/** Aplatit une réponse GeoJSON en anneaux [ [ [lon,lat], … ], … ]. */
export function anneauxDeReponse(fc) {
  const out = [];
  for (const f of fc?.features || []) out.push(...anneauxDe(f?.geometry));
  return out;
}

/** Aire approchée (m²) d'un anneau lon/lat. */
export function aireAnneau(anneau) {
  if (!anneau || anneau.length < 3) return 0;
  const r = 6371008.8;
  let s = 0;
  for (let i = 0; i < anneau.length; i += 1) {
    const [x1, y1] = anneau[i];
    const [x2, y2] = anneau[(i + 1) % anneau.length];
    s += (x2 - x1) * (Math.PI / 180) * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180));
  }
  return Math.abs((s * r * r) / 2);
}

/** Classes de routes OpenStreetMap retenues (les plus utiles à l'écran). */
export const CLASSES_ROUTE = Object.freeze({
  motorway: { couleur: '#ff7a59', largeur: 4.2, nom: 'autoroute' },
  trunk: { couleur: '#ff9d5c', largeur: 3.6, nom: 'route nationale' },
  primary: { couleur: '#ffd166', largeur: 3.2, nom: 'départementale majeure' },
  secondary: { couleur: '#ffe9a8', largeur: 2.6, nom: 'départementale' },
  tertiary: { couleur: '#f6f3e7', largeur: 2.2, nom: 'voie secondaire' },
  residential: { couleur: '#dfe9f0', largeur: 1.8, nom: 'rue' },
  unclassified: { couleur: '#c8d3dc', largeur: 1.6, nom: 'voie' },
  living_street: { couleur: '#b8e0c2', largeur: 1.6, nom: 'zone de rencontre' },
  pedestrian: { couleur: '#9ee7d0', largeur: 1.8, nom: 'piétonne' },
  service: { couleur: '#b9c4cc', largeur: 1.2, nom: 'service' },
  track: { couleur: '#a58a6a', largeur: 1.4, nom: 'piste' },
  path: { couleur: '#8fb98f', largeur: 1.2, nom: 'chemin' },
  cycleway: { couleur: '#7ef0c0', largeur: 1.4, nom: 'piste cyclable' },
});

/** Couleur d'une classe de route (repli : gris clair). */
export function couleurRoute(classe = '') {
  return CLASSES_ROUTE[String(classe)]?.couleur || '#c9d4dd';
}

/** Épaisseur (px) d'une classe de route. */
export function largeurRoute(classe = '') {
  return CLASSES_ROUTE[String(classe)]?.largeur || 1.4;
}

/** Libellé français d'une classe de route. */
export function nomRoute(classe = '') {
  return CLASSES_ROUTE[String(classe)]?.nom || String(classe || 'voie');
}

/** Requête Overpass des routes d'une emprise (toutes classes utiles). */
export function urlRoutes(ouest, sud, est, nord, limite = 400) {
  const b = `${Number(sud).toFixed(6)},${Number(ouest).toFixed(6)},${Number(nord).toFixed(6)},${Number(est).toFixed(6)}`;
  const classes = Object.keys(CLASSES_ROUTE).join('|');
  return `[out:json][timeout:25];way(${b})[highway~"^(${classes})$"];out geom ${Math.max(20, Math.round(limite))};`;
}

/** Extrait les tracés de routes d'une réponse Overpass (`out geom`). */
export function routesDepuisReponse(json) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const out = [];
  for (const e of els) {
    const pts = Array.isArray(e.geometry) ? e.geometry : null;
    if (!pts || pts.length < 2) continue;
    const coords = pts
      .map((g) => [Number(g?.lon), Number(g?.lat)])
      .filter(([lo, la]) => Number.isFinite(lo) && Number.isFinite(la));
    if (coords.length < 2) continue;
    const t = e.tags || {};
    out.push({
      id: `way/${e.id}`,
      classe: String(t.highway || ''),
      nom: String(t.name || '').trim(),
      sens: String(t.oneway || '') === 'yes' ? 1 : 0,
      vitesse: Number.isFinite(Number(t.maxspeed)) ? Number(t.maxspeed) : null,
      coords,
    });
  }
  return out;
}

/** Résumé affichable d'un jeu de routes. */
export function resumerRoutes(liste = []) {
  const parClasse = new Map();
  let longueurM = 0;
  const R = 111_320;
  for (const r of liste) {
    parClasse.set(r.classe, (parClasse.get(r.classe) || 0) + 1);
    for (let i = 1; i < r.coords.length; i += 1) {
      const [x1, y1] = r.coords[i - 1]; const [x2, y2] = r.coords[i];
      longueurM += Math.hypot((x2 - x1) * R * 0.7, (y2 - y1) * R);
    }
  }
  return {
    routes: liste.length,
    longueur: Math.round(longueurM),
    classes: [...parClasse.entries()].sort((a, b) => b[1] - a[1]),
  };
}

/**
 * @param {object} viewer
 * @param {{surMessage?:Function}} [options]
 */
export function initCadastre(viewer, options = {}) {
  const { surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-cadastre');
  viewer.dataSources.add(ds);
  ds.show = false;

  const el = document.createElement('div');
  el.id = 'wt-cadastre';
  el.innerHTML = `
    <button class="c-btn" data-a="activer">🗺 AFFICHER LE CADASTRE</button>
    <div class="c-ligne"><span>opacité</span><input type="range" min="0" max="60" step="2" value="22"><span class="c-op">22 %</span></div>
    <label class="c-ligne"><input type="checkbox" class="c-remplir" checked> remplissage des parcelles</label>
    <label class="c-ligne"><input type="checkbox" class="c-forcer"> 👁 visible en vue satellite (au-delà de ${ALTITUDE_MAX.toLocaleString('fr-FR')} m)</label>
    <label class="c-ligne"><input type="checkbox" class="c-routes"> 🛣 voir les ROUTES (OpenStreetMap)</label>
    <label class="c-ligne"><input type="checkbox" class="c-noms-routes"> 🔤 noms des routes</label>
    <div class="c-info">—</div>
    <div class="c-info" style="opacity:.7">Source : API apicarto (IGN · Etalab), données ouvertes, sans clé.
    Le contour ne se charge qu'en dessous de ${ALTITUDE_MAX.toLocaleString('fr-FR')} m d'altitude.</div>`;
  const btn = el.querySelector('[data-a="activer"]');
  const opacite = el.querySelector('input[type=range]');
  const remplir = el.querySelector('.c-remplir');
  const forcer = el.querySelector('.c-forcer');
  const voirRoutes = el.querySelector('.c-routes');
  const nomsRoutes = el.querySelector('.c-noms-routes');
  const info = el.querySelector('.c-info');

  let actif = false;
  let alpha = 0.22;
  let enCours = false;
  let timer = null;
  const cache = new Map();
  let stats = { parcelles: 0, aire: 0, tuiles: 0 };

  function bboxVue(demiCote) {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const dLat = demiCote / 111_320;
    const dLon = demiCote / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return { ouest: lon - dLon, sud: lat - dLat, est: lon + dLon, nord: lat + dLat, lat, lon };
  }

  function dessiner(anneaux, cle) {
    void cle;
    if (!anneaux.length) return;
    for (const anneau of anneaux) {
      const plat = [];
      for (const [lo, la] of anneau) plat.push(lo, la);
      if (plat.length < 6) continue;
      const positions = Cesium.Cartesian3.fromDegreesArray(plat);
      if (remplir.checked) {
        ds.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(positions),
            material: Cesium.Color.fromCssColorString('#7dd3c8').withAlpha(alpha * 0.45),
            outline: false,
            height: 0.3,
          },
          properties: { wtCadastre: true },
        });
      }
      ds.entities.add({
        polyline: {
          positions,
          width: 1.2,
          material: Cesium.Color.fromCssColorString('#7dd3c8').withAlpha(Math.min(1, alpha * 3)),
          clampToGround: true,
        },
        properties: { wtCadastre: true },
      });
    }
    governorRequestRender('wt-cadastre');
  }

  /** Altitude maximale d'affichage : relevée si « vue satellite » est coché. */
  function plafond() {
    return forcer?.checked ? ALTITUDE_FORCEE : ALTITUDE_MAX;
  }

  async function maj(force = false) {
    if (!actif) return;
    const c = viewer.camera.positionCartographic;
    if (c.height > plafond()) {
      if (ds.entities.values.length) ds.entities.removeAll();
      info.textContent = `Au-dessus de ${plafond().toLocaleString('fr-FR')} m — cadastre masqué (coche « vue satellite » pour forcer).`;
      return;
    }
    if (enCours) return;
    const boite = bboxVue(EMPRISE_MAX);
    const cle = cleTuile(boite.lat, boite.lon);
    if (!force && cache.has(cle)) return;
    enCours = true;
    try {
      const r = await fetch(urlParcelles(
        boite.ouest.toFixed(6), boite.sud.toFixed(6), boite.est.toFixed(6), boite.nord.toFixed(6),
      ));
      if (!r.ok) throw new Error(r.status);
      const fc = await r.json();
      const anneaux = anneauxDeReponse(fc);
      cache.set(cle, anneaux);
      if (cache.size > TAILLE_CACHE) cache.delete(cache.keys().next().value);
      // on ne garde à l'écran que les environs immédiats
      ds.entities.removeAll();
      for (const [k, v] of cache) if (k === cle) dessiner(v, k);
      const aire = anneaux.reduce((n, a) => n + aireAnneau(a), 0);
      stats = { parcelles: anneaux.length, aire, tuiles: cache.size };
      info.textContent = anneaux.length
        ? `${anneaux.length} parcelles · ${Math.round(aire).toLocaleString('fr-FR')} m² · ${cache.size} secteur(s) en mémoire`
        : 'Aucune parcelle cadastrale renvoyée ici (zone non cadastrée ou source indisponible).';
    } catch {
      info.textContent = '⚠ Source cadastrale indisponible — réessaie plus bas, ou plus tard.';
    } finally {
      enCours = false;
    }
  }

  // ── 🛣 ROUTES : tracé OpenStreetMap, visible en vue satellite ───────────
  const cacheRoutes = new Map();

  function dessinerRoutes(liste) {
    for (const r of liste) {
      const positions = Cesium.Cartesian3.fromDegreesArray(r.coords.flat());
      ds.entities.add({
        polyline: {
          positions,
          width: largeurRoute(r.classe),
          material: Cesium.Color.fromCssColorString(couleurRoute(r.classe)).withAlpha(Math.min(1, alpha * 2.6)),
          clampToGround: true,
        },
        properties: { wtRoute: r.classe, wtNomRoute: r.nom },
      });
      if (nomsRoutes?.checked && r.nom) {
        const milieu = r.coords[Math.floor(r.coords.length / 2)];
        ds.entities.add({
          position: Cesium.Cartesian3.fromDegrees(milieu[0], milieu[1], 6),
          label: {
            text: r.nom,
            font: '600 10px "JetBrains Mono", monospace',
            fillColor: Cesium.Color.fromCssColorString(couleurRoute(r.classe)),
            outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4200),
          },
        });
      }
    }
    governorRequestRender('wt-cadastre');
  }

  async function majRoutes(force = false) {
    if (!actif || !voirRoutes?.checked) return;
    const boite = bboxVue(EMPRISE_MAX);
    const cle = cleTuile(boite.lat, boite.lon, 0.004);
    if (!force && cacheRoutes.has(cle)) return;
    if (enCoursRoutes) return;
    enCoursRoutes = true;
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(urlRoutes(boite.ouest, boite.sud, boite.est, boite.nord))}`,
      });
      const liste = routesDepuisReponse(await r.json());
      cacheRoutes.set(cle, liste);
      if (cacheRoutes.size > TAILLE_CACHE) cacheRoutes.delete(cacheRoutes.keys().next().value);
      const resume = resumerRoutes(liste);
      stats = { ...stats, routes: resume.routes, routesKm: resume.longueur / 1000 };
      info.textContent = `${stats.parcelles} parcelles · ${resume.routes} routes (${(resume.longueur / 1000).toFixed(1)} km)`;
    } catch {
      info.textContent = '⚠ Routes indisponibles (Overpass) — réessaie plus tard.';
    } finally {
      enCoursRoutes = false;
    }
  }

  /** Redessine tout (parcelles + routes) depuis les caches. */
  function redessiner() {
    ds.entities.removeAll();
    const b = bboxVue(EMPRISE_MAX);
    for (const [k, v] of cache) if (k === cleTuile(b.lat, b.lon)) dessiner(v, k);
    if (voirRoutes?.checked) {
      const cle = cleTuile(b.lat, b.lon, 0.004);
      const liste = cacheRoutes.get(cle);
      if (liste) dessinerRoutes(liste);
    }
    governorRequestRender('wt-cadastre');
  }

  let enCoursRoutes = false;

  const planifier = () => {
    if (!actif) return;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => { maj(); majRoutes(); }, 1200);
  };
  viewer.camera.changed.addEventListener(planifier);

  function activer(etat) {
    actif = Boolean(etat);
    ds.show = actif;
    btn.textContent = actif ? '🗺 MASQUER LE CADASTRE' : '🗺 AFFICHER LE CADASTRE';
    if (actif) { maj(); surMessage?.('🗺 Cadastre activé (apicarto/IGN) — descends sous 2 500 m.'); }
    else { ds.entities.removeAll(); }
  }

  btn.addEventListener('click', () => activer(!actif));
  opacite.addEventListener('input', () => {
    alpha = Number(opacite.value) / 100;
    el.querySelector('.c-op').textContent = `${opacite.value} %`;
    if (actif) maj(true);
  });
  remplir.addEventListener('change', () => { if (actif) maj(true); });
  forcer?.addEventListener('change', () => { if (actif) maj(true); });
  voirRoutes?.addEventListener('change', () => { if (actif) { redessiner(); majRoutes(true); } });
  nomsRoutes?.addEventListener('change', () => { if (actif) redessiner(); });

  return {
    element: el,
    activer,
    maj,
    visible: () => actif,
    statistiques: () => ({ ...stats }),
    effacer: () => { ds.entities.removeAll(); cache.clear(); },
  };
}
