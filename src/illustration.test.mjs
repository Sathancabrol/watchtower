// src/illustration.test.mjs — illustration de la fiche (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CADRAGES_DRONE,
  imageDeInfo,
  nettoyerHtml,
  titresDeGeosearch,
  titresDeRecherche,
  urlGeosearch,
  urlImageInfo,
  urlRechercheNom,
} from './illustration.js';

test('URL de géorecherche Commons : coordonnées, rayon, origine CORS', () => {
  const u = new URL(urlGeosearch(43.4004, 3.6904, 2500));
  assert.equal(u.searchParams.get('list'), 'geosearch');
  assert.equal(u.searchParams.get('gscoord'), '43.4004|3.6904');
  assert.equal(u.searchParams.get('gsradius'), '2500');
  assert.equal(u.searchParams.get('gsnamespace'), '6');
  assert.equal(u.searchParams.get('origin'), '*');
});

test('le rayon est borné entre 100 m et 10 km (protection de la source)', () => {
  const petit = new URL(urlGeosearch(0, 0, 1));
  const grand = new URL(urlGeosearch(0, 0, 999_999));
  assert.equal(petit.searchParams.get('gsradius'), '100');
  assert.equal(grand.searchParams.get('gsradius'), '10000');
});

test('URL imageinfo : vignette demandée à la bonne largeur', () => {
  const u = new URL(urlImageInfo('File:Ma photo.jpg', 720));
  assert.equal(u.searchParams.get('titles'), 'File:Ma photo.jpg');
  assert.equal(u.searchParams.get('prop'), 'imageinfo');
  assert.equal(u.searchParams.get('iiurlwidth'), '720');
});

test('URL de recherche par nom : espace de fichiers + origine CORS', () => {
  const u = new URL(urlRechercheNom('Garigue de Frontignan'));
  assert.equal(u.searchParams.get('list'), 'search');
  assert.equal(u.searchParams.get('srnamespace'), '6');
  assert.match(u.searchParams.get('srsearch'), /Garigue/);
});

test('titres géolocalisés : triés du plus proche au plus lointain', () => {
  const json = {
    query: {
      geosearch: [
        { title: 'File:Loin.jpg', dist: 900 },
        { title: 'File:Pres.jpg', dist: 40 },
        { title: 'Fichier ignoré', dist: 1 },          // pas un fichier
        { title: 'File:Moyen.jpg', dist: 300 },
      ],
    },
  };
  const t = titresDeGeosearch(json);
  assert.deepEqual(t.map((x) => x.titre), ['File:Pres.jpg', 'File:Moyen.jpg', 'File:Loin.jpg']);
  assert.deepEqual(titresDeGeosearch({}), []);
  assert.deepEqual(titresDeGeosearch(null), []);
});

test('titres d’une recherche texte', () => {
  const json = { query: { search: [{ title: 'File:A.jpg' }, { title: 'File:B.png' }] } };
  assert.equal(titresDeRecherche(json).length, 2);
  assert.equal(titresDeRecherche({}).length, 0);
});

test('imageinfo → vignette, auteur, licence et page du fichier', () => {
  const json = {
    query: {
      pages: {
        123: {
          title: 'File:Garigue.jpg',
          imageinfo: [{
            thumburl: 'https://upload.wikimedia.org/thumb/garigue-720px.jpg',
            url: 'https://upload.wikimedia.org/garigue.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Garigue.jpg',
            mime: 'image/jpeg',
            extmetadata: {
              Artist: { value: '<a href="//x">Jean Dupont</a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          }],
        },
      },
    },
  };
  const i = imageDeInfo(json);
  assert.equal(i.url, 'https://upload.wikimedia.org/thumb/garigue-720px.jpg');
  assert.equal(i.titre, 'Garigue.jpg');
  assert.equal(i.auteur, 'Jean Dupont');
  assert.equal(i.licence, 'CC BY-SA 4.0');
  assert.match(i.page, /commons\.wikimedia\.org/);
});

test('imageinfo : les documents non-image sont écartés', () => {
  const json = { query: { pages: { 1: { imageinfo: [{ mime: 'application/pdf', url: 'x.pdf' }] } } } };
  assert.equal(imageDeInfo(json), null);
  assert.equal(imageDeInfo({}), null);
  assert.equal(imageDeInfo({ query: { pages: {} } }), null);
});

test('nettoyage du HTML des métadonnées', () => {
  assert.equal(nettoyerHtml('<a href="//x">Jean&nbsp;Dupont</a>'), 'Jean Dupont');
  assert.equal(nettoyerHtml('A &amp; B'), 'A & B');
  assert.equal(nettoyerHtml(''), '');
  assert.equal(nettoyerHtml(undefined), '');
  assert.equal(nettoyerHtml('  deux   espaces '), 'deux espaces');
});

test('les cadrages drone couvrent large, approche, ras et piqué', () => {
  assert.equal(CADRAGES_DRONE.length, 4);
  for (const c of CADRAGES_DRONE) {
    assert.ok(c.altitude > 40 && c.altitude < 1000, `${c.cle} altitude`);
    assert.ok(c.tangage < 0 && c.tangage > -80, `${c.cle} tangage (vers le bas)`);
    assert.ok(c.distance > 50, `${c.cle} distance`);
    assert.ok(c.nom && c.cle, `${c.cle} libellé`);
  }
  // le premier cadrage est le plus large, le « ras » le plus bas
  assert.ok(CADRAGES_DRONE[0].altitude > CADRAGES_DRONE[2].altitude);
});
