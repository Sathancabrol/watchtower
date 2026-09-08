/**
 * Bascule 2D ↔ 3D — montage dans l'interface (chantier A2).
 *
 * Le cœur des conversions vit dans `src/data/carte2d/` (modules purs, testés
 * hors navigateur). Ce fichier-ci ne fait que le brancher au DOM et aux deux
 * moteurs.
 *
 * ## Principes tenus
 *
 * 1. **Un seul moteur actif.** En 2D, la boucle de rendu Cesium est arrêtée et
 *    son canevas masqué : c'est ce qui libère réellement le GPU. Les faire
 *    cohabiter reviendrait à doubler la charge — l'inverse du but.
 * 2. **Chargement à la demande.** MapLibre (~800 Ko) n'est téléchargé qu'au
 *    premier passage en 2D. Un utilisateur qui reste en 3D ne le paie jamais.
 * 3. **Rien n'est perdu.** Cesium n'est jamais détruit, seulement suspendu ;
 *    revenir en 3D restaure la vue exacte, sans rechargement.
 *
 * @module carte2dControleur
 */

import { etatNeutre, versMapLibre, depuisMapLibre, conseillerBascule2D } from './data/carte2d/etatCamera.js';
import { styleMapLibre, listerFonds } from './data/carte2d/styleIgn.js';

const STYLE_ID = 'wt-carte2d-style';

/** Feuille de style du conteneur et du bouton, alignée sur le HUD existant. */
const CSS = `
#wt-carte2d {
  position: absolute; inset: 0; z-index: 2; display: none;
}
#wt-carte2d.actif { display: block; }
#wt-carte2d canvas { outline: none; }
#wt-bascule2d {
  position: fixed; left: 12px; bottom: 56px; z-index: 949;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 6px;
  background: rgba(4, 12, 20, 0.82); color: #7fe7ff;
  border: 1px solid rgba(0, 212, 255, 0.35);
  font: 600 11px/1 system-ui, sans-serif; letter-spacing: 0.06em;
  cursor: pointer; text-transform: uppercase;
}
#wt-bascule2d:hover { background: rgba(0, 212, 255, 0.16); }
#wt-bascule2d .wt-b2d-etat { color: #fff; }
#wt-carte2d-fonds {
  position: absolute; left: 12px; top: 12px; z-index: 6;
  background: rgba(4, 12, 20, 0.82); color: #7fe7ff;
  border: 1px solid rgba(0, 212, 255, 0.35); border-radius: 6px;
  font: 600 11px/1 system-ui, sans-serif; padding: 6px 8px;
}
`;

/**
 * Injecte la feuille de style une seule fois.
 * @param {Document} doc - Document hôte.
 */
function injecterStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  doc.head.appendChild(el);
}

/**
 * Lit l'état de caméra courant de Cesium sous forme neutre.
 * @param {object} viewer - Viewer Cesium.
 * @returns {object} État neutre.
 */
export function lireEtatCesium(viewer) {
  const cam = viewer?.camera;
  const c = cam?.positionCartographic;
  if (!c) return etatNeutre({});
  const deg = 180 / Math.PI;
  return etatNeutre({
    lon: c.longitude * deg,
    lat: c.latitude * deg,
    hauteurM: c.height,
    capDeg: (cam.heading ?? 0) * deg,
    tangageDeg: (cam.pitch ?? 0) * deg,
  });
}

/**
 * Applique un état neutre à la caméra Cesium.
 * @param {object} viewer - Viewer Cesium.
 * @param {object} etat - État neutre.
 * @param {object} Cesium - Espace de noms Cesium.
 */
export function appliquerEtatCesium(viewer, etat, Cesium) {
  const e = etatNeutre(etat);
  const rad = Math.PI / 180;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(e.lon, e.lat, e.hauteurM),
    orientation: { heading: e.capDeg * rad, pitch: e.tangageDeg * rad, roll: 0 },
  });
}

/**
 * Installe la bascule 2D/3D.
 *
 * @param {{viewer:object, Cesium:object, conteneur?:HTMLElement, document?:Document}} options
 * @returns {{basculer:function, estEn2D:function, detruire:function}} Pilotage.
 */
