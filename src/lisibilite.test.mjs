import test from 'node:test';
import assert from 'node:assert/strict';
import { initLisibilite, CIBLE_MIN_PX, PANNEAU_MIN_PX } from './lisibilite.js';

test('les planchers sont utilisables sans etre absurdes', () => {
  assert.ok(CIBLE_MIN_PX >= 26, 'cible tactile visable');
  assert.ok(PANNEAU_MIN_PX >= 280, 'panneau assez large pour du contenu');
});

test('la feuille est posee une seule fois', () => {
  const noeuds = [];
  const doc = {
    head: { appendChild: (n) => noeuds.push(n) },
    createElement: () => ({ id: '', textContent: '', remove() {} }),
    getElementById: (id) => noeuds.find((n) => n.id === id) || null,
  };
  initLisibilite(doc);
  assert.equal(noeuds.length, 1);
  initLisibilite(doc);
  assert.equal(noeuds.length, 1, 'appel repete sans doublon');
});

test('la feuille couvre les cibles signalees', () => {
  let css = '';
  const doc = {
    head: { appendChild: (n) => { css = n.textContent; } },
    createElement: () => ({ id: '', textContent: '', remove() {} }),
    getElementById: () => null,
  };
  initLisibilite(doc);
  assert.match(css, /\.fermer/, 'bouton fermer traite');
  assert.match(css, /\.modifier/, 'bouton modifier traite');
  assert.match(css, /min-width/, 'largeur plancher posee');
  assert.match(css, /max-height/, 'hauteur bornee');
  assert.match(css, /@media/, 'cas du petit ecran traite');
});

test('sans document, aucune exception', () => {
  assert.doesNotThrow(() => initLisibilite(null).detruire());
});
