import { liensVerification } from './tracabilite.js';

/**
 * WATCHTOWER — EMPREINTE D'UN LIEU (économie, risques, environnement).
 *
 * Cliquer sur un site industriel (les citernes de Frontignan, une usine, un
 * entrepôt…) doit dire BIEN PLUS que « point GPS » : qui exploite, qui
 * possède, combien de salariés, quel chiffre d'affaires, quels risques
 * industriels, quelles servitudes. C'est ce qui permet de juger un
 * environnement et d'agir.
 *
 * Sources — toutes ouvertes, sans clé (Sauf mention) :
 *  · **OpenStreetMap** : les tags du site (operator, owner, product…) ;
 *  · **Wikidata** : propriétaire (P127), maison mère (P749), effectif
 *    (P1128), chiffre d'affaires (P2139), dirigeant (P169), site web (P856) ;
 *  · **recherche-entreprises.api.gouv.fr** (DINUM/INSEE) : SIREN, SIRET, code
 *    NAF, tranche d'effectif, dirigeants, adresse, date de création ;
 *  · **Géorisques** (Ministère de la Transition écologique) : installations
 *    classées ICPE/SEVESO, sols pollués (SIS), catastrophes naturelles, radon,
 *    argiles, sismicité, cavités ;
 *  · **INSEE** : dossier communal (lien), et **data.gouv.fr** pour creuser.
 *
 * Aucune donnée n'est inventée : quand une source ne sait pas, on affiche
 * « non renseigné » et on donne le lien pour vérifier.
 */

const RECHERCHE = 'https://recherche-entreprises.api.gouv.fr';
const GEORISQUES = 'https://georisques.gouv.fr/api/v1';
const WIKIDATA = 'https://www.wikidata.org/wiki/Special:EntityData';

/** Thèmes Géorisques exploités, avec un libellé lisible. */
export const THEMES_RISQUES = Object.freeze([
  { cle: 'installations_classees', nom: 'Installations classées (ICPE / SEVESO)', ic: '🏭' },
  { cle: 'secteurs_information_sols', nom: 'Sols pollués (SIS)', ic: '☣️' },
  { cle: 'cavites', nom: 'Cavités souterraines', ic: '🕳' },
  { cle: 'radon', nom: 'Potentiel radon', ic: '☢️' },
  { cle: 'argiles', nom: 'Retrait-gonflement des argiles', ic: '🧱' },
  { cle: 'zonage_sismique', nom: 'Zonage sismique', ic: '🌍' },
  { cle: 'catnat', nom: 'Catastrophes naturelles (arrêtés)', ic: '🌊' },
]);

/** Construit l'URL de recherche d'entreprise (API de l'État, sans clé). */
export function urlRechercheEntreprise(terme, limite = 5) {
  const p = new URLSearchParams({ q: String(terme || '').slice(0, 120), per_page: String(limite) });
  return `${RECHERCHE}/search?${p}`;
}

/** Construit l'URL d'un thème Géorisques autour d'un point. */
export function urlGeorisques(theme, lon, lat, rayon = 500) {
  const p = new URLSearchParams({
    latlon: `${Number(lon).toFixed(5)},${Number(lat).toFixed(5)}`,
    rayon: String(Math.max(100, Math.round(rayon))),
  });
  return `${GEORISQUES}/${theme}?${p}`;
}

/** Construit l'URL des données d'une entité Wikidata. */
export function urlWikidata(id) {
  const propre = String(id || '').trim().replace(/^.*[:/]/, '');
  return propre ? `${WIKIDATA}/${propre}.json` : '';
}

/** Tranches d'effectif INSEE → ordre de grandeur lisible. */
export function trancheEffectif(code) {
  const table = {
    NN: 'non renseigné', '00': '0 salarié', '01': '1 ou 2 salariés', '02': '3 à 5 salariés',
    '03': '6 à 9 salariés', 11: '10 à 19 salariés', 12: '20 à 49 salariés',
    21: '50 à 99 salariés', 22: '100 à 199 salariés', 31: '200 à 249 salariés',
    32: '250 à 499 salariés', 41: '500 à 999 salariés', 42: '1 000 à 1 999 salariés',
    51: '2 000 à 4 999 salariés', 52: '5 000 à 9 999 salariés', 53: '10 000 salariés et plus',
  };
  if (code === null || code === undefined || String(code).trim() === '') return 'non renseigné';
  const cle = String(code).padStart(2, '0');
  return table[cle] || table[String(code ?? '').trim()] || (code ? `tranche ${code}` : 'non renseigné');
}

/** Met en forme un montant en euros (CA, résultat) de façon compacte. */
export function formaterEuros(montant) {
  if (montant === null || montant === undefined || montant === '') return '—';
  const v = Number(montant);
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2).replace('.', ',')} Md €`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1).replace('.', ',')} M €`;
  if (Math.abs(v) >= 1e3) return `${Math.round(v / 1e3).toLocaleString('fr-FR')} k€`;
  return `${Math.round(v).toLocaleString('fr-FR')} €`;
}

