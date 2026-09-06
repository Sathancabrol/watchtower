// src/data/volParcours.test.mjs — parcours de vol (préréglages, rejeu).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAUTS, PRESETS, altitudes, cumulees, distance3d, duree, echantillonner,
  generer, longueur, metresEnDegres, nettoyer, positionA, resumer, simplifier,
} from './volParcours.js';

const CENTRE = { lon: 3.7586, lat: 43.4483 }; // Frontignan

/** Distance AU SOL (on ignore l'altitude) — pour mesurer un rayon de cercle. */
function sol2d(a = {}, b = {}) {
  const { dLat, dLon } = metresEnDegres((Number(a.lat) + Number(b.lat)) / 2);
  const dx = (Number(b.lon) - Number(a.lon)) / dLon;
  const dy = (Number(b.lat) - Number(a.lat)) / dLat;
  return Math.hypot(dx, dy);
}

test('les préréglages couvrent les usages demandés', () => {
  const cles = PRESETS.map((p) => p.cle);
  for (const c of ['orbite', 'balayage', 'spirale', 'approche', 'navette']) assert.ok(cles.includes(c), c);
  for (const p of PRESETS) assert.ok(p.nom && p.aide && p.ic, `${p.cle} complet`);
});

test('orbite : un cercle centré, fermé, à l’altitude demandée', () => {
  const p = generer('orbite', CENTRE, { rayon: 600, altitude: 260, points: 48, tours: 1 });
  assert.equal(p.length, 49, 'point de fermeture inclus');
  const distances = p.map((x) => sol2d(CENTRE, x));
  const min = Math.min(...distances); const max = Math.max(...distances);
  assert.ok(Math.abs(max - 600) < 25 && Math.abs(min - 600) < 25, `rayon constant : ${min} → ${max}`);
  for (const x of p) assert.equal(x.alt, 260);
  assert.ok(distance3d(p[0], p[p.length - 1]) < 1, 'le tour se referme');
  assert.equal(generer('orbite', CENTRE, { tours: 3 }).length > p.length, true, '3 tours = 3× plus de points');
});

test('balayage : la zone est ratissée en allers-retours', () => {
  const p = generer('balayage', CENTRE, { largeur: 900, hauteur: 900, lignes: 4, points: 20, altitude: 200 });
  assert.ok(p.length >= 4 * 10);
  const lats = p.map((x) => x.lat);
  const etendue = (Math.max(...lats) - Math.min(...lats)) / metresEnDegres(CENTRE.lat).dLat;
  assert.ok(Math.abs(etendue - 900) < 40, `profondeur couverte : ${Math.round(etendue)} m`);
  // le sens alterne : la première ligne finit à l'est, la deuxième revient
  assert.ok(p[9].lon > p[0].lon, 'ligne 1 vers l’est');
  assert.ok(p[19].lon < p[10].lon, 'ligne 2 revient vers l’ouest');
});

test('spirale : on descend en tournant', () => {
  const p = generer('spirale', CENTRE, { rayon: 500, altitude: 300, tours: 2 });
  assert.ok(p.length > 20);
  assert.ok(p[0].alt > p[p.length - 1].alt, 'altitude décroissante');
  assert.ok(sol2d(CENTRE, p[0]) > sol2d(CENTRE, p[p.length - 1]), 'rayon décroissant');
});

test('approche : on arrive de loin et on atterrit', () => {
  const p = generer('approche', CENTRE, { rayon: 2000, altitude: 400, points: 20 });
  assert.ok(sol2d(CENTRE, p[0]) > 1500, 'on part de loin');
  assert.ok(sol2d(CENTRE, p[p.length - 1]) < 5, 'on arrive sur le point');
  assert.ok(p[p.length - 1].alt < 12, 'on se pose');
});

test('navette : aller-retour entre deux points', () => {
  const d = { lon: 3.88, lat: 43.61 }; // Montpellier
  const p = generer('navette', CENTRE, { destination: d, points: 30, altitude: 500 });
  assert.ok(p.length >= 30);
  const milieu = p[Math.floor(p.length / 2)];
  assert.ok(distance3d(milieu, { ...d, alt: 500 }) < 1500, 'le milieu du parcours est à destination');
  assert.ok(sol2d(p[0], CENTRE) < 5, 'on part du centre');
  assert.ok(sol2d(p[p.length - 1], CENTRE) < 5, 'et on revient');
  assert.deepEqual(generer('navette', CENTRE, {}), [], 'sans destination : rien');
});

test('entrées invalides : jamais d’erreur, jamais de point NaN', () => {
  for (const c of [null, {}, { lon: 0, lat: 0 }, { lon: 'x', lat: 'y' }]) {
    const p = generer('orbite', c, {});
    assert.ok(Array.isArray(p));
    for (const x of p) assert.ok(Number.isFinite(x.lon) && Number.isFinite(x.lat) && Number.isFinite(x.alt));
  }
  assert.deepEqual(generer('inconnu', null), []);
  assert.equal(generer('orbite', { lon: 3, lat: 43 }).length > 0, true);
});

