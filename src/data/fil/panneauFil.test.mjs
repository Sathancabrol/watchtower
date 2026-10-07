import test from 'node:test';
import assert from 'node:assert/strict';
import { FLUX_FIL, TRIS, preferencesParDefaut, normaliserPreferences } from './preferencesFil.js';
import {
  htmlPanneauFil, appliquerAction, echapper, NOMS_TRI, libelleDepliage,
} from './panneauFil.js';

test('le panneau montre TOUS les flux, y compris ceux qui sont eteints', () => {
  const h = htmlPanneauFil(preferencesParDefaut());
  for (const f of FLUX_FIL) {
    assert.ok(h.includes(`basculer:${f.id}`), `${f.id} n est pas reglable depuis le panneau`);
    assert.ok(h.includes(echapper(f.nom)), `${f.id} n est pas nomme`);
  }
});

test('chaque flux annonce sa source et s il demande le reseau', () => {
  const h = htmlPanneauFil(preferencesParDefaut());
  assert.match(h, /hors ligne/, 'les flux locaux doivent se signaler');
  assert.match(h, /réseau/, 'les flux distants doivent se signaler');
});

test('l etat allume ou eteint est lisible par un lecteur d ecran', () => {
  const h = htmlPanneauFil(preferencesParDefaut());
  assert.match(h, /aria-pressed="true"/);
  assert.match(h, /aria-pressed="false"/);
});

test('les fleches de rang sont desactivees aux extremites, pas absentes', () => {
  const p = preferencesParDefaut();
  const h = htmlPanneauFil(p);
  // Le premier ne peut pas monter, le dernier ne peut pas descendre.
  assert.match(h, new RegExp(`monter:${p.ordre[0]}"\\s*disabled`));
  assert.match(h, new RegExp(`descendre:${p.ordre[p.ordre.length - 1]}"\\s*disabled`));
});

test('les quatre tris sont proposes et le tri courant est marque', () => {
  const h = htmlPanneauFil({ ...preferencesParDefaut(), tri: 'recent' });
  for (const t of TRIS) assert.ok(h.includes(`tri:${t}`), `tri manquant : ${t}`);
  for (const t of TRIS) assert.ok(h.includes(echapper(NOMS_TRI[t])), `libelle manquant : ${t}`);
  assert.match(h, /class="rf-tri est-actif"\s+data-rf-action="tri:recent"/);
});

test('le panneau DIT si le reglage courant exige le reseau', () => {
  assert.match(htmlPanneauFil(preferencesParDefaut()), /interroge des sources externes/);
  const local = { ...preferencesParDefaut(), actifs: ['communal'] };
  assert.match(htmlPanneauFil(local), /sans connexion/);
  assert.doesNotMatch(htmlPanneauFil(local), /interroge des sources externes/);
});

test('le texte insere est echappe — un nom de flux reste du texte', () => {
  assert.equal(echapper('<script>a&b"c\'d'), '&lt;script&gt;a&amp;b&quot;c&#39;d');
  assert.doesNotMatch(htmlPanneauFil(preferencesParDefaut()), /<script/i);
});

test('le bouton dit ce qu il VA faire, pas l etat courant', () => {
  assert.equal(libelleDepliage({ ...preferencesParDefaut(), deplie: false }), 'Déplier le fil');
  assert.equal(libelleDepliage({ ...preferencesParDefaut(), deplie: true }), 'Replier le fil');
});

test('basculer depuis le panneau allume puis eteint le flux', () => {
  let p = preferencesParDefaut();
  assert.ok(!p.actifs.includes('radio'));
  p = appliquerAction(p, 'basculer:radio');
  assert.ok(p.actifs.includes('radio'));
  p = appliquerAction(p, 'basculer:radio');
  assert.ok(!p.actifs.includes('radio'));
});

test('monter et descendre changent l ordre, et ne bouclent pas', () => {
  const d = preferencesParDefaut();
  const bouge = appliquerAction(d, `monter:${d.ordre[2]}`);
  assert.equal(bouge.ordre[1], d.ordre[2]);
  assert.deepEqual(appliquerAction(d, `monter:${d.ordre[0]}`).ordre, d.ordre);
});

test('un tri inconnu est refuse sans rien casser', () => {
  const p = appliquerAction(preferencesParDefaut(), 'tri:aleatoire');
  assert.equal(p.tri, 'importance');
});

test('limite et gravite restent dans leurs bornes, meme pousses a l absurde', () => {
  assert.equal(appliquerAction(preferencesParDefaut(), 'limite:9999').limite, 60);
  assert.equal(appliquerAction(preferencesParDefaut(), 'limite:0').limite, 3);
  assert.equal(appliquerAction(preferencesParDefaut(), 'gravite:42').graviteMin, 3);
});

test('deplier puis replier — le SEUL moyen pour le fil de prendre de la place', () => {
  let p = preferencesParDefaut();
  assert.equal(p.deplie, false, 'au demarrage le fil est replie');
  p = appliquerAction(p, 'deplier');
  assert.equal(p.deplie, true);
  p = appliquerAction(p, 'deplier');
  assert.equal(p.deplie, false);
  assert.equal(appliquerAction({ ...p, deplie: true }, 'replier').deplie, false);
});

test('reinitialiser ne referme pas le panneau sous les doigts', () => {
  let p = appliquerAction(preferencesParDefaut(), 'deplier');
  p = appliquerAction(p, 'basculer:radio');
  const remis = appliquerAction(p, 'defaut');
  assert.deepEqual(remis.actifs, preferencesParDefaut().actifs);
  assert.equal(remis.deplie, true, 'le depliage en cours doit survivre');
});

test('une action inconnue ou absurde laisse l etat intact', () => {
  const d = preferencesParDefaut();
  for (const mauvais of ['', null, undefined, 'danser', 'basculer:', 'basculer:licorne', ':::']) {
    assert.deepEqual(appliquerAction(d, mauvais), normaliserPreferences(d), String(mauvais));
  }
});

test('appliquerAction ne modifie jamais les preferences qu on lui donne', () => {
  const d = preferencesParDefaut();
  const copie = JSON.parse(JSON.stringify(d));
  appliquerAction(d, 'basculer:radio');
  appliquerAction(d, 'monter:presse');
  appliquerAction(d, 'deplier');
  assert.deepEqual(d, copie);
});

test('le resume du reglage est affiche en tete, sans avoir a lire la liste', () => {
  assert.match(htmlPanneauFil(preferencesParDefaut()), /rf-resume">[^<]*flux sur/);
});

test('le panneau offre toujours une sortie et un retour en arriere', () => {
  const h = htmlPanneauFil(preferencesParDefaut());
  assert.ok(h.includes('data-rf-action="fermer"'), 'il faut pouvoir fermer');
  assert.ok(h.includes('data-rf-action="defaut"'), 'il faut pouvoir tout remettre');
});
