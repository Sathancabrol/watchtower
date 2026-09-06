/**
 * WATCHTOWER — CINÉMATIQUE D'APPROCHE (bouton HQ / recherche de lieu).
 *
 * Au lieu d'un simple `flyTo`, l'arrivée sur un lieu est jouée comme un
 * écran de chargement de jeu : la caméra décrit un TRAVELLING lent au-dessus
 * du terrain (elle dérive sur le côté en descendant, comme une prise de vue
 * hélicoptère), avec :
 *
 *   · bandes « letterbox » qui entrent et sortent ;
 *   · vignette + grain + léger étalonnage (filtre CSS sur le canvas 3D) ;
 *   · bandeau « lower-third » : nom du lieu, coordonnées, altitude ;
 *   · indicateur de progression (SÉQUENCE · APPROCHE · VERROUILLAGE).
 *
 * Aucune image externe : tout est CSS + Cesium.
 */

import * as Cesium from 'cesium';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

const CSS = `
#wt-cine { position: fixed; inset: 0; z-index: 1700; pointer-events: none; opacity: 0; transition: opacity .5s ease; }
#wt-cine.actif { opacity: 1; }
#wt-cine .barre {
  position: absolute; left: 0; right: 0; height: 13vh; background: #000;
  transition: transform .9s cubic-bezier(.2,.7,.2,1);
}
#wt-cine .barre.haut { top: 0; transform: translateY(-100%); }
#wt-cine .barre.bas { bottom: 0; transform: translateY(100%); }
#wt-cine.actif .barre.haut, #wt-cine.actif .barre.bas { transform: translateY(0); }
#wt-cine .grain {
  position: absolute; inset: 0; opacity: .16; mix-blend-mode: overlay;
  background-image: radial-gradient(rgba(255,255,255,.55) .5px, transparent .6px);
  background-size: 3px 3px; animation: wt-cine-grain .5s steps(3) infinite;
}
@keyframes wt-cine-grain {
  0% { transform: translate(0, 0); } 33% { transform: translate(-1px, 1px); } 66% { transform: translate(1px, -1px); } 100% { transform: translate(0, 0); }
}
#wt-cine .vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 52%, transparent 46%, rgba(0,0,0,.62) 100%);
}
#wt-cine .tiers {
  position: absolute; left: 6vw; bottom: 19vh; font-family: var(--font-mono, monospace);
  color: #eaf6ff; text-shadow: 0 2px 14px rgba(0,0,0,.85); max-width: 60vw;
}
#wt-cine .tiers .etiquette { font-size: 9px; letter-spacing: 6px; color: #00d4ff; opacity: .9; }
#wt-cine .tiers .titre {
  font-size: 27px; font-weight: 800; letter-spacing: 3px; line-height: 1.15; margin-top: 4px;
  border-right: 2px solid #00d4ff; white-space: nowrap; overflow: hidden;
  animation: wt-cine-frappe 1.1s steps(28) .35s 1 both, wt-cine-caret .7s step-end infinite;
}
@keyframes wt-cine-frappe { from { width: 0; } to { width: 100%; } }
@keyframes wt-cine-caret { 50% { border-color: transparent; } }
#wt-cine .tiers .sous { font-size: 10px; letter-spacing: 2px; color: rgba(234,246,255,.7); margin-top: 5px; }
#wt-cine .etape {
  position: absolute; right: 6vw; bottom: 19vh; text-align: right;
  font-family: var(--font-mono, monospace); color: #00d4ff;
}
#wt-cine .etape .nom { font-size: 11px; letter-spacing: 5px; font-weight: 700; }
#wt-cine .etape .alt { font-size: 9px; letter-spacing: 2px; color: rgba(234,246,255,.65); margin-top: 3px; }
#wt-cine .progression {
  position: absolute; left: 6vw; right: 6vw; bottom: 15.5vh; height: 1px;
  background: rgba(255,255,255,.18); overflow: hidden;
}
#wt-cine .progression > i { display: block; height: 100%; width: 0; background: #00d4ff; box-shadow: 0 0 8px #00d4ff; }
#wt-cine .trait { position: absolute; background: rgba(255,255,255,.1); }
#wt-cine .trait.g { left: 4vw; top: 16vh; bottom: 16vh; width: 1px; }
#wt-cine .trait.d { right: 4vw; top: 16vh; bottom: 16vh; width: 1px; }
`;

