/**
 * WATCHTOWER — MÉDAILLONS DE LIEU (noms de lieux « 360° »).
 *
 * Demandé : quand les NOMS DE LIEUX sont actifs, le nom affiché devient une
 * **grande icône qui flotte**, animée d'une **rotation 360° lente**,
 * **cliquable** : elle ouvre la carte / la fiche du lieu et propose de
 * **descendre d'un niveau** (pays → région → département → ville → quartier)
 * ou de **monter**, de façon dynamique.
 *
 * Comment :
 *  · la hiérarchie est lue par **Nominatim reverse** (données ouvertes,
 *    sans clé) au centre de la vue — un seul appel, amorti (2 s) ;
 *  · un médaillon par niveau connu est posé sur la carte : un disque dessiné
 *    au canvas, qui tourne lentement (rotation du billboard) et monte et
 *    descend doucement (flottement) ;
 *  · au clic : une carte s'ouvre avec le nom, le niveau, et les boutons
 *    ⬆ MONTER · ⬇ DESCENDRE · 📄 FICHE · 🎯 RECENTRER.
 *
 * Rien n'est bloqué : sans réseau, la hiérarchie reste vide et les
 * médaillons n'apparaissent pas — l'appli continue normalement.
 */

import * as Cesium from 'cesium';
import { governorRequestRender, holdContinuousRender, releaseContinuousRender } from './renderGovernor.js';

/** Niveaux, du plus vaste au plus précis. */
export const NIVEAUX = ['pays', 'region', 'departement', 'commune', 'quartier'];

/** Libellés français. */
export const LIBELLES = {
  pays: 'PAYS',
  region: 'RÉGION',
  departement: 'DÉPARTEMENT',
  commune: 'COMMUNE',
  quartier: 'QUARTIER',
};

/** Altitude (m) à partir de laquelle chaque niveau devient « le bon ». */
export const SEUILS = [
  { niveau: 'pays', altitude: 900_000 },
  { niveau: 'region', altitude: 160_000 },
  { niveau: 'departement', altitude: 26_000 },
  { niveau: 'commune', altitude: 4_000 },
  { niveau: 'quartier', altitude: 0 },
];

/**
 * Niveau courant d'après l'altitude de la caméra (fonction pure, testée).
 * @param {number} altitude mètres
 * @param {Array} [seuils]
 */
export function niveauSelonAltitude(altitude, seuils = SEUILS) {
  const a = Number(altitude);
  if (!Number.isFinite(a)) return 'quartier';
  for (const s of seuils) if (a >= s.altitude) return s.niveau;
  return seuils[seuils.length - 1].niveau;
}

/** Voisins dans la hiérarchie (fonction pure, testée). */
export function voisins(niveau, liste = NIVEAUX) {
  const i = liste.indexOf(niveau);
  if (i < 0) return { monter: null, descendre: null, courant: null };
  return {
    courant: liste[i],
    monter: i > 0 ? liste[i - 1] : null,
    descendre: i < liste.length - 1 ? liste[i + 1] : null,
  };
}

/**
 * Transforme une réponse Nominatim en hiérarchie exploitable.
 * Fonction pure, testée.
 */
export function hierarchieDeReponse(adresse) {
  const a = adresse || {};
  const net = (v) => String(v ?? '').trim();
  return {
    pays: net(a.country || a.country_code),
    region: net(a.state || a.region || a.province),
    departement: net(a.county || a.state_district),
    commune: net(a.city || a.town || a.village || a.municipality || a.hamlet),
    quartier: net(a.suburb || a.neighbourhood || a.city_district || a.quarter),
    complet: net(a.display_name),
  };
}