test('longueur, durée et altitudes', () => {
  const p = generer('orbite', CENTRE, { rayon: 600, points: 72 });
  const l = longueur(p);
  assert.ok(Math.abs(l - 2 * Math.PI * 600) < 40, `circonférence ≈ 3 770 m : ${Math.round(l)}`);
  assert.equal(Math.round(duree(p, 30)), Math.round(l / 30));
  assert.equal(duree(p, 0), l / 1, 'vitesse nulle → garde-fou (1 m/s)');
  const a = altitudes(p);
  assert.equal(a.min, DEFAUTS.altitude);
  assert.equal(a.max, DEFAUTS.altitude);
  assert.deepEqual(altitudes([]), { min: 0, max: 0 });
  assert.equal(longueur([]), 0);
  assert.equal(longueur([CENTRE]), 0);
});

test('échantillonnage : aucun trou plus grand que le pas', () => {
  const brut = generer('navette', CENTRE, { destination: { lon: 3.88, lat: 43.61 }, points: 4 });
  const fin = echantillonner(brut, 500);
  assert.ok(fin.length > brut.length, 'on a densifié');
  for (let i = 1; i < fin.length; i += 1) {
    assert.ok(distance3d(fin[i - 1], fin[i]) <= 520, 'pas respecté');
  }
  assert.deepEqual(echantillonner([], 10), []);
  assert.deepEqual(echantillonner([{ lon: 1, lat: 2, alt: 3 }], 10), [{ lon: 1, lat: 2, alt: 3 }]);
});

test('positionA : avancement 0 → début, 1 → fin, et cap cohérent', () => {
  const p = generer('navette', CENTRE, { destination: { lon: 3.88, lat: 43.61 }, points: 40 });
  const c = cumulees(p);
  const debut = positionA(p, 0, c);
  const fin = positionA(p, 1, c);
  const demi = positionA(p, 0.5, c);
  assert.ok(distance3d(debut, p[0]) < 1, 'on part du premier point');
  assert.ok(distance3d(fin, p[p.length - 1]) < 1, 'on finit au dernier');
  assert.equal(debut.avancement, 0);
  assert.equal(fin.avancement, 1);
  assert.ok(Math.abs(demi.avancement - 0.5) < 1e-9);
  // à l’aller vers le nord-est, le cap est compris entre 0 et 90°
  const quart = positionA(p, 0.25, c);
  assert.ok(quart.cap > 0 && quart.cap < Math.PI / 2, `cap aller : ${quart.cap}`);
  // valeurs hors bornes : on reste sur le parcours
  assert.equal(positionA(p, 5, c).avancement, 1);
  assert.equal(positionA(p, -3, c).avancement, 0);
  assert.equal(positionA([], 0.5).lon, 0);
  const seul = [{ lon: 3, lat: 43, alt: 10 }];
  assert.equal(positionA(seul, 0.4).alt, 10, 'un seul point : on ne bouge pas');
});

test('cumulées : croissantes, et le total = la longueur', () => {
  const p = generer('orbite', CENTRE, { points: 24 });
  const c = cumulees(p);
  assert.equal(c[0], 0);
  for (let i = 1; i < c.length; i += 1) assert.ok(c[i] >= c[i - 1], 'croissant');
  assert.ok(Math.abs(c[c.length - 1] - longueur(p)) < 1e-6);
});

test('nettoyer et simplifier un vol réellement enregistré', () => {
  const brut = [
    { lon: 3.75, lat: 43.44, alt: 100 },
    { lon: 3.75, lat: 43.44, alt: 100 },       // doublon
    { lon: NaN, lat: 43.44, alt: 100 },         // invalide
    { lon: 3.75001, lat: 43.44, alt: 100 },     // ~1 m
    { lon: 3.752, lat: 43.44, alt: 120 },       // loin
    { lon: 3.753, lat: 43.44, alt: 130 },
  ];
  const net = nettoyer(brut);
  assert.equal(net.length, 4, 'doublon et invalide retirés');
  const simple = simplifier(brut, 40);
  assert.ok(simple.length < net.length, 'le vol réel est allégé');
  assert.ok(distance3d(simple[0], net[0]) < 1, 'le départ est conservé');
  assert.ok(distance3d(simple[simple.length - 1], net[net.length - 1]) < 1, 'l’arrivée aussi');
  assert.deepEqual(nettoyer([]), []);
  assert.deepEqual(simplifier([]), []);
});

test('résumé lisible d’un parcours', () => {
  const p = generer('orbite', CENTRE, { rayon: 600, points: 72, altitude: 260 });
  const r = resumer(p, 20);
  assert.ok(r.points > 0 && r.longueur > 3000 && r.duree > 100);
  assert.equal(r.altMin, 260);
  assert.equal(r.altMax, 260);
  assert.equal(resumer([], 20).points, 0);
});

test('conversion mètres ↔ degrés', () => {
  const { dLat, dLon } = metresEnDegres(43.45);
  assert.ok(Math.abs(1 / dLat - 111_320) < 500, 'un degré de latitude ≈ 111 km');
  assert.ok(dLon > dLat, 'à cette latitude, un degré de longitude couvre moins de mètres');
  assert.ok(metresEnDegres(0).dLon > 0, 'à l’équateur aussi');
});
