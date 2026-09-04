/**
 * WATCHTOWER — 📍 MOI : ma localisation (remplace l'ancien « AUTOUR »).
 *
 *  · 📡 ME LOCALISER — GPS du navigateur (permission, jamais envoyée à un
 *    serveur tiers : seulement des APIs ouvertes reçoivent les coordonnées).
 *  · ✍️ SAISIR MON ADRESSE — entrée manuelle (BAN France → Photon monde).
 *  · 🏠 C'EST MA MAISON — mémorise le domicile (partagé avec l'app entière).
 *  · 🚶 VUE POV MA RUE — la vue principale devient la rue DEVANT chez toi
 *    (caméra à hauteur d'homme, ZQSD pour bouger) — même moteur que la
 *    fiche lieu.
 *  · ℹ️ FICHE DU LIEU — ouvre la fiche complète du point.
 *  · 📌 repère « MA MAISON » posé sur la carte : une icône CLIQUABLE qui
 *    rouvre la fiche (utile après un vol POV).
 *  · En bas : les lieux autour (3 km) comme avant, pour le contexte.
 */

import * as Cesium from 'cesium';

const DOM_KEY = 'watchtower.domicile.v1';

const CSS = `
#wt-moi { display: flex; flex-direction: column; max-height: 52vh; font-size: 10px; }
#wt-moi .actions { display: flex; gap: 5px; padding: 10px 12px 4px; flex-wrap: wrap; }
#wt-moi .act {
  flex: 1 1 45%; cursor: pointer; padding: 8px 6px; font-family: inherit;
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.5px; border-radius: 8px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-moi .act:hover { background: rgba(0,212,255,0.2); }
#wt-moi .act.vert { border-color: rgba(67,209,122,0.5); color: #43d17a; background: rgba(67,209,122,0.08); }
#wt-moi .statut { padding: 4px 12px; color: rgba(232,234,237,0.55); line-height: 1.55; }
#wt-moi .saisie { display: none; padding: 0 12px 6px; gap: 5px; }
#wt-moi .saisie.on { display: flex; }
#wt-moi .saisie input { flex: 1; padding: 8px 10px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 10px; outline: none; }
#wt-moi .info-carte { padding: 0 12px 6px; }
#wt-moi .info-carte .carte { border: 1px solid rgba(0,212,255,0.3); border-radius: 9px; padding: 7px 9px; font-size: 9px; line-height: 1.6; background: rgba(0,212,255,0.05); }
#wt-moi .info-carte .carte b { color: #00d4ff; }
#wt-moi .info-carte .bouts { display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap; }
#wt-moi .info-carte .bout { cursor: pointer; padding: 6px 8px; font-family: inherit; font-size: 8px; font-weight: 700; letter-spacing: 0.5px; border-radius: 7px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; }
#wt-moi .sect { padding: 6px 12px 2px; font-size: 8px; letter-spacing: 2px; color: rgba(232,234,237,0.4); }
#wt-moi .liste { overflow-y: auto; padding: 0 12px 10px; display: flex; flex-direction: column; gap: 4px; max-height: 26vh; }
#wt-moi .lieu {
  cursor: pointer; text-align: left; padding: 7px 9px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: inherit; font-family: inherit; font-size: 10px; line-height: 1.45;
  display: flex; gap: 8px; align-items: center;
}
#wt-moi .lieu:hover { border-color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-moi .lieu .dist { margin-left: auto; color: #00d4ff; white-space: nowrap; }
`;

const ICONES = {
  restaurant: '🍽', fast_food: '🍔', cafe: '☕', bar: '🍺', pharmacy: '💊',
  hospital: '🏥', townhall: '🏛', marketplace: '🛒', fuel: '⛽', bakery: '🥖',
  supermarket: '🛒', beach: '🏖', attraction: '⭐', viewpoint: '👁', museum: '🖼',
  hotel: '🛏', camp_site: '⛺', station: '🚉', bus_station: '🚌', harbour: '⚓', marina: '⚓',
};

function distM(lat1, lon1, lat2, lon2) {
  const R = 6371000; const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

async function chercherAutour(lat, lon) {
  const requete = `[out:json][timeout:20];(
    node(around:3000,${lat},${lon})[tourism~"attraction|viewpoint|museum|hotel|camp_site"];
    node(around:3000,${lat},${lon})[amenity~"restaurant|fast_food|cafe|bar|pharmacy|hospital|townhall|marketplace|fuel"];
    node(around:3000,${lat},${lon})[shop~"bakery|supermarket"];
    node(around:3000,${lat},${lon})[natural=beach];
    node(around:4000,${lat},${lon})[railway=station];
  );out 40;`;
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(requete)}`,
  });
  const d = await r.json();
  const lieux = (d?.elements || [])
    .filter((e) => e.tags?.name)
    .map((e) => {
      const type = e.tags.tourism || e.tags.amenity || e.tags.shop || e.tags.natural || e.tags.railway || '';
      return { nom: e.tags.name, type, lat: e.lat, lon: e.lon, dist: distM(lat, lon, e.lat, e.lon) };
    })
    .sort((a, b) => a.dist - b.dist);
  const vus = new Set();
  return lieux.filter((l) => (vus.has(l.nom) ? false : vus.add(l.nom))).slice(0, 20);
}

async function communeFR(lat, lon) {
  try {
    const r = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,codesPostaux,population`);
    const d = await r.json();
    return d?.[0] || null;
  } catch { return null; }
}

