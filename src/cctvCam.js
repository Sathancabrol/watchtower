/**
 * WATCHTOWER — 📷 CAMÉRAS GRATUITES (CCTV / trafic / ville).
 *
 * Sources 100 % gratuites, sans compte :
 *  1) Windy Webcams API — clé de démonstration PUBLIQUE fournie par Windy
 *     (gratuite, limitations de débit) : caméras monde dont trafic routier,
 *     ports, météo. Une clé personnelle (gratuite à créer) peut remplacer la
 *     démo : champ « clé Windy » (mémorisée en local).
 *  2) MapCam (mapcam.live) — plateforme open source de caméras partagées
 *     (API publique, sans clé).
 *
 * Affichage : flux HLS (H.264) quand la caméra est en HTTPS (hls.js chargé
 * à la volée), sinon image JPEG rafraîchie toutes les 5 s. Les flux HTTP
 * (non sécurisés) sont signalés : le navigateur HTTPS les bloque.
 */

import * as Cesium from 'cesium';

const KEY_WINDY = 'watchtower.windyKey';
// clé de démonstration PUBLIQUE documentée par Windy (api.windy.com/docs)
const WINDY_DEMO_KEY = '43b79c1e884a15f1d8c324b9978505d2';
const HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';

const CSS = `
#wt-cam { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; font-size: 10px; }
#wt-cam .c-rang { display: flex; gap: 5px; align-items: center; }
#wt-cam .c-rang > * { flex: 1; min-width: 0; }
#wt-cam input, #wt-cam select { padding: 7px 9px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 9.5px; outline: none; }
#wt-cam .c-btn { cursor: pointer; padding: 8px 10px; border-radius: 8px; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; }
#wt-cam .c-btn:hover { background: rgba(0,212,255,0.2); }
#wt-cam .c-statut { color: rgba(232,234,237,0.55); line-height: 1.6; font-size: 9px; }
#wt-cam .c-cam { display: flex; gap: 7px; align-items: center; width: 100%; text-align: left; padding: 5px 7px; border-radius: 8px; font-family: inherit; font-size: 9.5px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: inherit; line-height: 1.4; }
#wt-cam .c-cam:hover { border-color: #00d4ff; }
#wt-cam .c-cam img { width: 54px; height: 36px; object-fit: cover; border-radius: 5px; background: #000; flex: none; }
#wt-cam .c-cam .d { margin-left: auto; color: #00d4ff; font-size: 8.5px; white-space: nowrap; }
#wt-cam-vue { position: fixed; inset: 0; z-index: 2800; display: flex; align-items: center; justify-content: center; background: rgba(4,7,12,0.7); font-family: var(--font-mono, monospace); }
#wt-cam-vue .boite { width: min(680px, 94vw); background: rgba(8,12,20,0.97); border: 1px solid #00d4ff; border-radius: 14px; color: #e8eaed; overflow: hidden; }
#wt-cam-vue .tete { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(0,212,255,0.3); cursor: move; font-size: 10px; letter-spacing: 1px; }
#wt-cam-vue .tete .x { cursor: pointer; margin-left: auto; background: none; border: none; color: rgba(232,234,237,0.7); font-size: 14px; font-family: inherit; }
#wt-cam-vue .ecran { width: 100%; aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; position: relative; }
#wt-cam-vue .ecran video, #wt-cam-vue .ecran img { width: 100%; height: 100%; object-fit: contain; }
#wt-cam-vue .ecran .msg { color: rgba(232,234,237,0.6); font-size: 10px; padding: 16px; text-align: center; line-height: 1.7; }
#wt-cam-vue .pied { display: flex; gap: 6px; padding: 10px 14px; flex-wrap: wrap; }
#wt-cam-vue .pied button { cursor: pointer; padding: 7px 10px; font-family: inherit; font-size: 9px; font-weight: 700; letter-spacing: 1px; border-radius: 8px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.45); color: #00d4ff; }
#wt-cam-vue .live { color: #f05252; font-weight: 800; letter-spacing: 2px; animation: wt-cam-blink 1.4s infinite; }
@keyframes wt-cam-blink { 50% { opacity: 0.25; } }
`;

function distKm(a, b, c, d) {
  const R = 6371; const rad = Math.PI / 180;
  const x = Math.sin(((c - a) * rad) / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function chargerHls() {
  if (window.Hls) return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = HLS_CDN;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    window.setTimeout(() => resolve(false), 8000);
    document.head.appendChild(s);
  });
}

