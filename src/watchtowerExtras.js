/**
 * WATCHTOWER — panneau d'extras français.
 *
 * Un panneau latéral (français) qui ajoute, sans aucune clé API :
 *
 *  · INFO VUE     — les données EXACTES de ce que la caméra regarde :
 *                   coordonnées réelles du centre de vue, date/heure locale,
 *                   continent, pays, région, département, ville, lieu précis
 *                   (ex. « Mairie de Frontignan ») + liens vers les fiches
 *                   (site officiel, Wikipédia, annuaire Service-Public).
 *                   Géocodage inverse : BAN (api-adresse.data.gouv.fr) pour la
 *                   France + Nominatim (OSM) partout, sans clé.
 *  · MÉTÉO        — conditions actuelles au centre de la vue (Open-Meteo,
 *                   gratuit sans clé) : température, vent, précipitations.
 *  · DOMICILE     — enregistrer sa ville/adresse (ex. Frontignan) et y voler
 *                   d'un clic. Géocodage BAN, mémorisé en localStorage.
 *  · VUES (★)     — marque-pages de vues caméra : enregistrer, revenir,
 *                   copier un lien de partage, supprimer.
 *  · IMPORT       — glisser-déposer des fichiers KML / KMZ / GeoJSON / GPX
 *                   directement sur le globe (tracés, parcelles, relevés).
 */

import * as Cesium from 'cesium';
import { initDisplayOptions } from './displayOptions.js';

const HOME_KEY = 'watchtower.domicile.v1';
const VIEWS_KEY = 'watchtower.vues.v1';

/* ── petites aides stockage ─────────────────────────────── */
function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function writeJson(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* plein */ }
}

/* ── météo : codes WMO → libellé français ───────────────── */
const WMO_FR = {
  0: '☀️ Ciel clair', 1: '🌤 Peu nuageux', 2: '⛅ Partiellement nuageux', 3: '☁️ Couvert',
  45: '🌫 Brouillard', 48: '🌫 Brouillard givrant', 51: '🌦 Bruine légère', 53: '🌦 Bruine',
  55: '🌧 Bruine forte', 61: '🌧 Pluie légère', 63: '🌧 Pluie', 65: '🌧 Pluie forte',
  66: '🌧 Pluie verglaçante', 67: '🌧 Pluie verglaçante forte', 71: '🌨 Neige légère',
  73: '🌨 Neige', 75: '❄️ Neige forte', 77: '🌨 Grains de neige', 80: '🌦 Averses légères',
  81: '🌧 Averses', 82: '⛈ Averses fortes', 85: '🌨 Averses de neige', 86: '🌨 Averses de neige fortes',
  95: '⛈ Orage', 96: '⛈ Orage avec grêle', 99: '⛈ Orage violent avec grêle',
};

const CONTINENT_FR = {
  Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe',
  Oceania: 'Océanie', Antarctic: 'Antarctique',
};
const continentCache = new Map();