/** Initialise le panneau 📍 MOI. Retourne {element, focus}. */
export function initNearbyPlaces(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-moi';
  el.innerHTML = `
    <div class="actions">
      <button class="act loc" type="button">📡 ME LOCALISER (GPS)</button>
      <button class="act saisir" type="button">✍️ SAISIR MON ADRESSE</button>
      <button class="act vert maison" type="button">🏠 C'EST MA MAISON</button>
      <button class="act pov" type="button">🚶 VUE POV MA RUE</button>
    </div>
    <div class="saisie"><input class="s-addr" type="text" placeholder="Adresse ou rue + ville (BAN, sans clé)" /><button class="act go" type="button" style="flex:none;padding:8px 12px">OK</button></div>
    <div class="statut">Ta position → info du lieu + vue POV de ta rue (devant chez toi).
    Position envoyée uniquement aux APIs ouvertes (BAN / OSM / Open-Meteo).</div>
    <div class="info-carte" style="display:none">
      <div class="carte"></div>
      <div class="bouts">
        <button class="bout pov2" type="button">🚶 POV DEVANT CHEZ MOI</button>
        <button class="bout fiche" type="button">ℹ️ FICHE DU LIEU</button>
        <button class="bout repere" type="button">📌 REPERE SUR LA CARTE</button>
      </div>
    </div>
    <div class="sect">📍 AUTEURS · LIEUX AUTOUR (3 KM)</div>
    <div class="actions" style="padding-top:0"><button class="act autour" type="button">🔄 RECHERCHER AUTOUR</button></div>
    <div class="liste"></div>`;
  const statut = el.querySelector('.statut');
  const liste = el.querySelector('.liste');
  const zoneInfo = el.querySelector('.info-carte');
  const carte = el.querySelector('.carte');

  let posMoi = null; // {lat, lon} dernière position connue

  function voler(lon, lat, alt = 900) {
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), duration: 2.5 });
  }

  /** Affiche la fiche-info du point (adresse, commune, météo) + boutons. */
  async function montrerInfo(lat, lon) {
    zoneInfo.style.display = '';
    carte.innerHTML = '🔍 Identification du lieu…';
    const [ban, commune, meteo] = await Promise.all([
      fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`).then((r) => r.json()).catch(() => null),
      communeFR(lat, lon),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,wind_speed_10m,weather_code`).then((r) => r.json()).then((d) => d?.current).catch(() => null),
    ]);
    const adresse = ban?.features?.[0]?.properties?.label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    carte.innerHTML = `
      <div><b>📍 ${adresse}</b></div>
      ${commune ? `<div>🏛 ${commune.nom} (${commune.codesPostaux?.[0] || ''}) · ${(commune.population || 0).toLocaleString('fr-FR')} hab.</div>` : ''}
      ${meteo ? `<div>🌡 ${Math.round(meteo.temperature_2m)}°C · vent ${Math.round(meteo.wind_speed_10m)} km/h</div>` : ''}
      <div style="color:rgba(232,234,237,0.5)">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>`;
  }

  /** Lance le POV street devant la position (moteur fiche lieu, exporté). */
  function vuePOV(lat, lon, nom) {
    const fiche = window.__godsEyeView?.fiche;
    if (!fiche?.vuePOVStreet) { statut.textContent = '⚠ Moteur POV non prêt — réessaie dans un instant.'; return; }
    fiche.vuePOVStreet(lat, lon, { nom });
  }

  /** Repère « MA MAISON » cliquable sur la carte → rouvre la fiche. */
  function poserRepere(lat, lon, label) {
    try { window.__godsEyeView?.fiche?.marqueurDomicile?.({ lat, lon, label }); } catch { /* ok */ }
    statut.textContent = `📌 Repère « ${label || 'MA MAISON'} » posé : clique dessus sur la carte pour rouvrir la fiche.`;
  }

  function activer(lat, lon) {
    posMoi = { lat, lon };
    voler(lon, lat, 1500);
    montrerInfo(lat, lon);
    el.querySelector('.pov2').onclick = () => vuePOV(lat, lon, 'ma maison');
    el.querySelector('.fiche').onclick = () => window.__godsEyeView?.fiche?.ouvrir(lon, lat);
    el.querySelector('.repere').onclick = () => poserRepere(lat, lon, 'MA MAISON');
  }

  el.querySelector('.loc').addEventListener('click', () => {
    if (!navigator.geolocation) { statut.textContent = 'Géolocalisation non disponible dans ce navigateur.'; return; }
    statut.textContent = '📡 Demande de localisation… (accepte la permission du navigateur)';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        activer(lat, lon);
        statut.textContent = '📡 Position trouvée — info du lieu ci-dessus.';
      },
      (err) => {
        statut.textContent = err.code === 1
          ? '🚫 Permission refusée — autorise la localisation, ou « SAISIR MON ADRESSE ».'
          : `Localisation impossible (${err.message}). Essaie « SAISIR MON ADRESSE ».`;
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  });

  const zoneSaisie = el.querySelector('.saisie');
  el.querySelector('.saisir').addEventListener('click', () => {
    zoneSaisie.classList.toggle('on');
    if (zoneSaisie.classList.contains('on')) zoneSaisie.querySelector('.s-addr').focus();
  });
  const saisir = async () => {
    const q = zoneSaisie.querySelector('.s-addr').value.trim();
    if (!q) return;
    statut.textContent = '🔍 Géocodage…';
    try {
      let feat = (await (await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`)).json())?.features?.[0];
      if (!feat) feat = (await (await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`)).json())?.features?.[0];
      if (!feat) { statut.textContent = '⚠ Adresse introuvable — précise (n° rue + code postal).'; return; }
      const [lon, lat] = feat.geometry.coordinates;
      zoneSaisie.querySelector('.s-addr').value = '';
      zoneSaisie.classList.remove('on');
      activer(lat, lon);
    } catch { statut.textContent = '⚠ Géocodage indisponible (réseau) — réessaie.'; }
  };
  el.querySelector('.go').addEventListener('click', saisir);
  zoneSaisie.querySelector('.s-addr').addEventListener('keydown', (e) => { if (e.key === 'Enter') saisir(); });

  el.querySelector('.maison').addEventListener('click', async () => {
    if (!posMoi) { statut.textContent = ' D\'abord localise-toi (GPS) ou saisis ton adresse.'; return; }
    const { lat, lon } = posMoi;
    const ban = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`).then((r) => r.json()).catch(() => null);
    const label = ban?.features?.[0]?.properties?.label || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    try { window.localStorage.setItem(DOM_KEY, JSON.stringify({ query: label, label, lat, lon })); } catch { /* plein */ }
    poserRepere(lat, lon, label);
  });

  el.querySelector('.pov').addEventListener('click', () => {
    if (posMoi) { vuePOV(posMoi.lat, posMoi.lon, 'ma rue'); return; }
    const dom = (() => { try { return JSON.parse(window.localStorage.getItem(DOM_KEY) || 'null'); } catch { return null; } })();
    if (dom) { vuePOV(dom.lat, dom.lon, dom.label || 'ma rue'); return; }
    statut.textContent = '🚶 D\'abord localise-toi (GPS / saisie / domicile).';
  });

  // ——— lieux autour (contexte) ———
  async function explorer(lat, lon, origine) {
    statut.textContent = `🔍 Recherche des lieux autour ${origine}…`;
    liste.innerHTML = '';
    const [commune, lieux] = await Promise.all([
      communeFR(lat, lon),
      chercherAutour(lat, lon).catch(() => null),
    ]);
    let entete = origine;
    if (commune) entete = `${commune.nom} (${commune.codesPostaux?.[0] || ''}) · ${(commune.population || 0).toLocaleString('fr-FR')} hab.`;
    if (!lieux) { statut.textContent = `📍 ${entete} — points d'intérêt indisponibles (réseau/Overpass saturé).`; return; }
    statut.textContent = `📍 ${entete} — ${lieux.length} lieux à proximité (clic = y voler) :`;
    for (const l of lieux) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lieu';
      b.innerHTML = `<span>${ICONES[l.type] || '📌'}</span><span>${l.nom}</span><span class="dist">${fmtDist(l.dist)}</span>`;
      b.addEventListener('click', () => voler(l.lon, l.lat, 600));
      liste.appendChild(b);
    }
    if (!lieux.length) statut.textContent = `📍 ${entete} — aucun lieu nommé trouvé dans un rayon de 3 km.`;
  }
  el.querySelector('.autour').addEventListener('click', () => {
    if (posMoi) return explorer(posMoi.lat, posMoi.lon, 'de ta position');
    const c = viewer.camera.positionCartographic;
    explorer(Cesium.Math.toDegrees(c.latitude), Cesium.Math.toDegrees(c.longitude), 'du centre de la vue');
  });

  const focus = () => el.querySelector('.loc');
  return { element: el, focus };
}
