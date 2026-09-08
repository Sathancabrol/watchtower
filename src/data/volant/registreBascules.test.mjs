import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMILLES, BASCULES_AFFICHAGE, normaliserEtat, basculer, toutEteindre,
  toutAllumer, compter, parFamille, positionRayon,
} from './registreBascules.js';

test('chaque bascule est complete et rattachee a une famille connue', () => {
  const ids = new Set();
  const familles = new Set(FAMILLES.map((f) => f.id));
  for (const b of BASCULES_AFFICHAGE) {
    assert.ok(b.id && !ids.has(b.id), `${b.id} unique`);
    ids.add(b.id);
    assert.ok(b.libelle && b.icone && b.aide, `${b.id} presente a l utilisateur`);
    assert.ok(familles.has(b.famille), `${b.id} dans une famille connue`);
    assert.ok(b.selecteur || b.action, `${b.id} sait quoi masquer`);
  }
});

test('les bascules visent des elements reels de l application', () => {
  const parId = Object.fromEntries(BASCULES_AFFICHAGE.map((b) => [b.id, b]));
  assert.match(parId['anneau-celeste'].selecteur, /celestial-ring-overlay/);
  assert.match(parId.titre.selecteur, /#title-bar/);
  assert.match(parId.minicarte.selecteur, /#wt-minimap/);
});

test('normaliserEtat applique les valeurs par defaut', () => {
  const e = normaliserEtat(undefined);
  assert.equal(Object.keys(e).length, BASCULES_AFFICHAGE.length);
  for (const b of BASCULES_AFFICHAGE) assert.equal(e[b.id], b.parDefaut !== false, `${b.id}`);
});

test('normaliserEtat resiste a un stockage corrompu', () => {
  for (const x of [null, 'texte', 42, [], { titre: 'oui' }, { inconnu: true }]) {
    const e = normaliserEtat(x);
    assert.equal(Object.keys(e).length, BASCULES_AFFICHAGE.length);
    for (const v of Object.values(e)) assert.equal(typeof v, 'boolean');
  }
});

test('normaliserEtat conserve un choix explicite de l utilisateur', () => {
  const e = normaliserEtat({ titre: false, 'anneau-celeste': false });
  assert.equal(e.titre, false, 'le choix est respecte');
  assert.equal(e['anneau-celeste'], false);
  assert.equal(e.minicarte, true, 'les autres gardent leur defaut');
});

test('basculer inverse sans muter l etat d origine', () => {
  const avant = normaliserEtat({});
  const apres = basculer(avant, 'titre');
  assert.equal(apres.titre, !avant.titre);
  assert.equal(avant.titre, true, 'etat d origine intact');
  assert.notEqual(avant, apres, 'nouvel objet');
});

test('basculer ignore un identifiant inconnu', () => {
  const avant = normaliserEtat({});
  assert.deepEqual(basculer(avant, 'nexiste-pas'), avant);
});

test('toutEteindre degage la vue d un seul geste', () => {
  const e = toutEteindre(normaliserEtat({}));
  for (const b of BASCULES_AFFICHAGE) assert.equal(e[b.id], false, `${b.id} eteint`);
  assert.equal(compter(e).allumes, 0);
});

test('toutAllumer restaure tout — rien n est perdu', () => {
  const e = toutAllumer(toutEteindre(normaliserEtat({})));
  assert.equal(compter(e).allumes, BASCULES_AFFICHAGE.length);
});

test('compter alimente la pastille du moyeu', () => {
  const total = BASCULES_AFFICHAGE.length;
  assert.deepEqual(compter(normaliserEtat({})), { allumes: total, total });
  assert.deepEqual(compter(basculer(normaliserEtat({}), 'titre')), { allumes: total - 1, total });
  assert.equal(compter(null).total, total, 'etat absent tolere');
});

test('parFamille regroupe sans rien perdre ni inventer', () => {
  const g = parFamille();
  const compte = g.reduce((n, x) => n + x.entrees.length, 0);
  assert.equal(compte, BASCULES_AFFICHAGE.length, 'toutes les bascules classees');
  for (const x of g) assert.ok(x.entrees.length > 0, 'aucun groupe vide');
  const ordre = g.map((x) => x.famille.id);
  const attendu = FAMILLES.map((f) => f.id).filter((id) => ordre.includes(id));
  assert.deepEqual(ordre, attendu, 'ordre des familles respecte');
});

test('la famille urgence vient en premier', () => {
  assert.equal(FAMILLES[0].id, 'urgence', 'le groupe de l oeil ouvre le volant');
  assert.equal(FAMILLES[0].icone, '👁');
});

test('positionRayon deploie l eventail vers la droite', () => {
  const total = 6;
  for (let i = 0; i < total; i += 1) {
    const p = positionRayon(i, total);
    assert.ok(p.x > 0, `rayon ${i} vers la droite (x=${p.x})`);
    assert.ok(Math.abs(p.angleDeg) <= 70.001, `rayon ${i} dans l eventail`);
    const d = Math.hypot(p.x, p.y);
    assert.ok(Math.abs(d - 96) < 1e-9, `rayon ${i} a distance constante`);
  }
});

test('positionRayon centre un rayon unique et resiste aux cas limites', () => {
  assert.deepEqual(positionRayon(0, 1), { x: 96, y: 0, angleDeg: 0 });
  for (const t of [0, -3, NaN, undefined]) {
    const p = positionRayon(0, t);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `total=${t} tolere`);
  }
});

test('les rayons ne se chevauchent pas', () => {
  const angles = Array.from({ length: 8 }, (_, i) => positionRayon(i, 8).angleDeg);
  for (let i = 1; i < angles.length; i += 1) {
    assert.ok(angles[i] > angles[i - 1], 'angles strictement croissants');
  }
});
