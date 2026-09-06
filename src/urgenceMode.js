/**
 * WATCHTOWER — PILOTE DU MODE URGENCE (orchestration).
 *
 * Les données et les maths sont dans `urgence.js` (testables, pures) ;
 * la mascotte est dans `mascotte.js`. Ici : on assemble.
 *
 * `/urgence` :
 *   1. **gèle l'écran** — horloge Cesium à l'arrêt, animations CSS en pause,
 *      mini-carte et fils d'info suspendus : plus rien ne bouge ni ne clignote
 *      autour de la personne ;
 *   2. **la mascotte** apparaît au centre, regarde l'utilisateur, cligne, se
 *      tourne vers la vue de la carte (« je vais voir »), revient, puis se
 *      perche dans l'angle opposé à la souris (répulsion) ;
 *   3. **le chat s'ouvre en grand au centre** ;
 *   4. **on prend l'utilisateur par la main** : procédure officielle, secours
 *      les plus proches (OSM/Overpass), itinéraire le plus rapide (OSRM) et
 *      guidage pas à pas qui déplace la vue — mode tuto personnalisé.
 */

import * as Cesium from 'cesium';
import { creerMascotte } from './mascotte.js';
import {
  blocNumeros, choisirProcedure, distanceM, etapesGuidees, formaterDistance,
  formaterDuree, lieuxDepuisReponse, resumerRoute, sousCommande, trierParDistance,
  urlRoute, urlSecoursProche,
} from './urgence.js';

const CSS = `
/* ── MODE URGENCE : on gèle tout ce qui bouge à l'écran ─────────────────── */
body.wt-urgence *:not(#wt-mascotte):not(#wt-mascotte *):not(.wt-urgence-vif):not(.wt-urgence-vif *) {
  animation-play-state: paused !important;
}
/* on n'éteint pas la scène : on range tout le reste, sauf le chat et l'œil */
body.wt-urgence > *:not(#cesiumContainer):not(#world-overlay-root):not(#wt-mascotte):not(.wt-urgence-garde):not(#wt-urgence-voile) {
  opacity: .06 !important;
  pointer-events: none !important;
}
body.wt-urgence .wt-urgence-garde { opacity: 1 !important; pointer-events: auto !important; }
body.wt-urgence #cesiumContainer { filter: saturate(.75) brightness(.9); }

/* le chat passe en GRAND, au centre */
body.wt-urgence .wt-urgence-grand {
  position: fixed !important; left: 50% !important; top: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: min(760px, 92vw) !important; height: min(70vh, 640px) !important;
  max-height: 70vh !important; z-index: 9990 !important;
  box-shadow: 0 24px 80px rgba(0,0,0,.65) !important;
  border-color: rgba(255,80,80,.55) !important;
  opacity: 1 !important; pointer-events: auto !important;
}
body.wt-urgence .wt-urgence-grand .wt-dock-titre {
  background: linear-gradient(180deg, rgba(255,60,60,.32), rgba(120,0,0,.28)) !important;
  border-bottom: 1px solid rgba(255,80,80,.55) !important;
}
body.wt-urgence .wt-urgence-grand .wt-dock-corps { height: calc(100% - 34px) !important; }
body.wt-urgence #wt-chat { height: 100% !important; font-size: 12px; }
body.wt-urgence #wt-chat .journal { font-size: 12.5px; line-height: 1.75; }
body.wt-urgence #wt-chat .msg { max-width: 96%; padding: 9px 12px; }

/* bandeau « procédure » collé sous le titre du chat */
#wt-urgence-bandeau {
  display: flex; align-items: center; gap: 10px; padding: 7px 11px;
  background: rgba(120,0,0,.35); border-bottom: 1px solid rgba(255,80,80,.5);
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px;
  letter-spacing: .5px; color: #ffd9d9;
}
#wt-urgence-bandeau .etape { color: #fff; font-weight: 700; }
#wt-urgence-bandeau .quitter {
  margin-left: auto; cursor: pointer; padding: 4px 9px; border-radius: 7px;
  background: rgba(0,0,0,.35); border: 1px solid rgba(255,120,120,.5); color: #ffb3b3;
  font-family: inherit; font-size: 10px; font-weight: 700;
}
#wt-urgence-voile {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  box-shadow: inset 0 0 240px rgba(255,0,0,.35);
  animation: wt-urgence-halo 2.4s ease-in-out infinite;
}
@keyframes wt-urgence-halo {
  0%, 100% { box-shadow: inset 0 0 180px rgba(255,0,0,.28); }
  50% { box-shadow: inset 0 0 300px rgba(255,0,0,.45); }
}
`;

