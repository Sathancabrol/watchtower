// src/localisation.test.mjs — cinématique « ME LOCALISER » (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALTITUDE_ORBITALE,
  anneauxDe,
  centreAnneau,
  etiquetteFacteur,
  etapesZoom,
  rayonScan,
} from './localisation.js';

test('étapes de zoom : paliers ×1 → ×10 → ×100… jusqu’à l’altitude finale', () => {
  const etapes = etapesZoom(ALTITUDE_ORBITALE, 300, 10);
  assert.equal(etapes[0].facteur, 1);
  assert.equal(etapes[0].altitude, ALTITUDE_ORBITALE);
  // altitudes strictement décroissantes
  for (let i = 1; i < etapes.length; i += 1) {
    assert.ok(etapes[i].altitude < etapes[i - 1].altitude, `palier ${i} décroissant`);
    assert.equal(etapes[i].facteur, etapes[i - 1].facteur * 10);
  }
  // dernière marche : l’altitude d’arrivée demandée
  assert.equal(etapes[etapes.length - 1].altitude, 300);
  // le « ×1000 » demandé existe bien dans la séquence
  assert.ok(etapes.some((e) => e.facteur === 1000 && e.altitude === 20_000));
  assert.ok(etapes.length >= 5 && etapes.length <= 12, `nb paliers=${etapes.length}`);
});

test('étapes de zoom : départ déjà en dessous de l’arrivée → une seule marche', () => {
  const e = etapesZoom(200, 300, 10);
  assert.equal(e.length, 1);
  assert.equal(e[0].altitude, 200);
});

test('étapes de zoom : bornes de sécurité (pas de boucle infinie)', () => {
  const e = etapesZoom(1e12, 1, 2);
  assert.ok(e.length <= 25, `nb=${e.length}`);
  assert.equal(e[e.length - 1].altitude, 1);
});

test('étiquettes de facteur lisibles', () => {
  assert.equal(etiquetteFacteur(1), '×1');
  assert.equal(etiquetteFacteur(10), '×10');
  assert.equal(etiquetteFacteur(100), '×100');
  assert.equal(etiquetteFacteur(100_000), '×100 000');
  assert.equal(etiquetteFacteur(1_000_000), '×1.0 M');
  assert.equal(etiquetteFacteur(0), '×1'); // garde-fou
});

test('rayon de scan : reste dans le champ et croît avec l’altitude', () => {
  assert.equal(rayonScan(20_000_000), 6_000_000);   // plafonné à 9000 km ? non : 0,30 × 20 000 km
  assert.ok(rayonScan(1000) > rayonScan(500));
  assert.ok(rayonScan(1) >= 22, 'rayon plancher pour rester visible');
  assert.ok(rayonScan(1e12) <= 9_000_000, 'jamais au-delà du plafond');
});

test('anneaux GeoJSON : polygone et multipolygone aplatis de la même façon', () => {
  const polygone = { type: 'Polygon', coordinates: [[[1, 2], [1, 3], [2, 3], [2, 2], [1, 2]]] };
  const multi = { type: 'MultiPolygon', coordinates: [polygone.coordinates, [[[5, 5], [5, 6], [6, 6], [5, 5]]]] };
  assert.equal(anneauxDe(polygone).length, 1);
  assert.equal(anneauxDe(multi).length, 2);
  assert.equal(anneauxDe(null).length, 0);
  assert.equal(anneauxDe({ type: 'Point', coordinates: [1, 2] }).length, 0);
});

test('centre d’anneau : moyenne des sommets', () => {
  const c = centreAnneau([[0, 0], [2, 0], [2, 2], [0, 2]]);
  assert.equal(c.lon, 1);
  assert.equal(c.lat, 1);
  assert.equal(centreAnneau([]), null);
  assert.equal(centreAnneau(null), null);
});
