// src/cockpit.test.mjs — instruments du poste de pilotage (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dessinerBande, dessinerHorizon } from './cockpit.js';

/** Faux contexte 2D : enregistre les appels au lieu de peindre. */
function fauxCtx() {
  const appels = [];
  const gradient = { addColorStop() {} };
  const ctx = {
    appels,
    canvas: { width: 300, height: 300 },
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    createLinearGradient() { appels.push('gradient'); return gradient; },
    createRadialGradient() { appels.push('gradient'); return gradient; },
  };
  for (const m of [
    'clearRect', 'save', 'restore', 'beginPath', 'closePath', 'arc', 'clip', 'translate',
    'rotate', 'scale', 'fillRect', 'rect', 'roundRect', 'fill', 'stroke', 'moveTo',
    'lineTo', 'fillText', 'strokeText', 'setLineDash', 'measureText',
  ]) {
    ctx[m] = (...a) => appels.push(`${m}(${a.length})`);
  }
  ctx.measureText = () => ({ width: 10 });
  return ctx;
}

test('horizon : dessine sans erreur et remplit ciel + sol', () => {
  const ctx = fauxCtx();
  dessinerHorizon(ctx, { largeur: 270, hauteur: 270, roulis: 0, tangage: 0, cap: 0 });
  assert.ok(ctx.appels.length > 20, 'un horizon se dessine vraiment');
  assert.ok(ctx.appels.includes('clearRect(4)'), 'la toile est effacée');
  assert.ok(ctx.appels.some((a) => a.startsWith('gradient')), 'dégradés ciel/sol');
  assert.ok(ctx.appels.filter((a) => a.startsWith('fillRect')).length >= 2, 'ciel et sol remplis');
});

test('horizon : le roulis et le tangage sont appliqués (rotation + translation)', () => {
  const ctx = fauxCtx();
  dessinerHorizon(ctx, { largeur: 270, hauteur: 270, roulis: 0.4, tangage: -0.2, cap: 1 });
  assert.ok(ctx.appels.some((a) => a.startsWith('rotate')), 'rotation de roulis');
  assert.ok(ctx.appels.some((a) => a.startsWith('translate')), 'cadrage du tangage');
  assert.ok(ctx.appels.filter((a) => a.startsWith('fillText')).length > 4, 'échelle de tangage + cap');
});

test('horizon : valeurs extrêmes sans plantage', () => {
  for (const [roulis, tangage, cap] of [[-10, -2, -5], [10, 2, 12], [0, 0, 0]]) {
    const ctx = fauxCtx();
    dessinerHorizon(ctx, { largeur: 200, hauteur: 200, roulis, tangage, cap });
    assert.ok(ctx.appels.length > 5);
  }
});

test('horizon : valeurs manquantes tolérées (pas de NaN dans les dessins)', () => {
  const ctx = fauxCtx();
  dessinerHorizon(ctx, { largeur: 200, hauteur: 200 });
  for (const a of ctx.appels) assert.doesNotMatch(a, /NaN/, `appel suspect : ${a}`);
});

test('bande : gradients, graduations et boîtier de valeur', () => {
  const ctx = fauxCtx();
  dessinerBande(ctx, { largeur: 86, hauteur: 270, valeur: 180, pas: 20, unite: 'km/h', libelle: 'VITESSE' });
  assert.ok(ctx.appels.some((a) => a.startsWith('fill(')), 'fond de la bande rempli');
  const traits = ctx.appels.filter((a) => a.startsWith('lineTo')).length;
  assert.ok(traits > 8, `graduations tracées (${traits})`);
  assert.ok(ctx.appels.filter((a) => a.startsWith('fillText')).length > 3, 'valeurs + unité');
});

test('bande : la valeur courante est centrée (boîtier au milieu)', () => {
  const ctx = fauxCtx();
  dessinerBande(ctx, { largeur: 86, hauteur: 270, valeur: 0, pas: 10, unite: 'm', libelle: 'ALTITUDE' });
  const rects = ctx.appels.filter((a) => a.startsWith('rect('));
  assert.ok(rects.length >= 1, 'boîtier de valeur dessiné');
  assert.doesNotMatch(rects.join(' '), /NaN/);
});

test('bande : valeurs négatives ou énormes sans erreur', () => {
  for (const valeur of [-500, 0, 12_345]) {
    const ctx = fauxCtx();
    dessinerBande(ctx, { largeur: 60, hauteur: 200, valeur, pas: 10, unite: 'x' });
    for (const a of ctx.appels) assert.doesNotMatch(a, /NaN/);
  }
});
