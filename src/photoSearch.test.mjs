// src/photoSearch.test.mjs — lecture des coordonnées GPS EXIF (pur).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dmsVersDecimal,
  extraireGpsExif,
  lireIFD,
  trouverBlocExif,
} from './photoSearch.js';

/**
 * Fabrique un faux JPEG muni d'un bloc EXIF TIFF (IFD0 + ExifIFD + GPS IFD).
 * Écrit en little-endian, comme la quasi-totalité des appareils.
 */
function fabriquerExif({ latDms = [43, 24, 0], latRef = 'N', lonDms = [3, 41, 0], lonRef = 'E', alt = [12, 1] } = {}) {
  // ——— construction du TIFF (on assemble en mémoire) ———
  const morceaux = [];
  let pos = 0; // position absolue depuis le début du TIFF
  const u8 = (v) => { morceaux.push(Buffer.from([v & 0xff])); pos += 1; };
  const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v); morceaux.push(b); pos += 2; };
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); morceaux.push(b); pos += 4; };
  const str = (s) => { for (const c of s) u8(c.charCodeAt(0)); u8(0); };
  const rationnel = (v) => {
    // entier + dénominateur 1 000 000 pour garder de la précision
    u32(Math.round(v * 1_000_000)); u32(1_000_000);
  };

  // en-tête TIFF : « II » puis 42 puis offset de l'IFD0
  // (debutTiff doit être relevé AVANT : les offsets EXIF sont relatifs à lui)
  const debutTiff = pos;
  u8(0x49); u8(0x49); u16(42); u32(8); // IFD0 à l'offset 8

  // trous à remplir plus tard : on note les positions
  const trous = {};
  // IFD0 : 2 entrées (ExifIFD vers l'IFD exif, GPS vers l'IFD GPS)
  const debutIFD0 = pos;
  u16(2);
  u16(0x8769); u16(4); u32(1); trous.exif = pos; u32(0);      // ExifIFDPointer
  u16(0x8825); u16(4); u32(1); trous.gps = pos; u32(0);        // GPSInfoIFDPointer
  u32(0);                                                      // IFD suivante
  const finIFD0 = pos;

  // IFD GPS : 5 entrées (refs + DMS + altitude)
  const debutGPS = pos;
  u16(5);
  u16(1); u16(2); u32(2); morceaux.push(Buffer.from(`${latRef}\0`, 'ascii')); pos += 2; u16(0);
  u16(2); u16(5); u32(3); trous.lat = pos; u32(0);
  u16(3); u16(2); u32(2); morceaux.push(Buffer.from(`${lonRef}\0`, 'ascii')); pos += 2; u16(0);
  u16(4); u16(5); u32(3); trous.lon = pos; u32(0);
  u16(6); u16(5); u32(1); trous.alt = pos; u32(0);
  u32(0);
  const finGPS = pos;

  // zone de données : 3 rationnels + 3 rationnels + 1 rationnel
  const zoneLat = pos; for (const v of latDms) rationnel(v);
  const zoneLon = pos; for (const v of lonDms) rationnel(v);
  const zoneAlt = pos; rationnel(alt[0] / alt[1]);
  const finTiff = pos;

  // IFD Exif (juste après) : 1 entrée DateTimeOriginal
  const debutExif = pos;
  u16(1);
  u16(0x9003); u16(2); u32(20); trous.date = pos; u32(0);
  u32(0);
  const zoneDate = pos; str('2024:07:14 18:22:03');

  const tiff = Buffer.concat(morceaux);
  // on recale les offsets (relatifs au début du TIFF)
  tiff.writeUInt32LE(debutIFD0 - debutTiff, 4);
  tiff.writeUInt32LE(debutExif - debutTiff, trous.exif);
  tiff.writeUInt32LE(debutGPS - debutTiff, trous.gps);
  tiff.writeUInt32LE(zoneLat - debutTiff, trous.lat);
  tiff.writeUInt32LE(zoneLon - debutTiff, trous.lon);
  tiff.writeUInt32LE(zoneAlt - debutTiff, trous.alt);
  tiff.writeUInt32LE(zoneDate - debutTiff, trous.date);
  void finIFD0; void finGPS; void finTiff;

  // en-tête JPEG + marqueur APP1 « Exif\0\0 »
  const entete = Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1]),
    (() => { const l = Buffer.alloc(2); l.writeUInt16BE(tiff.length + 8); return l; })(),
    Buffer.from('Exif\0\0', 'ascii'),
  ]);
  return Buffer.concat([entete, tiff]);
}

