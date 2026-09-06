/**
 * WATCHTOWER — ÉPINGLES (PINS) POSÉES À LA MAIN.
 *
 * Un bouton 📌 toujours visible (bas gauche) ouvre le panneau : on arme le
 * placement, on clique sur la carte, l'épingle apparaît — grosse, colourée,
 * numérotée, avec son nom — et reste là. Elle est mémorisée (localStorage),
 * cliquable (ouvre la fiche lieu du point) et supprimable.
 *
 * Deux bugs corrigés au passage :
 *  — l'icône était posée en `point` Cesium (un disque plat, invisible dès
 *    qu'un relief ou un bâtiment passait devant, et non cliquable de loin) :
 *    on dessine maintenant une vraie épingle en sprite (contour noir épais,
 *    ombre portée) ;
 *  — le repère « MA MAISON » ne répondait pas au clic : le gestionnaire
 *    comparait l'entité Cesium (`picked.id`) à une chaîne (`'wt-maison'`),
 *    ce qui n'est jamais vrai. On passe par `resolvePickId()` (voir
 *    `ficheLieu.js`) qui sait lire l'un comme l'autre.
 */

import * as Cesium from 'cesium';
import { spriteEpingle } from './marqueurs.js';
import { rendreDeplacable } from './draggable.js';

const CLE = 'watchtower.pins.v1';

const CSS = `
#wt-pin-btn {
  position: fixed; left: 12px; bottom: 14px; z-index: 962; width: 46px; height: 46px;
  cursor: pointer; border-radius: 12px; font-size: 19px; line-height: 1;
  background: rgba(8,12,18,0.94); border: 1px solid rgba(0,212,255,0.55); color: #00d4ff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
}
#wt-pin-btn:hover { background: rgba(0,212,255,0.16); }
#wt-pin-btn.armé { background: rgba(0,212,255,0.26); border-color: #00d4ff; }
#wt-pin-btn .n {
  position: absolute; top: -6px; right: -6px; min-width: 17px; height: 17px; padding: 0 3px;
  border-radius: 9px; background: #00d4ff; color: #04121a; font-size: 9px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; font-family: var(--font-mono, monospace);
}
#wt-pins {
  position: fixed; left: 12px; bottom: 68px; z-index: 963; width: 232px; display: none;
  font-family: var(--font-mono, monospace); color: #e8eaed; font-size: 10px;
  background: rgba(8,12,18,0.95); border: 1px solid rgba(0,212,255,0.45); border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0,0,0,0.55); overflow: hidden;
}
#wt-pins .t { display: flex; align-items: center; gap: 6px; padding: 7px 10px; cursor: move;
  font-size: 8.5px; letter-spacing: 2px; font-weight: 700; color: #00d4ff; background: rgba(0,212,255,0.08); }
#wt-pins .t button { margin-left: auto; cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.6); font-size: 12px; }
#wt-pins .c { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; max-height: 40vh; overflow-y: auto; }
#wt-pins .b { cursor: pointer; padding: 8px; font-family: inherit; font-size: 9px; font-weight: 700;
  letter-spacing: 1px; border-radius: 8px; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.5); color: #00d4ff; }
#wt-pins .b.rouge { border-color: rgba(240,90,90,0.5); color: #f08a8a; background: rgba(240,90,90,0.07); }
#wt-pins .b.armé { background: rgba(0,212,255,0.28); }
#wt-pins .pin { display: flex; align-items: center; gap: 7px; padding: 5px 7px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
#wt-pins .pin .nom { flex: 1; cursor: pointer; text-align: left; background: none; border: none;
  color: inherit; font-family: inherit; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#wt-pins .pin .mini { cursor: pointer; background: none; border: none; color: rgba(232,234,237,0.55); font-size: 11px; padding: 0 2px; }
#wt-pins .pin .mini:hover { color: #00d4ff; }
#wt-pins .vide { color: rgba(232,234,237,0.45); line-height: 1.6; }
#wt-pins .n { padding: 0 10px 9px; color: rgba(232,234,237,0.4); font-size: 8px; line-height: 1.6; }
`;

function lire() {
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE) || '[]');
    return Array.isArray(brut) ? brut.filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon)) : [];
  } catch { return []; }
}

function ecrire(pins) {
  try { window.localStorage.setItem(CLE, JSON.stringify(pins.slice(-200))); } catch { /* plein */ }
}

/**
 * @param {object} viewer Viewer Cesium.
 * @param {{fiche?:Function, surMessage?:Function}} [options]
 */