/** Petit texte parlant (les phrases du guidage). */
const REPLIQUES = {
  debut: 'Je reste avec toi. On avance ensemble, une étape à la fois.',
  carte: 'Je vais voir ce qu’il y a autour…',
  etape: 'On passe à la suite.',
  fin: 'Procédure terminée. Si tu es en sécurité, préviens un proche.',
  sortie: 'Mode urgence quitté — l’écran reprend son cours.',
};

/**
 * @param {object} viewer Viewer Cesium
 * @param {object} [opts]
 * @param {(t:string, moi?:boolean)=>void} [opts.dire] sortie dans le chat
 * @param {(t:string)=>void} [opts.surMessage] toast
 * @param {HTMLElement} [opts.panneau] conteneur du chat (dock) à agrandir
 * @param {(t:string)=>Promise<{lon:number,lat:number,nom:string}|null>} [opts.geocoder]
 * @param {boolean} [opts.mascotte=true]
 */
export function initUrgenceMode(viewer, opts = {}) {
  const dire = typeof opts.dire === 'function' ? opts.dire : () => {};
  const surMessage = typeof opts.surMessage === 'function' ? opts.surMessage : () => {};
  const geocoder = typeof opts.geocoder === 'function' ? opts.geocoder : async () => null;

  // ── style ──────────────────────────────────────────────────────────────
  let style = document.getElementById('wt-urgence-css');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wt-urgence-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── couche carte (points de secours + itinéraire) ──────────────────────
  let ds = null;
  try {
    ds = new Cesium.CustomDataSource('wt-urgence');
    viewer.dataSources.add(ds);
  } catch { ds = null; }

  const mascotte = opts.mascotte === false ? null : creerMascotte();

  const etat = {
    actif: false,
    procedure: null,
    etapes: [],
    etape: 0,
    lieux: [],
    route: null,
    motif: '',
    horloge: null,
    panneau: opts.panneau || null,
    bandeau: null,
    voile: null,
  };

  function centreVue() {
    const c = viewer.camera.positionCartographic;
    return { lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) };
  }

  function voler(lon, lat, alt, duree = 2.2) {
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), duration: duree });
  }

  // ── le bandeau « procédure » au-dessus du chat ─────────────────────────
  function bandeau() {
    if (!etat.panneau) return;
    let b = etat.panneau.querySelector('#wt-urgence-bandeau');
    if (!b) {
      b = document.createElement('div');
      b.id = 'wt-urgence-bandeau';
      const corps = etat.panneau.querySelector('.wt-dock-corps') || etat.panneau;
      corps.insertBefore(b, corps.firstChild);
      b.addEventListener('click', (e) => {
        if (e.target.closest('.quitter')) api.desactiver();
      });
    }
    etat.bandeau = b;
    const total = etat.etapes.length;
    b.innerHTML = `<span>🚨</span><span class="etape">${etat.procedure?.nom || 'URGENCE'}</span>`
      + `<span>étape ${Math.min(etat.etape + 1, Math.max(1, total))}/${total || '—'}</span>`
      + `<button class="quitter" type="button">QUITTER L’URGENCE ✕</button>`;
  }

  // ── gel / dégel de l'écran ─────────────────────────────────────────────
  function geler() {
    const clock = viewer.clock;
    etat.horloge = {
      shouldAnimate: clock.shouldAnimate,
      multiplier: clock.multiplier,
      currentTime: clock.currentTime?.clone?.(),
    };
    try { clock.shouldAnimate = false; clock.multiplier = 0; } catch { /* horloge verrouillée */ }
    // mini-carte + fils : plus rien ne défile pendant l'urgence
    try { window.__godsEyeView?.minimap?.arreterAnimation?.(); } catch { /* absente */ }
    try { window.__godsEyeView?.intelVues?.mettreEnPause?.(true); } catch { /* absent */ }
    document.body.classList.add('wt-urgence');
    if (!document.getElementById('wt-urgence-voile')) {
      const v = document.createElement('div');
      v.id = 'wt-urgence-voile';
      document.body.appendChild(v);
      etat.voile = v;
    }
    viewer.scene?.requestRender?.();
  }

  function degeler() {
    const h = etat.horloge;
    if (h) {
      try {
        viewer.clock.shouldAnimate = h.shouldAnimate !== false;
        viewer.clock.multiplier = h.multiplier || 1;
        if (h.currentTime) viewer.clock.currentTime = h.currentTime;
      } catch { /* horloge verrouillée */ }
      etat.horloge = null;
    }
    try { window.__godsEyeView?.minimap?.animer?.(); } catch { /* absente */ }
    try { window.__godsEyeView?.intelVues?.mettreEnPause?.(false); } catch { /* absent */ }
    document.body.classList.remove('wt-urgence');
    etat.voile?.remove(); etat.voile = null;
    viewer.scene?.requestRender?.();
  }

  /** Le chat passe en grand au centre. */
  function agrandirChat() {
    if (!etat.panneau) etat.panneau = document.getElementById('wt-dock-chat');
    if (!etat.panneau) return;
    etat.panneau.classList.remove('wt-dock-cache');
    etat.panneau.classList.add('wt-urgence-garde', 'wt-urgence-grand');
    const btn = window.__godsEyeView?.dock?.dock?.querySelector?.('.wt-dock-btn.actif');
    if (btn && !String(btn.textContent || '').includes('CHAT')) {
      const boutons = Array.from(window.__godsEyeView.dock.dock.querySelectorAll('.wt-dock-btn'));
      const chat = boutons.find((b) => String(b.textContent || '').includes('CHAT'));
      if (!etat.panneau.classList.contains('wt-dock-cache') === false) chat?.click();
    }
    bandeau();
    window.setTimeout(() => etat.panneau?.querySelector?.('input')?.focus?.(), 120);
  }

  function rendreChat() {
    etat.panneau?.classList.remove('wt-urgence-garde', 'wt-urgence-grand');
    etat.panneau?.querySelector?.('#wt-urgence-bandeau')?.remove();
  }

  // ── affichage carte ────────────────────────────────────────────────────
  function nettoyerCarte() {
    try { ds?.entities?.removeAll(); } catch { /* néant */ }
  }

  function marquerLieux(lieux) {
    if (!ds) return;
    for (const [i, l] of lieux.entries()) {
      ds.entities.add({
        id: `wt-urgence-lieu-${l.id}`,
        name: l.nom,
        position: Cesium.Cartesian3.fromDegrees(l.lon, l.lat),
        billboard: {
          image: pastilleSecours(i === 0),
          width: i === 0 ? 46 : 34,
          height: i === 0 ? 46 : 34,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${l.nom}`,
          font: '600 12px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.fromCssColorString('#ffe9e9'),
          outlineColor: Cesium.Color.fromCssColorString('#12060a'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 60_000),
        },
        description: l.adresse || '',
      });
    }
  }

  /** Pastille « secours » dessinée à la volée (canvas, aucune ressource). */
  function pastilleSecours(proche) {
    const c = document.createElement('canvas');
    c.width = 96; c.height = 96;
    const g = c.getContext('2d');
    const col = proche ? '#ff4b4b' : '#ff8a3d';
    g.beginPath(); g.arc(48, 48, 34, 0, Math.PI * 2);
    g.fillStyle = 'rgba(12,4,8,.9)'; g.fill();
    g.lineWidth = 6; g.strokeStyle = col; g.stroke();
    g.fillStyle = col; g.fillRect(42, 28, 12, 40);
    g.fillRect(28, 42, 40, 12);
    return c.toDataURL();
  }

  function tracerRoute(points, { couleur = '#ff4b4b' } = {}) {
    if (!ds || !points?.length) return;
    ds.entities.add({
      id: 'wt-urgence-route',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(points.flatMap((p) => [p[0], p[1]])),
        width: 7,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString(couleur),
        }),
        clampToGround: true,
      },
    });
  }

  /** Cadre la vue sur un itinéraire. */
  function cadrerRoute(points) {
    if (!points?.length) return;
    let minLon = 180; let maxLon = -180; let minLat = 90; let maxLat = -90;
    for (const [lon, lat] of points) {
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
    const hausse = Math.max(700, (maxLat - minLat) * 111_000 * 1.1);
    const large = Math.max(700, (maxLon - minLon) * 111_000 * 1.1);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees((minLon + maxLon) / 2, (minLat + maxLat) / 2, Math.max(hausse, large) * 1.35),
      duration: 2.4,
    });
  }

  // ── les actions du mode urgence ────────────────────────────────────────
  async function urgencesProches(type = 'secours') {
    const { lon, lat } = centreVue();
    dire(`🔎 ${type === 'secours' ? 'Secours' : type} les plus proches…`);
    mascotte?.dire(REPLIQUES.carte, 2600);
    await mascotte?.regarderCarte(900);
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(urlSecoursProche(lat, lon, type, 8000))}`,
      });
      const json = await r.json();
      const lieux = trierParDistance(lieuxDepuisReponse(json), lat, lon);
      etat.lieux = lieux;
      if (!lieux.length) {
        dire('Aucun point de secours trouvé autour (5 km). En attendant : 112 · 15 · 17 · 18.');
        await mascotte?.regarderUtilisateur();
        return;
      }
      marquerLieux(lieux.slice(0, 12));
      const top = lieux.slice(0, 3).map((l, i) => `${i + 1}. ${l.nom} — ${formaterDistance(l.distance)}${l.telephone ? ` · ☎ ${l.telephone}` : ''}`);
      dire(`🏥 Les plus proches :\n${top.join('\n')}\n\n📞 Pour appeler : 112 · 15 · 17 · 18\n🧭 Tape « /urgence itinéraire » pour tracer la route vers le premier.`);
      voler(lieux[0].lon, lieux[0].lat, 1400, 2.4);
      await mascotte?.regarderUtilisateur();
      mascotte?.dire(`Le plus proche : ${lieux[0].nom} à ${formaterDistance(lieux[0].distance)}.`);
    } catch {
      dire('Réseau indisponible depuis ici. Appelle directement : 112 · 15 · 17 · 18 (ou le 114 par SMS).');
      await mascotte?.regarderUtilisateur();
    }
  }

  async function itineraireVers(texte) {
    const cible = etat.lieux[0] && !texte ? { lon: etat.lieux[0].lon, lat: etat.lieux[0].lat, nom: etat.lieux[0].nom } : await geocoder(texte);
    if (!cible) { dire(`Je n’ai pas trouvé « ${texte} ». Donne-moi une ville ou une adresse (ex : « /urgence itinéraire hôpital Sète »).`); return; }
    const depart = centreVue();
    dire(`🧭 Itinéraire le plus rapide vers ${cible.nom}…`);
    mascotte?.dire(REPLIQUES.carte, 3000);
    await mascotte?.regarderCarte(1200);
    try {
      const r = await fetch(urlRoute(depart, cible, 'driving'));
      const json = await r.json();
      const trajet = resumerRoute(json);
      if (!trajet) throw new Error('aucune route');
      etat.route = trajet;
      nettoyerCarte();
      marquerLieux(etat.lieux.filter((l) => l.nom === cible.nom));
      tracerRoute(trajet.geometrie);
      cadrerRoute(trajet.geometrie);
      const etapes = trajet.etapes.slice(0, 5).map((e, i) => `  ${i + 1}. ${e}`).join('\n');
      dire(`🚗 ${formaterDistance(trajet.distance)} · ${formaterDuree(trajet.duree)} vers ${cible.nom}\n${etapes}\n\n🗺 L’itinéraire est tracé en rouge. La vue suit le trajet.`);
      // le guidage pas à pas reprend la main : on ajoute l’étape « rejoindre »
      etat.etapes.push({ n: etat.etapes.length + 1, texte: `Rejoindre ${cible.nom} (${formaterDistance(trajet.distance)} — ${formaterDuree(trajet.duree)})`, ic: '🧭' });
      bandeau();
      mascotte?.parle(true);
      mascotte?.dire(`Suis le trait rouge : ${formaterDistance(trajet.distance)}.`, 4200);
      window.setTimeout(() => mascotte?.parle(false), 4200);
    } catch {
      const d = distanceM(depart, cible);
      dire(`Pas d’itinéraire routier disponible. À vol d’oiseau : ${formaterDistance(d)} vers ${cible.nom}.`);
      voler(cible.lon, cible.lat, 1600, 2.2);
    }
  }

  /** Affiche l'étape courante (et anime la mascotte en conséquence). */
  async function montrerEtape() {
    const e = etat.etapes[etat.etape];
    if (!e) return;
    bandeau();
    dire(`${e.ic} ÉTAPE ${e.n}/${etat.etapes.length}\n${e.texte}`);
    if (e.ic === '🧭' || e.ic === '🚪') {
      mascotte?.dire(REPLIQUES.carte, 2600);
      await mascotte?.regarderCarte(1500);
    } else {
      await mascotte?.regarderUtilisateur();
      mascotte?.dire(e.texte.length > 90 ? `${e.texte.slice(0, 88)}…` : e.texte, 5200);
    }
  }

  async function etapeSuivante() {
    if (!etat.actif) return;
    if (etat.etape >= etat.etapes.length - 1) {
      dire(`✅ ${REPLIQUES.fin}\n\nCommandes : « /urgence suite » pour revoir, « /urgence secours » pour les secours proches, « /urgence fin » pour sortir.`);
      mascotte?.dire(REPLIQUES.fin, 5200);
      return;
    }
    etat.etape += 1;
    mascotte?.dire(REPLIQUES.etape, 1600);
    await montrerEtape();
  }

  async function activer(motif = '') {
    const deja = etat.actif;
    etat.motif = motif || etat.motif || '';
    const procedure = choisirProcedure(`${motif} ${etat.motif}`.trim());
    etat.procedure = procedure;
    etat.etapes = etapesGuidees(procedure, etat.route
      ? { destination: etat.route.destination, distance: formaterDistance(etat.route.distance) } : {});
    etat.etape = 0;

    if (!deja) {
      geler();
      etat.actif = true;
      agrandirChat();
      mascotte?.montrer({ centre: true });
      mascotte?.cliquable(true);
      mascotte?.urgent(true);
      mascotte?.dire(REPLIQUES.debut, 4600);
      surMessage('🚨 MODE URGENCE — temps gelé, je te guide étape par étape.');
      dire(`🚨 MODE URGENCE — ${procedure.nom}\nTemps gelé, je reste avec toi et je te guide.\n\n📞 NUMÉROS\n${blocNumeros()}\n\nProcédure : ${procedure.nom} (${procedure.etapes.length} étapes)\nTape « /urgence suite » pour avancer.`);
      // regarde l'utilisateur → se tourne vers la carte → revient → se perche
      mascotte?.regarderUtilisateur();
      window.setTimeout(async () => {
        await mascotte?.regarderCarte(1800);
        mascotte?.suivreSouris(true);
        mascotte?.percher(0);
      }, 1500);
    } else {
      bandeau();
      dire(`🚨 Nouvelle procédure : ${procedure.nom}`);
    }
    window.setTimeout(() => montrerEtape(), deja ? 60 : 1700);
  }

  function desactiver() {
    if (!etat.actif) return;
    etat.actif = false;
    etat.etape = 0;
    etat.etapes = [];
    etat.motif = '';
    nettoyerCarte();
    rendreChat();
    degeler();
    mascotte?.parle(false);
    mascotte?.urgent(false);
    mascotte?.dire(REPLIQUES.sortie, 2600);
    window.setTimeout(() => mascotte?.cacher(), 1400);
    dire(`✅ ${REPLIQUES.sortie}`);
    surMessage('✅ Mode urgence quitté.');
  }

  const api = {
    /** Active le mode urgence (motif libre : « incendie », « malaise »…). */
    activer,
    /** Quitte le mode urgence. */
    desactiver,
    basculer(motif = '') { return etat.actif ? (desactiver(), Promise.resolve()) : activer(motif); },
    etapeSuivante,
    urgencesProches,
    itineraireVers,
    estActive: () => etat.actif,
    /** Infos affichables (pastilles, bandeau). */
    contexte: () => ({ actif: etat.actif, etape: etat.etape, total: etat.etapes.length, motif: etat.motif }),
    /**
     * Point d'entrée du chat : renvoie `true` si la phrase a été traitée.
     * @param {string} texte
     */
    traiter(texte) {
      const brut = String(texte || '').trim();
      if (!brut) return false;
      const r = /^\s*(\/)?urgence\b(.*)$/i.exec(brut) || (/^(au secours|sos|a l aide|à l’aide|à l'aide)\b(.*)$/i.test(brut) ? [null, null, brut] : null);
      if (!r) return false;
      const arg = String(r[2] || '').replace(/^[^a-zà-ÿ0-9]+/i, '').trim();
      const s = sousCommande(arg);
      if (!etat.actif && s.type !== 'fin') { activer(arg); return true; }
      switch (s.type) {
        case 'fin': desactiver(); break;
        case 'suite': etapeSuivante(); break;
        case 'secours': urgencesProches(s.valeur || 'secours'); break;
        case 'itineraire': itineraireVers(s.valeur); break;
        case 'procedure': activer(s.valeur || arg); break;
        default: activer(arg); break;
      }
      return true;
    },
    /** Nettoie la couche carte (appelé si la vue change de commune). */
    nettoyerCarte,
    /** pour les tests / le dock. */
    _etat: etat,
  };

  if (mascotte) {
    mascotte.el.addEventListener('wt-mascotte-clic', () => {
      if (!etat.actif) return;
      etapeSuivante();
    });
  }

  return api;
}
