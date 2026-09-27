/**
 * WATCHTOWER — NOMS DE LIEUX & REPÈRE DE POSITION.
 *
 * Deux besoins : pouvoir S'ORIENTER (les noms de communes, villes, pays
 * doivent rester lisibles quel que soit le zoom) et savoir OÙ l'on est (une
 * fenêtre sous la boussole donne le lieu central de la vue).
 *
 *  · fenêtre « LIEU CENTRAL » : commune (geo.api.gouv.fr en France,
 *    Nominatim ailleurs) + population + département/pays, rafraîchie quand
 *    la caméra s'arrête ;
 *  · couche d'ÉTIQUETTES : noms de pays → villes → quartiers → hameaux
 *    piochés dans OpenStreetMap (`place=*`) autour de la vue, avec une
 *    distance d'affichage propre à chaque rang (un hameau ne s'affiche que
 *    de près, une ville de très loin) — rendu très léger : du texte, pas de
 *    géométrie.
 *
 * Gratuit, sans clé. Requêtes limitées (anti-spam des sources ouvertes).
 */

import * as Cesium from 'cesium';
import { governorRequestRender } from './renderGovernor.js';
import { amenagerFenetre } from './fenetres.js';
import { echelleSelonAltitude, echelonDemandeUneCommune, zoneMondiale } from './data/geo/echelleVue.js';

const CSS = `
#wt-ville {
  position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 1150;
  min-width: 190px; max-width: 320px; padding: 6px 12px 7px; text-align: center;
  font-family: var(--font-mono, monospace); color: #e8eaed;
  background: linear-gradient(180deg, rgba(10,14,22,0.92), rgba(10,14,22,0.78));
  border: 1px solid rgba(0,212,255,0.35); border-radius: 10px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.45); pointer-events: auto;
}
#wt-ville .wv-nom { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; line-height: 1.2; }
#wt-ville .wv-sous { font-size: 8px; letter-spacing: 2px; color: #00d4ff; margin-top: 2px; }
#wt-ville .wv-meta { font-size: 8px; color: rgba(232,234,237,0.55); margin-top: 3px; letter-spacing: 0.5px; }
#wt-ville:active { cursor: grabbing; }
`;

/** Rangs OSM `place` : rayon d'affichage et style, du plus loin au plus près. */
export const RANGS = Object.freeze([
  { cle: 'country', nom: 'Pays', couleur: '#ffffff', police: 15, max: 30_000_000, min: 0, gras: true },
  { cle: 'state', nom: 'Région', couleur: '#dfe8f5', police: 14, max: 14_000_000, min: 0, gras: true },
  { cle: 'city', nom: 'Ville', couleur: '#ffe14d', police: 15, max: 3_000_000, min: 0, gras: true },
  { cle: 'town', nom: 'Ville', couleur: '#ffe14d', police: 13, max: 900_000, min: 0, gras: true },
  { cle: 'suburb', nom: 'Quartier', couleur: '#7dd3c8', police: 12, max: 60_000, min: 0 },
  { cle: 'village', nom: 'Village', couleur: '#e8eaed', police: 12, max: 220_000, min: 0 },
  { cle: 'neighbourhood', nom: 'Quartier', couleur: '#9fb4c7', police: 11, max: 22_000, min: 0 },
  { cle: 'hamlet', nom: 'Hameau', couleur: '#9fb4c7', police: 10, max: 40_000, min: 0 },
  { cle: 'locality', nom: 'Lieu-dit', couleur: '#8fa3b8', police: 10, max: 18_000, min: 0 },
  { cle: 'island', nom: 'Île', couleur: '#7fd4ff', police: 12, max: 3_000_000, min: 0 },
]);

const RANG_PAR_CLE = new Map(RANGS.map((r) => [r.cle, r]));
const PLACE_RE = '^(country|state|region|province|city|town|municipality|suburb|village|hamlet|neighbourhood|quarter|locality|island|islet)$';

/**
 * Rayon (m) de la requête OpenStreetMap selon l'altitude : plus on est haut,
 * plus on balaie large — mais jamais assez pour saturer la source.
 */
export function rayonSelonAltitude(altitude) {
  const h = Math.max(300, Number(altitude) || 1000);
  return Math.min(70_000, Math.max(1_500, h * 1.7));
}

/** Nombre maximum d'étiquettes demandées/affichées. */
export const MAX_ETIQUETTES = 90;

