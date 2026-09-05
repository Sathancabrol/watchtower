// src/cinematique.test.mjs — approche cinématique (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEQUENCE,
  cameraA,
  distanceSol,
  douceur,
  dureeTotale,
  positionCamera,
} from './cinematique.js';

test('durée totale = somme des paliers', () => {
  assert.equal(dureeTotale(SEQUENCE), SEQUENCE.reduce((n, p) => n + p.duree, 0));
  assert.ok(dureeTotale(SEQUENCE) >= 8 && dureeTotale(SEQUENCE) <= 20, 'une cinématique reste courte');
});

test('adoucissement : 0 → 0, 0.5 → 0.5, 1 → 1, monotone', () => {
  assert.equal(douceur(0), 0);
  assert.equal(douceur(1), 1);
  assert.ok(Math.abs(douceur(0.5) - 0.5) < 1e-9);
  for (let t = 0; t < 1; t += 0.05) assert.ok(douceur(t + 0.05) >= douceur(t), 'croissant');
  assert.equal(douceur(-3), 0);
  assert.equal(douceur(9), 1);
  assert.equal(douceur(Number.NaN), 0);
});

test('distance au sol : d = altitude / tan(|tangage|)', () => {
  // à 100 m avec 45° de piqué, on est à 100 m du point
  assert.ok(Math.abs(distanceSol(100, -45) - 100) < 1e-6);
  // plus on pique, plus on est près
  assert.ok(distanceSol(1000, -60) < distanceSol(1000, -20));
  // garde-fous
  assert.ok(distanceSol(0, -10) >= 20);
  assert.ok(Number.isFinite(distanceSol(100, 0)), 'tangage nul toléré');
});

test('la caméra descend et se rapproche tout du long', () => {
  const total = dureeTotale(SEQUENCE);
  let altitude = Infinity;
  let distance = Infinity;
  for (let t = 0; t <= total; t += 0.25) {
    const c = cameraA(t);
    assert.ok(c.altitude <= altitude + 1e-6, `altitude décroît à t=${t}`);
    assert.ok(c.distance <= distance + 1e-6, `distance décroît à t=${t}`);
    altitude = c.altitude;
    distance = c.distance;
  }
  assert.equal(cameraA(0).etape, 'ORBITE');
  assert.equal(cameraA(total).etape, 'VERROUILLAGE');
  assert.equal(cameraA(total).avancement, 1);
});

test('le cap dérive : la caméra tourne autour du point (travelling)', () => {
  const a = cameraA(1);
  const b = cameraA(dureeTotale(SEQUENCE) - 0.1);
  assert.ok(b.cap > a.cap, 'le cap a tourné');
  assert.ok(b.cap <= 1.0000001, 'cap borné à un tour');
  assert.ok(cameraA(0).cap >= 0);
});

test('bornes : temps hors plage clampé, avancement dans [0,1]', () => {
  const debut = cameraA(-10);
  const fin = cameraA(9999);
  assert.equal(debut.altitude, SEQUENCE[0].altitude);
  assert.equal(fin.altitude, SEQUENCE[SEQUENCE.length - 1].altitude);
  assert.equal(debut.avancement, 0);
  assert.equal(fin.avancement, 1);
  assert.equal(cameraA(Number.NaN).etape, 'ORBITE');
});

test('position caméra : au nord du point au cap 0, et on regarde vers le sud', () => {
  const p = positionCamera({ lat: 43.4, lon: 3.69, sol: 100 }, { altitude: 100, tangage: -45, cap: 0 });
  assert.ok(p.lat > 43.4, 'caméra placée au nord');
  assert.ok(Math.abs(p.lon - 3.69) < 1e-9, 'même méridien au cap 0');
  assert.ok(Math.abs(p.cap - 0.5) < 1e-9, 'on regarde vers le point (cap opposé)');
  assert.equal(p.altitude, 200, 'altitude = altitude de vol + sol');
});

test('position caméra : au cap 0.25 la caméra part à l’est', () => {
  const p = positionCamera({ lat: 43.4, lon: 3.69, sol: 0 }, { altitude: 1000, tangage: -30, cap: 0.25 });
  assert.ok(p.lon > 3.69, 'à l’est');
  assert.ok(Math.abs(p.lat - 43.4) < 1e-6, 'presque à la même latitude');
  assert.ok(Math.abs(p.cap - 0.75) < 1e-9);
});

test('position caméra : le cap reste dans un tour même après plusieurs boucles', () => {
  const p = positionCamera({ lat: 0, lon: 0, sol: 0 }, { altitude: 500, tangage: -25, cap: 3.4 });
  assert.ok(p.cap >= 0 && p.cap < 1, `cap=${p.cap}`);
  assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lon));
});
