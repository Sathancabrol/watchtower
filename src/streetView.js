/**
 * WATCHTOWER — VUE DE RUE (STREET VIEW) — sources ouvertes.
 *
 * OpenStreetMap ne fournit pas d'images de rue : ce sont des communautés
 * séparées qui les hébergent, sous licence libre. On interroge donc
 * PANORAMAX (open source, hébergé par l'IGN et par OpenStreetMap France, API
 * STAC/OGC ouverte, sans clé) puis, à défaut, Mapillary (si un jeton est
 * présent). En dernier recours, l'ancienne vue de synthèse 3D est conservée.
 *
 * L'image est affichée dans une fenêtre déplaçable/redimensionnable, avec
 * défilement horizontal au pointeur (et aux flèches) pour regarder autour,
 * et un repère sur le globe qui montre où se trouve la prise de vue.
 */

import * as Cesium from 'cesium';
import { amenagerFenetre } from './fenetres.js';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

const CSS = `
#wt-sv {
  position: fixed; z-index: 1230; right: 18px; bottom: 18px; width: 480px; display: none;
  font-family: var(--font-mono, monospace); font-size: 10px; color: #e8eaed; overflow: hidden;
  background: linear-gradient(180deg, rgba(12,16,26,0.98), rgba(8,11,18,0.98));
  border: 1px solid rgba(0,212,255,0.4); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.65);
}
#wt-sv .s-titre { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 11px;
  font-weight: 800; letter-spacing: 2px; color: #00d4ff; border-bottom: 1px solid rgba(0,212,255,0.2); cursor: grab; }
#wt-sv .s-titre .fermer { margin-left: auto; cursor: pointer; background: none; border: none; color: inherit; font-size: 15px; }
#wt-sv .s-cadre { position: relative; height: 260px; overflow: hidden; background: #05080d; cursor: grab; }
#wt-sv .s-cadre:active { cursor: grabbing; }
#wt-sv .s-cadre img { height: 100%; width: auto; max-width: none; display: block; user-select: none; -webkit-user-drag: none; }
#wt-sv .s-vide { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 20px; line-height: 1.8; color: rgba(232,234,237,0.6); }
#wt-sv .s-barre { display: flex; gap: 6px; align-items: center; padding: 8px 12px; }
#wt-sv .s-btn { cursor: pointer; padding: 6px 9px; border-radius: 7px; font-family: inherit; font-size: 9px;
  font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.35); color: #00d4ff; }
#wt-sv .s-btn:hover { background: rgba(0,212,255,0.24); }
#wt-sv .s-btn[disabled] { opacity: .35; cursor: default; }
#wt-sv .s-meta { margin-left: auto; font-size: 8px; color: rgba(232,234,237,0.5); text-align: right; line-height: 1.5; }
#wt-sv .s-cred { padding: 0 12px 9px; font-size: 8px; color: rgba(232,234,237,0.35); }
#wt-sv .s-cred a { color: rgba(0,212,255,0.7); }
`;

/** Instances Panoramax publiques (STAC/OGC API Features, sans clé). */
export const INSTANCES = Object.freeze([
  { nom: 'Panoramax (monde)', url: 'https://api.panoramax.xyz/api/search' },
  { nom: 'Panoramax IGN (France)', url: 'https://panoramax.ign.fr/api/search' },
]);

/** Construit l'URL de recherche d'une instance pour un point + rayon (m). */
export function urlRecherche(base, lon, lat, rayon = 400, limite = 8) {
  const dLat = rayon / 111_320;
  const dLon = rayon / (111_320 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].map((v) => v.toFixed(6)).join(',');
  return `${base}?bbox=${bbox}&limit=${limite}&orderby=datetime`;
}

/** Extrait l'URL d'image utilisable d'un item STAC Panoramax. */
export function imageDeItem(item) {
  const a = item?.assets || {};
  const candidats = [a.hd?.href, a.preview?.href, a.thumb?.href, item?.properties?.preview, item?.properties?.assets?.hd?.href];
  return candidats.find((u) => typeof u === 'string' && /^https?:/.test(u)) || null;
}

/** Date lisible d'un item STAC. */
export function dateDeItem(item) {
  const brut = item?.properties?.datetime || item?.properties?.['datetime'] || null;
  if (!brut) return '';
  const d = new Date(brut);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR');
}

/**
 * Cherche la photo de rue la plus proche d'un point.
 * @returns {Promise<{url:string, lon:number, lat:number, date:string, source:string, items:Array}|null>}
 */
