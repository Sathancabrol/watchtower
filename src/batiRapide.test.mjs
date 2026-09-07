// src/batiRapide.test.mjs — pipeline de bâtiments 3D (Cesium réel, sans navigateur).
//
// Cesium s'importe très bien en node pour tout ce qui est GÉOMÉTRIE (les
// polygones extrudés sont des maths, pas du WebGL) : on peut donc vérifier
// pour de vrai que les emprises OSM deviennent des volumes triangulés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Cesium from 'cesium';
import { construirePrimitives, maxEmprises, preparerLots } from './batiRapide.js';

/** Emprise carrée au sol, façon `out geom` d'Overpass (anneau fermé). */
const emprise = (lon, lat, cote = 0.0004) => ([
  { lon, lat },
  { lon: lon + cote, lat },
  { lon: lon + cote, lat: lat + cote },
  { lon, lat: lat + cote },
  { lon, lat },
]);

const ways = [
  { id: 11, geometry: emprise(3.69, 43.40), tags: { building: 'apartments', 'building:levels': '5', name: 'Résidence Test' } },
  { id: 12, geometry: emprise(3.691, 43.401, 0.0002), tags: { amenity: 'hospital', name: 'Hôpital Test' } },
  { id: 13, geometry: emprise(3.692, 43.402), tags: { building: 'yes' } },
  { id: 14, geometry: [{ lon: 1, lat: 1 }, { lon: 2, lat: 2 }], tags: { building: 'yes' } }, // dégénérée
  { id: 15, tags: { building: 'yes' } }, // sans géométrie
];

test('maxEmprises : plus le rayon est grand, plus on accepte d’emprises', () => {
  assert.ok(maxEmprises(400) < maxEmprises(700));
  assert.ok(maxEmprises(700) < maxEmprises(1200));
  assert.equal(maxEmprises(undefined), maxEmprises(700), 'défaut 700 m');
});

test('preparerLots : hauteurs, catégories et altitudes du sol', () => {
  const lots = preparerLots(ways, () => 12);
  assert.equal(lots.length, 3, 'les emprises dégénérées sont écartées');
  const [appart, hopital, autre] = lots;

  assert.equal(appart.source, 'niveaux', '5 étages → 5 × 3,2 m');
  assert.ok(Math.abs(appart.h - (5 * 3.2 + 0.6)) < 1e-9);
  assert.equal(appart.cat, 'logement');
  assert.equal(appart.nom, 'Résidence Test');

  assert.equal(hopital.cat, 'sante', 'amenity=hospital');
  assert.equal(hopital.source, 'type', 'pas d’étages renseigné → table par type');
  assert.ok(hopital.h >= 18);

  assert.equal(autre.source, 'aire', 'building=yes → estimé depuis l’emprise');
  assert.ok(autre.h > 3);

  for (const lot of lots) {
    assert.equal(lot.sol, 12, 'altitude du sol lue sur la grille');
    assert.ok(lot.anneau.length >= 3 && lot.anneau.length <= 12, 'emprise décimée');
    assert.match(lot.couleur, /^#[0-9a-f]{6}$/i);
    assert.match(lot.toit, /^#[0-9a-f]{6}$/i);
  }
});

test('preparerLots : sans lecteur de sol, altitudes à zéro (pas d’exception)', () => {
  const lots = preparerLots([ways[0]]);
  assert.equal(lots.length, 1);
  assert.equal(lots[0].sol, 0);
  assert.equal(preparerLots([]).length, 0);
  assert.equal(preparerLots(null).length, 0);
});

test('construirePrimitives : 1 primitive pour les corps, 1 pour les toits', async () => {
  const lots = preparerLots(ways, () => 0);
  const { corps, toits } = await construirePrimitives(lots, { tailleLot: 2 });
  assert.ok(corps && toits, 'les deux primitives existent');
  assert.equal(corps.geometryInstances.length, 3, 'un corps par bâtiment');
  assert.equal(toits.geometryInstances.length, 3, 'une dalle de toit par bâtiment');
  // 2 draw-calls pour toute la ville, c’est tout l’objet du module
  assert.equal(corps.asynchronous, true, 'géométrie construite hors du thread principal');
  assert.equal(corps.releaseGeometryInstances, false, 'les instances sont réutilisables');
});

test('construirePrimitives : la géométrie se triangule réellement', async () => {
  const lots = preparerLots([ways[0]], () => 0);
  const { corps } = await construirePrimitives(lots);
  const geometrie = Cesium.PolygonGeometry.createGeometry(corps.geometryInstances[0].geometry);
  assert.ok(geometrie, 'le polygone extrudé est constructible');
  assert.ok(geometrie.attributes.position.values.length >= 24 * 3, 'assez de sommets pour un volume');
  assert.ok(geometrie.indices.length >= 36, 'les faces sont indexées');
  // les sommets portent une couleur par instance (PerInstanceColorAppearance)
  assert.ok(corps.geometryInstances[0].attributes.color, 'couleur par bâtiment');
});

test('construirePrimitives : appelée sur une zone vide, ne crée rien', async () => {
  const { corps, toits } = await construirePrimitives([]);
  assert.equal(corps, null);
  assert.equal(toits, null);
});

test('construirePrimitives : remonte la progression par tranche', async () => {
  const lots = preparerLots(Array.from({ length: 7 }, (_, i) => ({
    id: 100 + i, geometry: emprise(3.69 + i * 0.001, 43.4), tags: { building: 'house' },
  })), () => 0);
  const suivis = [];
  await construirePrimitives(lots, { tailleLot: 3, surProgres: (f, n) => suivis.push([f, n]) });
  assert.equal(suivis.length, 3, '7 bâtiments par lots de 3 → 3 tranches');
  assert.equal(suivis[suivis.length - 1][0], 1, 'progression terminée à 100 %');
  assert.equal(suivis[suivis.length - 1][1], 7, 'tous les volumes comptés');
});
