/**
 * WATCHTOWER — MINICARTE (bas gauche).
 *
 * Deuxième Cesium Viewer léger (fonds Esri street, pas de relief, rendu
 * à la demande) qui SUIVT la caméra principale (mode 🔒). Le glisser à la
 * main coupe le suivi (bouton 🔒 pour resynchroniser).
 *
 * Anti-collision (demande utilisateur) :
 *  — se cache automatiquement quand un panneau du dock côté GAUCHE s'ouvre ;
 *  — repliable en puce 🗺 (bouton ▣) ; déplaçable par sa barre de titre ;
 *  — z-index sous le dock pour ne jamais piéger les boutons.
 */

import * as Cesium from 'cesium';
import { rendreDeplacable } from './draggable.js';

const CSS = `
#wt-minimap {
  position: fixed; left: 12px; bottom: 88px; z-index: 948;
  width: 218px; font-family: var(--font-mono, monospace);
  background: rgba(6,10,16,0.92); border: 1px solid rgba(0,212,255,0.4);
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 4px 18px rgba(0,0,0,0.5);
  transition: opacity 0.3s ease;
}
#wt-minimap.wt-mm-cachée { opacity: 0; pointer-events: none; }
#wt-minimap .wt-mm-titre {
  display: flex; align-items: center; gap: 5px; cursor: move;
  padding: 4px 8px; font-size: 8px; letter-spacing: 2px; font-weight: 700;
  color: #00d4ff; background: rgba(0,212,255,0.08);
  border-bottom: 1px solid rgba(0,212,255,0.25); user-select: none;
}
#wt-minimap .wt-mm-titre button {
  cursor: pointer; background: none; border: 1px solid rgba(0,212,255,0.3);
  color: #00d4ff; border-radius: 5px; font-size: 9px; padding: 1px 5px; font-family: inherit;
}
#wt-minimap .wt-mm-titre button.actif { background: rgba(0,212,255,0.25); }
#wt-minimap .wt-mm-vid { width: 216px; height: 150px; position: relative; }
#wt-minimap .wt-mm-vid canvas { outline: none; }
#wt-minimap .wt-mm-note { padding: 3px 8px; font-size: 7.5px; letter-spacing: 0.5px; color: rgba(232,234,237,0.5); }
#wt-minimap-puce {
  position: fixed; left: 12px; bottom: 88px; z-index: 948;
  cursor: pointer; width: 40px; height: 40px; border-radius: 10px;
  background: rgba(6,10,16,0.92); border: 1px solid rgba(0,212,255,0.4);
  color: #00d4ff; font-size: 17px; display: none; align-items: center; justify-content: center;
}
`;