/** Normalise un résultat de recherche-entreprises. */
export function entrepriseDeReponse(json) {
  const r = Array.isArray(json?.results) ? json.results[0] : json?.results;
  if (!r) return null;
  const siege = r.siege || {};
  return {
    siren: r.siren || '',
    siret: siege.siret || '',
    nom: r.nom_complet || r.nom_raison_sociale || r.denomination || '',
    activite: r.activite_principale || '',
    libelleActivite: r.libelle_activite_principale || '',
    categorie: r.categorie_entreprise || '',
    effectif: trancheEffectif(r.tranche_effectif_salarie),
    dateCreation: r.date_creation || '',
    etat: r.etat_administratif === 'A' ? 'en activité' : (r.etat_administratif === 'F' ? 'cessée' : ''),
    natureJuridique: r.nature_juridique || '',
    adresse: siege.adresse || r.adresse || '',
    codePostal: siege.code_postal || '',
    ville: siege.libelle_commune || '',
    latitude: siege.latitude ?? null,
    longitude: siege.longitude ?? null,
    dirigeants: Array.isArray(r.dirigeants)
      ? r.dirigeants.slice(0, 4).map((d) => [d.prenom, d.nom].filter(Boolean).join(' ') || d.nom || '')
      : [],
    nombreEtablissements: r.nombre_etablissements ?? null,
    lien: r.siren ? `https://annuaire-entreprises.data.gouv.fr/entreprise/${r.siren}` : '',
  };
}

/** Extrait les faits économiques d'une entité Wikidata. */
export function faitsDeWikidata(json) {
  const e = json?.entities ? Object.values(json.entities)[0] : null;
  if (!e) return null;
  const claims = e.claims || {};
  const valeur = (prop) => claims[prop]?.[0]?.mainsnak?.datavalue?.value;
  const etiquette = (prop) => {
    const v = valeur(prop);
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (v.id) return v.id; // entité : on rend l'identifiant (Q…)
    if (v.amount) return v.amount;
    if (v.time) return v.time.slice(1, 11);
    return '';
  };
  const montant = (prop) => {
    const v = valeur(prop);
    if (v && typeof v === 'object' && typeof v.amount === 'string') return Number(v.amount);
    return null;
  };
  return {
    id: e.id || '',
    titre: e.labels?.fr?.value || e.labels?.en?.value || '',
    description: e.descriptions?.fr?.value || e.descriptions?.en?.value || '',
    proprietaire: etiquette('P127'),
    maisonMere: etiquette('P749'),
    filiales: (claims.P355 || []).map((c) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean).slice(0, 5),
    effectif: (() => { const v = montant('P1128'); return Number.isFinite(v) ? Math.round(v) : null; })(),
    chiffreAffaires: montant('P2139'),
    creation: etiquette('P571'),
    siege: etiquette('P159'),
    secteur: etiquette('P452'),
    dirigeant: etiquette('P169') || etiquette('P1037'),
    siteWeb: valeur('P856') && typeof valeur('P856') === 'string' ? valeur('P856') : '',
    formeJuridique: etiquette('P1454'),
    lien: e.id ? `https://www.wikidata.org/wiki/${e.id}` : '',
  };
}

/**
 * Résume une réponse Géorisques en une liste courte et lisible.
 * Chaque risque porte son lien de vérification : la fiche Géorisques de
 * l'installation quand elle existe, sinon le rapport complet du point.
 *
 * @param {object} json réponse de l'API Géorisques
 * @param {string} theme clé du thème (voir THEMES_RISQUES)
 * @param {number} [limite=4]
 * @param {{lat?:number, lon?:number}} [point] pour fabriquer le lien de repli
 */
export function resumeGeorisques(json, theme, limite = 4, point = {}) {
  const data = json?.data;
  if (!Array.isArray(data)) return [];
  const { lat, lon } = point || {};
  const rapport = Number.isFinite(lat) && Number.isFinite(lon)
    ? `https://www.georisques.gouv.fr/dossiers/etude-risques?latlon=${lon},${lat}`
    : 'https://www.georisques.gouv.fr/';
  return data.slice(0, limite).map((d) => ({
    nom: d.nomEtablissement || d.nom || d.libelle || d.nom_commune || d.risque || d.libelle_risque || '—',
    detail: [
      d.codePostal ? `${d.codePostal}` : '',
      d.commune || d.libelle_commune || '',
      d.regime ? `régime ${d.regime}` : '',
      d.statut ? String(d.statut) : '',
      d.dateDebut ? String(d.dateDebut).slice(0, 10) : (d.date_arrete ? String(d.date_arrete).slice(0, 10) : ''),
      d.classe ? String(d.classe) : '',
    ].filter(Boolean).join(' · '),
    lien: d.lienFiche || d.lien || '',
    // source cliquable : la donnée affichée se vérifie toujours en un clic
    sourceUrl: d.lienFiche || d.lien || rapport,
    sourceNom: 'Géorisques',
    theme,
  }));
}