export async function chercherPanorama(lon, lat, rayon = 400) {
  for (const inst of INSTANCES) {
    try {
      const r = await fetch(urlRecherche(inst.url, lon, lat, rayon), { headers: { Accept: 'application/geo+json' } });
      if (!r.ok) continue;
      const fc = await r.json();
      const items = Array.isArray(fc?.features) ? fc.features : [];
      if (!items.length) continue;
      // le plus proche du point demandé
      const trie = items
        .map((it) => ({
          it,
          d: Math.hypot((it.geometry?.coordinates?.[0] ?? lon) - lon, (it.geometry?.coordinates?.[1] ?? lat) - lat),
        }))
        .sort((a, b) => a.d - b.d);
      for (const { it } of trie) {
        const url = imageDeItem(it);
        if (!url) continue;
        return {
          url,
          lon: it.geometry?.coordinates?.[0] ?? lon,
          lat: it.geometry?.coordinates?.[1] ?? lat,
          date: dateDeItem(it),
          source: inst.nom,
          items: trie.map(({ it: i }) => ({
            url: imageDeItem(i),
            lon: i.geometry?.coordinates?.[0],
            lat: i.geometry?.coordinates?.[1],
            date: dateDeItem(i),
          })).filter((i) => i.url),
        };
      }
    } catch { /* instance suivante */ }
  }
  return null;
}

/** Repli Mapillary (nécessite un jeton fourni par l'utilisateur). */
export async function chercherMapillary(lon, lat, rayon = 300, jeton = '') {
  if (!jeton) return null;
  try {
    const r = await fetch(`https://graph.mapillary.com/images?access_token=${encodeURIComponent(jeton)}&fields=id,thumb_1024_url,captured_at,geometry&bbox=${lon - 0.004},${lat - 0.004},${lon + 0.004},${lat + 0.004}&limit=5`);
    const d = await r.json();
    const img = d?.data?.[0];
    if (!img?.thumb_1024_url) return null;
    return { url: img.thumb_1024_url, lon, lat, date: (img.captured_at || '').toString().slice(0, 10), source: 'Mapillary', items: [] };
  } catch { return null; }
}

/**
 * @param {object} viewer
 * @param {{surMessage?:Function, jetonMapillary?:string}} [options]
 */