/** Continent (fr) depuis un code pays ISO2 — restcountries, sans clé. */
async function continentFr(countryCode) {
  const code = String(countryCode || '').toLowerCase();
  if (!code) return '';
  if (continentCache.has(code)) return continentCache.get(code);
  try {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}?fields=region`);
    const region = (await res.json())?.region || '';
    const name = CONTINENT_FR[region] || region || '';
    continentCache.set(code, name);
    return name;
  } catch { return ''; }
}

/** Centre de vue → {lat, lon, hauteurCam} ou null. */
function viewCenter(viewer) {
  const canvas = viewer.scene.canvas;
  const center2 = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  let cartesian = null;
  try {
    const ray = viewer.camera.getPickRay(center2);
    cartesian = ray ? viewer.scene.globe.pick(ray, viewer.scene) : null;
  } catch { /* scène pas prête */ }
  if (!cartesian) {
    try { cartesian = viewer.camera.pickEllipsoid(center2); } catch { /* idem */ }
  }
  if (!cartesian) return null;
  const carto = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lat: Cesium.Math.toDegrees(carto.latitude),
    lon: Cesium.Math.toDegrees(carto.longitude),
    hauteurCam: viewer.camera.positionCartographic?.height ?? 0,
  };
}

/** Géocodage inverse français : BAN (France) puis Nominatim (monde). */
async function reverseFr(lat, lon, hauteurCam) {
  const out = {
    pays: '', codePays: '', region: '', departement: '', ville: '',
    lieu: '', liens: [],
  };
  // BAN — ultra précis en France, sans clé, pensé pour les apps.
  try {
    const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
    const props = (await res.json())?.features?.[0]?.properties;
    if (props) {
      out.pays = 'France';
      out.codePays = 'fr';
      out.ville = props.city || '';
      const ctx = String(props.context || '').split(',').map((s) => s.trim());
      out.departement = ctx.length > 1 ? `${ctx[1]} (${ctx[0]})` : ctx[0] || '';
      out.region = ctx[2] || '';
    }
  } catch { /* hors France ou BAN muet */ }

  // Nominatim — nom du lieu précis (mairie, monument…) + liens de fiche.
  try {
    const zoom = hauteurCam < 2500 ? 18 : hauteurCam < 20000 ? 14 : hauteurCam < 300000 ? 10 : 5;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1&extratags=1&accept-language=fr`;
    const data = await (await fetch(url)).json();
    const a = data?.address || {};
    if (!out.pays) out.pays = a.country || '';
    if (!out.codePays) out.codePays = a.country_code || '';
    if (!out.ville) out.ville = a.city || a.town || a.village || a.municipality || '';
    if (!out.region) out.region = a.state || a.region || '';
    if (!out.departement) out.departement = a.county || a.state_district || '';
    out.lieu = data?.name || '';
    const extras = data?.extratags || {};
    if (extras.website || extras['contact:website']) {
      out.liens.push({ label: 'Site officiel', url: extras.website || extras['contact:website'] });
    }
    const wiki = extras.wikipedia || '';
    if (wiki) {
      const [wl, wt] = wiki.includes(':') ? wiki.split(/:(.+)/) : ['fr', wiki];
      out.liens.push({ label: 'Wikipédia', url: `https://${wl}.wikipedia.org/wiki/${encodeURIComponent(wt)}` });
    } else if (out.lieu) {
      out.liens.push({ label: 'Wikipédia (recherche)', url: `https://fr.wikipedia.org/w/index.php?search=${encodeURIComponent(out.lieu)}` });
    }
    if (/mairie/i.test(out.lieu) && out.ville) {
      out.liens.push({ label: 'Service-Public', url: `https://lannuaire.service-public.fr/recherche?whoWhat=${encodeURIComponent(`Mairie ${out.ville}`)}` });
    }
  } catch { /* réseau — le panneau garde les dernières valeurs */ }
  return out;
}

