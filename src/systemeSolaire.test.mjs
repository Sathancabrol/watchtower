// src/systemeSolaire.test.mjs — positions réelles (JPL / ELP2000), partie pure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ELEMENTS,
  ORDRE,
  anomalieExcentrique,
  ecliptiqueVersEquatorial,
  etiquetteDistance,
  gmst,
  inertielVersFixe,
  positionGeocentrique,
  positionHeliocentrique,
  positionLune,
  rayonAffiche,
  rayonSphere,
  sieclesDepuisJ2000,
} from './systemeSolaire.js';

const J2000 = new Date('2000-01-01T12:00:00Z');

test('siècles juliens : 0 à l’époque J2000, ~0,26 un quart de siècle plus tard', () => {
  assert.ok(Math.abs(sieclesDepuisJ2000(J2000)) < 1e-9);
  const t = sieclesDepuisJ2000(new Date('2025-03-01T12:00:00Z'));
  assert.ok(t > 0.24 && t < 0.27, `T=${t}`);
});

test('équation de Kepler : solution vérifiée sur toute la plage', () => {
  for (const e of [0, 0.0167, 0.0934, 0.2056, 0.5]) {
    for (let M = -3.1; M < 3.15; M += 0.37) {
      const E = anomalieExcentrique(M, e);
      // E - e·sinE doit valoir M
      assert.ok(Math.abs((E - e * Math.sin(E)) - M) < 1e-10, `e=${e} M=${M}`);
    }
  }
});

test('Temps sidéral de Greenwich vaut 280,4606° à l’époque J2000', () => {
  const g = (gmst(J2000) * 180) / Math.PI;
  assert.ok(Math.abs(g - 280.46061837) < 1e-6, `gmst=${g}`);
});

test('la Terre est proche de son périhélie début janvier (~0,983 UA)', () => {
  const t = positionHeliocentrique('terre', J2000);
  assert.ok(Math.abs(t.distance - 0.9833) < 0.002, `r=${t.distance}`);
});

test('distances héliocentriques conformes aux valeurs connues (UA)', () => {
  const attendu = {
    mercure: [0.307, 0.467],
    venus: [0.718, 0.728],
    mars: [1.381, 1.666],
    jupiter: [4.95, 5.46],
    saturne: [9.02, 10.05],
    uranus: [18.3, 20.1],
    neptune: [29.8, 30.4],
  };
  for (const [nom, [min, max]] of Object.entries(attendu)) {
    const r = positionHeliocentrique(nom, J2000).distance;
    assert.ok(r >= min && r <= max, `${nom} r=${r} hors [${min}, ${max}]`);
  }
});

test('la longitude héliocentrique de la Terre est ~100,46° à J2000', () => {
  const t = positionHeliocentrique('terre', J2000);
  let lon = (Math.atan2(t.y, t.x) * 180) / Math.PI;
  if (lon < 0) lon += 360;
  // longitude moyenne L = 100,46° ; l’équation du centre retire ~0,08°
  assert.ok(Math.abs(lon - 100.38) < 0.1, `lon=${lon}`);
});

test('position géocentrique : Mars entre 0,37 et 2,52 UA', () => {
  for (let j = 0; j < 40; j += 1) {
    const d = new Date(Date.UTC(2020, 0, 1 + j * 40));
    const g = positionGeocentrique('mars', d);
    assert.ok(g.distance > 0.36 && g.distance < 2.68, `mars r=${g.distance}`);
  }
});

test('position géocentrique : Vénus ne dépasse jamais ~1,73 UA', () => {
  for (let j = 0; j < 24; j += 1) {
    const g = positionGeocentrique('venus', new Date(Date.UTC(2021, j, 15)));
    assert.ok(g.distance > 0.25 && g.distance < 1.74, `venus r=${g.distance}`);
  }
});

test('les planètes extérieures s’éloignent quand on s’en approche (cohérence)', () => {
  const jup = ORDRE.map(() => 0);
  void jup;
  const a = positionGeocentrique('jupiter', new Date(Date.UTC(2022, 0, 1)));
  const b = positionGeocentrique('jupiter', new Date(Date.UTC(2022, 6, 1)));
  // opposition ~ sept-oct 2022 : la distance doit baisser entre janvier et juillet
  assert.ok(b.distance < a.distance, `${b.distance} < ${a.distance}`);
});

