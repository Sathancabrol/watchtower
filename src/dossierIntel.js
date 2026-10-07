/**
 * WATCHTOWER — DOSSIER INTEL (partie pure).
 *
 * Trois bases, une seule lentille :
 *   · `data/frontignanDossier.js` — le dossier territorial : 13 fiches projets,
 *     32 chiffres sourcés, 110 sources datées, 13 lacunes, 10 contradictions ;
 *   · `data/atlasThau.js` — l'atlas : 79 nœuds, 167 liens, les 14 communes et
 *     leurs indicateurs INSEE ;
 *   · `data/veilleOfficielle.js` — la liste de courses des sources publiques.
 *
 * Ce module ne rend rien et ne dessine rien : il LIT, RAPPROCHE et EXPORTE.
 * C'est lui qui produit le contrat d'échange versionné pour les autres
 * branches (PostGIS/`Place`/`Project` côté COGNITORIUM, profil T0 côté
 * proto-cognitorium) — voir `CONTRAT` et `versEntitesCore()`.
 *
 * Deux règles, héritées du reste de l'application :
 *   · rien n'est inventé — une donnée absente reste absente, une estimation
 *     garde sa marque (❓ ⚠️ 🔮 📅 ✅) ;
 *   · tout est traçable — chaque ligne exportée porte sa source.
 */

import {
  CHIFFRES, CONTRADICTIONS, LACUNES, MARQUEURS, PROJETS, PROVENANCE,
  SOURCES, VIGILANCES, VISION,
  chiffre, chiffresDe, projet, projetsParStatut, scenario, sourcesDe,
  sourcesParType, statistiquesDossier, verifierDossier,
} from './data/frontignanDossier.js';
import {
  COMMUNES, INDICATEURS_COMMUNES, LIENS, NOEUDS, PROVENANCE_ATLAS, REPARTITION,
  classement, commune, enfantsDe, noeud, noeudsParType, sourcesAtlas,
  statistiquesAtlas, valeurCommune, verifierAtlas, voisinage,
} from './data/atlasThau.js';
import {
  FAMILLES_VEILLE, SOURCES_VEILLE,
  statistiquesVeille, verifierVeille, veilleABrancher, veilleAvecApi, veilleDeFamille,
} from './data/veilleOfficielle.js';

/**
 * Rapprochements entre les fiches §7 du dossier et les nœuds de l'atlas.
 * Un rapprochement est ÉDITORIAL (fait par l'agent, pas par une source) :
 * il ne porte donc aucune donnée, seulement un lien de lecture.
 */
export const RAPPROCHEMENTS = Object.freeze({
  1: 'oru',
  2: 'friche-mobil',
  3: 'pem-gare',
  4: 'le-quai',
  7: 'port',
  8: 'lido',
  9: 'mas-de-chave',
});

/** Le contrat d'échange : ce que les autres dépôts peuvent consommer tel quel. */
export const CONTRAT = Object.freeze({
  nom: 'watchtower.intel',
  version: '1.0.0',
  creeLe: '2026-10-07',
  but: 'Publier la connaissance territoriale de Watchtower sous une forme lisible par les autres dépôts (monorepo, COGNITORIUM, proto-cognitorium) sans réécrire le code 3D.',
  destinations: Object.freeze([
    'monorepo — app Flask : lecture JSON (aucune dépendance JS)',
    'COGNITORIUM — brancher Place/Project sur PostGIS (convergence, lien 6)',
    'proto-cognitorium — carte cognitive T0 de l’intelTwin (convergence, lien 7)',
  ]),
  entites: Object.freeze({
    territoire: ['id', 'nom', 'code_insee', 'population', 'parents', 'indicateurs', 'sources'],
    lieu: ['id', 'type', 'nom', 'libelle', 'niveau', 'parent', 'population', 'texte', 'faits', 'sources'],
    projet: ['id', 'nom', 'nature', 'statut', 'budget', 'financeurs', 'calendrier', 'maitrise_oeuvre', 'lieu_id', 'sources', 'lacunes'],
    indicateur: ['zone', 'indicateur', 'valeur', 'unite', 'evolution', 'periode', 'source_url', 'fiabilite'],
    source: ['id', 'libelle', 'url', 'date', 'type', 'famille', 'verifie_le'],
    lacune: ['rang', 'texte', 'gravite', 'demandeur'],
  }),
  fiabilite: Object.freeze(MARQUEURS),
  regles: Object.freeze([
    'Une donnée sans source n’est pas exportée comme un fait : elle sort en lacune.',
    'Les estimations restent marquées (🔮 tendance, ❓ inconnu, ⚠️ incertain).',
    'Un rapprochement éditorial (projet §7 ↔ nœud d’atlas) est déclaré dans RAPPROCHEMENTS, jamais fondu dans la donnée.',
    'Les contradictions connues sont publiées avec leur arbitrage, pas supprimées.',
  ]),
});

