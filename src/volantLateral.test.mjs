import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORIES_VOLANT, cleEntree, construireCatalogue, toutesLesEntrees, filtrer, ouvrirEntree,
} from './volantLateral.js';
import { CATEGORIES } from './barreFonctions.js';
import { SOMMAIRE_OPTION } from './ergonomieDock.js';
import { BASCULES_AFFICHAGE } from './data/volant/registreBascules.js';

test('les categories du volant sont completes et uniques', () => {
  const ids = CATEGORIES_VOLANT.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants dupliques');
  for (const c of CATEGORIES_VOLANT) {
    assert.ok(c.nom && c.icone && c.aide, `categorie incomplete : ${c.id}`);
  }
  for (const attendu of ['affichage', 'vues', 'donnees', 'nav', 'modes', 'outils']) {
    assert.ok(ids.includes(attendu), `categorie manquante : ${attendu}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// LE TEST QUI COMPTE : aucune fonction existante ne doit disparaitre du
// volant. Si quelqu'un ajoute une entree a un registre sans la cabler, ou
// en retire une du volant, ces trois tests echouent.
// ─────────────────────────────────────────────────────────────────────────

test('AUCUNE bascule d affichage n est perdue', () => {
  const cles = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const b of BASCULES_AFFICHAGE) {
    assert.ok(cles.has(`bascule:${b.id}`), `bascule absente du volant : ${b.id} (${b.libelle})`);
  }
});

test('AUCUNE entree de la barre de fonctions n est perdue', () => {
  const cles = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const cat of CATEGORIES) {
    for (const e of cat.entrees) {
      const cle = e.dock ? `dock:${e.dock}` : `cible:${e.cible}`;
      assert.ok(cles.has(cle), `entree absente du volant : ${cat.nom} / ${e.info} (${cle})`);
    }
  }
});

test('AUCUNE entree du sommaire OPTION n est perdue', () => {
  const cles = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const g of SOMMAIRE_OPTION) {
    for (const e of g.entrees) {
      const cle = e.ancre ? `dock:${e.ancre}` : `cible:${e.cible}`;
      assert.ok(cles.has(cle), `entree absente du volant : ${g.groupe} / ${e.nom} (${cle})`);
    }
  }
});

test('le catalogue ne contient aucun doublon', () => {
  const toutes = toutesLesEntrees();
  const cles = toutes.map((e) => e.cle);
  assert.equal(new Set(cles).size, cles.length, `doublons : ${cles.filter((c, i) => cles.indexOf(c) !== i).join(', ')}`);
});

test('chaque entree sait ce qu elle fait et d ou elle vient', () => {
  for (const e of toutesLesEntrees()) {
    assert.ok(e.nom, `entree sans nom : ${e.cle}`);
    assert.ok(e.icone, `entree sans icone : ${e.cle}`);
    assert.ok(['bascule', 'ouvrir'].includes(e.type), `type inconnu : ${e.type}`);
    assert.ok(Array.isArray(e.sources) && e.sources.length, `entree sans source : ${e.cle}`);
    if (e.type === 'ouvrir') assert.ok(e.dock || e.cible, `${e.nom} n ouvre rien`);
    if (e.type === 'bascule') assert.ok(e.id, 'bascule sans id');
  }
});

test('toutes les categories du volant sont peuplees', () => {
  for (const c of construireCatalogue()) {
    assert.ok(c.entrees.length > 0, `categorie vide : ${c.nom}`);
  }
});

test('cleEntree distingue bascule, ancre et cible', () => {
  assert.equal(cleEntree({ type: 'bascule', id: 'minicarte' }), 'bascule:minicarte');
  assert.equal(cleEntree({ dock: 'cadastre' }), 'dock:cadastre');
  assert.equal(cleEntree({ cible: 'wt-intel' }), 'cible:wt-intel');
  assert.equal(cleEntree(null), '');
});

test('la fusion conserve la trace des registres d origine', () => {
  const partagee = toutesLesEntrees().find((e) => e.sources.length > 1);
  assert.ok(partagee, 'au moins une entree devrait figurer dans deux registres');
});

test('la recherche filtre sans casser la structure', () => {
  const r = filtrer('cadastre');
  assert.ok(r.length >= 1);
  assert.ok(r.every((c) => c.entrees.length > 0), 'pas de categorie vide dans un resultat');
  assert.ok(toutesLesEntrees(r).every((e) => /cadastre/i.test(`${e.nom} ${e.aide} ${e.dock || ''} ${e.cible || ''}`)));
  assert.equal(toutesLesEntrees(filtrer('zzzzz')).length, 0);
  assert.equal(toutesLesEntrees(filtrer('')).length, toutesLesEntrees().length, 'recherche vide = tout');
});

test('ouvrirEntree delegue au dock existant', () => {
  const appels = [];
  const hub = {
    dock: {
      ouvrir: (id) => { appels.push(['ouvrir', id]); return true; },
      ouvrirExistant: (id) => { appels.push(['existant', id]); return true; },
    },
  };
  assert.equal(ouvrirEntree({ dock: 'soleil' }, hub), true);
  assert.equal(ouvrirEntree({ cible: 'wt-pins' }, hub), true);
  assert.deepEqual(appels, [['ouvrir', 'soleil'], ['existant', 'wt-pins']]);
  assert.equal(ouvrirEntree(null, hub), false);
  assert.equal(ouvrirEntree({ dock: 'x' }, {}), false, 'sans dock ni cible DOM : echec honnete');
});

test('le volant couvre au moins autant de fonctions que chaque registre', () => {
  const n = toutesLesEntrees().length;
  assert.ok(n >= BASCULES_AFFICHAGE.length, 'moins d entrees que de bascules');
  assert.ok(n >= CATEGORIES.flatMap((c) => c.entrees).length, 'moins d entrees que la barre');
  assert.ok(n >= 30, `catalogue anormalement maigre : ${n}`);
});
