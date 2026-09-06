// src/batiMath.test.mjs — calculs de bâti (purs, sans Cesium).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACROTERE,
  CATEGORIES_BATI,
  HAUTEUR_ETAGE,
  aireEmprise,
  altitudesParGrille,
  categorieParId,
  categoriserBati,
  centreEmprise,
  cleZone,
  estimerHauteur,
  hash01,
  lotir,
  pointDansEmprise,
  simplifierAnneau,
} from './batiMath.js';

const carre = (lon, lat, coteDeg = 0.0002) => ([
  { lon, lat },
  { lon: lon + coteDeg, lat },
  { lon: lon + coteDeg, lat: lat + coteDeg },
  { lon, lat: lat + coteDeg },
  { lon, lat }, // anneau fermé (OSM)
]);

test('aireEmprise : accepte {lon,lat} et [lon,lat], anneau fermé ou non', () => {
  const a = aireEmprise(carre(3.69, 43.4));
  const b = aireEmprise(carre(3.69, 43.4).map((p) => [p.lon, p.lat]));
  const c = aireEmprise(carre(3.69, 43.4).slice(0, -1));
  assert.ok(a > 0, 'aire positive');
  assert.ok(Math.abs(a - b) < 1e-6, 'les deux formats donnent la même aire');
  // le point de fermeture ne change pas l'aire (à l'arrondi flottant près :
  // la latitude moyenne de référence diffère d'un millionième)
  assert.ok(Math.abs(a - c) / a < 1e-5, 'le point de fermeture est ignoré');
  // 0,0002° de côté à 43°N ≈ 22 m × 16 m → ~358 m²
  assert.ok(a > 250 && a < 500, `aire plausible, obtenu ${a.toFixed(0)} m²`);
});

test('aireEmprise : dégénérée → 0', () => {
  assert.equal(aireEmprise([]), 0);
  assert.equal(aireEmprise([{ lon: 1, lat: 2 }]), 0);
  assert.equal(aireEmprise([{ lon: NaN, lat: 2 }, { lon: 1, lat: 2 }, { lon: 3, lat: 4 }]), 0);
});

test('centreEmprise : moyenne des sommets', () => {
  // l'anneau est fermé : le dernier point répète le premier (moyenne sur 5)
  const c = centreEmprise(carre(3.69, 43.4, 0.001));
  assert.ok(Math.abs(c.lon - 3.6904) < 1e-9);
  assert.ok(Math.abs(c.lat - 43.4004) < 1e-9);
  const ouvert = centreEmprise(carre(3.69, 43.4, 0.001).slice(0, -1));
  assert.ok(Math.abs(ouvert.lon - 3.6905) < 1e-9, 'anneau ouvert → vrai centre');
  assert.equal(centreEmprise([]), null);
});

test('simplifierAnneau : décime sans casser la forme, jamais moins de 3 points', () => {
  const dense = Array.from({ length: 120 }, (_, i) => ({
    lon: 3.69 + Math.cos((i / 120) * Math.PI * 2) * 0.001,
    lat: 43.4 + Math.sin((i / 120) * Math.PI * 2) * 0.001,
  }));
  const out = simplifierAnneau(dense, 12);
  assert.equal(out.length, 12);
  for (const p of out) assert.ok(Number.isFinite(p.lon) && Number.isFinite(p.lat));
  assert.equal(simplifierAnneau(carre(3.69, 43.4), 12).length, 4); // anneau fermé → 4
  assert.equal(simplifierAnneau([{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }], 12).length, 2);
});

test('hash01 : déterministe et borné dans [0,1[', () => {
  for (const graine of [0, 1, 42, 123456789, -7]) {
    const v = hash01(graine);
    assert.ok(v >= 0 && v < 1, `dans [0,1[ pour ${graine}`);
    assert.equal(v, hash01(graine), 'stable pour une même graine');
  }
  // des graines voisines donnent des valeurs très différentes
  assert.notEqual(hash01(1), hash01(2));
  const moyenne = Array.from({ length: 500 }, (_, i) => hash01(i)).reduce((a, b) => a + b, 0) / 500;
  assert.ok(Math.abs(moyenne - 0.5) < 0.08, `distribution centrée, obtenu ${moyenne.toFixed(3)}`);
});

