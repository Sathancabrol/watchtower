#!/usr/bin/env node
/**
 * WATCHTOWER — EXTRACTEUR DE L'ATLAS DE THAU (outil de développement).
 *
 * L'« Atlas interactif — Frontignan la Peyrade » (branche `arena/01a08203-monorepo`
 * du monorepo) est un graphe de territoire : 79 nœuds (communes, acteurs,
 * projets, risques, futurs) reliés par 167 liens, chacun avec ses faits, ses
 * puces d'analyse et ses sources datées. À côté, `communes-thau.csv` donne les
 * 14 communes de Sète Agglopôle Méditerranée × 24 indicateurs INSEE.
 *
 * Ce script range les deux en base : `src/data/atlasThau.js`.
 * Il ne juge rien, il range : un fait sans source reste marqué sans source.
 *
 * Usage :
 *   node tools/extraire-atlas-thau.mjs \
 *     --atlas   /tmp/autres-repos/atlas.json \
 *     --communes /tmp/autres-repos/communes-thau.csv \
 *     --sortie  src/data/atlasThau.js
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Libellés des indicateurs du CSV des communes (ordre des colonnes). */
export const INDICATEURS = Object.freeze({
  pop: ['Population municipale (2023)', 'hab.'],
  part_agglo: ['Part dans la population de l’agglo', '%'],
  surf_km2: ['Superficie', 'km²'],
  dens: ['Densité', 'hab./km²'],
  tvam: ['Taux de variation annuel moyen', '%/an'],
  sn: ['Solde naturel', '%/an'],
  sm: ['Solde migratoire', '%/an'],
  nat: ['Taux de natalité', '‰'],
  mort: ['Taux de mortalité', '‰'],
  nvm: ['Niveau de vie médian', '€/UC'],
  pauv: ['Taux de pauvreté', '%'],
  tcho: ['Taux de chômage (15-64 ans)', '%'],
  tact: ['Taux d’activité', '%'],
  emp: ['Emplois sur place', 'emplois'],
  emp_100hab: ['Emplois pour 100 habitants', ''],
  etab: ['Établissements actifs', ''],
  etab_1000hab: ['Établissements pour 1 000 habitants', ''],
  rs: ['Résidences secondaires', '%'],
  vac: ['Logements vacants', '%'],
  prop: ['Propriétaires occupants', '%'],
  logts_men: ['Logements par ménage', ''],
  men: ['Ménages', ''],
  code: ['Code INSEE', ''],
});

const nettoyer = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const nombre = (v) => {
  if (v === null || v === undefined || v === '' || v === 'None') return null;
  const n = Number(String(v).replace(',', '.').replace('%', '').trim());
  return Number.isFinite(n) ? n : null;
};

/** Le CSV des communes, séparateur « ; ». */
export function lireCommunes(csv) {
  const lignes = String(csv).trim().split(/\r?\n/);
  const entetes = lignes[0].split(';');
  return lignes.slice(1).map((l) => {
    const cellules = l.split(';');
    const c = {};
    entetes.forEach((e, i) => {
      const brut = (cellules[i] ?? '').trim();
      c[e] = ['nom', 'code'].includes(e) ? brut : nombre(brut);
    });
    c.rangPopulation = null; // calculé plus bas
    return c;
  }).sort((a, b) => (b.pop || 0) - (a.pop || 0))
    .map((c, i) => ({ ...c, rangPopulation: i + 1 }));
}

/** Un nœud de l'atlas, réduit à ce qui sert : identité, texte, faits, sources, enfants. */
export function rangerNoeuds(atlas) {
  return (atlas.nodes || []).map((n) => ({
    id: n.id,
    libelle: nettoyer(n.label),
    type: n.type,
    echelle: n.tierLabel || null,
    tier: typeof n.tier === 'number' ? n.tier : null,
    icone: n.icon || null,
    parent: n.parent || null,
    sous: nettoyer(n.sub) || null,
    texte: nettoyer(n.txt) || null,
    faits: (n.facts || []).map((f) => ({ cle: nettoyer(f.k), valeur: nettoyer(f.v) })),
    puces: (n.bul || []).map(nettoyer).filter(Boolean),
    sources: (n.src || []).map((s) => ({
      libelle: nettoyer(s.t),
      url: s.u || null,
      date: s.d || null,
    })),
    donnees: n.data || null,
    enfants: (n.children || []).slice(),
  }));
}

/** Les liens, renommés en français mais sans perte. */
export function rangerLiens(atlas) {
  return (atlas.links || []).map((l) => ({
    source: l.source,
    cible: l.target,
    type: l.type || null,
    poids: typeof l.weight === 'number' ? l.weight : null,
    libelle: nettoyer(l.label) || null,
  }));
}

