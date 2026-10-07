#!/usr/bin/env node
/**
 * WATCHTOWER — EXTRACTEUR DU DOSSIER DE CHANTIER (outil de développement).
 *
 * Source : `docs/DOSSIER-CHANTIER-INDEX.md` du monorepo — l'inventaire classé
 * d'un dossier de marché réel (220 fichiers, 225 Mo, 12 catégories : DCE,
 * actes et marchés, devis, planning, plans, suivi, normes…).
 *
 * Ce que fait cet outil : il range l'index ET il en tire une **matrice de
 * couverture** — pour chaque pièce qu'un dossier de chantier doit contenir
 * (acte d'engagement, CCAP, CCTP, BPU, DQE, DT/DICT, planning, DOE…), la base
 * dit si le dossier examiné la contient, et sous quel nom de fichier.
 *
 * Il ne conclut rien à la place de l'utilisateur : « présente » veut dire
 * « un fichier de l'inventaire correspond », pas « la pièce est valable ».
 *
 * Usage :
 *   node tools/extraire-dossier-chantier.mjs \
 *     --index /tmp/monorepo-inspect/docs/DOSSIER-CHANTIER-INDEX.md \
 *     --sortie src/data/dossierChantier.js
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Les pièces qu'on cherche dans un dossier de chantier, avec leurs variantes
 * de nommage. Les motifs sont volontairement larges : un dossier réel écrit
 * « DE LOT 1 T1.xls », pas « Détail estimatif ».
 */
export const PIECES_ATTENDUES = Object.freeze([
  { cle: 'acte-engagement', nom: 'Acte d’engagement', motifs: ['acte d.engagement', 'acte engagement'], phase: 'consultation' },
  { cle: 'ccap', nom: 'CCAP — clauses administratives', motifs: ['ccap', 'clauses administratives'], phase: 'consultation' },
  { cle: 'cctp', nom: 'CCTP — clauses techniques', motifs: ['cctp'], phase: 'consultation' },
  { cle: 'bpu', nom: 'BPU — bordereau des prix unitaires', motifs: ['bpu'], phase: 'consultation' },
  { cle: 'dqe', nom: 'DQE — devis quantitatif estimatif', motifs: ['dqe', 'detail.estimatif', 'de lot', 'détail estimatif'], phase: 'consultation' },
  { cle: 'reglement-consultation', nom: 'Règlement de la consultation', motifs: ['reglement de consultation', 'réglement de consultation', 'rc ', 'reglement-consultation'], phase: 'consultation' },
  { cle: 'memoire-technique', nom: 'Mémoire technique', motifs: ['memoire technique', 'mémoire technique', 'memoire justificatif', 'mémoire justificatif'], phase: 'consultation' },
  { cle: 'planning', nom: 'Planning d’exécution', motifs: ['planning'], phase: 'preparation' },
  { cle: 'dt-dict', nom: 'Récepissés DT / DICT', motifs: ['dt .pdf', 'dict', 'recepiss', 'récepissé', 'dt-dict'], phase: 'preparation' },
  { cle: 'autorisation-voirie', nom: 'Autorisation de voirie', motifs: ['autorisation de voirie'], phase: 'preparation' },
  { cle: 'arrete-circulation', nom: 'Arrêté de circulation', motifs: ['arrêté de circulation', 'arrete de circulation'], phase: 'preparation' },
  { cle: 'aipr', nom: 'AIPR — autorisation d’intervention à proximité des réseaux', motifs: ['aipr'], phase: 'preparation' },
  { cle: 'plan-masse', nom: 'Plan de masse', motifs: ['plan-masse', 'plan masse'], phase: 'plans' },
  { cle: 'plan-situation', nom: 'Plan de situation', motifs: ['plan de situation'], phase: 'plans' },
  { cle: 'plans-phase', nom: 'Plans de phase (exécution)', motifs: ['plan-phase', 'plan phase'], phase: 'plans' },
  { cle: 'profils-long', nom: 'Profils en long', motifs: ['profil-en-long', 'profil en long'], phase: 'plans' },
  { cle: 'plan-reseaux', nom: 'Plans de réseaux (AEP, assainissement, voirie)', motifs: ['plan aep', 'plan assainissement', 'plan voirie'], phase: 'plans' },
  { cle: 'comptes-rendus', nom: 'Comptes rendus de chantier', motifs: ['compte-rendu', 'compte rendu'], phase: 'execution' },
  { cle: 'ordres-service', nom: 'Ordres de service', motifs: ['ordre de service', 'ordre-service', 'lordre-de-service'], phase: 'execution' },
  { cle: 'fiches-tache', nom: 'Fiches de tâche / suivi d’exécution', motifs: ['fiche de tache', 'fiche de tâche'], phase: 'execution' },
  { cle: 'factures', nom: 'Factures et situations', motifs: ['facture', 'situation'], phase: 'execution' },
  { cle: 'essais-controle', nom: 'Essais et contrôle extérieur', motifs: ['controle-exterieur', 'contrôle extérieur', 'essai'], phase: 'execution' },
  { cle: 'doe', nom: 'DOE — dossier des ouvrages exécutés', motifs: ['doe', 'ouvrages exécutés', 'ouvrages executes'], phase: 'reception' },
  { cle: 'devis-exe', nom: 'Devis d’exécution', motifs: ['devis exe', 'devis'], phase: 'reception' },
  { cle: 'prix-fournitures', nom: 'Bibliothèque de prix / fournitures', motifs: ['prix fournitures', 'biblioth', 'prix unitaire'], phase: 'preparation' },
  { cle: 'prescriptions-f', nom: 'Prescriptions d’exécution (cahiers F…)', motifs: ['^f\\d', '- f\\d'], phase: 'normes' },
  { cle: 'gtR-normes', nom: 'Normes et guides techniques (GTR, DTU, manuels)', motifs: ['gtr', 'dtu', 'manuel', 'guide'], phase: 'normes' },
]);

