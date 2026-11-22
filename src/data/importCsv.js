/**
 * WATCHTOWER — IMPORT DE CSV (données pures, testables sans navigateur).
 *
 * Le module TERRITOIRE ne prétend pas tout savoir : sa base d'amorçage est un
 * point de départ, et le reste se remplit par IMPORT — fichiers d'inventaire,
 * listes d'écoles et de commerces, chronologies de chantiers, retours
 * d'expérience d'imprévus. Ce fichier est cette porte d'entrée.
 *
 * Trois principes, et ils ne se négocient pas :
 *
 *  1. RIEN N'EST JETÉ. Une colonne d'un fichier qui n'a pas encore de colonne
 *     propre au schéma part dans `json_details` (la colonne « plus tard » des
 *     tables), et elle est DITE dans le rapport. Un import ne perd pas de
 *     données en silence.
 *
 *  2. RIEN N'EST INVENTÉ. Ce que l'import ne sait pas, il l'avoue : `confiance`
 *     par défaut = « à vérifier », `source_id` = la source générique d'un
 *     fichier transmis par un utilisateur. Un fichier d'origine inconnue
 *     n'entre jamais comme « documenté ».
 *
 *  3. RIEN N'EST CACHÉ. Le rapport dit, fichier par fichier : le type deviné,
 *     les colonnes reconnues, les colonnes hors contrat, les lignes refusées ET
 *     POURQUOI, et le niveau de complétude obtenu (1 → 5).
 */

import {
  CHAMPS_RESEAU, TYPES_ENTITE, champsDe, niveauAtteint, valider,
} from './attributsTerritoire.js';
import { CATEGORIES_POI } from './frontignan.js';
import {
  COLONNES as COLONNES_IMPREVUS, CONTEXTES, FREQUENCES, GRAVITES, PHASES,
} from './imprevusTp.js';

/** Les types qu'un fichier peut alimenter : les tables du schéma + réseaux + imprévus. */
export const TYPES_IMPORT = Object.freeze([
  ...Object.keys(TYPES_ENTITE), 'reseau', 'imprevus',
]);

/** Source par défaut d'un fichier importé : un import n'est pas une preuve. */
export const SOURCE_IMPORT = 'src_import_utilisateur';

/** Délimiteurs essayés, du plus probable au moins probable (Excel FR = « ; »). */
const DELIMITEURS = [';', ',', '\t', '|'];

/**
 * Colonnes du schéma d'un type d'import. Les réseaux vivent dans
 * `CHAMPS_RESEAU` et les imprévus dans `COLONNES` : le schéma est une vérité
 * répartie, et c'est ici qu'on la rassemble.
 */
export function champsDeTable(type) {
  if (type === 'reseau') return [...CHAMPS_RESEAU];
  if (type === 'imprevus') {
    // Le contrat d'un imprévu n'est pas « toutes les colonnes » : l'essentiel
    // est ce qui permet d'agir, le reste enrichit. Les niveaux le disent.
    const socle = new Set(['id', 'phase', 'probleme', 'gravite']);
    const important = new Set(['categorie', 'cause', 'consequence', 'prevention', 'action_immediate', 'confiance']);
    return COLONNES_IMPREVUS.map((cle) => ({
      cle, libelle: cle, type: 'texte',
      niveau: socle.has(cle) ? 1 : important.has(cle) ? 2 : 3,
    }));
  }
  return champsDe(type);
}

/** Index inverse de la taxonomie des lieux : type précis → catégorie racine. */
function categorieDeType(typeObjet) {
  const cible = String(typeObjet ?? '').trim().toLowerCase();
  if (!cible) return null;
  for (const [categorie, types] of Object.entries(CATEGORIES_POI)) {
    if (types.includes(cible)) return categorie;
  }
  return null;
}

/** Identifiant stable fabriqué depuis le nom (jamais un numéro de ligne seul). */
export function fabriquerId(type, entite, nomFichier, numero) {
  const prefixe = type === 'imprevus' ? 'IMP' : ((TYPES_ENTITE[type] && TYPES_ENTITE[type].cle) || type.slice(0, 3));
  const source = entite?.nom || entite?.titre || entite?.probleme || entite?.id || '';
  const slug = String(source)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48);
  const base = slug ? `${prefixe}_${slug}` : `${prefixe}_${normaliserEntete(nomFichier).slice(0, 24)}_${numero}`;
  return base;
}

