// src/commandes.test.mjs — registre de commandes & réponses rapides du chat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMANDES, GROUPES, commandeDe, normaliser, reconnaitre, reponsesRapides, texteAide,
} from './commandes.js';

test('le registre est complet et cohérent', () => {
  const ids = new Set();
  for (const c of COMMANDES) {
    assert.match(c.id, /^[a-z]+$/, `identifiant simple : ${c.id}`);
    assert.ok(!ids.has(c.id), `pas de doublon : ${c.id}`);
    ids.add(c.id);
    assert.ok(c.titre && c.ic && c.aide, `${c.id} complet`);
    assert.ok(Array.isArray(c.motifs) && c.motifs.length, `${c.id} a des motifs`);
    assert.ok(GROUPES[c.groupe], `${c.id} a un groupe connu`);
  }
});

test('normaliser : accents, casse, ponctuation, slash', () => {
  assert.equal(normaliser('/Urgence !'), 'urgence');
  assert.equal(normaliser('  MÉTÉO  '), 'meteo');
  assert.equal(normaliser('au secours, vite !'), 'au secours vite');
  assert.equal(normaliser('À côté'), 'a cote');
  assert.equal(normaliser(null), '');
});

test('/aide et /help pointent vers la même commande', () => {
  assert.equal(reconnaitre('/aide').id, 'aide');
  assert.equal(reconnaitre('help').id, 'aide');
  assert.equal(reconnaitre('?').id, 'aide');
  assert.equal(reconnaitre('commandes').id, 'aide');
});

test('/urgence accepte un motif : « /urgence incendie »', () => {
  const r = reconnaitre('/urgence incendie');
  assert.equal(r.id, 'urgence');
  assert.equal(r.argument, 'incendie');
  assert.equal(reconnaitre('au secours').id, 'urgence');
  assert.equal(reconnaitre('sos').id, 'urgence');
  assert.equal(reconnaitre('/urgence').argument, '');
});

test('« à l’aide » ne déclenche pas /aide (motif le plus long gagne)', () => {
  const r = reconnaitre('a l aide');
  assert.equal(r, null);
});

test('les commandes de calques et de regard sont reconnues', () => {
  assert.equal(reconnaitre('cadastre').id, 'cadastre');
  assert.equal(reconnaitre('pluie').id, 'pluie');
  assert.equal(reconnaitre('nord').id, 'nord');
  assert.equal(reconnaitre('espace').id, 'espace');
  assert.equal(reconnaitre('domicile').id, 'domicile');
  assert.equal(reconnaitre('météo').id, 'meteo');
  assert.equal(reconnaitre('risques').id, 'risques');
  assert.equal(reconnaitre('entreprises').id, 'entreprises');
});

test('un lieu n’est pas une commande', () => {
  assert.equal(reconnaitre('frontignan'), null);
  assert.equal(reconnaitre('tour eiffel'), null);
  assert.equal(reconnaitre(''), null);
  assert.equal(reconnaitre(null), null);
});

test('commandeDe retrouve la commande par identifiant', () => {
  assert.equal(commandeDe('meteo').titre, 'Météo');
  assert.equal(commandeDe('inexistant'), null);
});

test('l’aide est générée depuis le registre : aucune commande oubliée', () => {
  const t = texteAide();
  for (const c of COMMANDES) {
    assert.match(t, new RegExp(`/${c.id}\\b`), `/${c.id} figure dans l’aide`);
  }
  assert.match(t, /\/urgence/);
  assert.match(t, /LIEU/);
});

test('réponses rapides : le socle est toujours proposé', () => {
  const r = reponsesRapides({});
  const envois = r.map((x) => x.envoi);
  assert.ok(envois.includes('/aide'));
  assert.ok(envois.includes('/urgence'));
  assert.ok(r.length <= 8);
  for (const x of r) assert.ok(x.titre && x.ic && x.groupe);
});

test('en vol, on propose la météo du vol et le recadrage', () => {
  const r = reponsesRapides({ vol: true });
  assert.ok(r.some((x) => x.envoi === '/meteo'));
  assert.ok(r.some((x) => x.envoi === '/nord'));
});

test('commune analysée → risques, cadrans et cadastre en pastilles', () => {
  const r = reponsesRapides({ commune: 'Frontignan' });
  const envois = r.map((x) => x.envoi);
  assert.ok(envois.includes('/risques'));
  assert.ok(envois.includes('/cadrans'));
  assert.ok(envois.includes('/cadastre'));
  assert.ok(r.some((x) => /Frontignan/.test(x.titre)));
});

test('en mode urgence, les pastilles ne proposent QUE l’urgence', () => {
  const r = reponsesRapides({ urgence: true });
  for (const x of r) assert.equal(x.groupe, 'urgence');
  const envois = r.map((x) => x.envoi);
  assert.ok(envois.includes('/urgence suite'));
  assert.ok(envois.includes('/urgence fin'));
});

test('une question n’est pas un lieu (aiguillage du chat)', async () => {
  const { ressembleAQuestion } = await import('./chatConsole.js');
  assert.equal(ressembleAQuestion('comment ça marche ?'), true);
  assert.equal(ressembleAQuestion('comment voler jusqu’à Sète'), true);
  assert.equal(ressembleAQuestion('qui a construit ce pont'), true);
  assert.equal(ressembleAQuestion('tour eiffel'), false, 'un lieu reste un lieu');
  assert.equal(ressembleAQuestion('va à Marseille'), false);
  assert.equal(ressembleAQuestion(''), false);
  assert.equal(ressembleAQuestion(null), false);
});
