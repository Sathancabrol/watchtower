import test from 'node:test';
import assert from 'node:assert/strict';
import { ECHELONS } from '../geo/echelleVue.js';
import {
  NIVEAUX, FOURNISSEURS, niveauSelonAltitude, indicateursDe,
  demandeLeReseau, repondSansReseau, indicateursAvecCle, echelonsCouverts,
} from './niveaux.js';

test('AUCUN echelon n est muet — c etait precisement le defaut a reparer', () => {
  for (const e of ECHELONS) {
    const n = NIVEAUX[e.cle];
    assert.ok(n, `l echelon « ${e.cle} » n a rien a dire`);
    assert.ok(n.titre && n.question, `« ${e.cle} » incomplet`);
    assert.ok(n.indicateurs.length >= 3, `« ${e.cle} » n a que ${n.indicateurs.length} indicateur(s)`);
  }
});

test('les trois niveaux reclames sont la : mondial, national, regional', () => {
  assert.ok(NIVEAUX.espace, 'niveau mondial');
  assert.ok(NIVEAUX.pays, 'niveau national');
  assert.ok(NIVEAUX.region, 'niveau regional');
});

test('aucun niveau n est declare en trop par rapport a echelleVue', () => {
  assert.deepEqual(Object.keys(NIVEAUX).sort(), echelonsCouverts().slice().sort());
});

test('AUCUN indicateur ne reclame de cle — une cle par ami, c est un ami perdu', () => {
  assert.deepEqual(indicateursAvecCle(), []);
});

test('chaque indicateur pointe vers un fournisseur qui existe vraiment', () => {
  for (const cle of echelonsCouverts()) {
    for (const i of NIVEAUX[cle].indicateurs) {
      assert.ok(FOURNISSEURS[i.fournisseur], `${cle}/${i.id} : fournisseur inconnu`);
    }
  }
});

test('chaque indicateur affiche sa provenance et sa confiance, jamais un chiffre nu', () => {
  for (const cle of echelonsCouverts()) {
    for (const i of indicateursDe(cle)) {
      assert.ok(i.source, `${cle}/${i.id} sans source`);
      assert.ok(['haute', 'moyenne', 'faible'].includes(i.confiance), `${cle}/${i.id} sans confiance`);
      assert.ok(i.note && i.note.length > 30, `${cle}/${i.id} : note trop courte pour decider`);
    }
  }
});

test('toutes les URL de fournisseur sont en HTTPS', () => {
  for (const [id, f] of Object.entries(FOURNISSEURS)) {
    if (f.url !== null) assert.ok(f.url.startsWith('https://'), `${id} n est pas en HTTPS`);
  }
});

test('la hauteur de camera choisit le bon niveau', () => {
  assert.equal(niveauSelonAltitude(20_000_000).cle, 'espace');
  assert.equal(niveauSelonAltitude(3_000_000).cle, 'continent');
  assert.equal(niveauSelonAltitude(800_000).cle, 'pays');
  assert.equal(niveauSelonAltitude(200_000).cle, 'region');
  assert.equal(niveauSelonAltitude(50_000).cle, 'departement');
  assert.equal(niveauSelonAltitude(5_000).cle, 'commune');
  assert.equal(niveauSelonAltitude(300).cle, 'quartier');
});

test('une altitude absurde ne fait pas tomber le module', () => {
  for (const mauvais of [undefined, null, NaN, -1, 'beaucoup', Infinity]) {
    const n = niveauSelonAltitude(mauvais);
    assert.ok(n.cle && n.titre, `altitude ${String(mauvais)} : pas de niveau`);
  }
});

test('le niveau communal repond deja SANS reseau — la base locale sert a ca', () => {
  const horsLigne = repondSansReseau('commune');
  assert.ok(horsLigne.length >= 2, 'la base locale doit couvrir la commune');
  assert.ok(horsLigne.every((i) => i.horsLigne));
});

test('on sait DIRE quand une source externe devient necessaire', () => {
  assert.equal(demandeLeReseau('espace'), true, 'le niveau mondial exige le reseau');
  assert.equal(demandeLeReseau('pays'), true);
  // Et la reciproque : ce qui est hors ligne n est jamais compte comme reseau.
  for (const i of repondSansReseau('commune')) assert.equal(i.url, null);
});

test('un echelon inconnu renvoie une liste vide, pas une exception', () => {
  assert.deepEqual(indicateursDe('atlantide'), []);
  assert.equal(demandeLeReseau('atlantide'), false);
});
