/**
 * WATCHTOWER — TRAÇABILITÉ & REGISTRE DES SOURCES.
 *
 * Deux objets, une seule idée : **toute donnée affichée doit pouvoir être
 * remontée jusqu'à sa source, en un clic.**
 *
 *  1 · `SOURCES` — le registre unique de toutes les sources utilisées par
 *    l'application (nom, URL, licence, nature des données). Les fiches, l'INTEL
 *    et les couches piochent dedans : un jeu de données qui n'est pas dans ce
 *    registre ne doit pas être affiché.
 *
 *  2 · Le JOURNAL LOCAL (`localStorage`) — chaque consultation de fiche, chaque
 *    relevé peut être tracé : qui, quand, où, depuis quelle source. Exportable
 *    en CSV. Aucune donnée ne quitte le navigateur : c'est un carnet de bord
 *    personnel, utile pour prouver « j'ai vérifié telle information, à telle
 *    heure, sur tel site officiel ».
 *
 * Aucune clé, aucun appel réseau ici.
 */

/** Clés localStorage. */
export const CLE_JOURNAL = 'watchtower.tracabilite.v1';
export const MAX_TRACES = 500;

/**
 * Registre des sources. `cle` est l'identifiant utilisé dans le code,
 * `donnees` décrit ce qu'on y prend réellement.
 */
