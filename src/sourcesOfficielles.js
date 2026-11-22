/**
 * WATCHTOWER — SOURCES OFFICIELLES EN LIGNE (partie pure : URL + lecture).
 *
 * Les six sources publiques repérées lors de l'audit du 07/10/2026 et restées
 * « identifiées » : elles ne sont pas encore appelées par l'application. Ce
 * module les rend utilisables — la construction d'URL et la lecture des
 * réponses sont PURES et testables, seuls les appels réseau vivent dans la vue.
 *
 *   · GPU / API Carto  → le zonage du PLU qui s'applique à un point précis ;
 *   · Cadastre         → la parcelle sous le point (et non « une » parcelle) ;
 *   · DVF              → les prix réellement signés dans la commune (€/m²) ;
 *   · BOAMP            → les avis de marchés publics en cours ;
 *   · DECP             → les marchés déjà attribués (montant, titulaire) ;
 *   · Nature (INPN)    → Natura 2000 et ZNIEFF sous le point ;
 *   · API Géo          → la commune du point (nom, code INSEE, population).
 *
 * Règle tenue partout : une réponse inattendue ne fait pas planter la vue — on
 * renvoie `null` ou une liste vide, et l'appelant DIT ce qui manque.
 *
 * ⚠️ Vérification : ces six points d'entrée proviennent de la documentation
 * publique de leurs producteurs. Ils n'ont PAS pu être appelés en direct depuis
 * l'atelier de développement (réseau sortant restreint, 07/10/2026) : le champ
 * `verifieEnLigne` vaut donc `false` pour chacun. La vue affiche ce statut et,
 * en cas d'échec, renvoie vers le lien officiel au lieu d'inventer une réponse.
 */