/**
 * Paliers de l'approche. `altitude` (m) et `tangage` (°, négatif = regard
 * vers le bas) déterminent la distance au sol : d = altitude / tan(|tangage|)
 * — la caméra descend ET se rapproche en même temps, comme un travelling
 * hélicoptère. `derive` est la fraction de tour parcourue pendant le palier.
 */
export const SEQUENCE = Object.freeze([
  { cle: 'ORBITE', duree: 2.4, altitude: 42_000, tangage: -34, derive: 0.10 },
  { cle: 'DESCENTE', duree: 3.6, altitude: 5_200, tangage: -28, derive: 0.16 },
  { cle: 'APPROCHE', duree: 3.4, altitude: 620, tangage: -20, derive: 0.22 },
  { cle: 'VERROUILLAGE', duree: 2.6, altitude: 190, tangage: -14, derive: 0.26 },
]);

/** Distance au sol pour tenir le cadrage : d = altitude / tan(|tangage|). */
export function distanceSol(altitude, tangage) {
  const t = Math.abs(Number(tangage) || 30) * (Math.PI / 180);
  return Math.max(20, (Math.max(20, Number(altitude) || 100)) / Math.tan(t));
}

/** Durée totale de la cinématique (s) — exporté pour les tests. */
export function dureeTotale(sequence = SEQUENCE) {
  return sequence.reduce((n, p) => n + p.duree, 0);
}

/** Interpolation douce (ease-in-out) entre deux paliers. */
export function douceur(t) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2;
}

/**
 * Valeur interpolée de la caméra à l'instant t (s) — fonction pure, testée.
 * @returns {{altitude:number, distance:number, tangage:number, cap:number, etape:string, avancement:number}}
 */
export function cameraA(t, sequence = SEQUENCE) {
  const total = dureeTotale(sequence);
  const temps = Math.max(0, Math.min(total, Number(t) || 0));
  let cumul = 0;
  let cap = 0;
  for (let i = 0; i < sequence.length; i += 1) {
    const p = sequence[i];
    const suivant = sequence[i + 1];
    if (temps < cumul + p.duree || !suivant) {
      const local = p.duree > 0 ? (temps - cumul) / p.duree : 1;
      const k = douceur(local);
      const valeur = (a, b) => a + (b - a) * k;
      const altitude = valeur(p.altitude, suivant ? suivant.altitude : p.altitude);
      const tangage = valeur(p.tangage, suivant ? suivant.tangage : p.tangage);
      return {
        altitude,
        tangage,
        distance: distanceSol(altitude, tangage),
        cap: (cap + local * p.derive) % 1,
        etape: p.cle,
        avancement: Math.min(1, temps / total),
      };
    }
    cumul += p.duree;
    cap += p.derive;
  }
  const dernier = sequence[sequence.length - 1];
  return {
    altitude: dernier.altitude,
    tangage: dernier.tangage,
    distance: distanceSol(dernier.altitude, dernier.tangage),
    cap: cap % 1,
    etape: dernier.cle,
    avancement: 1,
  };
}

/**
 * Position caméra correspondant à un plan : on se place à `distance` du point,
 * au relèvement `cap` (fraction de tour, 0 = nord), à l'altitude demandée, et
 * on regarde vers le point (cap + 180°).
 *
 * @param {{lat:number, lon:number, sol?:number}} point
 * @param {{altitude:number, tangage:number, cap:number}} plan
 * @returns {{lon:number, lat:number, altitude:number, cap:number, tangage:number}}
 */
export function positionCamera(point, plan) {
  const lat = Number(point?.lat) || 0;
  const lon = Number(point?.lon) || 0;
  const altitude = Math.max(20, Number(plan?.altitude) || 200);
  const tangage = Number(plan?.tangage) || -20;
  const cap = ((Number(plan?.cap) || 0) % 1 + 1) % 1;
  const d = distanceSol(altitude, tangage);
  const rad = (cap * 2 * Math.PI);
  const cosLat = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  const latCam = lat + (d * Math.cos(rad)) / 111_320;
  const lonCam = lon + (d * Math.sin(rad)) / (111_320 * cosLat);
  return {
    lat: latCam,
    lon: lonCam,
    altitude: Math.max(20, altitude + (Number(point?.sol) || 0)),
    cap: (cap + 0.5) % 1, // on regarde vers le point : relèvement opposé
    tangage,
  };
}