const nettoyer = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const tailleMo = (s) => {
  const m = /([\d.,]+)\s*(Mo|Ko|Go)/i.exec(String(s || ''));
  if (!m) return null;
  const v = Number(m[1].replace(',', '.'));
  const unite = m[2].toLowerCase();
  return Number.isFinite(v) ? Math.round((unite === 'ko' ? v / 1024 : unite === 'go' ? v * 1024 : v) * 100) / 100 : null;
};

/** Découpe un tableau markdown en lignes de cellules. */
function lignesTableau(texte) {
  return String(texte).split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()))
    .filter((c) => !c.every((x) => /^:?-+:?$/.test(x)));
}

/** Les 12 catégories et leurs compteurs (tableau « Vue d'ensemble »). */
export function extraireCategories(markdown) {
  const zone = String(markdown).split('## Vue d’ensemble')[1] || String(markdown).split("## Vue d'ensemble")[1] || '';
  const lignes = lignesTableau(zone.split('\n## ')[0]);
  return lignes.slice(1).map((c) => ({
    nom: nettoyer(c[0]),
    fichiers: Number(String(c[1]).replace(/\D/g, '')) || 0,
    tailleMo: tailleMo(c[2]),
  })).filter((c) => c.nom);
}

/** Le catalogue complet : chaque fichier avec sa catégorie et sa taille. */
export function extraireFichiers(markdown) {
  const fichiers = [];
  const lignes = String(markdown).split('\n');
  let categorie = null;
  for (const ligne of lignes) {
    const titre = /^##\s+(.+)$/.exec(ligne.trim());
    if (titre) {
      categorie = /Vue d.ensemble/i.test(titre[1]) ? null : nettoyer(titre[1]).replace(/\s*\(\d+\)\s*$/, '');
      continue;
    }
    if (!categorie || !ligne.trim().startsWith('|')) continue;
    const cellules = ligne.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    if (cellules.length < 2) continue;
    const nom = nettoyer(cellules[0].replace(/^`|`$/g, ''));
    if (!nom || /^Fichier$/i.test(nom) || /^-+$/.test(nom)) continue;
    fichiers.push({ nom, categorie, tailleMo: tailleMo(cellules[1]) });
  }
  return fichiers;
}

/** La matrice de couverture : chaque pièce attendue, trouvée ou non. */
export function couverture(fichiers, pieces = PIECES_ATTENDUES) {
  const bas = (s) => s.toLowerCase();
  return pieces.map((p) => {
    const trouves = fichiers.filter((f) => p.motifs.some((m) => new RegExp(m, 'i').test(bas(f.nom))));
    return {
      cle: p.cle,
      nom: p.nom,
      phase: p.phase,
      presente: trouves.length > 0,
      nombre: trouves.length,
      exemples: trouves.slice(0, 4).map((f) => f.nom),
    };
  });
}

