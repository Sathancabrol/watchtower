/**
 * WATCHTOWER — « ME LOCALISER » : la cinématique de localisation.
 *
 * Séquence demandée :
 *   1. Dézoom jusqu'à une VUE ORBITALE (satellite de la Terre).
 *   2. Apparition de la STATION WATCHTOWER (illustration vectorielle, aucune
 *      image externe) + activation d'un FILTRE D'ÉCRAN par-dessus la carte.
 *   3. Recherche de la position : infos mémorisées (ancrage T0 / domicile) →
 *      géolocalisation du navigateur → sinon demande d'une ADRESSE
 *      D'ENCRAGE (point T0). Un anneau de scan tourne autour du bâtiment de
 *      l'adresse (numéro de cadastre affiché).
 *   4. Une fenêtre s'ouvre et se ferme en clignotant : « LOCALISATION », puis
 *      le facteur de zoom ×1 → ×10 → ×100 → ×1000 …
 *   5. Animation de CRÉATION DU BÂTIMENT (il pousse depuis le sol), vue
 *      DRONE en 3D, entourage du PÉRIMÈTRE cadastral, puis une BOULE
 *      LUMINEUSE à l'intérieur = la présence de l'utilisateur.
 */

import * as Cesium from 'cesium';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

const CLE_ANCRAGE = 'watchtower.ancrage.v1';
const CLE_DOMICILE = 'watchtower.domicile.v1';

const CSS = `
#wt-loc-filtre {
  position: fixed; inset: 0; z-index: 1180; pointer-events: none; opacity: 0;
  transition: opacity .6s ease;
  background:
    repeating-linear-gradient(0deg, rgba(0,212,255,0.05) 0 1px, transparent 1px 3px),
    radial-gradient(ellipse at center, transparent 42%, rgba(0,8,16,0.72) 100%);
}
#wt-loc-filtre.actif { opacity: 1; }
#wt-loc-filtre::before {
  content: ''; position: absolute; left: 0; right: 0; height: 22vh;
  background: linear-gradient(180deg, transparent, rgba(0,212,255,0.10), transparent);
  animation: wt-loc-balayage 3.4s linear infinite;
}
@keyframes wt-loc-balayage { 0% { top: -25vh; } 100% { top: 105vh; } }
#wt-loc-filtre .coin { position: absolute; width: 46px; height: 46px; border: 2px solid rgba(0,212,255,0.55); }
#wt-loc-filtre .coin.tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
#wt-loc-filtre .coin.tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
#wt-loc-filtre .coin.bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
#wt-loc-filtre .coin.br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

#wt-loc-hud {
  position: fixed; z-index: 1185; left: 50%; top: 16vh; transform: translateX(-50%);
  width: min(560px, 82vw); padding: 12px 16px 14px; display: none; pointer-events: none;
  font-family: var(--font-mono, monospace); color: #cfe8ff;
  background: linear-gradient(180deg, rgba(4,10,20,0.86), rgba(4,10,20,0.55));
  border: 1px solid rgba(0,212,255,0.35); border-radius: 12px;
}
#wt-loc-hud .h-titre { font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #00d4ff; }
#wt-loc-hud .h-phase { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #fff; margin: 4px 0 2px; }
#wt-loc-hud .h-ligne { font-size: 9.5px; letter-spacing: 1px; color: rgba(207,232,255,0.75); line-height: 1.7; }
#wt-loc-hud .h-barre { height: 4px; margin-top: 8px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; }
#wt-loc-hud .h-barre > i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #00d4ff, #43d17a); transition: width .4s ease; }
#wt-loc-station { text-align: center; margin: 6px 0 8px; }
#wt-loc-station svg { width: 190px; height: 120px; filter: drop-shadow(0 0 12px rgba(0,212,255,0.45)); }

#wt-loc-scan {
  position: fixed; z-index: 1190; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(.9);
  padding: 14px 34px; display: none; font-family: var(--font-mono, monospace); text-align: center;
  background: rgba(5,12,22,0.9); border: 1px solid rgba(0,212,255,0.6); border-radius: 12px;
  box-shadow: 0 0 34px rgba(0,212,255,0.35), inset 0 0 22px rgba(0,212,255,0.12);
}
#wt-loc-scan .s-mot { font-size: 26px; font-weight: 800; letter-spacing: 8px; color: #00d4ff; }
#wt-loc-scan .s-facteur { font-size: 12px; letter-spacing: 4px; color: #43d17a; margin-top: 4px; }
#wt-loc-scan.ouvert { display: block; animation: wt-loc-clignote .55s steps(1) 1 both; }
@keyframes wt-loc-clignote {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.86); }
  18% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  62% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  80% { opacity: .15; }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

#wt-loc-adresse {
  position: fixed; z-index: 1195; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(430px, 88vw); padding: 18px; display: none; font-family: var(--font-mono, monospace);
  color: #e8eaed; background: linear-gradient(180deg, rgba(10,16,28,0.97), rgba(6,10,18,0.97));
  border: 1px solid rgba(0,212,255,0.45); border-radius: 14px; box-shadow: 0 14px 50px rgba(0,0,0,0.65);
}
#wt-loc-adresse .a-titre { font-size: 12px; font-weight: 800; letter-spacing: 2px; color: #00d4ff; margin-bottom: 6px; }
#wt-loc-adresse .a-txt { font-size: 10px; line-height: 1.7; color: rgba(232,234,237,0.75); margin-bottom: 10px; }
#wt-loc-adresse input {
  width: 100%; padding: 9px 10px; border-radius: 8px; box-sizing: border-box; font-family: inherit; font-size: 11px;
  background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.15); color: inherit; outline: none;
}
#wt-loc-adresse .a-actions { display: flex; gap: 8px; margin-top: 10px; }
#wt-loc-adresse button {
  flex: 1; cursor: pointer; padding: 9px; border-radius: 8px; font-family: inherit; font-size: 9.5px;
  font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.14);
  border: 1px solid rgba(0,212,255,0.45); color: #00d4ff;
}
#wt-loc-adresse button:hover { background: rgba(0,212,255,0.28); }
#wt-loc-adresse .a-erreur { color: #f08a8a; font-size: 9px; margin-top: 7px; min-height: 12px; }
`;