// ───────────────────────── fiches ─────────────────────────

/** L'état général du territoire, en une lecture : population, projets, pressions. */
export function etatTerritoire() {
  const agglo = COMMUNES.reduce((s, c) => s + (c.pop || 0), 0);
  const projetsChiffres = PROJETS.filter((p) => p.budget && !/❓/.test(p.budget));
  return {
    commune: {
      nom: 'Frontignan la Peyrade',
      codeInsee: '34108',
      population: valeurCommune('Frontignan', 'pop')?.valeur ?? null,
      agglo: { nom: 'Sète Agglopôle Méditerranée', communes: COMMUNES.length, population: agglo },
      rangAgglo: commune('Frontignan')?.rangPopulation ?? null,
      rangDepartement: '7ᵉ ville de l’Hérault (INSEE 2023)',
    },
    projets: {
      total: PROJETS.length,
      avecBudget: projetsChiffres.length,
      montantsCites: projetsChiffres.map((p) => ({ id: p.id, nom: p.titre, budget: p.budget })),
      enEtude: projetsParStatut('étude', 'études', 'concertation', 'programmation').length,
      livres: projetsParStatut('livré', 'livree', 'en service').length,
    },
    risques: {
      noeudsAtlas: noeudsParType('risque').map((n) => ({ id: n.id, nom: n.libelle, resume: n.sous })),
      partDommagesSubmersion: chiffre('dommages')?.valeur ?? null,
      sitesSeveso: chiffre('seveso')?.valeur ?? null,
    },
    pression: {
      demographie2030: VISION.population2030,
      conditions: VISION.conditions,
      fragilites: VISION.fragilites.length,
    },
    connaissance: {
      chiffres: CHIFFRES.length,
      sources: SOURCES.length,
      lacunes: LACUNES.length,
      contradictions: CONTRADICTIONS.length,
      noeudsAtlas: NOEUDS.length,
      liensAtlas: LIENS.length,
      sourcesVeille: SOURCES_VEILLE.length,
    },
  };
}

/** La fiche complète d'un projet : dossier §7 + nœud d'atlas + sources + voisins. */
export function ficheProjet(cle) {
  const p = projet(cle);
  if (!p) return null;
  const lienAtlas = RAPPROCHEMENTS[p.numero] || null;
  const n = lienAtlas ? noeud(lienAtlas) : null;
  return {
    projet: p,
    rapprochement: lienAtlas ? { noeud: lienAtlas, origine: 'éditorial (agent)' } : null,
    atlas: n ? {
      libelle: n.libelle,
      sous: n.sous,
      texte: n.texte,
      faits: n.faits,
      puces: n.puces,
      sources: n.sources,
      voisins: voisinage(n.id).slice(0, 8).map((v) => ({ sens: v.sens, lien: v.lien, nom: v.noeud.libelle, type: v.noeud.type })),
    } : null,
    sources: p.sources,
    fiabilite: p.marqueurs.map((m) => ({ marque: m, sens: MARQUEURS[m] })),
  };
}

/** La fiche d'une commune : indicateurs INSEE + ce que l'atlas en dit. */
export function ficheCommune(nom) {
  const c = commune(nom);
  if (!c) return null;
  const n = noeud(c.nom === 'Frontignan' ? 'frontignan' : c.nom.toLowerCase());
  const indicateurs = Object.entries(INDICATEURS_COMMUNES)
    .filter(([cle]) => cle !== 'code')
    .map(([cle, [libelle, unite]]) => ({ cle, libelle, unite, valeur: c[cle] }))
    .filter((i) => i.valeur !== null && i.valeur !== undefined);
  return {
    commune: c,
    rangPopulation: c.rangPopulation,
    indicateurs,
    lecture: valeurCommune(c.nom, 'pop')?.affichage ?? null,
    atlas: n ? { libelle: n.libelle, sous: n.sous, texte: n.texte, faits: n.faits, sources: n.sources } : null,
  };
}

