// src/engins.test.mjs — hangar du mode vol (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  ENGINS,
  FILTRES_VOL,
  bornesVol,
  cssFiltreVol,
  dessinerEngin,
  engin,
  filtrerEngins,
} from './engins.js';

test('chaque engin est cohérent : min ≤ croisière ≤ max', () => {
  for (const e of ENGINS) {
    assert.ok(e.vMin <= e.croisiere, `${e.id} : croisière < min`);
    assert.ok(e.croisiere <= e.vMax, `${e.id} : croisière > max`);
    assert.ok(e.vMax > 0, `${e.id} vitesse max`);
    assert.ok(e.plafond >= 0, `${e.id} plafond`);
    assert.ok(e.virage > 0 && e.inertie > 0, `${e.id} maniabilité`);
    assert.ok(CATEGORIES.some((c) => c.cle === e.cat), `${e.id} a une catégorie connue`);
    assert.ok(e.reference && e.note, `${e.id} documenté`);
  }
  assert.ok(ENGINS.length >= 8, 'assez d’engins pour un hangar');
});

test('les identifiants sont uniques', () => {
  const ids = ENGINS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('repli : un engin inconnu rend le Cessna', () => {
  assert.equal(engin('inexistant').id, 'cessna');
  assert.equal(engin(null).id, 'cessna');
  assert.equal(engin('rafale-chasse').id, 'cessna');
  assert.equal(engin('chasse').id, 'chasse');
});

test('filtre par catégorie et par texte', () => {
  assert.equal(filtrerEngins('drone').length, ENGINS.filter((e) => e.cat === 'drone').length);
  assert.ok(filtrerEngins('', 'cessna').some((e) => e.id === 'cessna'));
  assert.ok(filtrerEngins('', 'CessNa').length >= 1, 'recherche insensible à la casse');
  assert.deepEqual(filtrerEngins('', 'zzzzzz'), []);
  assert.equal(filtrerEngins().length, ENGINS.length, 'sans filtre : tout le hangar');
});

test('bornes de vol converties en m/s et en mètres', () => {
  const b = bornesVol(engin('cessna'));
  // Cessna 172 : 226 km/h de croisière ≈ 62,8 m/s
  assert.ok(Math.abs(b.croisiere - 226 / 3.6) < 0.1);
  assert.ok(Math.abs(b.vMax - 302 / 3.6) < 0.1);
  assert.equal(b.plafond, 4_300);
  assert.equal(b.peutStationner, false);
  const d = bornesVol(engin('quad'));
  assert.equal(d.peutStationner, true, 'un drone peut faire du sur-place');
  assert.equal(d.vMin, 0);
  const inconnu = bornesVol({ id: 'nope' });
  assert.equal(inconnu.croisiere, (226 / 3.6), 'repli Cessna');
});

test('les engins particuliers sont marqués (planeur, sol, mer)', () => {
  assert.ok(bornesVol(engin('planeur')).tauxChute > 0, 'le planeur chute');
  assert.equal(bornesVol(engin('voiture')).auSol, true);
  assert.equal(bornesVol(engin('vedette')).surEau, true);
  assert.equal(bornesVol(engin('cessna')).auSol, false);
});

test('filtres de caméra : CSS connu et repli sûr', () => {
  assert.equal(cssFiltreVol('normal'), 'none');
  for (const f of FILTRES_VOL) assert.equal(cssFiltreVol(f.cle), f.css);
  assert.equal(cssFiltreVol('inconnu'), 'none', 'pas de plantage sur une clé inconnue');
  assert.ok(FILTRES_VOL.some((f) => f.cle === 'nuit'), 'vision nocturne présente');
});

/** Faux contexte 2D qui enregistre les appels. */
function fauxCtx() {
  const appels = [];
  const ctx = { appels, fillStyle: '', strokeStyle: '', lineWidth: 1, lineJoin: '' };
  for (const m of ['clearRect', 'save', 'restore', 'translate', 'scale', 'beginPath', 'closePath',
    'moveTo', 'lineTo', 'arc', 'ellipse', 'rect', 'quadraticCurveTo', 'fill', 'stroke']) {
    ctx[m] = (...a) => appels.push(`${m}(${a.length})`);
  }
  return ctx;
}

test('chaque silhouette se dessine sans erreur (aucun NaN)', () => {
  for (const e of ENGINS) {
    const ctx = fauxCtx();
    dessinerEngin(ctx, e.id, { largeur: 240, hauteur: 128 });
    assert.ok(ctx.appels.length > 4, `${e.id} : silhouette tracée`);
    for (const a of ctx.appels) assert.doesNotMatch(a, /NaN/, `${e.id} : ${a}`);
  }
});

test('silhouette : un engin inconnu dessine quand même (repli Cessna)', () => {
  const ctx = fauxCtx();
  dessinerEngin(ctx, 'zzz', { largeur: 120, hauteur: 64 });
  assert.ok(ctx.appels.length > 4);
});
