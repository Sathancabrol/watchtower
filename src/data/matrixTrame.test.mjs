import test from 'node:test';
import assert from 'node:assert/strict';
import { SEUIL_FOND, luminance, extraireTrame, ratioTrame } from './matrixTrame.js';

/** Fabrique un tableau RGBA a partir de triplets. */
const px = (...couleurs) => Uint8ClampedArray.from(couleurs.flatMap(([r, v, b]) => [r, v, b, 255]));

test('luminance suit la ponderation Rec. 601', () => {
  assert.equal(Math.round(luminance(255, 255, 255)), 255);
  assert.equal(Math.round(luminance(0, 0, 0)), 0);
  assert.ok(luminance(0, 255, 0) > luminance(255, 0, 0), 'le vert pese plus que le rouge');
});

test('les aplats clairs deviennent transparents', () => {
  const d = extraireTrame(px([255, 255, 255], [250, 248, 245]));
  assert.equal(d[3], 0, 'blanc pur efface');
  assert.equal(d[7], 0, 'blanc casse OSM efface');
});

test('les traits sombres sont conserves', () => {
  const d = extraireTrame(px([0, 0, 0], [40, 40, 40]));
  assert.equal(d[3], 255, 'noir pur pleinement conserve');
  assert.ok(d[7] > 180, 'gris fonce largement conserve');
});

test('le seuil est la frontiere entre fond et trait', () => {
  const juste = SEUIL_FOND + 1;
  const d = extraireTrame(px([juste, juste, juste], [SEUIL_FOND - 40, SEUIL_FOND - 40, SEUIL_FOND - 40]));
  assert.equal(d[3], 0, 'au-dessus du seuil => fond');
  assert.ok(d[7] > 0, 'sous le seuil => trait');
});

test("MATRIX reste une trame et ne repeint pas tout l'ecran", () => {
  // Tuile OSM realiste : trois quarts de fond clair, un quart de traits.
  const tuile = [];
  for (let i = 0; i < 300; i += 1) tuile.push([252, 250, 248]);
  for (let i = 0; i < 100; i += 1) tuile.push([60, 60, 60]);
  const ratio = ratioTrame(extraireTrame(px(...tuile)));
  assert.ok(ratio > 0.2 && ratio < 0.35, `~25% conserve, obtenu ${ratio.toFixed(2)}`);
  assert.ok(ratio < 0.5, "jamais un ecran plein : c'est ce qui distingue MATRIX de la vision nocturne");
});

test('entrees degenerees ne cassent rien', () => {
  assert.equal(ratioTrame(null), 0);
  assert.equal(ratioTrame(new Uint8ClampedArray(0)), 0);
  assert.deepEqual(extraireTrame(null), null);
});
