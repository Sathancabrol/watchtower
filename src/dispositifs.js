/**
 * WATCHTOWER — DISPOSITIFS : CAMÉRAS, MICROS, CAPTEURS SUR LA CARTE.
 *
 * Dans la vue INTEL, les **dispositifs** sont visibles comme les autres
 * catégories : la webcam de l'utilisateur, une caméra posée dehors, un micro
 * public devant la mairie, le micro de la machine. Un clic sur l'icône ouvre
 * la FICHE de l'objet ; la fiche contient une **mini-fenêtre de direct**
 * (vidéo / image / son) ; un clic sur la mini-fenêtre ouvre la **fiche
 * détaillée** : le site, le type d'objet, les outils utilisés, les personnes
 * présentes (estimées), la description de la scène.
 *
 * Trois niveaux, jamais imposés :
 *   🟢 GRATUIT — OpenStreetMap (caméras de surveillance recensées) + tes
 *      propres périphériques (getUserMedia) + les flux que tu ajoutes ;
 *   🔵 COMPTE  — synchroniser ta liste de flux, des services avec clé ;
 *   🟣 PAYANT  — réseaux de caméras premium (Windy…), optionnels.
 *
 * Traçabilité : chaque dispositif porte sa source (URL + licence). Ce qui est
 * ESTIMÉ (mouvement, niveau sonore, présence) est calculé LOCALEMENT et
 * annoté comme tel — aucune donnée ne quitte la machine.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';
import { ajouterTrace } from './tracabilite.js';

/** Types de dispositifs gérés. */
export const TYPES = Object.freeze([
  { id: 'camera_publique', nom: 'Caméra publique', ic: '📷', niveau: 'gratuit', source: 'OpenStreetMap (ODbL)' },
  { id: 'webcam_locale', nom: 'Ma webcam', ic: '🎥', niveau: 'gratuit', source: 'périphérique local (getUserMedia)' },
  { id: 'flux_ajoute', nom: 'Flux ajouté', ic: '📡', niveau: 'gratuit', source: 'URL fournie par l’utilisateur' },
  { id: 'micro_public', nom: 'Micro public', ic: '🎙', niveau: 'gratuit', source: 'point d’écoute déclaré' },
  { id: 'micro_local', nom: 'Mon micro', ic: '🎤', niveau: 'gratuit', source: 'périphérique local (getUserMedia)' },
  { id: 'capteur', nom: 'Capteur', ic: '🌡', niveau: 'gratuit', source: 'Open-Meteo / capteur déclaré' },
  { id: 'reseau_premium', nom: 'Réseau de caméras', ic: '🛰', niveau: 'payant', source: 'service payant (clé requise)' },
]);

/** Niveau requis pour un type (repli : payant). */
export function niveauRequis(type = '') {
  return TYPES.find((t) => t.id === String(type))?.niveau || 'payant';
}

/** Icône d'un type. */
export function iconePour(type = '') {
  return TYPES.find((t) => t.id === String(type))?.ic || '📷';
}

/** Source documentée d'un type. */
export function sourcePour(type = '') {
  return TYPES.find((t) => t.id === String(type))?.source || 'source inconnue';
}

/** Requête Overpass des caméras / micros recensés autour d'un point. */
export function urlDispositifs(lat, lon, rayon = 1200) {
  const R = Math.max(100, Math.round(rayon));
  const p = `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;
  return `[out:json][timeout:20];(nwr(around:${R},${p})[man_made=surveillance];nwr(around:${R},${p})[surveillance~"^(public|outdoor)$"];);out center tags 80;`;
}

/** Extrait les dispositifs d'une réponse Overpass. */
export function dispositifsDepuisReponse(json) {
  const els = Array.isArray(json?.elements) ? json.elements : [];
  const out = [];
  for (const e of els) {
    const lat = Number.isFinite(e.lat) ? e.lat : e.center?.lat;
    const lon = Number.isFinite(e.lon) ? e.lon : e.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const t = e.tags || {};
    out.push({
      id: `osm/${e.type}/${e.id}`,
      type: 'camera_publique',
      nom: String(t.name || t['camera:mount'] || 'Caméra de surveillance'),
      lat, lon,
      url: String(t['camera:stream'] || t.url || t.contact?.website || ''),
      operateur: String(t.operator || t['surveillance:operator'] || '').trim(),
      support: String(t['camera:mount'] || t.support || '').trim(),
      orientation: Number.isFinite(Number(t['camera:direction'])) ? Number(t['camera:direction']) : null,
      portee: Number.isFinite(Number(t['camera:distance'])) ? Number(t['camera:distance']) : null,
      licence: 'ODbL',
      sourceUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`,
      sourceCle: 'osm',
    });
  }
  return out;
}