/** Les sources, avec leur documentation et leur état de vérification. */
export const SOURCES_OFFICIELLES = Object.freeze([
  {
    cle: 'urbanisme',
    nom: 'API Carto — zonage d’urbanisme (GPU)',
    producteur: 'IGN / Géoportail de l’urbanisme',
    doc: 'https://apicarto.ign.fr/api/doc/gpu',
    licence: 'Licence Ouverte / Etalab 2.0',
    format: 'GeoJSON',
    donnees: 'Zone d’urbanisme (PLU/PLUi), prescriptions et informations opposables à un point',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'cadastre',
    nom: 'API Carto — cadastre',
    producteur: 'IGN / DGFiP',
    doc: 'https://apicarto.ign.fr/api/doc/cadastre',
    licence: 'Licence Ouverte / Etalab 2.0',
    format: 'GeoJSON',
    donnees: 'Parcelle cadastrale (contenance, section, numéro, feuille) sous un point',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'dvf',
    nom: 'DVF — Demandes de valeurs foncières (geo-dvf)',
    producteur: 'Etalab / DGFiP / Cerema',
    doc: 'https://files.data.gouv.fr/geo-dvf/latest/csv/',
    licence: 'Licence Ouverte / Etalab 2.0',
    format: 'CSV',
    donnees: 'Transactions immobilières signées : date, prix, type de bien, surface, pièces',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'boamp',
    nom: 'BOAMP — avis de marchés publics',
    producteur: 'DILA / Premier ministre',
    doc: 'https://www.data.gouv.fr/dataservices/api-bulletin-officiel-des-annonces-des-marches-publics-boamp',
    licence: 'Licence Ouverte 2.0',
    format: 'JSON (Opendatasoft v2.0)',
    donnees: 'Avis d’appel public à la concurrence et avis d’attribution en cours dans un département',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'decp',
    nom: 'DECP — marchés attribués',
    producteur: 'AIFE / Ministère de l’Économie',
    doc: 'https://www.data.gouv.fr/datasets/api-decp',
    licence: 'Licence Ouverte 2.0',
    format: 'JSON (Opendatasoft v2.0)',
    donnees: 'Marchés attribués : objet, montant, titulaire, durée, date de publication',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'nature',
    nom: 'API Carto — nature (INPN)',
    producteur: 'IGN / INPN (MNHN)',
    doc: 'https://apicarto.ign.fr/api/doc/nature',
    licence: 'Licence Ouverte / Etalab 2.0',
    format: 'GeoJSON',
    donnees: 'Natura 2000 (ZPS, ZSC), ZNIEFF de type 1 et 2, réserves, PNR sous un point',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
  {
    cle: 'commune',
    nom: 'API Géo — commune d’un point',
    producteur: 'DINUM / Etalab',
    doc: 'https://geo.api.gouv.fr/decoupage-administratif',
    licence: 'Licence Ouverte / Etalab 2.0',
    format: 'JSON',
    donnees: 'Nom, code INSEE, codes postaux, population municipale de la commune du point',
    verifieEnLigne: false,
    verifieLe: '2026-10-07',
  },
]);

/** La fiche d'une source (ou null — on ne fabrique pas de source inconnue). */
export function sourceOfficielle(cle) {
  return SOURCES_OFFICIELLES.find((s) => s.cle === String(cle || '')) || null;
}

/** Le point GeoJSON encodé pour l'API Carto (ordre officiel : longitude, latitude). */
export function geomPoint(lon, lat) {
  const x = nombreOuNull(lon);
  const y = nombreOuNull(lat);
  if (x === null || y === null) return null;
  return encodeURIComponent(JSON.stringify({ type: 'Point', coordinates: [x, y] }));
}

// ───────────────────────── URL ─────────────────────────

/** Zonage d'urbanisme (et prescriptions/informations) qui s'appliquent au point. */
export function urlZonage(lon, lat) {
  const geom = geomPoint(lon, lat);
  return geom ? `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${geom}` : null;
}

/** Prescriptions surfaciques (emplacements réservés, risques, boisements…) au point. */
export function urlPrescriptions(lon, lat) {
  const geom = geomPoint(lon, lat);
  return geom ? `https://apicarto.ign.fr/api/gpu/prescription-surf?geom=${geom}` : null;
}

/** Parcelle cadastrale sous le point. */
export function urlCadastre(lon, lat) {
  const geom = geomPoint(lon, lat);
  return geom ? `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${geom}` : null;
}

/** Zones naturelles (Natura 2000, ZNIEFF) sous le point. */
export function urlNature(lon, lat) {
  const geom = geomPoint(lon, lat);
  if (!geom) return null;
  const q = new URLSearchParams({ geom: decodeURIComponent(geom) });
  return `https://apicarto.ign.fr/api/nature?${q.toString()}`;
}

/** Commune d'un point (nom, code INSEE, population). */
export function urlCommunePoint(lon, lat) {
  const x = nombreOuNull(lon);
  const y = nombreOuNull(lat);
  if (x === null || y === null) return null;
  const q = new URLSearchParams({ lat: String(y), lon: String(x), fields: 'nom,code,codesPostaux,population' });
  return `https://geo.api.gouv.fr/communes?${q.toString()}`;
}

/** Fichier DVF d'une commune (toutes les transactions publiées). */
export function urlDvfCommune(codeInsee) {
  const code = String(codeInsee || '').trim().toUpperCase();
  if (!/^[0-9]{5}$|^2[AB][0-9]{3}$/.test(code)) return null;
  const departement = code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2);
  return `https://files.data.gouv.fr/geo-dvf/latest/csv/${departement}/communes/${code}.csv`;
}

/** Avis de marchés publics (BOAMP) — recherche plein texte, ordre antéchronologique. */
export function urlBoamp(texte, { limite = 10, departement = null } = {}) {
  const t = String(texte || '').trim();
  if (t.length < 3) return null;
  const clauses = [`search("${t.replace(/"/g, ' ')}")`];
  if (departement) clauses.push(`code_departement="${String(departement).replace(/\D/g, '')}"`);
  const q = new URLSearchParams({
    where: clauses.join(' and '),
    limit: String(Math.max(1, Math.min(50, Number(limite) || 10))),
    order_by: 'dateparution desc',
  });
  return `https://boamp-datadila.opendatasoft.com/api/explore/v2.0/catalog/datasets/boamp/records?${q.toString()}`;
}

