// src/streetView.test.mjs — recherche de photos de rue libres (partie pure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTANCES, dateDeItem, imageDeItem, urlRecherche } from './streetView.js';

test('URL de recherche : bbox centrée sur le point, limite demandée', () => {
  const u = new URL(urlRecherche('https://api.panoramax.xyz/api/search', 3.6904, 43.4004, 400, 5));
  assert.equal(u.searchParams.get('limit'), '5');
  const [w, s, e, n] = u.searchParams.get('bbox').split(',').map(Number);
  assert.ok(w < 3.6904 && e > 3.6904, 'longitude encadrée');
  assert.ok(s < 43.4004 && n > 43.4004, 'latitude encadrée');
  // 400 m de rayon ≈ 0,0036° de latitude
  assert.ok(Math.abs(n - s - 0.00719) < 0.001, `hauteur bbox=${n - s}`);
});

test('la bbox reste cohérente près des pôles (cosinus planché)', () => {
  const u = new URL(urlRecherche('https://x/api/search', 10, 78, 400, 1));
  const [w, , e] = u.searchParams.get('bbox').split(',').map(Number);
  assert.ok(e > w, 'bbox valide même à haute latitude');
});

test('au moins deux instances Panoramax (monde + France)', () => {
  assert.ok(INSTANCES.length >= 2);
  for (const i of INSTANCES) assert.match(i.url, /^https:\/\//);
  assert.ok(INSTANCES.some((i) => /ign/.test(i.url)), 'instance IGN disponible');
});

test('image d’un item STAC : hd d’abord, puis preview, puis thumb', () => {
  const item = {
    assets: { thumb: { href: 'https://x/t.jpg' }, preview: { href: 'https://x/p.jpg' }, hd: { href: 'https://x/hd.jpg' } },
    properties: { datetime: '2023-06-01T10:00:00Z' },
  };
  assert.equal(imageDeItem(item), 'https://x/hd.jpg');
  delete item.assets.hd;
  assert.equal(imageDeItem(item), 'https://x/p.jpg');
  delete item.assets.preview;
  assert.equal(imageDeItem(item), 'https://x/t.jpg');
});

test('image d’un item : repli sur properties.preview, sinon null', () => {
  assert.equal(imageDeItem({ properties: { preview: 'https://x/p.jpg' } }), 'https://x/p.jpg');
  assert.equal(imageDeItem({}), null);
  assert.equal(imageDeItem(null), null);
  assert.equal(imageDeItem({ assets: { hd: { href: 'ftp://x/y' } } }), null, 'protocole refusé');
});

test('date d’un item STAC au format français', () => {
  assert.equal(dateDeItem({ properties: { datetime: '2023-06-01T10:00:00Z' } }), '01/06/2023');
  assert.equal(dateDeItem({ properties: {} }), '');
  assert.equal(dateDeItem({}), '');
  assert.equal(dateDeItem({ properties: { datetime: 'pas une date' } }), '');
});