/**
 * Description honnête de la scène : on ne reconnaît rien, on MESURE.
 * @param {{mouvement?:number, son?:number, luminosite?:number, flux?:string}} mesure
 * @returns {{texte:string, methode:string}}
 */
export function descriptionScene(mesure = {}) {
  const aMouvement = mesure.mouvement != null && Number.isFinite(Number(mesure.mouvement));
  const aSon = mesure.son != null && Number.isFinite(Number(mesure.son));
  const m = aMouvement ? Number(mesure.mouvement) : null;
  const s = aSon ? Number(mesure.son) : null;
  const l = Number(mesure.luminosite);
  const traits = [];
  if (m !== null) traits.push(m < 1 ? 'scène quasi immobile' : m < 8 ? 'légers mouvements' : m < 25 ? 'mouvements nets' : 'scène très animée');
  if (s !== null) traits.push(s < 0.02 ? 'silence' : s < 0.12 ? 'ambiance sonore faible' : s < 0.35 ? 'ambiance sonore modérée' : 'niveau sonore élevé');
  if (Number.isFinite(l)) traits.push(l < 0.18 ? 'très sombre' : l < 0.45 ? 'pénombre' : l < 0.75 ? 'lumière moyenne' : 'fortement éclairé');
  return {
    texte: traits.length ? traits.join(' · ') : 'aucune mesure disponible',
    methode: 'mesuré localement (différence d’images et niveau audio) — aucune analyse de personne, aucun envoi',
  };
}

/** Estime grossièrement la « présence » : une agitation, pas un comptage. */
export function estimerPresence(mesure = {}) {
  const m = Number(mesure.mouvement) || 0;
  const s = Number(mesure.son) || 0;
  if (m < 1 && s < 0.03) return { niveau: 'aucune activité', ic: '⚪' };
  if (m < 8 && s < 0.12) return { niveau: 'présence possible', ic: '🟡' };
  if (m < 25) return { niveau: 'activité détectée', ic: '🟠' };
  return { niveau: 'forte activité', ic: '🔴' };
}

/** Lignes de la fiche détaillée d'un dispositif. */
export function resumer(d = {}) {
  const lignes = [];
  lignes.push(`objet : ${iconePour(d.type)} ${d.nom || 'sans nom'}`);
  lignes.push(`type : ${TYPES.find((t) => t.id === d.type)?.nom || d.type || 'inconnu'}`);
  if (d.operateur) lignes.push(`exploitant : ${d.operateur}`);
  if (d.support) lignes.push(`support : ${d.support}`);
  if (Number.isFinite(d.orientation)) lignes.push(`orientation : ${Math.round(d.orientation)}°`);
  if (Number.isFinite(d.portee)) lignes.push(`portée : ${d.portee} m`);
  if (d.url) lignes.push(`flux : ${d.url}`);
  lignes.push(`position : ${Number(d.lat).toFixed(5)}, ${Number(d.lon).toFixed(5)}`);
  lignes.push(`source : ${sourcePour(d.type)}${d.sourceUrl ? ` — ${d.sourceUrl}` : ''}`);
  return lignes.join('\n');
}

const CLE_FLUX = 'watchtower.dispositifs.v1';

/** Flux ajoutés par l'utilisateur (stockés localement). */
export function lireFlux(stockage = null) {
  try {
    const s = stockage || (typeof window !== 'undefined' ? window.localStorage : null);
    if (!s) return [];
    const brut = s.getItem(CLE_FLUX);
    const l = brut ? JSON.parse(brut) : [];
    return Array.isArray(l) ? l : [];
  } catch {
    return [];
  }
}