export function generer({ markdown, nomIndex, empreinte }) {
  const categories = extraireCategories(markdown);
  const fichiers = extraireFichiers(markdown);
  const matrice = couverture(fichiers);
  const totalFichiers = categories.reduce((s, c) => s + c.fichiers, 0);
  const presentes = matrice.filter((m) => m.presente).length;
  const parPhase = matrice.reduce((m, x) => {
    const p = (m[x.phase] = m[x.phase] || { presentes: 0, total: 0 });
    p.total += 1;
    if (x.presente) p.presentes += 1;
    return m;
  }, {});
  const ligne = (o, ind = '  ') => `${ind}{ ${Object.entries(o).map(([k, v]) => {
    if (v === null || v === undefined) return `${k}: null`;
    if (Array.isArray(v) || typeof v === 'object') return `${k}: ${JSON.stringify(v)}`;
    if (typeof v === 'number' || typeof v === 'boolean') return `${k}: ${v}`;
    return `${k}: ${JSON.stringify(v)}`;
  }).join(', ')} },`;

  return `/**
 * WATCHTOWER — DOSSIER DE CHANTIER (base de données, matrice de pièces).
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Généré par \`tools/extraire-dossier-chantier.mjs\` depuis :
 *   · ${nomIndex} — inventaire classé d'un dossier de marché réel
 *
 * Empreinte de la source : ${empreinte}
 *
 * Ce que c'est : la preuve, pièce par pièce, de ce que contient RÉELLEMENT un
 * dossier de chantier public — 220 fichiers réels, du CCTP au DOE, en passant
 * par les récepissés DT/DICT et les ordres de service. La vue INTEL s'en sert
 * de gabarit : quand elle décrit un chantier, elle sait quelles pièces doivent
 * exister, et lesquelles manquent au dossier examiné.
 *
 * « Présente » veut dire : un fichier de l'inventaire correspond au motif.
 * Cela ne dit rien de la validité de la pièce — c'est un inventaire, pas un
 * contrôle de conformité.
 */

/** Provenance et cadre. */
export const PROVENANCE_CHANTIER = Object.freeze({
  source: ${JSON.stringify(nomIndex)},
  empreinte: ${JSON.stringify(empreinte)},
  nature: 'Dossier de marché construction (Lotissement Pruniaux / Giratoire de Barbazan / NOE) — 220 fichiers, archivés le 07/10/2026',
  avertissement: 'Inventaire de fichiers, pas contrôle de conformité : « présente » signifie qu’un fichier correspond, pas que la pièce est valable.',
});

/** Les 12 catégories de l'inventaire, avec leurs volumes. */
export const CATEGORIES_CHANTIER = Object.freeze([
${categories.map((c) => ligne(c)).join('\n')}
]);

/** Le catalogue complet (${fichiers.length} fichiers). */
export const FICHIERS_CHANTIER = Object.freeze([
${fichiers.map((f) => ligne(f)).join('\n')}
]);

/**
 * La matrice de couverture : ${presentes} pièces attendues sur ${matrice.length} sont présentes.
 * C'est le gabarit d'une fiche chantier — et la liste de ce qu'un dossier
 * incomplet ne contient pas.
 */
export const COUVERTURE = Object.freeze([
${matrice.map((m) => ligne(m)).join('\n')}
]);

/** Ce que la matrice dit, par phase du chantier. */
export const COUVERTURE_PAR_PHASE = Object.freeze(${JSON.stringify(parPhase)});

// ───────────────────────── accès ─────────────────────────

/** Une pièce attendue par sa clé. */
export function piece(cle) {
  return COUVERTURE.find((p) => p.cle === String(cle || '')) || null;
}

/** Les pièces présentes (ou absentes) — pour piloter un dossier. */
export function piecesPresentes(presente = true) {
  return COUVERTURE.filter((p) => p.presente === Boolean(presente));
}

/** Les fichiers d'une catégorie (recherche souple sur le nom). */
export function fichiersDeCategorie(fragment) {
  const t = String(fragment || '').toLowerCase();
  return FICHIERS_CHANTIER.filter((f) => f.categorie.toLowerCase().includes(t));
}

/** Les fichiers qui correspondent à un motif libre. */
export function chercherFichiers(motif) {
  const t = String(motif || '').toLowerCase();
  if (!t) return [];
  return FICHIERS_CHANTIER.filter((f) => f.nom.toLowerCase().includes(t));
}

/** Le poids d'une catégorie, en Mo (somme des fichiers listés). */
export function poidsCategorie(nom) {
  return Math.round(fichiersDeCategorie(nom).reduce((s, f) => s + (f.tailleMo || 0), 0) * 100) / 100;
}

/** Les plus gros fichiers — là où se cachent les plans et les DCE scannés. */
export function plusGrosFichiers(n = 10) {
  return [...FICHIERS_CHANTIER].sort((a, b) => (b.tailleMo || 0) - (a.tailleMo || 0)).slice(0, n);
}

/**
 * Le gabarit de fiche chantier : quelles pièces existent, par phase.
 * C'est ce que la vue INTEL affiche pour expliquer ce qu'est un dossier
 * complet — et ce qu'un dossier donné oublie.
 */
export function gabaritFiche() {
  const phases = {};
  for (const p of COUVERTURE) (phases[p.phase] = phases[p.phase] || []).push(p);
  return Object.entries(phases).map(([phase, pieces]) => ({
    phase,
    presentes: pieces.filter((p) => p.presente).length,
    total: pieces.length,
    pieces,
  }));
}

/** Contrôle d'intégrité : les compteurs doivent se recouper. */
export function verifierChantier() {
  const problemes = [];
  const somme = CATEGORIES_CHANTIER.reduce((s, c) => s + c.fichiers, 0);
  if (somme !== FICHIERS_CHANTIER.length) {
    problemes.push('compteurs incohérents : ' + somme + ' annoncés, ' + FICHIERS_CHANTIER.length + ' listés');
  }
  for (const f of FICHIERS_CHANTIER) {
    if (!f.nom || !f.categorie) problemes.push('fichier sans nom ou sans catégorie : ' + JSON.stringify(f.nom));
  }
  const cles = new Set();
  for (const p of COUVERTURE) {
    if (cles.has(p.cle)) problemes.push('pièce en double : ' + p.cle);
    cles.add(p.cle);
    if (!p.nom || !p.phase) problemes.push('pièce incomplète : ' + p.cle);
  }
  return { ok: problemes.length === 0, problemes, controle: FICHIERS_CHANTIER.length + COUVERTURE.length };
}

/** Statistiques pour le bandeau. */
export function statistiquesChantier() {
  const presentes = piecesPresentes(true).length;
  return {
    fichiers: FICHIERS_CHANTIER.length,
    categories: CATEGORIES_CHANTIER.length,
    piecesAttendues: COUVERTURE.length,
    piecesPresentes: presentes,
    couverturePct: COUVERTURE.length ? Math.round((presentes / COUVERTURE.length) * 100) : 0,
    poidsMo: Math.round(FICHIERS_CHANTIER.reduce((s, f) => s + (f.tailleMo || 0), 0) * 10) / 10,
  };
}

/** Une ligne de résumé, pour l'interface. */
export function resumeChantier() {
  const s = statistiquesChantier();
  return s.fichiers + ' fichiers · ' + s.categories + ' catégories · ' + s.piecesPresentes
    + '/' + s.piecesAttendues + ' pièces du gabarit (' + s.couverturePct + ' %)';
}
`;
}

function principal() {
  const argv = process.argv.slice(2);
  let cheminIndex = '/tmp/monorepo-inspect/docs/DOSSIER-CHANTIER-INDEX.md';
  let sortie = path.join(RACINE, 'src/data/dossierChantier.js');
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--index') cheminIndex = argv[i + 1];
    if (argv[i] === '--sortie') sortie = argv[i + 1];
  }
  const markdown = readFileSync(path.resolve(cheminIndex), 'utf8');
  const empreinte = createHash('sha256').update(markdown).digest('hex').slice(0, 16);
  const contenu = generer({ markdown, nomIndex: path.basename(cheminIndex), empreinte });
  writeFileSync(sortie, contenu);
  console.log(`écrit ${path.relative(RACINE, sortie)} — ${contenu.length} caractères, empreinte ${empreinte}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
