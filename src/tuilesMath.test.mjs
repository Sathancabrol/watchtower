// src/tuilesMath.test.mjs — projection des tuiles de la minicarte (pur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RES_Z0,
  TUILE,
  canvasVersLonLat,
  indexTuile,
  latVersPxMonde,
  lonVersPxMonde,
  metresParPixel,
  mondePixels,
  porteeSelonAltitude,
  pxMondeVersLat,
  pxMondeVersLon,
  tuilesParAxe,
  tuilesVisibles,
  zoomPourMetresParPixel,
} from './tuilesMath.js';

test('aller-retour pixel monde ↔ lon/lat', () => {
  for (const [lon, lat] of [[0, 0], [3.69, 43.4], [-122.4, 37.77], [151.2, -33.87]]) {
    const z = 12;
    const x = lonVersPxMonde(lon, z);
    const y = latVersPxMonde(lat, z);
    assert.ok(Math.abs(pxMondeVersLon(x, z) - lon) < 1e-6, `lon ${lon}`);
    assert.ok(Math.abs(pxMondeVersLat(y, z) - lat) < 1e-6, `lat ${lat}`);
  }
  // les pôles sont bornés (pas de division par zéro en Mercator)
  assert.ok(Number.isFinite(latVersPxMonde(90, 10)));
  assert.ok(Number.isFinite(latVersPxMonde(-90, 10)));
});

test('mondePixels et tuilesParAxe : puissances de deux', () => {
  assert.equal(mondePixels(0), 256);
  assert.equal(mondePixels(3), 2048);
  assert.equal(tuilesParAxe(3), 8);
  assert.equal(mondePixels(5) / TUILE, tuilesParAxe(5));
});

test('metresParPixel : la résolution double à chaque zoom', () => {
  assert.ok(Math.abs(metresParPixel(0, 0) - RES_Z0) < 1e-3);
  assert.ok(Math.abs(metresParPixel(1, 0) * 2 - metresParPixel(0, 0)) < 1e-9);
  // à 43°N la résolution est réduite par le cosinus de la latitude
  const rapport = metresParPixel(10, 43.4) / metresParPixel(10, 0);
  assert.ok(Math.abs(rapport - Math.cos(43.4 * Math.PI / 180)) < 1e-9);
});

test('zoomPourMetresParPixel : cohérent avec metresParPixel et borné', () => {
  for (const lat of [0, 43.4, 64]) {
    for (const z of [3, 8, 14, 17]) {
      const zz = zoomPourMetresParPixel(metresParPixel(z, lat), lat);
      assert.equal(zz, z, `zoom ${z} retrouvé à ${lat}°N`);
    }
  }
  assert.equal(zoomPourMetresParPixel(1e9, 0), 2, 'borné bas');
  assert.equal(zoomPourMetresParPixel(1e-9, 0), 19, 'borné haut');
  assert.ok(zoomPourMetresParPixel(100, 0) > zoomPourMetresParPixel(10, 0) === false);
});

test('indexTuile : le centre de la carte est au milieu de la grille', () => {
  assert.deepEqual(indexTuile(0, 0, 1), { x: 1, y: 1 });
  assert.deepEqual(indexTuile(0, 0, 0), { x: 0, y: 0 });
  const z = 14;
  const t = indexTuile(3.6908, 43.4005, z);
  assert.ok(t.x >= 0 && t.x < tuilesParAxe(z));
  assert.ok(t.y >= 0 && t.y < tuilesParAxe(z));
});

test('tuilesVisibles : couvre le canvas et reste borné', () => {
  const largeur = 216;
  const hauteur = 150;
  const lat = 43.4;
  const mpp = 12; // 12 m par pixel → ~2,6 km de large
  const z = zoomPourMetresParPixel(mpp, lat);
  const tuiles = tuilesVisibles({ lon: 3.69, lat, mpp, largeur, hauteur, z });
  assert.ok(tuiles.length > 0);
  assert.ok(tuiles.length <= 64, `peu de tuiles pour un petit canvas (${tuiles.length})`);
  for (const t of tuiles) {
    assert.ok(Number.isFinite(t.dx) && Number.isFinite(t.dy) && t.taille > 0);
    assert.ok(t.dx + t.taille > 0 && t.dx < largeur, 'tuile à l’horizontale du canvas');
    assert.ok(t.dy + t.taille > 0 && t.dy < hauteur, 'tuile à la verticale du canvas');
    assert.ok(t.x >= 0 && t.x < tuilesParAxe(z), 'x valide');
    assert.ok(t.y >= 0 && t.y < tuilesParAxe(z), 'y valide');
  }
  // le pixel central du canvas appartient à l’une des tuiles demandées
  const centre = tuilesVisibles({ lon: 0, lat: 0, mpp, largeur, hauteur, z: 10 });
  const auCentre = centre.find((t) => t.dx <= largeur / 2 && t.dx + t.taille >= largeur / 2
    && t.dy <= hauteur / 2 && t.dy + t.taille >= hauteur / 2);
  assert.ok(auCentre, 'une tuile couvre le centre du canvas');
});

test('tuilesVisibles : dézoomer couvre plus de surface avec moins de tuiles', () => {
  const largeur = 216;
  const hauteur = 150;
  const proche = tuilesVisibles({ lon: 3.69, lat: 43.4, mpp: 2, largeur, hauteur, z: zoomPourMetresParPixel(2, 43.4) });
  const large = tuilesVisibles({ lon: 3.69, lat: 43.4, mpp: 200, largeur, hauteur, z: zoomPourMetresParPixel(200, 43.4) });
  assert.ok(large.length <= proche.length, 'petite échelle = moins de tuiles à dessiner');
  for (const t of large) {
    assert.ok(t.y >= 0 && t.y < tuilesParAxe(zoomPourMetresParPixel(200, 43.4)), 'pas de tuile hors grille');
  }
});

test('canvasVersLonLat : le centre du canvas rend le centre demandé', () => {
  const p = { lon: 3.69, lat: 43.4, mpp: 12, largeur: 216, hauteur: 150, z: 14 };
  const centre = canvasVersLonLat({ px: p.largeur / 2, py: p.hauteur / 2, ...p });
  assert.ok(Math.abs(centre.lon - 3.69) < 1e-6);
  assert.ok(Math.abs(centre.lat - 43.4) < 1e-6);
  const haut = canvasVersLonLat({ px: p.largeur / 2, py: 0, ...p });
  assert.ok(haut.lat > centre.lat, 'le haut du canvas est au nord');
  const droite = canvasVersLonLat({ px: p.largeur, py: p.hauteur / 2, ...p });
  assert.ok(droite.lon > centre.lon, 'la droite du canvas est à l’est');
});

test('porteeSelonAltitude : croissante, plancher à 700 m', () => {
  assert.equal(porteeSelonAltitude(0), 700);
  assert.equal(porteeSelonAltitude(200), 700);
  assert.ok(porteeSelonAltitude(1000) > porteeSelonAltitude(500));
  assert.ok(Math.abs(porteeSelonAltitude(2000) - 3800) < 1, '1,9 × l’altitude au-dessus de 200 m');
  assert.equal(porteeSelonAltitude(undefined), 1900, 'valeur par défaut 1000 m');
});
