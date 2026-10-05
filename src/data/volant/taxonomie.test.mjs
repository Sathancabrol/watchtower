import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES, RANGEMENT, ABSORBES, RENOMMAGES, categorieDe, nomDe, estAbsorbe,
} from './taxonomie.js';
import { construireCatalogue, toutesLesEntrees } from '../../volantLateral.js';

test('les six categories sont distinctes et expliquees', () => {
  const ids = CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants en double');
  for (const c of CATEGORIES) {
    assert.ok(c.nom && c.icone, `${c.id} incomplet`);
    assert.ok(c.aide.length > 25, `${c.id} : l aide doit dire ce qui va dedans`);
  }
});

test('CHAQUE fonction est rangee — aucun fourre-tout', () => {
  for (const e of toutesLesEntrees()) {
    assert.ok(categorieDe(e.cle), `« ${e.nom} » (${e.cle}) n est range nulle part`);
  }
});

test('tout rangement vise une categorie qui existe', () => {
  const ids = new Set(CATEGORIES.map((c) => c.id));
  for (const [cle, cat] of Object.entries(RANGEMENT)) {
    assert.ok(ids.has(cat), `${cle} range dans « ${cat} », categorie inconnue`);
  }
});

test('un doublon absorbe designe toujours l entree qui le remplace', () => {
  const vivantes = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const [perdu, gagnant] of Object.entries(ABSORBES)) {
    assert.ok(!vivantes.has(perdu), `${perdu} devait etre absorbe`);
    assert.ok(vivantes.has(gagnant), `${perdu} absorbe vers ${gagnant}, qui n existe pas`);
    assert.ok(estAbsorbe(perdu));
  }
});

test('la provenance d un doublon est reportee sur son remplacant', () => {
  // Sans cela, l audit « d ou vient ce bouton ? » deviendrait faux.
  const parCle = new Map(toutesLesEntrees().map((e) => [e.cle, e]));
  for (const gagnant of new Set(Object.values(ABSORBES))) {
    assert.ok(parCle.get(gagnant).sources.length >= 2,
      `${gagnant} a absorbe un doublon mais n en garde pas la trace`);
  }
});

test('aucun intitule en double dans tout le volant', () => {
  // Deux lignes du meme nom, c est exactement ce qui rendait le volant penible.
  const noms = toutesLesEntrees().map((e) => e.nom.toLowerCase());
  const vus = new Set();
  for (const n of noms) {
    assert.ok(!vus.has(n), `intitule « ${n} » present deux fois`);
    vus.add(n);
  }
});

test('les intitules sont lisibles : ni vides, ni des resumes de menu', () => {
  for (const e of toutesLesEntrees()) {
    assert.ok(e.nom.length >= 3, `intitule trop court : ${e.cle}`);
    assert.ok(e.nom.length <= 34, `« ${e.nom} » est une phrase, pas un nom de commande`);
  }
});

test('un renommage ne vise jamais une cle disparue', () => {
  const vivantes = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const cle of Object.keys(RENOMMAGES)) {
    assert.ok(vivantes.has(cle) || estAbsorbe(cle), `renommage orphelin : ${cle}`);
  }
});

test('nomDe retombe sur le nom d origine quand rien n est impose', () => {
  assert.equal(nomDe('cible:control-panel', 'OPTION — …'), 'Panneau de réglages complet');
  assert.equal(nomDe('cle:inconnue', 'Nom d origine'), 'Nom d origine');
});

test('aucune categorie du volant n est vide ni pletorique', () => {
  for (const c of construireCatalogue()) {
    assert.ok(c.entrees.length >= 3, `« ${c.nom} » n a que ${c.entrees.length} entree(s)`);
    assert.ok(c.entrees.length <= 12, `« ${c.nom} » en a ${c.entrees.length} : a redecouper`);
  }
});
