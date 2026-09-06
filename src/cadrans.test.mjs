// src/cadrans.test.mjs — découpage de la commune en cadrans (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALPHABET, bboxDe, cadranContient, decouper, decouperContour, nomCadran,
  nommerDepuisQuartiers, quartiersDepuisReponse, requeteQuartiers,
} from './cadrans.js';

const BBOX = { ouest: 3.60, sud: 43.40, est: 3.80, nord: 43.50 };

test('alphabet OTAN disponible dans l’ordre', () => {
  assert.equal(ALPHABET[0], 'ALPHA');
  assert.equal(ALPHABET[1], 'BRAVO');
  assert.equal(ALPHABET[3], 'DELTA');
  assert.ok(ALPHABET.length >= 16);
});

test('nom de cadran : ALPHA, BRAVO… puis ALPHA-1 pour les sous-cadrans', () => {
  assert.equal(nomCadran(0), 'ALPHA');
  assert.equal(nomCadran(3), 'DELTA');
  assert.equal(nomCadran(2, 3), 'CHARLIE-3');
  assert.equal(nomCadran(-5), 'ALPHA');   // jamais de nom cassé
  assert.equal(nomCadran(NaN), 'ALPHA');
});

test('l’alphabet boucle au-delà de 26 cadrans', () => {
  assert.equal(nomCadran(26), 'ALPHA');
  assert.equal(nomCadran(27), 'BRAVO');
});

