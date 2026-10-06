import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCES_DOCUMENTS, normaliserDoi, extraireDoi, planDeRecherche, urlPour, sourcesFrancaises,
} from './sourcesDocuments.js';

test('chaque source est utilisable : un nom, une portee, une note qui aide a choisir', () => {
  const portees = new Set(['mondial', 'france', 'local']);
  for (const s of SOURCES_DOCUMENTS) {
    assert.ok(s.id && s.nom, 'source sans identite');
    assert.ok(portees.has(s.portee), `${s.id} : portee inconnue « ${s.portee} »`);
    assert.ok(s.genre, `${s.id} : on ne sait pas ce qu on y trouve`);
    assert.ok(s.note.length > 40, `${s.id} : la note doit dire ce que la source apporte`);
    assert.ok(s.parDoi || s.parTexte, `${s.id} : interrogeable par rien`);
  }
});

test('les identifiants sont uniques', () => {
  const ids = SOURCES_DOCUMENTS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('AUCUN miroir pirate dans le registre', () => {
  // Garde-fou explicite : la couche documents ne sert que des sources legales.
  // Une version deposee par l auteur se cite et ne disparait pas ; un miroir
  // pirate ne donne ni provenance defendable ni perennite.
  const interdits = ['sci-hub', 'scihub', 'sci-bot', 'libgen', 'library.lol',
    'z-lib', 'zlibrary', 'annas-archive', 'anna-archive'];
  const tout = JSON.stringify(SOURCES_DOCUMENTS.map((s) => [s.id, s.nom, s.api, s.note]))
    .toLowerCase();
  for (const mot of interdits) {
    assert.ok(!tout.includes(mot), `source illicite dans le registre : ${mot}`);
  }
  // ... et les constructeurs d URL non plus.
  for (const s of SOURCES_DOCUMENTS) {
    const u = `${s.parDoi?.('10.1000/x') || ''} ${s.parTexte?.('x') || ''}`.toLowerCase();
    for (const mot of interdits) assert.ok(!u.includes(mot), `${s.id} pointe vers ${mot}`);
  }
});

test('toutes les URL sont en HTTPS', () => {
  for (const s of SOURCES_DOCUMENTS) {
    for (const u of [s.api, s.parDoi?.('10.1000/abc'), s.parTexte?.('thau')]) {
      if (u) assert.ok(u.startsWith('https://'), `${s.id} : ${u}`);
    }
  }
});

test('un DOI est reconnu sous toutes les formes ou on le rencontre', () => {
  const attendu = '10.1016/j.marpolbul.2019.01.023';
  for (const forme of [
    '10.1016/j.marpolbul.2019.01.023',
    'https://doi.org/10.1016/j.marpolbul.2019.01.023',
    'http://dx.doi.org/10.1016/j.marpolbul.2019.01.023',
    'doi:10.1016/j.marpolbul.2019.01.023',
    '  10.1016/J.MARPOLBUL.2019.01.023  ',
  ]) {
    assert.equal(normaliserDoi(forme), attendu, forme);
  }
});

test('ce qui n est pas un DOI est refuse', () => {
  for (const faux of ['', null, undefined, 'etang de Thau', '10.x/abc', '9.1234/abc', '10.1/a']) {
    assert.equal(normaliserDoi(faux), '', String(faux));
  }
});

test('un DOI colle au milieu d une reference est retrouve', () => {
  const ref = 'Pernet et al. (2019). Mortalite. Mar. Poll. Bull. doi:10.1016/j.x.2019.01.023, p. 12.';
  assert.equal(extraireDoi(ref), '10.1016/j.x.2019.01.023');
  assert.equal(extraireDoi('aucun identifiant ici'), '');
  // la ponctuation de fin ne doit pas etre avalee
  // la ponctuation finale de la phrase ne doit pas etre avalee dans le DOI
  assert.equal(extraireDoi('voir 10.1016/j.abc.2020.05.001.'), '10.1016/j.abc.2020.05.001');
  assert.equal(extraireDoi('cf. 10.1016/j.abc.2020.05.001; puis'), '10.1016/j.abc.2020.05.001');
});

test('avec un DOI, on commence par les sources qui savent le resoudre', () => {
  const plan = planDeRecherche({ doi: '10.1016/j.x.2019.01.023' });
  assert.ok(plan.length > 0);
  assert.ok(plan[0].parDoi, 'la premiere source doit savoir resoudre un DOI');
  const premierSansDoi = plan.findIndex((s) => !s.parDoi);
  const dernierAvecDoi = plan.map((s) => Boolean(s.parDoi)).lastIndexOf(true);
  assert.ok(premierSansDoi === -1 || premierSansDoi > dernierAvecDoi,
    'les sources a DOI doivent toutes preceder les autres');
});

test('sans DOI, les sources francaises passent devant — l app sert un territoire francais', () => {
  const plan = planDeRecherche({ texte: 'malaigue etang de Thau' });
  assert.equal(plan[0].portee, 'france');
  const dernierFr = plan.map((s) => s.portee === 'france').lastIndexOf(true);
  const premierAutre = plan.findIndex((s) => s.portee !== 'france');
  assert.ok(premierAutre === -1 || premierAutre > dernierFr);
});

test('urlPour encode la requete et ne fabrique jamais d URL bancale', () => {
  const u = urlPour('hal', { texte: 'huîtres & "malaïgue" /2018' });
  assert.ok(u.startsWith('https://'));
  assert.ok(!u.includes(' '), 'les espaces doivent etre encodes');
  assert.ok(!u.includes('"'), 'les guillemets doivent etre encodes');
  assert.equal(urlPour('source-qui-nexiste-pas', { texte: 'x' }), '');
  assert.equal(urlPour('hal', {}), '', 'une requete vide ne produit pas d URL');
});

test('un DOI l emporte sur le texte libre quand la source sait le resoudre', () => {
  const u = urlPour('openalex', { doi: '10.1016/j.x.2019.01.023', texte: 'thau' });
  assert.ok(u.includes('doi:10.1016'), u);
});

test('les sources francaises couvrent droit, recherche et donnees publiques', () => {
  const ids = new Set(sourcesFrancaises().map((s) => s.id));
  for (const attendu of ['hal', 'theses', 'legifrance', 'datagouv', 'gallica']) {
    assert.ok(ids.has(attendu), `source francaise manquante : ${attendu}`);
  }
});
