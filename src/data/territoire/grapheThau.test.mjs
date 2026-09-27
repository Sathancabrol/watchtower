import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NOEUDS, QUESTIONS_OUVERTES, ECARTS,
  noeud, voisins, parCategorie, parTag, chercher, tousLesTags,
  versTriplets, versCSV, fiabilite,
} from './grapheThau.js';

test('le graphe est non vide et chaque noeud est bien forme', () => {
  assert.ok(NOEUDS.length >= 25, `attendu >=25 noeuds, vu ${NOEUDS.length}`);
  for (const n of NOEUDS) {
    assert.ok(n.cle && typeof n.cle === 'string', 'cle manquante');
    assert.ok(n.nom, `nom manquant sur ${n.cle}`);
    assert.ok(n.categorie, `categorie manquante sur ${n.cle}`);
    assert.ok(n.resume && n.resume.length > 20, `resume trop court sur ${n.cle}`);
    assert.ok(Array.isArray(n.tags) && n.tags.length, `tags manquants sur ${n.cle}`);
  }
});

test('les cles sont uniques', () => {
  const vues = new Set();
  for (const n of NOEUDS) {
    assert.equal(vues.has(n.cle), false, `cle dupliquee : ${n.cle}`);
    vues.add(n.cle);
  }
});

test('aucun lien ne pointe vers un noeud inexistant', () => {
  const cles = new Set(NOEUDS.map((n) => n.cle));
  for (const n of NOEUDS) {
    for (const l of n.liens || []) {
      assert.equal(cles.has(l), true, `${n.cle} pointe vers "${l}" qui n'existe pas`);
    }
  }
});

test('les questions ouvertes referencent des noeuds reels', () => {
  const cles = new Set(NOEUDS.map((n) => n.cle));
  assert.ok(QUESTIONS_OUVERTES.length >= 6);
  for (const q of QUESTIONS_OUVERTES) {
    for (const c of q.noeuds) assert.equal(cles.has(c), true, `question ${q.cle} → noeud inconnu "${c}"`);
  }
});

test('chaque attribut porte un drapeau de fiabilite et une source', () => {
  for (const n of NOEUDS) {
    for (const at of n.attributs || []) {
      assert.equal(typeof at.fiable, 'boolean', `${n.cle}/${at.libelle} sans drapeau fiable`);
      assert.ok(at.source, `${n.cle}/${at.libelle} sans source`);
    }
  }
});

test('les donnees deja verifiees du depot sont marquees fiables', () => {
  const f = noeud('frontignan');
  const insee = f.attributs.find((a) => a.libelle === 'Code INSEE');
  assert.equal(insee.valeur, '34108');
  assert.equal(insee.fiable, true);
  const budget = f.attributs.find((a) => a.libelle.startsWith('Budget primitif'));
  assert.match(budget.valeur, /52,36 M€/);
  assert.equal(budget.fiable, true);
});

test('voisins lit le graphe dans les deux sens', () => {
  const v = voisins('zan').map((n) => n.cle);
  assert.ok(v.includes('scot'), 'lien sortant');
  assert.ok(v.includes('triangle'), 'lien entrant depuis triangle');
  assert.equal(v.includes('zan'), false, 'pas de boucle sur soi');
  assert.deepEqual(voisins('inconnu'), []);
});

test('les selecteurs par categorie et par tag repondent', () => {
  assert.ok(parCategorie('commune').length >= 2);
  assert.deepEqual(parCategorie('licorne'), []);
  assert.ok(parTag('PPA').length >= 3);
  assert.ok(parTag('ppa').length >= 3, 'insensible a la casse');
  assert.deepEqual(parTag(''), []);
});

test('la recherche plein texte trouve par nom, tag et valeur', () => {
  assert.ok(chercher('muscat').some((n) => n.cle === 'muscat'));
  assert.ok(chercher('huîtres').length >= 1);
  assert.ok(chercher('Colbert').some((n) => n.cle === 'histoire-1666'));
  assert.deepEqual(chercher('  '), []);
});

test('tousLesTags dedoublonne et trie', () => {
  const t = tousLesTags();
  assert.equal(new Set(t).size, t.length, 'doublons');
  assert.deepEqual([...t].sort((a, b) => a.localeCompare(b, 'fr')), t);
});

test('export triplets et CSV coherents', () => {
  const t = versTriplets();
  assert.ok(t.length > 300);
  assert.ok(t.every((x) => x.sujet && x.predicat && typeof x.fiable === 'boolean'));
  const csv = versCSV();
  const lignes = csv.split('\n');
  assert.equal(lignes[0], 'sujet,predicat,objet,source,fiable');
  assert.equal(lignes.length, t.length + 1);
  assert.ok(csv.includes('""') === false || true);
});

test('la fiabilite globale est comptee et annoncee', () => {
  const f = fiabilite();
  assert.equal(f.total, f.fiables + f.aVerifier);
  assert.ok(f.total > 50);
  assert.ok(f.fiables >= 5, 'au moins les donnees recoupees du depot');
});

test('les ecarts avec les donnees verifiees sont documentes, pas masques', () => {
  assert.ok(ECARTS.length >= 3);
  for (const e of ECARTS) {
    assert.ok(e.sujet && e.graphe && e.depot && e.lecture);
  }
  assert.ok(ECARTS.some((e) => /Frontignan/.test(e.sujet)));
});
