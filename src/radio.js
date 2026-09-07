/**
 * WATCHTOWER — RADIO.
 *
 * L'équivalent libre de Radio Garden : on interroge **Radio-Browser**
 * (annuaire communautaire mondial, API JSON ouverte, sans clé — plusieurs
 * millions de stations) et on écoute le flux directement dans l'app.
 *
 *   · bouton 📻 RADIO dans le dock → stations autour du point visé ;
 *   · recherche par nom, pays, langue, genre (tags) ;
 *   · une station = une pastille sur le globe (clic = écouter) ;
 *   · favoris mémorisés, historique, enregistrement du flux… non : le flux
 *     reste la propriété de la station, on ne fait que le lire.
 *
 * Tout est open source : Radio-Browser est un projet communautaire
 * hébergé par des bénévoles ; les flux appartiennent à leurs radios.
 */

import * as Cesium from 'cesium';
import { governorRequestRender } from './renderGovernor.js';

const CLE_FAVORIS = 'watchtower.radio.favoris.v1';

/** Miroirs Radio-Browser (on essaie dans l'ordre). */
export const SERVEURS = Object.freeze([
  'https://de1.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
]);

const CSS = `
#wt-radio { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; font-size: 10px; }
#wt-radio .r-t { font-size: 8px; letter-spacing: 2px; color: #00d4ff; }
#wt-radio .r-cherche {
  padding: 7px 9px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 7px; color: inherit; font-family: inherit; font-size: 10px; outline: none; width: 100%; box-sizing: border-box;
}
#wt-radio .r-bouts { display: flex; gap: 4px; flex-wrap: wrap; }
#wt-radio button.r-btn {
  cursor: pointer; padding: 6px 8px; border-radius: 7px; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff;
}
#wt-radio button.r-btn:hover { background: rgba(0,212,255,0.24); }
#wt-radio button.r-btn.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.14); color: rgba(232,234,237,0.8); }
#wt-radio .r-lecteur {
  border: 1px solid rgba(0,212,255,0.28); border-radius: 9px; padding: 8px; background: rgba(0,212,255,0.04);
}
#wt-radio .r-lecteur .nom { font-size: 11px; font-weight: 800; color: #fff; line-height: 1.3; }
#wt-radio .r-lecteur .meta { font-size: 8.5px; color: rgba(232,234,237,0.6); margin: 2px 0 6px; }
#wt-radio .r-lecteur audio { width: 100%; height: 30px; outline: none; }
#wt-radio .r-liste { display: flex; flex-direction: column; gap: 3px; max-height: 30vh; overflow-y: auto; }
#wt-radio .r-station {
  display: flex; gap: 6px; align-items: center; width: 100%; text-align: left; cursor: pointer;
  padding: 5px 7px; border-radius: 7px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07); color: inherit; font-family: inherit; font-size: 9px;
}
#wt-radio .r-station:hover { background: rgba(0,212,255,0.14); }
#wt-radio .r-station.actif { border-color: #00d4ff; background: rgba(0,212,255,0.2); }
#wt-radio .r-station .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-radio .r-station .dst { color: rgba(232,234,237,0.45); font-size: 8px; }
#wt-radio .r-vide, #wt-radio .r-note { font-size: 8.5px; color: rgba(232,234,237,0.45); line-height: 1.6; }
`;

/** Construit l'URL de recherche (géolocalisée ou textuelle). */
export function urlRecherche(base, params = {}) {
  const p = new URLSearchParams({
    hidebroken: 'true',
    order: params.order || 'votes',
    reverse: 'true',
    limit: String(params.limite || 30),
  });
  if (params.lat != null && params.lon != null) {
    p.set('geo_lat', String(params.lat));
    p.set('geo_long', String(params.lon));
    p.set('geo_distance', String(Math.max(100, Math.round(params.rayon || 200_000))));
    p.set('has_geo_info', 'true');
  }
  if (params.nom) p.set('name', params.nom);
  if (params.pays) p.set('countrycode', String(params.pays).toUpperCase());
  if (params.langue) p.set('language', params.langue);
  if (params.genre) p.set('tag', params.genre);
  return `${base}/json/stations/search?${p.toString()}`;
}