test('Lune : distance réaliste et phase comprise entre 0 et 1', () => {
  let minD = Infinity; let maxD = 0;
  for (let j = 0; j < 60; j += 1) {
    const l = positionLune(new Date(Date.UTC(2024, 0, 1 + j * 3)));
    assert.ok(l.distance > 356_000 && l.distance < 407_000, `dist=${l.distance}`);
    assert.ok(l.phase >= 0 && l.phase <= 1, `phase=${l.phase}`);
    minD = Math.min(minD, l.distance);
    maxD = Math.max(maxD, l.distance);
  }
  assert.ok(maxD - minD > 20_000, 'la distance lunaire doit varier (ellipse)');
});

test('conversion écliptique → équatoriale : l’obliquité est appliquée', () => {
  // un point sur l’équateur écliptique à longitude 0 reste à longitude 0
  const v = ecliptiqueVersEquatorial({ x: 1, y: 0, z: 0 });
  assert.equal(v.x, 1);
  assert.equal(v.y, 0);
  assert.equal(v.z, 0);
  // un point au pôle nord écliptique bascule de 23,44°
  const p = ecliptiqueVersEquatorial({ x: 0, y: 0, z: 1 });
  const decl = (Math.asin(p.z / Math.hypot(p.x, p.y, p.z)) * 180) / Math.PI;
  assert.ok(Math.abs(decl - (90 - 23.4393)) < 0.01, `decl=${decl}`);
});

test('inertiel → fixe : rotation pure (norme conservée, angle = GMST)', () => {
  const d = new Date('2024-05-12T18:30:00Z');
  const v = { x: 1, y: 0, z: 0 };
  const f = inertielVersFixe(v, d);
  assert.ok(Math.abs(Math.hypot(f.x, f.y, f.z) - 1) < 1e-12, 'norme conservée');
  const g = gmst(d);
  assert.ok(Math.abs(f.x - Math.cos(g)) < 1e-12);
  assert.ok(Math.abs(f.y + Math.sin(g)) < 1e-12);
  assert.equal(f.z, 0);
});

test('échelle d’affichage : croissante, compressée, au-delà du rayon terrestre', () => {
  const mercure = rayonAffiche(0.387);
  const jupiter = rayonAffiche(5.203);
  const neptune = rayonAffiche(30.07);
  assert.ok(mercure > 6_371_000, `mercure=${mercure} doit dépasser le rayon terrestre`);
  assert.ok(mercure < jupiter && jupiter < neptune, 'ordre croissant');
  assert.ok(neptune / mercure < 8, 'compression logarithmique (rapport < 8)');
  // doublement de l’échelle = doublement des distances
  assert.ok(Math.abs(rayonAffiche(5.203, 2) - 2 * jupiter) < 1);
});

test('rayon affiché des sphères : Jupiter nettement plus grosse que Mercure', () => {
  const m = rayonSphere(ELEMENTS.mercure.rayon);
  const j = rayonSphere(ELEMENTS.jupiter.rayon);
  assert.ok(j > m * 3, `${j} vs ${m}`);
  assert.ok(m > 100_000, 'visible depuis l’orbite');
});

test('étiquettes de distance lisibles', () => {
  // les espaces de milliers sont insécables selon l’ICU : on normalise
  const norm = (s) => s.replace(/[\u202f\u00a0\s]/g, ' ');
  assert.equal(norm(etiquetteDistance(384_400_000)), '384 400 km');
  assert.equal(etiquetteDistance(778_500_000_000), '5.20 UA');
  assert.equal(etiquetteDistance(1500), '2 km');
  assert.equal(etiquetteDistance(420), '420 m');
});

test('les 8 planètes sont décrites, la Terre sert de référence', () => {
  assert.equal(Object.keys(ELEMENTS).length, 8);
  assert.ok(ELEMENTS.terre, 'la Terre est nécessaire au calcul géocentrique');
  assert.equal(ORDRE.length, 7, 'les 7 autres planètes sont affichées autour de la Terre');
  for (const n of ORDRE) {
    assert.ok(ELEMENTS[n]?.a?.[0] > 0, `${n} a un demi-grand axe`);
    assert.ok(ELEMENTS[n].couleur.startsWith('#'), `${n} a une couleur`);
  }
});

test('position inconnue → null (pas d’exception)', () => {
  assert.equal(positionHeliocentrique('pluton', J2000), null);
  assert.equal(positionGeocentrique('pluton', J2000), null);
});