/** Toute la descendance d'un nœud d'atlas (quartiers, projets, données). */
export function descendre(id) {
  const out = [];
  const pile = [String(id || '')];
  while (pile.length) {
    for (const enfant of enfantsDe(pile.shift())) {
      out.push(enfant);
      pile.push(enfant.id);
    }
  }
  return out;
}

/** Le chemin de navigation de l'INTEL, avec ce que la base sait à chaque niveau. */
export function cheminTerritoire() {
  const echelles = PROVENANCE_ATLAS.echelles;
  const parEchelle = NOEUDS.reduce((m, n) => {
    const k = n.echelle || 'sans échelle';
    return { ...m, [k]: [...(m[k] || []), n] };
  }, {});
  const frontignan = valeurCommune('Frontignan', 'pop');
  return [
    { niveau: 0, nom: 'FRANCE', cle: 'france', sait: SOURCES_VEILLE.filter((s) => ['population', 'marches', 'entreprises'].includes(s.famille)).length + ' sources nationales listées' },
    { niveau: 1, nom: 'OCCITANIE', cle: 'occitanie', sait: (parEchelle['Les environs'] || []).length + ' nœuds d’environnement régional et littoral' },
    { niveau: 2, nom: 'HÉRAULT', cle: 'herault', sait: '7ᵉ ville de l’Hérault, risques industriels et littoraux documentés' },
    { niveau: 3, nom: 'THAU', cle: 'thau', sait: COMMUNES.length + ' communes · ' + (parEchelle["L'agglo de Thau"] || []).length + ' nœuds à l’échelle de l’agglo' },
    { niveau: 4, nom: 'FRONTIGNAN', cle: 'frontignan', sait: frontignan ? frontignan.affichage + ' · ' + descendre('frontignan').length + ' nœuds connus' : 'nœud d’atlas absent' },
  ];
}

/** Les quartiers et sous-objets connus d'un lieu (descendance d'atlas). */
export function descenteLieu(id) {
  return enfantsDe(id).map((n) => ({
    id: n.id, libelle: n.libelle, type: n.type, sous: n.sous,
    nbFaits: n.faits.length, nbSources: n.sources.length,
  }));
}

// ───────────────────────── lacunes & fiabilité ─────────────────────────

/** Ce que la base ne sait PAS — publié tel quel, c'est une donnée comme une autre. */
export function lacunesOuvertes() {
  return {
    angleMort: LACUNES.filter((l) => l.angleMort).map((l) => ({ rang: l.rang, bon: l.angleMort, texte: l.texte })),
    autres: LACUNES.filter((l) => !l.angleMort).map((l) => ({ rang: l.rang, texte: l.texte })),
    contradictions: CONTRADICTIONS,
    vigilances: VIGILANCES,
    total: LACUNES.length,
  };
}

/** Un indicateur du dossier, avec sa source lisible : la brique de base de l'INTEL. */
export function indicateurSourcé(fragment) {
  const c = chiffre(fragment);
  if (!c) return null;
  return {
    indicateur: c.indicateur,
    valeur: c.valeur,
    evolution: c.evolution,
    domaine: c.domaine,
    section: c.section,
    source: c.source,
    liens: c.liens,
    fiabilite: c.marqueurs.map((m) => ({ marque: m, sens: MARQUEURS[m] })),
  };
}

/** Les chiffres d'un domaine du dossier (population, risques, budget…). */
export function indicateursDe(fragmentSection) {
  return chiffresDe(fragmentSection).map((c) => ({
    indicateur: c.indicateur, valeur: c.valeur, evolution: c.evolution, source: c.source,
  }));
}

