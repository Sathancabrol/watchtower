// src/vuesIntel.test.mjs — vues de l'INTEL (registre, partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES_FIL } from './filInfo.js';
import { VUES_INTEL, RENDUS } from './vuesIntel.js';

test('les vues demandées sont toutes présentes', () => {
  const cles = VUES_INTEL.map((v) => v.cle);
  for (const c of ['jumeau', 'communal', 'individuel', 'politique', 'economique', 'production']) {
    assert.ok(cles.includes(c), `vue manquante : ${c}`);
  }
});

test('chaque vue est complète : icône, nom, sous-titre, renderu', () => {
  const vues = new Set();
  for (const v of VUES_INTEL) {
    assert.ok(!vues.has(v.cle), `clé dupliquée : ${v.cle}`);
    vues.add(v.cle);
    assert.ok(v.ic && v.nom && v.sous, `vue incomplète : ${v.cle}`);
    assert.equal(typeof RENDUS[v.cle], 'function', `pas de rendu pour ${v.cle}`);
  }
});

test('chaque vue correspond à une catégorie du fil d’informations', () => {
  for (const v of VUES_INTEL) {
    assert.ok(CATEGORIES_FIL.includes(v.cle), `${v.cle} n’a pas de bandeau de fil`);
  }
});