function tamponDe(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

test('dms → décimal, hémisphères N/E positifs', () => {
  assert.equal(dmsVersDecimal([43, 24, 0], 'N').toFixed(5), '43.40000');
  assert.equal(dmsVersDecimal([3, 41, 24], 'E').toFixed(5), '3.69000');
});

test('dms → décimal, hémisphères S/W négatifs', () => {
  assert.equal(dmsVersDecimal([33, 52, 12], 'S').toFixed(5), '-33.87000');
  assert.equal(dmsVersDecimal([122, 24, 0], 'W').toFixed(5), '-122.40000');
});

test('dms → décimal : entrée invalide rend null', () => {
  assert.equal(dmsVersDecimal([1, 2], 'N'), null);
  assert.equal(dmsVersDecimal(null, 'N'), null);
  assert.equal(dmsVersDecimal([1, 2, Number.NaN], 'N'), null);
});

test('trouverBlocExif repère l’en-tête TIFF après « Exif\\0\\0 »', () => {
  const buf = fabriquerExif();
  const dv = new DataView(tamponDe(buf));
  const i = trouverBlocExif(tamponDe(buf));
  assert.ok(i > 0, 'bloc trouvé');
  // « II » puis 42
  assert.equal(dv.getUint16(i, false), 0x4949);
  assert.equal(dv.getUint16(i + 2, true), 42);
});

test('trouverBlocExif rend -1 sur un fichier sans EXIF', () => {
  const vide = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(64), Buffer.from([0xff, 0xd9])]);
  assert.equal(trouverBlocExif(tamponDe(vide)), -1);
});

test('lireIFD expose les tags IFD0', () => {
  const buf = fabriquerExif();
  const dv = new DataView(tamponDe(buf));
  const debut = trouverBlocExif(tamponDe(buf));
  const { little, entrees } = lireIFD(dv, debut);
  assert.equal(little, true);
  assert.ok(entrees.has(0x8825), 'pointeur GPS présent');
  assert.ok(entrees.has(0x8769), 'pointeur Exif présent');
});

test('extraireGpsExif lit latitude, longitude, altitude et date', () => {
  const buf = fabriquerExif({ latDms: [43, 24, 0], lonDms: [3, 41, 24], alt: [37, 1] });
  const g = extraireGpsExif(tamponDe(buf));
  assert.ok(g, 'GPS extrait');
  assert.ok(Math.abs(g.lat - 43.4) < 1e-6, `lat=${g.lat}`);
  assert.ok(Math.abs(g.lon - 3.69) < 1e-6, `lon=${g.lon}`);
  assert.ok(Math.abs(g.alt - 37) < 1e-3, `alt=${g.alt}`);
  assert.equal(g.date, '2024:07:14 18:22:03');
});

test('extraireGpsExif gère les coordonnées sud/ouest', () => {
  const buf = fabriquerExif({
    latDms: [33, 52, 12], latRef: 'S', lonDms: [70, 40, 0], lonRef: 'W', alt: [520, 1],
  });
  const g = extraireGpsExif(tamponDe(buf));
  assert.ok(Math.abs(g.lat + 33.87) < 1e-6, `lat=${g.lat}`);
  assert.ok(Math.abs(g.lon + 70.6666667) < 1e-6, `lon=${g.lon}`);
  assert.ok(Math.abs(g.alt - 520) < 1e-3);
});

test('extraireGpsExif rend null sans bloc EXIF ni buffer trop court', () => {
  assert.equal(extraireGpsExif(null), null);
  assert.equal(extraireGpsExif(new ArrayBuffer(4)), null);
  const sansExif = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(600), Buffer.from([0xff, 0xd9])]);
  assert.equal(extraireGpsExif(tamponDe(sansExif)), null);
});
