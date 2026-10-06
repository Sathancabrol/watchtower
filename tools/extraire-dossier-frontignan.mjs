#!/usr/bin/env node
/**
 * WATCHTOWER — EXTRACTEUR DU DOSSIER FRONTIGNAN (outil de développement).
 *
 * Le dossier territorial de Frontignan (rapport d'analyse + vision 2026-2040,
 * `projects/frontignan/` du monorepo) est un document markdown de plusieurs
 * centaines de kilooctets, avec 249 sources datées, 13 fiches projets, des
 * tableaux chiffrés et des annexes de lacunes. C'est une matière première
 * précieuse pour la vue INTEL — mais un markdown ne se requête pas.
 *
 * Ce script le transforme en BASE DE DONNÉES : `src/data/frontignanDossier.js`.
 * Il ne résume rien, n'interprète rien, n'ajoute rien. Il range :
 *   · chaque fiche projet §7 (statut, budget, financeurs, calendrier, MŒ,
 *     contenu, enjeux, sources) ;
 *   · chaque tableau chiffré SUIVI de sa ligne « Source » (indicateur, valeur,
 *     évolution, section) ;
 *   · le registre des sources de l'annexe A (libellé, URL, date, type) ;
 *   · les lacunes de l'annexe B (ce qui n'est PAS public) et les vigilances ;
 *   · la vision : forces macro, focale 2030, conditions de succès, scénarios
 *     2040, fragilités du calendrier, signaux faibles.
 *
 * Usage :
 *   node tools/extraire-dossier-frontignan.mjs \
 *     --rapport ../monorepo/projects/frontignan/rapport-frontignan-analyse-territoriale.md \
 *     --vision  ../monorepo/projects/frontignan/vision-frontignan-2026-2040.md \
 *     --sortie  src/data/frontignanDossier.js
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Marqueurs de confiance du rapport, conservés tels quels dans la base. */
export const MARQUEURS = Object.freeze({
  '✅': 'engagé — fait constaté ou acte officiel',
  '📅': 'annoncé — calendrier public',
  '🔮': 'tendance — projection raisonnée',
  '⚠️': 'incertain — à confirmer',
  '❓': 'inconnu — chiffre non publié',
});

/** Options de la ligne de commande. */
function options(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

const nettoyer = (s) => String(s ?? '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')       // images
  .replace(/\*\*/g, '')                        // gras
  .replace(/\[\s*([^\]]+?)\s*\]\((https?:[^)]+)\)/g, '$1') // liens → libellé
  .replace(/\s+/g, ' ')
  .trim();

/** Marqueurs présents dans un texte. */
function marqueursDe(texte) {
  return Object.keys(MARQUEURS).filter((m) => String(texte ?? '').includes(m));
}

/**
 * Parse un tableau markdown en lignes brutes.
 * @returns {{entetes: string[], lignes: string[][]}|null}
 */
function tableauBloc(lignes) {
  if (!Array.isArray(lignes) || lignes.length < 2) return null;
  const decouper = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const entetes = decouper(lignes[0]);
  const corps = lignes.slice(2).filter((l) => l.trim().startsWith('|')).map(decouper);
  if (!entetes.length || !corps.length) return null;
  return { entetes, lignes: corps };
}

/** Toutes les lignes `| … |` d'un texte, groupées en tableaux consécutifs. */
function tableauxDu(texte) {
  const sortie = [];
  const lignes = String(texte ?? '').split('\n');
  let courant = [];
  let creer = (apres) => sortie.push({ tableau: tableauBloc(courant), apres });
  for (let i = 0; i < lignes.length; i += 1) {
    const ligne = lignes[i];
    if (ligne.trim().startsWith('|')) courant.push(ligne);
    else if (courant.length) {
      // Ce qui suit le tableau porte la source : on garde les lignes utiles.
      const apres = [];
      for (let j = i; j < lignes.length && apres.length < 3; j += 1) {
        const t = lignes[j].trim();
        if (t.startsWith('|') || t.startsWith('#') || /^!\[/.test(t)) break;
        if (t) apres.push(t);
      }
      creer(apres);
      courant = [];
    }
  }
  if (courant.length) creer([]);
  return sortie.filter((t) => t.tableau);
}

/** Sources `[libellé](url)` d'un texte. */
function liensDe(texte) {
  const out = [];
  const re = /\[([^\]]+?)\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(String(texte ?? '')))) out.push({ libelle: nettoyer(m[1]), url: m[2] });
  return out;
}

