// src/tracabilite.test.mjs — registre des sources & journal de traçabilité.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLE_JOURNAL, MAX_TRACES, SOURCES, ajouterTrace, echapper, effacerTraces, exportCsv,
  formaterTrace, htmlSources, lireTraces, liensVerification, sourceConnue, sourceDe,
} from './tracabilite.js';

test('le registre ne contient que des entrées complètes', () => {
  assert.ok(SOURCES.length >= 20);
  const vues = new Set();
  for (const s of SOURCES) {
    assert.match(s.cle, /^[a-z0-9_]+$/, `clé invalide : ${s.cle}`);
    assert.ok(!vues.has(s.cle), `clé dupliquée : ${s.cle}`);
    vues.add(s.cle);
    assert.match(s.url, /^https:\/\//, `URL non https : ${s.cle}`);
    assert.ok(s.nom && s.licence && s.donnees, `entrée incomplète : ${s.cle}`);
  }
});

test('sourceDe / sourceConnue savent répondre sans planter', () => {
  assert.equal(sourceDe('osm').nom, 'OpenStreetMap');
  assert.equal(sourceDe('inexistant'), null);
  assert.equal(sourceConnue('georisques'), true);
  assert.equal(sourceConnue('bidon'), false);
});

test('chaque source cite une licence vérifiable', () => {
  for (const s of SOURCES) {
    assert.ok(/ODbL|Licence Ouverte|CC|Domaine public|BSD|Flux|Base|jeton/i.test(s.licence), `${s.cle} : licence non documentée`);
  }
});

test('les sources de risques et d’entreprise sont bien référencées', () => {
  for (const cle of ['georisques', 'usgs', 'nasa_eonet', 'entreprises', 'insee', 'osm', 'wikidata', 'open_meteo']) {
    assert.ok(sourceConnue(cle), `source manquante : ${cle}`);
  }
});

test('htmlSources produit des hyperliens et échappe le texte', () => {
  const html = htmlSources(['osm', 'georisques']);
  assert.match(html, /href="https:\/\/www\.openstreetmap\.org\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener"/);
  assert.match(html, /OpenStreetMap/);
  assert.match(html, /Géorisques/);
});

test('htmlSources ignore les clés inconnues', () => {
  assert.equal(htmlSources(['fantome']), '');
  assert.equal(htmlSources([]), '');
  assert.equal(htmlSources(['osm', 'fantome']).match(/<a /g).length, 1);
});

test('echapper neutralise le HTML injecté', () => {
  assert.equal(echapper('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(echapper(null), '');
});

test('liens de vérification : tous rattachés à une source connue', () => {
  const l = liensVerification(43.44, 3.69, '34108');
  assert.ok(l.length >= 4);
  for (const x of l) {
    assert.ok(sourceConnue(x.cle), `clé inconnue : ${x.cle}`);
    assert.match(x.url, /^https:\/\//);
    assert.ok(x.nom);
  }
  const rapport = l.find((x) => x.cle === 'georisques');
  assert.match(rapport.url, /latlon=3\.69,43\.44/); // Géorisques : longitude d'abord
});

test('le journal est inerte hors navigateur (aucun plantage)', () => {
  // `window` n'existe pas sous Node : on doit obtenir null / [] et non une erreur.
  assert.equal(ajouterTrace({ nom: 'test', lat: 43, lon: 3 }), null);
  assert.deepEqual(lireTraces(), []);
  assert.equal(effacerTraces(), 0);
});

test('exportCsv produit un en-tête complet et échappe les guillemets', () => {
  const csv = exportCsv([
    { quand: Date.UTC(2026, 8, 5, 10, 30), nom: 'Cuves "Nord"', fonction: 'Cuve', lat: 43.44, lon: 3.69, sources: ['osm', 'georisques'], note: '' },
  ]);
  const [entete, ligne] = csv.split('\n');
  assert.match(entete, /^date;heure;nom;fonction;lat;lon;sources;note$/);
  assert.match(ligne, /Cuves ""Nord""/);
  assert.match(ligne, /osm georisques/);
  assert.match(ligne, /"43\.440000";"3\.690000"/);
});

test('exportCsv d’un journal vide = en-tête seul', () => {
  assert.equal(exportCsv([]).split('\n').length, 1);
});

test('formaterTrace résume une trace datée et localisée', () => {
  const txt = formaterTrace({
    quand: Date.UTC(2026, 8, 5, 8, 5), nom: 'Bibliothèque de Frontignan', fonction: 'Bibliothèque',
    lat: 43.44321, lon: 3.69012, sources: ['osm'], note: '',
  });
  assert.match(txt, /^\[05\/09\/2026/);
  assert.match(txt, /Bibliothèque de Frontignan \(Bibliothèque\)/);
  assert.match(txt, /43\.44321, 3\.69012/);
  assert.match(txt, /sources : osm/);
});

test('constantes de journal exposées', () => {
  assert.equal(CLE_JOURNAL, 'watchtower.tracabilite.v1');
  assert.ok(MAX_TRACES >= 100);
});
