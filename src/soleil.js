/**
 * ☀ SOLEIL — position, ombres portées, phases du jour (façon SunCalc).
 *
 * Répond à la demande : les fonctions de suncalc.org — où est le soleil, quelle
 * est sa trajectoire, quand il se lève et se couche, où tombent les ombres.
 *
 * ## Ce que ça fait
 *
 *  1. **Ombres réelles** : Cesium éclaire la scène avec le soleil à la date
 *     choisie ; les bâtiments 3D projettent leur ombre.
 *  2. **Curseur d'heure** : on déplace l'heure, la lumière suit en direct.
 *  3. **Trajectoire** : l'arc du soleil dans le ciel, du lever au coucher.
 *  4. **Tableau des phases** : aube, lever, heure dorée, coucher, crépuscules.
 *  5. **Longueur d'ombre** : combien de fois la hauteur d'un bâtiment.
 *
 * ## Sans réseau
 *
 * Tout le calcul est **local** (`data/soleil/calculSolaire.js`) : aucune API,
 * aucune clé. Ça marche hors ligne, ce qui est la consigne générale du projet.
 *
 * @module soleil
 */

import * as Cesium from 'cesium';
import {
  positionSoleil, heuresSolaires, illuminationLune, positionLune,
  cardinal, longueurOmbre, qualiteLumiere,
} from './data/soleil/calculSolaire.js';

const STYLE_ID = 'wt-soleil-css';

const CSS = `
#wt-soleil { display: flex; flex-direction: column; gap: 9px; padding: 11px 12px;
  font-family: var(--font-mono, monospace); color: #e8eaed; min-width: 292px; }
#wt-soleil .s-ligne { display: flex; align-items: center; gap: 8px; }
#wt-soleil .s-cadran { display: flex; gap: 10px; align-items: center;
  padding: 9px 11px; border-radius: 9px; background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.10); }
#wt-soleil .s-disque { width: 46px; height: 46px; border-radius: 50%; flex: 0 0 auto;
  box-shadow: 0 0 18px currentColor; border: 1px solid rgba(255,255,255,0.3); }
#wt-soleil .s-etat { font-size: 12.5px; font-weight: 700; letter-spacing: .02em; }
#wt-soleil .s-detail { font-size: 11px; color: rgba(232,234,237,0.72); line-height: 1.5; }
#wt-soleil input[type=range] { width: 100%; accent-color: #f0a848; }
#wt-soleil .s-heure { font-size: 19px; font-weight: 700; color: #f0a848;
  font-variant-numeric: tabular-nums; }
#wt-soleil .s-phases { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px;
  font-size: 11.5px; max-height: 190px; overflow-y: auto; }
#wt-soleil .s-phases .n { color: rgba(232,234,237,0.76); }
#wt-soleil .s-phases .v { font-variant-numeric: tabular-nums; color: #d8f2ff; text-align: right; }
#wt-soleil .s-phases .abs { color: rgba(232,234,237,0.38); font-style: italic; }
#wt-soleil button { cursor: pointer; padding: 7px 10px; border-radius: 7px;
  font-family: inherit; font-size: 11.5px; font-weight: 700; color: #d8f2ff;
  background: rgba(0,212,255,0.10); border: 1px solid rgba(0,212,255,0.38); flex: 1 1 auto;
  min-height: 32px; }
#wt-soleil button:hover { background: rgba(0,212,255,0.24); }
#wt-soleil button.on { background: rgba(240,168,72,0.22); border-color: rgba(240,168,72,0.65); color: #ffd79a; }
#wt-soleil .s-note { font-size: 10.5px; color: rgba(232,234,237,0.5); line-height: 1.45; }
`;

/** Libellés lisibles des phases, dans l'ordre chronologique du jour. */
export const ORDRE_PHASES = Object.freeze([
  ['aubeAstro', 'Aube astronomique'],
  ['aubeNautique', 'Aube nautique'],
  ['aubeCivile', 'Aube civile'],
  ['lever', '🌅 Lever du soleil'],
  ['finLever', 'Fin du lever'],
  ['finHeureDoree', 'Fin de l’heure dorée'],
  ['midiSolaire', '☀ Midi solaire'],
  ['heureDoree', '🌇 Heure dorée'],
  ['debutCoucher', 'Début du coucher'],
  ['coucher', '🌆 Coucher du soleil'],
  ['crepusculeCivil', 'Crépuscule civil'],
  ['crepusculeNautique', 'Crépuscule nautique'],
  ['crepusculeAstro', 'Crépuscule astronomique'],
]);