/** Les scénarios 2040 et ce qui les sépare. */
export function scenariosCompare() {
  return VISION.scenarios.map((s) => ({
    nom: s.nom,
    recommande: s.recommande,
    moteur: s.criteres.find((c) => /moteur/i.test(c.critere))?.valeur ?? null,
    population: s.criteres.find((c) => /population/i.test(c.critere))?.valeur ?? null,
    economie: s.criteres.find((c) => /conomie/i.test(c.critere))?.valeur ?? null,
    risque: s.criteres.find((c) => /risque/i.test(c.critere))?.valeur ?? null,
  }));
}

// ───────────────────────── veille ─────────────────────────

/** La veille, filtrable par famille ou par état. */
export function veille({ famille = null, etat = null } = {}) {
  let liste = famille ? veilleDeFamille(famille) : [...SOURCES_VEILLE];
  if (etat) liste = liste.filter((s) => s.etat === etat);
  return liste;
}

/** Le plan de branchement : quelles sources brancher, dans quel ordre, pour quoi. */
export function planDeBranchement() {
  const parFamille = {};
  for (const s of veilleABrancher()) {
    parFamille[s.famille] = [...(parFamille[s.famille] || []), { id: s.id, nom: s.nom, api: s.api, usage: s.usage }];
  }
  return {
    total: veilleABrancher().length,
    avecApi: veilleAvecApi().length,
    parFamille,
    familles: FAMILLES_VEILLE,
  };
}

// ───────────────────────── export ─────────────────────────

/** La forme normalisée d'un projet, pour un dépôt qui ne lit pas le JS de Watchtower. */
export function projetExporte(p) {
  return {
    id: 'watchtower:' + p.id,
    nom: p.titre,
    nature: p.nom !== p.titre ? p.nom : null,
    statut: p.statut,
    budget: p.budget,
    financeurs: p.financeurs,
    calendrier: p.calendrier,
    maitrise_oeuvre: p.maitre_oeuvre,
    lieu_id: RAPPROCHEMENTS[p.numero] ? 'atlas:' + RAPPROCHEMENTS[p.numero] : 'commune:34108',
    sources: p.sources.map((s) => ({ libelle: s.libelle, url: s.url })),
    lacunes: /❓/.test(p.budget || '') ? ['budget non publié'] : [],
  };
}

/** La forme normalisée d'un indicateur, quelque soit son point de départ. */
export function indicateurExporte(c) {
  return {
    zone: 'commune:34108',
    indicateur: c.indicateur,
    valeur: c.valeur,
    unite: null,
    evolution: c.evolution,
    periode: c.section,
    source_url: c.liens?.[0]?.url ?? null,
    source_libelle: c.source,
    fiabilite: c.marqueurs,
  };
}

/** Les entités du contrat : ce que les autres dépôts consomment. */
export function versEntitesCore() {
  return {
    lieux: [
      ...COMMUNES.map((c) => ({
        id: 'commune:' + c.code,
        type: 'commune',
        nom: c.nom,
        niveau: 'commune',
        parent: 'epci:200027167',
        population: c.pop,
        sources: [{ libelle: 'INSEE — populations légales 2023 (recalcul agglo)', url: PROVENANCE_ATLAS.atlas }],
      })),
      ...NOEUDS.map((n) => ({
        id: 'atlas:' + n.id,
        type: n.type === 'projet' ? 'projet' : n.type,
        nom: n.libelle,
        niveau: n.echelle,
        parent: n.parent ? 'atlas:' + n.parent : null,
        population: null,
        texte: n.texte,
        faits: n.faits,
        sources: n.sources,
      })),
    ],
    projets: PROJETS.map(projetExporte),
    indicateurs: CHIFFRES.map(indicateurExporte),
    sources: [
      ...SOURCES.map((s) => ({ id: 'dossier:' + s.id, libelle: s.libelle, url: s.url, date: s.date, type: s.type, famille: s.famille, verifie_le: '2026-09-08' })),
      ...sourcesAtlas().map((s, i) => ({ id: 'atlas:src-' + (i + 1), libelle: s.libelle, url: s.url, date: s.date, type: 'atlas', famille: 'atlas', verifie_le: '2026-09-08' })),
      ...SOURCES_VEILLE.map((s) => ({ id: 'veille:' + s.id, libelle: s.nom, url: s.url, date: null, type: 'veille', famille: s.famille, verifie_le: s.verifieLe })),
    ],
    lacunes: LACUNES.map((l) => ({ rang: l.rang, texte: l.texte, gravite: l.angleMort ? 'angle mort' : 'documentation', demandeur: 'Ville / agglo' })),
    contradictions: CONTRADICTIONS,
  };
}

