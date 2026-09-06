// src/radio.test.mjs — annuaire Radio-Browser (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliserStation, nettoyerListe, urlRecherche } from './radio.js';

test('URL de recherche géolocalisée', () => {
  const u = new URL(urlRecherche('https://x.api', {
    lat: 43.4, lon: 3.69, rayon: 150_000, limite: 40,
  }));
  assert.equal(u.pathname, '/json/stations/search');
  assert.equal(u.searchParams.get('geo_lat'), '43.4');
  assert.equal(u.searchParams.get('geo_long'), '3.69');
  assert.equal(u.searchParams.get('geo_distance'), '150000');
  assert.equal(u.searchParams.get('has_geo_info'), 'true');
  assert.equal(u.searchParams.get('hidebroken'), 'true');
  assert.equal(u.searchParams.get('limit'), '40');
});

test('URL de recherche textuelle : nom, pays, genre, langue', () => {
  const u = new URL(urlRecherche('https://x.api', { nom: 'france inter', pays: 'fr', genre: 'jazz', langue: 'french' }));
  assert.equal(u.searchParams.get('name'), 'france inter');
  assert.equal(u.searchParams.get('countrycode'), 'FR');
  assert.equal(u.searchParams.get('tag'), 'jazz');
  assert.equal(u.searchParams.get('language'), 'french');
  assert.equal(u.searchParams.get('has_geo_info'), null);
});

test('le rayon est arrondi et jamais négatif', () => {
  const u = new URL(urlRecherche('https://x.api', { lat: 0, lon: 0, rayon: -5 }));
  assert.equal(u.searchParams.get('geo_distance'), '100');
});

test('normalisation d’une station complète', () => {
  const s = normaliserStation({
    stationuuid: 'abc',
    name: '  Radio Sète  ',
    url: 'http://flux.pls',
    url_resolved: 'https://flux.example/stream',
    homepage: 'https://radio.example',
    favicon: 'https://radio.example/fav.png',
    tags: 'jazz,pop, chanson , news',
    country: 'France',
    countrycode: 'FR',
    codec: 'MP3',
    bitrate: '128',
    votes: '42',
    geo_lat: 43.4,
    geo_long: 3.69,
  });
  assert.equal(s.id, 'abc');
  assert.equal(s.nom, 'Radio Sète');
  assert.equal(s.url, 'https://flux.example/stream', 'le flux résolu est prioritaire');
  assert.equal(s.debit, 128);
  assert.equal(s.votes, 42);
  assert.deepEqual(s.tags, ['jazz', 'pop', 'chanson', 'news'].slice(0, 4));
  assert.equal(s.lat, 43.4);
});

test('les stations sans flux et sans position sont gérées', () => {
  assert.equal(normaliserStation({ name: 'x' }), null, 'pas d’URL = pas de station');
  assert.equal(normaliserStation(null), null);
  const sans = normaliserStation({ url: 'https://a/b', geo_lat: null, geo_long: null });
  assert.equal(sans.lat, null);
  assert.equal(sans.nom, 'Sans nom');
});

test('nettoyage : doublons, invalides et limite de tags', () => {
  const brut = [
    { name: 'Alpha', url: 'https://a/1' },
    { name: 'alpha', url: 'https://a/2' },            // doublon (casse ignorée)
    { name: 'Beta', url: 'https://b/1' },
    { name: 'Sans flux' },                            // écarté
    { name: 'Gamma', url: 'https://g/1', tags: 'a,b,c,d,e,f,g' },
  ];
  const liste = nettoyerListe(brut);
  assert.deepEqual(liste.map((s) => s.nom.toLowerCase()), ['alpha', 'beta', 'gamma']);
  assert.ok(liste[2].tags.length <= 4, 'les tags sont coupés');
  assert.deepEqual(nettoyerListe([]), []);
  assert.deepEqual(nettoyerListe(null), []);
});