/** Enregistre un flux (image MJPEG, HLS, page embarquable). */
export function enregistrerFlux(flux, stockage = null) {
  const l = lireFlux(stockage).filter((f) => f?.id !== flux?.id);
  l.push({ ...flux, id: flux?.id || `flux-${Date.now()}` });
  try {
    const s = stockage || (typeof window !== 'undefined' ? window.localStorage : null);
    s?.setItem(CLE_FLUX, JSON.stringify(l));
  } catch { /* stockage plein ou bloqué */ }
  return l;
}

/** Devine la nature d'un flux depuis son URL. */
export function natureFlux(url = '') {
  const u = String(url || '').toLowerCase();
  if (!u) return 'aucun';
  if (/\.m3u8/.test(u)) return 'hls';
  if (/\.(jpe?g|png|webp)(\?|$)|mjpg|mjpeg|snapshot|image|frame/.test(u)) return 'image';
  if (/youtube|youtu\.be|twitch|dailymotion/.test(u)) return 'page';
  if (/\.(mp4|webm|ogg)(\?|$)/.test(u)) return 'video';
  return 'inconnu';
}

const CSS = `
#wt-dispositifs {
  position: fixed; left: 12px; bottom: 12px; z-index: 970; width: 280px; display: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; color: #e8eaed;
  background: rgba(8,12,18,.95); border: 1px solid rgba(0,212,255,.45); border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0,0,0,.55); overflow: hidden; max-height: 66vh;
}
#wt-dispositifs .t { display: flex; gap: 6px; align-items: center; padding: 7px 10px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; font-weight: 700; color: #00d4ff; background: rgba(0,212,255,.08); }
#wt-dispositifs .t button { margin-left: auto; background: none; border: none; color: inherit; font-size: 12px; cursor: pointer; }
#wt-dispositifs .c { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
#wt-dispositifs .b { cursor: pointer; padding: 6px 8px; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; border-radius: 8px; background: rgba(0,212,255,.1);
  border: 1px solid rgba(0,212,255,.5); color: #00d4ff; }
#wt-dispositifs .b.actif { background: rgba(0,212,255,.28); color: #fff; }
#wt-dispositifs input, #wt-dispositifs select {
  padding: 6px 8px; font-family: inherit; font-size: 9.5px; border-radius: 7px;
  background: rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.12); color: inherit; outline: none; }
#wt-dispositifs .liste { display: flex; flex-direction: column; gap: 3px; max-height: 30vh; overflow-y: auto; }
#wt-dispositifs .disp { cursor: pointer; text-align: left; padding: 5px 7px; border-radius: 7px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  color: inherit; font-family: inherit; font-size: 9px; display: flex; gap: 6px; align-items: center; }
#wt-dispositifs .disp:hover { border-color: #00d4ff; }
#wt-dispositifs .note { color: rgba(232,234,237,.45); line-height: 1.6; font-size: 8px; }
#wt-dispositifs .note a { color: #00d4ff; }

/* mini-fenêtre de direct */
#wt-live {
  position: fixed; right: 14px; bottom: 14px; z-index: 975; width: 300px; display: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; color: #e8eaed;
  background: rgba(6,10,14,.96); border: 1px solid rgba(0,212,255,.5); border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,.7); overflow: hidden;
}
#wt-live.ouvert { display: block; }
#wt-live .t { display: flex; gap: 6px; align-items: center; padding: 7px 9px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; color: #00d4ff; background: rgba(0,212,255,.08); }
#wt-live .t button { margin-left: auto; background: none; border: none; color: inherit; font-size: 12px; cursor: pointer; }
#wt-live .cadre { position: relative; width: 100%; aspect-ratio: 16/9; background: #05080b; cursor: zoom-in; }
#wt-live .cadre img, #wt-live .cadre video { width: 100%; height: 100%; object-fit: cover; display: block; }
#wt-live .vide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 8px; font-size: 9px; color: rgba(232,234,237,.5); line-height: 1.7; }
#wt-live .mes { position: absolute; left: 6px; bottom: 6px; right: 6px; display: flex; gap: 6px; align-items: center;
  font-size: 8px; padding: 3px 6px; border-radius: 6px; background: rgba(0,0,0,.6); }
#wt-live .jauge { flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,.15); overflow: hidden; }
#wt-live .jauge i { display: block; height: 100%; background: #7ef0c0; }
#wt-live .bas { display: flex; gap: 6px; padding: 7px; }
#wt-live .bas button { flex: 1; cursor: pointer; font-family: inherit; font-size: 9px; padding: 6px; border-radius: 7px;
  background: rgba(0,212,255,.12); border: 1px solid rgba(0,212,255,.45); color: #00d4ff; }
#wt-live .rec { position: absolute; right: 8px; top: 8px; font-size: 8px; padding: 2px 6px; border-radius: 999px;
  background: rgba(200,30,30,.8); color: #fff; letter-spacing: 1px; }
#wt-live.grand { width: min(680px, 92vw); }
`;

