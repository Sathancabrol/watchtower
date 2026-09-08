import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_REPRISES, FENETRE_OUBLI_MS, estRecuperable, deciderReprise, messageUtilisateur,
} from './reprisRendu.js';

test('estRecuperable reconnait les incidents graphiques connus', () => {
  assert.ok(estRecuperable(new Error('maximumTextureSize must be greater than zero')));
  assert.ok(estRecuperable(new Error('WebGL context lost')));
  assert.ok(estRecuperable('CONTEXT_LOST_WEBGL'));
  assert.ok(estRecuperable(new Error('Out of memory')));
  assert.ok(estRecuperable(new Error('framebuffer incomplete')));
});

test('estRecuperable ecarte les vraies erreurs applicatives', () => {
  assert.equal(estRecuperable(new Error('commune introuvable')), false);
  assert.equal(estRecuperable(new TypeError('x is not a function')), false);
  for (const rien of [null, undefined, '', '   ', 0]) {
    assert.equal(estRecuperable(rien), false, `doit ecarter ${JSON.stringify(rien)}`);
  }
});

test('un incident graphique isole declenche une reprise rapide', () => {
  const d = deciderReprise({ erreur: new Error('maximumTextureSize'), reprises: 0, dernierIncidentMs: null, maintenantMs: 1000 });
  assert.equal(d.reprendre, true);
  assert.equal(d.reprises, 1);
  assert.equal(d.delaiMs, 500);
});

test('le delai croit a chaque recidive rapprochee', () => {
  const base = { erreur: new Error('context lost'), dernierIncidentMs: 1000, maintenantMs: 2000 };
  assert.equal(deciderReprise({ ...base, reprises: 1 }).delaiMs, 1000);
  assert.equal(deciderReprise({ ...base, reprises: 2 }).delaiMs, 2000);
});

test('au-dela du plafond, on cesse de retenter', () => {
  const d = deciderReprise({
    erreur: new Error('WebGL'), reprises: MAX_REPRISES, dernierIncidentMs: 1000, maintenantMs: 2000,
  });
  assert.equal(d.reprendre, false);
  assert.match(d.raison, /trop de reprises/);
});

test('apres une longue periode saine, le compteur repart de zero', () => {
  const d = deciderReprise({
    erreur: new Error('WebGL'),
    reprises: MAX_REPRISES,
    dernierIncidentMs: 1000,
    maintenantMs: 1000 + FENETRE_OUBLI_MS + 1,
  });
  assert.equal(d.reprendre, true, 'un incident isole ne doit pas etre puni par un ancien');
  assert.equal(d.reprises, 1);
});

test('une erreur applicative n est jamais retentee', () => {
  const d = deciderReprise({ erreur: new Error('commune introuvable'), reprises: 0, maintenantMs: 1 });
  assert.equal(d.reprendre, false);
  assert.match(d.raison, /non récupérable/);
});

test('les messages sont en francais et actionnables', () => {
  assert.match(messageUtilisateur({ reprendre: true, reprises: 2 }), /tentative 2\/3/);
  assert.match(messageUtilisateur({ reprendre: false }), /Ctrl\+Maj\+R/);
});