test('estimerHauteur : priorité height > niveaux > type > emprise', () => {
  assert.deepEqual(estimerHauteur({ tags: { height: '17.5' } }), { h: 17.5, niveaux: 5, source: 'osm' });
  assert.equal(estimerHauteur({ tags: { height: '12 m' } }).h, 12);
  assert.equal(estimerHauteur({ tags: { height: '4,5' } }).h, 4.5);
  const niveaux = estimerHauteur({ tags: { 'building:levels': '4' } });
  assert.equal(niveaux.source, 'niveaux');
  assert.ok(Math.abs(niveaux.h - (4 * HAUTEUR_ETAGE + ACROTERE)) < 1e-9);
  const eglise = estimerHauteur({ tags: { building: 'church' } });
  assert.equal(eglise.source, 'type');
  assert.ok(eglise.h >= 15, 'une église est haute');
});

test('estimerHauteur : repli sur l’emprise — une maison reste basse, un grand bloc monte', () => {
  const maison = estimerHauteur({ aire: 90, graine: 11 });
  const ilot = estimerHauteur({ aire: 2400, graine: 11 });
  assert.equal(maison.source, 'aire');
  assert.equal(ilot.source, 'aire');
  assert.ok(maison.h < ilot.h, `90 m² (${maison.h.toFixed(1)} m) < 2400 m² (${ilot.h.toFixed(1)} m)`);
  assert.ok(maison.h >= 3 && maison.h <= 5 * HAUTEUR_ETAGE, 'maison plausible');
  assert.ok(ilot.h <= 12 * HAUTEUR_ETAGE + 1, 'plafond respecté');
  // DÉTERMINISTE : même graine → même hauteur (sinon la ville « clignote »)
  assert.equal(maison.h, estimerHauteur({ aire: 90, graine: 11 }).h);
});

test('estimerHauteur : ignore les valeurs absurdes et borne le maximum', () => {
  assert.equal(estimerHauteur({ tags: { height: '0' } }).source, 'aire');
  assert.equal(estimerHauteur({ tags: { height: 'abc' } }).source, 'aire');
  assert.equal(estimerHauteur({ tags: { height: '100000' } }).h, 400);
  // 0 étage : valeur absurde ignorée → on retombe sur le type, sinon l'emprise
  assert.equal(estimerHauteur({ tags: { 'building:levels': '0', building: 'house' } }).source, 'type');
  assert.equal(estimerHauteur({ tags: { 'building:levels': '-2' } }).source, 'aire');
});