/** Retire accents, majuscules et ponctuation d'un en-tête de colonne. */
export function normaliserEntete(colonne) {
  return String(colonne ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Devine le délimiteur d'un CSV en comptant, HORS guillemets, la 1re ligne. */
export function detecterDelimiteur(texte) {
  const debut = String(texte ?? '').replace(/^\ufeff/, '');
  // On saute les lignes vides du début : un fichier peut commencer par un blanc.
  const ligne = debut.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  let meilleur = ';';
  let meilleurScore = -1;
  for (const d of DELIMITEURS) {
    let n = 0;
    let dansGuillemets = false;
    for (let i = 0; i < ligne.length; i += 1) {
      const c = ligne[i];
      if (c === '"') dansGuillemets = !dansGuillemets;
      else if (c === d && !dansGuillemets) n += 1;
    }
    if (n > meilleurScore) { meilleurScore = n; meilleur = d; }
  }
  return meilleur;
}

/**
 * Analyse un CSV : guillemets (« "" » échappé), retours à la ligne dans une
 * cellule, BOM, fin de ligne Windows. Ne devine RIEN sur le sens des données :
 * il rend des lignes brutes indexées par en-tête normalisé.
 * @param {string} texte
 * @param {{delimiteur?: string, maxLignes?: number}} [options]
 * @returns {{delimiteur: string, entetesBrutes: string[], entetes: string[], lignes: Object[], avertissements: string[]}}
 */
export function parseCsv(texte, options = {}) {
  const source = String(texte ?? '').replace(/^\ufeff/, '');
  const delimiteur = options.delimiteur || detecterDelimiteur(source);
  const avertissements = [];
  const cellules = [];
  let cellule = '';
  let ligne = [];
  let dansGuillemets = false;

  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    if (dansGuillemets) {
      if (c === '"') {
        if (source[i + 1] === '"') { cellule += '"'; i += 1; } else dansGuillemets = false;
      } else cellule += c;
    } else if (c === '"') dansGuillemets = true;
    else if (c === delimiteur) { ligne.push(cellule); cellule = ''; }
    else if (c === '\n') { ligne.push(cellule); cellules.push(ligne); ligne = []; cellule = ''; }
    else if (c === '\r') { /* fin de ligne Windows : ignorée, le \n suit */ }
    else cellule += c;
  }
  if (cellule.length > 0 || ligne.length > 0) { ligne.push(cellule); cellules.push(ligne); }
  if (dansGuillemets) avertissements.push('guillemet non refermé : la dernière cellule peut être tronquée');

  const nonVides = cellules.filter((l) => l.some((v) => String(v).trim().length > 0));
  if (!nonVides.length) {
    return { delimiteur, entetesBrutes: [], entetes: [], lignes: [], avertissements: ['fichier vide'] };
  }

  const entetesBrutes = nonVides[0].map((v) => String(v).trim());
  const entetes = entetesBrutes.map(normaliserEntete);
  const vues = new Set();
  entetes.forEach((e, i) => {
    if (!e) return;
    let cle = e;
    let n = 2;
    while (vues.has(cle)) { cle = `${e}_${n}`; n += 1; }
    if (cle !== e) avertissements.push(`colonne « ${entetesBrutes[i]} » en double : renommée « ${cle} »`);
    vues.add(cle);
    entetes[i] = cle;
  });

  const max = Number.isFinite(options.maxLignes) ? options.maxLignes : Infinity;
  const lignes = [];
  for (let i = 1; i < nonVides.length && lignes.length < max; i += 1) {
    const brut = nonVides[i];
    if (!brut.some((v) => String(v).trim().length > 0)) continue;
    const objet = {};
    entetes.forEach((cle, j) => {
      if (!cle) return;
      objet[cle] = String(brut[j] ?? '').trim();
    });
    lignes.push(objet);
  }
  return { delimiteur, entetesBrutes, entetes: entetes.filter(Boolean), lignes, avertissements };
}

/**
 * Synonymes de colonnes — le vocabulaire qu'on trouve vraiment dans un fichier.
 * Un même mot peut viser deux colonnes selon la table (« type » = le type
 * d'objet pour un lieu, le type de travaux pour une opération) : d'où la table
 * générale, puis une table par type qui la surcharge.
 */
export const SYNONYMES = Object.freeze({
  identifiant: 'id', code: 'id', ref: 'id', reference: 'id', cle: 'id',
  libelle: 'nom', intitule: 'nom', designation: 'nom', titre: 'nom', appelation: 'nom',
  adresse_postale: 'adresse', voie: 'adresse',
  ville: 'commune', commune_nom: 'commune',
  insee: 'code_insee', code_insee_commune: 'code_insee', cp: 'code_postal',
  latitude: 'lat', y: 'lat',
  longitude: 'lon', lng: 'lon', long: 'lon', x: 'lon',
  tel: 'telephone', telephone_contact: 'telephone',
  mail: 'courriel', email: 'courriel', courriel_contact: 'courriel',
  web: 'site_web', url_site: 'site_web', site: 'site_web',
  descriptif: 'description', commentaire: 'description', commentaires: 'description',
  source: 'source_id', source_url: 'source_id',
  fiabilite: 'confiance', certitude: 'confiance',
  quartier_iris: 'quartier', iris: 'quartier',
  precision: 'precision_m', precision_metres: 'precision_m',
});

/** Surcharges par type : le même mot, mais un sens de colonne différent. */
export const SYNONYMES_PAR_TYPE = Object.freeze({
  poi: {
    type: 'type_objet', categorie_racine: 'categorie', horaires: 'ouverture',
    ouvert: 'ouverture', acces_pmr: 'acces_pmr', gratuit: 'gratuit',
    tarif: 'tarif_min_eur', adresse_complete: 'adresse',
  },
  transformation: {
    type: 'type_transformation', type_travaux: 'type_transformation',
    nature: 'type_transformation', type_operation: 'type_transformation',
    date_debut: 'debut', annee_debut: 'debut', demarrage: 'debut', debut_travaux: 'debut',
    date_fin: 'fin', annee_fin: 'fin', livraison: 'fin', fin_travaux: 'fin',
    montant: 'montant_eur', montant_marche: 'montant_eur', cout: 'montant_eur',
    budget: 'budget_eur', enveloppe: 'budget_eur',
    mo: 'maitre_ouvrage', maitre_d_ouvrage: 'maitre_ouvrage', maitre_ouvrage: 'maitre_ouvrage',
    maitrise_d_oeuvre: 'maitre_oeuvre', mod: 'maitre_oeuvre', attributaire: 'entreprise',
    titulaire: 'entreprise', societe: 'entreprise', entreprise_titulaire: 'entreprise',
    statut_operation: 'phase', etat: 'phase', avancement: 'phase',
    usage_initial: 'usage_avant', usage_final: 'usage_apres',
    projet: 'projet_id', operation: 'projet_id', id_projet: 'projet_id',
  },
  evenement: {
    type: 'type_evenement', type_manifestation: 'type_evenement',
    date: 'debut', date_debut: 'debut', date_fin: 'fin', lieu: 'poi_id',
    theme: 'themes', public: 'publics',
  },
  education: {
    type: 'type_etablissement', categorie_etablissement: 'type_etablissement',
    niveaux: 'niveau_scolaire', niveau: 'niveau_scolaire', eleves: 'effectif',
    classes: 'nb_classes', cantine: 'restauration',
  },
  commerce: {
    type: 'type_commerce', activite: 'type_commerce', produits: 'produits',
    marche: 'jours_marche', jours: 'jours_marche',
  },
  reseau: {
    type: 'famille', type_reseau: 'famille', exploitant: 'gestionnaire',
    concessionnaire: 'gestionnaire', materiau: 'materiau',
    diametre: 'diametre_mm', profondeur: 'profondeur_pose_m',
    classe: 'classe_precision', classe_de_precision: 'classe_precision',
    geometrie: 'geometrie', geom: 'geometrie', trace: 'geometrie',
    annee: 'annee_pose', etat_reseau: 'etat',
  },
  imprevus: {
    probleme_rencontre: 'probleme', description: 'probleme', sous_categorie: 'sous_categorie',
    gravite_estimee: 'gravite', frequence_estimee: 'frequence',
    consequence_si_non_traite: 'consequence', action: 'action_immediate',
    action_sur_le_champ: 'action_immediate', prevention_possible: 'prevention',
    comment_eviter: 'prevention', contexte: 'contextes', contextes_terrain: 'contextes',
    source_id: 'source', phase_chantier: 'phase',
  },
});

/** Table de synonymes effective pour un type. */
export function synonymesDe(type) {
  return { ...SYNONYMES, ...(SYNONYMES_PAR_TYPE[type] || {}) };
}

/** Convertit une valeur brute selon le type de champ du schéma. */
export function convertir(valeur, champ) {
  const t = String(valeur ?? '').trim();
  if (t === '') return '';
  const type = champ?.type;
  if (type === 'nombre' || type === 'duree') {
    const n = Number(t.replace(/\s|\u00a0/g, '').replace(/\u202f/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : t;
  }
  if (type === 'booleen') return /^(oui|o|vrai|true|1|x)$/i.test(t);
  if (type === 'liste') return t.split(/\s*[|;]\s*/).map((s) => s.trim()).filter(Boolean);
  if (type === 'json' || type === 'geojson') {
    if (/^[[{]/.test(t)) { try { return JSON.parse(t); } catch { return t; } }
    return t;
  }
  return t;
}

/** Mapping d'une ligne brute vers les colonnes du schéma (+ ce qui reste). */
export function mapperLigne(ligne, type) {
  const champs = champsDeTable(type);
  const parCle = new Map(champs.map((c) => [c.cle, c]));
  const synonymes = synonymesDe(type);
  const entite = {};
  const utilisees = new Set();
  const reste = {};

  for (const [colonne, valeur] of Object.entries(ligne || {})) {
    if (String(valeur ?? '').trim() === '') continue;
    const cible = parCle.has(colonne) ? colonne : synonymes[colonne];
    if (cible && parCle.has(cible) && entite[cible] === undefined) {
      entite[cible] = convertir(valeur, parCle.get(cible));
      utilisees.add(colonne);
    } else if (!parCle.has(colonne)) {
      reste[colonne] = valeur;
    }
  }
  return { entite, reste, utilisees };
}

/**
 * Devine le type d'un fichier d'après ses en-têtes, par recouvrement de
 * colonnes. Rend TOUJOURS son doute : les candidats et leur score.
 */
export function devinerType(entetes) {
  const colonnes = (entetes || []).map(normaliserEntete).filter(Boolean);
  if (!colonnes.length) return { type: null, score: 0, candidats: [] };
  const signes = {
    imprévus: ['probleme', 'cause', 'gravite', 'frequence', 'prevention', 'consequence'],
    transformation: ['debut', 'fin', 'montant', 'budget', 'maitre_ouvrage', 'travaux', 'chantier', 'projet', 'operation', 'phase'],
    evenement: ['date_debut', 'date_fin', 'manifestation', 'jauge', 'billetterie', 'recurrence'],
    reseau: ['gestionnaire', 'diametre', 'profondeur', 'classe_precision', 'materiau', 'geometrie'],
    education: ['effectif', 'niveau_scolaire', 'etablissement', 'classes', 'restauration'],
    commerce: ['type_commerce', 'enseigne', 'jours_marche', 'produits'],
    association: ['domaines', 'adhesion', 'publics', 'sous_domaines'],
  };
  const candidats = [];
  for (const type of TYPES_IMPORT) {
    const parCle = new Set(champsDeTable(type).map((c) => c.cle));
    const synonymes = synonymesDe(type);
    // On ne compte QUE les colonnes qui aboutissent à un champ de CE type :
    // un synonyme universel (« latitude ») ne doit pas faire grimper une table
    // qui n'a pas de latitude. C'est le même chemin que le mapping réel.
    let score = 0;
    for (const colonne of colonnes) {
      const cible = parCle.has(colonne) ? colonne : synonymes[colonne];
      if (cible && parCle.has(cible)) score += 1;
    }
    // Les mots-signes pèsent double : « gravite » ne trompe pas, « nom » si.
    const marques = (signes[type] || []).filter((m) => colonnes.some((c) => c.includes(m))).length;
    score += marques * 2;
    if (type === 'imprevus' && colonnes.includes('probleme')) score += 3;
    candidats.push({ type, score });
  }
  candidats.sort((a, b) => b.score - a.score || a.type.localeCompare(b.type));
  return { type: candidats[0].score > 0 ? candidats[0].type : null, score: candidats[0].score, candidats: candidats.slice(0, 3) };
}

/**
 * Importe un CSV dans une table.
 * @param {string} texte Contenu du fichier.
 * @param {object} [options]
 * @param {string} [options.type] Table visée ; devinée si absente.
 * @param {object} [options.defauts] Valeurs de repli (commune, code_insee, source_id…).
 * @param {string} [options.nom] Nom du fichier, conservé dans le rapport.
 * @param {string} [options.delimiteur] Délimiteur forcé.
 */
export function importerCsv(texte, options = {}) {
  const nom = options.nom || 'fichier.csv';
  const analyse = parseCsv(texte, { delimiteur: options.delimiteur });
  const type = options.type && TYPES_IMPORT.includes(options.type)
    ? options.type
    : devinerType(analyse.entetes).type;
  const defauts = {
    commune: 'Frontignan', code_insee: '34108', confiance: 'à vérifier',
    source_id: SOURCE_IMPORT, ...(options.defauts || {}),
  };
  // Un imprévu sans commune n'est PAS frontignanais par défaut : il vaut pour
  // tout le territoire. On ne lui colle donc pas une commune qu'il n'a pas.
  if (type === 'imprevus' && !(options.defauts || {}).commune) {
    delete defauts.commune;
    delete defauts.code_insee;
  }
  const rapport = {
    nom, type, delimiteur: analyse.delimiteur,
    total: analyse.lignes.length, entites: [], rejets: [], identifiantsFabriques: 0,
    entetes: { reconnues: [], horsContrat: [], vides: [] },
    avertissements: [...analyse.avertissements],
    niveaux: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  if (!type) {
    rapport.rejets.push({ ligne: 0, motif: `type de table non reconnu (colonnes : ${analyse.entetes.slice(0, 8).join(', ')})` });
    return rapport;
  }

  const champs = champsDeTable(type);
  const parCle = new Map(champs.map((c) => [c.cle, c]));
  const vues = new Set();
  const identifiants = new Set();
  for (const colonne of analyse.entetes) {
    const cible = parCle.has(colonne) ? colonne : synonymesDe(type)[colonne];
    if (cible && parCle.has(cible)) vues.add(colonne);
  }
  rapport.entetes.reconnues = analyse.entetes.filter((c) => vues.has(c));
  rapport.entetes.horsContrat = analyse.entetes.filter((c) => !vues.has(c));

  analyse.lignes.forEach((ligne, i) => {
    const numero = i + 2; // ligne du fichier, en-tête comprise
    const { entite, reste } = mapperLigne(ligne, type);
    const complete = { ...defauts, ...entite };
    const details = {
      fichier_source: nom,
      ligne_source: numero,
    };

    if (!complete.id) {
      // Un identifiant FABRIQUÉ n'est pas une donnée : c'est une clé technique,
      // dérivée du nom, et le rapport le dit. Sans elle, re-importer le même
      // fichier créerait des doublons au lieu de mettre à jour.
      complete.id = fabriquerId(type, complete, nom, numero);
      details.id_fabrique = true;
      rapport.identifiantsFabriques += 1;
    }
    if (identifiants.has(complete.id)) {
      rapport.rejets.push({ ligne: numero, motif: `identifiant « ${complete.id} » déjà pris dans ce fichier` });
      return;
    }
    identifiants.add(complete.id);

    // Deux dérivations, et deux seulement — documentées, réversibles, et
    // signalées : le type précis donne sa catégorie racine, et un point donne
    // sa géométrie. Ni l'une ni l'autre n'ajoute une information absente.
    if (type === 'poi') {
      if (!complete.categorie && complete.type_objet) {
        const deduit = categorieDeType(complete.type_objet);
        if (deduit) { complete.categorie = deduit; details.categorie_derivee_du_type = true; }
      }
      if (!complete.geometrie && Number.isFinite(Number(complete.lat)) && Number.isFinite(Number(complete.lon))) {
        complete.geometrie = { type: 'Point', coordinates: [Number(complete.lon), Number(complete.lat)] };
        details.geometrie_derivee_du_point = true;
      }
    }

    const clesReste = Object.keys(reste);
    if (clesReste.length) {
      // Rien ne se perd : les colonnes sans colonne propre sont conservées là
      // où le schéma les attend, et nommées dans le rapport.
      details.colonnes_sans_colonne_propre = reste;
      for (const c of clesReste) if (!rapport.entetes.horsContrat.includes(c)) rapport.entetes.horsContrat.push(c);
    }
    if (Object.keys(details).length > 2) complete.json_details = { ...(complete.json_details || {}), ...details };
    rapport.entites.push(complete);
  });

  // Complétude : mesurée avec les contrôles du schéma, jamais estimée à l'œil.
  let valides = 0;
  const manquants = new Map();
  for (const entite of rapport.entites) {
    const niveau = niveauAtteint(entite, type);
    rapport.niveaux[niveau] = (rapport.niveaux[niveau] || 0) + 1;
    const controle = valider(entite, type);
    if (controle.ok) valides += 1;
    for (const cle of controle.manquants) manquants.set(cle, (manquants.get(cle) || 0) + 1);
  }
  rapport.valides = valides;
  // Ce qui BLOQUE la montée en complétude, champ par champ : c'est la liste de
  // courses à donner à celui qui tient le fichier source.
  rapport.manquants = [...manquants.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([cle, n]) => ({ cle, n, libelle: (champsDeTable(type).find((c) => c.cle === cle) || {}).libelle || cle }));
  rapport.libelleType = type === 'imprevus' || type === 'reseau' ? type : (TYPES_ENTITE[type] || {}).nom || type;
  rapport.rejetees = rapport.rejets.length;
  if (!rapport.entites.length && analyse.lignes.length) {
    rapport.avertissements.push('aucune ligne exploitable');
  }
  return rapport;
}

/** Importe une base d'imprévus de chantier (colonnes de `imprevusTp.js`). */
export function importerImprevus(texte, options = {}) {
  const rapport = importerCsv(texte, { ...options, type: 'imprevus' });
  const phases = new Set(PHASES.map((p) => p.id));
  const contextes = new Set(CONTEXTES.map((c) => c.id));
  const gravites = new Set(GRAVITES);
  const frequences = new Set(FREQUENCES);
  const gardees = [];
  for (const ligne of rapport.entites) {
    const fautes = [];
    if (ligne.phase && !phases.has(ligne.phase)) fautes.push(`phase « ${ligne.phase} » hors barème`);
    if (ligne.gravite && !gravites.has(ligne.gravite)) fautes.push(`gravité « ${ligne.gravite} » hors barème`);
    if (ligne.frequence && !frequences.has(ligne.frequence)) fautes.push(`fréquence « ${ligne.frequence} » hors barème`);
    if (ligne.contextes) {
      const liste = Array.isArray(ligne.contextes) ? ligne.contextes : String(ligne.contextes).split('|');
      const inconnus = liste.filter((c) => !contextes.has(String(c).trim()));
      if (inconnus.length) fautes.push(`contexte(s) inconnu(s) : ${inconnus.join(', ')}`);
    }
    if (fautes.length) {
      rapport.rejets.push({ ligne: ligne.json_details?.ligne_source || null, motif: fautes.join(' ; ') });
      continue;
    }
    if (!ligne.confiance) ligne.confiance = 'à vérifier';
    gardees.push(ligne);
  }
  rapport.entites = gardees;
  rapport.rejetees = rapport.rejets.length;
  rapport.valides = gardees.length;
  return rapport;
}

/**
 * Fusionne des fiches importées dans une liste existante, par identifiant.
 * Une fiche existante n'est jamais écrasée en silence : elle est COMPTÉE.
 */
export function fusionnerParId(liste, ajouts) {
  const connues = new Map((liste || []).map((e) => [e.id, e]));
  const ajoutees = [];
  const misesAJour = [];
  for (const e of ajouts || []) {
    if (!e || !e.id) continue;
    if (connues.has(e.id)) misesAJour.push(e);
    else ajoutees.push(e);
    connues.set(e.id, e);
  }
  return {
    liste: [...connues.values()],
    ajoutees: ajoutees.length,
    misesAJour: misesAJour.length,
  };
}

/** Phrase courte pour le bandeau de l'interface. */
export function resumeImport(rapport) {
  if (!rapport) return '';
  if (!rapport.type) return `${rapport.nom} : table non reconnue — rien n’a été importé.`;
  const morceaux = [
    `${rapport.entites.length} fiche(s)`,
    `${rapport.valides} au niveau 1`,
    rapport.identifiantsFabriques ? `${rapport.identifiantsFabriques} identifiant(s) fabriqué(s)` : null,
    rapport.rejetees ? `${rapport.rejetees} refusée(s)` : null,
    rapport.entetes.horsContrat.length ? `${rapport.entetes.horsContrat.length} colonne(s) sans colonne propre` : null,
  ].filter(Boolean);
  return `${rapport.nom} → ${rapport.type} : ${morceaux.join(', ')}.`;
}
