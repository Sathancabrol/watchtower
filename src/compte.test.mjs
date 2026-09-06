// src/compte.test.mjs — niveaux d'information et comptes branchables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLE_STOCKAGE, FOURNISSEURS, LIBELLES_NIVEAU, NIVEAUX, auMoinsAussiOuvert,
  choisirIA, compteVierge, enregistrerCompte, estConnecte, etatResume,
  explicationNiveau, fournisseur, lireComptes, niveauDe, oublierCompte,
} from './compte.js';

/** Faux localStorage (le module n'a pas besoin du DOM pour ça). */
function memoire() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _tout: () => [...m.entries()],
  };
}

test('trois niveaux, du plus ouvert au plus fermé', () => {
  assert.deepEqual([...NIVEAUX], ['gratuit', 'compte', 'payant']);
  assert.equal(LIBELLES_NIVEAU.gratuit.ic, '🟢');
  assert.equal(LIBELLES_NIVEAU.compte.ic, '🔵');
  assert.equal(LIBELLES_NIVEAU.payant.ic, '🟣');
});

test('le registre des fournisseurs est cohérent', () => {
  const ids = new Set();
  for (const f of FOURNISSEURS) {
    assert.ok(!ids.has(f.id), `pas de doublon : ${f.id}`);
    ids.add(f.id);
    assert.ok(NIVEAUX.includes(f.niveau), `${f.id} a un niveau connu`);
    assert.ok(['local', 'cle', 'oauth', 'aucun'].includes(f.type), `${f.id} a un type connu`);
    assert.ok(Array.isArray(f.apporte) && f.apporte.length, `${f.id} dit ce qu’il apporte`);
    assert.match(f.doc, /^https?:\/\//, `${f.id} documente son service`);
  }
  assert.ok(ids.has('ollama'), 'Ollama (local) est proposé');
  assert.ok(ids.has('google'), 'un compte Google est proposé');
});

test('on retrouve un fournisseur et son niveau', () => {
  assert.equal(fournisseur('ollama').nom, 'Ollama (local)');
  assert.equal(niveauDe('ollama'), 'gratuit');
  assert.equal(niveauDe('pappers'), 'payant');
  assert.equal(fournisseur('inexistant'), null);
  assert.equal(niveauDe('inexistant'), 'payant', 'inconnu = payant (prudence)');
});

test('comparaison des niveaux', () => {
  assert.equal(auMoinsAussiOuvert('gratuit', 'payant'), true);
  assert.equal(auMoinsAussiOuvert('payant', 'gratuit'), false);
  assert.equal(auMoinsAussiOuvert('compte', 'compte'), true);
  assert.equal(auMoinsAussiOuvert('nimportequoi', 'gratuit'), false);
});

test('un compte vierge reprend les réglages du fournisseur', () => {
  const c = compteVierge('ollama');
  assert.equal(c.id, 'ollama');
  assert.equal(c.url, 'http://localhost:11434');
  assert.equal(c.actif, false);
  assert.equal(compteVierge('inconnu').url, '');
});

test('un compte n’est connecté que s’il est cohérent', () => {
  assert.equal(estConnecte(null), false);
  assert.equal(estConnecte({ id: 'ollama', actif: true, url: 'http://localhost:11434' }), true);
  assert.equal(estConnecte({ id: 'ollama', actif: true, url: '' }), false, 'local sans URL');
  assert.equal(estConnecte({ id: 'ollama', actif: false, url: 'x' }), false, 'non activé');
  assert.equal(estConnecte({ id: 'mistral', actif: true, cle: 'sk-x' }), true);
  assert.equal(estConnecte({ id: 'mistral', actif: true, cle: '   ' }), false, 'clé vide');
  assert.equal(estConnecte({ id: 'aucun', actif: true }), true, '« tout en gratuit » n’a besoin de rien');
  assert.equal(estConnecte({ id: 'fantome', actif: true }), false, 'fournisseur inconnu');
});

test('résumé : combien de services branchés et à quel niveau', () => {
  const liste = [
    { id: 'ollama', actif: true, url: 'http://localhost:11434' },
    { id: 'mistral', actif: true, cle: 'sk-x' },
    { id: 'pappers', actif: true, cle: 'payant' },
    { id: 'google', actif: false, cle: '' },
  ];
  const r = etatResume(liste);
  assert.equal(r.connectes, 3);
  assert.equal(r.gratuit, 1);
  assert.equal(r.compte, 1);
  assert.equal(r.payant, 1);
  assert.deepEqual(r.ids, ['ollama', 'mistral', 'pappers']);
  assert.equal(etatResume([]).connectes, 0);
  assert.equal(etatResume(null).connectes, 0);
});

test('le choix de l’IA privilégie le LOCAL (gratuit)', () => {
  const liste = [
    { id: 'google', actif: true, cle: 'x' },
    { id: 'ollama', actif: true, url: 'http://localhost:11434' },
  ];
  assert.equal(choisirIA(liste).id, 'ollama');
  assert.equal(choisirIA([{ id: 'google', actif: true, cle: 'x' }]).id, 'google', 'repli hébergé');
  assert.equal(choisirIA([]), null, 'aucune IA → mode hors-ligne');
  assert.equal(choisirIA([{ id: 'ollama', actif: false }]), null, 'non activé → hors-ligne');
});

test('l’explication de niveau est honnête', () => {
  assert.match(explicationNiveau('pappers'), /PAYANT/);
  assert.match(explicationNiveau('ollama'), /GRATUIT/);
  assert.match(explicationNiveau('inconnu'), /inconnu/i);
});

test('enregistrer / lire / oublier dans le stockage local', () => {
  const s = memoire();
  assert.deepEqual(lireComptes(s), [], 'rien au départ');
  enregistrerCompte({ id: 'ollama', url: 'http://localhost:11434', modele: 'llama3.2', actif: true }, s);
  const lu = lireComptes(s);
  assert.equal(lu.length, 1);
  assert.equal(lu[0].modele, 'llama3.2');
  assert.ok(lu[0].maj > 0, 'horodaté');
  // on écrase sans doublonner
  enregistrerCompte({ id: 'ollama', url: 'http://localhost:11434', modele: 'mistral', actif: true }, s);
  const lu2 = lireComptes(s);
  assert.equal(lu2.length, 1);
  assert.equal(lu2[0].modele, 'mistral');
  // on oublie
  assert.equal(oublierCompte('ollama', s).length, 0);
  assert.equal(s.getItem(CLE_STOCKAGE), '[]');
});

test('le stockage corrompu ne casse rien', () => {
  const s = memoire();
  s.setItem(CLE_STOCKAGE, '{ pas du json');
  assert.deepEqual(lireComptes(s), []);
  s.setItem(CLE_STOCKAGE, '"une chaine"');
  assert.deepEqual(lireComptes(s), [], 'un non-tableau → vide');
});

test('la clé de stockage est versionnée', () => {
  assert.equal(CLE_STOCKAGE, 'watchtower.comptes.v1');
});
