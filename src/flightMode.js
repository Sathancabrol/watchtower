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
#wt-vol input { padding: 7px 9px; background: rgba(0,0,0,0.45); color: inherit; border-radius: 7px; border: 1px solid rgba(255,255,255,0.12); font-family: inherit; font-size: 10px; outline: none; }
`;

const deg = Cesium.Math.toDegrees;
const rad = Cesium.Math.toRadians;

export function initFlightMode(viewer, options = {}) {
  const { cockpit = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  let vol = null; // état du vol en cours

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
    <button class="v-btn decoller" type="button">🛫 DÉCOLLER — MODE PILOTAGE POV</button>
    <div style="display:flex;gap:6px;align-items:center"><span>⚖ Masse (kg)</span>
      <input class="v-masse" type="number" value="1350" style="flex:1" /></div>
    <button class="v-btn gris hud" type="button" style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.16);color:rgba(232,234,237,0.8)">🧹 HUD ÉPURÉ (touche H)</button>
    <div class="statut">La vue principale devient une caméra embarquée. Commandes :
    <b>Z/S</b> piquer/cabrer · <b>Q/D</b> virage incliné · <b>↑/↓</b> gaz · <b>MAJ</b> boost ·
    <b>ESPACE</b> stabilisation · <b>🕹 STICK</b> joystick souris (haut centre) · <b>ÉCHAP</b> quitter.
    Les raccourcis s'affichent aussi dans le HUD. Chaque fenêtre se déplace (en-tête)
    et se redimensionne (coin). Météo/hygrométrie réelles (Open-Meteo).
    Astuce : active 🏙 BÂTI 3D avant de décoller — les noms 🏛 au-dessus des toits
    sont CLIQUABLES → fiche du bâtiment.</div>`;

  // ── 🏠 HANGAR : choix de l'engin (performances réelles) ──
  let enginId = 'cessna';
  let filtreCat = '';
  let filtreTexte = '';
  let filtreCamera = 'normal';

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
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'Space', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        touches.add(e.code); e.preventDefault(); e.stopPropagation();
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
      const accel = 40 / Math.max(0.4, B.inertie);   // m/s² proportionnel à l'inertie
      if (touches.has('ArrowUp')) etat.vitesse = Math.min(B.vMax, etat.vitesse + accel * dt);
      if (touches.has('ArrowDown')) etat.vitesse = Math.max(B.peutStationner ? 0 : B.vMin, etat.vitesse - accel * dt);
      // garde-fou : sous la vitesse de décrochage, l'appareil perd de l'altitude
      const decroche = !B.peutStationner && etat.vitesse < B.vMin * 0.95;

      if (touches.has('KeyW')) etat.tangage = Math.max(-1.1, etat.tangage - 0.9 * dt);
      if (touches.has('KeyS')) etat.tangage = Math.min(1.1, etat.tangage + 0.9 * dt);
      // 🔄 VIRAGE : la vitesse angulaire max dépend de l'engin et de la vitesse
      const tauxVirage = (dir) => {
        const facteur = 0.55 + 0.45 * Math.min(1, (etat.vitesse * boost) / Math.max(1, B.croisiere));
        etat.cap += dir * B.virage * facteur * dt;
        etat.roulis = Math.max(-0.6, Math.min(0.6, etat.roulis + dir * B.virage * 1.5 * dt));
      };
      if (touches.has('KeyA')) tauxVirage(-1);
      else if (touches.has('KeyD')) tauxVirage(1);
      else etat.roulis *= 0.92;
      if (touches.has('Space')) { etat.tangage *= 0.85; etat.roulis *= 0.8; }
      // 🕹 joystick souris : X = virage (roulis suit), Y = tangage
      if (Math.abs(manette.x) > 0.08) tauxVirage(Math.sign(manette.x) * Math.abs(manette.x));
      if (Math.abs(manette.y) > 0.08) {
        etat.tangage = Math.max(-1.1, Math.min(1.1, etat.tangage - manette.y * 0.95 * dt));
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
      if (B.tauxChute) etat.alt -= B.tauxChute * dt;   // planeur : chute permanente
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
      etat.distance += dSol;
      etat.g = 1 + Math.abs(etat.roulis) * 0.9 + Math.abs(etat.tangage) * 0.4;

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(etat.lon, etat.lat, etat.alt),
        orientation: { heading: etat.cap, pitch: etat.tangage, roll: B.auSol || B.surEau ? 0 : etat.roulis },
      });

      // HUD (10 Hz)
      tick += 1;
      if (tick % 2 === 0) {
        const kmh = Math.round(v * 3.6);
        wVit.innerHTML = `<div class="gros">${kmh}</div>km/h · ${Math.round(kmh / 1.852)} kt<br>gaz ${Math.round((etat.vitesse / 320) * 100)}%${boost > 1 ? ' <b>BOOST</b>' : ''}`;
        wAlt.innerHTML = `<div class="gros">${Math.round(etat.alt - sol)}</div>m sol (AGL)<br>${Math.round(etat.alt)} m mer · vario ${etat.vario >= 0 ? '+' : ''}${etat.vario.toFixed(1)} m/s`;
        wPos.innerHTML = `LAT <b>${etat.lat.toFixed(5)}</b><br>LON <b>${etat.lon.toFixed(5)}</b><br>SOL ${Math.round(sol)} m`;
        const capDeg = Math.round(((deg(etat.cap) % 360) + 360) % 360);
        wAng.innerHTML = `CAP <b class="gros" style="font-size:16px">${String(capDeg).padStart(3, '0')}°</b><br>tangage ${Math.round(deg(etat.tangage))}° · roulis ${Math.round(deg(etat.roulis))}°`;
        const mins = Math.floor((Date.now() - etat.t0) / 60000);
        wTel.innerHTML = `G ≈ <b>${etat.g.toFixed(2)}</b> · vol ${mins} min<br>distance ${(etat.distance / 1000).toFixed(2)} km<br>conso est. ${(etat.distance / 1000 * (etat.masse / 1350) * 0.09).toFixed(1)} L`;
        const m = etat.meteo;
        wMet.innerHTML = m ? `hygrométrie <b>${m.relative_humidity_2m}%</b><br>vent ${Math.round(m.wind_speed_10m)} km/h @${Math.round(m.wind_direction_10m)}°<br>${Math.round(m.temperature_2m)}°C · ${Math.round(m.pressure_msl)} hPa` : 'mesure…';
        wMas.innerHTML = `masse <b>${etat.masse} kg</b><br>charge utile ${Math.max(0, 1900 - etat.masse)} kg<br>inertie ${(etat.masse / 1350).toFixed(2)}×`;
        // 🎛 cockpit : horizon artificiel, bandes, gaz, télémétrie
        cockpit?.maj({
          vitesse: v, alt: etat.alt, sol, cap: etat.cap, tangage: etat.tangage,
          roulis: etat.roulis, vario: etat.vario, g: etat.g, distance: etat.distance,
          masse: etat.masse, duree: Date.now() - etat.t0,
          gaz: (etat.vitesse - etat.bornes.vMin) / Math.max(1, etat.bornes.vMax - etat.bornes.vMin),
          engin: `${etat.engin?.ic || '✈'} ${etat.engin?.nom || ''}`,
          bloque: etat.bloque,
          decroche: !etat.bornes.peutStationner && etat.vitesse < etat.bornes.vMin * 0.95,
          plafond: Boolean(etat.bornes.plafond) && etat.alt >= etat.bornes.plafond - 2,
        });
      }
    }, 50);

    function atterrir() {
      if (!vol) return;
      cockpit?.desactiver();
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
    }
    barre.querySelector('button').addEventListener('click', atterrir);
    vol = { atterrir };
  }

  el.querySelector('.hud')?.addEventListener('click', () => cockpit?.basculerHud());
  el.querySelector('.decoller').addEventListener('click', decoller);
  return { element: el };
}
