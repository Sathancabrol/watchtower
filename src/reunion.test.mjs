import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TYPES_ENREGISTREMENT, creerReunion, modifierEntete,
  ajouterParticipant, modifierParticipant, supprimerParticipant,
  ajouterPoint, modifierPoint, supprimerPoint, deplacerPoint, dureePrevue,
  ajouterNote, modifierNote, supprimerNote,
  ajouterEnregistrement, supprimerEnregistrement,
  ajouterVariable, supprimerVariable, variables, controlerVariables,
  diapos, pointsSuggeres, versMarkdown,
  listerReunions, sauvegarderReunion, chargerReunion, supprimerReunion,
} from './reunion.js';

/** Faux stockage isolé pour chaque test. */
function faussStockage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('une reunion neuve a un titre de repli et des collections vides', () => {
  const r = creerReunion();
  assert.equal(r.titre, 'Réunion sans titre');
  assert.equal(r.statut, 'préparation');
  assert.deepEqual(r.participants, []);
  assert.deepEqual(r.notes, []);
  assert.ok(r.id.startsWith('reu-'));
});

test("l'entete se modifie et refuse un statut inconnu", () => {
  const r = creerReunion({ titre: 'Conseil' });
  modifierEntete(r, { objectif: 'Valider le PPA', statut: 'en cours' });
  assert.equal(r.objectif, 'Valider le PPA');
  assert.equal(r.statut, 'en cours');
  modifierEntete(r, { statut: 'n-importe-quoi' });
  assert.equal(r.statut, 'en cours');
});

test('les participants refusent les doublons et se suppriment', () => {
  const r = creerReunion();
  const p = ajouterParticipant(r, { nom: 'Michel Arrouy', role: 'Maire' });
  assert.ok(p);
  assert.equal(ajouterParticipant(r, { nom: 'michel arrouy' }), null, 'doublon insensible a la casse');
  assert.equal(ajouterParticipant(r, { nom: '   ' }), null, 'nom vide refuse');
  modifierParticipant(r, p.id, { presence: 'excusé' });
  assert.equal(r.participants[0].presence, 'excusé');
  assert.equal(supprimerParticipant(r, p.id), true);
  assert.equal(supprimerParticipant(r, p.id), false);
});

test("un point d'ordre du jour herite du nom du noeud du graphe", () => {
  const r = creerReunion();
  const p = ajouterPoint(r, { cleNoeud: 'ppa', minutes: 25 });
  assert.equal(p.intitule, "PPA — Projet Partenarial d'Aménagement");
  assert.equal(p.cleNoeud, 'ppa');
  assert.equal(dureePrevue(r), 25);
});

test("l'ordre du jour se reordonne sans perdre de point", () => {
  const r = creerReunion();
  const a = ajouterPoint(r, { intitule: 'A' });
  const b = ajouterPoint(r, { intitule: 'B' });
  ajouterPoint(r, { intitule: 'C' });
  assert.equal(deplacerPoint(r, b.id, -1), true);
  assert.deepEqual(r.ordreDuJour.map((x) => x.intitule), ['B', 'A', 'C']);
  assert.equal(deplacerPoint(r, b.id, -1), false, 'deja en tete');
  modifierPoint(r, a.id, { traite: true });
  assert.equal(r.ordreDuJour[1].traite, true);
  assert.equal(supprimerPoint(r, a.id), true);
  assert.equal(r.ordreDuJour.length, 2);
});

test('les notes se creent, se modifient et se suppriment', () => {
  const r = creerReunion();
  const n = ajouterNote(r, { texte: 'Budget a revoir', type: 'décision' });
  assert.equal(n.type, 'décision');
  assert.equal(ajouterNote(r, { texte: '  ' }), null, 'note vide refusee');
  modifierNote(r, n.id, { texte: 'Budget valide' });
  assert.equal(r.notes[0].texte, 'Budget valide');
  assert.equal(modifierNote(r, n.id, { texte: '' }), null, 'vider une note est refuse');
  assert.equal(supprimerNote(r, n.id), true);
});

test('un enregistrement doit avoir un type connu', () => {
  const r = creerReunion();
  assert.equal(ajouterEnregistrement(r, { type: 'hologramme' }), null);
  const e = ajouterEnregistrement(r, { type: 'ia', transcription: 'bonjour' });
  assert.ok(e);
  assert.ok(TYPES_ENREGISTREMENT.some((t) => t.cle === 'ia'));
  assert.equal(supprimerEnregistrement(r, e.id), true);
});