/** Dessine le médaillon (disque + anneau + nom). Renvoie une data-URL. */
export function dessinerMedaillon(nom, { taille = 256, couleur = '#00d4ff', sous = '' } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const r = taille / 2;
  ctx.clearRect(0, 0, taille, taille);
  // disque
  const degr = ctx.createRadialGradient(r, r, r * 0.2, r, r, r);
  degr.addColorStop(0, 'rgba(6,14,24,0.95)');
  degr.addColorStop(1, 'rgba(6,14,24,0.55)');
  ctx.fillStyle = degr;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  // anneaux
  ctx.strokeStyle = couleur;
  ctx.lineWidth = taille * 0.018;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([taille * 0.05, taille * 0.05]);
  ctx.beginPath();
  ctx.arc(r, r, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // graduations
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(a) * r * 0.62, r + Math.sin(a) * r * 0.62);
    ctx.lineTo(r + Math.cos(a) * r * 0.7, r + Math.sin(a) * r * 0.7);
    ctx.strokeStyle = i % 3 === 0 ? couleur : 'rgba(232,234,237,0.35)';
    ctx.lineWidth = taille * 0.012;
    ctx.stroke();
  }
  // texte
  ctx.fillStyle = '#e8eaed';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titre = String(nom || '—').toUpperCase();
  const police = Math.max(11, Math.min(30, Math.floor(taille / (Math.max(6, titre.length) * 0.36))));
  ctx.font = `700 ${police}px "JetBrains Mono", monospace`;
  ctx.fillText(titre.slice(0, 22), r, sous ? r - taille * 0.045 : r);
  if (sous) {
    ctx.font = `600 ${Math.max(9, Math.floor(taille / 22))}px "JetBrains Mono", monospace`;
    ctx.fillStyle = couleur;
    ctx.fillText(String(sous).toUpperCase().slice(0, 18), r, r + taille * 0.08);
  }
  try { return c.toDataURL('image/png'); } catch { return null; }
}

const CSS = `
#wt-medaillon-carte {
  position: fixed; z-index: 970; left: 50%; top: 76px; transform: translateX(-50%);
  width: min(320px, 92vw); display: none; flex-direction: column; gap: 5px;
  padding: 9px 11px; border-radius: 10px; font-family: var(--font-mono, monospace);
  background: rgba(6,10,18,0.95); color: #e8eaed;
  border: 1px solid rgba(0,212,255,0.45); box-shadow: 0 12px 34px rgba(0,0,0,0.6);
}
#wt-medaillon-carte.ouvert { display: flex; animation: wt-med-pop 200ms ease; }
@keyframes wt-med-pop { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
#wt-medaillon-carte .mc-titre { font-size: 12px; font-weight: 700; color: #00d4ff; letter-spacing: 1px; }
#wt-medaillon-carte .mc-niveau { font-size: 8px; letter-spacing: 2px; opacity: .6; }
#wt-medaillon-carte .mc-rang { display: flex; flex-wrap: wrap; gap: 4px; }
#wt-medaillon-carte button {
  cursor: pointer; flex: 1 1 auto; padding: 6px 8px; border-radius: 7px;
  font-family: inherit; font-size: 8.5px; font-weight: 700; letter-spacing: 1px;
  background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.35); color: #00d4ff;
}
#wt-medaillon-carte button:hover { background: rgba(0,212,255,0.24); }
#wt-medaillon-carte button.gris { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.16); color: rgba(232,234,237,0.75); }
`;

/** Rotation lente : un tour complet en `duree` ms. */
export const DUREE_TOUR_MS = 26_000;

/**
 * @param {object} viewer
 * @param {{fiche?:Function, surMessage?:Function, actif?:boolean}} [options]
 */
