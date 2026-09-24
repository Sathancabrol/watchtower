import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORDRE_PHASES, formaterHeure, texteOmbre } from './soleil.js';

const SRC = readFileSync(new URL('./soleil.js', import.meta.url), 'utf8');

test('les phases du jour sont dans l ordre chronologique', () => {
  const cles = ORDRE_PHASES.map(([c]) => c);
  assert.ok(cles.indexOf('lever') < cles.indexOf('midiSolaire'));
  assert.ok(cles.indexOf('midiSolaire') < cles.indexOf('coucher'));
  assert.ok(cles.indexOf('aubeAstro') < cles.indexOf('lever'));
  assert.ok(cles.indexOf('coucher') < cles.indexOf('crepusculeAstro'));
  assert.equal(new Set(cles).size, cles.length, 'aucune phase en double');
});

test('formaterHeure tolere une phase inexistante', () => {
  // Nuit polaire : la phase vaut null, il ne faut pas planter.
  assert.equal(formaterHeure(null), null);
  assert.equal(formaterHeure(new Date('nope')), null);
  assert.equal(typeof formaterHeure(new Date('2026-09-21T12:00:00Z')), 'string');
});

test('texteOmbre dit clairement qu il n y a pas d ombre la nuit', () => {
  assert.match(texteOmbre(-5), /sous l’horizon/);
  assert.match(texteOmbre(45), /1\.0 ×/);
  assert.match(texteOmbre(1), /très longue/);
});

test('le calcul reste local : aucun appel reseau dans le module', () => {
  // Consigne du projet : robuste hors ligne.
  assert.ok(!/\bfetch\s*\(/.test(SRC), 'pas de fetch');
  assert.ok(!/XMLHttpRequest|axios/.test(SRC), 'pas de client HTTP');
  assert.ok(!/https?:\/\/(?!www\.w3)/.test(SRC.replace(/^\s*\*.*$/gm, '')),
    'aucune URL de service dans le code');
});

test('les API Cesium utilisees sont celles qui existent', () => {
  // Verifie contre la vraie surface d API (cf. controle manuel) : une faute
  // de frappe ici ne se verrait qu au runtime, dans le navigateur.
  assert.ok(SRC.includes('Cesium.ShadowMode.RECEIVE_ONLY'));
  assert.ok(SRC.includes('Cesium.JulianDate.fromDate'));
  assert.ok(SRC.includes('Cesium.PolylineGlowMaterialProperty'));
  assert.ok(SRC.includes('Cesium.CustomDataSource'));
});

test('le module se branche au dock et a la barre', () => {
  const MAIN = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  const BARRE = readFileSync(new URL('./barreFonctions.js', import.meta.url), 'utf8');
  assert.ok(MAIN.includes("id: 'soleil'"), 'ancre du dock');
  assert.ok(MAIN.includes('initSoleil'), 'module instancie');
  assert.ok(BARRE.includes("dock: 'soleil'"), 'entree dans la barre');
});