export function initMinimap(viewer) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const puce = document.createElement('button');
  puce.id = 'wt-minimap-puce';
  puce.type = 'button';
  puce.textContent = '🗺';
  puce.title = 'Afficher la minicarte';
  document.body.appendChild(puce);

  const div = document.createElement('div');
  div.id = 'wt-minimap';
  div.innerHTML = `
    <div class="wt-mm-titre"><span>🗺 MINICARTE</span>
      <span style="margin-left:auto;display:flex;gap:4px">
        <button type="button" data-a="suivre" class="actif" title="Suivre la vue principale">🔒</button>
        <button type="button" data-a="puce" title="Replier en puce">▣</button>
        <button type="button" data-a="fermer" title="Fermer (revenir via la puce 🗺)"></button>
      </span>
    </div>
    <div class="wt-mm-vid"></div>
    <div class="wt-mm-note">🔒 = suit la vue principale · glisser = naviguer librement ici</div>`;
  document.body.appendChild(div);
  rendreDeplacable(div, div.querySelector('.wt-mm-titre'));

  let mini = null;
  let suivre = true;
  let suivantEvent = null;

  function demarrer() {
    if (mini) return;
    const vid = div.querySelector('.wt-mm-vid');
    try {
      const credits = document.createElement('div');
      credits.style.cssText = 'position:absolute;bottom:0;right:0;font-size:6px;opacity:0.6';
      vid.appendChild(credits);
      mini = new Cesium.Viewer(vid, {
        baseLayerPicker: false, geocoder: false, homeButton: false,
        sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
        timeline: false, animation: false, infoBox: false, selectionIndicator: false,
        creditContainer: credits,
        baseLayer: new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
          credit: 'Mini: Esri',
        })),
      });
      mini.targetFrameRate = 30;
      mini.scene.globe.enableLighting = false;
      mini.scene.globe.showGroundAtmosphere = false;
      mini.scene.skyAtmosphere.show = false;
      mini.scene.globe.enableTerrainReflections = false;
      mini.scene.maximumScreenSpaceError = 32; // rendu grossier → rapide
      mini.scene.requestRenderMode = true;
      mini.scene.screenSpaceCameraController.enableInputs = false;
      // cadrage initial = vue principale
      const c = viewer.camera.positionCartographic;
      mini.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(c.longitude, c.latitude, Math.max(c.height, 80000) * 1.6),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
      });
      suivantEvent = viewer.camera.changedEvent.addEventListener(() => {
        if (!suivre || !mini) return;
        const cam = viewer.camera;
        mini.camera.setView({
          destination: cam.position.clone(),
          orientation: { heading: cam.heading, pitch: cam.pitch, roll: cam.roll },
        });
        mini.scene.requestRender();
      });
      // navigation manuelle sur la mini → coupe le suivi
      const canvas = mini.scene.canvas;
      const couper = () => {
        if (!suivre) return;
        suivre = false;
        div.querySelector('[data-a="suivre"]').classList.remove('actif');
        mini.scene.screenSpaceCameraController.enableInputs = true;
      };
      canvas.addEventListener('pointerdown', couper);
      mini.scene.preRender.addEventListener(() => { if (suivre) mini.scene.screenSpaceCameraController.enableInputs = false; });
    } catch (e) {
      console.error('[minimap]', e);
      div.querySelector('.wt-mm-vid').textContent = '⚠ minicarte indisponible';
    }
  }

  // démarrage différé (après le premier rendu principal) → garde le boot rapide
  window.setTimeout(demarrer, 2500);

  div.querySelector('[data-a="suivre"]').addEventListener('click', () => {
    suivre = !suivre;
    div.querySelector('[data-a="suivre"]').classList.toggle('actif', suivre);
    if (mini) mini.scene.screenSpaceCameraController.enableInputs = !suivre;
  });
  div.querySelector('[data-a="puce"]').addEventListener('click', () => {
    div.style.display = 'none';
    puce.style.display = 'flex';
  });
  div.querySelector('[data-a="fermer"]').addEventListener('click', () => {
    div.style.display = 'none';
    puce.style.display = 'flex';
  });
  puce.addEventListener('click', () => {
    div.style.display = '';
    puce.style.display = 'none';
    demarrer();
  });

  // anti-collision : cache la mini quand un panneau dock GAUCHE est visible
  const syncCache = () => {
    const gaucheVisible = [...document.querySelectorAll('.wt-dock-panel.gauche')]
      .some((w) => !w.classList.contains('wt-dock-cache') && w.offsetParent !== null);
    const ficheVisible = !!document.querySelector('#wt-fiche');
    const intelVisible = !!document.querySelector('#wt-intel')
      && !document.querySelector('#wt-intel').classList.contains('wt-dock-cache');
    const cache = gaucheVisible
      || (intelVisible && !!document.querySelector('#wti-gauche') && !document.querySelector('#wti-gauche').style.display)
      || (ficheVisible && div.getBoundingClientRect().top < window.innerHeight * 0.55);
    div.classList.toggle('wt-mm-cachée', cache);
  };
  window.setInterval(syncCache, 1200);
  syncCache();
}
