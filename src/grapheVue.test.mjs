import test from 'node:test';
import assert from 'node:assert/strict';

import { COULEURS, LIBELLES, aretes, disposerInitial, pasSimulation, energie } from './grapheVue.js';
import { NOEUDS } from './data/territoire/grapheThau.js';

test('chaque categorie du graphe a une couleur et un libelle', () => {
  for (const n of NOEUDS) {
    assert.ok(COULEURS[n.categorie], `pas de couleur pour "${n.categorie}"`);
    assert.ok(LIBELLES[n.categorie], `pas de libelle pour "${n.categorie}"`);
  }
});

test('les aretes sont dedoublonnees et non orientees', () => {
  const e = aretes();
  assert.ok(e.length > 20);
  const vues = new Set();
  for (const x of e) {
    const p = [x.a, x.b].sort().join('|');
    assert.equal(vues.has(p), false, `arete dupliquee : ${p}`);
    vues.add(p);
  }
  // une relation declaree dans un seul sens ne produit qu'une arete
  assert.equal(e.filter((x) => (x.a === 'zan' && x.b === 'scot') || (x.a === 'scot' && x.b === 'zan')).length, 1);
});

test('aucune arete ne pointe hors du graphe', () => {
  const cles = new Set(NOEUDS.map((n) => n.cle));
  for (const x of aretes()) {
    assert.equal(cles.has(x.a), true);
    assert.equal(cles.has(x.b), true);
  }
});

test('la disposition initiale est deterministe et couvre tous les noeuds', () => {
  const a = disposerInitial(800, 600);
  const b = disposerInitial(800, 600);
  assert.equal(a.length, NOEUDS.length);
  assert.deepEqual(a.map((n) => [n.cle, Math.round(n.x), Math.round(n.y)]),
    b.map((n) => [n.cle, Math.round(n.x), Math.round(n.y)]), 'deux appels donnent la meme mise en page');
  for (const n of a) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
});

test('le degre correspond au nombre d aretes incidentes', () => {
  const n = disposerInitial();
  const e = aretes();
  for (const x of n) {
    const attendu = e.filter((y) => y.a === x.cle || y.b === x.cle).length;
    assert.equal(x.degre, attendu, `degre faux pour ${x.cle}`);
  }
});

test('la simulation converge et ne produit jamais de NaN', () => {
  const n = disposerInitial(900, 650);
  const e = aretes();
  const depart = energie(n);
  for (let i = 0; i < 400; i += 1) pasSimulation(n, e, { largeur: 900, hauteur: 650 });
  for (const x of n) {
    assert.ok(Number.isFinite(x.x) && Number.isFinite(x.y), `NaN sur ${x.cle}`);
  }
  assert.ok(energie(n) < Math.max(1, depart), 'le systeme ne doit pas diverger');
  assert.ok(energie(n) < 5, `energie residuelle trop haute : ${energie(n)}`);
});

test('un noeud fixe ne bouge pas', () => {
  const n = disposerInitial(900, 650);
  const e = aretes();
  n[0].fixe = true;
  const x0 = n[0].x;
  const y0 = n[0].y;
  for (let i = 0; i < 40; i += 1) pasSimulation(n, e, { largeur: 900, hauteur: 650 });
  assert.equal(n[0].x, x0);
  assert.equal(n[0].y, y0);
});

test('deux noeuds superposes se separent au lieu de diviser par zero', () => {
  const n = disposerInitial(900, 650);
  n[1].x = n[0].x;
  n[1].y = n[0].y;
  for (let i = 0; i < 20; i += 1) pasSimulation(n, aretes(), { largeur: 900, hauteur: 650 });
  assert.ok(Number.isFinite(n[0].x) && Number.isFinite(n[1].x));
  assert.ok(Math.hypot(n[0].x - n[1].x, n[0].y - n[1].y) > 1, 'les noeuds doivent se repousser');
});