async function camsWindy(lat, lon, km, cle) {
  const key = cle || WINDY_DEMO_KEY;
  const r = await fetch(`https://api.windy.com/api/webcams/v2/list/nearby=${lat.toFixed(3)},${lon.toFixed(3)},${km}?show=webcams:location,image,player&key=${key}`);
  const d = await r.json();
  if (d?.status && d.status !== 'ok') throw new Error(d.status);
  return (d?.data || []).map((w) => ({
    nom: w.location?.description || 'Caméra',
    lat: w.location?.lat, lon: w.location?.lon,
    pays: w.location?.country || '',
    image: w.image?.url || '',
    flux: w.player?.url || '',
    fmtFlux: w.player?.format || '',
    src: 'Windy',
  })).filter((w) => Number.isFinite(w.lat));
}

async function camsMapCam(lat, lon, km) {
  const dLat = km / 111.32;
  const dLon = km / (111.32 * Math.cos((lat * Math.PI) / 180) || 1);
  const r = await fetch(`https://fr.mapcam.live/api/webcams?min_lat=${(lat - dLat).toFixed(4)}&min_lon=${(lon - dLon).toFixed(4)}&max_lat=${(lat + dLat).toFixed(4)}&max_lon=${(lon + dLon).toFixed(4)}`);
  if (!r.ok) throw new Error(`mapcam ${r.status}`);
  const d = await r.json();
  const liste = Array.isArray(d) ? d : (d?.webcams || d?.data || []);
  return liste.map((w) => ({
    nom: w.name || w.title || 'Caméra MapCam',
    lat: w.lat ?? w.latitude, lon: w.lon ?? w.longitude,
    pays: w.country || w.country_name || '',
    image: w.snapshot || w.thumb || w.image || '',
    flux: w.stream || w.url || '',
    fmtFlux: /m3u8/.test(w.stream || w.url || '') ? 'M3U8' : '',
    src: 'MapCam',
  })).filter((w) => Number.isFinite(w.lat));
}

