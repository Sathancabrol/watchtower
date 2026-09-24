/**
 * Validation du calcul solaire contre les **valeurs de référence publiées
 * par SunCalc** (mêmes entrées, mêmes attendus). C'est le seul moyen sérieux
 * de vérifier une implémentation astronomique : sans référence externe, on ne
 * teste que sa propre erreur.
 *
 * Référence : 2013-03-05 UTC, lat 50.5, lon 30.5 (Kiev).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  positionSoleil, heuresSolaires, positionLune, illuminationLune,
  cardinal, longueurOmbre, qualiteLumiere, versJulien, depuisJulien,
} from './calculSolaire.js';

const DATE = new Date('2013-03-05T00:00:00Z');
const LAT = 50.5;
const LON = 30.5;

/** Écart en minutes entre une date calculée et un attendu ISO. */
const ecartMinutes = (obtenu, attenduISO) =>
  Math.abs(obtenu.getTime() - new Date(attenduISO).getTime()) / 60000;

test('positionSoleil reproduit la reference SunCalc', () => {
  const p = positionSoleil(DATE, LAT, LON);
  // SunCalc : azimuth -2.5003175907168385 rad DEPUIS LE SUD, altitude
  // -0.7000406838781611 rad. On convertit en degres depuis le nord.
  const azAttendu = (-2.5003175907168385 * 180 / Math.PI + 180 + 360) % 360;
  const hAttendue = -0.7000406838781611 * 180 / Math.PI;
  assert.ok(Math.abs(p.azimut - azAttendu) < 0.01, `azimut ${p.azimut} vs ${azAttendu}`);
  assert.ok(Math.abs(p.hauteur - hAttendue) < 0.01, `hauteur ${p.hauteur} vs ${hAttendue}`);
});

test('azimut compte depuis le nord, sens horaire', () => {
  // A midi solaire dans l'hemisphere nord, le soleil est plein SUD (~180).
  const h = heuresSolaires(DATE, LAT, LON);
  const p = positionSoleil(h.midiSolaire, LAT, LON);
  assert.ok(Math.abs(p.azimut - 180) < 1, `midi solaire => plein sud, vu ${p.azimut}`);
  assert.equal(cardinal(p.azimut), 'S');
});

test('heuresSolaires reproduit la reference SunCalc', () => {
  const t = heuresSolaires(DATE, LAT, LON);
  const attendus = {
    midiSolaire: '2013-03-05T10:10:57Z',
    minuitSolaire: '2013-03-04T22:10:57Z',
    lever: '2013-03-05T04:34:56Z',
    coucher: '2013-03-05T15:46:57Z',
    finLever: '2013-03-05T04:38:19Z',
    debutCoucher: '2013-03-05T15:43:34Z',
    aubeCivile: '2013-03-05T04:02:17Z',
    crepusculeCivil: '2013-03-05T16:19:36Z',
    aubeNautique: '2013-03-05T03:24:31Z',
    crepusculeNautique: '2013-03-05T16:57:22Z',
    aubeAstro: '2013-03-05T02:46:17Z',
    crepusculeAstro: '2013-03-05T17:35:36Z',
  };
  for (const [cle, iso] of Object.entries(attendus)) {
    assert.ok(t[cle] instanceof Date, `${cle} doit etre une date`);
    const e = ecartMinutes(t[cle], iso);
    assert.ok(e < 1, `${cle} : ecart ${e.toFixed(2)} min avec ${iso}`);
  }
});

test('positionLune reproduit la reference SunCalc', () => {
  const m = positionLune(DATE, LAT, LON);
  const azAttendu = (-0.9783999522438226 * 180 / Math.PI + 180 + 360) % 360;
  // ⚠ 0.014551482... est l'altitude APRES correction de refraction, celle
  // que renvoie SunCalc actuel. L'ancienne valeur 0.006969... datait d'avant
  // l'ajout de cette correction : la reprendre faisait echouer a tort.
  const hAttendue = 0.014551482243892251 * 180 / Math.PI;
  assert.ok(Math.abs(m.azimut - azAttendu) < 0.01, `azimut ${m.azimut}`);
  assert.ok(Math.abs(m.hauteur - hAttendue) < 0.01, `hauteur ${m.hauteur}`);
  assert.ok(Math.abs(m.distance - 364121.37) < 1, `distance ${m.distance}`);
});

