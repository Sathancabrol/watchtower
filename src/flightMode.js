/**
 * WATCHTOWER — MODE PILOTAGE (drone / avion libre). Gratuit.
 *
 * La vue principale devient un POV de caméra embarquée : survol libre de
 * l'environnement 3D. HUD de pilote complet en fenêtres INDÉPENDANTES,
 * chacune DÉPLAÇABLE (glisser l'en-tête) et REDIMENSIONNABLE (tirer le coin) :
 * VITESSE · ALTITUDE/VARIO · POSITION · ASSIETTE (horizon artificiel) ·
 * TÉLÉMÉTRIE · MÉTÉO (hygrométrie, vent réels Open-Meteo) · MASSE.
 *
 * Commandes (AZERTY physique) : Z/S piquer/cabrer · Q/D virage (inclinaison) ·
 * ↑/↓ gaz · MAJ boost ×2 · ESPACE stabilisation · ÉCHAP quitter.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';
import { CATEGORIES, FILTRES_VOL, ENGINS, bornesVol, cssFiltreVol, dessinerEngin, engin, filtrerEngins } from './engins.js';
import {
  VUES_VOL, ajusterDistance, bornerSite, cameraTroisiemePersonne, normaliserCap,
  orientationCamera, translationVtol,
} from './data/volVues.js';
import {
  DEFAUTS as DEFAUTS_PARCOURS, PRESETS as PRESETS_PARCOURS, cumulees, echantillonner,
  generer as genererParcours, positionA, resumer as resumerParcours, simplifier,
} from './data/volParcours.js';

const CSS = `
#wt-vol-hud { position: fixed; inset: 0; z-index: 1500; pointer-events: none; font-family: var(--font-mono, monospace); }
.wt-vol-w {
  position: absolute; pointer-events: auto; min-width: 130px; min-height: 64px;
  resize: both; overflow: auto; color: #9fe8b0;
  background: rgba(6, 12, 9, 0.72); border: 1px solid rgba(120, 230, 150, 0.35);
  border-radius: 10px; backdrop-filter: blur(6px); font-size: 11px;
}
.wt-vol-w .tete { cursor: move; padding: 4px 8px; font-size: 8px; letter-spacing: 2px; color: rgba(159,232,176,0.6); border-bottom: 1px solid rgba(120,230,150,0.2); display: flex; justify-content: space-between; }
.wt-vol-w .corps { padding: 6px 9px; line-height: 1.55; }
.wt-vol-w .gros { font-size: 21px; font-weight: 800; color: #b8ffc9; text-shadow: 0 0 10px rgba(120,230,150,0.4); }
#wt-vol-barre {
  position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 1600; pointer-events: auto;
  background: rgba(6,12,9,0.85); border: 1px solid #78e696; border-radius: 10px; padding: 7px 14px;
  font-family: var(--font-mono, monospace); font-size: 9px; letter-spacing: 1px; color: #9fe8b0;
  display: flex; gap: 12px; align-items: center;
}
#wt-vol-barre button { cursor: pointer; background: rgba(240,90,90,0.12); border: 1px solid #f08a8a; color: #f08a8a; border-radius: 7px; padding: 5px 10px; font-family: inherit; font-size: 9px; font-weight: 700; }
/* joystick simulé (souris) — pilote le drone en tirant le poignet */
#wt-vol-stick {
  position: fixed; top: 52px; left: 50%; transform: translateX(-50%); z-index: 1610;
  pointer-events: auto; text-align: center;
}
#wt-vol-stick .base {
  width: 118px; height: 118px; margin: 0 auto; border-radius: 50%;
  border: 1px solid rgba(120,230,150,0.55);
  background: radial-gradient(circle at 50% 45%, rgba(10,20,14,0.55), rgba(6,12,9,0.85));
  position: relative; cursor: grab; touch-action: none;
  box-shadow: inset 0 0 22px rgba(120,230,150,0.12), 0 0 14px rgba(120,230,150,0.15);
}
#wt-vol-stick .base::before, #wt-vol-stick .base::after {
  content: ''; position: absolute; background: rgba(120,230,150,0.25);
}
#wt-vol-stick .base::before { left: 50%; top: 8px; bottom: 8px; width: 1px; }
#wt-vol-stick .base::after { top: 50%; left: 8px; right: 8px; height: 1px; }
#wt-vol-stick .poignet {
  position: absolute; width: 42px; height: 42px; border-radius: 50%;
  left: 50%; top: 50%; transform: translate(-50%, -50%);
  background: rgba(120,230,150,0.3); border: 2px solid #78e696;
  box-shadow: 0 0 12px rgba(120,230,150,0.5);
}
#wt-vol-stick .base.actif { cursor: grabbing; border-color: #b8ffc9; }
#wt-vol-stick .legende { margin-top: 5px; font-size: 8px; letter-spacing: 1.5px; color: rgba(159,232,176,0.65); }
#wt-vol { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; font-size: 10px; }
#wt-vol .v-btn { cursor: pointer; padding: 9px 10px; border-radius: 8px; font-family: inherit; font-size: 9.5px; font-weight: 700; letter-spacing: 1px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.4); color: #00d4ff; }
#wt-vol .statut { color: rgba(232,234,237,0.55); line-height: 1.6; font-size: 9px; }
#wt-vol .hangar, #wt-vol .camera-filtres {
  border: 1px solid rgba(0,212,255,0.22); border-radius: 9px; padding: 7px 8px;
  background: rgba(0,212,255,0.03);
}
#wt-vol .h-t { font-size: 8px; letter-spacing: 2px; color: #00d4ff; margin-bottom: 5px; }
#wt-vol .h-filtres, #wt-vol .cf-bouts { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 5px; }
#wt-vol .h-filtres button, #wt-vol .cf-bouts button {
  cursor: pointer; padding: 4px 7px; border-radius: 6px; font-family: inherit; font-size: 8.5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: rgba(232,234,237,0.8);
}
#wt-vol .h-filtres button.actif, #wt-vol .cf-bouts button.actif {
  background: rgba(0,212,255,0.24); border-color: #00d4ff; color: #fff;
}
#wt-vol .h-cherche {
  width: 100%; box-sizing: border-box; margin-bottom: 5px; padding: 5px 7px; font-size: 9px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: inherit; outline: none;
}
#wt-vol .h-liste { display: flex; flex-direction: column; gap: 3px; max-height: 132px; overflow-y: auto; }
#wt-vol .h-engin {
  display: flex; gap: 6px; align-items: center; cursor: pointer; padding: 4px 6px; border-radius: 6px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); font-size: 9px; text-align: left;
  color: rgba(232,234,237,0.85); font-family: inherit;
}
#wt-vol .h-engin:hover { background: rgba(0,212,255,0.12); }
#wt-vol .h-engin.actif { background: rgba(0,212,255,0.26); border-color: #00d4ff; color: #fff; }
#wt-vol .h-engin .v { margin-left: auto; font-size: 8px; color: rgba(232,234,237,0.5); }
#wt-vol .h-apercu { margin-top: 6px; display: flex; gap: 7px; align-items: center; }
#wt-vol .h-canvas { width: 118px; height: 62px; background: rgba(0,0,0,0.35); border-radius: 7px; flex: none; }
#wt-vol .h-fiche { flex: 1; font-size: 8px; line-height: 1.55; color: rgba(232,234,237,0.6); }
#wt-vol .h-fiche b { color: #b8ffc9; }
#wt-vol .camera-vues {
  border: 1px solid rgba(0,212,255,0.22); border-radius: 9px; padding: 7px 8px;
  background: rgba(0,212,255,0.03); margin-bottom: 7px;
}
#wt-vol .cv-bouts { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 5px; }
#wt-vol .cv-bouts button {
  cursor: pointer; padding: 5px 8px; border-radius: 6px; font-family: inherit; font-size: 8.5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: rgba(232,234,237,0.8);
}
#wt-vol .cv-bouts button.actif { background: rgba(0,212,255,0.24); border-color: #00d4ff; color: #fff; }
#wt-vol .cv-aide { font-size: 8px; line-height: 1.6; color: rgba(232,234,237,0.55); }
#wt-vol .cv-aide b { color: #b8ffc9; }
#wt-vol .parcours { padding: 7px; border: 1px solid rgba(0,212,255,0.25); border-radius: 9px;
  background: rgba(0,212,255,0.03); margin-bottom: 7px; }