/** Le document complet, prêt à écrire sur disque (outil `exporter-intel.mjs`). */
export function versJson({ genereLe = null } = {}) {
  const entites = versEntitesCore();
  return {
    contrat: CONTRAT.nom,
    version: CONTRAT.version,
    genere_le: genereLe,
    provenance: {
      dossier: PROVENANCE,
      atlas: PROVENANCE_ATLAS,
      veille: 'Registre des sources publiques — voir veilleOfficielle.js',
    },
    territoires: {
      commune: commune('Frontignan'),
      agglo: { nom: 'Sète Agglopôle Méditerranée', communes: COMMUNES.length, population: PROVENANCE_ATLAS.peuplementTotal },
      chemin: cheminTerritoire(),
    },
    entites,
    vision: {
      forces: VISION.forces,
      population_2030: VISION.population2030,
      points_2030: VISION.points2030,
      conditions: VISION.conditions,
      scenarios: VISION.scenarios,
      fragilites: VISION.fragilites,
      signaux: VISION.signaux,
    },
    statistiques: statistiquesIntel(),
  };
}

const cellule = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

/** Un CSV lisible par un tableur ou un script Python, sans surprise d’encodage. */
export function versCsv(type = 'projets') {
  const lignes = [];
  if (type === 'projets') {
    lignes.push(['id', 'titre', 'statut', 'budget', 'financeurs', 'calendrier', 'maitrise_oeuvre', 'sources'].join(';'));
    for (const p of PROJETS) lignes.push([p.id, p.titre, p.statut, p.budget, p.financeurs, p.calendrier, p.maitre_oeuvre, p.sources.map((s) => s.url).join(' | ')].map(cellule).join(';'));
  } else if (type === 'communes') {
    const cles = Object.keys(INDICATEURS_COMMUNES);
    lignes.push(['rang', ...cles].join(';'));
    for (const c of COMMUNES) lignes.push([c.rangPopulation, ...cles.map((k) => c[k])].map(cellule).join(';'));
  } else if (type === 'sources') {
    lignes.push(['id', 'libelle', 'url', 'date', 'type', 'famille'].join(';'));
    for (const s of SOURCES) lignes.push([s.id, s.libelle, s.url, s.date, s.type, s.famille].map(cellule).join(';'));
  } else if (type === 'veille') {
    lignes.push(['id', 'nom', 'famille', 'etat', 'url', 'api', 'verifie_le'].join(';'));
    for (const s of SOURCES_VEILLE) lignes.push([s.id, s.nom, s.famille, s.etat, s.url, s.api, s.verifieLe].map(cellule).join(';'));
  } else if (type === 'lacunes') {
    lignes.push(['rang', 'angle_mort', 'texte'].join(';'));
    for (const l of LACUNES) lignes.push([l.rang, l.angleMort || '', l.texte].map(cellule).join(';'));
  } else if (type === 'indicateurs') {
    lignes.push(['section', 'domaine', 'indicateur', 'valeur', 'evolution', 'source', 'fiabilite'].join(';'));
    for (const c of CHIFFRES) lignes.push([c.section, c.domaine, c.indicateur, c.valeur, c.evolution, c.source, c.marqueurs.join(' ')].map(cellule).join(';'));
  } else {
    return null;
  }
  return lignes.join('\n') + '\n';
}

/** Tous les CSV d'un coup, nommés — pour l'export vers un autre dépôt. */
export function tousLesCsv() {
  return {
    'projets.csv': versCsv('projets'),
    'communes-thau.csv': versCsv('communes'),
    'sources.csv': versCsv('sources'),
    'veille.csv': versCsv('veille'),
    'lacunes.csv': versCsv('lacunes'),
    'indicateurs.csv': versCsv('indicateurs'),
  };
}

// ───────────────────────── contrôle ─────────────────────────