export function initPins(viewer, options = {}) {
  const { fiche = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-pins');
  viewer.dataSources.add(ds);

  let pins = lire();
  let compteur = pins.reduce((m, p) => Math.max(m, Number(p.numero) || 0), 0);

  // ——— interface ———
  const btn = document.createElement('button');
  btn.id = 'wt-pin-btn';
  btn.type = 'button';
  btn.title = 'Mes épingles — poser un repère sur la carte';
  btn.innerHTML = '📌<span class="n">0</span>';
  document.body.appendChild(btn);

  const panneau = document.createElement('div');
  panneau.id = 'wt-pins';
  panneau.innerHTML = `
    <div class="t"><span>📌 MES ÉPINGLES</span><button type="button" class="fermer">✕</button></div>
    <div class="c">
      <button class="b poser" type="button">📍 POSER UNE ÉPINGLE</button>
      <div class="liste"></div>
      <button class="b rouge vider" type="button">🗑 TOUT EFFACER</button>
    </div>
    <div class="n">Clic sur l'épingle = fiche du lieu · les épingles sont mémorisées sur cet appareil.</div>`;
  document.body.appendChild(panneau);
  rendreDeplacable(panneau, panneau.querySelector('.t'));

  const badge = btn.querySelector('.n');
  const listeEl = panneau.querySelector('.liste');

  function rendre() {
    badge.textContent = String(pins.length);
    listeEl.innerHTML = pins.length ? '' : '<div class="vide">Aucune épingle. « POSER UNE ÉPINGLE » puis clic sur la carte.</div>';
    [...pins].reverse().forEach((p) => {
      const l = document.createElement('div');
      l.className = 'pin';
      l.innerHTML = `<span>📌</span><button class="nom" type="button">${p.nom || 'Épingle'}</button>
        <button class="mini" data-a="vol" title="Y voler">✈</button>
        <button class="mini" data-a="sup" title="Supprimer">🗑</button>`;
      l.querySelector('.nom').addEventListener('click', () => {
        voler(p);
        fiche?.(p.lon, p.lat, p.nom);
      });
      l.querySelector('[data-a="vol"]').addEventListener('click', () => voler(p));
      l.querySelector('[data-a="sup"]').addEventListener('click', () => supprimer(p.id));
      listeEl.appendChild(l);
    });
  }

  function voler(p) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 900),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 },
      duration: 1.8,
    });
  }

  // ——— rendu 3D ———
  function dessiner() {
    ds.entities.removeAll();
    pins.forEach((p, i) => {
      const numero = p.numero || (i + 1);
      const image = spriteEpingle({ couleur: p.couleur || '#00d4ff', texte: String(numero), taille: 128 });
      if (!image) return;
      ds.entities.add({
        id: `wt-pin-${p.id}`,
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
        properties: { wtPin: p.id, wtLon: p.lon, wtLat: p.lat, wtNom: p.nom },
        billboard: {
          image,
          width: 40,
          height: 40,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(300, 1.15, 20000, 0.5),
        },
        label: {
          text: `📌 ${p.nom || 'Épingle'}`,
          font: '11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0a0a0f').withAlpha(0.8),
          pixelOffset: new Cesium.Cartesian2(0, -44),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(400, 1, 12000, 0),
        },
      });
    });
    viewer.scene.requestRender?.();
  }

  // ——— actions ———
  function poser(lon, lat, nom) {
    compteur += 1;
    const pin = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      lon, lat,
      numero: compteur,
      nom: nom || `Épingle ${compteur}`,
      couleur: '#00d4ff',
      t: Date.now(),
    };
    pins.push(pin);
    ecrire(pins);
    dessiner();
    rendre();
    surMessage?.(`📌 Épingle « ${pin.nom} » posée.`);
    return pin;
  }

  function supprimer(id) {
    pins = pins.filter((p) => p.id !== id);
    ecrire(pins);
    dessiner();
    rendre();
  }

  function armer(etat) {
    window.__wtPinArme = Boolean(etat);
    btn.classList.toggle('armé', Boolean(etat));
    const b = panneau.querySelector('.poser');
    b.classList.toggle('armé', Boolean(etat));
    b.textContent = etat ? '🎯 CLIQUE SUR LA CARTE…' : '📍 POSER UNE ÉPINGLE';
    viewer.scene.canvas.style.cursor = etat ? 'crosshair' : '';
    if (etat) surMessage?.('📍 Clique sur la carte pour poser l’épingle (ÉCHAP pour annuler).');
  }

  btn.addEventListener('click', () => {
    const ouvert = panneau.style.display !== 'none';
    panneau.style.display = ouvert ? 'none' : '';
    if (!ouvert) rendre();
  });
  panneau.querySelector('.fermer').addEventListener('click', () => { panneau.style.display = 'none'; });
  panneau.querySelector('.poser').addEventListener('click', () => armer(!window.__wtPinArme));
  panneau.querySelector('.vider').addEventListener('click', () => {
    pins = [];
    compteur = 0;
    ecrire(pins);
    dessiner();
    rendre();
  });

  // ——— clic carte ———
  // Un SEUL gestionnaire LEFT_CLICK : Cesium n'en garde qu'un par type
  // d'évènement, deux `setInputAction` s'écraseraient l'un l'autre.
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((clic) => {
    // 1 · mode « poser » en cours → on pose l'épingle au point cliqué
    if (window.__wtPinArme) {
      let cart = null;
      try {
        if (viewer.scene.pickPositionSupported) cart = viewer.scene.pickPosition(clic.position);
      } catch { /* repli */ }
      if (!cart) cart = viewer.camera.pickEllipsoid(clic.position, viewer.scene.globe.ellipsoid);
      if (!cart) return;
      const c = Cesium.Cartographic.fromCartesian(cart);
      poser(Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude));
      armer(false);
      return;
    }
    if (window.__wtDessin) return;
    // 2 · sinon, clic sur une épingle existante → fiche du lieu
    let picked = null;
    try { picked = viewer.scene.pick(clic.position); } catch { return; }
    const props = picked?.id?.properties;
    const idPin = props?.wtPin?.getValue?.();
    if (!idPin) return;
    const pin = pins.find((p) => p.id === idPin);
    if (pin) fiche?.(pin.lon, pin.lat, pin.nom);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.__wtPinArme) armer(false);
  });

  rendre();
  dessiner();

  return {
    poser,
    supprimer,
    armer,
    liste: () => pins.slice(),
    effacer: () => { pins = []; compteur = 0; ecrire(pins); dessiner(); rendre(); },
    ouvrir: () => { panneau.style.display = ''; rendre(); },
  };
}
