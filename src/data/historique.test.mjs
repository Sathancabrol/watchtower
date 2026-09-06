/**
 * Tests — MODE HISTORIQUE (données pures).
 * La règle du module : ne jamais inventer une date sans la marquer.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PERIODES,
  analyser,
  anneeDepuisBalise,
  courbeCroissance,
  decennieDe,
  estimerNonDates,
  groupesParDecennie,
  groupesVisibles,
  lireBalise,
  nomQualite,
  periodeDe,
  resumer,
  visiblesA,
} from './historique.js';

const lot = (id, tags = {}, extra = {}) => ({
  id,
  lon: 3.75 + id / 1000,
  lat: 43.44 + id / 1000,
  anneau: [[0, 0], [0, 1], [1, 1], [1, 0]],
  h: 9,
  sol: 0,
  nom: `bâtiment ${id}`,
  tags,
  ...extra,
});

test('une année simple est lue exactement', () => {
  const r = anneeDepuisBalise('1850');
  assert.equal(r.debut, 1850);
  assert.equal(r.qualite, 'exacte');
});

test('une date ISO ne passe pas pour un intervalle', () => {
  const r = anneeDepuisBalise('1850-06-12');
  assert.equal(r.debut, 1850);
  assert.equal(r.fin, null, 'pas de fin : le bâtiment est toujours debout');
});

test('« 1850-1870 » est un intervalle, pas une date ISO', () => {
  const r = anneeDepuisBalise('1850-1870');
  assert.equal(r.debut, 1850);
  assert.equal(r.fin, 1870);
  assert.equal(r.qualite, 'intervalle');
});

test('les décennies, siècles et approximations sont comprises', () => {
  assert.deepEqual(
    [anneeDepuisBalise('1850s').debut, anneeDepuisBalise('1850s').qualite],
    [1850, 'decennie'],
  );
  const c19 = anneeDepuisBalise('C19');
  assert.equal(c19.debut, 1801);
  assert.equal(c19.fin, 1900);
  assert.equal(c19.qualite, 'siecle');
  const XIXe = anneeDepuisBalise('XIXe siècle');
  assert.equal(XIXe.debut, 1801);
  const xviii = anneeDepuisBalise('18th century');
  assert.equal(xviii.debut, 1701);
  assert.equal(anneeDepuisBalise('~1850').debut, 1840);
  assert.equal(anneeDepuisBalise('vers 1900').qualite, 'approchee');
});

test('« avant 1900 » veut dire « déjà debout », « après 1900 » « pas encore »', () => {
  const avant = anneeDepuisBalise('before 1900');
  assert.equal(avant.debut, null);
  assert.equal(avant.fin, 1900);
  assert.equal(avant.qualite, 'avant');
  const apres = anneeDepuisBalise('après 1900');
  assert.equal(apres.debut, 1900);
  assert.equal(apres.qualite, 'apres');
});

test('les époques en mots clés sont reconnues', () => {
  assert.equal(anneeDepuisBalise('médiéval').debut, 500);
  assert.equal(anneeDepuisBalise('romain').fin, 500);
});

test('une balise vide ou absente reste « inconnue » (pas d’invention)', () => {
  for (const v of ['', '   ', null, undefined, 'inconnu']) {
    assert.equal(anneeDepuisBalise(v).qualite, 'inconnue', `pour ${JSON.stringify(v)}`);
  }
  assert.equal(anneeDepuisBalise('inconnu').debut, null);
});

test('les périodes couvrent toute la fenêtre sans trou', () => {
  const triees = PERIODES.filter((p) => p.id !== 'inconnue').sort((a, b) => a.debut - b.debut);
  for (let i = 1; i < triees.length; i += 1) {
    assert.equal(triees[i].debut, triees[i - 1].fin + 1, `trou entre ${triees[i - 1].id} et ${triees[i].id}`);
  }
  assert.equal(periodeDe(1750).id, 'avant1800');
  assert.equal(periodeDe(1860).id, 'xix');
  assert.equal(periodeDe(1930).id, 'belle');
  assert.equal(periodeDe(1960).id, 'trente');
  assert.equal(periodeDe(1990).id, 'finxx');
  assert.equal(periodeDe(2015).id, 'xxi');
  assert.equal(periodeDe(null).id, 'inconnue');
});

test('lireBalise prend la première balise renseignée', () => {
  assert.equal(lireBalise({ start_date: '1850', construction: '1860' }, ['start_date', 'construction']), '1850');
  assert.equal(lireBalise({ construction: '1860' }, ['start_date', 'construction']), '1860');
  assert.equal(lireBalise({}, ['start_date']), '');
});

test('analyser sépare datés et non datés', () => {
  const a = analyser([
    lot(1, { start_date: '1850' }),
    lot(2, {}),
    lot(3, { start_date: '1960s' }),
    lot(4, { name: 'sans date' }),
  ], { maintenant: 2026 });
  assert.equal(a.total, 4);
  assert.equal(a.dates.length, 2);
  assert.equal(a.nonDates.length, 2);
  assert.equal(a.parPeriode.xix, 1);
  assert.equal(a.parPeriode.trente, 1);
  assert.equal(a.parPeriode.inconnue, 2);
  assert.equal(a.min, 1800);
  assert.equal(a.max, 2026);
});

test('un bâtiment démoli disparaît après sa fin', () => {
  const a = analyser([lot(1, { start_date: '1850', end_date: '1900' })], { maintenant: 2026 });
  assert.equal(visiblesA(a, 1890).length, 1);
  assert.equal(visiblesA(a, 1910).length, 0);
});

test('les non datés sont masqués par défaut, et ne le sont plus sur demande', () => {
  const a = analyser([lot(1, { start_date: '1850' }), lot(2, {})], { maintenant: 2026 });
  assert.equal(visiblesA(a, 1900).length, 1);
  assert.equal(visiblesA(a, 1900, { inclureNonDates: true }).length, 2);
});

test('un bâtiment n’apparaît pas avant sa date', () => {
  const a = analyser([lot(1, { start_date: '1850' })], { maintenant: 2026 });
  assert.equal(visiblesA(a, 1800).length, 0);
  assert.equal(visiblesA(a, 1850).length, 1);
  assert.equal(visiblesA(a, 2026).length, 1);
});

test('les groupes par décennie permettent d’animer sans reconstruire', () => {
  const a = analyser([
    lot(1, { start_date: '1850' }),
    lot(2, { start_date: '1857' }),
    lot(3, { start_date: '1962' }),
    lot(4, {}),
  ], { maintenant: 2026 });
  const g = groupesParDecennie(a);
  assert.equal(g.length, 3, '1850s, 1960s et les non datés');
  assert.equal(g[0].decennie, 1850);
  assert.equal(g[0].lots.length, 2);
  assert.equal(g[1].decennie, 1960);
  assert.equal(g[2].decennie, null);
  assert.equal(groupesVisibles(g, 1900).length, 1);
  assert.equal(groupesVisibles(g, 1970).length, 2);
  assert.equal(groupesVisibles(g, 1970, { inclureNonDates: true }).length, 3);
});

test('la courbe de croissance est cumulative et bornée par la fenêtre', () => {
  const a = analyser([
    lot(1, { start_date: '1850' }),
    lot(2, { start_date: '1960' }),
    lot(3, {}),
  ], { maintenant: 2026 });
  const c = courbeCroissance(a, { pas: 50 });
  assert.ok(c.length > 3);
  assert.equal(c[0].annee, 1800);
  const en1900 = c.find((p) => p.annee === 1900);
  const en2000 = c.find((p) => p.annee === 2000);
  assert.equal(en1900.presents, 1);
  assert.equal(en2000.presents, 2, 'les non datés ne comptent pas');
  for (let i = 1; i < c.length; i += 1) {
    assert.ok(c[i].presents >= c[i - 1].presents, 'la courbe ne redescend pas');
  }
});

test('l’hypothèse de datation est marquée « estimée » et jamais mélangée aux vraies dates', () => {
  const a = analyser([
    lot(1, { start_date: '1850' }),
    lot(2, { start_date: '1900' }),
    lot(3, {}),
    lot(4, {}),
  ], { maintenant: 2026 });
  const e = estimerNonDates(a, { graine: 3 });
  const estimes = e.lots.filter((l) => l.estimee);
  assert.equal(estimes.length, 2, 'les deux non datés reçoivent une hypothèse');
  for (const l of estimes) {
    assert.equal(l.qualite, 'estimee');
    assert.ok([1850, 1900].includes(l.debut), 'l’année vient de la répartition observée');
    assert.equal(l.datee, false, 'une estimation n’est pas une date OSM');
  }
  assert.equal(e.dates.length, 2, 'les dates réelles restent comptées à part');
  // masqués par défaut : l’hypothèse doit être assumée pour s’afficher
  assert.equal(visiblesA(e, 1950).length, 2);
  assert.equal(visiblesA(e, 1950, { inclureEstimes: true }).length, 4);
  // déterministe : même graine → même résultat
  assert.deepEqual(
    estimerNonDates(a, { graine: 3 }).lots.map((l) => l.debut),
    e.lots.map((l) => l.debut),
  );
});

test('décennieDe arrondit au multiple de 10', () => {
  assert.equal(decennieDe(1857), 1850);
  assert.equal(decennieDe(2026), 2020);
  assert.equal(decennieDe(null), null);
});

test('le résumé annonce les trois provenances (traceabilité)', () => {
  const a = analyser([lot(1, { start_date: '1850' }), lot(2, {})], { maintenant: 2026 });
  const t = resumer(a, 1900);
  assert.match(t, /En <b>1900<\/b>/);
  assert.match(t, /<b>1<\/b> bâtiment/);
  assert.match(t, /1 daté par OSM/);
  assert.match(t, /1 non daté masqué/);
});

test('les qualités de date ont un nom lisible', () => {
  assert.equal(nomQualite('approchee'), 'approchée (±10 ans)');
  assert.match(nomQualite('estimee'), /HYPOTHÈSE/);
  assert.equal(nomQualite('nawak'), nomQualite('inconnue'));
});
