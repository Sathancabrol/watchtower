// src/mobiglas.test.mjs — mode mobiGlas (HUD compact de vol, partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CIBLES_MICRO, ESSENTIELS, FENETRES_BUREAU, NIVEAUX, resumeVol,
} from './mobiglas.js';

test('la minicarte, la boussole et le cockpit sont intouchables', () => {
  for (const sel of ['#wt-minimap', '#wt-boussole', '#wt-cockpit']) {
    assert.ok(ESSENTIELS.includes(sel), `${sel} doit être essentiel`);
  }
});

test('le micro (capture vocale) est essentiel : le HUD s’y adosse', () => {
  assert.ok(ESSENTIELS.includes('#command-dock'));
  assert.ok(CIBLES_MICRO.includes('#gev-voice-control'));
});

test('les fenêtres de bureau sont bien celles qu’on estompe', () => {
  for (const sel of ['#wt-panel', '#wt-intel', '#wt-fiche', '#wt-pins']) {
    assert.ok(FENETRES_BUREAU.includes(sel), `${sel} doit être estompée`);
  }
  // aucune fenêtre essentielle ne doit être estompée
  for (const sel of ESSENTIELS) {
    assert.ok(!FENETRES_BUREAU.includes(sel), `${sel} ne doit pas être estompée`);
  }
});

test('deux niveaux seulement : transparent puis masquer', () => {
  assert.deepEqual(NIVEAUX, ['transparent', 'masquer']);
});

test('résumé de vol : vitesse en km/h, altitude absolue et hauteur sol', () => {
  const r = resumeVol({ vitesse: 60, alt: 1250, sol: 40, vario: 2.4, cap: 0 });
  assert.equal(r.vitesse, '216');      // 60 m/s → 216 km/h
  assert.equal(r.altitude, '1250 (1210)');
  assert.equal(r.vario, '+2.4');
  assert.equal(r.cap, '000');
  assert.equal(r.etat, '✔ NOMINAL');
  assert.equal(r.alerte, false);
});

test('résumé de vol : le cap est toujours sur 3 chiffres et dans [0,360[', () => {
  assert.equal(resumeVol({ cap: Math.PI / 2 }).cap, '090');
  assert.equal(resumeVol({ cap: Math.PI * 2 - 0.01 }).cap, '359');
  assert.equal(resumeVol({ cap: -Math.PI / 2 }).cap, '270');
});

test('résumé de vol : vario négatif signé', () => {
  assert.equal(resumeVol({ vario: -3.25 }).vario, '-3.3');
});

test('résumé de vol : les états anormaux remontent en alerte', () => {
  const decroche = resumeVol({ decroche: true });
  assert.match(decroche.etat, /DÉCROCHAGE/);
  assert.equal(decroche.alerte, true);

  const plafond = resumeVol({ plafond: true });
  assert.match(plafond.etat, /PLAFOND/);
  assert.equal(plafond.alerte, true);

  const bloque = resumeVol({ bloque: '⚓ TERRE — DEMI-TOUR' });
  assert.equal(bloque.etat, '⚓ TERRE — DEMI-TOUR');
  assert.equal(bloque.alerte, true);
});

test('résumé de vol : sans sol connu, pas de hauteur sol', () => {
  assert.equal(resumeVol({ alt: 500 }).altitude, '500');
});

test('résumé de vol : valeurs absentes ou invalides → zéros, jamais NaN', () => {
  const r = resumeVol({});
  assert.equal(r.vitesse, '0');
  assert.equal(r.altitude, '0');
  assert.equal(r.cap, '000');
  assert.equal(r.vario, '0.0');
  const b = resumeVol({ vitesse: NaN, alt: undefined, cap: null });
  assert.equal(b.vitesse, '0');
  assert.equal(b.altitude, '0');
});

test('le nom de l’engin est transmis tel quel', () => {
  assert.equal(resumeVol({ engin: '🛩 Cessna 172' }).nomEngin, '🛩 Cessna 172');
});