/** Altitude de départ de la cinématique (vue orbitale Terre entière). */
export const ALTITUDE_ORBITALE = 20_000_000;

/**
 * Étapes de zoom : le facteur ×1, ×10, ×100… appliqué à l'altitude de départ
 * jusqu'à l'altitude d'arrivée. Fonction pure (testée).
 * @param {number} depart altitude de départ (m)
 * @param {number} fin altitude d'arrivée (m)
 * @param {number} [base=10] rapport entre deux paliers
 */
export function etapesZoom(depart = ALTITUDE_ORBITALE, fin = 260, base = 10) {
  const d = Math.max(1, Number(depart) || 1);
  const f = Math.max(1, Number(fin) || 1);
  const out = [];
  let facteur = 1;
  let alt = d;
  while (alt > f * 1.05 && out.length < 24) {
    out.push({ facteur, altitude: Math.round(alt) });
    facteur *= base;
    alt = d / facteur;
  }
  out.push({ facteur, altitude: Math.round(Math.min(f, d)) });
  return out;
}

/** Rayon (m) de l'anneau de scan pour rester visible à cette altitude. */
export function rayonScan(altitude) {
  const a = Math.max(50, Number(altitude) || 1000);
  return Math.min(9_000_000, Math.max(22, a * 0.30));
}

/** Étiquette lisible d'un facteur de zoom : 1000 → « ×1000 ». */
export function etiquetteFacteur(facteur) {
  const f = Number(facteur) || 1;
  if (f < 1000) return `×${f}`;
  if (f < 1e6) return `×${Math.round(f / 1000)} 000`.replace(/^×1 /, '×1 ');
  return `×${(f / 1e6).toFixed(f < 1e7 ? 1 : 0)} M`;
}

