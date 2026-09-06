/**
 * GARDE-FOUS — tests structurels.
 *
 * Ces tests ne vérifient pas une fonctionnalité : ils empêchent les trois
 * pannes déjà rencontrées de revenir en silence (voir
 * `docs/DIAGNOSTIC.md` §4 et §6).
 *
 *   1. **Deux fonctions du même nom, au même niveau, dans un même fichier.**
 *      C'est le bug de l'itération 10 : dans `flightMode.js`, deux
 *      `function rendreListe()` coexistaient dans le même scope. Les
 *      déclarations de fonction sont remontées (hoisting) : la SECONDE
 *      écrasait la première pour tous les appels, et elle touchait
 *      `elListeParcours` — une `const` déclarée plus bas, donc en zone morte
 *      temporelle (TDZ). Une seule exception au démarrage privait alors
 *      l'application du lanceur, du poste, d'INTEL et de dix autres modules.
 *
 *   2. **Un `display: none !important` posé en ligne.** Un style inline
 *      `!important` écrase toutes les feuilles de style : c'est ainsi que le
 *      bandeau d'info live était devenu impossible à réafficher. Seul le
 *      pilotage volontaire des CALQUES a le droit de le faire.
 *
 *   3. **La capture d'erreurs doit précéder toute initialisation.** Sans ça,
 *      une erreur de démarrage ne laisse aucune trace et l'écran reste vide
 *      sans explication.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const RACINE = new URL('.', import.meta.url).pathname;

/** Tous les fichiers source (hors tests et dossiers techniques). */
function fichiersSource() {
  const out = [];
  const parcours = (dir) => {
    for (const nom of readdirSync(dir)) {
      if (nom === 'node_modules' || nom.startsWith('.')) continue;
      const chemin = join(dir, nom);
      if (statSync(chemin).isDirectory()) parcours(chemin);
      else if (nom.endsWith('.js') && !nom.includes('.test.')) out.push(chemin);
    }
  };
  parcours(RACINE);
  return out;
}

/**
 * Déclarations `function nom(` avec leur indentation, par fichier.
 * Deux fonctions de même nom ET de même indentation dans un même fichier
 * sont presque toujours un écrasement involontaire (hoisting).
 */
function declarations(contenu) {
  return contenu.split('\n')
    .map((ligne, i) => {
      const m = /^(\s*)function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(ligne);
      return m ? { indentation: m[1].length, nom: m[2], ligne: i + 1 } : null;
    })
    .filter(Boolean);
}

test('aucune fonction n’est déclarée deux fois au même niveau dans un même fichier', () => {
  const doublons = [];
  for (const f of fichiersSource()) {
    const vues = new Map();
    for (const d of declarations(readFileSync(f, 'utf8'))) {
      const cle = `${d.indentation}:${d.nom}`;
      if (vues.has(cle)) doublons.push(`${f.replace(RACINE, '')} → « ${d.nom} » lignes ${vues.get(cle)} et ${d.ligne}`);
      else vues.set(cle, d.ligne);
    }
  }
  assert.deepEqual(doublons, [], `doublons trouvés :\n${doublons.join('\n')}`);
});

test('le test ci-dessus détecte bien le piège (il n’est pas aveugle)', () => {
  const exemple = [
    'function rendre() {',
    '  return 1;',
    '}',
    'function autree() { return 0; }',
    'function rendre() { return 2; }',
  ].join('\n');
  const vues = new Map();
  const doublons = [];
  for (const d of declarations(exemple)) {
    const cle = `${d.indentation}:${d.nom}`;
    if (vues.has(cle)) doublons.push(d.nom);
    else vues.set(cle, d.ligne);
  }
  assert.deepEqual(doublons, ['rendre'], 'le détecteur doit repérer la fonction écrasée');
});

test('aucun `display: none !important` en ligne, sauf le pilotage des CALQUES', () => {
  const interdits = [];
  for (const f of fichiersSource()) {
    const court = f.replace(RACINE, '');
    if (court === 'calques.js') continue; // seul endroit autorisé : il pilote le bandeau
    const contenu = readFileSync(f, 'utf8');
    if (/setProperty\(\s*['"]display['"]\s*,\s*['"]none['"]\s*,\s*['"]important['"]\s*\)/.test(contenu)) {
      interdits.push(court);
    }
  }
  assert.deepEqual(interdits, [], `style inline !important interdit dans : ${interdits.join(', ')}`);
});

test('la capture d’erreurs est installée avant toute initialisation dans main.js', () => {
  const contenu = readFileSync(join(RACINE, 'main.js'), 'utf8');
  const debut = contenu.indexOf('async function init() {');
  assert.ok(debut > 0, 'main.js doit contenir async function init()');
  const corps = contenu.slice(debut);
  const capture = corps.indexOf('capturerErreurs()');
  assert.ok(capture > 0, 'capturerErreurs() doit être appelée dans init()');
  const premierInit = corps.search(/\binit[A-Z]/);
  assert.ok(premierInit > capture,
    `capturerErreurs() (position ${capture}) doit précéder le premier init (position ${premierInit}) dans init()`);
});

test('le diagnostic est accessible : raccourci F3 et bouton de secours « tout réafficher »', () => {
  const diag = readFileSync(join(RACINE, 'diagnostic.js'), 'utf8');
  assert.match(diag, /F3/, 'le raccourci F3 doit ouvrir le diagnostic');
  assert.match(diag, /toutReafficher/, 'il doit exister une fonction « tout réafficher »');
  const main = readFileSync(join(RACINE, 'main.js'), 'utf8');
  assert.match(main, /__wtToutReafficher/, 'un raccourci global doit exister');
});