/**
 * @param {object} viewer
 * @param {{fiche?:Function, surMessage?:Function, comptes?:object}} [options]
 */
export function initDispositifs(viewer, options = {}) {
  const { fiche = null, surMessage = null } = options || {};
  let style = document.getElementById('wt-dispositifs-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-dispositifs-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const ds = new Cesium.CustomDataSource('wt-dispositifs');
  viewer.dataSources.add(ds);

  // ── panneau ────────────────────────────────────────────────────────────
  const el = document.createElement('div');
  el.id = 'wt-dispositifs';
  el.innerHTML = `
    <div class="t">🎥 DISPOSITIFS — CAMÉRAS, MICROS, CAPTEURS<button type="button" class="fermer">✕</button></div>
    <div class="c">
      <button class="b scan" type="button">🔎 CHERCHER AUTOUR DE LA VUE</button>
      <div class="ligne">
        <button class="b cam" type="button">🎥 MA WEBCAM</button>
        <button class="b micro" type="button">🎤 MON MICRO</button>
      </div>
      <input class="url" type="text" placeholder="Coller l’URL d’un flux (image, MJPEG, m3u8…)" spellcheck="false" />
      <input class="nom" type="text" placeholder="Nom du flux (ex : caméra du port)" spellcheck="false" />
      <button class="b ajouter" type="button">➕ AJOUTER CE FLUX AU POINT VISÉ</button>
      <div class="liste"></div>
      <div class="note">🟢 gratuit : caméras recensées par <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener">OpenStreetMap</a>,
      tes périphériques (autorisation du navigateur) et tes flux. 🟣 payant : réseaux de caméras premium (clé, optionnels).
      Rien n’est analysé en ligne : mouvement et son sont mesurés dans le navigateur.</div>
    </div>`;
  document.body.appendChild(el);
  rendreDeplacable(el, el.querySelector('.t'));

  // ── mini-fenêtre de direct ─────────────────────────────────────────────
  const live = document.createElement('div');
  live.id = 'wt-live';
  live.innerHTML = `
    <div class="t">📡 DIRECT<button type="button" class="fermer">✕</button></div>
    <div class="cadre">
      <div class="vide">Aucun flux.</div>
      <span class="rec">● LIVE</span>
      <div class="mes"><span class="txt">—</span><span class="jauge"><i style="width:0%"></i></span></div>
    </div>
    <div class="bas">
      <button class="grand" type="button">⛶ FICHE DÉTAILLÉE</button>
      <button class="tour" type="button">⏸ PAUSE</button>
    </div>`;
  document.body.appendChild(live);
  rendreDeplacable(live, live.querySelector('.t'));

  const listeEl = el.querySelector('.liste');
  const cadreEl = live.querySelector('.cadre');
  const mesEl = live.querySelector('.mes .txt');
  const jaugeEl = live.querySelector('.jauge i');
  let devices = [];
  let courant = null;
  let fluxLocal = null;   // MediaStream du périphérique de l'utilisateur
  let minuteur = null;
  let actif = false;
  let mesure = { mouvement: 0, son: 0, luminosite: NaN };
  let analyse = null;     // contexte audio
  let dernierImage = null;
  let enPause = false;

  function iconeDevice(d) {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const g = c.getContext('2d');
    const couleur = d.type === 'micro_local' || d.type === 'micro_public' ? '#ffb347'
      : d.type === 'webcam_locale' ? '#7ef0c0' : '#00d4ff';
    g.beginPath(); g.arc(48, 48, 30, 0, Math.PI * 2);
    g.fillStyle = 'rgba(6,12,18,.9)'; g.fill();
    g.lineWidth = 5; g.strokeStyle = couleur; g.stroke();
    g.fillStyle = couleur;
    g.font = '30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(iconePour(d.type), 48, 50);
    return c.toDataURL();
  }

  function rendreCarte() {
    ds.entities.removeAll();
    for (const d of devices) {
      ds.entities.add({
        id: `wt-disp-${d.id}`,
        name: d.nom,
        position: Cesium.Cartesian3.fromDegrees(d.lon, d.lat, 12),
        billboard: {
          image: iconeDevice(d),
          width: 34, height: 34,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: d.nom,
          font: '600 11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.fromCssColorString('#cfe9f5'),
          outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  function rendreListe() {
    listeEl.innerHTML = '';
    if (!devices.length) {
      listeEl.innerHTML = '<div style="opacity:.5;font-size:8.5px">Aucun dispositif — « CHERCHER » ou ajoute un flux.</div>';
      return;
    }
    for (const d of devices) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'disp';
      b.innerHTML = `<span>${iconePour(d.type)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.nom}</span>`;
      b.addEventListener('click', () => ouvrir(d));
      listeEl.appendChild(b);
    }
  }

  // ── ouverture d'un dispositif : mini-fenêtre + fiche ───────────────────
  async function ouvrir(d) {
    courant = d;
    live.classList.add('ouvert');
    live.querySelector('.t').firstChild.textContent = `📡 ${d.nom}`;
    arreterFlux();
    const cadre = cadreEl;
    cadre.querySelectorAll('img,video').forEach((n) => n.remove());
    const vide = cadre.querySelector('.vide');

    if (d.type === 'webcam_locale' || d.type === 'micro_local') {
      try {
        const contraintes = d.type === 'micro_local' ? { audio: true } : { video: { width: 640 }, audio: false };
        fluxLocal = await navigator.mediaDevices.getUserMedia(contraintes);
        if (d.type === 'micro_local') {
          demarrerAnalyseAudio(fluxLocal);
          vide.textContent = '🎤 Micro local — parle, la jauge réagit. Aucun enregistrement.';
          vide.style.display = '';
        } else {
          const v = document.createElement('video');
          v.autoplay = true; v.muted = true; v.playsInline = true;
          v.srcObject = fluxLocal;
          cadre.appendChild(v);
          vide.style.display = 'none';
          demarrerAnalyseVideo(v);
        }
      } catch (e) {
        vide.style.display = '';
        vide.textContent = `⛔ Accès refusé : ${e?.name || e}. Autorise le périphérique dans le navigateur.`;
      }
    } else if (d.url) {
      const nature = natureFlux(d.url);
      if (nature === 'image') {
        const img = document.createElement('img');
        img.alt = d.nom;
        img.src = d.url;
        img.referrerPolicy = 'no-referrer';
        // rafraîchissement : l'URL d'une image « snapshot » change à chaque appel
        minuteur = window.setInterval(() => { img.src = `${d.url}${d.url.includes('?') ? '&' : '?'}_=${Date.now()}`; }, 1500);
        img.addEventListener('load', () => demarrerAnalyseVideo(img));
        img.addEventListener('error', () => { vide.style.display = ''; vide.textContent = '⛔ Flux injoignable (URL expirée, CORS, ou service éteint).'; });
        cadre.appendChild(img);
        vide.style.display = 'none';
      } else if (nature === 'hls' || nature === 'video') {
        const v = document.createElement('video');
        v.autoplay = true; v.muted = true; v.playsInline = true; v.loop = true;
        v.src = d.url;
        v.addEventListener('error', () => { vide.style.display = ''; vide.textContent = '⛔ Flux vidéo injoignable (format non géré par le navigateur, souvent du HLS sans lecteur).'; });
        cadre.appendChild(v);
        vide.style.display = 'none';
        demarrerAnalyseVideo(v);
      } else {
        vide.style.display = '';
        vide.innerHTML = `Flux « ${nature} » — ouvre-le dans un onglet :<br><a href="${d.url}" target="_blank" rel="noopener" style="color:#00d4ff">${d.url}</a>`;
      }
    } else {
      vide.style.display = '';
      vide.textContent = '📷 Caméra recensée (OpenStreetMap) sans flux public — clic sur la fiche pour la source.';
    }

    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(d.lon, d.lat, 420), duration: 1.6 });
    fiche?.(d.lon, d.lat, d.nom, { dispositif: d });
    ajouterTrace?.({
      quoi: `dispositif ouvert : ${d.nom}`,
      source: sourcePour(d.type),
      url: d.url || d.sourceUrl || '',
      nature: 'consultation direct',
    });
    surMessage?.(`${iconePour(d.type)} ${d.nom} — ${sourcePour(d.type)}`);
  }

  /** Analyse LOCALE de l'image : luminosité + mouvement (différence). */
  function demarrerAnalyseVideo(source) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const g = c.getContext('2d', { willReadFrequently: true });
    dernierImage = null;
    window.clearInterval(analyse?.video);
    const tick = () => {
      if (enPause) return;
      try {
        g.drawImage(source, 0, 0, c.width, c.height);
        const px = g.getImageData(0, 0, c.width, c.height).data;
        let lum = 0;
        for (let i = 0; i < px.length; i += 4) lum += (px[i] + px[i + 1] + px[i + 2]) / 3;
        lum /= (px.length / 4 * 255);
        let diff = 0;
        if (dernierImage) {
          for (let i = 0; i < px.length; i += 4) diff += Math.abs(px[i] - dernierImage[i]);
          diff /= (px.length / 4 * 255);
        }
        dernierImage = px.slice();
        mesure = { ...mesure, luminosite: lum, mouvement: Math.min(100, diff * 400) };
        peindreMesure();
      } catch { /* image protégée (CORS) : on n'analyse pas */ }
    };
    analyse = { ...(analyse || {}), video: window.setInterval(tick, 700) };
    tick();
  }

  /** Analyse LOCALE du son (niveau RMS). */
  function demarrerAnalyseAudio(stream) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const anal = ctx.createAnalyser();
      anal.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(anal);
      const buf = new Uint8Array(anal.frequencyBinCount);
      window.clearInterval(analyse?.audio);
      const t = window.setInterval(() => {
        if (enPause) return;
        anal.getByteTimeDomainData(buf);
        let s = 0;
        for (const v of buf) { const x = (v - 128) / 128; s += x * x; }
        mesure = { ...mesure, son: Math.sqrt(s / buf.length) };
        peindreMesure();
      }, 400);
      analyse = { ...(analyse || {}), audio: t, ctx };
    } catch { /* pas d'audio */ }
  }

  function peindreMesure() {
    const d = descriptionScene(mesure);
    const p = estimerPresence(mesure);
    mesEl.textContent = `${p.ic} ${p.niveau}`;
    const v = Math.max(mesure.mouvement, (mesure.son || 0) * 100);
    jaugeEl.style.width = `${Math.min(100, Math.max(2, v))}%`;
    live.querySelector('.mes').title = `${d.texte} — ${d.methode}`;
  }

  function arreterFlux() {
    window.clearInterval(minuteur); minuteur = null;
    window.clearInterval(analyse?.video);
    window.clearInterval(analyse?.audio);
    try { analyse?.ctx?.close?.(); } catch { /* déjà fermé */ }
    try { fluxLocal?.getTracks?.().forEach((t) => t.stop()); } catch { /* néant */ }
    fluxLocal = null; analyse = null;
    mesure = { mouvement: 0, son: 0, luminosite: NaN };
  }

  live.querySelector('.fermer').addEventListener('click', () => { live.classList.remove('ouvert'); arreterFlux(); });
  live.querySelector('.tour').addEventListener('click', (e) => {
    enPause = !enPause;
    e.target.textContent = enPause ? '▶ REPRENDRE' : '⛸ PAUSE';
  });
  live.querySelector('.grand').addEventListener('click', () => {
    if (!courant) return;
    live.classList.add('grand');
    ficheDetaillee(courant);
  });
  cadreEl.addEventListener('click', () => { if (courant) ficheDetaillee(courant); });

  /** La fiche DÉTAILLÉE de l'objet (site, type, outils, présence, scène). */
  function ficheDetaillee(d) {
    const p = estimerPresence(mesure);
    const s = descriptionScene(mesure);
    const outils = [d.support, d.operateur, d.type === 'webcam_locale' ? 'webcam locale' : '', d.url ? `flux ${natureFlux(d.url)}` : '']
      .filter(Boolean).join(' · ');
    const texte = [
      `## ${iconePour(d.type)} ${d.nom}`,
      '',
      `**site** : ${Number(d.lat).toFixed(5)}, ${Number(d.lon).toFixed(5)}`,
      `**type d'objet** : ${TYPES.find((t) => t.id === d.type)?.nom || d.type}`,
      outils ? `**outils / support** : ${outils}` : '',
      `**activité estimée** : ${p.ic} ${p.niveau}`,
      `**description de la scène** : ${s.texte}`,
      `**méthode** : ${s.methode}`,
      `**source** : ${sourcePour(d.type)}${d.sourceUrl ? ` — ${d.sourceUrl}` : ''}`,
    ].filter(Boolean).join('\n');
    fiche?.(d.lon, d.lat, d.nom, { dispositif: d, detail: texte, titre: 'DISPOSITIF' });
    surMessage?.(`🧾 Fiche détaillée — ${d.nom}`);
  }

  // ── actions du panneau ─────────────────────────────────────────────────
  async function chercher() {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    surMessage?.('🔎 Caméras recensées (OpenStreetMap)…');
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(urlDispositifs(lat, lon, 1500))}`,
      });
      const trouve = dispositifsDepuisReponse(await r.json());
      if (!trouve.length) { surMessage?.('Aucune caméra recensée à 1,5 km — ajoute un flux à la main.'); return; }
      const connus = new Set(devices.map((d) => d.id));
      devices = [...devices, ...trouve.filter((d) => !connus.has(d.id))];
      rendreCarte(); rendreListe();
      surMessage?.(`📷 ${trouve.length} caméra(s) recensée(s) — ${devices.length} dispositif(s) au total.`);
    } catch {
      surMessage?.('Overpass injoignable (réseau) — ajoute un flux à la main.');
    }
  }

  el.querySelector('.scan').addEventListener('click', chercher);
  el.querySelector('.fermer').addEventListener('click', () => { el.style.display = 'none'; actif = false; });
  el.querySelector('.cam').addEventListener('click', () => ajouterLocal('webcam_locale'));
  el.querySelector('.micro').addEventListener('click', () => ajouterLocal('micro_local'));
  el.querySelector('.ajouter').addEventListener('click', () => {
    const url = el.querySelector('.url').value.trim();
    if (!url) { surMessage?.('Colle d’abord l’URL du flux.'); return; }
    const c = viewer.camera.positionCartographic;
    const d = {
      id: `flux-${Date.now()}`,
      type: 'flux_ajoute',
      nom: el.querySelector('.nom').value.trim() || 'Flux ajouté',
      lat: Cesium.Math.toDegrees(c.latitude),
      lon: Cesium.Math.toDegrees(c.longitude),
      url, licence: 'à vérifier', sourceUrl: url,
    };
    devices = [...devices, d];
    enregistrerFlux(d);
    rendreCarte(); rendreListe(); ouvrir(d);
  });

  function ajouterLocal(type) {
    const c = viewer.camera.positionCartographic;
    const d = {
      id: `${type}-${Date.now()}`,
      type,
      nom: type === 'micro_local' ? 'Mon micro' : 'Ma webcam',
      lat: Cesium.Math.toDegrees(c.latitude),
      lon: Cesium.Math.toDegrees(c.longitude),
      licence: 'local', sourceUrl: '',
    };
    devices = [...devices, d];
    rendreCarte(); rendreListe(); ouvrir(d);
  }

  rendreListe();

  return {
    element: el,
    /** Le panneau + la couche carte. */
    basculer(etat) {
      const on = etat === undefined ? !actif : Boolean(etat);
      actif = on;
      el.style.display = on ? '' : 'none';
      if (on) rendreCarte();
      else { ds.entities.removeAll(); arreterFlux(); live.classList.remove('ouvert'); }
      return on;
    },
    chercher,
    ouvrir,
    /** Ajoute un dispositif (depuis un autre module, ex : le palais). */
    ajouter(d) {
      if (!d || !Number.isFinite(d.lat) || !Number.isFinite(d.lon)) return false;
      devices = [...devices.filter((x) => x.id !== d.id), d];
      rendreCarte(); rendreListe();
      return true;
    },
    liste: () => devices.slice(),
    /** La mini-fenêtre de direct (pour l'ouvrir depuis le palais). */
    live,
    mesure: () => ({ ...mesure }),
    arreterFlux,
  };
}
