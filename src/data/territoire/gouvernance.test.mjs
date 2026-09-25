import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCRUTIN_2026, EXECUTIF, JUMELAGES, JUMELAGES_NON_CONFIRMES,
  ADJOINTS_MANDATURE_PRECEDENTE, MOBILITE_INTERNATIONALE,
  delegationsManquantes, estAdjointPerime,
} from './gouvernance.js';

test('le scrutin 2026 est arithmetiquement coherent', () => {
  const sieges = SCRUTIN_2026.listes.reduce((s, l) => s + l.sieges, 0);
  assert.equal(sieges, SCRUTIN_2026.siegesConseil, '27 + 6 + 2 = 35 sieges');
  const agglo = SCRUTIN_2026.listes.reduce((s, l) => s + l.siegesAgglo, 0);
  assert.equal(agglo, SCRUTIN_2026.siegesAgglo);
  const pct = SCRUTIN_2026.listes.reduce((s, l) => s + l.pourcentage, 0);
  assert.ok(Math.abs(pct - 100) < 0.01, 'les trois listes totalisent 100 %');
});

test('la majorite est acquise des le premier tour', () => {
  const maj = SCRUTIN_2026.listes.find((l) => l.nuance === 'majorité');
  assert.ok(maj.pourcentage > 50, 'plus de 50 % => pas de second tour');
  assert.equal(SCRUTIN_2026.tour, 1);
});

test('l executif compte dix adjoints numerotes sans trou', () => {
  assert.equal(EXECUTIF.adjoints.length, 10);
  EXECUTIF.adjoints.forEach((a, i) => assert.equal(a.rang, i + 1));
  assert.equal(EXECUTIF.adjoints.filter((a) => a.premiere).length, 1);
});

test('aucune delegation n est inventee', () => {
  for (const a of EXECUTIF.adjoints) {
    assert.ok(a.delegation === null || a.delegation.length > 3,
      `${a.nom} : une delegation est soit sourcee, soit null`);
  }
  assert.ok(delegationsManquantes() > 0, 'les delegations non publiees restent a null');
});

test('les adjoints de la mandature precedente sont detectes', () => {
  assert.ok(estAdjointPerime('Caroline SUNÉ'), 'source perimee reconnue');
  assert.ok(estAdjointPerime('caroline sala'), 'comparaison insensible a la casse');
  assert.ok(!estAdjointPerime('Claudie MINGUEZ'), 'adjointe en exercice non signalee');
  for (const nom of ADJOINTS_MANDATURE_PRECEDENTE) {
    assert.ok(!EXECUTIF.adjoints.some((a) => a.nom === nom),
      `${nom} ne doit pas figurer dans l executif 2026`);
  }
});

test('les quatre jumelages officiels sont distincts et actifs', () => {
  assert.equal(JUMELAGES.length, 4);
  assert.ok(JUMELAGES.every((j) => j.actif));
  assert.equal(new Set(JUMELAGES.map((j) => j.pays)).size, 4, 'un pays chacun');
  const gaeta = JUMELAGES.find((j) => j.ville === 'Gaeta');
  assert.equal(gaeta.depuis, 1997);
});

test('une date de jumelage non sourcee reste nulle', () => {
  const vizela = JUMELAGES.find((j) => j.ville === 'Vizela');
  assert.equal(vizela.depuis, null, 'pas de date inventee pour Vizela');
});

test('Rubi reste hors des jumelages confirmes', () => {
  assert.ok(!JUMELAGES.some((j) => j.ville.startsWith('Rub')));
  assert.equal(JUMELAGES_NON_CONFIRMES.length, 1);
});

test('la cooperation precede les jumelages formels', () => {
  assert.ok(MOBILITE_INTERNATIONALE.cooperationDepuis < 1997);
});