export function initMedaillons(viewer, options = {}) {
  const { fiche = null, surMessage = null } = options || {};
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const ds = new Cesium.CustomDataSource('wt-medaillons');
  viewer.dataSources.add(ds);

  const carte = document.createElement('div');
  carte.id = 'wt-medaillon-carte';
  carte.innerHTML = `
    <div class="mc-niveau">LIEU</div>
    <div class="mc-titre">—</div>
    <div class="mc-rang">
      <button type="button" data-m="monter">⬆ MONTER</button>
      <button type="button" data-m="descendre">⬇ DESCENDRE</button>
    </div>
    <div class="mc-rang">
      <button type="button" data-m="fiche">📄 FICHE</button>
      <button type="button" data-m="centrer">🎯 RECENTRER</button>
      <button type="button" class="gris" data-m="fermer">✕</button>
    </div>`;
  document.body.appendChild(carte);

  let actif = options.actif !== false;
  let hier = null;
  let niveau = 'pays';
  let centre = { lon: 3.75, lat: 43.44 };
  let entites = new Map(); // niveau → entity
  let dateDebut = Date.now();
  let dernierAppel = 0;
  let enCours = null;

  const couleurNiveau = (n) => (n === 'pays' ? '#7dff4a' : n === 'region' ? '#00d4ff' : n === 'departement' ? '#ffb040' : n === 'commune' ? '#ff6fae' : '#c39bff');

  // ── hiérarchie (Nominatim, gratuit, sans clé) ─────────────────────────
  async function chercherHierarchie(lon, lat) {
    const maintenant = Date.now();
    if (maintenant - dernierAppel < 2000 && hier) return hier;
    dernierAppel = maintenant;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&addressdetails=1&accept-language=fr`);
      if (!r.ok) return hier;
      const j = await r.json();
      const h = hierarchieDeReponse(j?.address);
      h.complet = String(j?.display_name || h.complet || '');
      h.lon = lon;
      h.lat = lat;
      hier = h;
      return h;
    } catch { return hier; }
  }

  /** Géocode un nom de lieu (pour voler vers lui). */
  async function geocoder(terme) {
    if (!terme) return null;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(terme)}&limit=1&accept-language=fr`);
      if (!r.ok) return null;
      const j = await r.json();
      const p = j?.[0];
      if (!p) return null;
      const sud = Number(p.boundingbox?.[0]);
      const nord = Number(p.boundingbox?.[1]);
      const ouest = Number(p.boundingbox?.[2]);
      const est = Number(p.boundingbox?.[3]);
      return {
        lon: Number(p.lon), lat: Number(p.lat),
        hauteur: Math.max(900, Math.abs(nord - sud) * 111_320 * 1.6 || 4000),
      };
    } catch { return null; }
  }

  // ── flottement + rotation ─────────────────────────────────────────────
  const altitudeDeBase = (n) => (n === 'pays' ? 260_000 : n === 'region' ? 60_000 : n === 'departement' ? 9_000 : n === 'commune' ? 1_800 : 420);

  function positionFlottante(lon, lat, altBase, phase) {
    return new Cesium.CallbackProperty((t) => {
      const sec = (Date.now() - dateDebut) / 1000;
      const h = altBase + Math.sin(sec * 0.7 + phase) * (altBase * 0.05 + 8);
      void t;
      return Cesium.Cartesian3.fromDegrees(lon, lat, h);
    }, false);
  }

  function rotationLente(phase) {
    return new Cesium.CallbackProperty(() => {
      const sec = (Date.now() - dateDebut) / 1000 + phase;
      return (sec / (DUREE_TOUR_MS / 1000)) * Math.PI * 2;
    }, false);
  }

  function construire() {
    ds.entities.removeAll();
    entites = new Map();
    if (!actif || !hier) return;
    let i = 0;
    for (const niv of NIVEAUX) {
      const nom = hier[niv];
      if (!nom) continue;
      const alt = altitudeDeBase(niv);
      const image = dessinerMedaillon(nom, {
        taille: 256,
        couleur: couleurNiveau(niv),
        sous: LIBELLES[niv] || niv,
      });
      if (!image) break;
      const taille = niv === niveau ? 132 : 92;
      const e = ds.entities.add({
        position: positionFlottante(centre.lon, centre.lat, alt, i * 1.3),
        billboard: {
          image,
          width: taille,
          height: taille,
          rotation: rotationLente(i * 2.1),
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          scaleByDistance: new Cesium.NearFarScalar(2_000, 1, 4_000_000, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: { wtMedaillon: true, wtNiveau: niv, wtNom: nom },
      });
      entites.set(niv, e);
      i += 1;
    }
    ds.show = true;
    governorRequestRender('wt-medaillons');
  }

  // ── carte au clic ─────────────────────────────────────────────────────
  let niveauClique = null;

  function ouvrirCarte(niv) {
    if (!hier) return;
    niveauClique = niv || niveau;
    const nom = hier[niveauClique] || '—';
    const v = voisins(niveauClique);
    carte.querySelector('.mc-titre').textContent = nom;
    carte.querySelector('.mc-niveau').textContent = `${LIBELLES[niveauClique] || niveauClique} — ${hier.complet || ''}`.slice(0, 90);
    const bMonter = carte.querySelector('[data-m="monter"]');
    const bDescendre = carte.querySelector('[data-m="descendre"]');
    bMonter.disabled = !v.monter || !hier[v.monter];
    bDescendre.disabled = !v.descendre || !hier[v.descendre];
    bMonter.textContent = v.monter && hier[v.monter] ? `⬆ ${hier[v.monter]}`.slice(0, 26) : '⬆ MONTER';
    bDescendre.textContent = v.descendre && hier[v.descendre] ? `⬇ ${hier[v.descendre]}`.slice(0, 26) : '⬇ DESCENDRE';
    bMonter.style.opacity = bMonter.disabled ? 0.35 : 1;
    bDescendre.style.opacity = bDescendre.disabled ? 0.35 : 1;
    carte.classList.add('ouvert');
  }

  async function allerVers(niv) {
    if (!hier || !hier[niv]) return;
    const cible = await geocoder(`${hier[niv]}, ${hier.pays || ''}`);
    if (cible) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(cible.lon, cible.lat, cible.hauteur),
        duration: 1.6,
      });
      surMessage?.(`🧭 Cap sur ${hier[niv]} (${LIBELLES[niv] || niv})`);
    } else {
      surMessage?.(`⚠ ${hier[niv]} introuvable pour le moment (source géographique muette).`);
    }
    carte.classList.remove('ouvert');
  }

  carte.querySelector('[data-m="monter"]').addEventListener('click', () => {
    const v = voisins(niveauClique || niveau);
    if (v.monter) allerVers(v.monter);
  });
  carte.querySelector('[data-m="descendre"]').addEventListener('click', () => {
    const v = voisins(niveauClique || niveau);
    if (v.descendre) allerVers(v.descendre);
  });
  carte.querySelector('[data-m="fiche"]').addEventListener('click', () => {
    if (fiche && hier) fiche(centre.lon, centre.lat, hier[niveauClique || niveau]);
    carte.classList.remove('ouvert');
  });
  carte.querySelector('[data-m="centrer"]').addEventListener('click', () => {
    const alt = altitudeDeBase(niveauClique || niveau);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centre.lon, centre.lat, alt),
      duration: 1.4,
    });
    carte.classList.remove('ouvert');
  });
  carte.querySelector('[data-m="fermer"]').addEventListener('click', () => carte.classList.remove('ouvert'));

  const gestionnaire = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  gestionnaire.setInputAction((clic) => {
    if (!actif) return;
    const objet = viewer.scene.pick(clic.position);
    const p = objet?.id?.properties;
    if (!p || !p.wtMedaillon?.getValue?.()) return;
    ouvrirCarte(p.wtNiveau.getValue());
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // ── boucle ────────────────────────────────────────────────────────────
  async function maj() {
    if (!actif) return;
    if (enCours) return;
    enCours = true;
    try {
      const c = viewer.camera.positionCartographic;
      const lon = Cesium.Math.toDegrees(c.longitude);
      const lat = Cesium.Math.toDegrees(c.latitude);
      const alt = c.height;
      const niv = niveauSelonAltitude(alt);
      const bouge = Math.abs(lon - centre.lon) > 0.02 || Math.abs(lat - centre.lat) > 0.02;
      centre = { lon, lat };
      if (bouge || !hier) await chercherHierarchie(lon, lat);
      if (niv !== niveau || bouge) {
        niveau = niv;
        construire();
      }
    } finally {
      enCours = null;
    }
  }

  const timer = window.setInterval(maj, 3000);
  holdContinuousRender('wt-medaillons');

  return {
    /** Allume / éteint les médaillons (branché sur « noms de lieux »). */
    activer(on = true) {
      actif = Boolean(on);
      ds.show = actif;
      if (actif) { maj(); holdContinuousRender('wt-medaillons'); }
      else {
        ds.entities.removeAll();
        carte.classList.remove('ouvert');
        releaseContinuousRender('wt-medaillons');
      }
      governorRequestRender('wt-medaillons');
      return actif;
    },
    visible: () => actif,
    maj,
    niveau: () => niveau,
    hierarchie: () => (hier ? { ...hier } : null),
    /** Ouvre la carte du niveau courant (utilisable depuis le clavier). */
    ouvrirCarte: (niv) => ouvrirCarte(niv || niveau),
    fermerCarte: () => carte.classList.remove('ouvert'),
    statistiques: () => ({ actif, niveau, medaillons: entites.size, lieu: hier?.[niveau] || '' }),
    arreter: () => {
      window.clearInterval(timer);
      releaseContinuousRender('wt-medaillons');
      gestionnaire.destroy?.();
    },
  };
}