/* ── CSS du panneau ─────────────────────────────────────── */
const CSS = `
#wt-panel {
  position: fixed; top: 90px; right: 12px; z-index: 900;
  width: 262px; max-height: calc(100vh - 140px); overflow-y: auto;
  background: var(--glass-bg, rgba(12,12,20,0.78));
  border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
  border-radius: 12px; backdrop-filter: blur(10px);
  font-family: var(--font-mono, monospace); color: var(--text-primary, #e8eaed);
  font-size: 10px;
}
#wt-panel.replie { width: auto; max-height: none; overflow: hidden; }
#wt-panel.replie .wt-corps { display: none; }
.wt-tete {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; cursor: pointer; user-select: none;
}
.wt-titre { letter-spacing: 3px; font-weight: 700; font-size: 10px; }
.wt-titre .acc { color: var(--accent, #00d4ff); }
.wt-corps { padding: 0 10px 10px; }
.wt-section { border-top: 1px solid rgba(255,255,255,0.07); padding: 8px 0; }
.wt-k { font-size: 8px; letter-spacing: 2px; color: var(--text-dim, rgba(232,234,237,0.35)); margin-bottom: 5px; }
.wt-ligne { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
.wt-ligne b { font-weight: 600; color: var(--text-primary, #e8eaed); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 165px; }
.wt-ligne span { color: var(--text-secondary, rgba(232,234,237,0.5)); }
.wt-lieu { font-size: 11px; font-weight: 700; color: var(--accent, #00d4ff); margin: 4px 0 2px; }
.wt-liens a { color: #43d17a; text-decoration: none; margin-right: 10px; font-size: 9px; }
.wt-liens a:hover { text-decoration: underline; }
.wt-btn {
  cursor: pointer; font-family: inherit; font-size: 9px; letter-spacing: 1px;
  background: rgba(0,212,255,0.08); color: var(--accent, #00d4ff);
  border: 1px solid rgba(0,212,255,0.3); border-radius: 6px; padding: 4px 8px;
}
.wt-btn:hover { background: rgba(0,212,255,0.18); }
.wt-btn.vert { color: #43d17a; border-color: rgba(67,209,122,0.4); background: rgba(67,209,122,0.08); }
.wt-btn.rouge { color: #ff5252; border-color: rgba(255,82,82,0.35); background: transparent; padding: 4px 6px; }
.wt-rang { display: flex; gap: 6px; align-items: center; margin-top: 5px; flex-wrap: wrap; }
.wt-entree {
  flex: 1; min-width: 90px; background: rgba(0,0,0,0.4); color: inherit;
  border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
  border-radius: 6px; padding: 4px 7px; font-family: inherit; font-size: 9px; outline: none;
}
.wt-vue { display: flex; align-items: center; gap: 5px; margin: 3px 0; }
.wt-vue .nom { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wt-note { font-size: 8px; color: var(--text-dim, rgba(232,234,237,0.35)); line-height: 1.5; margin-top: 4px; }
.wt-calques { display: flex; flex-wrap: wrap; gap: 5px; }
.wt-calque { flex: 1 1 46%; text-align: left; padding: 6px 8px; }
.wt-calque.actif {
  color: #43d17a; border-color: rgba(67, 209, 122, 0.55);
  background: rgba(67, 209, 122, 0.13); box-shadow: 0 0 10px rgba(67, 209, 122, 0.15);
}
#wt-drop {
  position: fixed; inset: 0; z-index: 2500; display: none;
  align-items: center; justify-content: center;
  background: rgba(0, 212, 255, 0.12); border: 3px dashed var(--accent, #00d4ff);
  font-family: var(--font-mono, monospace); font-size: 16px; letter-spacing: 3px;
  color: var(--accent, #00d4ff); pointer-events: none;
}
`;