/** Découpe un markdown en sections `## ` puis `### `. */
function sections(markdown) {
  const out = [];
  let courante = { niveau: 0, titre: 'Document', corps: [] };
  for (const ligne of String(markdown ?? '').split('\n')) {
    const m = /^(#{2,3})\s+(.*)$/.exec(ligne);
    if (m) {
      out.push(courante);
      courante = { niveau: m[1].length, titre: nettoyer(m[2]), corps: [] };
    } else courante.corps.push(ligne);
  }
  out.push(courante);
  return out;
}

// ───────────────────────── sections du rapport ─────────────────────────

/** Les 13 fiches projets de la section §7. */
export function extraireProjets(markdown) {
  const projets = [];
  for (const section of sections(markdown)) {
    const titre = /^7\.(\d+)\s+(.*)$/.exec(section.titre);
    if (section.niveau !== 3 || !titre) continue;
    const corps = section.corps.join('\n');
    const tableaux = tableauxDu(corps);
    const champs = {};
    for (const { tableau } of tableaux) {
      for (const ligne of tableau.lignes) {
        if (ligne.length < 2) continue;
        const cle = nettoyer(ligne[0]).toLowerCase();
        if (cle && !champs[cle]) champs[cle] = nettoyer(ligne.slice(1).join(' | '));
      }
    }
    // Les sources d'une fiche : la ligne « Sources : … » ou tous les liens du bloc.
    const ligneSources = corps.split('\n').filter((l) => /^\s*(\*\*)?Sources?(\*\*)?\s*:/.test(l));
    const sources = liensDe(ligneSources.length ? ligneSources.join(' ') : corps);
    const urlsVues = new Set();
    const projet = {
      numero: Number(titre[1]),
      id: `projet-7-${titre[1]}`,
      titre: nettoyer(titre[2]),
      nom: champs.nom || nettoyer(titre[2]),
      statut: champs.statut || null,
      budget: champs.budget || champs['coût'] || null,
      financeurs: champs.financeurs || null,
      calendrier: champs.calendrier || null,
      maitre_oeuvre: champs['mœ'] || champs['maîtrise d’œuvre'] || null,
      contenu: champs.contenu || null,
      enjeux: champs['enjeux design'] || null,
      aTableau: Object.keys(champs).length > 0,
      marqueurs: marqueursDe(corps),
      sources: sources.filter((s) => (urlsVues.has(s.url) ? false : urlsVues.add(s.url))),
      // Une fiche peut n'avoir aucun lien (ex. §7.11) : c'est une information,
      // pas une erreur — la base le dit au lieu de le masquer.
      sansLien: sources.length === 0,
      // Le texte non tabulé est conservé : c'est là que vivent les nuances.
      narratif: nettoyer(tableaux.length
        ? corps.split('\n').filter((l) => !l.trim().startsWith('|') && !/^!\[/.test(l.trim())).join(' ')
        : corps),
    };
    projets.push(projet);
  }
  return projets;
}

/**
 * Les tableaux CHIFFRÉS du rapport : tout tableau dont la première colonne
 * nomme un indicateur et qui est suivi, dans les lignes qui viennent, d'une
 * ligne « Source ». Sans source, on ne garde pas — règle maison.
 */
export function extraireChiffres(markdown) {
  const chiffres = [];
  const sectionsRapport = sections(markdown);
  for (const section of sectionsRapport) {
    const num = /^(\d+(?:\.\d+)?)\.?\s/.exec(section.titre);
    const texte = section.corps.join('\n');
    for (const { tableau, apres } of tableauxDu(texte)) {
      const ligneSource = (apres || []).find((l) => /^\**\s*sources?\b/i.test(l));
      const entete = tableau.entetes.join(' ').toLowerCase();
      const pertinent = /indicateur|critère|opération|fragilité|élément|chiffre|volet|thème/.test(entete);
      if (!ligneSource || !pertinent) continue;
      if (/^7\./.test(section.titre)) continue; // déjà dans les projets
      for (const ligne of tableau.lignes) {
        const [cle, valeur, evolution] = ligne;
        const indicateur = nettoyer(cle);
        if (!indicateur || !valeur) continue;
        chiffres.push({
          section: section.titre.slice(0, 6).trim(),
          domaine: nettoyer(section.titre.replace(/^\d+(\.\d+)?\s*/, '')).slice(0, 60),
          indicateur,
          valeur: nettoyer(valeur),
          evolution: nettoyer(evolution) || null,
          marqueurs: marqueursDe(ligne.join(' ') + ' ' + ligneSource),
          source: nettoyer(ligneSource).replace(/^Sources?\s*\w*\s*:\s*/i, '').slice(0, 240),
          liens: liensDe(ligneSource),
        });
      }
    }
  }
  return chiffres;
}

/**
 * Le registre des sources de l'annexe A : trois sous-tableaux (officielles,
 * presse, juridiques). On travaille sur la ZONE BRUTE du markdown, parce que
 * la découpe en sections s'arrête aux sous-titres et perdrait les tableaux.
 */
export function extraireSources(markdown) {
  const sources = [];
  const vus = new Set();
  const debut = String(markdown).indexOf('## ANNEXE A');
  if (debut < 0) return sources;
  const fin = String(markdown).indexOf('## ANNEXE B', debut);
  const zone = String(markdown).slice(debut, fin > 0 ? fin : undefined);
  let type = 'officielle';
  let famille = 'A.1';
  for (const ligne of zone.split('\n')) {
    const t = /^###\s+(A\.\d)\s+(.*)$/.exec(ligne.trim());
    if (t) {
      famille = t[1];
      const titre = t[2].toLowerCase();
      type = titre.includes('presse') ? 'presse' : titre.includes('juridique') ? 'juridique' : 'officielle';
      continue;
    }
    if (!ligne.trim().startsWith('|')) continue;
    const cellules = ligne.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
    if (cellules.length < 2 || cellules.every((c) => /^:?-+:?$/.test(c))) continue;
    const premier = nettoyer(cellules[0]);
    if (/^(source|médium|medium)$/i.test(premier)) continue; // en-tête
    const liens = liensDe(cellules.slice(0, 2).join(' '));
    if (!liens.length) continue;
    const url = liens[0].url;
    if (vus.has(url)) continue;
    vus.add(url);
    const derniere = cellules[cellules.length - 1];
    const date = /(\d{2}\/\d{2}\/\d{4})/.exec(derniere)?.[1] || null;
    sources.push({
      id: `src-${sources.length + 1}`,
      famille,
      type,
      medium: premier.slice(0, 80),
      libelle: liens[0].libelle.slice(0, 140),
      contenu: nettoyer(cellules[1]).slice(0, 220),
      url,
      date,
      toutes_urls: liens.map((l) => l.url),
    });
  }
  return sources;
}

/** Annexe B : contradictions, données manquantes, vigilances (zone brute). */
export function extraireLimites(markdown) {
  const sortie = { contradictions: [], lacunes: [], vigilances: [] };
  const debut = String(markdown).indexOf('## ANNEXE B');
  if (debut < 0) return sortie;
  const apres = String(markdown).slice(debut + 3);           // on saute « ## »
  const fin = apres.indexOf('\n## ', 1);                    // fin du rapport
  const zone = apres.slice(0, fin > 0 ? fin : undefined);
  const bloc = (debutBloc, finBloc) => {
    const i = zone.indexOf(debutBloc);
    if (i < 0) return '';
    const j = finBloc ? zone.indexOf(finBloc, i) : -1;
    return zone.slice(i, j > 0 ? j : undefined);
  };
  const listeNumerotee = (t) => [...t.matchAll(/^\s*\d+\.\s+(.+)$/gm)].map((m) => nettoyer(m[1]));
  const listePuce = (t) => [...t.matchAll(/^\s*[-*]\s+(.+)$/gm)].map((m) => nettoyer(m[1]));

  const zoneB1 = bloc('B.1', 'B.2');
  const { tableau: tB1 } = tableauxDu(zoneB1)[0] || {};
  sortie.contradictions = tB1
    ? tB1.lignes.map((l) => ({ sujet: nettoyer(l[0]), conflit: nettoyer(l[1]), traitement: nettoyer(l[2]) || null }))
    : [];
  sortie.lacunes = listeNumerotee(bloc('B.2', 'B.3')).map((texte, i) => {
    const angle = /point d.angle mort n°(\d)/i.exec(texte);
    return { rang: i + 1, texte, angleMort: angle ? Number(angle[1]) : null };
  });
  sortie.vigilances = listePuce(bloc('B.3', '---'));
  return sortie;
}

// ───────────────────────── vision ─────────────────────────

/** Les trois scénarios 2040 et leurs moteurs. */
export function extraireScenarios(vision) {
  const section = sections(vision).find((s) => /SCÉNARIOS 2040/i.test(s.titre));
  if (!section) return [];
  const { tableau } = tableauxDu(section.corps.join('\n'))[0] || {};
  if (!tableau) return [];
  const colonnes = tableau.entetes.map((c) => nettoyer(c)).slice(1);
  const scenarios = colonnes.map((nom) => ({
    nom: nom.replace(/^S\d\s*—\s*/, '').replace('★', '').trim(),
    brut: nom,
    recommande: nom.includes('★'),
    criteres: [],
  }));
  for (const ligne of tableau.lignes) {
    const cle = nettoyer(ligne[0]);
    for (let i = 0; i < scenarios.length; i += 1) {
      const valeur = nettoyer(ligne[i + 1]);
      if (valeur) scenarios[i].criteres.push({ critere: cle, valeur });
    }
  }
  return scenarios;
}

/** Les conditions de succès de la focale 2030. */
export function extraireConditions(vision) {
  const section = sections(vision).find((s) => /FOCUS 2030/i.test(s.titre));
  if (!section) return { points: [], conditions: [], population2030: null };
  const texte = section.corps.join('\n');
  const points = [...texte.matchAll(/^\s*\d+\.\s+(.+)$/gm)].map((m) => nettoyer(m[1]));
  const blocCond = texte.slice(texte.indexOf('conditions de succès'));
  const conditions = blocCond.split(';').map((c) => nettoyer(c)).filter((c) => c.length > 12 && c.length < 240);
  const pop = /≈\s*\*\*([\d\s]{5,7})\s*[-–]\s*([\d\s]{5,7})\s*habitants\*\*/.exec(texte);
  return {
    points,
    conditions,
    population2030: pop ? [Number(pop[1].replace(/\s/g, '')), Number(pop[2].replace(/\s/g, ''))] : null,
  };
}

/** Fragilités du calendrier (§6 de la vision). */
export function extraireFragilites(vision) {
  const section = sections(vision).find((s) => /FRAGILITÉ DU CALENDRIER/i.test(s.titre));
  if (!section) return [];
  const { tableau } = tableauxDu(section.corps.join('\n'))[0] || {};
  if (!tableau) return [];
  return tableau.lignes.map((l) => ({
    fragilite: nettoyer(l[0]),
    detail: nettoyer(l[1]),
    parade: nettoyer(l[2]) || null,
    marqueurs: marqueursDe(l.join(' ')),
  }));
}

/** Les signaux faibles cités dans la vision (à surveiller 2026-2030). */
export function extraireSignaux(vision) {
  const m = /signaux faibles[^*]*\*\*\s*:\s*([^\n]+)/i.exec(vision);
  if (!m) return [];
  return m[1].split(';').map((s) => nettoyer(s)).filter((s) => s.length > 5);
}

/** Les forces macro (§1) — quatre titres. */
export function extraireForces(vision) {
  return sections(vision)
    .filter((s) => s.niveau === 3 && /^\d\.\d\s/.test(s.titre))
    .map((s) => ({ titre: s.titre.replace(/^\d\.\d\s*/, ''), resume: nettoyer(s.corps.join(' ')).slice(0, 700) }));
}

// ───────────────────────── sortie ─────────────────────────

const echapper = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
const ligne = (o, indentation = '  ') => `${indentation}{ ${Object.entries(o)
  .map(([k, v]) => {
    if (v === null || v === undefined) return `${k}: null`;
    if (Array.isArray(v)) return `${k}: [${v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : `'${echapper(x)}'`)).join(', ')}]`;
    if (typeof v === 'number' || typeof v === 'boolean') return `${k}: ${v}`;
    if (typeof v === 'object') return `${k}: ${JSON.stringify(v)}`;
    return `${k}: '${echapper(v)}'`;
  })
  .join(', ')} },`;

