import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NIVEAUX_CRUE, normaliserNiveau, decrireNiveau,
  extraireTroncons, normaliserTroncon, normaliserReponse, resumerVigilance,
} from './crues.js';

test('normaliserNiveau borne 1..4 et rejette le reste', () => {
  assert.equal(normaliserNiveau(3), 3);
  assert.equal(normaliserNiveau('4'), 4);
  for (const mauvais of [0, 5, -1, 'vert', null, undefined, NaN, {}]) {
    assert.equal(normaliserNiveau(mauvais), null, `doit rejeter ${JSON.stringify(mauvais)}`);
  }
});

test('decrireNiveau rend libelle et couleur officiels', () => {
  assert.deepEqual(decrireNiveau(4), { niveau: 4, ...NIVEAUX_CRUE[4] });
  assert.equal(decrireNiveau(9), null);
});

test('extraireTroncons accepte les differentes formes de reponse', () => {
  assert.equal(extraireTroncons({ TronVigiCru: [{ a: 1 }] }).length, 1);
  assert.equal(extraireTroncons({ features: [{ a: 1 }, { b: 2 }] }).length, 2);
  for (const vide of [null, undefined, 42, 'x', {}]) {
    assert.deepEqual(extraireTroncons(vide), [], 'jamais null');
  }
});

test('normaliserTroncon lit le format plat et le format GeoJSON', () => {
  const plat = normaliserTroncon({ CdEntVigiCru: 'T1', LbEntVigiCru: 'Hérault aval', NivInfoVigiCru: '3' });
  assert.deepEqual(plat, { id: 'T1', nom: 'Hérault aval', niveau: 3, ...NIVEAUX_CRUE[3] });
  const geo = normaliserTroncon({ properties: { CdEntVigiCru: 'T2', LbEntVigiCru: 'Lez', NivInfoVigiCru: 1 } });
  assert.equal(geo.niveau, 1);
  assert.equal(normaliserTroncon({ LbEntVigiCru: 'sans niveau' }), null, 'sans niveau lisible => ignore');
  assert.equal(normaliserTroncon(null), null);
});

test('normaliserReponse trie du plus grave au moins grave', () => {
  const out = normaliserReponse({ TronVigiCru: [
    { CdEntVigiCru: 'a', LbEntVigiCru: 'A', NivInfoVigiCru: 1 },
    { CdEntVigiCru: 'b', LbEntVigiCru: 'B', NivInfoVigiCru: 4 },
    { CdEntVigiCru: 'c', LbEntVigiCru: 'C', NivInfoVigiCru: 2 },
    { LbEntVigiCru: 'illisible' },
  ]});
  assert.deepEqual(out.map((t) => t.niveau), [4, 2, 1], 'tri decroissant, illisible ecarte');
});

test('resumerVigilance compte et formule le bandeau', () => {
  const calme = resumerVigilance([{ niveau: 1 }, { niveau: 1 }]);
  assert.equal(calme.max, 1);
  assert.match(calme.texte, /aucune vigilance/);

  const alerte = resumerVigilance(normaliserReponse({ TronVigiCru: [
    { CdEntVigiCru: 'a', LbEntVigiCru: 'A', NivInfoVigiCru: 3 },
    { CdEntVigiCru: 'b', LbEntVigiCru: 'B', NivInfoVigiCru: 2 },
    { CdEntVigiCru: 'c', LbEntVigiCru: 'C', NivInfoVigiCru: 1 },
  ]}));
  assert.equal(alerte.max, 3);
  assert.equal(alerte.total, 3);
  assert.equal(alerte.parNiveau[3], 1);
  assert.match(alerte.texte, /2 tronçons surveillés/);

  const vide = resumerVigilance(null);
  assert.equal(vide.max, 0);
  assert.equal(vide.total, 0);
});