export const SOURCES = Object.freeze([
  // ——— cartes, bâti, adresses ———
  { cle: 'osm', nom: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', licence: 'ODbL 1.0', donnees: 'entités, bâti, voirie, tags (Overpass)', nature: 'base collaborative' },
  { cle: 'overpass', nom: 'Overpass API', url: 'https://overpass-api.de/', licence: 'ODbL 1.0', donnees: 'requêtes OpenStreetMap en direct', nature: 'base collaborative' },
  { cle: 'nominatim', nom: 'Nominatim', url: 'https://nominatim.openstreetmap.org/', licence: 'ODbL 1.0', donnees: 'géocodage / adresse du point', nature: 'base collaborative' },
  { cle: 'ban', nom: 'Base Adresse Nationale', url: 'https://adresse.data.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'adresses officielles', nature: 'donnée publique' },
  { cle: 'apicarto', nom: 'Apicarto (cadastre)', url: 'https://apicarto.ign.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'parcelles cadastrales', nature: 'donnée publique' },
  { cle: 'geoapigouv', nom: 'API Géo — communes', url: 'https://geo.api.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'commune, code INSEE, population', nature: 'donnée publique' },
  { cle: 'ign', nom: 'IGN — Géoportail', url: 'https://www.geoportail.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'orthophotos, cadastre, courbes', nature: 'donnée publique' },
  { cle: 'panoramax', nom: 'Panoramax (vue de rue)', url: 'https://panoramax.ign.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'photos de rue libres', nature: 'base collaborative' },

  // ——— entreprises, économie ———
  { cle: 'entreprises', nom: 'Annuaire des entreprises (DINUM/INSEE)', url: 'https://annuaire-entreprises.data.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'SIREN, SIRET, NAF, effectif, dirigeants', nature: 'donnée publique' },
  { cle: 'api_entreprise', nom: 'API Entreprise (DGFIP)', url: 'https://entreprise.api.gouv.fr/', licence: 'Licence Ouverte (jeton requis)', donnees: 'comptes annuels, CA, résultat', nature: 'donnée publique' },
  { cle: 'pappers', nom: 'Pappers', url: 'https://www.pappers.fr/', licence: 'API ouverte (jeton)', donnees: 'comptes annuels, bénéficiaires, dirigeants', nature: 'donnée publique' },
  { cle: 'bodacc', nom: 'BODACC', url: 'https://www.bodacc.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'annonces légales, procédures', nature: 'donnée publique' },
  { cle: 'insee', nom: 'INSEE', url: 'https://www.insee.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'dossiers communaux, population, entreprises', nature: 'statistique publique' },
  { cle: 'datagouv', nom: 'data.gouv.fr', url: 'https://www.data.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'jeux de données ouverts', nature: 'portail public' },

  // ——— risques & environnement ———
  { cle: 'georisques', nom: 'Géorisques (MTE)', url: 'https://www.georisques.gouv.fr/', licence: 'Licence Ouverte / Etalab', donnees: 'ICPE, SIS, cavités, radon, argiles, séismes, CatNat', nature: 'donnée publique' },
  { cle: 'usgs', nom: 'USGS — séismes', url: 'https://earthquake.usgs.gov/', licence: 'Domaine public (US Gov)', donnees: 'séismes en temps réel', nature: 'mesure publique' },
  { cle: 'nasa_eonet', nom: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov/', licence: 'Domaine public (NASA)', donnees: 'feux, tempêtes, événements naturels', nature: 'observation satellite' },
  { cle: 'nasa_firms', nom: 'NASA FIRMS (feux)', url: 'https://firms.modaps.eosdis.nasa.gov/', licence: 'Domaine public (NASA)', donnees: 'points de chaleur / feux actifs', nature: 'observation satellite' },
  { cle: 'copernicus', nom: 'Copernicus / EMS', url: 'https://emergency.copernicus.eu/', licence: 'CC BY 4.0 (UE)', donnees: 'cartes d’urgence, inondations, séismes', nature: 'observation satellite' },

  // ——— météo, ciel, mobilité ———
  { cle: 'open_meteo', nom: 'Open-Meteo', url: 'https://open-meteo.com/', licence: 'CC BY 4.0', donnees: 'température, vent, humidité, visibilité', nature: 'modèle météo ouvert' },
  { cle: 'radio_browser', nom: 'Radio-Browser', url: 'https://www.radio-browser.info/', licence: 'Base communautaire ouverte', donnees: 'stations de radio géolocalisées', nature: 'base collaborative' },
  { cle: 'osrm', nom: 'OSRM (itinéraires)', url: 'https://project-osrm.org/', licence: 'BSD / ODbL', donnees: 'trajets routiers et cyclables', nature: 'calcul ouvert' },
  { cle: 'opensky', nom: 'OpenSky Network', url: 'https://opensky-network.org/', licence: 'ODbL / CC', donnees: 'trafic aérien ADS-B', nature: 'base collaborative' },
  { cle: 'ais', nom: 'AIS — navires', url: 'https://www.aisstream.io/', licence: 'Flux ouvert', donnees: 'positions de navires', nature: 'base collaborative' },
  { cle: 'jpl', nom: 'JPL Horizons (NASA)', url: 'https://ssd.jpl.nasa.gov/horizons/', licence: 'Domaine public (NASA)', donnees: 'éphémérides du système solaire', nature: 'éphémérides' },

  // ——— veille presse ———
  { cle: 'gdelt', nom: 'GDELT (presse mondiale)', url: 'https://gdeltproject.org/', licence: 'Flux ouvert (GDELT)', donnees: 'articles de presse indexés en continu', nature: 'veille presse' },

  // ——— encyclopédies ———
  { cle: 'wikidata', nom: 'Wikidata', url: 'https://www.wikidata.org/', licence: 'CC0', donnees: 'propriétaire, effectif, CA, maison mère', nature: 'base collaborative' },
  { cle: 'wikipedia', nom: 'Wikipédia', url: 'https://fr.wikipedia.org/', licence: 'CC BY-SA', donnees: 'résumé, illustration', nature: 'base collaborative' },
  { cle: 'commons', nom: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/', licence: 'CC / domaine public', donnees: 'photos libres du lieu', nature: 'base collaborative' },
]);

/** Source du registre par clé. */
export function sourceDe(cle) {
  return SOURCES.find((s) => s.cle === cle) || null;
}

/** Vrai si la clé existe dans le registre (garde-fou d'affichage). */
export function sourceConnue(cle) {
  return Boolean(sourceDe(cle));
}

/** Échappe le HTML des textes venant du registre. */
export function echapper(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Fabrique le HTML des pastilles « source » cliquables.
 * @param {string[]} cles clés du registre
 * @param {{vide?:string}} [options]
 */
export function htmlSources(cles = [], options = {}) {
  const liste = (cles || []).map(sourceDe).filter(Boolean);
  if (!liste.length) return options.vide || '';
  return liste.map((s) => `<a class="src-chip" href="${echapper(s.url)}" target="_blank" rel="noopener"
      title="${echapper(`${s.licence} — ${s.donnees}`)}">${echapper(s.nom)} ↗</a>`).join('');
}

/** Liens « document à télécharger / vérifier » pour un point donné. */
export function liensVerification(lat, lon, commune = '') {
  const p = `${lon},${lat}`;
  return [
    { nom: '📄 Rapport Géorisques (PDF du risque)', cle: 'georisques', url: `https://www.georisques.gouv.fr/dossiers/etude-risques?latlon=${p}` },
    { nom: '🗺 Cadastre IGN — parcelle', cle: 'ign', url: `https://www.geoportail.gouv.fr/carte?c=${p}&z=19&l0=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)&permalink=yes` },
    { nom: '🏢 Annuaire des entreprises', cle: 'entreprises', url: 'https://annuaire-entreprises.data.gouv.fr/' },
    { nom: '📊 INSEE — dossier communal', cle: 'insee', url: commune ? `https://www.insee.fr/fr/statistiques/2011101?geo=COM-${commune}` : 'https://www.insee.fr/fr/statistiques/2011101' },
    { nom: '📚 data.gouv.fr — jeux de données', cle: 'datagouv', url: 'https://www.data.gouv.fr/fr/search/?q=urbanisme' },
  ].filter((l) => sourceConnue(l.cle));
}

// ───────────────────────── JOURNAL LOCAL ─────────────────────────

function lire() {
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE_JOURNAL) || '[]');
    return Array.isArray(brut) ? brut : [];
  } catch { return []; }
}

function ecrire(traces) {
  try { window.localStorage.setItem(CLE_JOURNAL, JSON.stringify(traces.slice(-MAX_TRACES))); } catch { /* plein */ }
}

const jalon = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR')}`;
};

/**
 * Ajoute une entrée au journal de traçabilité.
 * @param {{lat?:number, lon?:number, nom?:string, fonction?:string, sources?:string[], note?:string, quand?:number}} entree
 * @returns {object|null} la trace enregistrée (null si hors navigateur)
 */
export function ajouterTrace(entree = {}) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const t = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    quand: Number(entree.quand) || Date.now(),
    lat: Number.isFinite(entree.lat) ? entree.lat : null,
    lon: Number.isFinite(entree.lon) ? entree.lon : null,
    nom: String(entree.nom || '').slice(0, 160),
    fonction: String(entree.fonction || '').slice(0, 80),
    sources: Array.isArray(entree.sources) ? entree.sources.filter(sourceConnue) : [],
    note: String(entree.note || '').slice(0, 400),
  };
  const traces = lire();
  traces.push(t);
  ecrire(traces);
  return t;
}

/** Toutes les traces, de la plus ancienne à la plus récente. */
export function lireTraces() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  return lire();
}

/** Vide le journal. */
export function effacerTraces() {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  const n = lire().length;
  try { window.localStorage.removeItem(CLE_JOURNAL); } catch { /* ok */ }
  return n;
}

/** Une ligne lisible pour le journal. */
export function formaterTrace(t) {
  return `[${jalon(t.quand)}] ${t.nom || 'point sans nom'}${t.fonction ? ` (${t.fonction})` : ''}`
    + `${Number.isFinite(t.lat) ? ` — ${t.lat.toFixed(5)}, ${t.lon.toFixed(5)}` : ''}`
    + `${t.sources?.length ? ` — sources : ${t.sources.join(', ')}` : ''}`
    + `${t.note ? ` — ${t.note}` : ''}`;
}

/** Export CSV du journal (ouvrable dans un tableur, preuve d'antériorité). */
export function exportCsv(traces = lireTraces()) {
  const entetes = ['date', 'heure', 'nom', 'fonction', 'lat', 'lon', 'sources', 'note'];
  const cellule = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lignes = [entetes.join(';')];
  for (const t of traces) {
    const d = new Date(t.quand);
    lignes.push([
      cellule(d.toLocaleDateString('fr-FR')),
      cellule(d.toLocaleTimeString('fr-FR')),
      cellule(t.nom),
      cellule(t.fonction),
      cellule(Number.isFinite(t.lat) ? t.lat.toFixed(6) : ''),
      cellule(Number.isFinite(t.lon) ? t.lon.toFixed(6) : ''),
      cellule((t.sources || []).join(' ')),
      cellule(t.note),
    ].join(';'));
  }
  return lignes.join('\n');
}
