import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POLES, ACCES_TERRE, ACCES_AIR, ACCES_MER, ACCES_FLUVIAL, LEVEES_PERIMEES,
  leveesPourMois, accesAVerifier,
} from './accesTerritoire.js';

test('la commune compte trois poles', () => {
  assert.equal(POLES.length, 3);
});

test('les horaires perimes du pont ne sont plus servis', () => {
  const toutes = ACCES_FLUVIAL.levees.flatMap((l) => l.heures);
  for (const perime of LEVEES_PERIMEES) {
    assert.ok(!toutes.includes(perime),
      `${perime} date d avant la reparation du pont (11/12/2025) : la 1re levee est a 09:30`);
  }
  assert.ok(toutes.includes('09:30'), 'la levee du matin actuelle est bien presente');
});

test('l ete ajoute une troisieme levee', () => {
  assert.equal(leveesPourMois(7).heures.length, 3);
  assert.equal(leveesPourMois(8).heures.length, 3);
  assert.equal(leveesPourMois(5).heures.length, 2);
});

test('l hiver impose le rendez-vous', () => {
  const hiver = leveesPourMois(1);
  assert.equal(hiver.surRendezVous, true, 'sans reservation, pas de levee');
  assert.equal(hiver.heures.length, 1);
  assert.ok(hiver.note.includes('06 87 74 18 16'), 'le contact est porte par la donnee');
  assert.equal(leveesPourMois(6).surRendezVous, false);
});

test('novembre est a cheval : la fonction retient le regime hivernal', () => {
  // Le 1er au 10 novembre releve encore du regime 9h30+16h ; du 11 au 30, du
  // regime hivernal sur rendez-vous. A la maille du mois, on retient le plus
  // contraignant : mieux vaut reserver pour rien que rater la levee.
  assert.equal(leveesPourMois(11).surRendezVous, true);
});

test('un mois invalide ne leve pas d exception', () => {
  for (const v of [0, 13, null, undefined, 'mars', NaN]) {
    assert.equal(leveesPourMois(v), null);
  }
});

test('les contraintes nautiques sont portees par la donnee', () => {
  assert.equal(ACCES_MER.tirantEauM, 2.5);
  assert.ok(ACCES_MER.deconseille.includes('sud-est'));
  assert.equal(ACCES_MER.orientationPasse, 'sud-ouest');
  assert.ok(ACCES_FLUVIAL.tirantAirM > 0 && ACCES_FLUVIAL.mouillageM > 0);
});

test('l amarrage fluvial est gratuit et borne dans le temps', () => {
  assert.equal(ACCES_FLUVIAL.amarrageGratuit, true);
  assert.equal(ACCES_FLUVIAL.escaleMaxHeures, 72);
  assert.equal(ACCES_FLUVIAL.postesAmarrage, 30);
});

test('les acces incertains sont signales, pas masques', () => {
  const douteux = accesAVerifier();
  assert.ok(douteux.length >= 4);
  for (const d of douteux) assert.equal(d.fiable, false);
  const gare = ACCES_TERRE.find((a) => a.mode === 'train');
  assert.equal(gare.fiable, true);
});

test('les aeroports sont ordonnes par distance croissante', () => {
  const km = ACCES_AIR.map((a) => a.km);
  assert.deepEqual(km, [...km].sort((a, b) => a - b));
});