test('découpage 2×2 : 4 cadrans disjoints qui couvrent toute l’emprise', () => {
  const c = decouper(BBOX, { colonnes: 2, lignes: 2 });
  assert.equal(c.length, 4);
  const noms = c.map((x) => x.nom);
  assert.deepEqual(noms, ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA']);
  // recouvrement total : l'air des 4 cadrans = l'air de l'emprise
  const aire = (b) => (b.est - b.ouest) * (b.nord - b.sud);
  const somme = c.reduce((s, x) => s + aire(x.bbox), 0);
  assert.ok(Math.abs(somme - aire(BBOX)) < 1e-12);
  // aucun chevauchement
  for (let i = 0; i < c.length; i += 1) {
    for (let j = i + 1; j < c.length; j += 1) {
      const a = c[i].bbox; const b = c[j].bbox;
      const chevauche = a.ouest < b.est && b.ouest < a.est && a.sud < b.nord && b.sud < a.nord;
      assert.equal(chevauche, false, `${c[i].nom} et ${c[j].nom} se chevauchent`);
    }
  }
});

test('le balayage commence AU NORD-OUEST (ALPHA en haut à gauche)', () => {
  const c = decouper(BBOX, { colonnes: 2, lignes: 2 });
  const alpha = c[0];
  assert.ok(alpha.centre.lon < (BBOX.ouest + BBOX.est) / 2, 'ALPHA à l’ouest');
  assert.ok(alpha.centre.lat > (BBOX.sud + BBOX.nord) / 2, 'ALPHA au nord');
});

test('découpage 3×3 : 9 cadrans', () => {
  const c = decouper(BBOX, { colonnes: 3, lignes: 3 });
  assert.equal(c.length, 9);
  assert.equal(c[8].nom, 'INDIA');
});

test('chaque cadran porte son polygone fermé et son centre', () => {
  const [a] = decouper(BBOX, { colonnes: 2, lignes: 2 });
  assert.equal(a.polygone.length, 5);
  assert.deepEqual(a.polygone[0], a.polygone[4]); // fermé
  assert.ok(Math.abs(a.centre.lon - (a.bbox.ouest + a.bbox.est) / 2) < 1e-12);
});

test('emprise invalide → aucun cadran (pas d’exception)', () => {
  assert.deepEqual(decouper(null), []);
  assert.deepEqual(decouper({ ouest: 1, sud: 1, est: 1, nord: 1 }), []);
  assert.deepEqual(decouper({ ouest: NaN, sud: 0, est: 1, nord: 1 }), []);
});

test('appartenance d’un point à un cadran', () => {
  const c = decouper(BBOX, { colonnes: 2, lignes: 2 })[0];
  assert.equal(cadranContient(c, c.centre.lon, c.centre.lat), true);
  assert.equal(cadranContient(c, 20, 20), false);
  assert.equal(cadranContient(null, 0, 0), false);
});

test('bbox calculée depuis un anneau ou une liste de points', () => {
  const b = bboxDe([[3.6, 43.4], [3.8, 43.5], [3.7, 43.45]]);
  assert.deepEqual(b, { ouest: 3.6, sud: 43.4, est: 3.8, nord: 43.5 });
  assert.equal(bboxDe([]), null);
  assert.equal(bboxDe([[NaN, 1]]), null);
  // un anneau imbriqué (contours.js) est aplati
  const b2 = bboxDe([[[3.61, 43.41], [3.79, 43.49]]]);
  assert.equal(b2.ouest, 3.61);
});

test('les quartiers officiels baptisent leur cadran', () => {
  const c = decouper(BBOX, { colonnes: 2, lignes: 2 });
  const alpha = c[0];
  const nommes = nommerDepuisQuartiers(c, [
    { lat: alpha.centre.lat, lon: alpha.centre.lon, nom: 'Le Centre' },
    { lat: 48, lon: 2, nom: 'Loin' },
  ]);
  assert.equal(nommes[0].nom, 'Le Centre');
  assert.equal(nommes[0].nomOfficiel, 'Le Centre');
  assert.equal(nommes[0].quartiers.length, 1);
  assert.match(nommes[1].nom, /^(BRAVO|CHARLIE|DELTA)$/); // pas de nom officiel → alphabet
});

test('plusieurs quartiers dans le même cadran : noms reliés', () => {
  const c = decouper(BBOX, { colonnes: 2, lignes: 2 });
  const a = c[0];
  nommerDepuisQuartiers(c, [
    { lat: a.bbox.sud + 0.001, lon: a.bbox.ouest + 0.001, nom: 'Bas' },
    { lat: a.bbox.nord - 0.001, lon: a.bbox.est - 0.001, nom: 'Haut' },
  ]);
  assert.equal(c[0].nom, 'Bas / Haut');
  assert.equal(c[0].quartiers.length, 2);
});

test('requête Overpass des quartiers : bbox « sud,ouest,nord,est »', () => {
  const q = requeteQuartiers(BBOX);
  assert.match(q, /\(43\.4,3\.6,43\.5,3\.8\)\[place=quarter\]/);
  assert.match(q, /\[place=neighbourhood\]/);
  assert.match(q, /out center tags 300;/);
});

test('réponse Overpass → quartiers dédupliqués et localisés', () => {
  const q = quartiersDepuisReponse({
    elements: [
      { type: 'node', id: 1, lat: 43.44, lon: 3.69, tags: { place: 'quarter', name: 'Le Centre' } },
      { type: 'way', id: 2, center: { lat: 43.45, lon: 3.70 }, tags: { place: 'neighbourhood', name: 'le centre' } },
      { type: 'way', id: 3, center: { lat: 43.45, lon: 3.70 }, tags: { place: 'neighbourhood' } }, // sans nom
      { type: 'way', id: 4, tags: { name: 'sans centre' } },
    ],
  });
  assert.equal(q.length, 1, 'doublon de nom ignoré, sans-nom écarté');
  assert.equal(q[0].nom, 'Le Centre');
  assert.equal(q[0].type, 'quarter');
});

test('réponse invalide : aucun quartier, aucune erreur', () => {
  assert.deepEqual(quartiersDepuisReponse(null), []);
  assert.deepEqual(quartiersDepuisReponse({}), []);
});

// ── découpage AU TRACÉ COMMUNAL (itération 8) ──────────────────────────────
const CARRE = [[3.60, 43.40], [3.80, 43.40], [3.80, 43.50], [3.60, 43.50]];
// « L » : le quart sud-est est hors commune (la commune s'arrête au milieu)
const L = [[3.60, 43.40], [3.80, 43.40], [3.80, 43.45], [3.70, 43.45], [3.70, 43.50], [3.60, 43.50]];

test('decouperContour : les cadrans épousent le tracé communal', () => {
  const plein = decouperContour([CARRE], { colonnes: 2, lignes: 2 });
  assert.equal(plein.length, 4, 'commune carrée → 4 cadrans pleins');
  for (const c of plein) {
    assert.ok(Math.abs(c.couverture - 1) < 1e-6, 'case entièrement communale');
    assert.ok(Array.isArray(c.pieces) && c.pieces.length >= 1);
    assert.match(c.nom, /^(ALPHA|BRAVO|CHARLIE|DELTA)$/);
  }
  assert.equal(plein[0].nom, 'ALPHA');
});

test('decouperContour : les cases hors commune disparaissent', () => {
  const cadrans = decouperContour([L], { colonnes: 2, lignes: 2 });
  assert.equal(cadrans.length, 3, 'le quart sud-est (vide) est jeté');
  // plus aucun cadran ne couvre le point « hors commune »
  for (const c of cadrans) {
    assert.equal(cadranContient(c, 3.76, 43.475), false, 'point hors tracé communal');
  }
  // un point bien dans le L, au nord-ouest
  assert.equal(cadrans.some((c) => cadranContient(c, 3.63, 43.42)), true, 'point dans la commune');
});

test('decouperContour : les sous-cadrans restent dans la commune', () => {
  const cadrans = decouperContour([L], { colonnes: 2, lignes: 2, niveau: 2 });
  assert.ok(cadrans.length >= 3);
  for (const c of cadrans) {
    for (const morceau of c.pieces) {
      const xs = morceau.map((p) => p[0]); const ys = morceau.map((p) => p[1]);
      assert.ok(Math.max(...xs) <= 3.80 + 1e-9 && Math.min(...xs) >= 3.60 - 1e-9, 'dans l’emprise');
      assert.ok(Math.max(...ys) <= 43.50 + 1e-9 && Math.min(...ys) >= 43.40 - 1e-9);
    }
  }
});

test('decouper() bascule automatiquement sur le contour quand il est fourni', () => {
  const avec = decouper(BBOX, { colonnes: 2, lignes: 2, anneaux: [L] });
  const sans = decouper(BBOX, { colonnes: 2, lignes: 2 });
  assert.equal(avec.length, 3, 'découpage au tracé');
  assert.equal(sans.length, 4, 'découpage à la boîte (repli)');
  assert.equal(decouper(BBOX, { colonnes: 2, anneaux: [] }).length, 4, 'anneaux vides → boîte');
});

test('decouperContour : entrées invalides', () => {
  assert.deepEqual(decouperContour([], { colonnes: 2 }), []);
  assert.deepEqual(decouperContour(null, { colonnes: 2 }), []);
  assert.deepEqual(decouperContour([[[3.6, 43.4], [3.7, 43.5]]], { colonnes: 2 }), [], 'anneau dégénéré');
});