export function initStreetView(viewer, options = {}) {
  const { surMessage = null, jetonMapillary = '' } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const fen = document.createElement('div');
  fen.id = 'wt-sv';
  fen.innerHTML = `
    <div class="s-titre">🛣 VUE DE RUE<button class="fermer" type="button" title="Fermer">×</button></div>
    <div class="s-cadre"><div class="s-vide">Recherche d’une vue de rue…</div></div>
    <div class="s-barre">
      <button class="s-btn" data-a="gauche" type="button">◀</button>
      <button class="s-btn" data-a="droite" type="button">▶</button>
      <button class="s-btn" data-a="tourner" type="button">🔄 SUIVANT</button>
      <button class="s-btn" data-a="aller" type="button">✈ Y ALLER</button>
      <div class="s-meta"></div>
    </div>
    <div class="s-cred">Photos de rue libres : <a href="https://panoramax.xyz" target="_blank" rel="noreferrer">Panoramax</a> (IGN / OpenStreetMap France) — licences ouvertes.</div>`;
  document.body.appendChild(fen);
  amenagerFenetre(fen, { cle: 'wt-sv', poignee: fen.querySelector('.s-titre'), redimensionnable: true, minW: 260, minH: 180 });

  const cadre = fen.querySelector('.s-cadre');
  const meta = fen.querySelector('.s-meta');
  const btnGauche = fen.querySelector('[data-a="gauche"]');
  const btnDroite = fen.querySelector('[data-a="droite"]');

  let courant = null;   // {url, lon, lat, date, source, items}
  let index = 0;
  let deplace = null;

  // repère sur le globe montrant la prise de vue
  const ds = new Cesium.CustomDataSource('wt-streetview');
  viewer.dataSources.add(ds);
  function poserRepere(lon, lat) {
    ds.entities.removeAll();
    ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 2),
      billboard: {
        image: cercleIcone(),
        width: 34, height: 34,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: '📷 ICI',
        font: 'bold 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#00d4ff'),
        outlineColor: Cesium.Color.fromCssColorString('#05080d'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    governorRequestRender('wt-streetview');
  }

  // panorama défilant : on glisse l'image horizontalement dans le cadre
  const glisser = (e) => {
    if (!deplace) return;
    const dx = e.clientX - deplace.x;
    cadre.scrollLeft = deplace.left - dx;
    e.preventDefault();
  };
  const lacher = () => {
    deplace = null;
    cadre.style.cursor = 'grab';
    window.removeEventListener('pointermove', glisser);
    window.removeEventListener('pointerup', lacher);
  };
  cadre.addEventListener('pointerdown', (e) => {
    deplace = { x: e.clientX, left: cadre.scrollLeft };
    cadre.style.cursor = 'grabbing';
    window.addEventListener('pointermove', glisser);
    window.addEventListener('pointerup', lacher);
  });
  const pas = () => Math.max(80, cadre.clientWidth * 0.35);
  btnGauche.addEventListener('click', () => { cadre.scrollLeft -= pas(); });
  btnDroite.addEventListener('click', () => { cadre.scrollLeft += pas(); });

  function afficher(p) {
    courant = p;
    index = 0;
    cadre.innerHTML = '';
    cadre.scrollLeft = 0;
    if (!p) {
      cadre.innerHTML = `<div class="s-vide">Aucune vue de rue libre trouvée ici.<br>
        <span style="font-size:9px;opacity:.7">Panoramax couvre surtout la France et l’Europe et s’étend vite.
        Essaie un peu plus loin, ou utilise la vue de synthèse 3D.</span></div>`;
      meta.textContent = '';
      return;
    }
    const img = document.createElement('img');
    img.src = p.url;
    img.alt = 'vue de rue';
    img.draggable = false;
    cadre.appendChild(img);
    img.addEventListener('load', () => { cadre.scrollLeft = (img.width - cadre.clientWidth) / 2; });
    meta.innerHTML = `${p.source}<br>${p.date || 'date inconnue'}`;
    poserRepere(p.lon, p.lat);
  }

  function suivant() {
    if (!courant?.items?.length) return;
    index = (index + 1) % courant.items.length;
    const it = courant.items[index];
    afficher({ ...courant, url: it.url, lon: it.lon ?? courant.lon, lat: it.lat ?? courant.lat, date: it.date || courant.date });
  }

  fen.querySelector('.fermer').addEventListener('click', () => {
    fen.style.display = 'none';
    releaseContinuousRender('wt-streetview');
    ds.entities.removeAll();
  });
  fen.querySelector('[data-a="tourner"]').addEventListener('click', suivant);
  fen.querySelector('[data-a="aller"]').addEventListener('click', () => {
    if (!courant) return;
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(courant.lon, courant.lat, 160), orientation: { pitch: Cesium.Math.toRadians(-25) }, duration: 2.5 });
  });

  /**
   * Ouvre la vue de rue à un point (ou autour des coordonnées données).
   * @param {number} lon
   * @param {number} lat
   * @param {{rayon?:number}} [opts]
   */
  async function ouvrir(lon, lat, opts = {}) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    fen.style.display = '';
    cadre.innerHTML = '<div class="s-vide">Recherche d’une vue de rue…</div>';
    meta.textContent = '';
    holdContinuousRender('wt-streetview');
    let p = await chercherPanorama(lon, lat, opts.rayon ?? 400);
    if (!p) p = await chercherMapillary(lon, lat, opts.rayon ?? 300, jetonMapillary);
    if (!p) p = await chercherPanorama(lon, lat, 1500); // élargit la recherche
    releaseContinuousRender('wt-streetview');
    afficher(p);
    if (p) surMessage?.(`🛣 Vue de rue — ${p.source}`);
    return p;
  }

  /** Bouton prêt à l'emploi pour la fiche lieu / le panneau MOI. */
  function bouton(lon, lat, libelle = '🛣 VUE DE RUE (street view)') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'np-btn';
    b.style.width = '100%';
    b.textContent = libelle;
    b.addEventListener('click', () => ouvrir(lon, lat));
    return b;
  }

  return { element: fen, ouvrir, bouton, chercherPanorama, fermer: () => { fen.style.display = 'none'; } };
}

/** Petite icône « appareil photo » dessinée en canvas (aucun asset externe). */
function cercleIcone() {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2);
  g.fillStyle = 'rgba(5,8,13,0.85)'; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#00d4ff'; g.stroke();
  g.fillStyle = '#00d4ff';
  g.fillRect(18, 24, 28, 17);
  g.beginPath(); g.moveTo(26, 24); g.lineTo(29, 19); g.lineTo(35, 19); g.lineTo(38, 24); g.closePath(); g.fill();
  g.beginPath(); g.arc(32, 32.5, 5, 0, Math.PI * 2); g.fill();
  return c.toDataURL();
}