test('illuminationLune reproduit la reference SunCalc', () => {
  const i = illuminationLune(DATE);
  assert.ok(Math.abs(i.fraction - 0.4848068202456373) < 1e-6, `fraction ${i.fraction}`);
  assert.ok(Math.abs(i.phase - 0.7548368838538762) < 1e-6, `phase ${i.phase}`);
  assert.equal(typeof i.nom, 'string');
});

test('nuit polaire et soleil de minuit renvoient null, sans exception', () => {
  // Au-dela du cercle polaire en plein hiver, il n'y a ni lever ni coucher.
  const t = heuresSolaires(new Date('2013-12-21T00:00:00Z'), 78.2, 15.6);
  assert.equal(t.lever, null, 'pas de lever au Svalbard en decembre');
  assert.equal(t.coucher, null, 'pas de coucher non plus');
  assert.ok(t.midiSolaire instanceof Date, 'le midi solaire reste defini');
});

test('longueurOmbre : null sous l horizon, 1 a 45 degres', () => {
  assert.equal(longueurOmbre(-5), null, 'pas d ombre sans soleil');
  assert.equal(longueurOmbre(0), null, 'soleil rasant : pas de valeur finie');
  assert.ok(Math.abs(longueurOmbre(45) - 1) < 1e-9, 'a 45 degres, ombre = hauteur');
  assert.ok(longueurOmbre(10) > longueurOmbre(60), 'soleil bas = ombre longue');
});

test('qualiteLumiere nomme les regimes de lumiere', () => {
  assert.equal(qualiteLumiere(-20).cle, 'nuit');
  assert.equal(qualiteLumiere(-15).cle, 'astro');
  assert.equal(qualiteLumiere(-9).cle, 'nautique');
  assert.equal(qualiteLumiere(-3).cle, 'civil');
  assert.equal(qualiteLumiere(3).cle, 'doree');
  assert.equal(qualiteLumiere(45).cle, 'plein');
  assert.equal(qualiteLumiere(NaN).cle, 'inconnu');
});

test('cardinal couvre les 16 secteurs sans trou', () => {
  assert.equal(cardinal(0), 'N');
  assert.equal(cardinal(90), 'E');
  assert.equal(cardinal(180), 'S');
  assert.equal(cardinal(270), 'O');
  assert.equal(cardinal(359), 'N', 'le tour se referme');
  assert.equal(cardinal(-90), 'O', 'les angles negatifs sont normalises');
  assert.equal(cardinal(NaN), '—');
});

test('conversions julien aller-retour', () => {
  const d = new Date('2026-09-21T01:53:00Z');
  const rt = depuisJulien(versJulien(d));
  assert.ok(Math.abs(rt.getTime() - d.getTime()) < 1, 'aller-retour sans derive');
});

test('entrees invalides : null plutot qu exception', () => {
  assert.equal(positionSoleil(DATE, NaN, LON), null);
  assert.equal(positionSoleil(new Date('nope'), LAT, LON), null);
  assert.equal(heuresSolaires(DATE, undefined, LON), null);
  assert.equal(positionLune(DATE, LAT, null), null);
  assert.equal(illuminationLune('pas une date'), null);
});

test('coordonnees du lien fourni (Floride) : coherentes', () => {
  // https://www.suncalc.org/#/27.0693,-81.4578,3/2026.09.21/01:53/1/3
  const t = heuresSolaires(new Date('2026-09-21T12:00:00Z'), 27.0693, -81.4578);
  assert.ok(t.lever instanceof Date && t.coucher instanceof Date);
  assert.ok(t.coucher > t.lever, 'le coucher suit le lever');
  const duree = (t.coucher - t.lever) / 3600000;
  // A l'equinoxe, le jour dure ~12 h a toute latitude.
  assert.ok(duree > 11.5 && duree < 12.5, `duree du jour ${duree.toFixed(2)} h`);
});
