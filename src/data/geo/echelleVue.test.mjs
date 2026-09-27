import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ECHELONS, TERRES, MERS,
  echelleSelonAltitude, echelonDemandeUneCommune, oceanDeReplique, zoneMondiale,
} from './echelleVue.js';

test('les echelons vont du plus large au plus fin, sans trou', () => {
  for (let i = 1; i < ECHELONS.length; i++) {
    assert.ok(ECHELONS[i].altMin < ECHELONS[i - 1].altMin,
      `${ECHELONS[i].cle} doit etre sous ${ECHELONS[i - 1].cle}`);
  }
  assert.equal(ECHELONS[ECHELONS.length - 1].altMin, 0, 'le dernier echelon doit tout rattraper');
});

test('l altitude choisit l echelon que l image montre vraiment', () => {
  assert.equal(echelleSelonAltitude(20_000_000).cle, 'espace');
  assert.equal(echelleSelonAltitude(3_000_000).cle, 'continent');
  assert.equal(echelleSelonAltitude(800_000).cle, 'pays');
  assert.equal(echelleSelonAltitude(200_000).cle, 'region');
  assert.equal(echelleSelonAltitude(50_000).cle, 'departement');
  assert.equal(echelleSelonAltitude(10_000).cle, 'commune');
  assert.equal(echelleSelonAltitude(500).cle, 'quartier');
});

test('une altitude absurde ne casse pas l echelle', () => {
  for (const mauvais of [undefined, null, NaN, -5, 'x', {}]) {
    assert.ok(echelleSelonAltitude(mauvais).cle, `${String(mauvais)} doit donner un echelon`);
  }
});

test('REGRESSION : a 500 km on ne va PAS chercher une commune', () => {
  // Le repere annoncait FRONTIGNAN - COMMUNE 34 avec la camera a 500 km.
  assert.equal(echelonDemandeUneCommune(echelleSelonAltitude(500_000).cle), false);
  assert.equal(echelonDemandeUneCommune(echelleSelonAltitude(3_000_000).cle), false);
  // ... mais on y va des que la commune remplit l image.
  assert.equal(echelonDemandeUneCommune(echelleSelonAltitude(10_000).cle), true);
  assert.equal(echelonDemandeUneCommune(echelleSelonAltitude(300).cle), true);
});

test('vue de l espace : le continent survole est nomme, hors ligne', () => {
  const cas = [
    [43.4, 3.7, 'Europe'],
    [48.85, 2.35, 'Europe'],
    [40, -100, 'Amérique du Nord'],
    [-23, -46, 'Amérique du Sud'],
    [-20, 140, 'Océanie'],
    [20, 70, 'Asie'],
    [-1, 36, 'Afrique'],
    [-75, 0, 'Antarctique'],
  ];
  for (const [lat, lon, attendu] of cas) {
    const z = zoneMondiale(lat, lon);
    assert.equal(z.type, 'continent', `${lat},${lon}`);
    assert.equal(z.nom, attendu, `${lat},${lon}`);
  }
});

test('au large, c est une mer ou un ocean — jamais un continent', () => {
  const cas = [
    [35, 18, 'Mer Méditerranée'],
    [43.5, 30, 'Mer Noire'],
    [0, -30, 'Océan Atlantique Nord'],
    [-30, -20, 'Océan Atlantique Sud'],
    [-30, 80, 'Océan Indien'],
    [20, -150, 'Océan Pacifique Nord'],
    [-20, -120, 'Océan Pacifique Sud'],
    [85, 10, 'Océan Arctique'],
  ];
  for (const [lat, lon, attendu] of cas) {
    const z = zoneMondiale(lat, lon);
    assert.notEqual(z.type, 'continent', `${lat},${lon} est en mer`);
    assert.equal(z.nom, attendu, `${lat},${lon}`);
  }
});

test('la cote mediterraneenne francaise reste l Europe, pas la mer', () => {
  // Sete / etang de Thau : le jeu d essai du projet.
  const z = zoneMondiale(43.4, 3.7);
  assert.equal(z.nom, 'Europe');
  assert.equal(z.precision, 'France');
});

test('Alger est en Afrique et non en Europe', () => {
  assert.equal(zoneMondiale(36.75, 3.05).nom, 'Afrique');
});

test('la longitude est repliee dans -180..180', () => {
  assert.deepEqual(zoneMondiale(-25, 133), zoneMondiale(-25, 133 + 360));
  assert.deepEqual(zoneMondiale(-25, 133), zoneMondiale(-25, 133 - 360));
});

test('une position illisible repond sans lever', () => {
  const z = zoneMondiale(NaN, undefined);
  assert.equal(typeof z.nom, 'string');
  assert.ok(z.nom.length > 0);
});

test('toute position de la planete recoit un nom', () => {
  for (let lat = -85; lat <= 85; lat += 5) {
    for (let lon = -175; lon <= 175; lon += 5) {
      const z = zoneMondiale(lat, lon);
      assert.ok(z.nom && z.nom.length > 1, `trou a ${lat},${lon}`);
      assert.ok(['continent', 'mer', 'ocean'].includes(z.type), `type inconnu a ${lat},${lon}`);
    }
  }
});

test('les boites de la base sont bien formees', () => {
  for (const b of [...TERRES, ...MERS]) {
    assert.ok(b[0] < b[1], `latitudes inversees : ${b}`);
    assert.ok(b[2] < b[3], `longitudes inversees : ${b}`);
    assert.ok(b[0] >= -90 && b[1] <= 90, `latitude hors bornes : ${b}`);
    assert.ok(b[2] >= -180 && b[3] <= 180, `longitude hors bornes : ${b}`);
  }
});

test('l ocean de repli couvre les deux hemispheres', () => {
  assert.match(oceanDeReplique(10, 0), /Atlantique Nord/);
  assert.match(oceanDeReplique(-10, 0), /Atlantique Sud/);
});