/** Ce que le dossier INTEL contient, en chiffres — pour le bandeau de la vue. */
export function statistiquesIntel() {
  return {
    dossier: statistiquesDossier(),
    atlas: statistiquesAtlas(),
    veille: statistiquesVeille(),
    chiffres: CHIFFRES.length,
    sources: SOURCES.length,
    rapprochements: Object.keys(RAPPROCHEMENTS).length,
    scenarios: VISION.scenarios.length,
    projets: PROJETS.length,
  };
}

/** Les problèmes d'intégrité des trois bases, en une réponse. */
export function verifierIntel() {
  const v = verifierDossier();
  const a = verifierAtlas();
  const s = verifierVeille();
  const problemes = [
    ...v.problemes.map((p) => 'dossier : ' + p),
    ...a.problemes.map((p) => 'atlas : ' + p),
    ...s.problemes.map((p) => 'veille : ' + p),
  ];
  for (const [numero, id] of Object.entries(RAPPROCHEMENTS)) {
    if (!noeud(id)) problemes.push('rapprochement projet ' + numero + ' : nœud d’atlas inconnu ' + id);
    if (!projet(numero)) problemes.push('rapprochement projet ' + numero + ' : fiche §7 absente');
  }
  return {
    ok: problemes.length === 0,
    problemes,
    controle: v.controle + a.nœuds + a.liens + s.controle,
  };
}

// ───────────────────────── registre de preuves ─────────────────────────

/**
 * La méthode du dossier Talbot (« si tu ne sais pas, ne fais pas semblant »)
 * appliquée à la base territoriale : chaque affirmation est classée selon ce
 * qu'on peut en dire, jamais selon ce qu'on aimerait en dire.
 *
 * Statuts possibles, du plus solide au plus faible :
 *   · `établi`      — fait publié par une source officielle (marqueur ✅) ;
 *   · `annoncé`     — engagement public daté, à venir (📅) ;
 *   · `estimation`  — projection assumée comme telle (🔮) ;
 *   · `à vérifier`  — le dossier lui-même signale le doute (⚠️) ;
 *   · `non publié`   — la valeur n'existe pas publiquement (❓) ;
 *   · `contredit`   — deux sources se contredisent : l'arbitrage est publié ;
 *   · `inconnu`     — personne n'a la donnée (lacune de l'annexe B).
 */
export const STATUTS_PREUVE = Object.freeze({
  etabli: { nom: 'ÉTABLI', ic: '✅', quoi: 'publié par une source officielle' },
  annonce: { nom: 'ANNONCÉ', ic: '📅', quoi: 'engagement public daté' },
  estimation: { nom: 'ESTIMATION', ic: '🔮', quoi: 'projection assumée comme telle' },
  aVerifier: { nom: 'À VÉRIFIER', ic: '⚠️', quoi: 'le dossier signale le doute' },
  nonPublie: { nom: 'NON PUBLIÉ', ic: '❓', quoi: 'la valeur n’est pas publique' },
  contredit: { nom: 'CONTREDIT', ic: '⚖️', quoi: 'sources divergentes, arbitrage publié' },
  inconnu: { nom: 'INCONNU', ic: '🕳', quoi: 'personne n’a la donnée' },
});

const MOTS_VIDES = new Set(['dans', 'avec', 'pour', 'plus', 'sous', 'entre', 'cette', 'leurs', 'selon',
  'des', 'les', 'une', 'aux', 'par', 'sur', 'est', 'sont', 'que', 'qui', 'son', 'ses', 'ou', 'et']);

/** Les mots significatifs d'un libellé (trois lettres minimum, hors mots vides). */
function motsSignificatifs(libelle) {
  return [...new Set(String(libelle || '').toLowerCase().split(/[^a-zà-ÿ0-9]+/)
    .filter((m) => m.length >= 3 && !MOTS_VIDES.has(m)))];
}

/**
 * Deux libellés parlent-ils de la même chose ? Il faut AU MOINS DEUX mots en
 * commun — un seul (« population », « budget ») rapprocherait des sujets
 * étrangers l'un à l'autre, et faire dire à une source ce qu'elle ne dit pas
 * serait exactement la faute que ce registre sert à éviter.
 */
function memeSujet(a, b) {
  const cible = String(a || '').toLowerCase();
  const communs = motsSignificatifs(b).filter((m) => cible.includes(m));
  return communs.length >= 2;
}

