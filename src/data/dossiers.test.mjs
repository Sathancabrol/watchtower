// src/data/dossiers.test.mjs — arbre de dossiers du palais mental (pur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aEnfants, aplatir, compacter, compter, depuisObjet, filtrer, libelleDe, mur, noeud,
  nomDe, normaliser, texteDe, trouver, typeSelonNom,
} from './dossiers.js';

const CHANTIER = {
  nom: 'Rue des Écoles',
  zones: [
    { nom: 'Tranchée nord', materiel: ['pelle 8 t'], personnel: ['Karim', 'Lucie'] },
    { nom: 'Trottoir sud', materiel: [], personnel: ['Nadia'] },
  ],
  budget: 48_000,
  documents: [{ titre: 'CERFA 13703', etat: 'à remplir' }],
};

test('un nœud est normalisé (id, icône, type, profondeur)', () => {
  const n = noeud({ nom: 'Tranchée', type: 'plan', detail: '50 m' });
  assert.equal(n.nom, 'Tranchée');
  assert.equal(n.type, 'plan');
  assert.equal(n.ic, '📐');
  assert.equal(n.profondeur, 0);
  assert.deepEqual(n.enfants, []);
  const enfant = noeud({ nom: 'sous', enfants: [{ nom: 'x' }] });
  assert.equal(enfant.enfants[0].profondeur, 1);
});

test('entrées bizarres : jamais d’erreur', () => {
  for (const v of [null, undefined, 42, 'texte', []]) {
    const n = noeud(v);
    assert.ok(typeof n.nom === 'string');
    assert.ok(Array.isArray(n.enfants));
  }
  assert.equal(noeud({ type: 'inconnu' }).type, 'polaroid', 'type inconnu → polaroïd');
  assert.equal(noeud({}).ic, '📸');
});

test('type deviné depuis le nom', () => {
  assert.equal(typeSelonNom('Zone de terrassement'), 'plan');
  assert.equal(typeSelonNom('photo aerienne du 12'), 'aerien');
  assert.equal(typeSelonNom('equipe de nuit'), 'mugshot');
  assert.equal(typeSelonNom('timelapse 48h'), 'video');
  assert.equal(typeSelonNom('note de passage'), 'polaroid');
});

test('depuisObjet : un chantier devient un arbre fouillable', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier · Rue des Écoles' });
  assert.equal(arbre.nom, 'Chantier · Rue des Écoles');
  assert.ok(aEnfants(arbre));
  const noms = arbre.enfants.map((e) => e.nom);
  assert.ok(noms.some((x) => x.startsWith('zones')), `enfants : ${noms.join(', ')}`);
  // descendre jusqu’au plus petit élément : la personne
  const zones = arbre.enfants.find((e) => e.nom.startsWith('zones'));
  const zone1 = zones.enfants[0];
  const equipe = zone1.enfants.find((e) => e.nom.startsWith('personnel'));
  assert.deepEqual(equipe.enfants.map((e) => e.nom), ['Karim', 'Lucie'], 'les feuilles sont les personnes');
  assert.equal(equipe.enfants[0].detail, '', 'pas de détail redondant pour une valeur simple');
});

test('depuisObjet : valeurs simples, listes, profondeur bornée', () => {
  assert.equal(depuisObjet(12, { nom: 'budget' }).detail, '12');
  assert.equal(depuisObjet(null, { nom: 'vide' }).detail, '∅ vide');
  const liste = depuisObjet([1, 2, 3], { nom: 'mesures' });
  assert.match(liste.nom, /mesures \(3\)/);
  // profondeur maximale respectée
  const profond = { a: { b: { c: { d: { e: { f: 1 } } } } } };
  const arbre = depuisObjet(profond, { max: 2 });
  let p = arbre; let n = 0;
  while (p.enfants.length) { p = p.enfants[0]; n += 1; }
  assert.ok(n <= 2, `profondeur bornée : ${n}`);
});

