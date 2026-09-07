// src/trajets.test.mjs — tracés : vol d'oiseau vs itinéraire réel (pur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILS, distanceVol, formaterTrajet, longueurTrace } from './trajets.js';

test('distance à vol d’oiseau Sète → Montpellier ≈ 28 km', () => {
  const d = distanceVol({ lat: 43.4004, lon: 3.6904 }, { lat: 43.6109, lon: 3.8772 });
  assert.ok(d > 25_000 && d < 32_000, `${d} m`);
});

test('distance nulle et symétrie', () => {
  const a = { lat: 43.4, lon: 3.69 };
  assert.equal(distanceVol(a, a), 0);
  const b = { lat: 48.85, lon: 2.35 };
  assert.ok(Math.abs(distanceVol(a, b) - distanceVol(b, a)) < 1e-6);
});

test('un méridien : 1° de latitude ≈ 111,2 km', () => {
  const d = distanceVol({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
  assert.ok(Math.abs(d - 111_195) < 200, `${d} m`);
});

test('l’équateur : 1° de longitude vaut aussi ~111,2 km', () => {
  const d = distanceVol({ lat: 0, lon: 0 }, { lat: 0, lon: 1 });
  assert.ok(Math.abs(d - 111_195) < 200, `${d} m`);
});

test('longueur d’une ligne brisée = somme des segments', () => {
  const p = [{ lat: 0, lon: 0 }, { lat: 0, lon: 1 }, { lat: 0, lon: 2 }];
  const total = longueurTrace(p);
  assert.ok(Math.abs(total - 2 * 111_195) < 400, `${total} m`);
  assert.equal(longueurTrace([{ lat: 1, lon: 1 }]), 0);
  assert.equal(longueurTrace([]), 0);
});

test('formatage distance + durée', () => {
  assert.equal(formaterTrajet(450, 0), '450 m');
  assert.equal(formaterTrajet(1500, 900), '1.5 km · 15 min');
  assert.equal(formaterTrajet(24_000, 7260), '24 km · 2 h 01');
  assert.equal(formaterTrajet(0, null), '0 m');
  assert.equal(formaterTrajet(-5, 0), '0 m');
});

test('les 4 modes existent, un seul est le vol d’oiseau (sans OSRM)', () => {
  assert.equal(PROFILS.length, 4);
  assert.equal(PROFILS.filter((p) => p.osrm).length, 3);
  assert.equal(PROFILS[0].id, 'vol');
  assert.equal(PROFILS[0].osrm, null);
  for (const p of PROFILS) assert.ok(p.nom && p.couleur.startsWith('#'));
});