/** Le statut d'un chiffre, d'après les marqueurs du dossier et les contradictions connues. */
function statutChiffre(c) {
  const m = c.marqueurs || [];
  if (m.includes('❓')) return 'nonPublie';
  if (m.includes('⚠️')) return 'aVerifier';
  if (m.includes('🔮')) return 'estimation';
  if (m.includes('📅')) return 'annonce';
  return 'etabli';
}

/**
 * Le registre complet : chiffres, projets, contradictions et lacunes, chacun
 * avec son statut et sa source. Rien n'est reformulé — les libellés sont ceux
 * de la base, seulement étiquetés.
 */
export function registreClaims() {
  const claims = [];
  let rang = 0;
  const pousser = (c) => { rang += 1; claims.push({ id: 'claim-' + rang, ...c }); return claims[claims.length - 1]; };

  for (const c of CHIFFRES) {
    const statut = statutChiffre(c);
    const touche = CONTRADICTIONS.find((k) => memeSujet(c.indicateur + ' ' + (c.domaine || ''), k.sujet));
    pousser({
      origine: 'chiffre',
      assertion: c.indicateur + ' : ' + c.valeur + (c.evolution ? ' (' + c.evolution + ')' : ''),
      statut: touche ? 'contredit' : statut,
      statutSource: statut,
      source: c.source || null,
      liens: (c.liens || []).length,
      arbitrage: touche ? touche.traitement : null,
      section: c.section,
    });
  }

  for (const k of CONTRADICTIONS) {
    pousser({
      origine: 'contradiction',
      assertion: k.sujet + ' — ' + k.conflit,
      statut: 'contredit',
      source: null,
      liens: 0,
      arbitrage: k.traitement,
      section: null,
    });
  }

  for (const p of PROJETS) {
    const publie = Boolean(p.budget) && !/❓/.test(p.budget || '');
    pousser({
      origine: 'projet',
      assertion: p.titre + ' — budget : ' + (p.budget || 'non chiffré publiquement'),
      statut: publie ? 'etabli' : 'nonPublie',
      source: p.sources[0]?.libelle || null,
      liens: p.sources.length,
      arbitrage: null,
      section: '7.' + p.numero,
    });
  }

  for (const l of LACUNES) {
    pousser({
      origine: 'lacune',
      assertion: l.texte,
      statut: 'inconnu',
      source: null,
      liens: 0,
      arbitrage: null,
      angleMort: Boolean(l.angleMort),
      section: 'annexe B',
    });
  }

  const parStatut = {};
  for (const c of claims) parStatut[c.statut] = (parStatut[c.statut] || 0) + 1;
  const avecSource = claims.filter((c) => c.source || c.liens > 0).length;
  return {
    claims,
    parStatut,
    total: claims.length,
    avecSource,
    sansSource: claims.length - avecSource,
    anglesMorts: claims.filter((c) => c.angleMort).length,
    arbitrages: claims.filter((c) => c.arbitrage).length,
  };
}

/** Ce que le registre de preuves dit de la base, en une ligne. */
export function resumeClaims() {
  const r = registreClaims();
  const solides = (r.parStatut.etabli || 0) + (r.parStatut.annonce || 0);
  return r.total + ' affirmations · ' + solides + ' établies ou annoncées · '
    + (r.parStatut.contredit || 0) + ' contredites (arbitrées) · '
    + (r.parStatut.inconnu || 0) + ' inconnues · ' + r.avecSource + ' avec source';
}

/** Une phrase de synthèse, pour le fil ou un en-tête. */
export function resumeIntel() {
  const s = statistiquesIntel();
  return s.projets + ' projets · ' + s.chiffres + ' chiffres sourcés · ' + s.sources
    + ' sources datées · ' + s.atlas.noeuds + ' nœuds d’atlas · ' + s.veille.total + ' sources de veille';
}

/** Ré-exports utiles : un seul point d'entrée pour la vue et pour les outils. */
export {
  CHIFFRES, COMMUNES, LACUNES, LIENS, NOEUDS, PROJETS, SOURCES, SOURCES_VEILLE, VISION,
  FAMILLES_VEILLE, chiffre, classement, commune, enfantsDe, noeud, noeudsParType, projet,
  scenario, sourcesDe, sourcesParType, valeurCommune, voisinage,
};
