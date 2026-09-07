// src/data/vignettes.test.mjs — vignettes analogiques du palais mental.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TYPES_VIGNETTE, echapper, graineDe, svgEnUrl, tronquer, vignette, vignetteAerienne,
  vignetteMugshot, vignettePlan, vignettePolaroid, vignetteVideo,
} from './vignettes.js';

const svgValide = (s, nom) => {
  assert.match(s, /^<svg /, `${nom} commence par <svg`);
  assert.match(s, /<\/svg>$/, `${nom} se termine`);
  assert.match(s, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${nom} a son espace de noms`);
  assert.doesNotMatch(s, /NaN|undefined|Infinity/, `${nom} n’a pas de valeur invalide`);
};

test('graine déterministe : le même texte donne la même suite', () => {
  const a = graineDe('frontignan');
  const b = graineDe('frontignan');
  const c = graineDe('sete');
  const suiteA = [a(), a(), a()];
  const suiteB = [b(), b(), b()];
  const suiteC = [c(), c(), c()];
  assert.deepEqual(suiteA, suiteB);
  assert.notDeepEqual(suiteA, suiteC, 'une autre graine change la suite');
  for (const v of suiteA) assert.ok(v >= 0 && v < 1);
});

test('échappement et troncature', () => {
  assert.equal(echapper('<b>"x" & \'y\'</b>'), '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
  assert.equal(tronquer('court', 10), 'court');
  assert.equal(tronquer('un nom de dossier beaucoup trop long', 10), 'un nom de…');
  assert.equal(tronquer(null, 5), '');
});

test('vignette aérienne', () => {
  const s = vignetteAerienne({ titre: 'Chantier A', graine: 'chantier-a' });
  svgValide(s, 'aérienne');
  assert.match(s, /Chantier A/);
  assert.equal(vignetteAerienne({ graine: 'x' }), vignetteAerienne({ graine: 'x' }), 'déterministe');
  assert.notEqual(vignetteAerienne({ graine: 'x' }), vignetteAerienne({ graine: 'y' }));
});

test('vignette mugshot', () => {
  const s = vignetteMugshot({ titre: 'Journalier · équipe B', graine: 'equipe-b' });
  svgValide(s, 'mugshot');
  assert.match(s, /Journalier/);
});

test('vignette polaroïd', () => {
  const s = vignettePolaroid({ titre: 'Repérage 12/09', graine: 'rep' });
  svgValide(s, 'polaroïd');
  assert.match(s, /Repérage/);
  assert.match(s, /#efe9dc/, 'marge papier');
});

test('vignette plan / blueprint', () => {
  const s = vignettePlan({ titre: 'Plan de phasage', graine: 'phasage' });
  svgValide(s, 'plan');
  assert.match(s, /#0d2438/, 'fond bleu');
});

test('planche contact vidéo', () => {
  const s = vignetteVideo({ titre: 'Timelapse 48 h', graine: 'tl', images: 5 });
  svgValide(s, 'vidéo');
  assert.match(s, /▶ Timelapse/);
  assert.equal(vignetteVideo({ graine: 'tl', images: 99 }).match(/<rect x="8"/g).length, 6, 'bornée à 6 images');
});

test('toutes les vignettes acceptent une taille et restent valides', () => {
  for (const [nom, f] of Object.entries(TYPES_VIGNETTE)) {
    for (const taille of [80, 0, -5, 480]) svgValide(f({ titre: `T ${nom}`, graine: nom, taille }), nom);
  }
});

test('fabrique : type inconnu → polaroïd', () => {
  assert.equal(vignette('aerien', { graine: 'a' }), vignetteAerienne({ graine: 'a' }));
  assert.equal(vignette('inconnu', { graine: 'a' }), vignettePolaroid({ graine: 'a' }));
  assert.equal(vignette(null, { graine: 'a' }), vignettePolaroid({ graine: 'a' }));
});

test('svg → URL de données utilisable dans un <img>', () => {
  const u = svgEnUrl(vignetteAerienne({ graine: 'z' }));
  assert.match(u, /^data:image\/svg\+xml/);
  assert.equal(svgEnUrl(''), '');
});
