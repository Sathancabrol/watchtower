import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORIES_VOLANT, cleEntree, construireCatalogue, toutesLesEntrees, filtrer, ouvrirEntree,
  ENTREES_SUPPLEMENTAIRES, ELEMENTS_MASQUES, lancerAction, masquerBoutonsFlottants,
  largeurValide, LARGEUR_MIN, LARGEUR_MAX, LARGEUR_DEFAUT,
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
    assert.ok(['bascule', 'ouvrir', 'action'].includes(e.type), `type inconnu : ${e.type}`);
    assert.ok(Array.isArray(e.sources) && e.sources.length, `entree sans source : ${e.cle}`);
    if (e.type === 'ouvrir') assert.ok(e.dock || e.cible, `${e.nom} n ouvre rien`);
    if (e.type === 'bascule') assert.ok(e.id, 'bascule sans id');
    if (e.type === 'action') assert.ok(e.cheminAction, `${e.nom} : action sans chemin`);
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

// ─────────────────────────────────────────────────────────────────────────
// RETRAIT DES BOUTONS FLOTTANTS : on ne masque un bouton que si sa fonction
// est demontrablement ailleurs. Ce test est le garde-fou.
// ─────────────────────────────────────────────────────────────────────────

test('CHAQUE bouton masque est couvert par une entree reelle du volant', () => {
  const cles = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const m of ELEMENTS_MASQUES) {
    assert.ok(m.raison, `${m.selecteur} masque sans justification`);
    assert.ok(m.couvertPar.length, `${m.selecteur} masque sans couverture declaree`);
    for (const cle of m.couvertPar) {
      assert.ok(cles.has(cle), `${m.selecteur} serait masque mais "${cle}" n existe pas dans le volant`);
    }
  }
});

test('les entrees supplementaires entrent bien dans le catalogue', () => {
  const cles = new Set(toutesLesEntrees().map((e) => e.cle));
  for (const e of ENTREES_SUPPLEMENTAIRES) {
    assert.ok(cles.has(`action:${e.id}`), `entree supplementaire absente : ${e.id}`);
    assert.ok(e.cheminAction, `${e.id} sans action`);
    assert.ok(CATEGORIES_VOLANT.some((c) => c.id === e.categorie), `${e.id} : categorie inconnue`);
  }
});

test('la bascule 2D/3D est couverte avant que son bouton soit retire', () => {
  const e = toutesLesEntrees().find((x) => x.cle === 'action:carte-2d3d');
  assert.ok(e, 'Vue 2D/3D doit exister dans le volant');
  assert.equal(e.type, 'action');
  const masque = ELEMENTS_MASQUES.find((m) => m.selecteur === '#wt-bascule2d');
  assert.ok(masque.couvertPar.includes('action:carte-2d3d'));
});

test('lancerAction resout un chemin dans le hub', () => {
  let appele = 0;
  const hub = { carte2d: { basculer() { appele += 1; } } };
  assert.equal(lancerAction({ cheminAction: 'carte2d.basculer' }, hub), true);
  assert.equal(appele, 1);
  assert.equal(lancerAction({ cheminAction: 'carte2d.inexistant' }, hub), false);
  assert.equal(lancerAction({ cheminAction: 'absent.truc' }, hub), false);
  assert.equal(lancerAction({}, hub), false);
});

test('lancerAction avale une exception sans casser l interface', () => {
  const hub = { boum: { go() { throw new Error('raté'); } } };
  assert.equal(lancerAction({ cheminAction: 'boum.go' }, hub), false);
});

test('ouvrirEntree route les actions vers lancerAction', () => {
  let vu = 0;
  const hub = { carte2d: { basculer() { vu += 1; } } };
  assert.equal(ouvrirEntree({ type: 'action', cheminAction: 'carte2d.basculer' }, hub), true);
  assert.equal(vu, 1);
});

test('masquerBoutonsFlottants masque sans supprimer', () => {
  const faits = [];
  const el = () => ({
    classList: { add: (c) => faits.push(c) },
    setAttribute: (k, v) => faits.push(`${k}=${String(v).slice(0, 12)}`),
  });
  const doc = { querySelectorAll: () => [el()] };
  const n = masquerBoutonsFlottants(doc);
  assert.equal(n, ELEMENTS_MASQUES.length);
  assert.ok(faits.includes('wt-repris-par-volant'));
  assert.equal(masquerBoutonsFlottants(null), 0);
});

test('masquerBoutonsFlottants ignore les selecteurs absents', () => {
  assert.equal(masquerBoutonsFlottants({ querySelectorAll: () => [] }), 0);
});

test('la largeur reste dans ses bornes', () => {
  assert.equal(largeurValide(300), 300);
  assert.equal(largeurValide(10), LARGEUR_MIN);
  assert.equal(largeurValide(9999), LARGEUR_MAX);
  assert.equal(largeurValide('abc'), LARGEUR_DEFAUT);
  assert.equal(largeurValide(undefined), LARGEUR_DEFAUT);
  assert.equal(largeurValide(217.6), 218, 'arrondi');
  assert.ok(LARGEUR_MIN < LARGEUR_DEFAUT && LARGEUR_DEFAUT < LARGEUR_MAX);
});

test('l oeil radial est retire : il faisait doublon avec l oeil du logo', () => {
  const m = ELEMENTS_MASQUES.find((x) => x.selecteur === '#wt-volant');
  assert.ok(m, 'le volant radial doit etre masque');
  assert.match(m.raison, /doublon/i);
});

test('la barre du bas est masquee mais reste rappelable', () => {
  const m = ELEMENTS_MASQUES.find((x) => x.selecteur === '#command-dock');
  assert.ok(m, 'la barre du bas doit etre masquee');
  assert.ok(m.couvertPar.includes('action:dock-bas'), 'il faut un moyen de la rappeler');
  // ses trois fonctions visibles doivent AUSSI etre joignables directement
  assert.ok(m.couvertPar.includes('dock:lieux'), 'la recherche de lieux doit rester joignable');
  assert.ok(m.couvertPar.includes('dock:chat'), 'le chat doit rester joignable');
});

test('l action dock-bas rend sa visibilite a la barre du bas, sans la recreer', () => {
  const dock = { classList: { valeurs: new Set(['wt-repris-par-volant']),
    toggle(c) { if (this.valeurs.has(c)) this.valeurs.delete(c); else this.valeurs.add(c); },
    contains(c) { return this.valeurs.has(c); } } };
  const docAvant = globalThis.document;
  globalThis.document = { querySelector: (s) => (s === '#command-dock' ? dock : null) };
  try {
    const entree = ENTREES_SUPPLEMENTAIRES.find((e) => e.id === 'dock-bas');
    assert.equal(lancerAction(entree, {}), true);
    assert.equal(dock.classList.contains('wt-repris-par-volant'), false, 'la barre revient');
    assert.equal(lancerAction(entree, {}), true);
    assert.equal(dock.classList.contains('wt-repris-par-volant'), true, 'et repart');
  } finally {
    globalThis.document = docAvant;
  }
});

test('aucun bouton masque ne l est sans etre couvert — garde-fou global', () => {
  const cles = new Set(toutesLesEntrees(construireCatalogue()).map((e) => e.cle));
  for (const m of ELEMENTS_MASQUES) {
    assert.ok(m.couvertPar.length > 0, `${m.selecteur} masque sans contrepartie`);
    for (const c of m.couvertPar) {
      assert.ok(cles.has(c), `${m.selecteur} annonce ${c}, absent du catalogue`);
    }
  }
});