/** Marchés attribués (DECP) — le jeu change d'année en année : `jeu` est un paramètre. */
export function urlDecp(texte, { limite = 10, jeu = 'decp-2022-marches-valides' } = {}) {
  const t = String(texte || '').trim();
  if (t.length < 3) return null;
  const q = new URLSearchParams({
    where: `search("${t.replace(/"/g, ' ')}")`,
    limit: String(Math.max(1, Math.min(50, Number(limite) || 10))),
  });
  return `https://data.economie.gouv.fr/api/explore/v2.0/catalog/datasets/${jeu}/records?${q.toString()}`;
}

// ───────────────────────── lecture des réponses ─────────────────────────

const texte = (v) => (v === null || v === undefined ? '' : String(v).trim());

/**
 * Un nombre, ou `null` — JAMAIS zéro par accident.
 * `Number(null)`, `Number('')` et `Number(' ')` valent tous `0` : sans ce
 * garde-fou, une valeur non publiée s'afficherait comme un vrai zéro
 * (contenance 0 m², montant 0 €). C'est le genre d'erreur qui coûte cher.
 */
export function nombreOuNull(v) {
  if (v === null || v === undefined || typeof v === 'boolean') return null;
  const s = String(v).replace(/\s|\u00a0|\u202f/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const entier = nombreOuNull;

/** Les entités d'une FeatureCollection GeoJSON (tolérant à tout le reste). */
export function entitesGeoJson(brut) {
  if (!brut || typeof brut !== 'object') return [];
  if (Array.isArray(brut.features)) return brut.features;
  if (Array.isArray(brut)) return brut;
  return [];
}

/**
 * Le zonage d'urbanisme : une zone = un libellé, un type, et le règlement en PDF.
 * L'API renvoie plusieurs entités quand le point est à cheval (partition, Secteur).
 */
export function lireZonage(brut) {
  const zones = entitesGeoJson(brut).map((f) => {
    const p = (f && f.properties) || {};
    return {
      libelle: texte(p.libelle || p.libelong || p.typezone) || 'zone sans libellé',
      type: texte(p.typezone) || null,
      partition: texte(p.partition) || null,
      destination: texte(p.destdomi) || null,
      approuve: texte(p.datappro) || null,
      reglement: texte(p.urlfic) || null,
      document: texte(p.nomfic) || null,
    };
  });
  const uniques = [];
  const vues = new Set();
  for (const z of zones) {
    const cle = z.libelle + '|' + (z.partition || '');
    if (vues.has(cle)) continue;
    vues.add(cle);
    uniques.push(z);
  }
  return { zones: uniques, nombre: uniques.length, vide: uniques.length === 0 };
}

/** Les prescriptions surfaciques (emplacements réservés, risques, continuités…). */
export function lirePrescriptions(brut) {
  return entitesGeoJson(brut).map((f) => {
    const p = (f && f.properties) || {};
    return {
      libelle: texte(p.libelle || p.txt) || 'prescription sans libellé',
      type: texte(p.typepsc) || null,
      categorie: texte(p.catpsc) || null,
      reglement: texte(p.urlfic) || null,
    };
  });
}

/** La ou les parcelles cadastrales sous le point. */
export function lireParcelles(brut) {
  return entitesGeoJson(brut).map((f) => {
    const p = (f && f.properties) || {};
    const contenance = entier(p.contenance);
    return {
      section: texte(p.section) || null,
      numero: texte(p.numero) || null,
      prefixe: texte(p.prefixe) || null,
      contenance,
      contenanceHa: contenance === null ? null : Math.round((contenance / 10000) * 1000) / 1000,
      commune: texte(p.nom_com) || texte(p.commune) || null,
      codeInsee: texte(p.code_insee) || texte(p.code_dep) || null,
      feuille: texte(p.feuille) || null,
      identifiant: texte(p.idu) || null,
    };
  });
}

/** Natura 2000, ZNIEFF, réserves : ce qui protège le point, tel que l'INPN le publie. */
export function lireNature(brut) {
  return entitesGeoJson(brut).map((f) => {
    const p = (f && f.properties) || {};
    const type = texte(p.type) || texte(p.typename) || texte(p.programme) || 'zonage naturel';
    return {
      nom: texte(p.nom) || texte(p.nom_site) || texte(p.libelle) || 'site sans nom',
      type,
      identifiant: texte(p.id) || texte(p.id_site) || null,
    };
  });
}

/** La commune d'un point (API Géo renvoie une liste). */
export function lireCommune(brut) {
  const l = Array.isArray(brut) ? brut : [];
  if (!l.length) return null;
  const c = l[0];
  return {
    nom: texte(c.nom) || null,
    codeInsee: texte(c.code) || null,
    codesPostaux: Array.isArray(c.codesPostaux) ? c.codesPostaux.slice() : [],
    population: entier(c.population),
  };
}

// ───────────────────────── DVF ─────────────────────────

/** Une ligne CSV respectant les guillemets (les adresses DVF en contiennent). */
export function decouperCsv(ligne, separateur = ',') {
  const cellules = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') { courant += '"'; i += 1; } else dansGuillemets = false;
      } else courant += c;
    } else if (c === '"') dansGuillemets = true;
    else if (c === separateur) { cellules.push(courant); courant = ''; }
    else courant += c;
  }
  cellules.push(courant);
  return cellules.map((x) => x.trim());
}