/**
 * @param {object} viewer
 * @param {{surMessage?:Function, surFin?:Function}} [options]
 */
export function initCinematique(viewer, options = {}) {
  const { surMessage = null, surFin = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const racine = document.createElement('div');
  racine.id = 'wt-cine';
  racine.innerHTML = `
    <div class="vignette"></div>
    <div class="grain"></div>
    <div class="trait g"></div><div class="trait d"></div>
    <div class="barre haut"></div>
    <div class="barre bas"></div>
    <div class="tiers">
      <div class="etiquette">WATCHTOWER · RECONNAISSANCE</div>
      <div class="titre">—</div>
      <div class="sous"></div>
    </div>
    <div class="etape"><div class="nom">—</div><div class="alt"></div></div>
    <div class="progression"><i></i></div>`;
  document.body.appendChild(racine);

  const elTitre = racine.querySelector('.titre');
  const elSous = racine.querySelector('.sous');
  const elEtape = racine.querySelector('.etape .nom');
  const elAlt = racine.querySelector('.etape .alt');
  const elProg = racine.querySelector('.progression > i');

  let annule = false;
  const toile = () => viewer.scene.canvas;

  function habiller(etat) {
    racine.classList.toggle('actif', Boolean(etat));
    toile().style.filter = etat
      ? 'saturate(1.18) contrast(1.10) brightness(1.02) drop-shadow(0 0 0 rgba(0,0,0,0))'
      : '';
    toile().style.transition = 'filter .6s ease';
    governorRequestRender('wt-cine');
  }

  /**
   * Joue l'approche cinématique vers un point.
   * @param {number} lat
   * @param {number} lon
   * @param {{nom?:string, sous?:string, altitudeFin?:number}} [opts]
   */
  async function approche(lat, lon, opts = {}) {
    if (window.__wtCineEnCours) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    window.__wtCineEnCours = true;
    annule = false;

    const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat)) || 0;
    const nom = (opts.nom || 'POINT D’INTÉRÊT').toUpperCase().slice(0, 42);
    elTitre.textContent = nom;
    elSous.textContent = opts.sous || `${lat.toFixed(5)} · ${lon.toFixed(5)} · ${Math.round(sol)} m`;
    habiller(true);
    holdContinuousRender('wt-cine');

    const sequence = SEQUENCE;
    const total = dureeTotale(sequence) * 1000;
    const debut = performance.now();

    await new Promise((res) => {
      const pas = () => {
        if (annule) { res(); return; }
        const t = (performance.now() - debut) / 1000;
        const c = cameraA(t, sequence);
        const p = positionCamera({ lat, lon, sol }, c);
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.altitude),
          orientation: {
            heading: p.cap * Math.PI * 2,
            pitch: Cesium.Math.toRadians(p.tangage),
            roll: 0,
          },
        });
        elEtape.textContent = c.etape;
        elAlt.textContent = `${Math.round(c.altitude).toLocaleString('fr-FR')} m`;
        elProg.style.width = `${(c.avancement * 100).toFixed(1)}%`;
        governorRequestRender('wt-cine');
        if (t * 1000 >= total) { res(); return; }
        requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    });

    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    releaseContinuousRender('wt-cine');
    window.__wtCineEnCours = false;
    if (!annule) {
      // sortie de cinématique : on laisse le décor, on rend la main
      window.setTimeout(() => habiller(false), 900);
      surFin?.({ lat, lon });
    } else {
      habiller(false);
    }
    return true;
  }

  function arreter() {
    annule = true;
    window.__wtCineEnCours = false;
    releaseContinuousRender('wt-cine');
    try { viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch { /* ok */ }
    habiller(false);
  }

  return {
    approche,
    arreter,
    /**
     * Raccourci « search HQ » : part de la vue courante, monte en orbite,
     * puis plonge en travelling jusqu'au point.
     */
    async rechercheHQ(lat, lon, nom = 'MON QG') {
      surMessage?.('🎬 HQ — approche cinématique…');
      await approche(lat, lon, { nom, sous: `${lat.toFixed(5)} · ${lon.toFixed(5)}` });
      surMessage?.(`📍 HQ atteint — ${nom}`);
    },
    element: racine,
  };
}
