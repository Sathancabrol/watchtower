// src/fenetres.test.mjs — fenêtres : formes, réduction en icône, registre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FENETRES_APP, FORMES, appliquerForme } from './fenetres.js';

/** Faux élément : juste ce que touche `appliquerForme`. */
const faux = () => ({ style: {}, dataset: {}, classList: { contains: () => false, add() {}, remove() {}, toggle() {} } });

test('cinq formes, ordonnées de la plus libre à la plus compacte', () => {
  assert.deepEqual(Object.keys(FORMES), ['normale', 'compacte', 'large', 'bandeau', 'pilule']);
  for (const f of Object.values(FORMES)) assert.ok(f.nom && f.ic);
});

test('« normale » REMET les dimensions d’origine (largeur/hauteur libres)', () => {
  const el = faux();
  appliquerForme(el, 'normale');
  // largeur et hauteur repartent à vide = l'élément reprend sa taille naturelle
  assert.ok(!el.style.width, `largeur attendue vide, obtenue « ${el.style.width} »`);
  assert.ok(!el.style.maxHeight, `hauteur max attendue vide, obtenue « ${el.style.maxHeight} »`);
});

test('les formes prédéfinies imposent largeur et/ou hauteur', () => {
  const el = faux();
  assert.equal(appliquerForme(el, 'compacte'), 'compacte');
  assert.equal(el.style.width, '190px');

  const el2 = faux();
  appliquerForme(el2, 'bandeau');
  assert.equal(el2.style.width, '520px');
  assert.equal(el2.style.height, '74px');

  const el3 = faux();
  appliquerForme(el3, 'pilule');
  assert.equal(el3.style.width, '240px');
  assert.equal(el3.style.borderRadius, '20px');
});

test('une forme inconnue retombe sur « normale » sans casser', () => {
  const el = faux();
  assert.equal(appliquerForme(el, 'ovale'), 'normale');
  assert.equal(appliquerForme(null, 'bandeau'), 'bandeau');
});

test('le registre des fenêtres de l’application pointe des poignées réelles', () => {
  const vus = new Set();
  for (const f of FENETRES_APP) {
    assert.match(f.selecteur, /^[#.]/, `sélecteur invalide : ${f.selecteur}`);
    assert.ok(!vus.has(f.selecteur), `doublon : ${f.selecteur}`);
    vus.add(f.selecteur);
    assert.ok(f.poignee, `${f.selecteur} n’a pas de barre de titre (poignée)`);
  }
  // les fenêtres citées par l'utilisateur sont bien couvertes
  for (const sel of ['#wt-panel', '#wt-minimap', '#wt-fiche', '#wt-pins']) {
    assert.ok(FENETRES_APP.some((f) => f.selecteur === sel), `${sel} devrait être aménageable`);
  }
});