/** Formate une heure locale courte, ou un tiret si la phase n'existe pas. */
export function formaterHeure(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Construit le texte d'une ombre portée.
 * @param {number} hauteurSoleil - degrés
 * @returns {string}
 */
export function texteOmbre(hauteurSoleil) {
  const r = longueurOmbre(hauteurSoleil);
  if (r === null) return 'Pas d’ombre — le soleil est sous l’horizon.';
  if (r > 20) return 'Ombre très longue (soleil rasant), plus de 20× la hauteur.';
  return `Ombre ≈ ${r.toFixed(1)} × la hauteur (un mur de 10 m → ${(r * 10).toFixed(0)} m).`;
}

/**
 * Installe le module solaire.
 *
 * @param {object} viewer - viewer Cesium
 * @param {{document?:Document, surMessage?:function, position?:function}} [options]
 *   `position()` doit renvoyer `{lat, lon}` du lieu observé (centre de la vue).
 * @returns {{element:HTMLElement, majPour:function, ombres:function,
 *   maintenant:function, quitter:function, etat:function}}
 */
export function initSoleil(viewer, options = {}) {
  const doc = options.document || globalThis.document;
  const surMessage = options.surMessage;

  if (doc && !doc.getElementById(STYLE_ID)) {
    const st = doc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    doc.head?.appendChild(st);
  }

  const el = doc.createElement('div');
  el.id = 'wt-soleil';
  el.innerHTML = `
    <div class="s-cadran">
      <div class="s-disque" style="background:#f0a848;color:#f0a848"></div>
      <div>
        <div class="s-etat">—</div>
        <div class="s-detail"></div>
      </div>
    </div>
    <div class="s-ligne"><span class="s-heure">--:--</span>
      <span class="s-detail s-jour" style="margin-left:auto"></span></div>
    <input type="range" min="0" max="1439" step="1" aria-label="Heure de la journée" />
    <div class="s-ligne">
      <button data-s="maintenant">⏱ Maintenant</button>
      <button data-s="ombres">🌑 Ombres</button>
      <button data-s="trajet">🧭 Trajectoire</button>
    </div>
    <div class="s-phases"></div>
    <div class="s-note">Calcul local (algorithme SunCalc / Meeus), sans réseau.
      Heures affichées dans le fuseau de ton appareil.</div>`;

  const disque = el.querySelector('.s-disque');
  const etat = el.querySelector('.s-etat');
  const detail = el.querySelector('.s-detail');
  const curseur = el.querySelector('input[type=range]');
  const affHeure = el.querySelector('.s-heure');
  const affJour = el.querySelector('.s-jour');
  const grille = el.querySelector('.s-phases');
  const btnOmbres = el.querySelector('[data-s="ombres"]');
  const btnTrajet = el.querySelector('[data-s="trajet"]');

  let lieu = { lat: 43.45, lon: 3.70 }; // repli : étang de Thau
  let instant = new Date();
  let ombresActives = false;
  let trajetActif = false;
  let source = null;

  /** Lit le centre de la vue, sinon garde le dernier lieu connu. */
  const lireLieu = () => {
    try {
      const p = options.position?.();
      if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) {
        lieu = { lat: p.lat, lon: p.lon };
        return;
      }
      const c = viewer?.camera?.positionCartographic;
      if (c) {
        lieu = {
          lat: Cesium.Math.toDegrees(c.latitude),
          lon: Cesium.Math.toDegrees(c.longitude),
        };
      }
    } catch { /* vue indisponible : on garde le lieu precedent */ }
  };

  /** Applique l'instant courant à l'horloge Cesium (donc à la lumière). */
  const appliquerAuViewer = () => {
    if (!viewer?.clock) return;
    try {
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(instant);
      viewer.scene.requestRender?.();
    } catch { /* horloge indisponible */ }
  };

  /** Dessine l'arc de la course du soleil sur la journée. */
  const dessinerTrajet = () => {
    if (!viewer?.entities) return;
    effacerTrajet();
    source = new Cesium.CustomDataSource('wt-soleil-trajet');
    viewer.dataSources?.add(source);
    const base = new Date(instant);
    const points = [];
    for (let min = 0; min <= 1440; min += 10) {
      const t = new Date(base);
      t.setHours(0, min, 0, 0);
      const p = positionSoleil(t, lieu.lat, lieu.lon);
      if (!p || p.hauteur < 0) continue; // sous l'horizon : rien à montrer
      // projection de la direction du soleil sur une coupole de 6 km
      const r = 6000;
      const az = Cesium.Math.toRadians(p.azimut);
      const hh = Cesium.Math.toRadians(p.hauteur);
      const dz = Math.sin(hh) * r;
      const dh = Math.cos(hh) * r;
      const dlat = (dh * Math.cos(az)) / 111320;
      const dlon = (dh * Math.sin(az)) / (111320 * Math.cos(lieu.lat * Math.PI / 180));
      points.push(Cesium.Cartesian3.fromDegrees(lieu.lon + dlon, lieu.lat + dlat, dz));
    }
    if (points.length < 2) {
      surMessage?.('☀ Le soleil ne se lève pas ici à cette date.');
      return;
    }
    source.entities.add({
      polyline: {
        positions: points,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: Cesium.Color.fromCssColorString('#f0a848'),
          glowPower: 0.28,
        }),
      },
    });
    viewer.scene.requestRender?.();
  };

  const effacerTrajet = () => {
    if (source) {
      try { viewer.dataSources?.remove(source, true); } catch { /* déjà retirée */ }
      source = null;
    }
  };

  /** Recalcule et réaffiche tout. */
  const rendre = () => {
    lireLieu();
    const p = positionSoleil(instant, lieu.lat, lieu.lon);
    const t = heuresSolaires(instant, lieu.lat, lieu.lon);
    const lune = illuminationLune(instant);
    const pl = positionLune(instant, lieu.lat, lieu.lon);

    if (p) {
      const q = qualiteLumiere(p.hauteur);
      disque.style.background = q.couleur;
      disque.style.color = q.couleur;
      etat.textContent = q.nom;
      detail.innerHTML = `Hauteur <b>${p.hauteur.toFixed(1)}°</b> · `
        + `Azimut <b>${p.azimut.toFixed(0)}° ${cardinal(p.azimut)}</b><br>`
        + `${texteOmbre(p.hauteur)}<br>`
        + (lune && pl
          ? `🌙 ${lune.nom} — ${(lune.fraction * 100).toFixed(0)} % éclairée, `
            + `hauteur ${pl.hauteur.toFixed(0)}°`
          : '');
    }

    affHeure.textContent = instant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    affJour.textContent = `${instant.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`
      + ` · ${lieu.lat.toFixed(3)}, ${lieu.lon.toFixed(3)}`;
    curseur.value = String(instant.getHours() * 60 + instant.getMinutes());

    if (t) {
      grille.innerHTML = ORDRE_PHASES.map(([cle, nom]) => {
        const h = formaterHeure(t[cle]);
        return `<div class="n">${nom}</div>`
          + `<div class="v${h ? '' : ' abs'}">${h || '—'}</div>`;
      }).join('');
    }
  };

  // ── interactions ────────────────────────────────────────────────────────
  curseur.addEventListener('input', () => {
    const min = Number(curseur.value) || 0;
    const d = new Date(instant);
    d.setHours(Math.floor(min / 60), min % 60, 0, 0);
    instant = d;
    appliquerAuViewer();
    rendre();
    if (trajetActif) dessinerTrajet();
  });

  el.querySelector('[data-s="maintenant"]').addEventListener('click', () => {
    instant = new Date();
    appliquerAuViewer();
    rendre();
    surMessage?.('⏱ Heure réelle rétablie.');
  });

  /**
   * Active ou coupe les ombres portées.
   * @param {boolean} [on] - état voulu ; bascule si omis.
   * @returns {boolean} état appliqué
   */
  const ombres = (on) => {
    ombresActives = typeof on === 'boolean' ? on : !ombresActives;
    try {
      if (viewer?.shadows !== undefined) viewer.shadows = ombresActives;
      if (viewer?.scene) {
        viewer.scene.globe.enableLighting = ombresActives;
        viewer.scene.globe.shadows = ombresActives
          ? Cesium.ShadowMode.RECEIVE_ONLY
          : Cesium.ShadowMode.DISABLED;
        viewer.scene.requestRender?.();
      }
    } catch (e) {
      console.warn('[watchtower] ombres indisponibles :', e);
      surMessage?.('Les ombres ne sont pas disponibles sur cette machine.');
    }
    btnOmbres.classList.toggle('on', ombresActives);
    if (ombresActives) appliquerAuViewer();
    return ombresActives;
  };
  btnOmbres.addEventListener('click', () => ombres());

  btnTrajet.addEventListener('click', () => {
    trajetActif = !trajetActif;
    btnTrajet.classList.toggle('on', trajetActif);
    if (trajetActif) dessinerTrajet();
    else effacerTrajet();
  });

  rendre();

  return {
    element: el,
    /** Recalcule pour un lieu donné (ou le centre de la vue si omis). */
    majPour(lat, lon) {
      if (Number.isFinite(lat) && Number.isFinite(lon)) lieu = { lat, lon };
      rendre();
      if (trajetActif) dessinerTrajet();
    },
    ombres,
    maintenant: () => { instant = new Date(); appliquerAuViewer(); rendre(); },
    etat: () => ({
      lieu: { ...lieu },
      instant: new Date(instant),
      ombres: ombresActives,
      trajet: trajetActif,
    }),
    quitter() {
      effacerTrajet();
      if (ombresActives) ombres(false);
    },
  };
}
