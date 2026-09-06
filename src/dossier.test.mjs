/** Tests — dossier d'investigation (étapes, notes, épinglage, rangement). */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ETAPES, cocherEtape, creerNote, dossierVide, epingler, modifierNote,
  prochainesEtapes, progression, ranger, resumer, supprimerNote,
} from './dossier.js';

test('un dossier neuf est complet : 6 étapes, aucune faite, 0 note', () => {
  const d = dossierVide();
  assert.equal(Object.keys(d.etapes).length, ETAPES.length);
  assert.equal(progression(d), 0);
  assert.deepEqual(d.notes, []);
});

test('chaque étape cite les fonctions WATCHTOWER qui la servent', () => {
  for (const e of ETAPES) {
    assert.ok(e.nom && e.icone, `étape incomplète : ${e.id}`);
    assert.ok(Array.isArray(e.outils) && e.outils.length >= 2, `outils manquants pour ${e.id}`);
  }
});

test('la progression suit les étapes cochées', () => {
  let d = dossierVide();
  d = cocherEtape(d, 'zone', true);
  assert.ok(progression(d) > 0 && progression(d) < 1);
  for (const e of ETAPES) d = cocherEtape(d, e.id, true);
  assert.equal(progression(d), 1);
});

test('créer / modifier / épingler / ranger / supprimer une note', () => {
  let d = dossierVide();
  d = creerNote(d, 'Repérer la caméra de la place');
  const id = d.notes[0].id;
  assert.equal(d.notes.length, 1);
  assert.equal(d.notes[0].dossier, 'Général');

  d = modifierNote(d, id, 'Caméra vue côté mairie');
  assert.match(d.notes[0].texte, /mairie/);

  d = epingler(d, id, true);
  assert.equal(d.notes[0].epinglee, true);
  d = epingler(d, id);
  assert.equal(d.notes[0].epinglee, false, 'ré-épinglage = bascule');

  d = ranger(d, id, 'Preuves');
  assert.equal(d.notes[0].dossier, 'Preuves');
  assert.ok(d.dossiers.includes('Preuves'), 'le dossier est créé au besoin');

  d = supprimerNote(d, id);
  assert.equal(d.notes.length, 0);
  assert.ok(d.dossiers.includes('Preuves'), 'supprimer la note ne supprime pas le dossier');
});

test('une note vide n’est pas créée (traçabilité)', () => {
  const d = creerNote(dossierVide(), '   ');
  assert.equal(d.notes.length, 0);
});

test('les étapes restantes guident l’utilisateur, dans l’ordre', () => {
  let d = dossierVide();
  d = cocherEtape(d, 'zone', true);
  const p = prochainesEtapes(d, 2);
  assert.equal(p[0].id, 'sources');
  assert.equal(p.length, 2);
});

test('le résumé est complet (vue télé) et ne jette jamais', () => {
  let d = dossierVide();
  d = creerNote(d, 'une observation');
  d = cocherEtape(d, 'zone', true);
  const r = resumer(d);
  assert.equal(r.notes, 1);
  assert.equal(r.epinglees, 0);
  assert.ok(r.prochaines.length >= 1);
  assert.ok(typeof r.parDossier === 'object');
  assert.doesNotThrow(() => resumer(null));
});
