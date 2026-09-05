// src/cadastre.test.mjs — couche cadastrale légère (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALTITUDE_MAX,
  EMPRISE_MAX,
  aireAnneau,
  anneauxDeReponse,
  cleTuile,
  urlParcelles,
} from './cadastre.js';

test('clé de tuile : deux points proches partagent la même clé', () => {
  assert.equal(cleTuile(43.4001, 3.6901), cleTuile(43.4002, 3.6902));
  assert.notEqual(cleTuile(43.4001, 3.6901), cleTuile(43.9, 3.9));
  assert.match(cleTuile(0, 0), /^-?\d+:-?\d+$/);
});

test('clé de tuile : le pas est réglable (cache plus fin ou plus grossier)', () => {
  // un pas plus fin sépare deux points que le pas par défaut confondait
  assert.notEqual(cleTuile(43.4001, 3.6901, 0.00005), cleTuile(43.4005, 3.6905, 0.00005));
});

test('URL apicarto : géométrie GeoJSON encodée', () => {
  const u = new URL(urlParcelles(3.68, 43.39, 3.70, 43.41));
  assert.match(u.hostname, /ign\.fr$/);
  const geom = JSON.parse(u.searchParams.get('geom'));
  assert.equal(geom.type, 'Polygon');
  const anneau = geom.coordinates[0];
  assert.equal(anneau.length, 5, 'anneau fermé (5 points)');
  assert.deepEqual(anneau[0], anneau[4], 'premier = dernier');
  // l'ordre attendu par l'API : ouest, sud, est, nord
  assert.equal(anneau[0][0], 3.68);
  assert.equal(anneau[0][1], 43.39);
  assert.equal(anneau[2][0], 3.70);
  assert.equal(anneau[2][1], 43.41);
});

test('réponse GeoJSON → liste d’anneaux (mono et multi polygones)', () => {
  const fc = {
    features: [
      { geometry: { type: 'Polygon', coordinates: [[[1, 2], [1, 3], [2, 3], [1, 2]]] } },
      { geometry: { type: 'MultiPolygon', coordinates: [[[[5, 5], [5, 6], [6, 6], [5, 5]]], [[[7, 7], [7, 8], [8, 8], [7, 7]]]] } },
      { geometry: null },
    ],
  };
  assert.equal(anneauxDeReponse(fc).length, 3, '1 + 2 anneaux, le vide est ignoré');
  assert.equal(anneauxDeReponse({}).length, 0);
  assert.equal(anneauxDeReponse(null).length, 0);
});

test('aire d’un anneau : un carré d’environ 1° ≈ 9,6 milliards de m²', () => {
  const carre = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const a = aireAnneau(carre);
  assert.ok(a > 1.2e10 && a < 1.3e10, `aire=${a}`);
});

test('aire d’une parcelle de 20 m × 30 m ≈ 600 m²', () => {
  const dLat = 20 / 111_320;
  const dLon = 30 / (111_320 * Math.cos((43.4 * Math.PI) / 180));
  const parcelle = [
    [3.69, 43.40], [3.69 + dLon, 43.40],
    [3.69 + dLon, 43.40 + dLat], [3.69, 43.40 + dLat],
  ];
  const a = aireAnneau(parcelle);
  assert.ok(Math.abs(a - 600) < 30, `aire=${a}`);
  assert.equal(aireAnneau([]), 0);
  assert.equal(aireAnneau(null), 0);
  assert.equal(aireAnneau([[0, 0], [1, 1]]), 0, 'moins de 3 sommets');
});

test('la couche reste « légère » : altitude et emprise bornées', () => {
  assert.ok(ALTITUDE_MAX <= 5_000, 'pas de cadastre depuis l’espace');
  assert.ok(EMPRISE_MAX > 50 && EMPRISE_MAX <= 600, 'emprise raisonnable pour la source');
});
