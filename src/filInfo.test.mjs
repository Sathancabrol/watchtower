// src/filInfo.test.mjs — fil d'information des bandeaux INTEL (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES_FIL, depeche, distanceM, filtrerParCategorie, tickerHtml,
  tickerTexte, trierDepeches, urlEntreprisesProches, urlGdelt, urlMeteo, urlSeismes,
} from './filInfo.js';
import { sourceConnue } from './tracabilite.js';

test('les catégories du fil couvrent les vues de l’INTEL', () => {
  for (const c of ['contexte', 'communal', 'individuel', 'politique', 'economique', 'production']) {
    assert.ok(CATEGORIES_FIL.includes(c), `catégorie manquante : ${c}`);
  }
});

test('une dépêche sans source connue est REFUSÉE (rien n’est inventé)', () => {
  assert.equal(depeche({ titre: 'Rumeur', sourceCle: 'inconnu' }), null);
  assert.equal(depeche({ titre: '', sourceCle: 'osm' }), null);
  assert.equal(depeche({}), null);
});

test('une dépêche valide porte sa source, son heure et son lien', () => {
  const d = depeche({ titre: 'Séisme M4.2', detail: 'à 30 km', url: 'https://usgs.gov', sourceCle: 'usgs', gravite: 2 });
  assert.equal(d.titre, 'Séisme M4.2');
  assert.equal(d.sourceCle, 'usgs');
  assert.equal(d.gravite, 2);
  assert.ok(sourceConnue(d.sourceCle));
  assert.ok(d.quand <= Date.now());
});

test('une URL non http est écartée (pas de javascript:)', () => {
  const d = depeche({ titre: 'X', url: 'javascript:alert(1)', sourceCle: 'osm' });
  assert.equal(d.url, '');
});

test('les textes sont tronqués (un bandeau reste lisible)', () => {
  const d = depeche({ titre: 'a'.repeat(400), detail: 'b'.repeat(500), sourceCle: 'osm' });
  assert.equal(d.titre.length, 160);
  assert.equal(d.detail.length, 240);
});

test('tri : gravité d’abord, fraîcheur ensuite, sans doublon', () => {
  const t0 = Date.UTC(2026, 8, 5, 10, 0);
  const l = trierDepeches([
    depeche({ titre: 'Info calme', sourceCle: 'osm', quand: t0 + 5000, gravite: 0 }),
    depeche({ titre: 'ALERTE', sourceCle: 'usgs', quand: t0, gravite: 3 }),
    depeche({ titre: '  ALERTE  ', sourceCle: 'usgs', quand: t0 + 9000, gravite: 3 }), // doublon
    depeche({ titre: 'Récent', sourceCle: 'gdelt', quand: t0 + 9000, gravite: 0 }),
  ]);
  assert.equal(l.length, 3, 'le doublon est éliminé');
  assert.equal(l[0].titre, 'ALERTE');
  assert.equal(l[1].titre, 'Récent');
  assert.equal(l[2].titre, 'Info calme');
});

test('le tri ignore les entrées invalides et respecte la limite', () => {
  const l = trierDepeches([
    depeche({ titre: 'a', sourceCle: 'osm' }), depeche({ titre: 'b', sourceCle: 'osm' }),
    depeche({ titre: 'c', sourceCle: 'osm' }), null, undefined, {},
  ], 2);
  assert.equal(l.length, 2);
});

test('le bandeau CONTEXTE prend tout, les autres filtrent', () => {
  const l = [
    depeche({ titre: 'éco', categorie: 'economique', sourceCle: 'entreprises' }),
    depeche({ titre: 'séisme', categorie: 'production', sourceCle: 'usgs' }),
  ];
  assert.equal(filtrerParCategorie(l, 'contexte').length, 2);
  assert.equal(filtrerParCategorie(l, 'economique').length, 1);
  assert.equal(filtrerParCategorie(l, 'economique')[0].titre, 'éco');
  assert.equal(filtrerParCategorie(l, 'inconnue').length, 0);
});

test('texte du bandeau : icône + titre + détail', () => {
  const t = tickerTexte([depeche({ ic: '🌤', titre: '18°C', detail: 'vent 12 km/h', sourceCle: 'open_meteo' })]);
  assert.equal(t, '🌤 18°C — vent 12 km/h');
  assert.equal(tickerTexte([]), '');
});

test('HTML du bandeau : des liens cliquables, jamais de source orpheline', () => {
  const h = tickerHtml([
    depeche({ ic: '📰', titre: 'Actu', url: 'https://x.test/a', sourceCle: 'gdelt' }),
    depeche({ ic: '🏢', titre: 'Entreprise', sourceCle: 'entreprises' }),
  ]);
  assert.match(h, /<a href="https:\/\/x.test\/a" target="_blank" rel="noopener">/);
  assert.match(h, /<span>🏢 Entreprise<\/span>/);
  assert.match(tickerHtml([]), /Aucune dépêche/);
});

test('URL GDELT : terme encodé, fenêtre et volume réglables', () => {
  const u = new URL(urlGdelt('Frontignan', { heures: 72, max: 4 }));
  assert.equal(u.hostname, 'api.gdeltproject.org');
  assert.equal(u.searchParams.get('mode'), 'artlist');
  assert.equal(u.searchParams.get('maxrecords'), '4');
  assert.equal(u.searchParams.get('timespan'), '3d');
  assert.match(u.searchParams.get('query'), /"Frontignan"/);
  assert.equal(new URL(urlGdelt('X', { heures: 6 })).searchParams.get('timespan'), '6h');
});

test('URL séismes USGS : flux public des dernières 24 h', () => {
  assert.equal(urlSeismes(), 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
});

test('URL météo : point arrondi et variables utiles au vol', () => {
  const u = new URL(urlMeteo(43.44321, 3.69012));
  assert.equal(u.searchParams.get('latitude'), '43.443');
  assert.equal(u.searchParams.get('longitude'), '3.690');
  assert.match(u.searchParams.get('current'), /wind_speed_10m/);
});

test('URL entreprises proches : rayon borné à 50 km, longitude « long »', () => {
  const u = new URL(urlEntreprisesProches(43.44, 3.69, 2));
  assert.equal(u.pathname, '/near_point');
  assert.equal(u.searchParams.get('lat'), '43.44000');
  assert.equal(u.searchParams.get('long'), '3.69000');
  assert.equal(u.searchParams.get('radius'), '2');
  assert.equal(new URL(urlEntreprisesProches(0, 0, 999)).searchParams.get('radius'), '50');
  assert.equal(new URL(urlEntreprisesProches(0, 0, -4)).searchParams.get('radius'), '0.1');
});

test('distance utilisée pour écarter les séismes lointains', () => {
  const d = distanceM({ lat: 43.44, lon: 3.69 }, { lat: 48.85, lon: 2.35 }) / 1000;
  assert.ok(d > 590 && d < 620, `Paris–Sète ≈ 600 km, obtenu ${d}`);
});