export function generer({ atlas, communes, nomAtlas, nomCommunes, empreinte }) {
  const noeuds = rangerNoeuds(atlas);
  const liens = rangerLiens(atlas);
  const sources = noeuds.flatMap((n) => n.sources.map((s) => ({ noeud: n.id, ...s })));
  const meta = atlas.meta || {};
  const parType = noeuds.reduce((m, n) => ({ ...m, [n.type]: (m[n.type] || 0) + 1 }), {});
  const parEchelle = noeuds.reduce((m, n) => (n.echelle ? { ...m, [n.echelle]: (m[n.echelle] || 0) + 1 } : m), {});
  const peuples = communes.reduce((s, c) => s + (c.pop || 0), 0);

  const n = (o, ind = '  ') => `${ind}{ ${Object.entries(o).map(([k, v]) => {
    if (v === null || v === undefined) return `${k}: null`;
    if (Array.isArray(v)) {
      const simple = v.every((x) => typeof x !== 'object');
      return simple ? `${k}: ${JSON.stringify(v)}` : `${k}: ${JSON.stringify(v)}`;
    }
    if (typeof v === 'number' || typeof v === 'boolean') return `${k}: ${v}`;
    return `${k}: ${JSON.stringify(v)}`;
  }).join(', ')} },`;

  return `/**
 * WATCHTOWER — ATLAS DE THAU (base de données territoriale).
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Généré par \`tools/extraire-atlas-thau.mjs\` depuis :
 *   · ${nomAtlas} — graphe de territoire, ${noeuds.length} nœuds, ${liens.length} liens
 *   · ${nomCommunes} — les 14 communes de l'agglo × ${Object.keys(INDICATEURS).length} colonnes
 *
 * Empreinte des sources : ${empreinte}
 *
 * C'est le MAILLAGE de la vue INTEL : qui agit (acteurs), où (communes,
 * quartiers), sur quoi (projets, risques), avec quoi (ressources, données),
 * et vers quoi (futurs, scénarios). Chaque fait porte sa source datée quand
 * l'atlas en avait une ; quand il n'y en a pas, la base le laisse vide plutôt
 * que de compléter toute seule.
 */

/** D'où vient cette base, et dans quelles conditions. */
export const PROVENANCE_ATLAS = Object.freeze({
  titre: ${JSON.stringify(nettoyer(meta.titre) || 'Atlas interactif — Frontignan la Peyrade')},
  sousTitre: ${JSON.stringify(nettoyer(meta.sous_titre) || null)},
  genereLe: ${JSON.stringify(meta.genere_le || null)},
  methode: ${JSON.stringify(nettoyer(meta.methode) || null)},
  echelles: ${JSON.stringify((meta.echelles || []).map(nettoyer))},
  atlas: ${JSON.stringify(nomAtlas)},
  communes: ${JSON.stringify(nomCommunes)},
  empreinte: ${JSON.stringify(empreinte)},
  peuplementTotal: ${peuples},
  avertissement:
    'Les faits de l’atlas sont repris tels quels, avec leurs sources quand elles existent. '
    + 'Les estimations d’analyste y sont signalées comme telles par l’atlas ; elles ne sont pas des données officielles.',
});

/** Les nœuds : un objet = une entité du territoire et ce qu'on sait d'elle. */
export const NOEUDS = Object.freeze([
${noeuds.map((x) => n(x)).join('\n')}
]);

/** Les liens : qui touche à quoi, et de quelle façon. */
export const LIENS = Object.freeze([
${liens.map((x) => n(x)).join('\n')}
]);

/** Les 14 communes de Sète Agglopôle Méditerranée, triées par population. */
export const COMMUNES = Object.freeze([
${communes.map((c) => n(c)).join('\n')}
]);

/** Ce que veux dire chaque colonne du tableau des communes. */
export const INDICATEURS_COMMUNES = Object.freeze(${JSON.stringify(INDICATEURS, null, 2)});

/** Répartition des nœuds — pour le bandeau de la vue. */
export const REPARTITION = Object.freeze({
  parType: ${JSON.stringify(parType)},
  parEchelle: ${JSON.stringify(parEchelle)},
  liens: ${liens.length},
  sourcesDeNoeuds: ${sources.length},
});

// ───────────────────────── accès ─────────────────────────

/** Un nœud par son identifiant. */
export function noeud(id) {
  return NOEUDS.find((x) => x.id === String(id || '')) || null;
}

/** Les nœuds d'un type (acteur, projet, risque, futur, commune…). */
export function noeudsParType(type) {
  return type ? NOEUDS.filter((x) => x.type === String(type)) : [...NOEUDS];
}

/** Les enfants directs d'un nœud. */
export function enfantsDe(id) {
  return NOEUDS.filter((x) => x.parent === String(id || ''));
}

/** Le voisinage d'un nœud dans le graphe, avec le libellé du lien et de l'autre bout. */
export function voisinage(id) {
  const cle = String(id || '');
  const out = [];
  for (const l of LIENS) {
    const autre = l.source === cle ? l.cible : l.cible === cle ? l.source : null;
    if (!autre) continue;
    const cible = noeud(autre);
    if (!cible) continue;
    out.push({ sens: l.source === cle ? 'sortant' : 'entrant', lien: l.type, libelle: l.libelle, noeud: cible });
  }
  return out.sort((a, b) => (b.noeud.tier ?? 9) - (a.noeud.tier ?? 9));
}

/** Une commune par son nom ou son code INSEE. */
export function commune(cle) {
  const c = String(cle || '').toLowerCase();
  return COMMUNES.find((x) => x.code === String(cle) || x.nom.toLowerCase() === c
    || x.nom.toLowerCase().startsWith(c)) || null;
}

/** Le classement des communes selon une colonne (population par défaut). */
export function classement(cle = 'pop', sens = 'desc') {
  const colonne = INDICATEURS_COMMUNES[cle] ? cle : 'pop';
  return [...COMMUNES].sort((a, b) => {
    const x = a[colonne];
    const y = b[colonne];
    if (x === null) return 1;
    if (y === null) return -1;
    return sens === 'desc' ? y - x : x - y;
  });
}

/** Un nœud comparable à une valeur, pour la frise ou le fil. */
export function valeurCommune(nom, cle) {
  const c = commune(nom);
  if (!c) return null;
  const v = c[cle];
  if (v === null || v === undefined) return null;
  const [libelle, unite] = INDICATEURS_COMMUNES[cle] || [cle, ''];
  const texte = Number.isInteger(v) ? v.toLocaleString('fr-FR') : String(v).replace('.', ',');
  return { commune: c.nom, indicateur: libelle, valeur: v, unite, affichage: texte + (unite ? ' ' + unite : '') };
}

/** Toutes les sources portées par les nœuds, dédoublonnées. */
export function sourcesAtlas() {
  const vues = new Map();
  for (const x of NOEUDS) {
    for (const s of x.sources) {
      if (!s.url) continue;
      if (!vues.has(s.url)) vues.set(s.url, { url: s.url, libelle: s.libelle, date: s.date, noeuds: [] });
      vues.get(s.url).noeuds.push(x.id);
    }
  }
  return [...vues.values()];
}

/** Contrôle d'intégrité : ce qui doit être vrai d'un graphe rangé. */
export function verifierAtlas() {
  const problemes = [];
  const ids = new Set(NOEUDS.map((x) => x.id));
  if (ids.size !== NOEUDS.length) problemes.push('identifiants de nœuds dupliqués');
  for (const l of LIENS) {
    if (!ids.has(l.source)) problemes.push(\`lien depuis un nœud inconnu : \${l.source}\`);
    if (!ids.has(l.cible)) problemes.push(\`lien vers un nœud inconnu : \${l.cible}\`);
  }
  for (const x of NOEUDS) {
    if (x.parent && !ids.has(x.parent)) problemes.push(\`parent inconnu pour \${x.id} : \${x.parent}\`);
  }
  for (const c of COMMUNES) {
    if (!c.nom || !c.code) problemes.push('commune sans nom ou sans code INSEE');
  }
  return { ok: problemes.length === 0, problemes, nœuds: NOEUDS.length, liens: LIENS.length, communes: COMMUNES.length };
}

/** Statistiques pour le bandeau de la vue INTEL. */
export function statistiquesAtlas() {
  return {
    noeuds: NOEUDS.length,
    liens: LIENS.length,
    communes: COMMUNES.length,
    peuplement: PROVENANCE_ATLAS.peuplementTotal,
    types: REPARTITION.parType,
    sources: sourcesAtlas().length,
    noeudsSansSource: NOEUDS.filter((x) => x.sources.length === 0).length,
    projets: NOEUDS.filter((x) => x.type === 'projet').length,
    acteurs: NOEUDS.filter((x) => x.type === 'acteur').length,
    risques: NOEUDS.filter((x) => x.type === 'risque').length,
  };
}
`;
}

// ───────────────────────── point d'entrée ─────────────────────────

function principal() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  const cheminAtlas = path.resolve(args.atlas || '/tmp/autres-repos/atlas.json');
  const cheminCommunes = path.resolve(args.communes || '/tmp/autres-repos/communes-thau.csv');
  const sortie = path.resolve(args.sortie || path.join(RACINE, 'src/data/atlasThau.js'));
  const atlas = JSON.parse(readFileSync(cheminAtlas, 'utf8'));
  const communes = lireCommunes(readFileSync(cheminCommunes, 'utf8'));
  const empreinte = createHash('sha256')
    .update(JSON.stringify(atlas) + readFileSync(cheminCommunes, 'utf8'))
    .digest('hex').slice(0, 16);
  const contenu = generer({
    atlas,
    communes,
    nomAtlas: path.basename(cheminAtlas),
    nomCommunes: path.basename(cheminCommunes),
    empreinte,
  });
  writeFileSync(sortie, contenu);
  console.log(`écrit ${path.relative(RACINE, sortie)} — ${contenu.length} caractères, empreinte ${empreinte}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
