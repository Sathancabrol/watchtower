import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRANSPORTS, JEUX_NATIONAUX, MARITIME,
  transportsDe, jeuxEmbarquables, maritimeMediterranee, inventaire,
} from './sourcesThau.js';
import { COMMUNES_THAU, toutesCommunes } from './frontignan.js';

test('chaque source est complete, sourcee et licenciee', () => {
  for (const s of inventaire()) {
    assert.ok(s.id, 'identifiant present');
    assert.ok(s.nom || s.reseau, `${s.id} nomme`);
    assert.ok(s.licence, `${s.id} porte une licence`);
    assert.equal(typeof s.cle, 'boolean', `${s.id} declare son besoin de cle`);
    const url = s.url || s.pan;
    assert.match(url, /^https:\/\//, `${s.id} a une URL verifiable`);
  }
});

test('les identifiants sont uniques sur tout l inventaire', () => {
  const vus = new Set();
  for (const s of inventaire()) {
    assert.ok(!vus.has(s.id), `${s.id} unique`);
    vus.add(s.id);
  }
});

test('les codes INSEE couverts existent dans le referentiel', () => {
  const connus = new Set(toutesCommunes().map((c) => c.insee));
  for (const t of TRANSPORTS) {
    for (const insee of t.couvre) {
      assert.ok(connus.has(insee), `${t.id} couvre ${insee}, commune connue`);
    }
  }
});

test('Frontignan et Sete sont desservies', () => {
  assert.ok(transportsDe('34108').some((t) => t.id === 'sam-mobilite'), 'Frontignan sur SAMobilite');
  assert.ok(transportsDe('34301').length >= 1, 'Sete desservie');
  assert.ok(transportsDe('34003').some((t) => t.id === 'capbus'), 'Agde sur Cap Bus');
  assert.deepEqual(transportsDe('99999'), [], 'commune inconnue : liste vide');
});

test('Agde releve d un autre reseau que le reste du bassin', () => {
  // Coherent avec son EPCI : CA Herault Mediterranee, pas Sete Agglopole.
  const agde = COMMUNES_THAU.find((c) => c.nom === 'Agde');
  assert.equal(agde.sam, false);
  assert.equal(transportsDe('34003').some((t) => t.id === 'sam-mobilite'), false);
});

test('les jeux embarquables permettent de repondre hors ligne', () => {
  const e = jeuxEmbarquables();
  assert.ok(e.length >= 6, `au moins 6 jeux hors ligne, vu ${e.length}`);
  for (const id of ['ban', 'cadastre-34', 'rna-34', 'sirene-etab']) {
    assert.ok(e.some((j) => j.id === id), `${id} embarquable`);
  }
  for (const j of e) {
    assert.equal(j.cle, false, `${j.id} sans cle`);
    assert.equal(j.horsLigne, true);
  }
});

test('chaque jeu declare ce qu il fournit', () => {
  for (const j of JEUX_NATIONAUX) {
    assert.ok(Array.isArray(j.fournit) && j.fournit.length, `${j.id} declare son contenu`);
    assert.ok(j.format, `${j.id} declare son format`);
  }
});

test('AIS : aucune source libre ne couvre la Mediterranee', () => {
  // Point de verite a ne pas edulcorer : les reseaux AIS ouverts sont regionaux.
  assert.equal(maritimeMediterranee({ sansCle: true }).length, 0,
    'pas de flux AIS mediterraneen libre et sans cle');
  const avecCle = maritimeMediterranee();
  assert.ok(avecCle.length >= 1, 'une voie existe avec une cle gratuite');
  assert.equal(avecCle[0].cle, true);
});

test('les sources AIS regionales sont honnetement etiquetees', () => {
  for (const id of ['openwaters', 'kystverket']) {
    const s = MARITIME.find((m) => m.id === id);
    assert.equal(s.couvreMediterranee, false, `${id} ne couvre pas la Mediterranee`);
    assert.ok(s.note.length > 20, `${id} explique sa portee`);
  }
});

test('le temps reel disponible est identifie', () => {
  const rt = TRANSPORTS.filter((t) => t.formats.includes('GTFS-RT'));
  assert.ok(rt.length >= 2, 'au moins deux flux temps reel');
  assert.ok(rt.some((t) => t.id === 'capbus'), 'Cap Bus en temps reel');
});

test('l inventaire classe tout sans rien perdre', () => {
  const inv = inventaire();
  assert.equal(inv.length, TRANSPORTS.length + JEUX_NATIONAUX.length + MARITIME.length);
  for (const c of ['transport', 'national', 'maritime']) {
    assert.ok(inv.some((s) => s.categorie === c), `categorie ${c} presente`);
  }
});