/** Les transactions DVF d'un fichier commune (CSV Etalab). */
export function lireDvf(csv, { max = 100000 } = {}) {
  const lignes = String(csv || '').split(/\r?\n/).filter((l) => l.length);
  if (lignes.length < 2) return { transactions: [], nombre: 0, vide: true };
  const entetes = decouperCsv(lignes[0]);
  const i = (nom) => entetes.indexOf(nom);
  const iDate = i('date_mutation');
  const iPrix = i('valeur_fonciere');
  const iType = i('type_local');
  const iSurface = i('surface_reelle_bati');
  const iPieces = i('nombre_pieces_principales');
  const iNature = i('nature_mutation');
  const iVoie = i('adresse_nom_voie');
  const iLon = i('longitude');
  const iLat = i('latitude');
  if (iDate < 0 || iPrix < 0) return { transactions: [], nombre: 0, vide: true };
  const transactions = [];
  for (const ligne of lignes.slice(1, max + 1)) {
    const c = decouperCsv(ligne);
    const prix = entier(c[iPrix]);
    const surface = iSurface >= 0 ? entier(c[iSurface]) : null;
    const date = texte(c[iDate]);
    if (!date) continue;
    transactions.push({
      date,
      annee: Number(date.slice(0, 4)) || null,
      prix,
      nature: iNature >= 0 ? texte(c[iNature]) || null : null,
      type: iType >= 0 ? texte(c[iType]) || null : null,
      surface,
      pieces: iPieces >= 0 ? entier(c[iPieces]) : null,
      voie: iVoie >= 0 ? texte(c[iVoie]) || null : null,
      lon: iLon >= 0 ? entier(c[iLon]) : null,
      lat: iLat >= 0 ? entier(c[iLat]) : null,
      prixM2: prix !== null && surface ? Math.round(prix / surface) : null,
    });
  }
  return { transactions, nombre: transactions.length, vide: transactions.length === 0 };
}

/** Médiane d'une liste de nombres (ignore les valeurs absentes). */
export function mediane(valeurs) {
  const l = (valeurs || []).filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!l.length) return null;
  const milieu = Math.floor(l.length / 2);
  return l.length % 2 ? l[milieu] : Math.round((l[milieu - 1] + l[milieu]) / 2);
}

/** Le marché local : prix au m² médian par type de bien, et les dernières ventes. */
export function resumeDvf(dvf, { depuis = 2022, dernieres = 6 } = {}) {
  const t = (dvf?.transactions || []).filter((x) => (x.annee || 0) >= depuis);
  const parType = {};
  for (const x of t) {
    if (!x.type || !x.prixM2) continue;
    (parType[x.type] = parType[x.type] || []).push(x.prixM2);
  }
  const prix = Object.entries(parType)
    .map(([type, valeurs]) => ({ type, nombre: valeurs.length, medianeM2: mediane(valeurs) }))
    .sort((a, b) => b.nombre - a.nombre);
  const ventes = t
    .filter((x) => x.prix)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, dernieres);
  return {
    depuis,
    nombre: t.length,
    parType: prix,
    dernieres: ventes,
    prixM2Global: mediane(t.map((x) => x.prixM2)),
    anneeRecente: t.reduce((m, x) => Math.max(m, x.annee || 0), 0) || null,
  };
}

