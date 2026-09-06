/**
 * Tests — CATALOGUE DU HUD (noms, catégories, recherche, préréglages).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATEGORIES,
  NOMS,
  PRESETS,
  PROTEGES,
  appliquerPreset,
  cataloguer,
  decrire,
  fabriquerNom,
  filtrer,
  grouper,
  resumer,
} from './hudCatalogue.js';

test('chaque élément connu a une catégorie qui existe', () => {
  const ids = new Set(CATEGORIES.map((c) => c.id));
  for (const [cle, [, categorie]] of Object.entries(NOMS)) {
    assert.ok(ids.has(categorie), `${cle} → catégorie inconnue « ${categorie} »`);
  }
});

test('un identifiant inconnu reçoit quand même un nom lisible', () => {
  const d = decrire('wt-machin-truc');
  assert.equal(d.nom, 'Wt machin truc');
  assert.equal(d.connu, false);
  assert.equal(d.categorie, 'divers');
  assert.equal(fabriquerNom(''), 'élément sans nom');
});

test('le # d’un sélecteur est ignoré', () => {
  assert.equal(decrire('#wt-dock').id, 'wt-dock');
  assert.equal(decrire('#wt-dock').nom, NOMS['wt-dock'][0]);
});

test('les éléments protégés ne sont jamais proposés', () => {
  for (const p of PROTEGES) assert.ok(PROTEGES.includes(p));
  const items = cataloguer(['cesiumContainer', 'wt-dock', 'wt-hud-central']);
  assert.deepEqual(items.map((i) => i.id), ['wt-dock']);
});

test('cataloguer marque ce qui est affiché, et trie par nom', () => {
  const items = cataloguer(['wt-dock', 'title-bar', 'zz-inconnu'], { visibles: ['wt-dock'] });
  assert.deepEqual(items.map((i) => i.id), ['wt-dock', 'title-bar', 'zz-inconnu']);
  assert.equal(items.find((i) => i.id === 'wt-dock').visible, true);
  assert.equal(items.find((i) => i.id === 'title-bar').visible, false, 'trié par nom : « Barre » avant « Titre »');
});

test('grouper respecte l’ordre des catégories et saute les vides', () => {
  const g = grouper(cataloguer(['wt-dock', 'wt-intel', 'inconnu-x']));
  assert.ok(g.length >= 3);
  assert.equal(g[0].id, 'barres');
  assert.ok(g.find((x) => x.id === 'donnees').items.some((i) => i.id === 'wt-intel'));
  const ordre = g.map((x) => CATEGORIES.findIndex((c) => c.id === x.id));
  assert.deepEqual(ordre, [...ordre].sort((a, b) => a - b));
  for (const groupe of g) assert.ok(groupe.items.length > 0);
});

test('la recherche trouve sans accent ni majuscule', () => {
  const items = cataloguer(['wt-dock', 'wt-intel', 'wt-minimap']);
  assert.equal(filtrer(items, 'minicarte').length, 1);
  assert.equal(filtrer(items, 'MINICARTE').length, 1);
  assert.equal(filtrer(items, 'intel').length, 1, 'trouvé par le nom et par l’id');
  assert.equal(filtrer(items, '').length, 3, 'vide = tout');
  assert.equal(filtrer(items, '   ').length, 3);
  assert.equal(filtrer(items, 'zzz').length, 0);
});

test('le résumé compte les éléments affichés', () => {
  assert.equal(resumer(cataloguer(['wt-dock', 'title-bar'], { visibles: ['wt-dock'] })), '1 affiché / 2 éléments');
  assert.equal(resumer(cataloguer(['a', 'b'], { visibles: ['a', 'b'] })), '2 affichés / 2 éléments');
  assert.equal(resumer([]), '0 affiché / 0 élément');
});

test('les préréglages ne masquent jamais tout : la barre du bas reste', () => {
  const items = cataloguer(Object.keys(NOMS));
  for (const nom of Object.keys(PRESETS)) {
    const apres = appliquerPreset(items, nom);
    assert.ok(apres.some((i) => i.visible), `${nom} laisse au moins un élément`);
    if (PRESETS[nom].garder) {
      assert.ok(apres.find((i) => i.id === 'wt-dock').visible, `${nom} garde la barre du bas`);
    }
  }
});

test('« tout afficher » remet tout à visible, « épuré » ne garde que l’essentiel', () => {
  const items = cataloguer(['wt-dock', 'wt-intel', 'wt-photo', 'scene-panel']);
  assert.equal(appliquerPreset(items, 'complet').every((i) => i.visible), true);
  const epure = appliquerPreset(items, 'epure');
  assert.deepEqual(epure.filter((i) => i.visible).map((i) => i.id), ['wt-dock']);
});

test('appliquer un préréglage inconnu équivaut à tout afficher', () => {
  const items = cataloguer(['wt-dock', 'title-bar']);
  assert.equal(appliquerPreset(items, 'nawak').every((i) => i.visible), true);
});
