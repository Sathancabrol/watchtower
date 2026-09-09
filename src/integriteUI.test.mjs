/**
 * 🔒 GARDE-FOU D'INTEGRITE UI
 *
 * Une fonction ne doit JAMAIS devenir inatteignable. Ce test relit les sources
 * et verifie que tout ce qui est enregistre quelque part possede au moins un
 * point d'entree visible.
 *
 * Il a ete ecrit apres une vraie regression : masquer le rail du dock avait
 * rendu 7 fonctions invisibles (calques, partage, vue de rue, photo, palais,
 * affichage, diag) sans qu aucun test ne bronche.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8');
const BARRE = lire('barreFonctions.js');
const MAIN = lire('main.js');
const DOCK = lire('mobiDock.js');

/** Tout ce que la barre sait ouvrir. */
const exposes = new Set([
  ...[...BARRE.matchAll(/dock:\s*'([^']+)'/g)].map((m) => m[1]),
  ...[...BARRE.matchAll(/cible:\s*'([^']+)'/g)].map((m) => m[1]),
]);

test('aucune ancre du dock ne reste sans point d entree', () => {
  const ancres = [...MAIN.matchAll(/id:\s*'([a-z0-9-]+)',\s*icone/g)].map((m) => m[1]);
  const perdues = ancres.filter((id) => !exposes.has(id));
  assert.deepEqual(perdues, [],
    `Ancres injoignables : ${perdues.join(', ')}. Ajoute-les a CATEGORIES.`);
});

test('aucun panneau existant ne reste sans point d entree', () => {
  const cibles = [...MAIN.matchAll(/cibleId:\s*'([^']+)'/g)].map((m) => m[1]);
  const perdus = cibles.filter((id) => !exposes.has(id));
  assert.deepEqual(perdus, [],
    `Panneaux injoignables : ${perdus.join(', ')}. Le rail du dock est masque, `
    + 'donc ils ont besoin d une entree dans la barre.');
});

test('la barre ne reference rien qui n existe pas', () => {
  const connus = new Set([
    ...[...MAIN.matchAll(/id:\s*'([a-z0-9-]+)',\s*icone/g)].map((m) => m[1]),
    ...[...MAIN.matchAll(/cibleId:\s*'([^']+)'/g)].map((m) => m[1]),
  ]);
  const mortes = [...exposes].filter((id) => !connus.has(id));
  assert.deepEqual(mortes, [], `References mortes : ${mortes.join(', ')}`);
});

test('les boutons injectes au runtime sont recuperes par la barre', () => {
  // dock.ranger() vise le rail, qui est masque : sans renvoi ils disparaissent.
  assert.ok(/ranger\?\.\(/.test(MAIN), 'des modules utilisent encore ranger()');
  assert.ok(BARRE.includes('accueillir'), 'la barre doit savoir accueillir un bouton');
  assert.ok(MAIN.includes('_barre.accueillir(btn)'),
    'ranger() doit etre detourne vers la barre');
});

test('le rail masque ne casse pas la hauteur publiee du dock', () => {
  // --wt-hauteur-dock positionne les panneaux ancres : la forcer a 0 les casse.
  assert.ok(DOCK.includes('--wt-hauteur-dock'), 'le dock publie sa hauteur');
  assert.ok(!/#wt-dock\s*\{[^}]*max-height:\s*0/.test(BARRE),
    'max-height:0 sur #wt-dock corrompt --wt-hauteur-dock');
});

test('les fonctions signalees comme perdues par l utilisateur sont presentes', () => {
  // CONTEXTE, CCTV, epoques, cadastre, radio, bati : plaintes explicites.
  for (const id of ['wt-intel', 'cam', 'temps', 'bati', 'cadastre', 'radio']) {
    assert.ok(exposes.has(id), `${id} doit rester atteignable`);
  }
  // Calques et partage vivent dans top-center-actions.
  assert.ok(exposes.has('top-center-actions'), 'calques et partage atteignables');
});
