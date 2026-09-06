// src/data/geoCadrans.test.mjs — découpage d'une commune en cadrans (géométrie).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aire, aireSignee, anneauPrincipal, bbox, bboxCroisent, centroide, clipperConvexe,
  decouperCommune, estConvexe, grille, interieurDemiPlan, oreilles, orienter,
  pointDansPolygone, pointDansTriangle, polygoneBBox,
} from './geoCadrans.js';

const CARRE = [[0, 0], [4, 0], [4, 4], [0, 4]];
// un « L » concave (on enlève le quart inférieur droit)
const L = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];

test('aire et orientation', () => {
  assert.equal(aire(CARRE), 16);
  assert.equal(aireSignee(CARRE), 16, 'carré antihoraire');
  assert.equal(aireSignee(orienter(CARRE, false)), -16);
  assert.equal(aire(orienter(L, true)), aire(L), 'l’aire ne change pas avec le sens');
  assert.equal(aire([]), 0);
});

test('appartenance d’un point (lancer de rayon)', () => {
  assert.equal(pointDansPolygone([2, 2], CARRE), true);
  assert.equal(pointDansPolygone([5, 2], CARRE), false);
  assert.equal(pointDansPolygone([3, 3], L), false, 'le L est creusé');
  assert.equal(pointDansPolygone([1, 3], L), true);
  assert.equal(pointDansPolygone([1, 1], []), false);
});

test('convexité', () => {
  assert.equal(estConvexe(CARRE), true);
  assert.equal(estConvexe(L), false);
  assert.equal(estConvexe([[0, 0], [1, 0], [1, 1]]), true, 'un triangle est convexe');
});

test('triangulation : le carré = 2 triangles, le L = 4', () => {
  const tc = oreilles(CARRE);
  assert.equal(tc.length, 2);
  assert.ok(Math.abs(tc.reduce((n, t) => n + aire(t), 0) - 16) < 1e-9, 'aire conservée');
  const tl = oreilles(L);
  assert.equal(tl.length, L.length - 2, 'n-2 triangles');
  assert.ok(Math.abs(tl.reduce((n, t) => n + aire(t), 0) - aire(L)) < 1e-9, 'aire conservée (L)');
  for (const t of tl) assert.equal(t.length, 3);
});

test('triangulation : les triangles sont convexes et recouvrent sans trou', () => {
  const triangles = oreilles(L);
  for (const t of triangles) assert.equal(estConvexe(t), true, 'triangle convexe');
  // le centre de chaque triangle est bien dans le L
  for (const t of triangles) {
    const c = centroide([t]);
    assert.equal(pointDansPolygone([c.lon, c.lat], L), true);
  }
});

test('triangulation : entrées dégénérées', () => {
  assert.deepEqual(oreilles([]), []);
  assert.deepEqual(oreilles([[0, 0], [1, 1]]), []);
  assert.equal(oreilles([...CARRE, [0, 0]]).length, 2, 'point de fermeture doublé ignoré');
});

test('clipping Sutherland–Hodgman : carré coupé par un triangle', () => {
  // triangle = moitié basse-gauche du carré
  const tri = [[0, 0], [4, 0], [0, 4]];
  const inter = clipperConvexe(CARRE, orienter(tri, true));
  assert.ok(Math.abs(aire(inter) - 8) < 1e-9, `aire 8 obtenue : ${aire(inter)}`);
  // un carré entièrement dehors → rien
  assert.equal(clipperConvexe([[10, 10], [11, 10], [11, 11], [10, 11]], tri).length, 0);
  // un carré entièrement dedans → inchangé
  const dedans = clipperConvexe([[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]], tri);
  assert.ok(Math.abs(aire(dedans) - 0.25) < 1e-9);
});

test('demi-plan : gauche / droite', () => {
  assert.ok(interieurDemiPlan([0, 1], [0, 0], [1, 0]) > 0, 'au-dessus = à gauche');
  assert.ok(interieurDemiPlan([0, -1], [0, 0], [1, 0]) < 0);
});

test('grille : 2×2 couvre la boîte, rang 0 au nord', () => {
  const g = grille({ ouest: 0, sud: 0, est: 4, nord: 4 }, 2, 2);
  assert.equal(g.length, 4);
  assert.equal(g[0].rang, 0);
  assert.equal(g[0].colonne, 0);
  assert.equal(g[0].bbox.nord, 4, 'la première bande est au nord');
  assert.equal(g[0].bbox.sud, 2);
  assert.equal(g[1].bbox.ouest, 2);
  assert.equal(g.reduce((n, c) => n + aire(c.polygone), 0), 16, 'pas de trous ni de doublons');
  assert.equal(grille(null, 2, 2).length, 0);
});

test('boîtes : bbox, polygone, croisement', () => {
  const b = bbox([CARRE]);
  assert.deepEqual(b, { ouest: 0, sud: 0, est: 4, nord: 4 });
  assert.equal(aire(polygoneBBox(b)), 16);
  assert.equal(bboxCroisent(b, { ouest: 3, sud: 3, est: 5, nord: 5 }), true);
  assert.equal(bboxCroisent(b, { ouest: 9, sud: 9, est: 10, nord: 10 }), false);
  assert.equal(bbox([]), null);
});

