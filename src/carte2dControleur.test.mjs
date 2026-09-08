import test from 'node:test';
import assert from 'node:assert/strict';
import { lireEtatCesium, appliquerEtatCesium } from './carte2dControleur.js';

const deg = Math.PI / 180;

/** Doublure minimale de viewer Cesium. */
function faussViewer({ lon = 3.7493, lat = 43.4486, height = 2500, heading = 45, pitch = -35 } = {}) {
  return {
    camera: {
      positionCartographic: { longitude: lon * deg, latitude: lat * deg, height },
      heading: heading * deg,
      pitch: pitch * deg,
      setView(a) { this.dernierAppel = a; },
    },
  };
}

/** Doublure de l'espace de noms Cesium. */
const FauxCesium = {
  Cartesian3: { fromDegrees: (lon, lat, h) => ({ lon, lat, h }) },
};

test('lireEtatCesium convertit les radians en degres', () => {
  const e = lireEtatCesium(faussViewer());
  assert.ok(Math.abs(e.lon - 3.7493) < 1e-9, 'longitude en degres');
  assert.ok(Math.abs(e.lat - 43.4486) < 1e-9, 'latitude en degres');
  assert.equal(e.hauteurM, 2500);
  assert.ok(Math.abs(e.capDeg - 45) < 1e-9, 'cap en degres');
  assert.ok(Math.abs(e.tangageDeg + 35) < 1e-9, 'tangage negatif conserve');
});

test('lireEtatCesium ne casse pas sur un viewer incomplet', () => {
  for (const v of [null, undefined, {}, { camera: {} }, { camera: { positionCartographic: null } }]) {
    const e = lireEtatCesium(v);
    assert.ok(Number.isFinite(e.lon) && Number.isFinite(e.lat) && e.hauteurM > 0,
      'etat exploitable meme sans camera');
  }
});

test('lireEtatCesium tolere un cap ou un tangage absent', () => {
  const v = faussViewer();
  delete v.camera.heading;
  delete v.camera.pitch;
  const e = lireEtatCesium(v);
  assert.equal(e.capDeg, 0);
  assert.equal(e.tangageDeg, 0);
});

test('appliquerEtatCesium repasse en radians et en Cartesian3', () => {
  const v = faussViewer();
  appliquerEtatCesium(v, { lon: 3.6441, lat: 43.3844, hauteurM: 1200, capDeg: 90, tangageDeg: -60 }, FauxCesium);
  const a = v.camera.dernierAppel;
  assert.deepEqual(a.destination, { lon: 3.6441, lat: 43.3844, h: 1200 });
  assert.ok(Math.abs(a.orientation.heading - 90 * deg) < 1e-12, 'cap en radians');
  assert.ok(Math.abs(a.orientation.pitch + 60 * deg) < 1e-12, 'tangage en radians');
  assert.equal(a.orientation.roll, 0);
});

test('ALLER-RETOUR Cesium -> neutre -> Cesium sans derive', () => {
  const depart = { lon: 3.7493, lat: 43.4486, height: 3500, heading: 137, pitch: -42 };
  const v = faussViewer(depart);
  const etat = lireEtatCesium(v);
  appliquerEtatCesium(v, etat, FauxCesium);
  const a = v.camera.dernierAppel;
  assert.ok(Math.abs(a.destination.lon - depart.lon) < 1e-9);
  assert.ok(Math.abs(a.destination.lat - depart.lat) < 1e-9);
  assert.ok(Math.abs(a.destination.h - depart.height) < 1e-9);
  assert.ok(Math.abs(a.orientation.heading - depart.heading * deg) < 1e-12);
  assert.ok(Math.abs(a.orientation.pitch - depart.pitch * deg) < 1e-12);
});

test('un etat aberrant est assaini avant d atteindre Cesium', () => {
  const v = faussViewer();
  appliquerEtatCesium(v, { lon: 400, lat: 95, hauteurM: -10 }, FauxCesium);
  const d = v.camera.dernierAppel.destination;
  assert.ok(d.lon >= -180 && d.lon <= 180, `longitude repliee (${d.lon})`);
  assert.ok(d.lat >= -85.06 && d.lat <= 85.06, `latitude bornee (${d.lat})`);
  assert.ok(d.h > 0, 'hauteur strictement positive');
});

test('initCarte2D degrade proprement sans DOM', async () => {
  const { initCarte2D } = await import('./carte2dControleur.js');
  const api = initCarte2D({ viewer: faussViewer(), Cesium: FauxCesium, document: null });
  assert.equal(api.estEn2D(), false);
  assert.doesNotThrow(() => api.basculer());
  assert.doesNotThrow(() => api.detruire());
});
