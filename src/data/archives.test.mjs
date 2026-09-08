import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GIBS_DEBUT, formaterDateIso, bornerDateGibs, urlTuilesGibs,
  urlRequeteWayback, normaliserWayback, decrireArchive, echelleTemporelle,
} from './archives.js';

test('formaterDateIso rend AAAA-MM-JJ en UTC', () => {
  assert.equal(formaterDateIso(new Date('2019-07-04T23:30:00Z')), '2019-07-04');
  assert.equal(formaterDateIso('2001-01-09'), '2001-01-09');
  for (const mauvais of ['pas une date', NaN, undefined]) {
    assert.equal(formaterDateIso(mauvais), null);
  }
});

test('bornerDateGibs respecte le debut du fonds et le retard de publication', () => {
  assert.equal(bornerDateGibs('1990-01-01'), GIBS_DEBUT, 'avant 2000 => borne basse');
  const dansLeFutur = bornerDateGibs(new Date(Date.now() + 30 * 86_400_000));
  const veille = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  assert.equal(dansLeFutur, veille, 'jamais au-dela de la veille');
  assert.equal(bornerDateGibs('2015-06-15'), '2015-06-15', 'date valide inchangee');
});

test('urlTuilesGibs place la date dans le chemin WMTS', () => {
  const t = urlTuilesGibs('2015-06-15');
  assert.equal(t.date, '2015-06-15');
  assert.ok(t.url.includes('/2015-06-15/'), 'la date est dans le chemin');
  assert.ok(t.url.includes('{z}/{y}/{x}'), 'gabarit de tuiles conserve');
  assert.match(t.credit, /NASA GIBS/);
});

test('urlRequeteWayback exige une URL http(s) et encode la date', () => {
  const u = urlRequeteWayback('https://exemple.fr/page', '2010-03-02');
  assert.ok(u.startsWith('https://archive.org/wayback/available?'));
  assert.ok(u.includes('timestamp=20100302'), 'horodatage compacte');
  assert.ok(urlRequeteWayback('https://exemple.fr').includes('url=https'), 'date facultative');
  for (const mauvais of ['', '   ', 'ftp://x.fr', 'pas une url', null, undefined]) {
    assert.equal(urlRequeteWayback(mauvais), null, `doit rejeter ${JSON.stringify(mauvais)}`);
  }
});

test('normaliserWayback lit une archive disponible et force https', () => {
  const ok = normaliserWayback({ archived_snapshots: { closest: {
    available: true, url: 'http://web.archive.org/web/20120504/https://exemple.fr', timestamp: '20120504120000',
  }}});
  assert.equal(ok.disponible, true);
  assert.ok(ok.url.startsWith('https://'), 'http reecrit en https');
  assert.equal(ok.annee, 2012);
});

test('normaliserWayback renvoie un vide sur toutes les formes d absence', () => {
  const attendu = { disponible: false, url: null, horodatage: null, annee: null };
  assert.deepEqual(normaliserWayback({ archived_snapshots: {} }), attendu);
  assert.deepEqual(normaliserWayback({ archived_snapshots: { closest: { available: false } } }), attendu);
  assert.deepEqual(normaliserWayback(null), attendu);
  assert.deepEqual(normaliserWayback('bruit'), attendu);
});

test('decrireArchive parle francais dans les deux cas', () => {
  assert.match(decrireArchive({ disponible: true, annee: 2008 }), /version de 2008/);
  assert.match(decrireArchive({ disponible: false }), /Aucune archive/);
  assert.match(decrireArchive(null), /Aucune archive/);
});

test('echelleTemporelle produit des reperes ordonnes et bornes', () => {
  const e = echelleTemporelle(5);
  assert.equal(e.length, 6, '5 ans + aujourd hui');
  assert.equal(e.at(-1).libelle, "aujourd'hui");
  assert.equal(e[0].libelle, 'il y a 5 ans');
  const dates = e.map((x) => x.date);
  assert.deepEqual(dates, [...dates].sort(), 'du plus ancien au plus recent');
  assert.ok(echelleTemporelle(999).length <= 31, 'profondeur plafonnee');
  assert.ok(echelleTemporelle(-3).length > 0, 'valeur absurde => repli sain');
});
