import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES_OFFICIELLES, chercherSources, sourcesEmbarquables, domaines, LICENCE_OUVERTE } from './sourcesOfficielles.js';

test('le catalogue couvre les domaines utiles au hub', () => {
  const d = domaines();
  for (const attendu of ['referentiel', 'statistiques', 'economie', 'associations', 'finances', 'cartographie', 'risques']) {
    assert.ok(d.includes(attendu), `domaine ${attendu} couvert`);
  }
});

test('chaque source est complete et exploitable', () => {
  const ids = new Set();
  for (const s of SOURCES_OFFICIELLES) {
    assert.ok(s.id && !ids.has(s.id), `${s.id} unique`);
    ids.add(s.id);
    assert.ok(s.nom && s.editeur, `${s.id} nomme et attribue`);
    assert.match(s.url, /^https:\/\//, `${s.id} en https`);
    assert.ok(Array.isArray(s.fournit) && s.fournit.length, `${s.id} declare ce qu il fournit`);
    assert.equal(typeof s.cle, 'boolean');
    assert.equal(typeof s.horsLigne, 'boolean');
    assert.ok(s.licence, `${s.id} porte une licence`);
  }
});

test('aucune source du catalogue n exige de cle ni de compte payant', () => {
  for (const s of SOURCES_OFFICIELLES) {
    assert.equal(s.cle, false, `${s.id} accessible sans authentification`);
  }
});

test('les sources embarquables permettent le mode hors ligne', () => {
  const e = sourcesEmbarquables();
  assert.ok(e.length >= 6, `au moins 6 sources embarquables, vu ${e.length}`);
  for (const id of ['rna', 'cadastre-etalab', 'geo-api', 'comptes-collectivites']) {
    assert.ok(e.some((s) => s.id === id), `${id} embarquable`);
  }
});

test('les sources critiques sont bien presentes', () => {
  const parId = Object.fromEntries(SOURCES_OFFICIELLES.map((s) => [s.id, s]));
  assert.equal(parId.rna.editeur, 'Ministère de l’Intérieur');
  assert.equal(parId['comptes-collectivites'].domaine, 'finances');
  assert.ok(parId['ign-wfs'].note.includes('NON branché'), 'le WFS est signale comme non branche');
  assert.equal(parId['geo-api'].licence, LICENCE_OUVERTE);
});

test('chercherSources filtre correctement', () => {
  assert.ok(chercherSources({ domaine: 'cartographie' }).length >= 3);
  assert.equal(chercherSources({ domaine: 'inexistant' }).length, 0);
  assert.equal(chercherSources().length, SOURCES_OFFICIELLES.length);
  for (const s of chercherSources({ horsLigne: true })) assert.equal(s.horsLigne, true);
});