/** Initialise le panneau WATCHTOWER. */
export function initWatchtowerExtras({ viewer }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'wt-panel';
  panel.innerHTML = `
    <div class="wt-tete" title="Replier / déplier">
      <span class="wt-titre">WATCH<span class="acc">TOWER</span> · FR</span>
      <span class="wt-plier">▾</span>
    </div>
    <div class="wt-corps">
      <div class="wt-section">
        <div class="wt-k">INFO VUE — DONNÉES RÉELLES DU CENTRE DE LA VUE</div>
        <div class="wt-ligne"><span>Date</span><b data-wt="date">—</b></div>
        <div class="wt-ligne"><span>Heure locale</span><b data-wt="heure">—</b></div>
        <div class="wt-ligne"><span>Coordonnées</span><b data-wt="coord">—</b></div>
        <div class="wt-ligne"><span>Altitude caméra</span><b data-wt="alt">—</b></div>
        <div class="wt-ligne"><span>Continent</span><b data-wt="continent">—</b></div>
        <div class="wt-ligne"><span>Pays</span><b data-wt="pays">—</b></div>
        <div class="wt-ligne"><span>Région</span><b data-wt="region">—</b></div>
        <div class="wt-ligne"><span>Département</span><b data-wt="dept">—</b></div>
        <div class="wt-ligne"><span>Ville</span><b data-wt="ville">—</b></div>
        <div class="wt-lieu" data-wt="lieu"></div>
        <div class="wt-liens" data-wt="liens"></div>
      </div>
      <div class="wt-section">
        <div class="wt-k">AFFICHAGE — CALQUES (OPEN SOURCE, SANS CLÉ)</div>
        <div data-wt="calques"></div>
      </div>
      <div class="wt-section">
        <div class="wt-k">MÉTÉO SUR PLACE (OPEN-METEO, SANS CLÉ)</div>
        <div class="wt-ligne"><span>Conditions</span><b data-wt="meteo">—</b></div>
        <div class="wt-ligne"><span>Température</span><b data-wt="temp">—</b></div>
        <div class="wt-ligne"><span>Vent</span><b data-wt="vent">—</b></div>
      </div>
      <div class="wt-section">
        <div class="wt-k">DOMICILE</div>
        <div class="wt-ligne"><span>Adresse</span><b data-wt="domicile">non définie</b></div>
        <div class="wt-rang">
          <button class="wt-btn vert" data-wt="aller">🏠 ALLER</button>
          <button class="wt-btn" data-wt="definir">DÉFINIR / MODIFIER</button>
        </div>
      </div>
      <div class="wt-section">
        <div class="wt-k">VUES ENREGISTRÉES (MARQUE-PAGES)</div>
        <div class="wt-rang">
          <input class="wt-entree" data-wt="nomvue" placeholder="nom de la vue…" />
          <button class="wt-btn vert" data-wt="sauvevue">★ ENREGISTRER</button>
        </div>
        <div data-wt="listevues"></div>
      </div>
      <div class="wt-section">
        <div class="wt-k">🛤 ROADMAP — OPTIONS NON INCLUSES (EN CONSTRUCTION)</div>
        <details style="font-size:8.5px;line-height:1.7;color:rgba(232,234,237,0.6)">
          <summary style="cursor:pointer;letter-spacing:1px;color:var(--accent,#00d4ff)">AFFICHER LA LISTE</summary>
          🚦 <b>Trafic temps réel gratuit</b> — recherche de source fiable sans clé en cours<br>
          🛰 <b>Timelapse satellite Sentinel-2</b> — gratuit (Copernicus) mais compte requis, révisite ~5 j<br>
          📐 <b>Import BIM/IFC 3D</b> — lecteur open source en développement<br>
          📡 <b>Multi-GPS engins / Traccar</b> — nécessite un serveur + identifiants<br>
          📸 <b>Photo → coordonnées (GeoSpy)</b> — version schématique en attendant<br>
          🏃 <b>Calques vélo / rando / transports</b> — à venir (OSM, gratuit)<br>
          ⚡ <b>État réseau électrique par quartier</b> — non public (stats Enedis seules)<br>
          🎥 <b>Caméras premium</b> — API payante (mode payant)<br>
          🧮 <b>Cas pratiques ouvriers TP</b> — ton document à venir → affine le DEVIS<br>
        </details>
      </div>
      <div class="wt-section">
        <div class="wt-k">IMPORT DE FICHIERS</div>
        <div class="wt-note">Glisse un fichier <b>KML · KMZ · GeoJSON · GPX</b> n'importe où
        sur le globe : tracés, parcelles, relevés s'affichent directement.</div>
        <div data-wt="listeimports"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelector('.wt-tete').addEventListener('click', () => panel.classList.toggle('replie'));

  const el = (name) => panel.querySelector(`[data-wt="${name}"]`);

  /* ── AFFICHAGE : calques activables (pluie, nuages, relief, noms, cadastre) ── */
  const displayOptions = initDisplayOptions(viewer, el('calques'));

  /* ── horloge française ── */
  const majHorloge = () => {
    const now = new Date();
    el('date').textContent = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    el('heure').textContent = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  };
  majHorloge();
  window.setInterval(majHorloge, 1000);

  /* ── INFO VUE + MÉTÉO — au repos caméra (débounce, respecte Nominatim 1 req/s) ── */
  let timer = null;
  let dernierPoint = null;
  const majVue = async () => {
    const centre = viewCenter(viewer);
    if (!centre) return;
    dernierPoint = centre;
    el('coord').textContent = `${centre.lat.toFixed(5)}, ${centre.lon.toFixed(5)}`;
    el('alt').textContent = centre.hauteurCam > 10000
      ? `${(centre.hauteurCam / 1000).toFixed(1)} km`
      : `${Math.round(centre.hauteurCam)} m`;
    const [geo, ,] = await Promise.all([
      reverseFr(centre.lat, centre.lon, centre.hauteurCam),
      majMeteo(centre.lat, centre.lon),
    ]);
    el('pays').textContent = geo.pays || '—';
    el('region').textContent = geo.region || '—';
    el('dept').textContent = geo.departement || '—';
    el('ville').textContent = geo.ville || '—';
    el('lieu').textContent = geo.lieu ? `📍 ${geo.lieu}` : '';
    el('continent').textContent = (await continentFr(geo.codePays)) || '—';
    el('liens').innerHTML = geo.liens
      .map((l) => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} ↗</a>`)
      .join('');
  };
  const planifieMaj = () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(majVue, 1200);
  };
  viewer.camera.moveEnd.addEventListener(planifieMaj);
  window.setTimeout(majVue, 4000); // première passe après le vol initial

  async function majMeteo(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`;
      const cur = (await (await fetch(url)).json())?.current;
      if (!cur) return;
      el('meteo').textContent = WMO_FR[cur.weather_code] || `code ${cur.weather_code}`;
      el('temp').textContent = `${Math.round(cur.temperature_2m)} °C`;
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
      const dir = dirs[Math.round((cur.wind_direction_10m % 360) / 45) % 8];
      el('vent').textContent = `${Math.round(cur.wind_speed_10m)} km/h ${dir}`;
    } catch { /* réseau */ }
  }

  /* ── DOMICILE ── */
  const majDomicile = () => {
    const home = readJson(HOME_KEY, null);
    el('domicile').textContent = home?.label || 'non définie';
  };
  majDomicile();
  el('definir').addEventListener('click', async () => {
    const actuel = readJson(HOME_KEY, null);
    const saisie = window.prompt(
      'Ton adresse ou ta ville (géocodage BAN — France) :',
      actuel?.query || 'Frontignan',
    );
    if (!saisie) return;
    try {
      let feat = (await (await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(saisie)}&limit=1`)).json())?.features?.[0];
      let lon; let lat; let label;
      if (feat) {
        [lon, lat] = feat.geometry.coordinates;
        label = feat.properties.label;
      } else {
        // hors France → Photon
        const f2 = (await (await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(saisie)}&limit=1`)).json())?.features?.[0];
        if (!f2) { window.alert('Adresse introuvable.'); return; }
        [lon, lat] = f2.geometry.coordinates;
        label = f2.properties?.name || saisie;
      }
      writeJson(HOME_KEY, { query: saisie, label, lat, lon });
      majDomicile();
      volVers(lat, lon);
    } catch { window.alert('Géocodage indisponible — réessaie.'); }
  });
  el('aller').addEventListener('click', () => {
    const home = readJson(HOME_KEY, null);
    if (!home) { el('definir').click(); return; }
    volVers(home.lat, home.lon);
  });
  function volVers(lat, lon) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.012, 1900),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-42), roll: 0 },
      duration: 3.2,
    });
  }

  /* ── VUES (marque-pages) ── */
  const majVues = () => {
    const vues = readJson(VIEWS_KEY, []);
    el('listevues').innerHTML = vues.length
      ? vues.map((v, i) => `
        <div class="wt-vue">
          <span class="nom">★ ${v.nom}</span>
          <button class="wt-btn" data-vol="${i}" title="Y aller">▶</button>
          <button class="wt-btn" data-lien="${i}" title="Copier le lien de partage">🔗</button>
          <button class="wt-btn rouge" data-suppr="${i}" title="Supprimer">✕</button>
        </div>`).join('')
      : '<div class="wt-note">Aucune vue enregistrée.</div>';
    el('listevues').querySelectorAll('[data-vol]').forEach((b) => b.addEventListener('click', () => {
      const v = readJson(VIEWS_KEY, [])[Number(b.dataset.vol)];
      if (!v) return;
      viewer.camera.flyTo({
        destination: new Cesium.Cartesian3(v.x, v.y, v.z),
        orientation: { heading: v.heading, pitch: v.pitch, roll: v.roll },
        duration: 2.6,
      });
    }));
    el('listevues').querySelectorAll('[data-lien]').forEach((b) => b.addEventListener('click', async () => {
      const v = readJson(VIEWS_KEY, [])[Number(b.dataset.lien)];
      if (!v) return;
      try { await navigator.clipboard.writeText(v.href || window.location.href); b.textContent = '✓'; window.setTimeout(() => { b.textContent = '🔗'; }, 1500); } catch { window.prompt('Copie ce lien :', v.href || window.location.href); }
    }));
    el('listevues').querySelectorAll('[data-suppr]').forEach((b) => b.addEventListener('click', () => {
      const vues2 = readJson(VIEWS_KEY, []);
      vues2.splice(Number(b.dataset.suppr), 1);
      writeJson(VIEWS_KEY, vues2);
      majVues();
    }));
  };
  majVues();
  el('sauvevue').addEventListener('click', () => {
    const nom = el('nomvue').value.trim() || `Vue ${new Date().toLocaleString('fr-FR')}`;
    const p = viewer.camera.position;
    const vues = readJson(VIEWS_KEY, []);
    vues.push({
      nom,
      x: p.x, y: p.y, z: p.z,
      heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll,
      href: window.location.href,
    });
    writeJson(VIEWS_KEY, vues);
    el('nomvue').value = '';
    majVues();
  });

  /* ── IMPORT drag & drop ── */
  const drop = document.createElement('div');
  drop.id = 'wt-drop';
  drop.textContent = 'DÉPOSE TON FICHIER — KML · KMZ · GEOJSON · GPX';
  document.body.appendChild(drop);
  const sources = [];
  const majImports = () => {
    el('listeimports').innerHTML = sources.map((s, i) => `
      <div class="wt-vue"><span class="nom">📁 ${s.nom}</span>
      <button class="wt-btn rouge" data-retire="${i}">✕</button></div>`).join('');
    el('listeimports').querySelectorAll('[data-retire]').forEach((b) => b.addEventListener('click', () => {
      const s = sources[Number(b.dataset.retire)];
      if (s) { viewer.dataSources.remove(s.ds, true); sources.splice(Number(b.dataset.retire), 1); majImports(); }
    }));
  };
  window.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.display = 'flex'; });
  window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) drop.style.display = 'none'; });
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    drop.style.display = 'none';
    for (const file of e.dataTransfer?.files || []) {
      const nom = file.name;
      const ext = nom.toLowerCase().split('.').pop();
      try {
        let ds = null;
        if (ext === 'kml' || ext === 'kmz') {
          ds = await Cesium.KmlDataSource.load(file, { camera: viewer.scene.camera, canvas: viewer.scene.canvas, clampToGround: true });
        } else if (ext === 'geojson' || ext === 'json') {
          ds = await Cesium.GeoJsonDataSource.load(JSON.parse(await file.text()), { clampToGround: true });
        } else if (ext === 'gpx') {
          ds = await Cesium.GpxDataSource.load(file, { clampToGround: true });
        } else {
          window.alert(`Format non géré : .${ext} (KML, KMZ, GeoJSON, GPX)`);
          continue;
        }
        await viewer.dataSources.add(ds);
        sources.push({ nom, ds });
        majImports();
        viewer.flyTo(ds, { duration: 2.5 });
      } catch (err) {
        window.alert(`Impossible de lire ${nom} : ${err?.message || err}`);
      }
    }
  });

  return { panel, displayOptions };
}