export function generer({ rapport, vision, nomRapport, nomVision, empreinte }) {
  const projets = extraireProjets(rapport);
  const chiffres = extraireChiffres(rapport);
  const sources = extraireSources(rapport);
  const limites = extraireLimites(rapport);
  const scenarios = extraireScenarios(vision);
  const conditions = extraireConditions(vision);
  const fragilites = extraireFragilites(vision);
  const signaux = extraireSignaux(vision);
  const forces = extraireForces(vision);

  return `/**
 * WATCHTOWER — DOSSIER TERRITORIAL DE FRONTIGNAN (base de données).
 *
 * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Généré par \`tools/extraire-dossier-frontignan.mjs\` depuis :
 *   · ${nomRapport} — analyse territoriale, 11 sections, ${projets.length} fiches projets
 *   · ${nomVision} — vision 2026-2040 (focale 2030)
 *
 * Empreinte des sources : ${empreinte}
 *
 * Ce qui est ici : chaque chiffre du dossier AVEC sa section et sa source,
 * chaque projet §7 avec son statut, son budget, ses financeurs, son calendrier
 * et ses liens, le registre des sources (annexe A), les LACUNES (annexe B — ce
 * qui n'est PAS public), les scénarios 2040 et les fragilités de calendrier.
 *
 * Ce qui n'y est pas : aucune donnée ajoutée par l'extracteur. Les tableaux de
 * ce fichier sont une COPIE STRUCTURÉE du dossier ; quand le dossier dit
 * « montants non publiés ❓ », la base dit la même chose. Les marqueurs du
 * rapport sont conservés (voir \`MARQUEURS\`).
 */

/** Marqueurs de confiance du dossier, conservés tels quels. */
export const MARQUEURS = Object.freeze(${JSON.stringify(MARQUEURS, null, 2).replace(/\n/g, '\n')});

/** Provenance : d'où vient cette base, et de quand. */
export const PROVENANCE = Object.freeze({
  rapport: '${echapper(nomRapport)}',
  vision: '${echapper(nomVision)}',
  empreinte: '${empreinte}',
  document: 'Rapport d’analyse territoriale multimodal — Frontignan la Peyrade (34110, Hérault, Occitanie)',
  date: '2026-09-08',
  methode: 'Sources croisées et datées ; marqueurs ✅ engagé / 📅 annoncé / 🔮 tendance / ⚠️ incertain ; estimations propres distinguées des prévisions officielles.',
  avertissement: 'Les jugements stratégiques (SWOT, recommandations) sont ceux de l’auteur du rapport ; la base les cite, elle ne les valide pas.',
});

/** Les 13 fiches projets de la section §7 du rapport. */
export const PROJETS = Object.freeze([
${projets.map((p) => ligne(p)).join('\n')}
]);

/** Les chiffres du dossier, chacun suivi de sa source. */
export const CHIFFRES = Object.freeze([
${chiffres.map((c) => ligne(c)).join('\n')}
]);

/** Le registre des sources de l'annexe A (officielles, presse, juridiques). */
export const SOURCES = Object.freeze([
${sources.map((s) => ligne(s)).join('\n')}
]);

/** Ce que le dossier N'A PAS pu établir (annexe B.2) — la liste des trous. */
export const LACUNES = Object.freeze([
${limites.lacunes.map((l) => ligne(l)).join('\n')}
]);

/** Contradictions détectées entre sources (annexe B.1). */
export const CONTRADICTIONS = Object.freeze([
${limites.contradictions.map((c) => ligne(c)).join('\n')}
]);

/** Points de vigilance méthodologique (annexe B.3). */
export const VIGILANCES = Object.freeze([
${limites.vigilances.map((l) => `  '${echapper(l)}',`).join('\n')}
]);

/** La vision : forces macro, focale 2030, scénarios 2040, fragilités, signaux. */
export const VISION = Object.freeze({
  forces: Object.freeze([
${forces.map((f) => ligne(f, '    ')).join('\n')}
  ]),
  population2030: ${conditions.population2030 ? JSON.stringify(conditions.population2030) : 'null'},
  points2030: Object.freeze([
${conditions.points.map((p) => `    '${echapper(p)}',`).join('\n')}
  ]),
  conditions: Object.freeze([
${conditions.conditions.map((c) => `    '${echapper(c)}',`).join('\n')}
  ]),
  scenarios: Object.freeze([
${scenarios.map((s) => ligne(s, '    ')).join('\n')}
  ]),
  fragilites: Object.freeze([
${fragilites.map((f) => ligne(f, '    ')).join('\n')}
  ]),
  signaux: Object.freeze([
${signaux.map((s) => `    '${echapper(s)}',`).join('\n')}
  ]),
});

// ───────────────────────── accès ─────────────────────────

/** Un projet par son identifiant ou son numéro de section. */
export function projet(cle) {
  if (cle === null || cle === undefined) return null;
  const brut = String(cle);
  return PROJETS.find((p) => p.id === brut || String(p.numero) === brut || String(p.numero) === brut.replace(/^7\\.?/, '')) || null;
}

/** Les projets dont le statut contient l'un des mots demandés. */
export function projetsParStatut(...mots) {
  const cibles = mots.length ? mots.map((m) => String(m).toLowerCase()) : [];
  if (!cibles.length) return [...PROJETS];
  return PROJETS.filter((p) => cibles.some((m) => String(p.statut || '').toLowerCase().includes(m)));
}

/** La valeur d'un chiffre, par recherche sur son indicateur. */
export function chiffre(fragment) {
  const t = String(fragment || '').toLowerCase();
  return CHIFFRES.find((c) => c.indicateur.toLowerCase().includes(t)) || null;
}

/** Les chiffres d'un domaine (section du rapport). */
export function chiffresDe(section) {
  const s = String(section || '');
  return CHIFFRES.filter((c) => c.section.startsWith(s));
}

/** Les sources dont le libellé ou le contenu parle de quelque chose. */
export function sourcesDe(texte) {
  const t = String(texte || '').toLowerCase();
  if (!t) return [...SOURCES];
  return SOURCES.filter((s) => (s.libelle + ' ' + s.contenu + ' ' + s.medium).toLowerCase().includes(t));
}

/** Les sources d'une famille (officielle, presse, juridique). */
export function sourcesParType(type) {
  return type ? SOURCES.filter((s) => s.type === type) : [...SOURCES];
}

/** Un scénario par son nom. */
export function scenario(fragment) {
  const t = String(fragment || '').toLowerCase();
  return VISION.scenarios.find((s) => s.nom.toLowerCase().includes(t) || s.brut.toLowerCase().includes(t)) || null;
}

/** Compte ce que la base contient — pour le bandeau du module. */
export function statistiquesDossier() {
  return {
    projets: PROJETS.length,
    projetsAvecBudget: PROJETS.filter((p) => p.budget && !/non (chiffré|publié)|❓/i.test(p.budget)).length,
    projetsSansLien: PROJETS.filter((p) => p.sansLien).length,
    chiffres: CHIFFRES.length,
    sources: SOURCES.length,
    sourcesParFamille: SOURCES.reduce((m, s) => ({ ...m, [s.famille]: (m[s.famille] || 0) + 1 }), {}),
    sourcesAvecDate: SOURCES.filter((s) => s.date).length,
    lacunes: LACUNES.length,
    scenarios: VISION.scenarios.length,
    fragilites: VISION.fragilites.length,
    signaux: VISION.signaux.length,
  };
}

/**
 * Contrôles d'intégrité de la base générée. Aucun jugement sur le fond :
 * uniquement ce qui doit être vrai d'un fichier rangé proprement.
 */
export function verifierDossier() {
  const problemes = [];
  const ids = new Set();
  for (const p of PROJETS) {
    if (ids.has(p.id)) problemes.push('projet en double : ' + p.id);
    ids.add(p.id);
    if (!p.titre) problemes.push(p.id + ' : sans titre');
    for (const s of p.sources) if (!/^https?:\\/\\//.test(s.url)) problemes.push(p.id + ' : URL invalide ' + s.url);
  }
  for (const s of SOURCES) if (!/^https?:\\/\\//.test(s.url)) problemes.push('source ' + s.id + ' : URL invalide');
  const nomsScenarios = new Set();
  for (const s of VISION.scenarios) {
    if (nomsScenarios.has(s.nom)) problemes.push('scénario en double : ' + s.nom);
    nomsScenarios.add(s.nom);
  }
  return { ok: problemes.length === 0, problemes, controle: PROJETS.length + SOURCES.length };
}

/** Ligne de résumé pour un bandeau ou un CSV. */
export function resumeDossier() {
  const s = statistiquesDossier();
  return s.projets + ' projets · ' + s.chiffres + ' chiffres · ' + s.sources + ' sources datées ' + s.sourcesAvecDate + ' · ' + s.lacunes + ' lacunes';
}
`;
}

// ───────────────────────── point d'entrée ─────────────────────────

function principal() {
  const args = options(process.argv.slice(2));
  const cheminRapport = path.resolve(args.rapport || path.join(RACINE, '../monorepo/projects/frontignan/rapport-frontignan-analyse-territoriale.md'));
  const cheminVision = path.resolve(args.vision || path.join(RACINE, '../monorepo/projects/frontignan/vision-frontignan-2026-2040.md'));
  const sortie = path.resolve(args.sortie || path.join(RACINE, 'src/data/frontignanDossier.js'));
  const rapport = readFileSync(cheminRapport, 'utf8');
  const vision = readFileSync(cheminVision, 'utf8');
  const empreinte = createHash('sha256').update(rapport + vision).digest('hex').slice(0, 16);
  const contenu = generer({
    rapport,
    vision,
    nomRapport: path.basename(cheminRapport),
    nomVision: path.basename(cheminVision),
    empreinte,
  });
  writeFileSync(sortie, contenu);
  console.log(`écrit ${path.relative(RACINE, sortie)} — ${contenu.length} caractères, empreinte ${empreinte}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