test('categoriserBati : chaque bâtiment tombe dans une catégorie, logement par défaut', () => {
  assert.equal(categoriserBati({ amenity: 'hospital' }).id, 'sante');
  assert.equal(categoriserBati({ amenity: 'pharmacy' }).id, 'sante');
  assert.equal(categoriserBati({ amenity: 'school' }).id, 'education');
  assert.equal(categoriserBati({ amenity: 'townhall' }).id, 'services');
  assert.equal(categoriserBati({ building: 'church' }).id, 'culte');
  assert.equal(categoriserBati({ building: 'warehouse' }).id, 'industrie');
  assert.equal(categoriserBati({ shop: 'bakery' }).id, 'commerce');
  assert.equal(categoriserBati({ building: 'yes' }).id, 'logement');
  assert.equal(categoriserBati({}).id, 'logement');
  assert.equal(categoriserBati(null).id, 'logement');
  // une catégorie connue a toujours une couleur et une couleur de toit
  for (const c of CATEGORIES_BATI) {
    assert.match(c.couleur, /^#[0-9a-f]{6}$/i);
    assert.match(c.toit, /^#[0-9a-f]{6}$/i);
  }
  assert.equal(categorieParId('inconnu').id, 'logement');
  assert.equal(categorieParId('sante').id, 'sante');
  // la dernière catégorie est le fourre-tout
  assert.equal(CATEGORIES_BATI[CATEGORIES_BATI.length - 1].test({}), true);
});

test('cleZone : stable pour une vue qui n’a pas bougé, distincte sinon', () => {
  const a = cleZone(43.40001, 3.69001, 700);
  const b = cleZone(43.40002, 3.69002, 700);
  const c = cleZone(43.41, 3.70, 700);
  assert.equal(a, b, 'quelques mètres d’écart → même zone (pas de rechargement)');
  assert.notEqual(a, c, 'un pâté de maisons plus loin → nouvelle zone');
  assert.notEqual(cleZone(43.4, 3.69, 700), cleZone(43.4, 3.69, 700, 'sante'));
});

test('lotir : découpe sans perdre ni doubler d’élément', () => {
  const liste = Array.from({ length: 355 }, (_, i) => i);
  const lots = lotir(liste, 150);
  assert.equal(lots.length, 3);
  assert.deepEqual(lots.flat(), liste);
  assert.deepEqual(lotir([], 150), []);
  assert.deepEqual(lotir([1, 2], 0), [[1], [2]], 'taille nulle ou négative → lot de 1');
});

test('altitudesParGrille : une lecture par case, pas par bâtiment', () => {
  const bbox = { ouest: 0, sud: 0, est: 1, nord: 1 };
  let appels = 0;
  const lire = (lon, lat) => { appels += 1; return Math.round((lon + lat) * 100); };
  const centres = Array.from({ length: 500 }, (_, i) => ({ lon: (i % 25) / 24, lat: Math.floor(i / 25) / 19 }));
  const altitudes = altitudesParGrille(centres, bbox, { n: 6, lire });
  assert.equal(altitudes.length, 500);
  assert.equal(appels, 36, '6×6 lectures seulement pour 500 bâtiments');
  for (const a of altitudes) assert.ok(Number.isFinite(a));
  // un bâtiment au sud-ouest prend la case (0,0) ; au nord-est la dernière
  assert.equal(altitudes[0], 0);
  assert.equal(altitudes[altitudes.length - 1], 200);
  // sans lecteur, ou sans centre : que des zéros (pas d’exception)
  assert.deepEqual(altitudesParGrille(centres, bbox, { n: 4 }), centres.map(() => 0));
  assert.deepEqual(altitudesParGrille([], bbox, { n: 4, lire }), []);
  // une lecture qui échoue ne casse pas le lot
  assert.deepEqual(altitudesParGrille([{ lon: 0.5, lat: 0.5 }], bbox, { n: 3, lire: () => undefined }), [0]);
});

test('pointDansEmprise : ray casting, cas de référence', () => {
  const carre2 = carre(3.69, 43.4, 0.001);
  assert.equal(pointDansEmprise(3.6905, 43.4005, carre2), true, 'centre dedans');
  assert.equal(pointDansEmprise(3.70, 43.4005, carre2), false, 'à droite dehors');
  assert.equal(pointDansEmprise(3.6899, 43.4005, carre2), false, 'à gauche dehors');
  assert.equal(pointDansEmprise(3.6905, 43.402, carre2), false, 'au-dessus dehors');
  // un anneau non fermé est traité comme fermé
  assert.equal(pointDansEmprise(3.6905, 43.4005, carre2.slice(0, -1)), true);
  // formes concaves : le point dans la « dent » est dehors
  const L = [
    { lon: 0, lat: 0 }, { lon: 2, lat: 0 }, { lon: 2, lat: 1 },
    { lon: 1, lat: 1 }, { lon: 1, lat: 2 }, { lon: 0, lat: 2 },
  ];
  assert.equal(pointDansEmprise(0.5, 0.5, L), true, 'dans la branche');
  assert.equal(pointDansEmprise(1.5, 1.5, L), false, 'dans la dent → dehors');
  // entrées invalides
  assert.equal(pointDansEmprise(NaN, 0, carre2), false);
  assert.equal(pointDansEmprise(0, 0, []), false);
  assert.equal(pointDansEmprise(0, 0, null), false);
  assert.equal(pointDansEmprise(0, 0, [{ lon: 0, lat: 0 }, { lon: 1, lat: 1 }]), false, 'anneau dégénéré');
});