test('centroïde pondéré', () => {
  const c = centroide([CARRE]);
  assert.ok(Math.abs(c.lon - 2) < 1e-9 && Math.abs(c.lat - 2) < 1e-9);
  // deux carrés : le grand pèse plus
  const c2 = centroide([CARRE, [[4, 0], [8, 0], [8, 4], [4, 4]]]);
  assert.ok(Math.abs(c2.lon - 4) < 1e-9);
  assert.equal(centroide([]), null);
});

test('découpage d’un carré : 4 cadrans pleins', () => {
  const cadrans = decouperCommune([CARRE], { colonnes: 2, lignes: 2 });
  assert.equal(cadrans.length, 4);
  for (const c of cadrans) {
    assert.ok(Math.abs(c.aire - 4) < 1e-9, `chaque cadran fait 4 : ${c.aire}`);
    assert.ok(Math.abs(c.couverture - 1) < 1e-6, 'case entièrement dans la commune');
    assert.equal(c.pieces.length > 0, true);
  }
  assert.ok(Math.abs(cadrans.reduce((n, c) => n + c.aire, 0) - 16) < 1e-9, 'somme = aire de la commune');
});

test('découpage du L : les cases vides sont jetées', () => {
  const cadrans = decouperCommune([L], { colonnes: 2, lignes: 2 });
  // le quart inférieur DROIT est hors du L : 3 cadrans seulement
  assert.equal(cadrans.length, 3);
  const total = cadrans.reduce((n, c) => n + c.aire, 0);
  assert.ok(Math.abs(total - aire(L)) < 1e-9, `aire conservée : ${total} vs ${aire(L)}`);
  for (const c of cadrans) assert.ok(c.couverture > 0 && c.couverture <= 1.0000001);
});

test('découpage : chaque morceau est dans la commune', () => {
  const cadrans = decouperCommune([L], { colonnes: 3, lignes: 3 });
  assert.ok(cadrans.length >= 5);
  for (const c of cadrans) {
    for (const p of c.pieces) {
      const ctr = centroide([p]);
      assert.equal(pointDansPolygone([ctr.lon, ctr.lat], L), true, 'morceau dans le L');
    }
    assert.equal(pointDansPolygone([c.centre.lon, c.centre.lat], L), true, 'centre dans la commune');
  }
});

test('découpage : le seuil de confettis est réglable', () => {
  // un triangle produit des cases PARTIELLES : le seuil change tout
  const tri = [[0, 0], [4, 0], [0, 4]];
  const gros = decouperCommune([tri], { colonnes: 6, lignes: 6, aireMin: 0.9 });
  const fin = decouperCommune([tri], { colonnes: 6, lignes: 6, aireMin: 0.02 });
  assert.ok(fin.length > gros.length, 'plus on tolère, plus on garde de cases');
  assert.ok(gros.length >= 1);
  // quelle que soit la tolérance, l’aire couverte reste celle du triangle
  assert.ok(Math.abs(fin.reduce((n, c) => n + c.aire, 0) - aire(tri)) < 1e-9);
  assert.ok(gros.every((c) => c.couverture >= 0.9));
});

test('découpage : commune en deux îles (multi-anneaux)', () => {
  const ile1 = [[0, 0], [2, 0], [2, 2], [0, 2]];
  const ile2 = [[6, 0], [8, 0], [8, 2], [6, 2]];
  const cadrans = decouperCommune([ile1, ile2], { colonnes: 4, lignes: 1, aireMin: 0.1 });
  const total = cadrans.reduce((n, c) => n + c.aire, 0);
  assert.ok(Math.abs(total - 8) < 1e-9, `les deux îles couvrent 8 : ${total}`);
  assert.ok(cadrans.length >= 2);
});

test('découpage : entrées invalides', () => {
  assert.deepEqual(decouperCommune([], { colonnes: 2 }), []);
  assert.deepEqual(decouperCommune([[[0, 0], [1, 1]]], { colonnes: 2 }), []);
  assert.deepEqual(decouperCommune(null, { colonnes: 2 }), []);
  const c = decouperCommune([CARRE], { colonnes: 0, lignes: 0 });
  assert.equal(c.length, 1, '0 → ramené à 1');
});

test('anneau principal = le plus grand', () => {
  const petit = [[0, 0], [1, 0], [1, 1], [0, 1]];
  assert.equal(anneauPrincipal([petit, CARRE]), CARRE);
  assert.deepEqual(anneauPrincipal([]), []);
  assert.equal(aire(anneauPrincipal([CARRE])), 16);
});

test('point dans triangle', () => {
  const a = [0, 0]; const b = [4, 0]; const c = [0, 4];
  assert.equal(pointDansTriangle([1, 1], a, b, c), true);
  assert.equal(pointDansTriangle([3, 3], a, b, c), false);
});