// ───────────────────────── marchés publics ─────────────────────────

/** Les avis BOAMP (Opendatasoft v2.0 : les résultats sont dans `results`). */
export function lireMarchesBoamp(brut) {
  const l = (brut && Array.isArray(brut.results)) ? brut.results : [];
  return l.map((r) => ({
    id: texte(r.idweb) || texte(r.id) || null,
    objet: texte(r.objet) || 'avis sans objet',
    acheteur: texte(r.nomacheteur) || texte(r.acheteur) || null,
    date: texte(r.dateparution) || null,
    limite: texte(r.datelimitereponse) || null,
    departement: texte(r.code_departement) || null,
    procedure: texte(r.procedure_libelle) || texte(r.type_marche) || null,
    famille: texte(r.famille_libelle) || null,
    url: r.idweb ? `https://www.boamp.fr/pages/avis/?q=idweb:%22${encodeURIComponent(texte(r.idweb))}%22` : null,
  }));
}

/** Les marchés attribués (DECP). */
export function lireMarchesDecp(brut) {
  const l = (brut && Array.isArray(brut.results)) ? brut.results : [];
  return l.map((r) => ({
    id: texte(r.id) || null,
    objet: texte(r.objet) || 'marché sans objet',
    acheteur: texte(r.acheteur_nom) || texte(r.acheteur_id) || null,
    titulaire: texte(r.titulaire_nom) || texte(r.titulaire_id) || null,
    montant: entier(r.montant),
    dureeMois: entier(r.dureemois),
    date: texte(r.datepublication) || null,
    procedure: texte(r.procedure) || null,
    url: texte(r.url_avis) || texte(r.source) || null,
  }));
}

/** Le total des montants publiés, quand la source les donne. */
export function totalMarches(marches) {
  const l = (marches || []).map((m) => m.montant).filter((v) => Number.isFinite(v));
  if (!l.length) return null;
  return { nombre: l.length, total: l.reduce((s, v) => s + v, 0) };
}

// ───────────────────────── contrôle ─────────────────────────

/** Une source sans documentation, licence ou date de vérification ne passe pas. */
export function verifierSourcesOfficielles() {
  const problemes = [];
  const cles = new Set();
  for (const s of SOURCES_OFFICIELLES) {
    if (cles.has(s.cle)) problemes.push('clé en double : ' + s.cle);
    cles.add(s.cle);
    if (!/^https:\/\//.test(s.doc || '')) problemes.push(s.cle + ' : documentation manquante');
    if (!s.licence) problemes.push(s.cle + ' : licence non déclarée');
    if (!s.verifieLe) problemes.push(s.cle + ' : sans date');
    if (!s.donnees) problemes.push(s.cle + ' : usage non décrit');
  }
  const attendues = ['urbanisme', 'cadastre', 'dvf', 'boamp', 'decp', 'nature', 'commune'];
  for (const c of attendues) if (!cles.has(c)) problemes.push('source attendue absente : ' + c);
  return { ok: problemes.length === 0, problemes, controle: SOURCES_OFFICIELLES.length };
}

/** Ce qui reste à vérifier en ligne (transparence sur l'état réel). */
export function sourcesNonVerifiees() {
  return SOURCES_OFFICIELLES.filter((s) => !s.verifieEnLigne).map((s) => ({ cle: s.cle, nom: s.nom, doc: s.doc }));
}

/** Ligne de résumé pour l'interface. */
export function resumeSourcesOfficielles() {
  const v = verifierSourcesOfficielles();
  const n = sourcesNonVerifiees().length;
  return `${SOURCES_OFFICIELLES.length} sources officielles prêtes · ${n} à confirmer en ligne`
    + (v.ok ? '' : ' · ' + v.problemes.length + ' anomalie(s)');
}
