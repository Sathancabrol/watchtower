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
  ALTITUDE_FORCEE, CLASSES_ROUTE, couleurRoute, largeurRoute, nomRoute,
  resumerRoutes, routesDepuisReponse, urlRoutes,
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

// ── ROUTES (itération 10) ────────────────────────────────────────────────
test('les classes de routes couvrent l’essentiel du réseau', () => {
  for (const c of ['motorway', 'primary', 'residential', 'pedestrian', 'track', 'cycleway']) {
    assert.ok(CLASSES_ROUTE[c], `${c} connue`);
    assert.match(CLASSES_ROUTE[c].couleur, /^#[0-9a-f]{6}$/i);
    assert.ok(CLASSES_ROUTE[c].largeur > 0 && CLASSES_ROUTE[c].largeur < 8);
  }
  assert.equal(couleurRoute('motorway'), '#ff7a59');
  assert.equal(couleurRoute('inconnue'), '#c9d4dd', 'repli gris');
  assert.ok(largeurRoute('motorway') > largeurRoute('path'), 'une autoroute est plus épaisse qu’un chemin');
  assert.equal(largeurRoute('inconnue'), 1.4);
  assert.equal(nomRoute('motorway'), 'autoroute');
  assert.equal(nomRoute('inconnue'), 'inconnue');
});

test('requête Overpass des routes d’une emprise', () => {
  const u = urlRoutes(3.70, 43.42, 3.78, 43.48);
  assert.match(u, /^\[out:json\]/);
  assert.match(u, /way\(43\.420000,3\.700000,43\.480000,3\.780000\)/);
  assert.match(u, /highway~"\^\(motorway\|trunk/);
  assert.match(u, /out geom 400/);
  assert.match(urlRoutes(0, 0, 1, 1, 10), /out geom 20/, 'borne basse');
});

test('réponse Overpass → tracés exploitables', () => {
  const r = routesDepuisReponse({
    elements: [
      { type: 'way', id: 1, geometry: [{ lon: 3.7, lat: 43.4 }, { lon: 3.71, lat: 43.41 }], tags: { highway: 'residential', name: 'Rue des Écoles', oneway: 'yes', maxspeed: '30' } },
      { type: 'way', id: 2, geometry: [{ lon: 3.8, lat: 43.5 }], tags: { highway: 'track' } }, // 1 point
      { type: 'way', id: 3, tags: { highway: 'primary' } }, // sans géométrie
      { type: 'way', id: 4, geometry: [{ lon: 'x', lat: 43.4 }, { lon: 3.72, lat: 43.42 }], tags: { highway: 'path' } }, // point invalide
    ],
  });
  // ne reste que la rue des Écoles : sans géométrie, à un seul point, ou
  // réduite à un point valide, une route ne se trace pas.
  assert.equal(r.length, 1, 'les tracés inexploitables sont écartés');
  assert.equal(r[0].nom, 'Rue des Écoles');
  assert.equal(r[0].classe, 'residential');
  assert.equal(r[0].sens, 1, 'sens unique détecté');
  assert.equal(r[0].vitesse, 30);
  assert.equal(r[0].coords.length, 2);
  assert.deepEqual(routesDepuisReponse(null), []);
  assert.deepEqual(routesDepuisReponse({ elements: [] }), []);
});

test('résumé des routes : nombre, longueur, répartition', () => {
  const r = resumerRoutes([
    { classe: 'residential', coords: [[3.7, 43.4], [3.71, 43.4]] },
    { classe: 'residential', coords: [[3.7, 43.4], [3.7, 43.41]] },
    { classe: 'primary', coords: [[3.7, 43.4], [3.72, 43.4]] },
  ]);
  assert.equal(r.routes, 3);
  assert.ok(r.longueur > 0);
  const classes = Object.fromEntries(r.classes);
  assert.equal(classes.residential, 2);
  assert.equal(classes.primary, 1);
  assert.equal(resumerRoutes([]).routes, 0);
  assert.equal(resumerRoutes([]).longueur, 0);
});

test('vue satellite : le plafond d’affichage peut être relevé', () => {
  assert.ok(ALTITUDE_FORCEE > 10_000, 'on peut garder le cadastre très haut');
});