export function initCarte2D({ viewer, Cesium, conteneur, document: doc = globalThis.document }) {
  if (!doc || !viewer) return { basculer() {}, estEn2D: () => false, detruire() {} };
  injecterStyle(doc);

  const hote = conteneur || doc.getElementById('cesiumContainer') || doc.body;
  const div = doc.createElement('div');
  div.id = 'wt-carte2d';
  hote.appendChild(div);

  const bouton = doc.createElement('button');
  bouton.id = 'wt-bascule2d';
  bouton.type = 'button';
  bouton.title = 'Basculer entre la vue 3D (relief) et la vue 2D (plus légère)';
  bouton.innerHTML = '🗺 Vue <span class="wt-b2d-etat">3D</span>';
  doc.body.appendChild(bouton);

  let carte = null;       // instance MapLibre, créée au premier passage en 2D
  let en2D = false;
  let fondActuel = 'ign-plan';
  let chargement = null;  // promesse d'import, pour ne pas la lancer deux fois

  const majBouton = () => {
    const etat = bouton.querySelector('.wt-b2d-etat');
    if (etat) etat.textContent = en2D ? '2D' : '3D';
  };

  /**
   * Charge MapLibre à la demande, une seule fois.
   * @returns {Promise<object>} Module MapLibre.
   */
  const chargerMapLibre = () => {
    if (!chargement) chargement = import('maplibre-gl').then((m) => m.default || m);
    return chargement;
  };

  /** Crée le sélecteur de fond, aligné sur les couches IGN de la 3D. */
  const creerSelecteurFonds = () => {
    const sel = doc.createElement('select');
    sel.id = 'wt-carte2d-fonds';
    for (const f of listerFonds()) {
      const o = doc.createElement('option');
      o.value = f.id;
      o.textContent = f.libelle;
      sel.appendChild(o);
    }
    sel.value = fondActuel;
    sel.addEventListener('change', () => {
      fondActuel = sel.value;
      if (carte) carte.setStyle(styleMapLibre(fondActuel, { cadastre: false }));
    });
    div.appendChild(sel);
    return sel;
  };

  /** Passe en 2D : arrête Cesium, montre MapLibre. */
  const passerEn2D = async () => {
    const etat = lireEtatCesium(viewer);
    const maplibregl = await chargerMapLibre();
    const vue = versMapLibre(etat, div.clientHeight || 800);

    if (!carte) {
      carte = new maplibregl.Map({
        container: div,
        style: styleMapLibre(fondActuel),
        center: vue.center, zoom: vue.zoom, bearing: vue.bearing, pitch: vue.pitch,
        attributionControl: { compact: true },
      });
      carte.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      creerSelecteurFonds();
    } else {
      carte.jumpTo(vue);
    }

    div.classList.add('actif');
    // Couper réellement la boucle Cesium : c'est ici que le GPU est libéré.
    // On ne touche PAS à la visibilité du canevas Cesium : le conteneur 2D est
    // opaque et le recouvre déjà. Masquer le canevas provoquait, au retour en
    // 3D, une scène figée sur la dernière image (le contexte WebGL ne se
    // réveille pas toujours d'un canevas passé en visibility:hidden).
    viewer.useDefaultRenderLoop = false;
    en2D = true;
    majBouton();
    // MapLibre a pu être créé sur un conteneur masqué : forcer la remesure.
    carte.resize();
  };

  /** Repasse en 3D : rend l'état à Cesium, relance la boucle. */
  const passerEn3D = () => {
    if (carte) {
      const etat = depuisMapLibre({
        center: carte.getCenter(), zoom: carte.getZoom(),
        bearing: carte.getBearing(), pitch: carte.getPitch(),
      }, div.clientHeight || 800);
      appliquerEtatCesium(viewer, etat, Cesium);
    }
    div.classList.remove('actif');
    // Réveil complet : la boucle repart, puis on force une image. Le resize est
    // nécessaire car le canevas a pu être redimensionné pendant la 2D.
    if (viewer.canvas) viewer.canvas.style.visibility = '';
    viewer.useDefaultRenderLoop = true;
    try { viewer.resize?.(); } catch { /* viewer minimal (tests) */ }
    if (viewer.scene?.requestRender) viewer.scene.requestRender();
    en2D = false;
    majBouton();
  };

  /**
   * Bascule d'un moteur à l'autre.
   * @param {boolean} [vers2D] - Cible explicite ; sinon on inverse.
   * @returns {Promise<void>} Résolue une fois la bascule faite.
   */
  const basculer = async (vers2D) => {
    const cible = typeof vers2D === 'boolean' ? vers2D : !en2D;
    if (cible === en2D) return;
    if (cible) await passerEn2D();
    else passerEn3D();
  };

  bouton.addEventListener('click', () => { void basculer(); });
  majBouton();

  return {
    basculer,
    estEn2D: () => en2D,
    /**
     * Conseil de bascule fondé sur l'état courant et les performances.
     * @param {{fpsMoyen?:number}} [perf] - Mesures.
     * @returns {{basculer:boolean, raison:string}} Décision motivée.
     */
    conseiller: (perf) => conseillerBascule2D(lireEtatCesium(viewer), perf),
    detruire() {
      try { carte?.remove(); } catch { /* MapLibre déjà démonté */ }
      carte = null;
      div.remove();
      bouton.remove();
    },
  };
}