/** Adresse → coordonnées (Nominatim, gratuit, sans clé). */
export async function geocoder(adresse, signal = null) {
  if (!adresse || !adresse.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(adresse)}&accept-language=fr`;
  try {
    const r = await fetch(url, signal ? { signal } : undefined);
    const d = await r.json();
    const p = d?.[0];
    if (!p) return null;
    return { lat: Number(p.lat), lon: Number(p.lon), nom: p.display_name, boite: p.boundingbox?.map(Number) || null };
  } catch {
    return null;
  }
}

/** Parcelle cadastrale (apicarto IGN, gratuit, sans clé). */
export async function parcelle(lat, lon) {
  try {
    const r = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?lat=${lat}&lon=${lon}`);
    if (!r.ok) return null;
    const fc = await r.json();
    const f = fc?.features?.[0];
    if (!f?.geometry) return null;
    return { geometry: f.geometry, proprietes: f.properties || {} };
  } catch {
    return null;
  }
}

/** Anneaux de coordonnées (lon/lat) d'une géométrie GeoJSON. */
export function anneauxDe(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return (geometry.coordinates || []).filter((a) => a?.length > 2);
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flat().filter((a) => a?.length > 2);
  return [];
}

/** Centre approximatif d'un anneau lon/lat. */
export function centreAnneau(anneau) {
  if (!anneau?.length) return null;
  let x = 0; let y = 0;
  for (const [lo, la] of anneau) { x += lo; y += la; }
  return { lon: x / anneau.length, lat: y / anneau.length };
}

/** Illustration vectorielle de la station WATCHTOWER (aucune image externe). */
export function svgStation() {
  return `
  <svg viewBox="0 0 240 150" aria-hidden="true">
    <defs>
      <linearGradient id="wtst" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0e2a3a"/><stop offset="100%" stop-color="#061620"/>
      </linearGradient>
      <radialGradient id="wtstg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00d4ff" stop-opacity=".9"/><stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="120" cy="150" rx="150" ry="46" fill="url(#wtstg)" opacity=".35"/>
    <path d="M-30 150 Q120 96 270 150 Z" fill="#0b2233"/>
    <circle cx="120" cy="72" r="62" fill="none" stroke="#00d4ff" stroke-opacity=".18" stroke-width="1"/>
    <g transform="translate(120 72)">
      <ellipse rx="46" ry="15" fill="none" stroke="#43d1ff" stroke-width="3" opacity=".95"/>
      <ellipse rx="46" ry="15" fill="none" stroke="#0a1c28" stroke-width="1"/>
      <ellipse rx="34" ry="11" fill="none" stroke="#43d1ff" stroke-width="1.2" opacity=".5"/>
      <g stroke="#7fe9ff" stroke-width="2" opacity=".85">
        <line x1="-46" y1="0" x2="-18" y2="0"/><line x1="46" y1="0" x2="18" y2="0"/>
        <line x1="0" y1="-15" x2="0" y2="-30"/><line x1="0" y1="15" x2="0" y2="30"/>
      </g>
      <circle r="14" fill="url(#wtst)"/>
      <circle r="14" fill="none" stroke="#00d4ff" stroke-width="1.5"/>
      <rect x="-3" y="-30" width="6" height="18" fill="#7fe9ff" opacity=".8"/>
      <g fill="#0a2b3d" stroke="#43d1ff" stroke-width="1">
        <rect x="-104" y="-7" width="42" height="14" rx="2"/>
        <rect x="62" y="-7" width="42" height="14" rx="2"/>
      </g>
      <g stroke="#00d4ff" stroke-opacity=".35">
        <line x1="-83" y1="0" x2="-62" y2="0"/><line x1="83" y1="0" x2="62" y2="0"/>
      </g>
      <path d="M0 -30 L5 -44 L-5 -44 Z" fill="#ff5f56"/>
      <circle cx="0" cy="0" r="4.5" fill="#00d4ff">
        <animate attributeName="opacity" values="1;.25;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </g>
    <g fill="#7fe9ff" opacity=".9">
      <circle cx="30" cy="40" r="1.2"/><circle cx="205" cy="52" r="1"/><circle cx="52" cy="112" r="1"/>
      <circle cx="188" cy="118" r="1.3"/><circle cx="18" cy="86" r=".9"/>
    </g>
  </svg>`;
}

/**
 * @param {object} viewer
 * @param {{bati?:object, fiche?:Function, pins?:object, surMessage?:Function}} [options]
 */
