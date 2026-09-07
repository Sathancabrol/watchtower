/** Tests — HQ : la tour de guet qui apparaît selon la distance (comme Maps). */
import assert from 'node:assert/strict';
import test from 'node:test';
import { HAUTEUR, SEUILS, apparence, distanceM } from './hq.js';

test('très loin : on ne voit rien', () => {
  const a = apparence(SEUILS.balise + 1);
  assert.equal(a.etage, 'aucun');
  assert.deepEqual(
    { b: a.balise, s: a.silhouette, d: a.detail },
    { b: false, s: false, d: false },
  );
});

test('entre 120 et 40 km : seule la balise brille dans le ciel', () => {
  const a = apparence(60_000);
  assert.equal(a.etage, 'balise');
  assert.equal(a.balise, true);
  assert.equal(a.silhouette, false, 'pas encore de silhouette');
});

test('entre 40 et 12 km : la silhouette se dessine', () => {
  const a = apparence(25_000);
  assert.equal(a.etage, 'silhouette');
  assert.equal(a.balise, true);
  assert.equal(a.silhouette, true);
  assert.equal(a.detail, false, 'les détails attendent qu’on soit plus près');
});

test('à moins de 12 km : la tour est complète', () => {
  const a = apparence(3_000);
  assert.equal(a.etage, 'detail');
  assert.equal(a.detail, true);
});

test('les paliers sont cohérents entre eux', () => {
  assert.ok(SEUILS.detail < SEUILS.silhouette, 'le détail vient avant la silhouette');
  assert.ok(SEUILS.silhouette < SEUILS.balise, 'la silhouette vient avant la balise');
  assert.equal(apparence(SEUILS.detail).detail, true, 'sur le seuil : visible');
  assert.equal(apparence(-5).etage, 'inconnu');
  assert.equal(apparence(NaN).etage, 'inconnu');
});

test('la tour est assez haute pour porter loin', () => {
  assert.ok(HAUTEUR >= 100 && HAUTEUR <= 400, `${HAUTEUR} m`);
});

test('distanceTerrestre : Sète → Montpellier ≈ 25 km', () => {
  const d = distanceM({ lat: 43.4000, lon: 3.6900 }, { lat: 43.6108, lon: 3.8772 });
  assert.ok(d > 20_000 && d < 32_000, `${Math.round(d / 1000)} km`);
});

test('distanceTerrestre : un point sur lui-même = 0', () => {
  assert.ok(distanceM({ lat: 43.4, lon: 3.69 }, { lat: 43.4, lon: 3.69 }) < 1);
});
