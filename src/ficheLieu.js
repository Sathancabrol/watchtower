/**
 * WATCHTOWER — FICHE LIEU : clic sur la carte → dossier complet du point.
 *
 * Un clic gauche n'importe où sur la carte ouvre une fiche type « digital
 * twin » (panneau gauche) avec :
 *   — identité du lieu (bâtiment/POI le plus proche via OpenStreetMap,
 *     icône selon le type : 🏛 mairie, ⛪ église, 🏥 hôpital…) ;
 *   — synthèse Wikipédia + PHOTO du bâtiment (API Wikipédia, gratuite) ;
 *   — adresse (BAN), commune (population, CP — geo.gouv.fr), coordonnées,
 *     altitude, météo du point ;
 *   — onglets 🏛 POLITIQUE · 💶 ÉCONOMIE · 👥 CITOYEN (services, commerces,
 *     institutions autour, via Overpass/OSM) ;
 *   — VISITE 3D : orbite drone 360° autour du bâtiment, ou scène par scène
 *     (N/E/S/O/plongée). En mode payant Google 3D, le bâtiment est en vraie
 *     3D photoréaliste ; l'intérieur nécessite des plans (feuille de route).
 *
 * Tout est gratuit et sans clé.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';

const TYPE_ICONES = {
  townhall: ['🏛', 'Mairie · bâtiment public'],
  government: ['🏛', 'Administration'],
  courthouse: ['⚖', 'Tribunal'],
  police: ['🚓', 'Police / gendarmerie'],
  fire_station: ['🚒', 'Caserne de pompiers'],
  place_of_worship: ['⛪', 'Édifice religieux'],
  school: ['🏫', 'École'],
  college: ['🏫', 'Établissement scolaire'],
  university: ['🎓', 'Université'],
  hospital: ['🏥', 'Hôpital'],
  pharmacy: ['💊', 'Pharmacie'],
  post_office: ['📮', 'Poste'],
  library: ['📚', 'Bibliothèque'],
  restaurant: ['🍽', 'Restaurant'],
  cafe: ['☕', 'Café'],
  bar: ['🍺', 'Bar'],
  bank: ['🏦', 'Banque'],
  supermarket: ['🛒', 'Supermarché'],
  bakery: ['🥖', 'Boulangerie'],
  marketplace: ['🛒', 'Marché'],
  station: ['🚉', 'Gare'],
  attraction: ['⭐', 'Site touristique'],
  museum: ['🖼', 'Musée'],
  castle: ['🏰', 'Château'],
  lighthouse: ['🗼', 'Phare'],
  beach: ['🏖', 'Plage'],
  marina: ['⚓', 'Port de plaisance'],
  harbour: ['⚓', 'Port'],
};
const icone = (t) => TYPE_ICONES[t] || ['📌', 'Lieu'];

const CODES_METEO = {
  0: 'ciel clair', 1: 'plutôt clair', 2: 'nuageux', 3: 'couvert', 45: 'brouillard',
  51: 'bruine', 61: 'pluie faible', 63: 'pluie', 65: 'pluie forte', 71: 'neige',
  80: 'averses', 95: 'orage',
};

const CSS = `
#wt-fiche {
  position: fixed; left: 12px; top: 64px; z-index: 930;
  width: min(340px, 90vw); max-height: calc(100vh - 220px);
  display: flex; flex-direction: column;
  background: rgba(8, 12, 20, 0.93); color: var(--text-primary, #e8eaed);
  border: 1px solid rgba(0, 212, 255, 0.4);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  backdrop-filter: blur(10px); font-family: var(--font-mono, monospace);
  animation: wt-fiche-pop 180ms ease;
}
@keyframes wt-fiche-pop { from { transform: translateX(-16px); opacity: 0; } to { transform: none; opacity: 1; } }
#wt-fiche .entete {
  display: flex; gap: 9px; align-items: center; padding: 10px 12px;
  border-bottom: 1px solid rgba(0,212,255,0.25);
}
#wt-fiche .entete .gros { font-size: 22px; }
#wt-fiche .entete .titres { flex: 1; min-width: 0; }
#wt-fiche .entete .nom { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
#wt-fiche .entete .type { font-size: 8px; letter-spacing: 2px; color: #00d4ff; text-transform: uppercase; }
#wt-fiche .fermer { cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 13px; font-family: inherit; }
#wt-fiche .corps { overflow-y: auto; flex: 1; }
#wt-fiche .photo { width: 100%; max-height: 150px; object-fit: cover; display: block; }
#wt-fiche .extrait { padding: 9px 12px; font-size: 10px; line-height: 1.65; color: rgba(232,234,237,0.85); }
#wt-fiche .extrait a { color: #00d4ff; }
#wt-fiche .infos { padding: 4px 12px 8px; display: grid; grid-template-columns: 84px 1fr; gap: 3px 8px; font-size: 9px; line-height: 1.5; }
#wt-fiche .infos .k { color: rgba(232,234,237,0.45); letter-spacing: 1px; }
#wt-fiche .onglets { display: flex; gap: 4px; padding: 6px 10px; border-top: 1px solid rgba(0,212,255,0.15); }
#wt-fiche .onglet {
  flex: 1; cursor: pointer; padding: 6px 2px; font-family: inherit; font-size: 8px;
  font-weight: 700; letter-spacing: 1px; border-radius: 7px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(232,234,237,0.75);
}
#wt-fiche .onglet.actif { background: rgba(0,212,255,0.14); border-color: #00d4ff; color: #00d4ff; }
#wt-fiche .contenu-onglet { padding: 6px 10px 10px; font-size: 9px; }
#wt-fiche .ligne-poi {
  cursor: pointer; width: 100%; text-align: left; display: flex; gap: 7px; align-items: center;
  padding: 5px 8px; margin-bottom: 3px; border-radius: 7px; font-family: inherit; font-size: 9.5px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: inherit; line-height: 1.4;
}
#wt-fiche .ligne-poi:hover { border-color: #00d4ff; }
#wt-fiche .ligne-poi .d { margin-left: auto; color: #00d4ff; white-space: nowrap; }
#wt-fiche .visite { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 10px; border-top: 1px solid rgba(0,212,255,0.15); }
#wt-fiche .v-btn {
  cursor: pointer; padding: 7px 9px; font-family: inherit; font-size: 8.5px; font-weight: 700;
  letter-spacing: 1px; border-radius: 7px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-fiche .v-btn.stop { border-color: rgba(240,90,90,0.6); color: #f08a8a; background: rgba(240,90,90,0.08); }
#wt-fiche .note3d { padding: 0 12px 10px; font-size: 8px; line-height: 1.6; color: rgba(232,234,237,0.4); }
#wt-fiche .chargement { padding: 14px; text-align: center; font-size: 10px; color: #00d4ff; }
`;

const dist2 = (la1, lo1, la2, lo2) => {
  const R = 6371000; const rad = Math.PI / 180;
  const a = Math.sin(((la2 - la1) * rad) / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(((lo2 - lo1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const fd = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

async function wikiResume(tag) {
  let lang = 'fr'; let titre = tag;
  const m = /^([a-z]{2,3}):(.+)$/.exec(tag);
  if (m) { lang = m[1]; titre = m[2]; }
  const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titre)}`);
  if (!r.ok) return null;
  const d = await r.json();
  if (!d?.extract) return null;
  return { titre: d.title, extrait: d.extract, image: d.thumbnail?.source, url: d.content_urls?.desktop?.page };
}

async function wikiProche(lat, lon) {
  const r = await fetch(`https://fr.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lon}&gsradius=500&gslimit=1&format=json&origin=*`);
  const d = await r.json();
  const p = d?.query?.geosearch?.[0];
  return p ? wikiResume(`fr:${p.title}`) : null;
}

async function overpass(requete) {
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(`[out:json][timeout:20];${requete}`)}`,
  });
  return (await r.json())?.elements || [];
}

function poisDepuis(elements, lat, lon) {
  const vus = new Set();
  return elements
    .filter((e) => e.tags?.name)
    .map((e) => {
      const la = e.lat ?? e.center?.lat; const lo = e.lon ?? e.center?.lon;
      const type = e.tags.amenity || e.tags.shop || e.tags.tourism || e.tags.office || e.tags.railway || e.tags.natural || '';
      return { nom: e.tags.name, type, lat: la, lon: lo, dist: dist2(lat, lon, la, lo) };
    })
    .filter((p) => Number.isFinite(p.lat) && (vus.has(p.nom) ? false : vus.add(p.nom)))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 12);
}

/** Installe la fiche lieu : clic gauche sur le globe → dossier du point. */
export function initFicheLieu(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let panneau = null;
  let marqueur = null;
  let orbite = null;
  let sceneIdx = 0;
  let requeteId = 0;

  const SCENES = [
    { nom: 'Nord', h: 180, p: -25 }, { nom: 'Est', h: 270, p: -25 },
    { nom: 'Sud', h: 0, p: -25 }, { nom: 'Ouest', h: 90, p: -25 },
    { nom: 'Plongée', h: 0, p: -85 },
  ];

  function arreterOrbite() {
    if (orbite) { window.clearInterval(orbite); orbite = null; }
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }

  function fermer() {
    arreterOrbite();
    quitterInterieur();
    panneau?.remove(); panneau = null;
    if (marqueur) { viewer.entities.remove(marqueur); marqueur = null; }
  }

  function centre3D(lon, lat) {
    const h = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat)) || 0;
    return Cesium.Cartesian3.fromDegrees(lon, lat, h + 14);
  }

  async function ouvrir(lon, lat) {
    const id = ++requeteId;
    fermer();

    marqueur = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: { pixelSize: 9, color: Cesium.Color.CYAN, outlineColor: Cesium.Color.fromCssColorString('#062030'), outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
    });

    panneau = document.createElement('div');
    panneau.id = 'wt-fiche';
    panneau.innerHTML = '<div class="chargement">⬡ ANALYSE DU POINT…</div>';
    document.body.appendChild(panneau);

    // ── enquête parallèle, toutes sources gratuites ──
    const [ban, nomi, commune, meteo, identite] = await Promise.all([
      fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`).then((r) => r.json()).catch(() => null),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&extratags=1&accept-language=fr`).then((r) => r.json()).catch(() => null),
      fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,codesPostaux,population,codeDepartement`).then((r) => r.json()).then((d) => d?.[0]).catch(() => null),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,wind_speed_10m,weather_code`).then((r) => r.json()).then((d) => d?.current).catch(() => null),
      overpass(`(node(around:45,${lat},${lon})[name];way(around:45,${lat},${lon})[name];);out tags center 8;`).catch(() => []),
    ]);
    if (id !== requeteId || !panneau) return;

    // identité : POI nommé le plus proche, sinon adresse
    const pois = poisDepuis(identite, lat, lon);
    const poi = pois[0] || null;
    const nomiType = nomi?.type || nomi?.category || '';
    const type = poi?.type || nomiType;
    const [ic, typeLbl] = icone(type);
    const nom = poi?.nom || nomi?.name || ban?.features?.[0]?.properties?.label || 'Point GPS';
    const adresse = ban?.features?.[0]?.properties?.label || nomi?.display_name?.split(',').slice(0, 3).join(',') || '—';

    // Wikipédia : tag OSM direct sinon article géolocalisé le plus proche
    let wiki = null;
    try {
      const tag = nomi?.extratags?.wikipedia;
      wiki = tag ? await wikiResume(tag) : await wikiProche(lat, lon);
    } catch { wiki = null; }
    if (id !== requeteId || !panneau) return;

    const alt = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat));
    panneau.innerHTML = `
      <div class="entete">
        <span class="gros">${ic}</span>
        <div class="titres"><div class="nom">${nom}</div><div class="type">${typeLbl}</div></div>
        <button class="fermer" title="Fermer">✕</button>
      </div>
      <div class="corps">
        ${wiki?.image ? `<img class="photo" src="${wiki.image}" alt="" />` : ''}
        ${wiki?.extrait ? `<div class="extrait">${wiki.extrait.slice(0, 480)}${wiki.extrait.length > 480 ? '…' : ''}
          ${wiki.url ? ` <a href="${wiki.url}" target="_blank" rel="noopener">Wikipédia ↗</a>` : ''}</div>` : ''}
        <div class="infos">
          <span class="k">ADRESSE</span><span>${adresse}</span>
          <span class="k">COMMUNE</span><span>${commune ? `${commune.nom} (${commune.codesPostaux?.[0] || ''}) · ${(commune.population || 0).toLocaleString('fr-FR')} hab.` : '—'}</span>
          <span class="k">COORDONNÉES</span><span>${lat.toFixed(5)}, ${lon.toFixed(5)}</span>
          <span class="k">ALTITUDE</span><span>${Number.isFinite(alt) ? `${Math.round(alt)} m` : '—'}</span>
          <span class="k">MÉTÉO</span><span>${meteo ? `${Math.round(meteo.temperature_2m)}°C · vent ${Math.round(meteo.wind_speed_10m)} km/h · ${CODES_METEO[meteo.weather_code] || ''}` : '—'}</span>
        </div>
        <div class="onglets">
          <button class="onglet" data-o="politique">🏛 POLITIQUE</button>
          <button class="onglet" data-o="economie">💶 ÉCONOMIE</button>
          <button class="onglet" data-o="citoyen">👥 CITOYEN</button>
        </div>
        <div class="contenu-onglet"></div>
      </div>
      <div class="visite">
        <button class="v-btn orbite">🚁 ORBITE DRONE</button>
        <button class="v-btn scene">🎬 SCÈNE SUIVANTE</button>
        <button class="v-btn interieur">🚶 VUE POV (street)</button>
        <button class="v-btn" data-x="intel" title="Ouvrir l'analyse INTEL de ce point">🧠 INTEL</button>
        <button class="v-btn" data-x="chantier" title="Ouvrir le hub CHANTIER (prospection ici)">🏗 CHANTIER</button>
        <button class="v-btn stop">⏹ STOP</button>
      </div>
      <div class="note3d">VISITE 3D : orbite/scènes autour du bâtiment, ou visite INTÉRIEURE
      schématique (volume reconstruit depuis l'emprise OSM/cadastre + hauteur estimée —
      ZQSD pour se déplacer). En mode payant (Google 3D), l'extérieur est photoréaliste.</div>`;

    panneau.querySelector('.fermer').addEventListener('click', fermer);
    rendreDeplacable(panneau, panneau.querySelector('.entete'));

    // ── onglets : institutions / commerces / services autour (OSM) ──
    const REQ = {
      politique: `(node(around:600,${lat},${lon})[amenity~"townhall|courthouse|police|fire_station"];way(around:600,${lat},${lon})[amenity~"townhall|courthouse|police|fire_station"];node(around:600,${lat},${lon})[office=government];way(around:600,${lat},${lon})[office=government];);out tags center 30;`,
      economie: `(node(around:400,${lat},${lon})[shop];node(around:400,${lat},${lon})[office][office!=government];node(around:400,${lat},${lon})[amenity~"restaurant|cafe|bar|bank|fast_food|marketplace"];);out tags center 40;`,
      citoyen: `(node(around:500,${lat},${lon})[amenity~"school|kindergarten|library|post_office|pharmacy|hospital|community_centre|place_of_worship"];way(around:500,${lat},${lon})[amenity~"school|library|hospital|place_of_worship"];);out tags center 30;`,
    };
    const TITRES = {
      politique: 'Institutions à proximité', economie: 'Commerces & entreprises à proximité', citoyen: 'Services au citoyen à proximité',
    };
    const zone = panneau.querySelector('.contenu-onglet');
    for (const btn of panneau.querySelectorAll('.onglet')) {
      btn.addEventListener('click', async () => {
        panneau.querySelectorAll('.onglet').forEach((b) => b.classList.remove('actif'));
        btn.classList.add('actif');
        const o = btn.dataset.o;
        zone.innerHTML = '<div class="chargement">🔍 Recherche…</div>';
        try {
          const liste = poisDepuis(await overpass(REQ[o]), lat, lon);
          zone.innerHTML = `<div style="color:#00d4ff;letter-spacing:1px;margin:2px 0 6px">${TITRES[o].toUpperCase()} — ${liste.length}</div>`;
          for (const p of liste) {
            const b = document.createElement('button');
            b.className = 'ligne-poi';
            b.innerHTML = `<span>${icone(p.type)[0]}</span><span>${p.nom}</span><span class="d">${fd(p.dist)}</span>`;
            b.addEventListener('click', () => ouvrir(p.lon, p.lat));
            zone.appendChild(b);
          }
          if (!liste.length) zone.innerHTML += '<div style="color:rgba(232,234,237,0.45)">Rien de référencé dans OSM à proximité.</div>';
        } catch { zone.innerHTML = '<div style="color:rgba(232,234,237,0.45)">Source saturée — réessaie dans quelques secondes.</div>'; }
      });
    }

    // ── visite 3D ──
    panneau.querySelector('.orbite').addEventListener('click', () => {
      arreterOrbite();
      const centre = centre3D(lon, lat);
      let cap = viewer.camera.heading;
      orbite = window.setInterval(() => {
        cap += Cesium.Math.toRadians(0.45);
        viewer.camera.lookAt(centre, new Cesium.HeadingPitchRange(cap, Cesium.Math.toRadians(-26), 280));
      }, 33);
    });
    panneau.querySelector('.scene').addEventListener('click', () => {
      arreterOrbite();
      const s = SCENES[sceneIdx % SCENES.length];
      sceneIdx += 1;
      viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(centre3D(lon, lat), 70),
        { offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(s.h), Cesium.Math.toRadians(s.p), 240), duration: 1.6 },
      );
    });
    panneau.querySelector('.stop').addEventListener('click', arreterOrbite);
    panneau.querySelector('.interieur').addEventListener('click', () => vuePOVStreet(lat, lon, {
      nom: nom,
      onEtat: (msg) => { const n = panneau?.querySelector('.note3d'); if (n) n.textContent = msg; },
    }));
    // boutons « aller vers la fenêtre correspondante »
    panneau.querySelector('[data-x="intel"]')?.addEventListener('click', () => {
      window.__godsEyeView?.dock?.ouvrirExistant?.('wt-intel');
      window.setTimeout(() => window.__godsEyeView?.intel?.analyser?.(), 500);
    });
    panneau.querySelector('[data-x="chantier"]')?.addEventListener('click', () => {
      window.__godsEyeView?.dock?.ouvrir?.('chantier');
    });
  }

  // ── VUE POV STREET (version gratuite) — réutilisable (panneau 📍 MOI) ──
  // L'emprise du bâtiment (OSM) est reconstruite en volume translucide ;
  // la caméra se place DEVANT, à hauteur d'homme, pilotable (ZQSD + flèches).
  let interieur = null;

  function quitterInterieur() {
    if (!interieur) return;
    window.clearInterval(interieur.timer);
    window.removeEventListener('keydown', interieur.down, true);
    window.removeEventListener('keyup', interieur.up, true);
    interieur.barre.remove();
    for (const e of interieur.entites) viewer.entities.remove(e);
    viewer.scene.screenSpaceCameraController.enableInputs = true;
    const { lon, lat } = interieur;
    interieur = null;
    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(centre3D(lon, lat), 60),
      { offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 220), duration: 1.4 },
    );
  }

  async function vuePOVStreet(lat, lon, { nom, onEtat } = {}) {
    arreterOrbite();
    quitterInterieur();
    const note = (msg) => { onEtat?.(msg); };
    note('🔍 Recherche de l\u2019emprise du bâtiment (OSM)…');
    let bat = null;
    try {
      const els = await overpass(`way(around:45,${lat},${lon})[building];out geom tags 1;`);
      bat = els.find((e) => Array.isArray(e.geometry) && e.geometry.length > 2) || null;
    } catch { bat = null; }
    if (!bat) {
      note('⚠ Aucune emprise de bâtiment référencée ici (OSM) — impossible de reconstruire le volume. Essaie de cliquer plus près du bâtiment.');
      return;
    }
    const plat = [];
    let cx = 0; let cy = 0;
    for (const g of bat.geometry) { plat.push(g.lon, g.lat); cx += g.lon; cy += g.lat; }
    cx /= bat.geometry.length; cy /= bat.geometry.length;
    const tags = bat.tags || {};
    const h = parseFloat(tags.height) || (parseFloat(tags['building:levels']) || 0) * 3.2 || 7;
    const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cx, cy)) || 0;

    // volume translucide : murs (extrusion, hauteurs absolues fiables)
    const entites = [];
    entites.push(viewer.entities.add({
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(plat),
        material: Cesium.Color.CYAN.withAlpha(0.14),
        height: sol, extrudedHeight: sol + h,
        outline: true, outlineColor: Cesium.Color.CYAN.withAlpha(0.85),
      },
    }));

    // POV « street view » : on se place DEVANT le bâtiment, à hauteur d'homme,
    // face à la façade — puis on se déplace librement (ZQSD).
    const rayonBat = Math.max(12, Math.sqrt(bat.geometry.length) * 4);
    const latDevant = cy - ((rayonBat + 14) / 111320); // au sud du bâtiment
    viewer.scene.screenSpaceCameraController.enableInputs = false;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(cx, latDevant, sol + 1.7),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(6), roll: 0 }, // face au bâtiment, léger regard vers le haut
    });

    // pilotage drone : ZQSD/WASD déplacer · flèches regarder · R/F monter/descendre
    const touches = new Set();
    const down = (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        touches.add(e.code); e.preventDefault(); e.stopPropagation();
      }
      if (e.code === 'Escape') quitterInterieur();
    };
    const up = (e) => touches.delete(e.code);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    const timer = window.setInterval(() => {
      const v = 0.14; const rot = 0.028;
      if (touches.has('KeyW')) viewer.camera.moveForward(v);
      if (touches.has('KeyS')) viewer.camera.moveBackward(v);
      if (touches.has('KeyA')) viewer.camera.moveLeft(v);
      if (touches.has('KeyD')) viewer.camera.moveRight(v);
      if (touches.has('KeyR')) viewer.camera.moveUp(v);
      if (touches.has('KeyF')) viewer.camera.moveDown(v);
      const cam = viewer.camera;
      let cap = cam.heading; let tang = cam.pitch; let bouge = false;
      if (touches.has('ArrowLeft')) { cap -= rot; bouge = true; }
      if (touches.has('ArrowRight')) { cap += rot; bouge = true; }
      if (touches.has('ArrowUp')) { tang = Math.min(tang + rot, 1.4); bouge = true; }
      if (touches.has('ArrowDown')) { tang = Math.max(tang - rot, -1.4); bouge = true; }
      if (bouge) cam.setView({ destination: cam.position.clone(), orientation: { heading: cap, pitch: tang, roll: 0 } });
    }, 33);

    const barre = document.createElement('div');
    barre.style.cssText = 'position:fixed;bottom:160px;left:50%;transform:translateX(-50%);z-index:2000;'
      + 'background:rgba(8,12,20,0.92);border:1px solid #00d4ff;border-radius:10px;padding:8px 14px;'
      + 'font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:1px;color:#e8eaed;display:flex;gap:12px;align-items:center;';
    barre.innerHTML = `<span>🚶 POV STREET (${nom || tags.name || 'bâtiment'} · ~${Math.round(h)} m · volume 3D du plan réel)
      — <b style="color:#00d4ff">ZQSD</b> déplacer · <b style="color:#00d4ff">FLÈCHES</b> regarder · <b style="color:#00d4ff">R/F</b> monter/descendre</span>
      <button style="cursor:pointer;background:rgba(240,90,90,0.12);border:1px solid #f08a8a;color:#f08a8a;border-radius:7px;padding:5px 10px;font-family:inherit;font-size:9px;font-weight:700">QUITTER</button>`;
    barre.querySelector('button').addEventListener('click', quitterInterieur);
    document.body.appendChild(barre);

    interieur = { entites, timer, down, up, barre, lon, lat };
    note('🏠 POV street actif — volume reconstruit depuis l\u2019emprise réelle du bâtiment. QUITTER ou ÉCHAP pour sortir.');
  }

  // ── repère « MA MAISON » : icône CLIQUABLE sur la carte → fiche ──
  const dsRepere = new Cesium.CustomDataSource('wt-ma-maison');
  viewer.dataSources.add(dsRepere);
  let repereMaison = null;
  function marqueurDomicile({ lat, lon, label }) {
    dsRepere.entities.removeAll();
    repereMaison = { lat, lon, label };
    dsRepere.entities.add({
      id: 'wt-maison',
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: { pixelSize: 10, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
      label: {
        text: `🏠 ${label || 'MA MAISON'}\nℹ️ INFO`,
        font: '13px JetBrains Mono, monospace',
        fillColor: Cesium.Color.YELLOW,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#0a0a0f').withAlpha(0.85),
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Infinity,
      },
    });
  }

  // ── clic gauche sur le globe → fiche ──
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    if (window.__wtDessin || interieur) return; // dessin de zone chantier ou visite en cours
    // clic sur le repère « MA MAISON » → fiche du domicile (même après un vol)
    let picked = null;
    try { picked = viewer.scene.pick(click.position); } catch { /* ok */ }
    if (picked?.id === 'wt-maison' && repereMaison) { ouvrir(repereMaison.lon, repereMaison.lat); return; }
    let cart = null;
    try {
      if (viewer.scene.pickPositionSupported) cart = viewer.scene.pickPosition(click.position);
    } catch { /* fallback */ }
    if (!cart) cart = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
    if (!cart) return;
    const c = Cesium.Cartographic.fromCartesian(cart);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const lat = Cesium.Math.toDegrees(c.latitude);
    // trop loin (vue orbitale) : pas de fiche pertinente
    if (viewer.camera.positionCartographic.height > 4_000_000) return;
    ouvrir(lon, lat);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });

  return { ouvrir, fermer, vuePOVStreet, marqueurDomicile };
}