async function jsonOuNull(url, delai = 8_000) {
  try {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), delai);
    const r = await fetch(url, { signal: controle.signal });
    clearTimeout(minuteur);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/**
 * Rassemble tout ce qu'on peut savoir d'UTILE sur un lieu.
 *
 * @param {object} p
 * @param {number} p.lat @param {number} p.lon
 * @param {string} [p.nom] nom du lieu / de l'exploitant
 * @param {object} [p.tagsOsm] tags OpenStreetMap de l'objet cliqué
 * @param {string} [p.codeCommune]
 * @returns {Promise<object>}
 */
export async function empreinteDuLieu(p = {}) {
  const { lat, lon, nom = '', tagsOsm = {}, codeCommune = '' } = p;
  const out = {
    exploitant: '', proprietaire: '', produit: '', activite: '',
    entreprise: null, wikidata: null, risques: [], tags: [], liens: [],
    // traçabilité : les clés du registre de SOURCES effectivement consultées
    sources: ['osm'],
    verifications: liensVerification(lat, lon, codeCommune),
  };

  // 1) ce qu'OpenStreetMap sait déjà de l'objet
  const tags = tagsOsm || {};
  out.exploitant = tags.operator || tags.brand || '';
  out.proprietaire = tags.owner || '';
  out.produit = tags.product || tags.industrial || tags.man_made || tags.landuse || '';
  out.activite = tags.industrial || tags.amenity || tags.man_made || tags.landuse || '';
  out.tags = Object.entries(tags)
    .filter(([, v]) => v && String(v).length < 80)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 18);

  // 2) Wikidata (propriétaire, effectif, CA…) via les tags OSM
  const idWiki = tags.operator?.wikidata || tags.wikidata || tags.brand?.wikidata || tags['operator:wikidata'] || '';
  if (idWiki) {
    const brut = await jsonOuNull(urlWikidata(idWiki), 8_000);
    out.wikidata = faitsDeWikidata(brut);
  } else if (out.exploitant || nom) {
    const recherche = await jsonOuNull(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=fr&limit=1&search=${encodeURIComponent(out.exploitant || nom)}`,
      7_000,
    );
    const id = recherche?.search?.[0]?.id;
    if (id) out.wikidata = faitsDeWikidata(await jsonOuNull(urlWikidata(id), 8_000));
  }

  // 3) registre français des entreprises (SIREN/NAF/effectif/dirigeants)
  const terme = out.exploitant || out.proprietaire || nom;
  if (terme && terme.length > 3 && Number.isFinite(lat) && lat > 41 && lat < 51.6) {
    const brut = await jsonOuNull(urlRechercheEntreprise(terme, 5), 8_000);
    out.entreprise = entrepriseDeReponse(brut);
  }

  // 4) risques & environnement (Géorisques)
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const demandes = THEMES_RISQUES.slice(0, 4).map(async (t) => {
      const brut = await jsonOuNull(urlGeorisques(t.cle, lon, lat, 1_000), 9_000);
      return resumeGeorisques(brut, t.cle, 3, { lat, lon }).map((r) => ({ ...r, ic: t.ic, nomTheme: t.nom }));
    });
    const groupes = await Promise.all(demandes);
    out.risques = groupes.flat().slice(0, 10);
  }

  // 5) liens utiles pour aller vérifier / agir
  const q = encodeURIComponent(terme || nom || '');
  out.liens = [
    { nom: 'OpenStreetMap', url: `https://www.openstreetmap.org/#map=19/${lat}/${lon}` },
    { nom: 'Cadastre (IGN)', url: `https://www.geoportail.gouv.fr/carte?c=${lon},${lat}&z=18&l0=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)&l1=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)&permalink=yes` },
    { nom: 'Géorisques (rapport complet)', url: `https://www.georisques.gouv.fr/dossiers/etude-risques?latlon=${lon},${lat}` },
    { nom: 'Annuaire des entreprises', url: out.entreprise?.lien || `https://annuaire-entreprises.data.gouv.fr/rechercher?terme=${q}` },
    { nom: 'Pappers (comptes annuels)', url: `https://www.pappers.fr/recherche?q=${q}` },
    { nom: 'Societe.com', url: `https://www.societe.com/cgi-bin/search?champs=${q}` },
    { nom: 'BODACC (annonces légales)', url: `https://www.bodacc.fr/annonce/liste?q=${q}` },
    { nom: 'data.gouv.fr', url: `https://www.data.gouv.fr/fr/search/?q=${q || 'urbanisme'}` },
  ].filter((l) => l.url);
  if (codeCommune) {
    out.liens.push({ nom: `INSEE — dossier ${codeCommune}`, url: `https://www.insee.fr/fr/statistiques/2011101?geo=COM-${codeCommune}` });
  }
  if (out.wikidata?.lien) out.liens.unshift({ nom: 'Wikidata', url: out.wikidata.lien });

  // 6) TRAÇABILITÉ : quelles sources ont réellement servi (affichées dans la fiche)
  const src = new Set(out.sources);
  if (out.wikidata) src.add('wikidata');
  if (out.entreprise?.siren) src.add('entreprises');
  if (out.risques.length) src.add('georisques');
  if (codeCommune) src.add('geoapigouv');
  src.add('ign');   // orthophoto et cadastre servent de fond à la fiche
  out.sources = [...src];
  return out;
}