export function initLocalisation(viewer, options = {}) {
  const { bati = null, fiche = null, pins = null, surMessage = null } = options || {};

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const filtre = document.createElement('div');
  filtre.id = 'wt-loc-filtre';
  filtre.innerHTML = '<span class="coin tl"></span><span class="coin tr"></span><span class="coin bl"></span><span class="coin br"></span>';
  document.body.appendChild(filtre);

  const hud = document.createElement('div');
  hud.id = 'wt-loc-hud';
  hud.innerHTML = `<div class="h-titre">TOUR DE GUET · WATCHTOWER</div>
    <div id="wt-loc-station" class="h-station" style="text-align:center;margin:6px 0 8px">${svgStation()}</div>
    <div class="h-phase">MISE EN ORBITE</div>
    <div class="h-ligne"></div>
    <div class="h-barre"><i></i></div>`;
  document.body.appendChild(hud);

  const scan = document.createElement('div');
  scan.id = 'wt-loc-scan';
  scan.innerHTML = '<div class="s-mot">LOCALISATION</div><div class="s-facteur"></div>';
  document.body.appendChild(scan);

  const demande = document.createElement('div');
  demande.id = 'wt-loc-adresse';
  demande.innerHTML = `<div class="a-titre">⚓ ADRESSE D'ENCRAGE — POINT T0</div>
    <div class="a-txt">Aucune position connue. Donne une adresse (ou une ville) : elle deviendra le point
    d'ancrage T0 de ta localisation, et la station te zoomera dessus.</div>
    <input type="text" placeholder="ex : 12 rue de la République, Sète">
    <div class="a-erreur"></div>
    <div class="a-actions">
      <button class="ok" type="button">LOCALISER</button>
      <button class="annuler" type="button">ANNULER</button>
    </div>`;
  document.body.appendChild(demande);

  const phaseEl = hud.querySelector('.h-phase');
  const ligneEl = hud.querySelector('.h-ligne');
  const barreEl = hud.querySelector('.h-barre > i');
  const stationEl = hud.querySelector('#wt-loc-station');
  const scanMot = scan.querySelector('.s-mot');
  const scanFacteur = scan.querySelector('.s-facteur');

  // couche des éléments de la cinématique (anneau, périmètre, bâtiment, bulle)
  const ds = new Cesium.CustomDataSource('wt-localisation');
  viewer.dataSources.add(ds);

  let annule = false;
  let timers = [];

  const attendre = (ms) => new Promise((res) => {
    const t = window.setTimeout(() => { if (!annule) res(); }, ms);
    timers.push(t);
  });

  function phase(nom, ligne, progression = null) {
    phaseEl.textContent = nom;
    if (ligne != null) ligneEl.innerHTML = ligne;
    if (progression != null) barreEl.style.width = `${Math.max(0, Math.min(100, progression * 100))}%`;
  }

  function activerFiltre(etat) {
    filtre.classList.toggle('actif', Boolean(etat));
    const toile = viewer.scene.canvas;
    // filtre d'écran par-dessus la carte (grade satellite)
    toile.style.filter = etat
      ? 'saturate(1.35) contrast(1.12) brightness(1.04) hue-rotate(-6deg)'
      : '';
    if (etat) { hud.style.display = ''; } else { hud.style.display = 'none'; }
    governorRequestRender('wt-loc');
  }

  /** Ouvre/ferme la fenêtre clignotante « LOCALISATION / ×10 … ». */
  function clignoter(mot, facteur = '', duree = 1400) {
    scanMot.textContent = mot;
    scanFacteur.textContent = facteur;
    scan.classList.remove('ouvert');
    // force le redémarrage de l'animation
    void scan.offsetWidth;
    scan.classList.add('ouvert');
    const t = window.setTimeout(() => scan.classList.remove('ouvert'), duree);
    timers.push(t);
  }

  /** Demande une adresse à l'utilisateur (point d'ancrage T0). */
  function demanderAdresse() {
    return new Promise((res) => {
      const input = demande.querySelector('input');
      const err = demande.querySelector('.a-erreur');
      const ok = demande.querySelector('.ok');
      const non = demande.querySelector('.annuler');
      err.textContent = '';
      input.value = '';
      demande.style.display = '';
      holdContinuousRender('wt-loc');
      input.focus();
      const finir = (valeur) => {
        demande.style.display = 'none';
        ok.replaceWith(ok.cloneNode(true));
        non.replaceWith(non.cloneNode(true));
        res(valeur);
      };
      demande.querySelector('.ok').onclick = async () => {
        err.textContent = '⏳ Recherche…';
        const r = await geocoder(input.value);
        if (!r) { err.textContent = '⚠ Adresse introuvable — essaie une forme plus simple.'; return; }
        try {
          window.localStorage.setItem(CLE_ANCRAGE, JSON.stringify({ lat: r.lat, lon: r.lon, t: Date.now(), origine: 'adresse' }));
        } catch { /* ok */ }
        finir({ lat: r.lat, lon: r.lon, adresse: r.nom, source: 'adresse T0' });
      };
      demande.querySelector('.annuler').onclick = () => finir(null);
      input.onkeydown = (e) => { if (e.key === 'Enter') demande.querySelector('.ok').click(); };
    });
  }

  /** Retrouve la position : ancrage → domicile → GPS navigateur → adresse. */
  async function resoudreCible() {
    try {
      const a = JSON.parse(window.localStorage.getItem(CLE_ANCRAGE) || 'null');
      if (Number.isFinite(a?.lat)) return { lat: a.lat, lon: a.lon, adresse: a.adresse || 'point d’ancrage T0', source: 'ancrage T0' };
    } catch { /* ok */ }
    try {
      const d = JSON.parse(window.localStorage.getItem(CLE_DOMICILE) || 'null');
      if (Number.isFinite(d?.lon)) return { lat: d.lat, lon: d.lon, adresse: d.label || 'mon domicile', source: 'domicile' };
    } catch { /* ok */ }
    const gps = await new Promise((res) => {
      if (!navigator.geolocation) { res(null); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => res(null),
        { timeout: 6000, maximumAge: 300_000, enableHighAccuracy: true },
      );
    });
    if (gps) return { ...gps, adresse: 'position GPS du navigateur', source: 'GPS' };
    return demanderAdresse();
  }

  /** Anneau de scan animé autour de la cible (rayon proportionné à l'altitude). */
  let anneau = null;
  function poserAnneau(lat, lon) {
    if (anneau) ds.entities.remove(anneau);
    const debut = performance.now();
    anneau = ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      ellipse: {
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          const alt = viewer.camera.positionCartographic.height;
          const r = rayonScan(alt);
          const puls = 1 + 0.06 * Math.sin(((performance.now() - debut) / 1000) * 2.2);
          return r * puls;
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          const alt = viewer.camera.positionCartographic.height;
          const r = rayonScan(alt);
          const puls = 1 + 0.06 * Math.sin(((performance.now() - debut) / 1000) * 2.2);
          return r * puls;
        }, false),
        material: new Cesium.ImageMaterialProperty({
          image: anneauxImage(),
          transparent: true,
          repeat: new Cesium.Cartesian2(6, 6),
        }),
        height: 2,
      },
    });
    governorRequestRender('wt-loc-anneau');
  }

  /** Anneaux concentriques tournants (canvas) pour le scan. */
  function anneauxImage() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    for (const [r, w, a, dash] of [[118, 4, 0.95, [16, 10]], [96, 2, 0.5, [8, 12]], [74, 1.5, 0.32, [4, 6]]]) {
      g.beginPath();
      g.arc(128, 128, r, 0, Math.PI * 2);
      g.setLineDash(dash);
      g.lineWidth = w;
      g.strokeStyle = `rgba(0,212,255,${a})`;
      g.stroke();
    }
    g.setLineDash([]);
    const grad = g.createRadialGradient(128, 128, 60, 128, 128, 122);
    grad.addColorStop(0, 'rgba(0,212,255,0)');
    grad.addColorStop(1, 'rgba(0,212,255,0.14)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return c.toDataURL();
  }

  /** Boîte qui pousse : animation de « création du bâtiment ». */
  async function creerBatiment(lat, lon, hauteur, duree = 2600) {
    const debut = performance.now();
    let fini = null;
    const promesse = new Promise((res) => { fini = res; });
    holdContinuousRender('wt-loc-bati');
    const ent = ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      box: {
        dimensions: new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - debut) / duree);
          const e = 1 - (1 - t) ** 3; // ease-out cubic
          return new Cesium.Cartesian3(14, 14, Math.max(0.4, hauteur * e));
        }, false),
        material: Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.28),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#7fe9ff'),
        heightReference: Cesium.HeightReference.NONE,
      },
    });
    // le box est centré sur `position` → on le remonte de la moitié
    ent.position = new Cesium.CallbackProperty(() => {
      const t = Math.min(1, (performance.now() - debut) / duree);
      const e = 1 - (1 - t) ** 3;
      return Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(0.2, (hauteur * e) / 2));
    }, false);
    const tick = () => {
      if (annule) { fini(); return; }
      if (performance.now() - debut >= duree) { fini(); return; }
      governorRequestRender('wt-loc-bati');
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await promesse;
    releaseContinuousRender('wt-loc-bati');
    return ent;
  }

  /** Vue drone : orbite lente autour du bâtiment. */
  async function orbiterDrone(lat, lon, altitude = 180, secondes = 11) {
    const cible = Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(6, 14));
    const debut = performance.now();
    let heading = 0;
    viewer.camera.lookAt(cible, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-26), altitude));
    holdContinuousRender('wt-loc-drone');
    const pas = () => {
      if (annule) { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); releaseContinuousRender('wt-loc-drone'); return; }
      const t = (performance.now() - debut) / 1000;
      if (t >= secondes) { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); releaseContinuousRender('wt-loc-drone'); return; }
      heading += 0.0032;
      viewer.camera.lookAt(cible, new Cesium.HeadingPitchRange(heading, Cesium.Math.toRadians(-24 + 6 * Math.sin(t * 0.6)), altitude * (1 - 0.12 * Math.min(1, t / secondes))));
      requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
    await attendre(secondes * 1000);
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    releaseContinuousRender('wt-loc-drone');
  }

  /** Périmètre cadastral tracé progressivement (polyligne animée). */
  async function tracerPerimetre(anneaux, duree = 2200) {
    if (!anneaux.length) return null;
    const debut = performance.now();
    holdContinuousRender('wt-loc-perimetre');
    const total = anneaux.reduce((n, a) => n + a.length, 0);
    const ent = ds.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - debut) / duree);
          const n = Math.max(2, Math.floor(total * t));
          const liste = [];
          for (const a of anneaux) {
            for (let i = 0; i < a.length && liste.length < n; i += 1) liste.push(a[i][0], a[i][1]);
            if (liste.length >= n) break;
          }
          if (liste.length < 4) return Cesium.Cartesian3.fromDegreesArray([anneaux[0][0][0], anneaux[0][0][1], anneaux[0][0][0], anneaux[0][0][1]]);
          return Cesium.Cartesian3.fromDegreesArray(liste);
        }, false),
        width: 5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString('#43d17a'),
        }),
        clampToGround: true,
      },
    });
    await attendre(duree);
    releaseContinuousRender('wt-loc-perimetre');
    return ent;
  }

  /** Boule lumineuse = la présence de l'utilisateur dans le bâtiment. */
  function poserPresence(lat, lon, hauteur) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(140,240,255,0.92)');
    grad.addColorStop(0.55, 'rgba(0,212,255,0.35)');
    grad.addColorStop(1, 'rgba(0,212,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const image = c.toDataURL();

    const debut = performance.now();
    const alt = Math.max(2.5, Math.min(hauteur * 0.45 || 4, 6));
    ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      billboard: {
        image,
        width: new Cesium.CallbackProperty(() => 34 + 8 * Math.sin(((performance.now() - debut) / 1000) * 2.4), false),
        height: new Cesium.CallbackProperty(() => 34 + 8 * Math.sin(((performance.now() - debut) / 1000) * 2.4), false),
        color: Cesium.Color.WHITE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'PRÉSENCE',
        font: 'bold 10px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.fromCssColorString('#eaffff'),
        outlineColor: Cesium.Color.fromCssColorString('#00303c'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, 26),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      ellipsoid: {
        radii: new Cesium.Cartesian3(1.1, 1.1, 1.1),
        material: Cesium.Color.fromCssColorString('#dffcff').withAlpha(0.95),
      },
    });
    governorRequestRender('wt-loc-presence');
  }

  /** Vol caméra simple vers une altitude (attend la fin). */
  async function voler(lat, lon, altitude, duree = 2.4) {
    holdContinuousRender('wt-loc-vol');
    try {
      await viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        duration: duree,
      });
    } catch { /* vol interrompu */ }
    releaseContinuousRender('wt-loc-vol');
  }

  /**
   * Lance la cinématique complète.
   * @param {{lat?:number, lon?:number}} [force] cible imposée (sinon résolue)
   */
  async function demarrer(force = {}) {
    if (window.__wtLocEnCours) return null;
    window.__wtLocEnCours = true;
    annule = false;
    timers = [];
    ds.entities.removeAll();
    activerFiltre(true);
    holdContinuousRender('wt-loc');
    stationEl.style.display = '';
    scanMot.textContent = 'LOCALISATION';

    try {
      // ——— 1. MISE EN ORBITE ———
      phase('MISE EN ORBITE', 'Dézoom vers la vue satellite · station WATCHTOWER en approche', 0.05);
      const depart = viewer.camera.positionCartographic;
      const dLat = Cesium.Math.toDegrees(depart.latitude);
      const dLon = Cesium.Math.toDegrees(depart.longitude);
      const cible = Number.isFinite(force?.lat) ? { lat: force.lat, lon: force.lon, adresse: 'cible', source: 'imposée' } : await resoudreCible();
      if (annule || !cible) { throw new Error('annulé'); }

      await voler(dLat, dLon, ALTITUDE_ORBITALE, 2.6);
      if (annule) throw new Error('annulé');

      // ——— 2. STATION + FILTRE + SCAN ———
      phase('STATION WATCHTOWER', 'Filtre orbital actif · recherche de ta position…', 0.15);
      clignoter('LOCALISATION', '', 2600);
      poserAnneau(cible.lat, cible.lon);
      let adresse = cible.adresse || '';
      let numeroCadastre = '';
      if (!adresse || cible.source === 'GPS') {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${cible.lat}&lon=${cible.lon}&zoom=18&addressdetails=1&accept-language=fr`)
          .then((x) => x.json()).catch(() => null);
        adresse = r?.display_name || adresse || `${cible.lat.toFixed(5)}, ${cible.lon.toFixed(5)}`;
      }
      const par = await parcelle(cible.lat, cible.lon);
      if (par?.proprietes) {
        const p = par.proprietes;
        numeroCadastre = [p.section ? `section ${p.section}` : '', p.numero ? `n° ${p.numero}` : '', p.nom_com || ''].filter(Boolean).join(' · ');
      }
      phase('STATION WATCHTOWER', `Position verrouillée : ${adresse.slice(0, 70)}${numeroCadastre ? `<br>📐 Cadastre ${numeroCadastre}` : ''}`, 0.3);
      await attendre(1500);
      if (annule) throw new Error('annulé');
      stationEl.style.display = 'none';

      // ——— 3. ZOOM SÉQUENTIEL ×1 ×10 ×100 … ———
      const etapes = etapesZoom(ALTITUDE_ORBITALE, 300, 10);
      for (let i = 0; i < etapes.length; i += 1) {
        if (annule) throw new Error('annulé');
        const e = etapes[i];
        const suivant = etapes[i + 1];
        phase('ZOOM SÉQUENTIEL', `Palier ${i + 1}/${etapes.length} · altitude ${Math.round(e.altitude).toLocaleString('fr-FR')} m`, 0.3 + 0.6 * (i / etapes.length));
        clignoter(i % 2 ? 'LOCALISATION' : 'ZOOM', etiquetteFacteur(suivant ? suivant.facteur : e.facteur), 1500);
        await voler(cible.lat, cible.lon, e.altitude, e.altitude > 100_000 ? 2.0 : 2.4);
        await attendre(180);
      }
      if (annule) throw new Error('annulé');

      // ——— 4. CRÉATION DU BÂTIMENT + BÂTI 3D ———
      phase('CRÉATION DU BÂTIMENT', 'Chargement du bâti réel (OpenStreetMap)…', 0.8);
      clignoter('LOCALISATION', 'BÂTI', 1600);
      const promesseBati = bati?.charger?.({ lat: cible.lat, lon: cible.lon, rayon: 260 }).catch(() => null);
      const hauteur = 9;
      await creerBatiment(cible.lat, cible.lon, hauteur, 2400);
      await promesseBati;

      // ——— 5. PÉRIMÈTRE CADASTRAL ———
      phase('PÉRIMÈTRE', numeroCadastre || 'Contour de la parcelle', 0.9);
      const anneaux = anneauxDe(par?.geometry);
      if (anneaux.length) {
        await tracerPerimetre(anneaux, 2000);
        // remplissage léger
        for (const a of anneaux) {
          ds.entities.add({
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(a.flatMap(([lo, la]) => [lo, la])),
              material: Cesium.Color.fromCssColorString('#43d17a').withAlpha(0.10),
              outline: false,
              height: 0.4,
            },
          });
        }
      } else {
        clignoter('PÉRIMÈTRE', 'approx.', 1400);
        ds.entities.add({
          position: Cesium.Cartesian3.fromDegrees(cible.lon, cible.lat, 0),
          ellipse: {
            semiMinorAxis: 11, semiMajorAxis: 11,
            material: Cesium.Color.fromCssColorString('#43d17a').withAlpha(0.10),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#43d17a').withAlpha(0.6),
          },
        });
      }

      // ——— 6. PRÉSENCE + VUE DRONE ———
      phase('PRÉSENCE DÉTECTÉE', `${adresse.slice(0, 70)}`, 1);
      clignoter('LOCALISATION', 'PRÉSENCE', 1800);
      poserPresence(cible.lat, cible.lon, hauteur);
      pins?.poser?.(cible.lon, cible.lat, 'MA POSITION (T0)');
      await orbiterDrone(cible.lat, cible.lon, 190, 12);

      phase('LOCALISATION TERMINÉE', `📍 ${adresse.slice(0, 100)}<br>🛰 source : ${cible.source}`, 1);
      surMessage?.(`📍 Localisé : ${adresse.slice(0, 60)}${numeroCadastre ? ` — cadastre ${numeroCadastre}` : ''}`);
      fiche?.(cible.lat, cible.lon, adresse.slice(0, 40));
      await attendre(2200);
      activerFiltre(false);
      return { lat: cible.lat, lon: cible.lon, adresse, cadastre: numeroCadastre, source: cible.source };
    } catch (e) {
      if (String(e?.message) === 'annulé') surMessage?.('🛰 Localisation interrompue.');
      else surMessage?.(`⚠ Localisation : ${e?.message || e}`);
      activerFiltre(false);
      return null;
    } finally {
      window.__wtLocEnCours = false;
      releaseContinuousRender('wt-loc');
      releaseContinuousRender('wt-loc-bati');
      releaseContinuousRender('wt-loc-perimetre');
      releaseContinuousRender('wt-loc-drone');
      releaseContinuousRender('wt-loc-vol');
      scan.classList.remove('ouvert');
      hud.style.display = 'none';
      stationEl.style.display = '';
    }
  }

  function arreter() {
    annule = true;
    window.__wtLocEnCours = false;
    for (const t of timers) window.clearTimeout(t);
    timers = [];
    activerFiltre(false);
    scan.classList.remove('ouvert');
    hud.style.display = 'none';
    demande.style.display = 'none';
    releaseContinuousRender('wt-loc');
    releaseContinuousRender('wt-loc-drone');
    releaseContinuousRender('wt-loc-bati');
    releaseContinuousRender('wt-loc-perimetre');
    releaseContinuousRender('wt-loc-vol');
    try { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch { /* ok */ }
  }

  return {
    demarrer,
    arreter,
    effacer: () => { ds.entities.removeAll(); anneau = null; governorRequestRender('wt-loc'); },
    anneauVisible: (v) => { ds.show = Boolean(v); },
  };
}