test('les diapos commencent par le sommaire puis un ecran par point', () => {
  const r = creerReunion({ titre: 'Réunion PPA' });
  ajouterPoint(r, { cleNoeud: 'frontignan-plage' });
  ajouterPoint(r, { intitule: 'Divers' });
  const d = diapos(r);
  assert.equal(d.length, 3);
  assert.equal(d[0].type, 'titre');
  assert.equal(d[1].rang, 1);
  assert.ok(d[1].attributs.length > 0, 'la diapo adossee au graphe porte ses attributs');
  assert.equal(d[2].attributs.length, 0, 'un point libre reste vide');
});

test('les points suggeres viennent des questions ouvertes du graphe', () => {
  const s = pointsSuggeres();
  assert.ok(s.length >= 6);
  assert.ok(s.every((x) => typeof x.intitule === 'string' && x.intitule.length > 10));
});

test('le compte rendu markdown signale les valeurs non recoupees', () => {
  const r = creerReunion({ titre: 'Conseil', objectif: 'Arbitrer' });
  ajouterParticipant(r, { nom: 'Näthan Cabrol', role: 'Rapporteur' });
  ajouterPoint(r, { cleNoeud: 'muscat' });
  ajouterNote(r, { texte: 'Relancer la DREAL', type: 'action' });
  const md = versMarkdown(r);
  assert.match(md, /^# Conseil/);
  assert.match(md, /Näthan Cabrol/);
  assert.match(md, /## Actions/);
  assert.match(md, /~ 1936/, 'valeur non recoupee prefixee par ~');
  assert.match(md, /à vérifier/);
});

test('la persistance ecrit, relit, remplace et supprime', () => {
  const s = faussStockage();
  const r = creerReunion({ titre: 'Première' });
  sauvegarderReunion(r, s);
  assert.equal(listerReunions(s).length, 1);
  modifierEntete(r, { titre: 'Renommée' });
  sauvegarderReunion(r, s);
  assert.equal(listerReunions(s).length, 1, 'sauvegarder deux fois ne duplique pas');
  assert.equal(chargerReunion(r.id, s).titre, 'Renommée');
  supprimerReunion(r.id, s);
  assert.deepEqual(listerReunions(s), []);
});

test('un stockage corrompu ne fait pas planter la lecture', () => {
  const s = faussStockage();
  s.setItem('wt-reunions-v1', '{ceci nest pas du json');
  assert.deepEqual(listerReunions(s), []);
});

test('les variables independantes et dependantes se declarent et se suppriment', () => {
  const r = creerReunion();
  const vi = ajouterVariable(r, 'independante', { nom: 'Budget recomposition', unite: 'M€', mesure: 'vote du conseil' });
  const vd = ajouterVariable(r, 'dependante', { nom: 'Habitants exposés', unite: 'pers.', mesure: 'cartographie PPA' });
  assert.equal(vi.role, 'independante');
  assert.equal(vd.role, 'dependante');
  assert.equal(variables(r).length, 2);
  assert.equal(ajouterVariable(r, 'independante', { nom: 'budget recomposition' }), null, 'doublon refuse');
  assert.equal(ajouterVariable(r, 'mediatrice', { nom: 'X' }), null, 'role inconnu refuse');
  assert.equal(ajouterVariable(r, 'dependante', { nom: '  ' }), null, 'nom vide refuse');
  assert.equal(supprimerVariable(r, vi.id), true);
  assert.equal(supprimerVariable(r, vi.id), false);
});

test('le controle du cadrage signale ce qui manque', () => {
  const r = creerReunion();
  let avis = controlerVariables(r);
  assert.equal(avis.length, 2, 'ni VI ni VD');
  ajouterVariable(r, 'independante', { nom: 'Levier', mesure: 'deliberation' });
  ajouterVariable(r, 'dependante', { nom: 'Effet' });
  avis = controlerVariables(r);
  assert.equal(avis.some((m) => /Effet/.test(m)), true, 'VD sans mesure signalee');
  assert.equal(avis.some((m) => /indépendante/.test(m)), false, 'VI presente');
});

test('une reunion ancienne sans bloc variables ne fait pas planter', () => {
  const r = creerReunion();
  delete r.variables;
  assert.deepEqual(variables(r), []);
  assert.ok(ajouterVariable(r, 'independante', { nom: 'X' }));
});

test('le cadrage apparait dans les diapos et le compte rendu', () => {
  const r = creerReunion({ titre: 'Arbitrage' });
  ajouterVariable(r, 'independante', { nom: 'Enveloppe foncière', unite: 'ha', mesure: 'SCOT révisé' });
  ajouterVariable(r, 'dependante', { nom: 'Artificialisation nette', unite: 'ha/an', mesure: 'observatoire ZAN' });
  const d = diapos(r);
  assert.equal(d[1].type, 'cadrage');
  assert.equal(d[1].independantes.length, 1);
  const md = versMarkdown(r);
  assert.match(md, /Variables indépendantes/);
  assert.match(md, /Artificialisation nette/);
  assert.match(md, /observatoire ZAN/);
});
