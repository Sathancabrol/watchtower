// src/contours.test.mjs — contours de commune (purs, sans Cesium).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  altitudePourBBox,
  anneauxDepuisGeoJson,
  bboxAnneaux,
  centreBBox,
  decimer,
  distanceM,
  fermerAnneau,
  perimetreAnneau,
  portionAnneau,
  tailleBBoxM,
} from './contours.js';

const carre = [
  [3.0, 43.0], [3.1, 43.0], [3.1, 43.1], [3.0, 43.1], [3.0, 43.0],
];

test('anneauxDepuisGeoJson : Feature, FeatureCollection, MultiPolygon, brut', () => {
  const feature = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [carre] } };
  assert.deepEqual(anneauxDepuisGeoJson(feature), [carre]);
  const fc = { type: 'FeatureCollection', features: [feature, feature] };
  assert.equal(anneauxDepuisGeoJson(fc).length, 2, 'les deux communes sont extraites');
  const multi = {
    type: 'MultiPolygon',
    coordinates: [[carre], [[[4.0, 44.0], [4.1, 44.0], [4.05, 44.1], [4.0, 44.0]]]],
  };
  assert.equal(anneauxDepuisGeoJson(multi).length, 2, 'îles et enclaves conservées');
  assert.equal(anneauxDepuisGeoJson({ type: 'Polygon', coordinates: [carre] }).length, 1);
  assert.equal(anneauxDepuisGeoJson(null).length, 0);
  assert.equal(anneauxDepuisGeoJson({ type: 'Point', coordinates: [3, 43] }).length, 0);
});

test('anneauxDepuisGeoJson : le plus grand anneau d’abord', () => {
  const petit = [[3.0, 43.0], [3.01, 43.0], [3.01, 43.01], [3.0, 43.0]];
  const geo = { type: 'MultiPolygon', coordinates: [[petit], [carre]] };
  const [premier] = anneauxDepuisGeoJson(geo);
  assert.equal(premier.length, 5, 'le grand contour passe devant l’îlot');
});

test('bboxAnneaux / centreBBox / tailleBBoxM', () => {
  const b = bboxAnneaux([carre]);
  assert.equal(b.ouest, 3.0);
  assert.equal(b.est, 3.1);
  assert.equal(b.sud, 43.0);
  assert.equal(b.nord, 43.1);
  assert.deepEqual(centreBBox(b), { lon: 3.05, lat: 43.05 });
  const { largeur, hauteur } = tailleBBoxM(b);
  assert.ok(Math.abs(largeur - 111320 * 0.1 * Math.cos(43.0 * Math.PI / 180)) < 20, `largeur ${largeur.toFixed(0)} m`);
  assert.ok(Math.abs(hauteur - 110574 * 0.1) < 5, `hauteur ${hauteur.toFixed(0)} m`);
  assert.equal(bboxAnneaux([]), null);
  assert.equal(bboxAnneaux([[]]), null);
  // les coordonnées invalides sont ignorées, les valides sont conservées
  assert.deepEqual(bboxAnneaux([[['x', 1], [2, 3], [4, 5]]]), { ouest: 2, sud: 3, est: 4, nord: 5 });
});

test('altitudePourBBox : cadre le contour avec de la marge, plancher à 900 m', () => {
  const altitude = altitudePourBBox(bboxAnneaux([carre]));
  assert.ok(altitude > 11000, `une commune de 11 km se voit de haut, obtenu ${altitude.toFixed(0)} m`);
  assert.equal(altitudePourBBox(null), 900);
  assert.equal(altitudePourBBox({ ouest: 0, sud: 0, est: 0.0001, nord: 0.0001 }), 900, 'plancher');
  assert.ok(altitudePourBBox(bboxAnneaux([carre]), 2) > altitude, 'plus de marge = plus haut');
});

test('portionAnneau : le trait avance continûment (animation)', () => {
  assert.deepEqual(portionAnneau(carre, 0).length, 1, 'à 0 : un seul point (rien de tracé)');
  assert.equal(portionAnneau(carre, 1).length, 6, 'à 1 : tout le contour fermé');
  const moitie = portionAnneau(carre, 0.5);
  assert.ok(moitie.length >= 3 && moitie.length <= 6);
  // le dernier point est INTERPOLÉ : il ne saute pas de sommet en sommet
  // (à t=0,25 le trait est entre le 2ᵉ et le 3ᵉ sommet : longitude figée à
  // 3,1 et latitude qui monte)
  const quart = portionAnneau(carre, 0.25);
  const tip = quart[quart.length - 1];
  assert.equal(tip[0], 3.1);
  assert.ok(tip[1] > 43.0 && tip[1] < 43.1, `pointe interpolée, obtenu ${tip[1]}`);
  // monotone : la portion ne recule jamais
  let precedent = 0;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const n = portionAnneau(carre, t).length;
    assert.ok(n >= precedent, `progression monotone à t=${t.toFixed(2)}`);
    precedent = n;
  }
  assert.deepEqual(portionAnneau([], 0.5), []);
  assert.deepEqual(portionAnneau([[1, 2]], 0.5), [[1, 2]]);
});

test('perimetreAnneau / distanceM', () => {
  const horizontal = distanceM([3.0, 43.0], [3.1, 43.0]);
  const vertical = distanceM([3.0, 43.0], [3.0, 43.1]);
  const p = perimetreAnneau(carre);
  // 2 côtés est-ouest + 2 nord-sud. La tolérance absorbe la variation du
  // cosinus de latitude entre le côté sud (43,0°) et le côté nord (43,1°).
  assert.ok(Math.abs(p - 2 * (horizontal + vertical)) < 30, `périmètre ${p.toFixed(0)} m`);
  // 0,1° de longitude à 43°N ≈ 8,1 km ; 0,1° de latitude ≈ 11,1 km
  assert.ok(horizontal > 8000 && horizontal < 8200, `obtenu ${horizontal.toFixed(0)} m`);
  assert.ok(Math.abs(vertical - 11057) < 5, `obtenu ${vertical.toFixed(0)} m`);
  assert.equal(perimetreAnneau([[1, 2]]), 0);
});

test('fermerAnneau : idempotent', () => {
  const ouvert = [[0, 0], [1, 0], [1, 1]];
  assert.deepEqual(fermerAnneau(ouvert), [[0, 0], [1, 0], [1, 1], [0, 0]]);
  assert.deepEqual(fermerAnneau(fermerAnneau(ouvert)), fermerAnneau(ouvert), 'pas de double fermeture');
});

test('decimer : garde la forme, borne le nombre de points', () => {
  const dense = Array.from({ length: 900 }, (_, i) => [i / 900, 43 + Math.sin(i / 30)]);
  assert.equal(decimer(dense, 220).length, 220);
  assert.equal(decimer(dense, 2000).length, 900, 'pas de décimation inutile');
  assert.equal(decimer(dense)[0][0], 0, 'le premier point est conservé');
});
