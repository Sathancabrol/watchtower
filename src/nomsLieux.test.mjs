// src/nomsLieux.test.mjs — étiquettes de lieux et rayon de requête (pur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ETIQUETTES, RANGS, enFrance, rayonSelonAltitude } from './nomsLieux.js';

test('rayon de requête : plancher, plafond, croissance avec l’altitude', () => {
  assert.ok(rayonSelonAltitude(0) >= 1_500, 'altitude nulle → rayon plancher');
  assert.equal(rayonSelonAltitude(100), 1_500);       // plancher
  assert.equal(rayonSelonAltitude(1_000), 1_700);     // 1,7 × l'altitude
  assert.equal(rayonSelonAltitude(1e9), 70_000);      // plafond (source protégée)
  assert.ok(rayonSelonAltitude(10_000) > rayonSelonAltitude(2_000));
  assert.equal(rayonSelonAltitude(6_000), Math.round(6_000 * 1.7));
  assert.ok(Number.isFinite(rayonSelonAltitude(Number.NaN)), 'entrée invalide tolérée');
});

test('détection France métropolitaine', () => {
  assert.equal(enFrance(43.4004, 3.6904), true);   // Sète
  assert.equal(enFrance(48.8566, 2.3522), true);   // Paris
  assert.equal(enFrance(40.7128, -74.006), false); // New York
  assert.equal(enFrance(-33.8688, 151.2093), false); // Sydney
  assert.equal(enFrance(35.6895, 139.6917), false);  // Tokyo
});

test('les rangs s’échelonnent du pays (très loin) au lieu-dit (de près)', () => {
  const par = Object.fromEntries(RANGS.map((r) => [r.cle, r.max]));
  assert.equal(RANGS[0].cle, 'country');
  // les pays portent le plus loin, les lieux-dits le moins loin
  assert.ok(par.country >= Math.max(...RANGS.map((r) => r.max)) * 0.99, 'pays = portée max');
  assert.ok(par.locality <= par.hamlet, 'un lieu-dit ne porte pas plus loin qu’un hameau');
  assert.ok(par.hamlet <= par.village, 'un hameau ne porte pas plus loin qu’un village');
  assert.ok(par.suburb <= par.town, 'un quartier ne porte pas plus loin qu’une ville');
  assert.ok(RANGS.find((r) => r.cle === 'city'), 'les villes sont étiquetées');
  assert.ok(RANGS.find((r) => r.cle === 'hamlet'), 'les hameaux sont étiquetés');
});

test('chaque rang a une couleur, une police et une portée cohérentes', () => {
  for (const r of RANGS) {
    assert.match(r.couleur, /^#[0-9a-f]{6}$/i, `${r.cle} couleur`);
    assert.ok(r.police >= 9 && r.police <= 20, `${r.cle} police`);
    assert.ok(r.max > 0, `${r.cle} portée`);
    assert.ok(r.nom.length > 0, `${r.cle} libellé`);
  }
});

test('volume d’étiquettes borné (la source OSM ne doit pas être saturée)', () => {
  assert.ok(MAX_ETIQUETTES > 20 && MAX_ETIQUETTES <= 150);
});
