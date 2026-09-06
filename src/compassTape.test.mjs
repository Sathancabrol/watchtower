/**
 * Tests — BOUSSOLE « CASQUE » (réglages et géométrie, sans navigateur).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAUTS, disposition, fmtCap, reglagesValides } from './compassTape.js';

test('les réglages par défaut tiennent dans la hauteur, à gauche', () => {
  const r = reglagesValides({});
  assert.equal(r.orientation, 'vertical');
  assert.equal(r.cote, 'gauche');
  assert.equal(r.visible, true);
  assert.equal(r.amplitude, 90);
});

test('une valeur absurde retombe sur le défaut, jamais de NaN', () => {
  const r = reglagesValides({ orientation: 'nawak', cote: 42, largeur: 'gros', opacite: null, amplitude: -5 });
  assert.equal(r.orientation, 'vertical');
  assert.equal(r.cote, 'gauche');
  assert.equal(r.largeur, DEFAUTS.largeur);
  assert.equal(r.opacite, DEFAUTS.opacite);
  assert.equal(r.amplitude, 30, 'borné en bas, pas négatif');
  assert.ok(Number.isFinite(r.largeur) && Number.isFinite(r.amplitude));
});

test('les valeurs sont bornées (largeur 34-130, opacité 0,2-1)', () => {
  assert.equal(reglagesValides({ largeur: 5 }).largeur, 34);
  assert.equal(reglagesValides({ largeur: 900 }).largeur, 130);
  assert.equal(reglagesValides({ opacite: 5 }).opacite, 1);
  assert.equal(reglagesValides({ opacite: 0 }).opacite, 0.2);
  assert.equal(reglagesValides({ amplitude: 9999 }).amplitude, 360);
});

test('le ruban vertical occupe la hauteur de la page, collé au bord choisi', () => {
  const v = disposition({ orientation: 'vertical', cote: 'gauche', largeur: 56 }, { largeur: 1920, hauteur: 1080 });
  assert.equal(v.canvasLargeur, 56);
  assert.equal(v.canvasHauteur, 1080, 'toute la hauteur');
  assert.equal(v.style.left, '0px');
  assert.equal(v.style.right, 'auto');
  const d = disposition({ orientation: 'vertical', cote: 'droite' }, { largeur: 1920, hauteur: 1080 });
  assert.equal(d.style.right, '0px');
  assert.equal(d.style.left, 'auto');
});

test('le ruban vertical ne dépasse jamais la fenêtre', () => {
  const v = disposition({ orientation: 'vertical', longueur: 4000 }, { largeur: 800, hauteur: 600 });
  assert.equal(v.canvasHauteur, 600);
});

test('le ruban horizontal reste centré et plus petit que la fenêtre', () => {
  const h = disposition({ orientation: 'horizontal', longueur: 900 }, { largeur: 800, hauteur: 600 });
  assert.equal(h.canvasLargeur, 776, '800 - 24 px de marge');
  assert.equal(h.canvasHauteur, DEFAUTS.largeur);
  assert.equal(h.style.left, '50%');
  assert.equal(h.style.transform, 'translateX(-50%)');
});

test('une longueur choisie est respectée (vertical comme horizontal)', () => {
  assert.equal(disposition({ orientation: 'vertical', longueur: 500 }, { hauteur: 1080 }).canvasHauteur, 500);
  assert.equal(disposition({ orientation: 'horizontal', longueur: 300 }, { largeur: 1920 }).canvasLargeur, 300);
});

test('un viewport inconnu ne casse pas la disposition', () => {
  const v = disposition({}, {});
  assert.ok(Number.isFinite(v.canvasHauteur) && v.canvasHauteur > 0);
  assert.ok(Number.isFinite(v.canvasLargeur) && v.canvasLargeur > 0);
});

test('le cap est toujours affiché sur 3 chiffres, 0 → 359', () => {
  assert.equal(fmtCap(0), '000°');
  assert.equal(fmtCap(42), '042°');
  assert.equal(fmtCap(360), '000°');
  assert.equal(fmtCap(-10), '350°');
  assert.equal(fmtCap(359.6), '000°');
});

test('variante « arc » : une bande large et basse, sans position forcée', () => {
  const d = disposition({ variante: 'arc', longueur: 168, largeur: 46, orientation: 'vertical' });
  assert.equal(d.variante, 'arc');
  assert.equal(d.canvasLargeur, 168);
  assert.equal(d.canvasHauteur, 46, 'la bande reste basse : elle se pose sur le globe');
  assert.equal(d.style.left, 'auto', 'le conteneur (minicarte) place la boussole');
  assert.equal(d.style.transform, 'none');
});

test('variante « arc » : des valeurs absurdes retombent sur du sûr', () => {
  const d = disposition({ variante: 'arc', longueur: 99999, largeur: 500 }, { largeur: 400, hauteur: 300 });
  assert.ok(d.canvasLargeur <= 400 - 24, 'ne dépasse jamais la fenêtre');
  assert.ok(d.canvasHauteur <= 64, 'hauteur de bande plafonnée');
});

test('réglages : la variante et le rayon sont validés', () => {
  const r = reglagesValides({ variante: 'arc', rayon: 999999 });
  assert.equal(r.variante, 'arc');
  assert.ok(r.rayon <= 4000 && r.rayon >= 60, 'rayon borné');
  assert.equal(reglagesValides({}).variante, 'droit', 'droit par défaut');
  assert.equal(reglagesValides({ variante: 'nawak' }).variante, 'droit', 'valeur inconnue → droit');
});
