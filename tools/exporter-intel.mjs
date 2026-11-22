#!/usr/bin/env node
/**
 * WATCHTOWER — EXPORT DE LA BASE INTEL (outil de développement).
 *
 * Écrit, dans `public/data/intel/`, la base territoriale sous une forme que
 * N'IMPORTE QUELLE autre branche ou dépôt peut lire sans connaître le code de
 * Watchtower :
 *
 *   · watchtower-intel.json — le document complet sous contrat `watchtower.intel@1.0.0`
 *     (lieux, projets, indicateurs, sources, lacunes, vision, statistiques) ;
 *   · projets.csv, communes-thau.csv, indicateurs.csv, sources.csv, veille.csv,
 *     lacunes.csv — les mêmes données à plat, séparateur « ; », UTF-8.
 *
 * Le JSON est aussi servi par l'application (`/data/intel/watchtower-intel.json`),
 * donc récupérable depuis un aperçu, un script Python ou un autre dépôt.
 *
 * Usage : node tools/exporter-intel.mjs [--sortie public/data/intel]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { tousLesCsv, versJson } from '../src/dossierIntel.js';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function principal() {
  const argv = process.argv.slice(2);
  let sortie = path.join(RACINE, 'public/data/intel');
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === '--sortie') sortie = path.resolve(argv[i + 1]);
  mkdirSync(sortie, { recursive: true });

  const genereLe = new Date().toISOString().slice(0, 10);
  const json = versJson({ genereLe });
  const cheminJson = path.join(sortie, 'watchtower-intel.json');
  writeFileSync(cheminJson, JSON.stringify(json, null, 1) + '\n');

  const csv = tousLesCsv();
  for (const [nom, contenu] of Object.entries(csv)) writeFileSync(path.join(sortie, nom), contenu);

  const tailles = Object.entries({ 'watchtower-intel.json': JSON.stringify(json), ...csv })
    .map(([n, c]) => `${n} (${(c.length / 1024).toFixed(0)} ko)`).join(', ');
  console.log(`export INTEL → ${path.relative(RACINE, sortie)} : ${tailles}`);
  console.log(`contrat ${json.contrat}@${json.version} · ${json.entites.projets.length} projets · `
    + `${json.entites.indicateurs.length} indicateurs · ${json.entites.sources.length} sources · `
    + `${json.entites.lacunes.length} lacunes`);
}

principal();