export function initCctvCam(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'wt-cam';
  el.innerHTML = `
    <div class="c-rang">
      <select class="c-rayon"><option value="15">Rayon 15 km</option><option value="40" selected>40 km</option><option value="100">100 km</option></select>
      <button class="c-btn c-cherche" type="button">📹 RECHERCHER LES CAMÉRAS</button>
    </div>
    <input class="c-cle" type="text" placeholder="Clé Windy perso (optionnel — démo publique par défaut)" />
    <div class="c-statut">Caméras GRATUITES sans compte : trafic, ports, villes —
    sources Windy (clé démo publique) + MapCam (open source). Clic = vision en direct.</div>
    <div class="c-liste" style="display:flex;flex-direction:column;gap:4px;max-height:34vh;overflow-y:auto"></div>`;
  const liste = el.querySelector('.c-liste');
  const statut = el.querySelector('.c-statut');

  let hlsInstance = null;
  let snapTimer = null;
  let vueCam = null;

  function arreterLecture() {
    try { hlsInstance?.destroy(); } catch { /* ok */ }
    hlsInstance = null;
    if (snapTimer) { window.clearInterval(snapTimer); snapTimer = null; }
    vueCam?.remove();
    vueCam = null;
  }

  function ouvrirVue(cam) {
    arreterLecture();
    vueCam = document.createElement('div');
    vueCam.id = 'wt-cam-vue';
    vueCam.innerHTML = `
      <div class="boite">
        <div class="tete"><span class="live">● LIVE</span><span>📷 ${cam.nom} · ${cam.src} ${cam.pays ? `· ${cam.pays}` : ''}</span>
          <button class="x" type="button">✕</button></div>
        <div class="ecran"><div class="msg">⏳ Lancement du flux…</div></div>
        <div class="pied">
          <button class="c-voler" type="button">🗺 ALLER SUR LA CARTE</button>
          <button class="c-fermer" type="button">FERMER</button>
        </div>
      </div>`;
    document.body.appendChild(vueCam);
    vueCam.querySelector('.x').addEventListener('click', arreterLecture);
    vueCam.querySelector('.c-fermer').addEventListener('click', arreterLecture);
    vueCam.querySelector('.c-voler').addEventListener('click', () => {
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, 9000), duration: 2.5 });
    });
    import('./draggable.js').then((m) => m.rendreDeplacable(vueCam.querySelector('.boite'), vueCam.querySelector('.tete'))).catch(() => {});

    const ecran = vueCam.querySelector('.ecran');
    const https = (u) => /^https:\/\//i.test(u || '');
    const flux = cam.flux;

    if (flux && /m3u8/i.test(flux) && https(flux)) {
      chargerHls().then((ok) => {
        if (!vueCam) return;
        if (!ok || !window.Hls) return repliSnapshot(ecran, cam);
        if (!window.Hls.isSupported()) return repliSnapshot(ecran, cam);
        const video = document.createElement('video');
        video.muted = true; video.playsInline = true;
        ecran.innerHTML = '';
        ecran.appendChild(video);
        hlsInstance = new window.Hls({ maxBufferLength: 20 });
        hlsInstance.loadSource(flux);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hlsInstance.on(window.Hls.Events.ERROR, (_e, data) => {
          if (data?.fatal && vueCam) repliSnapshot(ecran, cam);
        });
      });
    } else if (flux && !https(flux)) {
      ecran.querySelector('.msg').innerHTML = '⚠ Flux en HTTP (non sécurisé) — bloqué par le navigateur HTTPS.<br>Essaie la capture image ou une autre caméra.';
      if (cam.image) repliSnapshot(ecran, cam, true);
    } else if (cam.image) {
      repliSnapshot(ecran, cam);
    } else {
      ecran.querySelector('.msg').textContent = '⚠ Cette caméra ne fournit ni flux ni image consultables.';
    }
  }

  function repliSnapshot(ecran, cam, dejaAverti) {
    if (!cam.image) { if (!dejaAverti) ecran.querySelector('.msg').textContent = '⚠ Image indisponible.'; return; }
    ecran.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.onload = () => { if (!dejaAverti && !/m3u8/.test(cam.flux)) ecran.insertAdjacentHTML('afterbegin', '<div style="position:absolute;top:6px;left:8px;font-size:8px;color:rgba(232,234,237,0.7);background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px">📸 CAPTURE — rafraîchie toutes les 5 s</div>'); };
    img.onerror = () => { ecran.insertAdjacentHTML('afterend', ''); img.remove(); ecran.innerHTML = '<div class="msg">⚠ Image inaccessible (source HTTP ou hors ligne).</div>'; };
    img.src = cam.image;
    ecran.appendChild(img);
    snapTimer = window.setInterval(() => { if (img.isConnected) img.src = `${cam.image}${cam.image.includes('?') ? '&' : '?'}t=${Date.now()}`; }, 5000);
  }

  el.querySelector('.c-cherche').addEventListener('click', async () => {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const km = Number(el.querySelector('.c-rayon').value) || 40;
    const cle = el.querySelector('.c-cle').value.trim();
    if (cle) { try { window.localStorage.setItem(KEY_WINDY, cle); } catch { /* plein */ } }
    statut.textContent = '📡 Interrogation des sources gratuites (Windy + MapCam)…';
    liste.innerHTML = '';
    const [w1, w2] = await Promise.allSettled([
      camsWindy(lat, lon, km, cle),
      camsMapCam(lat, lon, km),
    ]);
    const cams = [...(w1.status === 'fulfilled' ? w1.value : []), ...(w2.status === 'fulfilled' ? w2.value : [])];
    // dédoublonnage + tri par distance + préférence HTTPS
    const vus = new Set();
    const uniques = cams
      .filter((w) => { const k = `${w.lat.toFixed(3)},${w.lon.toFixed(3)}`; return vus.has(k) ? false : vus.add(k); })
      .map((w) => ({ ...w, dist: distKm(lat, lon, w.lat, w.lon) }))
      .sort((a, b) => (a.flux ? a.dist - b.dist : 0) || a.dist - b.dist)
      .slice(0, 24);
    if (!uniques.length) {
      statut.innerHTML = `Aucune caméra trouvée dans un rayon de ${km} km. Élargis le rayon.<br>
      ${w1.status === 'rejected' ? 'Windy indisponible (clé démo limitée ? — colle une clé perso gratuite). ' : ''}
      ${w2.status === 'rejected' ? 'MapCam indisponible. ' : ''}`;
      return;
    }
    const nbFlux = uniques.filter((w) => w.flux && /^https:/i.test(w.flux)).length;
    statut.innerHTML = `${uniques.length} caméras (dont ${nbFlux} en flux HTTPS) — clic = vision :`;
    for (const cam of uniques) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'c-cam';
      b.innerHTML = `<img src="${cam.image}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span>${cam.nom}<br><small style="color:rgba(232,234,237,0.45)">${cam.src}${cam.pays ? ` · ${cam.pays}` : ''}${!cam.flux ? ' · 📸 capture' : /^http:\/\//i.test(cam.flux) ? ' · ⚠ flux HTTP bloqué' : ' · ▶ flux'}</small></span>
        <span class="d">${cam.dist < 1 ? '<1' : cam.dist.toFixed(0)} km</span>`;
      b.addEventListener('click', () => ouvrirVue(cam));
      liste.appendChild(b);
    }
  });

  try { el.querySelector('.c-cle').value = window.localStorage.getItem(KEY_WINDY) || ''; } catch { /* ok */ }

  return { element: el };
}
