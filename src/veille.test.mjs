// src/veille.test.mjs — effacement progressif du HUD après inactivité.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAUT_DEBUT_MS, DEFAUT_FIN_MS, opaciteVeille } from './veille.js';

test('les seuils demandés : 10 s puis 15 s', () => {
  assert.equal(DEFAUT_DEBUT_MS, 10_000);
  assert.equal(DEFAUT_FIN_MS, 15_000);
});

test('avant 10 s : le HUD est totalement visible', () => {
  for (const t of [0, 1, 2500, 9999, 10_000]) assert.equal(opaciteVeille(t), 1);
});

test('entre 10 s et 15 s : fondu linéaire', () => {
  assert.equal(opaciteVeille(12_500), 0.5, 'à mi-parcours : 50 %');
  assert.ok(opaciteVeille(11_000) === 0.8);
  assert.ok(opaciteVeille(14_000) === 0.2);
  // décroissance stricte
  let precedent = 1;
  for (let t = 10_000; t <= 15_000; t += 250) {
    const o = opaciteVeille(t);
    assert.ok(o <= precedent, `décroît à ${t} ms`);
    precedent = o;
  }
});

test('à partir de 15 s : totalement invisible', () => {
  for (const t of [15_000, 16_000, 60_000, 3_600_000]) assert.equal(opaciteVeille(t), 0);
});

test('jamais hors bornes, même avec des entrées douteuses', () => {
  for (const t of [null, undefined, NaN, -100, 'abc', {}, []]) {
    const o = opaciteVeille(t);
    assert.ok(o >= 0 && o <= 1, `borné pour ${String(t)} → ${o}`);
  }
  assert.equal(opaciteVeille(NaN), 1, 'une valeur invalide ne masque jamais l’écran');
});

test('fenêtre réglable (ex : 5 s → 8 s)', () => {
  const o = (t) => opaciteVeille(t, { debut: 5_000, fin: 8_000 });
  assert.equal(o(4_999), 1);
  assert.equal(o(6_500), 0.5);
  assert.equal(o(8_000), 0);
  assert.equal(opaciteVeille(12_000, { debut: 20_000, fin: 30_000 }), 1, 'fenêtre décalée');
});
