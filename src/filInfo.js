/**
 * WATCHTOWER — FIL D'INFORMATION (bandeaux « news » de l'INTEL).
 *
 * Chaque vue de l'INTEL (CONTEXTE, COMMUNAL, POLITIQUE, ÉCONOMIQUE,
 * PRODUCTION…) porte son PROPRE mini-bandeau défilant, façon Bloomberg :
 * une ligne, des dépêches courtes, chacune cliquable, chacune datée, chacune
 * rattachée à sa source. Rien n'est inventé : une dépêche sans source n'est
 * pas affichée.
 *
 * Sources — toutes gratuites, sans clé :
 *  · **GDELT** (presse mondiale, flux JSON) — actualité de la commune ;
 *  · **USGS** — séismes des dernières 24 h (domaine public) ;
 *  · **Open-Meteo** — conditions au point (CC BY 4.0) ;
 *  · **Géorisques** — installations classées / risques autour du point ;
 *  · **recherche-entreprises (DINUM/INSEE)** — entreprises autour d'un point
 *    (`/near_point`, sans clé, rayon ≤ 50 km) ;
 *  · **Radio-Browser** — stations locales ;
 *  · **Wikidata / INSEE** — identité de la commune.
 *
 * Les fonctions de mise en forme sont pures et testables ; seules les
 * fonctions `async` vont sur le réseau, et chacune dégrade proprement.
 */

import { sourceConnue } from './tracabilite.js';

/** Catégories de l'INTEL qui ont un bandeau. */
export const CATEGORIES_FIL = Object.freeze([
  'contexte', 'jumeau', 'communal', 'individuel', 'politique', 'economique', 'production', 'profil',
]);

/** URL du flux presse GDELT (gratuit, sans clé). */
export function urlGdelt(terme, { heures = 3, max = 6 } = {}) {
  const q = encodeURIComponent(`"${String(terme || '').slice(0, 80)}" sourcelang:fra`);
  const span = heures >= 24 ? `${Math.round(heures / 24)}d` : `${Math.max(1, Math.round(heures))}h`;
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=${Math.max(1, max)}&timespan=${span}&format=json`;
}

/** URL des séismes USGS (24 h, monde). */
export function urlSeismes() {
  return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
}

/** URL météo du point (Open-Meteo, CC BY 4.0). */
export function urlMeteo(lat, lon) {
  const p = new URLSearchParams({
    latitude: Number(lat).toFixed(3),
    longitude: Number(lon).toFixed(3),
    current: 'temperature_2m,wind_speed_10m,precipitation,weather_code,relative_humidity_2m',
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

/** URL des entreprises AUTOUR D'UN POINT (API de l'État, sans clé). */
export function urlEntreprisesProches(lat, lon, rayonKm = 2, page = 1) {
  const p = new URLSearchParams({
    lat: Number(lat).toFixed(5),
    long: Number(lon).toFixed(5),
    radius: String(Math.max(0.1, Math.min(50, Number(rayonKm) || 2))),
    page: String(Math.max(1, Math.round(page))),
    per_page: '10',
  });
  return `https://recherche-entreprises.api.gouv.fr/near_point?${p}`;
}