#wt-vol .pc-presets, #wt-vol .pc-actions { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 5px; }
#wt-vol .pc-presets button, #wt-vol .pc-actions button {
  cursor: pointer; padding: 5px 7px; border-radius: 6px; font-family: inherit; font-size: 8.5px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: rgba(232,234,237,0.85); }
#wt-vol .pc-presets button.actif, #wt-vol .pc-actions button.actif {
  background: rgba(0,212,255,0.24); border-color: #00d4ff; color: #fff; }
#wt-vol .pc-actions button.rouge { background: rgba(255,80,80,0.12); border-color: rgba(255,80,80,0.45); color: #ffb3b3; }
#wt-vol .pc-params { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 5px; }
#wt-vol .pc-params label { display: flex; flex-direction: column; gap: 2px; font-size: 8px; opacity: .75; }
#wt-vol .pc-params input { padding: 4px 6px; font-size: 9px; }
#wt-vol .pc-liste { display: flex; flex-direction: column; gap: 3px; max-height: 130px; overflow-y: auto; }
#wt-vol .pc-item { display: flex; gap: 4px; align-items: center; padding: 4px 6px; border-radius: 6px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 8.5px; }
#wt-vol .pc-item span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-vol .pc-item button { cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.7); font-size: 10px; padding: 0 2px; }
#wt-vol .pc-item button:hover { color: #00d4ff; }
#wt-vol .pc-info { font-size: 8px; line-height: 1.6; color: rgba(232,234,237,0.55); margin-bottom: 4px; }
#wt-vol input { padding: 7px 9px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 10px; outline: none; }
`;

const deg = Cesium.Math.toDegrees;
const rad = Cesium.Math.toRadians;

export function initFlightMode(viewer, options = {}) {
  const { cockpit = null, mobiglas = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let vol = null;      // état du vol en cours ({ atterrir })
  let avatar = null;   // entité Cesium de l'appareil (vue 3ᵉ personne)
  let etatVol = null;  // télémétrie du vol en cours (pour les parcours)
  let departVol = null;// point de décollage (navette « retour à la base »)

  const el = document.createElement('div');
  el.id = 'wt-vol';
  el.innerHTML = `
    <div class="hangar">
      <div class="h-t">🏠 HANGAR — CHOISIR UN ENGIN</div>
      <div class="h-filtres"></div>
      <input class="h-cherche" type="text" placeholder="🔍 filtrer (nom, appareil…)" />
      <div class="h-liste"></div>
      <div class="h-apercu">
        <canvas class="h-canvas" width="240" height="128"></canvas>
        <div class="h-fiche"></div>
      </div>
    </div>
    <div class="camera-filtres">
      <div class="h-t">🎛 FILTRE DE CAMÉRA</div>
      <div class="cf-bouts"></div>
    </div>
    <div class="camera-vues">
      <div class="h-t">👁 VUE DE LA CAMÉRA</div>
      <div class="cv-bouts"></div>
      <div class="cv-aide"></div>
    </div>
    <div class="parcours">
      <div class="h-t">🛩 PARCOURS DE VOL</div>
      <div class="pc-presets"></div>
      <div class="pc-params">
        <label>Rayon / largeur (m)<input class="pc-rayon" type="number" step="50" /></label>
        <label>Altitude (m)<input class="pc-alt" type="number" step="20" /></label>
        <label>Tours / lignes<input class="pc-tours" type="number" step="1" /></label>
        <label>Vitesse de rejeu (m/s)<input class="pc-vitesse" type="number" step="5" /></label>
      </div>
      <div class="pc-actions">
        <button class="pc-tracer" type="button">📐 TRACER</button>
        <button class="pc-jouer" type="button">▶ JOUER</button>
        <button class="pc-stop" type="button">⏹ STOP</button>
        <button class="pc-sauver" type="button">💾 SAUVER</button>
        <button class="pc-rec rouge" type="button">🔴 ENREGISTRER LE VOL</button>
      </div>
      <div class="pc-info">Aucun parcours.</div>
      <div class="pc-liste"></div>
    </div>
    <button class="v-btn decoller" type="button">🛫 DÉCOLLER — MODE PILOTAGE</button>
    <div style="display:flex;gap:6px;align-items:center"><span>⚖ Masse (kg)</span>
      <input class="v-masse" type="number" value="1350" style="flex:1" /></div>
    <button class="v-btn gris hud" type="button" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.16);color:rgba(232,234,237,0.8)">🧹 HUD ÉPURÉ (touche H)</button>
    <div class="statut">La vue principale devient une caméra embarquée. Commandes :
    <b>Z/S</b> piquer/cabrer · <b>Q/D</b> virage incliné · <b>↑/↓</b> gaz · <b>MAJ</b> boost ·
    <b>ESPACE</b> stabilisation · <b>V</b> changer de vue (POV / VTOL / 3ᵉ personne) ·
    <b>M</b> HUD compact mobiGlas · <b>🕹 STICK</b> joystick souris (haut centre) · <b>ÉCHAP</b> quitter.
    Les raccourcis s'affichent aussi dans le HUD. Chaque fenêtre se déplace (en-tête)
    et se redimensionne (coin). Météo/hygrométrie réelles (Open-Meteo).
    Astuce : active 🏙 BÂTI 3D avant de décoller — les noms 🏛 au-dessus des toits
    sont CLIQUABLES → fiche du bâtiment.</div>`;

  // ── 🏠 HANGAR : choix de l'engin (performances réelles) ──
  let enginId = 'cessna';
  let filtreCat = '';
  let filtreTexte = '';
  let filtreCamera = 'normal';

  // ── 👁 VUES DE CAMÉRA : POV (embarquée) · VTOL (sur-place + nacelle 360°)
  // · TPS (3ᵉ personne, appareil visible). La NACELLE (gimbal) est une
  // orientation de caméra INDÉPENDANTE du cap de l'appareil : en VTOL comme
  // en 3ᵉ personne on peut tourner le regard sur 360° sans bouger l'engin.
  const VUES = VUES_VOL;
  const CLE_VUE = 'watchtower.vol.vue.v1';
  const lireVue = () => {
    try {
      const v = window.localStorage.getItem(CLE_VUE);
      return VUES.some((x) => x.cle === v) ? v : 'pov';
    } catch { return 'pov'; }
  };
  const ecrireVue = (v) => { try { window.localStorage.setItem(CLE_VUE, v); } catch { /* plein */ } };
  let modeVue = lireVue();
  const gimbal = { cap: 0, tangage: 0 };   // orientation de la NACELLE (rad)
  const TPS = { distance: 42, hauteur: 12 }; // recul de la caméra 3ᵉ personne

  const elFiltres = el.querySelector('.h-filtres');
  const elListe = el.querySelector('.h-liste');
  const elCherche = el.querySelector('.h-cherche');
  const elCanvas = el.querySelector('.h-canvas');
  const elFiche = el.querySelector('.h-fiche');
  const elCam = el.querySelector('.cf-bouts');

  function rendreFiltres() {
    elFiltres.innerHTML = '';
    const tout = document.createElement('button');
    tout.type = 'button';
    tout.textContent = 'TOUS';
    tout.className = filtreCat ? '' : 'actif';
    tout.addEventListener('click', () => { filtreCat = ''; rendreFiltres(); rendreListe(); });
    elFiltres.appendChild(tout);
    for (const c of CATEGORIES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${c.ic} ${c.nom}`;
      b.className = filtreCat === c.cle ? 'actif' : '';
      b.addEventListener('click', () => { filtreCat = c.cle; rendreFiltres(); rendreListe(); });
      elFiltres.appendChild(b);
    }
  }

  function rendreListe() {
    elListe.innerHTML = '';
    for (const e of filtrerEngins(filtreCat, filtreTexte)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `h-engin${e.id === enginId ? ' actif' : ''}`;
      b.innerHTML = `<span>${e.ic}</span><span>${e.nom}</span><span class="v">${e.croisiere} km/h</span>`;
      b.addEventListener('click', () => { enginId = e.id; rendreListe(); rendreApercu(); });
      elListe.appendChild(b);
    }
    if (!elListe.children.length) elListe.innerHTML = '<div style="font-size:8px;opacity:.5">Aucun engin ne correspond.</div>';
  }

  function rendreApercu() {
    const e = engin(enginId);
    const ctx = elCanvas.getContext('2d');
    if (ctx) dessinerEngin(ctx, enginId, { largeur: 240, hauteur: 128, couleur: '#00d4ff' });
    elFiche.innerHTML = `<b>${e.nom}</b> · ${e.reference}<br>
      croisière <b>${e.croisiere}</b> km/h · max <b>${e.vMax}</b> km/h${e.vMin ? ` · décrochage <b>${e.vMin}</b>` : ''}<br>
      montée <b>${e.montee}</b> m/s · plafond <b>${e.plafond ? `${e.plafond.toLocaleString('fr-FR')} m` : 'sol/mer'}</b><br>
      conso ~<b>${e.conso} ${e.unite}</b> · masse <b>${e.masse.toLocaleString('fr-FR')} kg</b><br>
      <span style="opacity:.7">${e.note}</span>`;
  }

  elCherche.addEventListener('input', () => { filtreTexte = elCherche.value; rendreListe(); });
  rendreFiltres(); rendreListe(); rendreApercu();

  // ── 👁 VUES DE CAMÉRA (POV · VTOL · 3ᵉ personne) ──
  const elVues = el.querySelector('.cv-bouts');
  const elAideVues = el.querySelector('.cv-aide');

  const surMessageVue = () => {
    const v = VUES.find((x) => x.cle === modeVue);
    window.__wtToast?.(`${v?.ic || '👁'} Vue ${v?.nom || ''} — ${v?.aide || ''}`);
  };

  /**
   * Applique une vue (POV / VTOL / 3ᵉ personne) — UNE SEULE fonction, pour que
   * l'avatar de l'appareil suive TOUJOURS (boutons comme touche V). Avant, les
   * boutons changeaient `modeVue` sans toucher à `avatar.show` : la 3ᵉ personne
   * semblait « ne pas marcher » (caméra reculée mais appareil invisible, ou
   * appareil collé à l'écran en POV).
   */
  function appliquerVue(cle) {
    if (!VUES.some((v) => v.cle === cle)) return;
    modeVue = cle;
    ecrireVue(cle);
    if (avatar) avatar.show = (cle === 'tps');
    rendreVues();
  }

  function rendreVues() {
    elVues.innerHTML = '';
    for (const v of VUES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${v.ic} ${v.nom}`;
      b.className = modeVue === v.cle ? 'actif' : '';
      b.addEventListener('click', () => appliquerVue(v.cle));
      elVues.appendChild(b);
    }
    elAideVues.innerHTML = modeVue === 'vtol'
      ? `<b>VTOL</b> — l’appareil fait du sur-place : on observe.<br>
         <b>←/→</b> nacelle 360° · <b>PAGE↑/↓</b> site · <b>C</b> recentrer ·
         <b>↑/↓</b> altitude · <b>Z/S</b> avancer/reculer · <b>Q/D</b> latéral ·
         <b>glisser la souris</b> sur la vue = orienter la nacelle.`
      : modeVue === 'tps'
        ? `<b>3ᵉ PERSONNE</b> — l’appareil est visible, la caméra le suit.<br>
           <b>←/→</b> orbiter autour · <b>PAGE↑/↓</b> hauteur de caméra ·
           <b>[ / ]</b> distance · <b>C</b> dans l’axe · <b>V</b> changer de vue.`
        : `<b>POV</b> — caméra embarquée. <b>Z/S</b> piquer/cabrer · <b>Q/D</b> virage ·
           <b>↑/↓</b> gaz · <b>V</b> passer en VTOL (observation) ou 3ᵉ personne.`;
  }
  rendreVues();

  // ── 🛩 PARCOURS DE VOL : préréglages, tracé sur la carte, rejeu caméra,
  // enregistrement du vol réellement effectué, sauvegarde locale. ──
  const CLE_PARCOURS = 'watchtower.parcours.v1';
  const dsParcours = new Cesium.CustomDataSource('wt-parcours');
  viewer.dataSources.add(dsParcours);

  const elPresets = el.querySelector('.pc-presets');
  const elInfo = el.querySelector('.pc-info');
  const elListeParcours = el.querySelector('.pc-liste');
  const chRayon = el.querySelector('.pc-rayon');
  const chAlt = el.querySelector('.pc-alt');
  const chTours = el.querySelector('.pc-tours');
  const chVit = el.querySelector('.pc-vitesse');
  chRayon.value = String(DEFAUTS_PARCOURS.rayon);
  chAlt.value = String(DEFAUTS_PARCOURS.altitude);
  chTours.value = String(DEFAUTS_PARCOURS.tours);
  chVit.value = '60';

  let preset = 'orbite';
  let chemin = [];            // parcours tracé à l'écran
  let lecture = null;         // intervalle du rejeu
  let cumul = null;
  let avancement = 0;
  let enregistrement = null;  // vol réellement effectué

  function sauvParcours() {
    try { return JSON.parse(window.localStorage.getItem(CLE_PARCOURS) || '[]'); } catch { return []; }
  }
  function ecrireParcours(liste) {
    try { window.localStorage.setItem(CLE_PARCOURS, JSON.stringify(liste)); } catch { /* plein */ }
  }

  /** distance au sol (m) entre deux points lon/lat. */
  function distanceVol(a = {}, b = {}) {
    const latMoy = ((Number(a.lat) + Number(b.lat)) / 2) * Math.PI / 180;
    const dx = (Number(b.lon) - Number(a.lon)) * 111_320 * Math.cos(latMoy);
    const dy = (Number(b.lat) - Number(a.lat)) * 111_320;
    return Math.hypot(dx, dy);
  }

  /** Le centre du parcours : le centre de la vue (ou la position de l'appareil en vol). */
  function centreParcours() {
    if (etatVol && Number.isFinite(etatVol.lon)) return { lon: etatVol.lon, lat: etatVol.lat };
    const c = viewer.camera.positionCartographic;
    return { lon: deg(c.longitude), lat: deg(c.latitude) };
  }

  function paramsActuels() {
    return {
      rayon: Math.max(20, Number(chRayon.value) || DEFAUTS_PARCOURS.rayon),
      largeur: Math.max(50, Number(chRayon.value) || DEFAUTS_PARCOURS.largeur),
      hauteur: Math.max(50, Number(chRayon.value) || DEFAUTS_PARCOURS.hauteur),
      altitude: Math.max(5, Number(chAlt.value) || DEFAUTS_PARCOURS.altitude),
      tours: Math.max(1, Number(chTours.value) || DEFAUTS_PARCOURS.tours),
      lignes: Math.max(2, Number(chTours.value) || DEFAUTS_PARCOURS.lignes),
      points: DEFAUTS_PARCOURS.points,
    };
  }

  /** Dessine le parcours sur la carte (ligne + bornes de début/fin). */
  function tracer(liste) {
    dsParcours.entities.removeAll();
    chemin = echantillonner(liste, 25);
    cumul = cumulees(chemin);
    if (chemin.length < 2) { elInfo.textContent = 'Parcours trop court.'; return; }
    dsParcours.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(
          chemin.flatMap((p) => [p.lon, p.lat, p.alt]),
        ),
        width: 4,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.3, color: Cesium.Color.fromCssColorString('#00d4ff'),
        }),
      },
    });
    const borne = (p, couleur, texte) => dsParcours.entities.add({
      position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt),
      point: { pixelSize: 12, color: Cesium.Color.fromCssColorString(couleur), outlineWidth: 2, outlineColor: Cesium.Color.BLACK },
      label: {
        text: texte, font: '600 11px "JetBrains Mono", monospace',
        fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    borne(chemin[0], '#7ef0c0', 'DÉPART');
    borne(chemin[chemin.length - 1], '#ff8a3d', 'FIN');
    const r = resumerParcours(chemin, Number(chVit.value) || 60);
    elInfo.textContent = `${r.points} points · ${r.longueur} m · ${r.duree} s de rejeu · altitude ${r.altMin} → ${r.altMax} m`;
  }

  /** Rejoue le parcours : la caméra suit la ligne (façon drone qui scanne). */
  function jouer() {
    arreter();
    if (chemin.length < 2) { elInfo.textContent = 'Trace d’abord un parcours.'; return; }
    const vitesse = Math.max(5, Number(chVit.value) || 60);
    const total = resumerParcours(chemin, vitesse).duree;
    avancement = 0;
    let dernier = Date.now();
    lecture = window.setInterval(() => {
      const maintenant = Date.now();
      const dt = (maintenant - dernier) / 1000;
      dernier = maintenant;
      avancement = Math.min(1, avancement + dt / Math.max(1, total));
      const p = positionA(chemin, avancement, cumul);
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt),
        orientation: { heading: p.cap, pitch: rad(-24), roll: 0 },
      });
      viewer.scene.requestRender?.();
      if (avancement >= 1) arreter();
    }, 60);
    elInfo.textContent = `▶ Rejeu en cours (${Math.round(total)} s) — STOP pour interrompre.`;
  }

  function arreter() {
    if (lecture) window.clearInterval(lecture);
    lecture = null;
  }

  function rendreListe() {
    const liste = sauvParcours();
    elListeParcours.innerHTML = '';
    if (!liste.length) {
      elListeParcours.innerHTML = '<div style="opacity:.5;font-size:8px">Aucun parcours enregistré.</div>';
      return;
    }
    for (const [i, item] of liste.entries()) {
      const d = document.createElement('div');
      d.className = 'pc-item';
      d.innerHTML = `<span>🛩 ${item.nom} · ${item.resume?.longueur ?? '?'} m</span>`;
      const jouerBtn = document.createElement('button');
      jouerBtn.type = 'button'; jouerBtn.textContent = '▶'; jouerBtn.title = 'Rejouer';
      jouerBtn.addEventListener('click', () => { tracer(item.points); jouer(); });
      const nomBtn = document.createElement('button');
      nomBtn.type = 'button'; nomBtn.textContent = '✏'; nomBtn.title = 'Renommer';
      nomBtn.addEventListener('click', () => {
        const n = window.prompt('Nom du parcours', item.nom || 'parcours');
        if (!n) return;
        const l = sauvParcours(); l[i].nom = n; ecrireParcours(l); rendreListe();
      });
      const delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.textContent = '🗑'; delBtn.title = 'Supprimer';
      delBtn.addEventListener('click', () => {
        const l = sauvParcours(); l.splice(i, 1); ecrireParcours(l); rendreListe();
      });
      d.append(jouerBtn, nomBtn, delBtn);
      elListeParcours.appendChild(d);
    }
  }

  for (const p of PRESETS_PARCOURS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${p.ic} ${p.nom}`;
    b.title = p.aide;
    b.className = p.cle === preset ? 'actif' : '';
    b.addEventListener('click', () => {
      preset = p.cle;
      for (const o of elPresets.children) o.classList.remove('actif');
      b.classList.add('actif');
      elInfo.textContent = p.aide;
    });
    elPresets.appendChild(b);
  }
  rendreListe();

  el.querySelector('.pc-tracer').addEventListener('click', () => {
    const c = centreParcours();
    const opts = paramsActuels();
    let brut = [];
    if (preset === 'navette') {
      // aller-retour : en vol, on relie l'appareil à son point de décollage ;
      // au sol, on fait une navette nord-sud de la longueur demandée.
      const arrivee = departVol && (!etatVol || distanceVol(departVol, c) > 50)
        ? departVol
        : { lon: c.lon, lat: c.lat + (opts.rayon / 111_320) };
      opts.destination = arrivee;
      brut = genererParcours('navette', c, opts);
    } else {
      brut = genererParcours(preset, c, opts);
    }
    if (!brut.length) { elInfo.textContent = 'Centre inconnu — approche-toi de la zone.'; return; }
    tracer(brut);
  });
  el.querySelector('.pc-jouer').addEventListener('click', jouer);
  el.querySelector('.pc-stop').addEventListener('click', () => { arreter(); elInfo.textContent = '⏹ Rejeu arrêté.'; });
  el.querySelector('.pc-sauver').addEventListener('click', () => {
    if (chemin.length < 2) { elInfo.textContent = 'Rien à sauver.'; return; }
    const nom = window.prompt('Nom du parcours', `${preset} ${new Date().toLocaleTimeString('fr-FR')}`);
    if (!nom) return;
    const liste = sauvParcours();
    liste.push({ nom, preset, points: simplifier(chemin, 5), resume: resumerParcours(chemin, Number(chVit.value) || 60), t: Date.now() });
    ecrireParcours(liste.slice(-20));
    rendreListe();
    elInfo.textContent = `💾 « ${nom} » enregistré (${liste.length} parcours).`;
  });
  const btnRec = el.querySelector('.pc-rec');
  btnRec.addEventListener('click', () => {
    if (!vol) { elInfo.textContent = 'Décolle d’abord : on enregistre le vol réel.'; return; }
    if (enregistrement) {
      const brut = simplifier(enregistrement, 3);
      enregistrement = null;
      btnRec.classList.remove('actif');
      btnRec.textContent = '🔴 ENREGISTRER LE VOL';
      if (brut.length > 1) {
        tracer(brut);
        elInfo.textContent = `🔴 Vol enregistré (${brut.length} points) — 💾 SAUVER pour le garder.`;
      } else elInfo.textContent = 'Vol trop court.';
    } else {
      enregistrement = [];
      btnRec.classList.add('actif');
      btnRec.textContent = '⏹ ARRÊTER L’ENREGISTREMENT';
      elInfo.textContent = '🔴 Enregistrement du vol…';
    }
  });

  /** Alimente l'enregistrement pendant le vol (appelé par la boucle). */
  function noterPosition(lon, lat, alt) {
    if (!enregistrement || !Number.isFinite(lon) || !Number.isFinite(lat)) return;
    enregistrement.push({ lon, lat, alt: alt || 0 });
  }

  // ── 🎛 FILTRES DE CAMÉRA (appliqués au rendu 3D pendant le vol) ──
  for (const f of FILTRES_VOL) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${f.ic} ${f.nom}`;
    b.className = f.cle === filtreCamera ? 'actif' : '';
    b.addEventListener('click', () => {
      filtreCamera = f.cle;
      for (const o of elCam.children) o.classList.remove('actif');
      b.classList.add('actif');
      if (vol) viewer.scene.canvas.style.filter = cssFiltreVol(filtreCamera);
    });
    elCam.appendChild(b);
  }

  function creerWidget(hud, id, titre, x, y, w) {
    const d = document.createElement('div');
    d.className = 'wt-vol-w';
    d.style.cssText = `left:${x}px;top:${y}px;width:${w}px`;
    d.innerHTML = `<div class="tete"><span>${titre}</span><span>⇲</span></div><div class="corps" data-w="${id}">—</div>`;
    hud.appendChild(d);
    rendreDeplacable(d, d.querySelector('.tete'));
    return d.querySelector('.corps');
  }

  function decoller() {
    if (vol) return;
    const enginChoisi = engin(enginId);
    const bornes = bornesVol(enginChoisi);
    const masse = Number(enginChoisi.masse) || Number(el.querySelector('.v-masse').value) || 1350;
    const c0 = viewer.camera.positionCartographic;
    const sol0 = viewer.scene.globe.getHeight(c0) || 0;
    const etat = {
      lon: deg(c0.longitude), lat: deg(c0.latitude),
      alt: bornes.auSol || bornes.surEau ? Math.max(sol0 + 2, Math.max(c0.height, sol0 + 2)) : Math.max(c0.height, sol0 + 120),
      cap: viewer.camera.heading, tangage: 0, roulis: 0,
      vitesse: Math.min(bornes.vMax, Math.max(bornes.vMin, bornes.croisiere)),
      vario: 0, distance: 0, t0: Date.now(), g: 1,
      meteo: null, masse,
      engin: enginChoisi, bornes, bloque: '',
    };
    viewer.scene.canvas.style.filter = cssFiltreVol(filtreCamera);
    viewer.scene.screenSpaceCameraController.enableInputs = false;

    // 🎥 AVATAR DE L'APPAREIL : dessin vectoriel (engins.js) posé dans la scène,
    // visible en vue 3ᵉ personne.
    avatar = null;
    try {
      const cv = document.createElement('canvas');
      cv.width = 160; cv.height = 160;
      const g = cv.getContext('2d');
      if (g) {
        dessinerEngin(g, enginId, { largeur: 160, hauteur: 160, couleur: '#b8ffc9' });
        const image = cv.toDataURL();
        avatar = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(etat.lon, etat.lat, etat.alt),
          billboard: {
            image,
            width: 52, height: 52,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(20, 1, 900, 0.35),
          },
          show: modeVue === 'tps',
        });
      }
    } catch { avatar = null; }

    // 🕶 MOBIGLAS : HUD compact au-dessus du micro, fenêtres de bureau estompées
    mobiglas?.activer?.();

    const hud = document.createElement('div');
    hud.id = 'wt-vol-hud';
    document.body.appendChild(hud);
    // 🎛 MODE PILOTAGE : poste de pilotage unique (horizon + bandes), le reste
    // de l'interface est rangé par la classe `wt-mode-vol` (voir cockpit.js).
    cockpit?.activer();
    const H = window.innerHeight; const W = window.innerWidth;
    const wVit = creerWidget(hud, 'vit', 'VITESSE', 14, H * 0.32, 150);
    const wAlt = creerWidget(hud, 'alt', 'ALTITUDE · VARIO', W - 185, H * 0.32, 170);
    const wPos = creerWidget(hud, 'pos', 'POSITION', 14, H - 190, 210);
    const wAng = creerWidget(hud, 'ang', 'ASSIETTE', W / 2 - 80, H - 160, 160);
    const wTel = creerWidget(hud, 'tel', 'TÉLÉMÉTRIE', W - 205, H - 200, 190);
    const wMet = creerWidget(hud, 'met', 'MÉTÉO · HYGRO', 14, 90, 190);
    const wMas = creerWidget(hud, 'mas', 'MASSE & CHARGE', W - 185, 90, 170);
    // ⌨ RACCOURCIS — fenêtre de commandes toujours visible
    const wRacc = creerWidget(hud, 'racc', '⌨ RACCOURCIS CLAVIER', W / 2 - 150, H * 0.34, 190);
    wRacc.innerHTML = `
      <b style="color:#b8ffc9">Z / S</b> — piquer / cabrer<br>
      <b style="color:#b8ffc9">Q / D</b> — virage incliné<br>
      <b style="color:#b8ffc9">↑ / ↓</b> — gaz<br>
      <b style="color:#b8ffc9">MAJ</b> — boost ×2<br>
      <b style="color:#b8ffc9">ESPACE</b> — stabilisation<br>
      <b style="color:#b8ffc9">🕹 STICK</b> — souris (haut centre)<br>
      <b style="color:#b8ffc9">ÉCHAP</b> — atterrir<br>
      <span style="color:rgba(159,232,176,0.55)">🏛 étiquette BÂTI 3D = clic → fiche du bâtiment</span>`;

    const barre = document.createElement('div');
    barre.id = 'wt-vol-barre';
    barre.innerHTML = `<span>✈ MODE PILOTAGE — Z/S · Q/D · ↑/↓ gaz · 🕹 stick souris</span><button type="button">🛬 ATTERRIR</button>`;
    document.body.appendChild(barre);

    // 🕹 JOYSTICK SIMULÉ (souris) — tirer le poignet = virage + tangage
    const stick = document.createElement('div');
    stick.id = 'wt-vol-stick';
    stick.innerHTML = '<div class="base"><div class="poignet"></div></div><div class="legende">🕹 TIRER = PILOTER LE DRONE</div>';
    document.body.appendChild(stick);
    const manette = { x: 0, y: 0, actif: false };
    const base = stick.querySelector('.base');
    const poignet = stick.querySelector('.poignet');
    const RAYON = 44;
    const setPoignet = () => { poignet.style.transform = `translate(calc(-50% + ${manette.x * RAYON}px), calc(-50% + ${manette.y * RAYON}px))`; };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      manette.actif = true;
      base.classList.add('actif');
      try { base.setPointerCapture(e.pointerId); } catch { /* ok */ }
    });
    base.addEventListener('pointermove', (e) => {
      if (!manette.actif) return;
      const r = base.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.min(1, Math.hypot(dx, dy) / RAYON);
      const ang = Math.atan2(dy, dx);
      manette.x = Math.cos(ang) * d;
      manette.y = Math.sin(ang) * d;
      setPoignet();
    });
    const relacherStick = () => {
      manette.actif = false; manette.x = 0; manette.y = 0;
      base.classList.remove('actif');
      setPoignet();
    };
    base.addEventListener('pointerup', relacherStick);
    base.addEventListener('pointercancel', relacherStick);

    const touches = new Set();
    const down = (e) => {
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'PageUp', 'PageDown', 'KeyC', 'KeyV', 'BracketLeft', 'BracketRight',
        'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        touches.add(e.code); e.preventDefault(); e.stopPropagation();
      }
      // V : on change de vue à la volée (POV → VTOL → 3ᵉ personne)
      if (e.code === 'KeyV' && vol) {
        const i = VUES.findIndex((v) => v.cle === modeVue);
        appliquerVue(VUES[(i + 1) % VUES.length].cle);
        surMessageVue?.();
      }
      if (e.code === 'Escape') atterrir();
    };
    const up = (e) => touches.delete(e.code);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);

    const majMeteo = () => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${etat.lat.toFixed(2)}&longitude=${etat.lon.toFixed(2)}&current=relative_humidity_2m,temperature_2m,wind_speed_10m,wind_direction_10m,pressure_msl`)
        .then((r) => r.json()).then((d) => { etat.meteo = d?.current || null; }).catch(() => {});
    };
    majMeteo();
    const meteoTimer = window.setInterval(majMeteo, 90000);

    let tick = 0;
    const boucle = window.setInterval(() => {
      const dt = 0.05;
      const boost = touches.has('ShiftLeft') || touches.has('ShiftRight') ? 2 : 1;
      // ── commandes (modèle de vol de l'engin choisi) ──
      const B = etat.bornes;
      const vtol = modeVue === 'vtol';
      const accel = 40 / Math.max(0.4, B.inertie);   // m/s² proportionnel à l'inertie

      // ── 🧭 NACELLE : en VTOL / 3ᵉ personne la caméra pivote sur 360° ──
      // C'est une tourelle d'observation : son orientation est INDÉPENDANTE du
      // cap de l'appareil. Souris (glisser) ou flèches ←/→ + PAGE↑/↓.
      const vitNacelle = 1.6 * dt;
      if (modeVue !== 'pov') {
        if (touches.has('ArrowLeft')) gimbal.cap -= vitNacelle;
        if (touches.has('ArrowRight')) gimbal.cap += vitNacelle;
        if (touches.has('PageUp')) gimbal.tangage = bornerSite(gimbal.tangage + vitNacelle);
        if (touches.has('PageDown')) gimbal.tangage = bornerSite(gimbal.tangage - vitNacelle);
        // joystick souris : on oriente la nacelle au lieu de piloter
        if (Math.abs(manette.x) > 0.08) gimbal.cap += manette.x * vitNacelle * 2.2;
        if (Math.abs(manette.y) > 0.08) {
          gimbal.tangage = bornerSite(gimbal.tangage - manette.y * vitNacelle * 1.6);
        }
        gimbal.cap = normaliserCap(gimbal.cap);
        // distance de la caméra 3ᵉ personne
        if (touches.has('BracketRight')) TPS.distance = ajusterDistance(TPS.distance, 60 * dt);
        if (touches.has('BracketLeft')) TPS.distance = ajusterDistance(TPS.distance, -60 * dt);
      }
      if (touches.has('KeyC')) { gimbal.cap = 0; gimbal.tangage = 0; }

      if (vtol) {
        // 🧭 VTOL : l'appareil tient son altitude, on translate doucement
        const montee = Math.max(1.2, B.montee * 0.55) * (boost > 1 ? 1.6 : 1);
        if (touches.has('ArrowUp')) etat.alt += montee * dt;
        if (touches.has('ArrowDown')) etat.alt -= montee * dt;
        etat.vitesse = 0; etat.tangage = 0; etat.roulis = 0;
      } else {
        if (touches.has('ArrowUp')) etat.vitesse = Math.min(B.vMax, etat.vitesse + accel * dt);
        if (touches.has('ArrowDown')) etat.vitesse = Math.max(B.peutStationner ? 0 : B.vMin, etat.vitesse - accel * dt);
      }
      // garde-fou : sous la vitesse de décrochage, l'appareil perd de l'altitude
      const decroche = !vtol && !B.peutStationner && etat.vitesse < B.vMin * 0.95;

      if (vtol) {
        // translation lente dans le repère de l'APPAREIL (pas de la nacelle)
        const pas = Math.max(5, B.croisiere * 0.30) * (boost > 1 ? 2 : 1) * dt;
        const avant = (touches.has('KeyW') ? 1 : 0) - (touches.has('KeyS') ? 1 : 0);
        const cote = (touches.has('KeyD') ? 1 : 0) - (touches.has('KeyA') ? 1 : 0);
        if (avant || cote) {
          const p = translationVtol(etat, { avant, cote, pas });
          etat.lat = p.lat; etat.lon = p.lon;
        }
      } else {
        if (touches.has('KeyW')) etat.tangage = Math.max(-1.1, etat.tangage - 0.9 * dt);
        if (touches.has('KeyS')) etat.tangage = Math.min(1.1, etat.tangage + 0.9 * dt);
      }
      // 🔄 VIRAGE : la vitesse angulaire max dépend de l'engin et de la vitesse
      const tauxVirage = (dir) => {
        const facteur = 0.55 + 0.45 * Math.min(1, (etat.vitesse * boost) / Math.max(1, B.croisiere));
        etat.cap += dir * B.virage * facteur * dt;
        etat.roulis = Math.max(-0.6, Math.min(0.6, etat.roulis + dir * B.virage * 1.5 * dt));
      };
      if (!vtol) {
        if (touches.has('KeyA')) tauxVirage(-1);
        else if (touches.has('KeyD')) tauxVirage(1);
        else etat.roulis *= 0.92;
      }
      if (touches.has('Space')) {
        if (modeVue === 'pov') { etat.tangage *= 0.85; etat.roulis *= 0.8; } else gimbal.tangage *= 0.8;
      }
      // 🕹 joystick souris : en POV il pilote, sinon il oriente la nacelle (déjà fait plus haut)
      if (modeVue === 'pov') {
        if (Math.abs(manette.x) > 0.08) tauxVirage(Math.sign(manette.x) * Math.abs(manette.x));
        if (Math.abs(manette.y) > 0.08) {
          etat.tangage = Math.max(-1.1, Math.min(1.1, etat.tangage - manette.y * 0.95 * dt));
        }
      }

      // ── cinématique ──
      const v = etat.vitesse * boost;
      const dSol = v * Math.cos(etat.tangage) * dt;
      const altAvant = etat.alt;
      const latAvant = etat.lat;
      const lonAvant = etat.lon;
      etat.lat += (dSol * Math.cos(etat.cap)) / 111320;
      etat.lon += (dSol * Math.sin(etat.cap)) / (111320 * Math.cos(rad(etat.lat)));
      // montée/descente : bornée par les performances réelles de l'engin
      const monteeMax = Math.max(0.2, B.montee) * (boost > 1 ? 1.35 : 1);
      const dAltVoulu = v * Math.sin(etat.tangage) * dt;
      const dAlt = Math.max(-monteeMax * dt * 1.6, Math.min(monteeMax * dt, dAltVoulu));
      etat.alt += dAlt;
      if (decroche) etat.alt -= 3.5 * dt;              // décrochage : ça descend
      if (B.tauxChute && !vtol) etat.alt -= B.tauxChute * dt;   // planeur : chute permanente
      const sol = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(etat.lon, etat.lat)) || 0;

      // plafond réglementaire / physique de l'engin
      if (B.plafond && etat.alt > B.plafond) { etat.alt = B.plafond; etat.tangage = Math.max(0, etat.tangage); }
      // engins terrestres et maritimes : collés au support
      if (B.auSol) { etat.alt = sol + 2; etat.tangage = 0; }
      if (B.surEau) {
        if (sol > 3) { // terre émergée : la vedette s'arrête (demi-tour)
          etat.lat = latAvant; etat.lon = lonAvant; etat.bloque = '⚓ TERRE — DEMI-TOUR';
        } else { etat.alt = Math.max(1, sol) + 1.5; etat.bloque = ''; }
      } else etat.bloque = '';
      // collision sol
      if (etat.alt < sol + 4) { etat.alt = sol + 4; etat.tangage = Math.max(0, etat.tangage); }
      etat.vario = (etat.alt - altAvant) / dt;
      noterPosition(etat.lon, etat.lat, etat.alt);
      etat.distance += dSol;
      etat.g = 1 + Math.abs(etat.roulis) * 0.9 + Math.abs(etat.tangage) * 0.4;

      // ── caméra : POV / VTOL (nacelle 360°) / 3ᵉ personne ──
      const oCam = orientationCamera(
        { cap: etat.cap, tangage: etat.tangage },
        modeVue === 'pov' ? { cap: 0, tangage: 0 } : gimbal,
      );
      const capCam = oCam.cap;
      const pitchCam = oCam.tangage;
      if (modeVue === 'tps') {
        // recul derrière l'appareil, dans l'axe de la nacelle
        const c = cameraTroisiemePersonne(etat, { distance: TPS.distance, hauteur: TPS.hauteur });
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, c.alt),
          orientation: { heading: capCam, pitch: pitchCam, roll: 0 },
        });
      } else {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(etat.lon, etat.lat, etat.alt),
          orientation: { heading: capCam, pitch: pitchCam, roll: vtol ? 0 : (B.auSol || B.surEau ? 0 : etat.roulis) },
        });
      }
      // avatar de l'appareil : visible en 3ᵉ personne
      if (avatar) {
        avatar.position = Cesium.Cartesian3.fromDegrees(etat.lon, etat.lat, etat.alt);
        if (avatar.billboard) avatar.billboard.rotation = -etat.cap;
      }

      // HUD (10 Hz)
      tick += 1;
      if (tick % 2 === 0) {
        const kmh = Math.round(v * 3.6);
        wVit.innerHTML = `<div class="gros">${kmh}</div>km/h · ${Math.round(kmh / 1.852)} kt<br>gaz ${Math.round((etat.vitesse / 320) * 100)}%${boost > 1 ? ' <b>BOOST</b>' : ''}`;
        wAlt.innerHTML = `<div class="gros">${Math.round(etat.alt - sol)}</div>m sol (AGL)<br>${Math.round(etat.alt)} m mer · vario ${etat.vario >= 0 ? '+' : ''}${etat.vario.toFixed(1)} m/s`;
        wPos.innerHTML = `LAT <b>${etat.lat.toFixed(5)}</b><br>LON <b>${etat.lon.toFixed(5)}</b><br>SOL ${Math.round(sol)} m`;
        const capDeg = Math.round(((deg(capCam) % 360) + 360) % 360);
        const nomVue = VUES.find((v) => v.cle === modeVue)?.nom || 'POV';
        wAng.innerHTML = `CAP <b class="gros" style="font-size:16px">${String(capDeg).padStart(3, '0')}°</b><br>${nomVue} · nacelle ${Math.round(deg(gimbal.cap))}°<br>tangage ${Math.round(deg(etat.tangage))}° · roulis ${Math.round(deg(etat.roulis))}°`;
        const mins = Math.floor((Date.now() - etat.t0) / 60000);
        wTel.innerHTML = `G ≈ <b>${etat.g.toFixed(2)}</b> · vol ${mins} min<br>distance ${(etat.distance / 1000).toFixed(2)} km<br>conso est. ${(etat.distance / 1000 * (etat.masse / 1350) * 0.09).toFixed(1)} L`;
        const m = etat.meteo;
        wMet.innerHTML = m ? `hygrométrie <b>${m.relative_humidity_2m}%</b><br>vent ${Math.round(m.wind_speed_10m)} km/h @${Math.round(m.wind_direction_10m)}°<br>${Math.round(m.temperature_2m)}°C · ${Math.round(m.pressure_msl)} hPa` : 'mesure…';
        wMas.innerHTML = `masse <b>${etat.masse} kg</b><br>charge utile ${Math.max(0, 1900 - etat.masse)} kg<br>inertie ${(etat.masse / 1350).toFixed(2)}×`;
        // 🎛 cockpit : horizon artificiel, bandes, gaz, télémétrie
        const vueCockpit = {
          vitesse: v, alt: etat.alt, sol, cap: capCam, tangage: pitchCam,
          roulis: etat.roulis, vario: etat.vario, g: etat.g, distance: etat.distance,
          masse: etat.masse, duree: Date.now() - etat.t0,
          gaz: (etat.vitesse - etat.bornes.vMin) / Math.max(1, etat.bornes.vMax - etat.bornes.vMin),
          engin: `${etat.engin?.ic || '✈'} ${etat.engin?.nom || ''}${modeVue !== 'pov' ? ` · ${VUES.find((x) => x.cle === modeVue)?.nom || ''}` : ''}`,
          bloque: etat.bloque,
          decroche: !etat.bornes.peutStationner && !vtol && etat.vitesse < etat.bornes.vMin * 0.95,
          plafond: Boolean(etat.bornes.plafond) && etat.alt >= etat.bornes.plafond - 2,
        };
        cockpit?.maj(vueCockpit);
        // 🕶 MOBIGLAS : une seule ligne d'instruments, au-dessus du micro
        mobiglas?.maj(vueCockpit);
      }
    }, 50);

    function atterrir() {
      if (!vol) return;
      if (enregistrement && btnRec) {
        const brut = simplifier(enregistrement, 3);
        enregistrement = null;
        btnRec.classList.remove('actif');
        btnRec.textContent = '🔴 ENREGISTRER LE VOL';
        if (brut.length > 1) tracer(brut);
      }
      cockpit?.desactiver();
      mobiglas?.desactiver?.();
      if (avatar) { try { viewer.entities.remove(avatar); } catch { /* ok */ } avatar = null; }
      viewer.scene.canvas.style.filter = ''; // on rend le rendu normal
      window.clearInterval(boucle);
      window.clearInterval(meteoTimer);
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
      hud.remove(); barre.remove(); stick.remove();
      viewer.scene.screenSpaceCameraController.enableInputs = true;
      viewer.camera.setView({
        destination: viewer.camera.position.clone(),
        orientation: { heading: etat.cap, pitch: etat.tangage, roll: 0 },
      });
      vol = null;
      etatVol = null;
      departVol = null;
    }
    barre.querySelector('button').addEventListener('click', atterrir);
    vol = { atterrir };
    etatVol = etat;
    departVol = { lon: etat.lon, lat: etat.lat };
  }

  el.querySelector('.hud')?.addEventListener('click', () => cockpit?.basculerHud());
  el.querySelector('.decoller').addEventListener('click', decoller);
  return { element: el };
}
