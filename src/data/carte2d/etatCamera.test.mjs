import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TAILLE_TUILE, CIRCONFERENCE_TERRE, ZOOM_MAX, borner, normaliserLongitude, normaliserCap,
  resolutionAuSol, hauteurVersZoom, zoomVersHauteur, etatNeutre,
  versMapLibre, depuisMapLibre, conseillerBascule2D,
} from './etatCamera.js';

test('borner resiste aux valeurs non finies', () => {
  assert.equal(borner(5, 0, 10), 5);
  assert.equal(borner(-3, 0, 10), 0);
  assert.equal(borner(99, 0, 10), 10);
  for (const x of [NaN, Infinity, undefined, null, 'abc']) assert.equal(borner(x, 2, 8), 2);
});

test('normaliserLongitude replie le tour du monde', () => {
  assert.equal(normaliserLongitude(3.7493), 3.7493);
  assert.equal(normaliserLongitude(181), -179);
  assert.equal(normaliserLongitude(-181), 179);
  assert.equal(normaliserLongitude(720), 0);
  assert.equal(normaliserLongitude(NaN), 0);
  assert.ok(!Object.is(normaliserLongitude(-360), -0), 'pas de zero negatif');
});

test('normaliserCap ramene dans [0,360[', () => {
  assert.equal(normaliserCap(0), 0);
  assert.equal(normaliserCap(370), 10);
  assert.equal(normaliserCap(-90), 270);
  assert.equal(normaliserCap(NaN), 0);
});

test('la resolution au sol suit la formule Web Mercator', () => {
  // A l equateur, zoom 0, tuiles de 512 px.
  const attendu = CIRCONFERENCE_TERRE / TAILLE_TUILE;
  assert.ok(Math.abs(resolutionAuSol(0, 0) - attendu) < 1e-6);
  // Chaque niveau de zoom divise la resolution par deux.
  assert.ok(Math.abs(resolutionAuSol(1, 0) - attendu / 2) < 1e-6);
});

test('la latitude change la resolution — le piege du facteur cos(phi)', () => {
  const equateur = resolutionAuSol(12, 0);
  const sete = resolutionAuSol(12, 43.4);
  assert.ok(sete < equateur, 'a zoom egal, un pixel couvre moins de terrain vers le nord');
  const rapport = sete / equateur;
  const cosPhi = Math.cos((43.4 * Math.PI) / 180);
  assert.ok(Math.abs(rapport - cosPhi) < 1e-9, `le rapport vaut cos(43,4°) ≈ ${cosPhi.toFixed(3)}`);
});

test('hauteur et zoom sont reciproques a toute latitude', () => {
  for (const lat of [0, 43.4486, -33.9, 60, -70]) {
    for (const h of [150, 1_000, 25_000, 500_000, 8_000_000]) {
      const z = hauteurVersZoom(h, lat);
      if (z >= ZOOM_MAX || z <= 0) continue; // bornes saturees : reciprocite non garantie
      const retour = zoomVersHauteur(z, lat);
      const ecart = Math.abs(retour - h) / h;
      assert.ok(ecart < 1e-9, `lat ${lat}, h ${h} : ecart relatif ${ecart}`);
    }
  }
});

test('monter en altitude fait baisser le zoom', () => {
  const bas = hauteurVersZoom(500, 43.4);
  const haut = hauteurVersZoom(500_000, 43.4);
  assert.ok(bas > haut, 'plus haut = plus dezoome');
  assert.ok(bas <= ZOOM_MAX && haut >= 0);
});

test('les hauteurs aberrantes ne cassent pas la conversion', () => {
  for (const h of [0, -100, NaN, Infinity, undefined]) {
    const z = hauteurVersZoom(h, 43.4);
    assert.ok(Number.isFinite(z) && z >= 0 && z <= ZOOM_MAX, `h=${h} => zoom sain (${z})`);
  }
  assert.ok(zoomVersHauteur(10, 43.4, 0) > 0, 'canevas de hauteur nulle tolere');
});

test('etatNeutre borne la latitude a la limite Mercator', () => {
  assert.ok(Math.abs(etatNeutre({ lat: 89 }).lat - 85.051129) < 1e-6);
  assert.ok(Math.abs(etatNeutre({ lat: -89 }).lat + 85.051129) < 1e-6);
  const d = etatNeutre({});
  assert.equal(d.lon, 0);
  assert.equal(d.hauteurM, 1000, 'hauteur par defaut exploitable');
  assert.equal(etatNeutre({ hauteurM: -5 }).hauteurM, 1000, 'hauteur negative rejetee');
});