async function overpass(req, delai = 20_000) {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), delai);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(`[out:json][timeout:25];${req}`)}`,
      signal: controle.signal,
    });
    return (await r.json())?.elements || [];
  } catch {
    return [];
  } finally {
    clearTimeout(minuteur);
  }
}

/** La France métropolitaine (test grossier pour choisir geo.api.gouv.fr). */
export function enFrance(lat, lon) {
  return lat > 41 && lat < 51.5 && lon > -5.5 && lon < 9.8;
}

/**
 * Altitude ecrite comme on la lit : en metres pres du sol, en kilometres
 * au-dela. « 0 km d'altitude » affiche a 400 m ne disait rien.
 * @param {number} m
 * @returns {string}
 */
export function lisibleAltitude(m) {
  const h = Math.max(0, Number(m) || 0);
  if (h < 2_000) return `${Math.round(h)} m d'altitude`;
  return `${Math.round(h / 1000).toLocaleString('fr-FR')} km d'altitude`;
}

/**
 * @param {object} viewer
 * @param {{fenetres?:boolean}} [options]
 */
export function initNomsLieux(viewer, options = {}) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const dsNoms = new Cesium.CustomDataSource('wt-noms-lieux');
  viewer.dataSources.add(dsNoms);

  // ——— fenêtre « lieu central » sous la boussole ———
  const fen = document.createElement('div');
  fen.id = 'wt-ville';
  fen.innerHTML = '<div class="wv-nom">—</div><div class="wv-sous">LOCALISATION</div><div class="wv-meta">zoome pour plus de précision</div>';
  document.body.appendChild(fen);
  if (options.fenetres !== false) {
    amenagerFenetre(fen, { cle: 'wt-ville', redimensionnable: true, minW: 160, minH: 40 });
  }

  const nomEl = fen.querySelector('.wv-nom');
  const sousEl = fen.querySelector('.wv-sous');
  const metaEl = fen.querySelector('.wv-meta');

  let dernierCentre = null;
  let dernierEchelon = '';
  let dernierPays = '';
  let enCours = false;
  let timer = null;

  /**
   * Nom du lieu central, A L'ECHELLE DE CE QUI EST A L'ECRAN.
   *
   * La fenetre annoncait la commune quelle que soit la hauteur : depuis
   * l'espace elle affichait FRONTIGNAN - COMMUNE 34 alors que l'image montrait
   * un quart de l'Europe. On lit donc d'abord l'echelon que la vue couvre
   * reellement, et on ne descend au niveau communal que quand la commune
   * remplit l'image.
   */
  async function lieuCentral(lat, lon, altitude) {
    const ech = echelleSelonAltitude(altitude);

    // Echelons larges : reponse LOCALE, immediate, sans reseau.
    if (ech.cle === 'continent') {
      const z = zoneMondiale(lat, lon);
      return {
        nom: z.nom.toUpperCase(),
        sous: z.type === 'continent' ? 'CONTINENT' : z.type === 'mer' ? 'MER' : 'OCÉAN',
        meta: `${z.precision} · ${Math.round(altitude / 1000).toLocaleString('fr-FR')} km · zoome pour voir les pays`,
      };
    }

    if (echelonDemandeUneCommune(ech.cle) && enFrance(lat, lon)) {
      try {
        const r = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,population,codeDepartement,codesPostaux`);
        const c = (await r.json())?.[0];
        if (c?.nom) {
          return {
            nom: c.nom,
            sous: `COMMUNE · ${c.codeDepartement || ''}`.trim(),
            meta: `${(c.population || 0).toLocaleString('fr-FR')} hab. · ${c.codesPostaux?.[0] || ''} · ${lisibleAltitude(altitude)}`,
          };
        }
      } catch { /* repli Nominatim */ }
    }
    // Le zoom Nominatim suit l'echelon : on demande le PAYS quand on voit un
    // pays, la region quand on voit une region. Demander l'adresse a 500 km
    // etait la cause du nom de commune affiche depuis l'orbite.
    const z = ech.zoomOsm;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${z}&accept-language=fr`);
      const d = await r.json();
      const a = d?.address || {};
      // On prend le champ qui CORRESPOND a l'echelon vise, et on ne redescend
      // que s'il manque : sinon Nominatim renvoie la commune pour un cadrage
      // national et on retombe dans le travers corrige ici.
      const parEchelon = {
        pays: [a.country],
        region: [a.state, a.region, a.country],
        departement: [a.county, a.state, a.country],
        commune: [a.city, a.town, a.village, a.municipality, a.county],
        quartier: [a.neighbourhood, a.suburb, a.city_district, a.city, a.town, a.village],
      };
      const suite = parEchelon[ech.cle] || [a.city, a.town, a.village, a.country];
      const nom = suite.find(Boolean) || a.country || d?.name || '—';
      return {
        nom: String(nom).toUpperCase(),
        sous: ech.sous,
        meta: `${a.country || ''} · ${lisibleAltitude(altitude)}`.replace(/^ · /, ''),
      };
    } catch {
      // Hors ligne ou source muette : la base locale repond toujours quelque
      // chose plutot que de laisser la fenetre figee sur l'ancien lieu.
      const z = zoneMondiale(lat, lon);
      return { nom: z.nom.toUpperCase(), sous: 'APPROX.', meta: `${z.precision} · ${lisibleAltitude(altitude)} · source locale` };
    }
  }

  async function majCentre() {
    const c = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    const alt = c.height;
    const ech = echelleSelonAltitude(alt);

    // Vue de l'espace : on annonce le continent ou l'ocean, pas « ORBITE ».
    // C'est la reponse utile quand on regarde la Terre entiere — et elle est
    // locale, donc instantanee.
    if (ech.cle === 'espace') {
      const z = zoneMondiale(lat, lon);
      nomEl.textContent = z.nom.toUpperCase();
      sousEl.textContent = z.type === 'continent' ? 'CONTINENT' : z.type === 'mer' ? 'MER' : 'OCÉAN';
      metaEl.textContent = `${lisibleAltitude(alt)} · rapproche-toi pour voir les pays`;
      dernierEchelon = ech.cle;
      dernierCentre = { lat, lon };
      return;
    }

    // On reinterroge si la vue s'est deplacee OU si l'on a change d'echelon :
    // zoomer sans bouger doit faire passer de « France » a « Occitanie » puis
    // a « Frontignan », sinon le repere reste bloque sur l'echelle precedente.
    const memeEchelon = dernierEchelon === ech.cle;
    if (memeEchelon && dernierCentre
      && Math.hypot(lat - dernierCentre.lat, lon - dernierCentre.lon) * 111_000 < Math.max(250, alt * 0.12)) return;
    if (enCours) return;
    enCours = true;
    const info = await lieuCentral(lat, lon, alt);
    enCours = false;
    if (!info) return;
    dernierCentre = { lat, lon };
    dernierEchelon = ech.cle;
    nomEl.textContent = info.nom;
    sousEl.textContent = info.sous;
    metaEl.textContent = info.meta;
  }

  /** Étiquettes OSM autour de la vue (limitées et filtrées par distance). */
  async function majEtiquettes() {
    const c = viewer.camera.positionCartographic;
    const alt = c.height;
    if (alt > 12_000_000) { dsNoms.entities.removeAll(); return; }
    const lat = Cesium.Math.toDegrees(c.latitude);
    const lon = Cesium.Math.toDegrees(c.longitude);
    if (dernierPays && Math.hypot(lat - (dernierPays.lat ?? 0), lon - (dernierPays.lon ?? 0)) * 111_000 < 400 && alt < 12_000_000) return;
    const rayon = rayonSelonAltitude(alt);
    const els = await overpass(`(node(around:${Math.round(rayon)},${lat.toFixed(4)},${lon.toFixed(4)})[place~"${PLACE_RE}"][name];);out ${MAX_ETIQUETTES * 2};`);
    dernierPays = { lat, lon };
    dsNoms.entities.removeAll();
    for (const e of els) {
      const tags = e.tags || {};
      const rang = RANG_PAR_CLE.get(tags.place) || RANG_PAR_CLE.get('locality');
      if (!rang || !tags.name) continue;
      let population = Number(tags.population) || 0;
      if (!population && tags.place === 'city') population = 100_000;
      dsNoms.entities.add({
        position: Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 30),
        label: {
          text: tags.name.toUpperCase(),
          font: `${rang.gras ? 'bold ' : ''}${rang.police}px "JetBrains Mono", monospace`,
          fillColor: Cesium.Color.fromCssColorString(rang.couleur),
          outlineColor: Cesium.Color.fromCssColorString('#05080d'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: population > 50_000,
          backgroundColor: Cesium.Color.fromCssColorString('#05080d').withAlpha(0.55),
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, rang.max),
          scaleByDistance: new Cesium.NearFarScalar(2_000, 1, rang.max, 0.55),
        },
        properties: { wtNomLieu: tags.name, wtRang: tags.place },
      });
    }
    governorRequestRender('wt-noms-lieux');
  }

  const planifier = () => {
    if (timer) return;
    timer = window.setTimeout(() => {
      timer = null;
      majCentre();
      majEtiquettes();
    }, 2200);
  };
  viewer.camera.changed.addEventListener(planifier);
  planifier();

  return {
    majCentre,
    majEtiquettes,
    effacer: () => dsNoms.entities.removeAll(),
    fenetre: fen,
    visible: (v) => { fen.style.display = v ? '' : 'none'; dsNoms.show = Boolean(v); },
  };
}
