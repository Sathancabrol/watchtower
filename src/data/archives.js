/**
 * Archives temporelles — remonter le temps sur un lieu, gratuitement et sans clé.
 *
 * Trois fonds complémentaires, tous en licence ouverte :
 *   1. Internet Archive Wayback  — état passé d'une page web (caméras, sites de ports,
 *      arrêtés municipaux…), via l'API publique `archive.org/wayback/available`.
 *   2. NASA GIBS                 — image satellite mondiale À UNE DATE DONNÉE (depuis 2000).
 *   3. IGN « Remonter le temps » — photographies aériennes historiques de la France.
 *
 * Fonctions PURES uniquement : aucun appel réseau ici. Le réseau passe par
 * /api/wayback (proxy serveur) ou directement par les tuiles WMTS.
 *
 * @module data/archives
 */

/** Première date exploitable de MODIS Terra sur GIBS. */
export const GIBS_DEBUT = '2000-02-24';

/**
 * Formate une date en AAAA-MM-JJ (UTC), format attendu par GIBS et Wayback.
 * @param {Date|string|number} d - Date à formater.
 * @returns {string|null} Date ISO courte, ou null si invalide.
 */
export function formaterDateIso(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const a = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const j = String(date.getUTCDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

/**
 * Borne une date dans la plage réellement couverte par GIBS.
 * GIBS publie avec ~1 jour de retard : demander aujourd'hui renvoie des tuiles vides.
 * @param {Date|string|number} d - Date souhaitée.
 * @returns {string} Date ISO courte utilisable.
 */
export function bornerDateGibs(d) {
  const veille = new Date(Date.now() - 86_400_000);
  const iso = formaterDateIso(d) ?? formaterDateIso(veille);
  const max = formaterDateIso(veille);
  if (iso < GIBS_DEBUT) return GIBS_DEBUT;
  if (iso > max) return max;
  return iso;
}

/**
 * Construit l'URL de tuiles GIBS pour une date donnée.
 * @param {Date|string|number} date - Date souhaitée.
 * @param {string} [couche] - Identifiant de couche GIBS.
 * @returns {{url:string, date:string, credit:string, maximumLevel:number}}
 */
export function urlTuilesGibs(date, couche = 'MODIS_Terra_CorrectedReflectance_TrueColor') {
  const d = bornerDateGibs(date);
  return {
    date: d,
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${couche}/default/${d}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    credit: `NASA GIBS · ${couche.split('_')[0]} · ${d}`,
    maximumLevel: 9,
  };
}

/**
 * Construit l'URL de l'API Wayback pour connaître l'archive la plus proche d'une date.
 * @param {string} cible - URL à rechercher.
 * @param {Date|string|number} [date] - Date approchée souhaitée.
 * @returns {string|null} URL d'interrogation, ou null si la cible est inexploitable.
 */
export function urlRequeteWayback(cible, date) {
  const propre = String(cible ?? '').trim();
  if (!propre || !/^https?:\/\//i.test(propre)) return null;
  const p = new URLSearchParams({ url: propre });
  const iso = date === undefined ? null : formaterDateIso(date);
  if (iso) p.set('timestamp', iso.replace(/-/g, ''));
  return `https://archive.org/wayback/available?${p.toString()}`;
}

/**
 * Normalise une réponse de l'API Wayback.
 * @param {any} charge - Corps JSON déjà analysé.
 * @returns {{disponible:boolean, url:string|null, horodatage:string|null, annee:number|null}}
 */
export function normaliserWayback(charge) {
  const vide = { disponible: false, url: null, horodatage: null, annee: null };
  const inst = charge?.archived_snapshots?.closest;
  if (!inst || typeof inst !== 'object') return vide;
  const dispo = inst.available === true || inst.available === 'true';
  const url = typeof inst.url === 'string' && inst.url ? inst.url : null;
  if (!dispo || !url) return vide;
  const ts = typeof inst.timestamp === 'string' ? inst.timestamp : null;
  const annee = ts && /^\d{4}/.test(ts) ? Number.parseInt(ts.slice(0, 4), 10) : null;
  return { disponible: true, url: url.replace(/^http:/, 'https:'), horodatage: ts, annee };
}

/**
 * Décrit en français une archive trouvée, pour l'affichage direct dans le HUD.
 * @param {{disponible:boolean, annee:number|null}} a - Archive normalisée.
 * @returns {string} Phrase prête à afficher.
 */
export function decrireArchive(a) {
  if (!a?.disponible) return 'Aucune archive web trouvée pour ce lien.';
  return a.annee
    ? `Archive web disponible (version de ${a.annee}).`
    : 'Archive web disponible.';
}

/**
 * Propose une échelle de dates pour un curseur temporel.
 * @param {number} [annees] - Profondeur en années.
 * @returns {Array<{libelle:string, date:string}>} Repères du plus ancien au plus récent.
 */
export function echelleTemporelle(annees = 25) {
  const n = Number.isFinite(annees) && annees > 0 ? Math.min(Math.trunc(annees), 30) : 25;
  const maintenant = new Date();
  const out = [];
  for (let i = n; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(maintenant.getUTCFullYear() - i, maintenant.getUTCMonth(), maintenant.getUTCDate()));
    const iso = bornerDateGibs(d);
    out.push({ libelle: i === 0 ? "aujourd'hui" : `il y a ${i} an${i > 1 ? 's' : ''}`, date: iso });
  }
  return out;
}