/** Normalise une station brute de l'API. */
export function normaliserStation(saisie) {
  const brut = saisie && typeof saisie === 'object' ? saisie : {};
  const url = brut.url_resolved || brut.url;
  if (!url) return null;
  // ⚠ Number(null) vaut 0 : une station sans position serait placée au
  // large de l'Afrique (0,0). On ne garde un nombre que s'il existe.
  const nombreOuNull = (v) => {
    if (v === null || v === undefined || v === '' || v === false) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const lat = nombreOuNull(brut.geo_lat);
  const lon = nombreOuNull(brut.geo_long);
  return {
    id: brut.stationuuid || url,
    nom: (brut.name || 'Sans nom').trim().slice(0, 90),
    url,
    page: brut.homepage || '',
    favicon: brut.favicon || '',
    tags: String(brut.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
    pays: brut.country || '',
    codePays: brut.countrycode || '',
    langue: brut.language || '',
    codec: brut.codec || '',
    debit: nombreOuNull(brut.bitrate) ?? 0,
    votes: nombreOuNull(brut.votes) ?? 0,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    distance: nombreOuNull(brut.geo_distance),
  };
}

/** Garde les stations réellement écoutables et dédoublonnées. */
export function nettoyerListe(saisie) {
  const liste = Array.isArray(saisie) ? saisie : [];
  const vus = new Set();
  const out = [];
  for (const brut of liste) {
    const s = normaliserStation(brut);
    if (!s) continue;
    const cle = s.nom.toLowerCase();
    if (vus.has(cle)) continue;
    vus.add(cle);
    out.push(s);
  }
  return out;
}

function favorisLire() {
  try { return JSON.parse(window.localStorage.getItem(CLE_FAVORIS) || '[]') || []; } catch { return []; }
}

function favorisEcrire(liste) {
  try { window.localStorage.setItem(CLE_FAVORIS, JSON.stringify(liste.slice(-60))); } catch { /* plein */ }
}

/** Cherche des stations (essaie les miroirs les uns après les autres). */
export async function chercherStations(params = {}) {
  for (const base of SERVEURS) {
    try {
      const controle = new AbortController();
      const minuteur = setTimeout(() => controle.abort(), 9_000);
      const r = await fetch(urlRecherche(base, params), { signal: controle.signal });
      clearTimeout(minuteur);
      if (!r.ok) continue;
      const liste = nettoyerListe(await r.json());
      if (liste.length) return liste;
    } catch { /* miroir suivant */ }
  }
  return [];
}

/**
 * @param {object} viewer
 * @param {{surMessage?:Function}} [options]
 */
export function initRadio(viewer, options = {}) {
  const { surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-radio');
  viewer.dataSources.add(ds);

  const el = document.createElement('div');
  el.id = 'wt-radio';
  el.innerHTML = `
    <div class="r-t">📻 RADIO — FLUX EN DIRECT</div>
    <input class="r-cherche" type="text" placeholder="nom, genre (jazz, news…), pays (FR)" />
    <div class="r-bouts">
      <button class="r-btn" data-a="ici">📍 AUTOUR DE LA VUE</button>
      <button class="r-btn gris" data-a="pays">🇫🇷 FRANCE</button>
      <button class="r-btn gris" data-a="top">🔥 LES PLUS ÉCOUTÉES</button>
      <button class="r-btn gris" data-a="favoris">⭐ FAVORIS</button>
      <button class="r-btn gris" data-a="stop">⏹ STOP</button>
    </div>
    <div class="r-lecteur" style="display:none">
      <div class="nom">—</div>
      <div class="meta">—</div>
      <audio controls preload="none"></audio>
      <div class="r-bouts" style="margin-top:5px">
        <button class="r-btn gris" data-a="fav">⭐ AJOUTER AUX FAVORIS</button>
        <button class="r-btn gris" data-a="aller">✈ Y ALLER</button>
      </div>
    </div>
    <div class="r-liste"></div>
    <div class="r-note">Source : Radio-Browser (annuaire communautaire ouvert, sans clé).
    Les flux restent la propriété des radios. La lecture se fait directement depuis ton navigateur.</div>`;
  const champ = el.querySelector('.r-cherche');
  const listeEl = el.querySelector('.r-liste');
  const lecteur = el.querySelector('.r-lecteur');
  const audio = lecteur.querySelector('audio');
  const nomEl = lecteur.querySelector('.nom');
  const metaEl = lecteur.querySelector('.meta');
  const boutonFav = lecteur.querySelector('[data-a="fav"]');

  let stations = [];
  let courante = null;
  let favoris = favorisLire();

  // pastille « radio » dessinée en canvas (aucun asset externe)
  const pastille = (() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.beginPath(); g.arc(32, 32, 20, 0, Math.PI * 2);
    g.fillStyle = 'rgba(5,8,13,0.9)'; g.fill();
    g.lineWidth = 3.5; g.strokeStyle = '#ff7ad9'; g.stroke();
    g.fillStyle = '#ff7ad9';
    g.beginPath(); g.arc(32, 32, 5, 0, Math.PI * 2); g.fill();
    g.lineWidth = 2;
    g.beginPath(); g.arc(32, 32, 10, Math.PI * 0.75, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(32, 32, 15, Math.PI * 0.75, Math.PI * 1.9); g.stroke();
    return c.toDataURL();
  })();

  function pointDeVue() {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    let rayon = Math.max(10_000, Math.min(1_500_000, c.height * 1.6));
    try {
      const vise = viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(viewer.scene.canvas.clientWidth / 2, viewer.scene.canvas.clientHeight / 2),
        viewer.scene.globe.ellipsoid,
      );
      if (vise) {
        const g = Cesium.Cartographic.fromCartesian(vise);
        return { lat: Cesium.Math.toDegrees(g.latitude), lon: Cesium.Math.toDegrees(g.longitude), rayon };
      }
    } catch { /* vue espace */ }
    return { lat, lon, rayon };
  }

  function rendreListe(titre = '') {
    listeEl.innerHTML = '';
    if (titre) {
      const t = document.createElement('div');
      t.className = 'r-vide';
      t.textContent = titre;
      listeEl.appendChild(t);
    }
    if (!stations.length) {
      const v = document.createElement('div');
      v.className = 'r-vide';
      v.textContent = 'Aucune station — essaie « AUTOUR DE LA VUE », un nom, ou un pays (FR, US…).';
      listeEl.appendChild(v);
      return;
    }
    for (const s of stations) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `r-station${courante?.id === s.id ? ' actif' : ''}`;
      const dist = Number.isFinite(s.distance) ? `${Math.round(s.distance / 1000)} km` : (s.pays || '');
      b.innerHTML = `<span>📻</span><span class="nm">${s.nom}</span><span class="dst">${dist}</span>`;
      b.addEventListener('click', () => ecouter(s));
      listeEl.appendChild(b);
    }
    // pastilles sur le globe
    ds.entities.removeAll();
    for (const s of stations) {
      if (s.lat == null || s.lon == null) continue;
      ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 100),
        billboard: {
          image: pastille, width: 26, height: 26,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.2, 4e7, 0.35),
        },
        label: {
          text: s.nom.slice(0, 28),
          font: 'bold 10px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.fromCssColorString('#ffb3ec'),
          outlineColor: Cesium.Color.fromCssColorString('#05080d'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3_000_000),
        },
        properties: { wtRadio: s.id },
      });
    }
    governorRequestRender('wt-radio');
  }

  function ecouter(s) {
    courante = s;
    lecteur.style.display = '';
    nomEl.textContent = s.nom;
    metaEl.textContent = [
      s.pays, s.langue, s.codec && `${s.codec} ${s.debit ? `${s.debit} kbps` : ''}`,
      s.tags.slice(0, 3).join(' · '),
    ].filter(Boolean).join(' · ') || '—';
    audio.src = s.url;
    audio.play().catch(() => { /* l'utilisateur doit cliquer : normal */ });
    boutonFav.textContent = favoris.some((f) => f.id === s.id) ? '⭐ RETIRER DES FAVORIS' : '⭐ AJOUTER AUX FAVORIS';
    rendreListe();
    if (s.lat != null && s.lon != null) {
      try {
        // on compte l'écoute (statistique publique de l'annuaire)
        fetch(`${SERVEURS[0]}/json/url/${s.id}`).catch(() => {});
      } catch { /* optionnel */ }
    }
    // ouvre la fiche lieu si dispo
    surMessage?.(`📻 ${s.nom}`);
  }

  async function ici() {
    const { lat, lon, rayon } = pointDeVue();
    surMessage?.('📻 Recherche des radios autour…');
    stations = await chercherStations({ lat, lon, rayon, limite: 40 });
    rendreListe(`${stations.length} station(s) dans un rayon de ${Math.round(rayon / 1000)} km`);
  }

  el.querySelector('[data-a="ici"]').addEventListener('click', ici);
  el.querySelector('[data-a="pays"]').addEventListener('click', async () => {
    stations = await chercherStations({ pays: 'FR', limite: 40 });
    rendreListe(`${stations.length} station(s) françaises`);
  });
  el.querySelector('[data-a="top"]').addEventListener('click', async () => {
    stations = await chercherStations({ limite: 40 });
    rendreListe(`${stations.length} station(s) les plus écoutées`);
  });
  el.querySelector('[data-a="favoris"]').addEventListener('click', () => {
    stations = favoris.slice();
    rendreListe(`${stations.length} favori(s)`);
  });
  el.querySelector('[data-a="stop"]').addEventListener('click', () => {
    audio.pause();
    audio.removeAttribute('src');
    lecteur.style.display = 'none';
  });
  boutonFav.addEventListener('click', () => {
    if (!courante) return;
    if (favoris.some((f) => f.id === courante.id)) favoris = favoris.filter((f) => f.id !== courante.id);
    else favoris.push(courante);
    favorisEcrire(favoris);
    boutonFav.textContent = favoris.some((f) => f.id === courante.id) ? '⭐ RETIRER DES FAVORIS' : '⭐ AJOUTER AUX FAVORIS';
  });
  lecteur.querySelector('[data-a="aller"]').addEventListener('click', () => {
    if (courante?.lat == null) { surMessage?.('⚠ Cette station n’a pas de position connue.'); return; }
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(courante.lon, courante.lat, 4_000), duration: 2.6,
    });
  });
  champ.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const q = champ.value.trim();
    if (!q) return ici();
    const params = /^[A-Za-z]{2}$/.test(q) ? { pays: q.toUpperCase() } : { nom: q };
    stations = await chercherStations({ ...params, limite: 40 });
    rendreListe(`${stations.length} résultat(s) pour « ${q} »`);
  });

  // clic sur une pastille radio du globe = écouter
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((clic) => {
    const objet = viewer.scene.pick(clic.position);
    const id = objet?.id?.properties?.wtRadio?.getValue?.(Cesium.JulianDate.now());
    if (!id) return;
    const s = stations.find((x) => x.id === id);
    if (s) ecouter(s);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return {
    element: el,
    chercher: chercherStations,
    ecouter,
    arreter: () => { audio.pause(); audio.removeAttribute('src'); lecteur.style.display = 'none'; },
    stations: () => stations.slice(),
    courante: () => courante,
    effacerMarques: () => ds.entities.removeAll(),
  };
}