/** Distance orthodromique (m). */
export function distanceM(a, b) {
  const R = 6371000; const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Normalise une dépêche. `sourceCle` doit exister dans le registre de
 * `tracabilite.js` — sinon la dépêche est REFUSÉE : une information sans
 * source vérifiable n'est pas affichée.
 */
export function depeche({ categorie = 'contexte', ic = '•', titre = '', detail = '', url = '', sourceCle = '', quand = null, gravite = 0 } = {}) {
  if (!titre || !sourceConnue(sourceCle)) return null;
  return {
    categorie, ic, titre: String(titre).slice(0, 160), detail: String(detail || '').slice(0, 240),
    url: /^https?:\/\//.test(url) ? url : '',
    sourceCle, quand: Number(quand) || Date.now(), gravite: Number(gravite) || 0,
  };
}

/** Dédoublonne (même titre) et trie par gravité puis fraîcheur. */
export function trierDepeches(liste = [], limite = 12) {
  const vus = new Set();
  return liste
    .filter((d) => d && d.titre)
    .filter((d) => {
      const k = d.titre.toLowerCase().replace(/\s+/g, ' ').trim();
      if (vus.has(k)) return false;
      vus.add(k);
      return true;
    })
    .sort((a, b) => (b.gravite - a.gravite) || (b.quand - a.quand))
    .slice(0, Math.max(1, limite));
}

/** Garde les dépêches d'une catégorie (le bandeau « contexte » prend tout). */
export function filtrerParCategorie(liste = [], categorie = '') {
  if (!categorie || categorie === 'contexte') return liste;
  return liste.filter((d) => d.categorie === categorie);
}

/** Texte du bandeau défilant : « ic titre — détail · ic titre… ». */
export function tickerTexte(liste = [], separateur = '  ✦  ') {
  return liste.map((d) => `${d.ic} ${d.titre}${d.detail ? ` — ${d.detail}` : ''}`).join(separateur);
}

/** HTML du bandeau (chaque dépêche est un lien quand elle a une URL). */
export function tickerHtml(liste = []) {
  if (!liste.length) return '<span class="fi-vide">Aucune dépêche — sources injoignables ou zone sans donnée.</span>';
  return liste.map((d) => {
    const txt = `${d.ic} ${d.titre}${d.detail ? ` <i>${d.detail}</i>` : ''}`;
    return d.url
      ? `<a href="${d.url}" target="_blank" rel="noopener">${txt}</a>`
      : `<span>${txt}</span>`;
  }).join('');
}

// ───────────────────────── collecte (réseau) ─────────────────────────

async function jsonOuNull(url, delai = 8000) {
  try {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    clearTimeout(minuteur);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/** Dépêches « presse » (GDELT) pour la commune observée. */
export async function filPresse(commune = '', categorie = 'contexte') {
  if (!commune) return [];
  const brut = await jsonOuNull(urlGdelt(commune, { heures: 72, max: 8 }), 9000);
  const arts = Array.isArray(brut?.articles) ? brut.articles : [];
  return arts.map((a) => depeche({
    categorie, ic: '📰',
    titre: a.title || '',
    detail: a.domain || '',
    url: a.url || '',
    sourceCle: 'gdelt',
    quand: a.seendate ? Date.parse(String(a.seendate).replace(/^(\d{4})(\d{2})(\d{2}).*$/, '$1-$2-$3')) : Date.now(),
  })).filter(Boolean);
}

/** Dépêches séismes (USGS) dans un rayon du point observé. */
export async function filSeismes(lat, lon, rayonKm = 800) {
  const brut = await jsonOuNull(urlSeismes(), 9000);
  const feats = Array.isArray(brut?.features) ? brut.features : [];
  return feats.map((f) => {
    const c = f?.geometry?.coordinates || [];
    const [lon2, lat2, prof] = c;
    if (!Number.isFinite(lat2) || !Number.isFinite(lon2)) return null;
    const d = distanceM({ lat, lon }, { lat: lat2, lon: lon2 }) / 1000;
    if (d > rayonKm) return null;
    const mag = Number(f?.properties?.mag) || 0;
    return depeche({
      categorie: 'production', ic: '🌍',
      titre: `Séisme M${mag.toFixed(1)} à ${Math.round(d)} km`,
      detail: `${f.properties?.place || ''} · ${Math.round(Number(prof) || 0)} km de profondeur`,
      url: f.properties?.url || '',
      sourceCle: 'usgs',
      quand: Number(f.properties?.time) || Date.now(),
      gravite: mag >= 4.5 ? 3 : mag >= 3 ? 2 : 1,
    });
  }).filter(Boolean);
}

/** Dépêche météo du point (Open-Meteo). */
export async function filMeteo(lat, lon) {
  const brut = await jsonOuNull(urlMeteo(lat, lon), 8000);
  const c = brut?.current;
  if (!c) return [];
  const d = depeche({
    categorie: 'contexte', ic: '🌤',
    titre: `${Math.round(c.temperature_2m)}°C · vent ${Math.round(c.wind_speed_10m)} km/h`,
    detail: `humidité ${c.relative_humidity_2m}% · précipitations ${c.precipitation ?? 0} mm`,
    url: 'https://open-meteo.com/',
    sourceCle: 'open_meteo',
    gravite: (c.wind_speed_10m > 60 ? 2 : 0),
  });
  return d ? [d] : [];
}

/** Dépêches « économie » : les entreprises autour du point. */
export async function filEconomie(lat, lon, rayonKm = 2) {
  const brut = await jsonOuNull(urlEntreprisesProches(lat, lon, rayonKm), 9000);
  const res = Array.isArray(brut?.results) ? brut.results : [];
  return res.slice(0, 6).map((r) => depeche({
    categorie: 'economique', ic: '🏢',
    titre: r.nom_complet || r.siren || 'Entreprise',
    detail: [
      r.libelle_activite_principale || r.activite_principale || '',
      r.tranche_effectif_salarie ? tranche(r.tranche_effectif_salarie) : '',
      r.matching_etablissements?.length ? `${r.matching_etablissements.length} établissement(s) ici` : '',
    ].filter(Boolean).join(' · '),
    url: r.siren ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${r.siren}` : '',
    sourceCle: 'entreprises',
    gravite: 1,
  })).filter(Boolean);
}

const TRANCHES = {
  '00': '0 salarié', '01': '1-2', '02': '3-5', '03': '6-9', '11': '10-19',
  '12': '20-49', '21': '50-99', '22': '100-199', '31': '200-249',
  '32': '250-499', '41': '500-999', '42': '1000-1999', '51': '2000-4999',
  '52': '5000-9999', '53': '10000+',
};
const tranche = (code) => TRANCHES[String(code)] ? `${TRANCHES[String(code)]} salariés` : '';

/**
 * Rassemble le fil complet pour le point observé.
 * @param {{lat:number, lon:number, commune?:string}} ctx
 * @returns {Promise<{depeches:Array, sources:string[]}>}
 */
export async function filComplet(ctx = {}) {
  const { lat, lon, commune = '' } = ctx;
  const sure = Number.isFinite(lat) && Number.isFinite(lon);
  const demandes = [
    filPresse(commune, 'contexte'),
    filPresse(commune, 'politique'),
    sure ? filMeteo(lat, lon) : Promise.resolve([]),
    sure ? filSeismes(lat, lon) : Promise.resolve([]),
    sure ? filEconomie(lat, lon) : Promise.resolve([]),
  ];
  const groupes = await Promise.all(demandes);
  const depeches = trierDepeches(groupes.flat(), 16);
  const sources = [...new Set(depeches.map((d) => d.sourceCle))];
  return { depeches, sources };
}