test('versMapLibre produit une vue acceptee par MapLibre', () => {
  const v = versMapLibre({ lon: 3.7493, lat: 43.4486, hauteurM: 2000, capDeg: 45, tangageDeg: -60 });
  assert.deepEqual(v.center, [3.7493, 43.4486]);
  assert.equal(v.bearing, 45);
  assert.ok(v.pitch >= 0 && v.pitch <= 60, 'MapLibre plafonne le pitch a 60°');
  assert.ok(v.zoom > 0 && v.zoom <= ZOOM_MAX);
});

test('un tangage extreme reste dans les clous', () => {
  for (const t of [-90, 0, 90, -180, 200, NaN]) {
    const v = versMapLibre({ lon: 0, lat: 0, hauteurM: 1000, tangageDeg: t });
    assert.ok(v.pitch >= 0 && v.pitch <= 60, `tangage ${t} => pitch ${v.pitch}`);
  }
});

test('le nadir Cesium donne une carte a plat', () => {
  assert.equal(versMapLibre({ lon: 0, lat: 0, hauteurM: 1000, tangageDeg: -90 }).pitch, 0);
});

test('depuisMapLibre accepte les deux formes de centre', () => {
  const tableau = depuisMapLibre({ center: [3.75, 43.45], zoom: 12, bearing: 30, pitch: 45 });
  const objet = depuisMapLibre({ center: { lng: 3.75, lat: 43.45 }, zoom: 12, bearing: 30, pitch: 45 });
  assert.deepEqual(tableau, objet, 'tableau et {lng,lat} equivalents');
  assert.equal(tableau.capDeg, 30);
});

test('ALLER-RETOUR 3D -> 2D -> 3D sans derive', () => {
  // Le test qui compte : basculer puis revenir doit rendre la meme vue.
  const depart = etatNeutre({ lon: 3.7493, lat: 43.4486, hauteurM: 3500, capDeg: 137, tangageDeg: -42 });
  const retour = depuisMapLibre(versMapLibre(depart));
  assert.ok(Math.abs(retour.lon - depart.lon) < 1e-9, 'longitude conservee');
  assert.ok(Math.abs(retour.lat - depart.lat) < 1e-9, 'latitude conservee');
  assert.ok(Math.abs(retour.capDeg - depart.capDeg) < 1e-9, 'cap conserve');
  assert.ok(Math.abs(retour.hauteurM - depart.hauteurM) / depart.hauteurM < 1e-9, 'altitude conservee');
  assert.ok(Math.abs(retour.tangageDeg - depart.tangageDeg) < 1e-9, 'tangage conserve');
});

test('l aller-retour tient sur les 9 communes du bassin de Thau', () => {
  for (const lat of [43.4486, 43.3844, 43.4476, 43.465, 43.445, 43.4509, 43.4323, 43.3543, 43.3084]) {
    const depart = etatNeutre({ lon: 3.6, lat, hauteurM: 1200, capDeg: 90, tangageDeg: -45 });
    const retour = depuisMapLibre(versMapLibre(depart));
    assert.ok(Math.abs(retour.hauteurM - depart.hauteurM) / depart.hauteurM < 1e-9, `lat ${lat}`);
    assert.ok(Math.abs(retour.lat - depart.lat) < 1e-9, `lat ${lat} conservee`);
  }
});

test('conseillerBascule2D bascule quand le GPU souffre', () => {
  const d = conseillerBascule2D({ hauteurM: 1000, tangageDeg: -30 }, { fpsMoyen: 12 });
  assert.equal(d.basculer, true);
  assert.match(d.raison, /i\/s/, 'la raison chiffre la mesure');
});

test('conseillerBascule2D bascule au nadir et en orbite', () => {
  assert.equal(conseillerBascule2D({ hauteurM: 800, tangageDeg: -88 }).basculer, true);
  assert.equal(conseillerBascule2D({ hauteurM: 21_000_000, tangageDeg: -30 }).basculer, true);
});

test('conseillerBascule2D laisse la 3D quand elle sert', () => {
  const d = conseillerBascule2D({ hauteurM: 800, tangageDeg: -35 }, { fpsMoyen: 58 });
  assert.equal(d.basculer, false);
  assert.match(d.raison, /3D/);
});

test('conseillerBascule2D reste sur — jamais d exception', () => {
  for (const e of [null, undefined, {}, { hauteurM: NaN }]) {
    const d = conseillerBascule2D(e, {});
    assert.equal(typeof d.basculer, 'boolean');
    assert.ok(d.raison.length > 0);
  }
});