test('recherche : on filtre l’arbre en direct', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier' });
  const f = filtrer(arbre, 'karim');
  assert.ok(f, 'résultat trouvé');
  const texte = aplatir(f).map((x) => texteDe(x.noeud)).join(' ');
  assert.match(texte, /karim/);
  assert.doesNotMatch(texte, /trottoir/, 'la branche sans résultat est coupée');
});

test('recherche : plusieurs mots = ET, vide = arbre entier', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier' });
  assert.equal(filtrer(arbre, ''), arbre, 'recherche vide → arbre intact');
  assert.equal(filtrer(arbre, '   '), arbre);
  assert.equal(filtrer(arbre, 'nadia materiel'), null, 'les deux mots ne sont pas sur le même nœud');
  assert.ok(filtrer(arbre, 'tranchee nord'), 'deux mots sur la même branche');
});

test('recherche : aucun résultat → null', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier' });
  assert.equal(filtrer(arbre, 'zzzz'), null);
  assert.equal(filtrer(null, 'x'), null);
});

test('aplatir : chaque élément porte son chemin', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier' });
  const plat = aplatir(arbre);
  assert.ok(plat.length > 5);
  const feuille = plat.find((x) => x.noeud.nom === 'Karim');
  assert.ok(feuille, 'la feuille est atteignable');
  assert.ok(feuille.chemin.length >= 3, 'le chemin est complet');
  assert.equal(feuille.chemin[0].nom, 'Chantier');
  assert.ok(aplatir(arbre, 1).length < plat.length, 'la profondeur limite le parcours');
});

test('trouver : on descend par identifiant', () => {
  const arbre = mur([{ id: 'chantier', nom: 'Chantier', enfants: [{ id: 'doc', nom: 'CERFA' }] }]);
  const doc = trouver(arbre, 'doc');
  assert.equal(doc?.nom, 'CERFA');
  assert.equal(trouver(arbre, 'inconnu'), null);
  assert.equal(trouver(null, 'x'), null);
});

test('compter et résumer', () => {
  const arbre = depuisObjet(CHANTIER, { nom: 'Chantier' });
  assert.ok(compter(arbre) > 10);
  assert.equal(compter(null), 0);
  assert.equal(compacter({ a: 1 }), '{"a":1}');
  assert.match(compacter('x'.repeat(300)), /…$/, 'résumé tronqué');
});

test('mur : plusieurs dossiers racine', () => {
  const m = mur([{ id: 'a', nom: 'Chantier' }, { id: 'b', nom: 'Commune' }], 'MON MUR');
  assert.equal(m.nom, 'MON MUR');
  assert.equal(m.enfants.length, 2);
  assert.equal(m.detail, '2 dossier(s)');
  assert.equal(mur([]).enfants.length, 0);
  assert.equal(mur([null, undefined, { nom: 'x' }]).enfants.length, 1, 'les vides sont ignorés');
});

test('nomDe : clés de nom courantes', () => {
  assert.equal(nomDe({ nom: 'Pelle' }), 'Pelle');
  assert.equal(nomDe({ name: 'Bob' }), 'Bob');
  assert.equal(nomDe({ titre: 'CERFA' }), 'CERFA');
  assert.equal(nomDe({ id: 7 }), '7');
  assert.equal(nomDe({ rien: 1 }), '');
  assert.equal(nomDe('texte'), '');
});

test('normaliser : on cherche sans accent', () => {
  assert.equal(normaliser('Tranchée Écoles'), 'tranchee ecoles');
  assert.equal(normaliser('SÈTE'), 'sete');
  assert.equal(normaliser(null), '');
});

test('libelleDe : les valeurs simples aussi', () => {
  assert.equal(libelleDe('Karim'), 'Karim');
  assert.equal(libelleDe(7), '7');
  assert.equal(libelleDe({ nom: 'Pelle' }), 'Pelle');
  assert.equal(libelleDe(null), '');
});
