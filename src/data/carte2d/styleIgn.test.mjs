import test from 'node:test';
import assert from 'node:assert/strict';
import { FONDS_IGN, WMTS_IGN, ATTRIBUTION_IGN, urlTuileWmts, styleMapLibre, listerFonds } from './styleIgn.js';

test('les fonds MapLibre reprennent les identifiants de displayOptions', () => {
  for (const id of ['ign-plan', 'ign-ortho', 'ign-1950', 'ign-topo']) {
    assert.ok(FONDS_IGN[id], `${id} disponible en 2D comme en 3D`);
    assert.ok(FONDS_IGN[id].couche && FONDS_IGN[id].format && FONDS_IGN[id].libelle);
  }
});

test('l URL WMTS porte tous les parametres requis', () => {
  const u = urlTuileWmts('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png');
  assert.ok(u.startsWith(WMTS_IGN), 'pointe sur la Geoplateforme');
  for (const p of ['SERVICE=WMTS', 'REQUEST=GetTile', 'VERSION=1.0.0', 'STYLE=normal', 'TILEMATRIXSET=PM']) {
    assert.ok(u.includes(p), `contient ${p}`);
  }
  assert.match(u, /LAYER=GEOGRAPHICALGRIDSYSTEMS\.PLANIGNV2/);
});

test('les gabarits de tuile restent litteraux et non encodes', () => {
  const u = urlTuileWmts('X', 'image/png');
  // Piege classique : URLSearchParams encoderait { et } en %7B / %7D.
  assert.ok(u.includes('TILEMATRIX={z}'), 'z litteral');
  assert.ok(u.includes('TILEROW={y}'), 'y litteral');
  assert.ok(u.includes('TILECOL={x}'), 'x litteral');
  assert.ok(!u.includes('%7B') && !u.includes('%7D'), 'aucune accolade encodee');
});

test('le style produit est un style MapLibre v8 valide', () => {
  const s = styleMapLibre('ign-ortho');
  assert.equal(s.version, 8);
  assert.ok(s.sources['ign-ortho'], 'source nommee comme le fond');
  assert.equal(s.sources['ign-ortho'].type, 'raster');
  assert.ok(Array.isArray(s.sources['ign-ortho'].tiles) && s.sources['ign-ortho'].tiles.length === 1);
  assert.equal(s.layers.length, 1);
  assert.equal(s.layers[0].source, 'ign-ortho');
  assert.equal(s.layers[0].type, 'raster');
});

test('l attribution IGN est portee par chaque source', () => {
  const s = styleMapLibre('ign-plan', { cadastre: true });
  for (const src of Object.values(s.sources)) {
    assert.equal(src.attribution, ATTRIBUTION_IGN, 'Licence Ouverte respectee');
  }
});

test('le cadastre se superpose sans masquer le fond', () => {
  const s = styleMapLibre('ign-ortho', { cadastre: true });
  assert.equal(Object.keys(s.sources).length, 2);
  assert.equal(s.layers.length, 2);
  assert.equal(s.layers[0].source, 'ign-ortho', 'le fond est dessous');
  assert.equal(s.layers[1].source, 'ign-cadastre', 'les parcelles au-dessus');
  assert.ok(s.layers[1].paint['raster-opacity'] < 1, 'parcelles semi-transparentes');
});

test('le cadastre ne se superpose pas a lui-meme', () => {
  const s = styleMapLibre('ign-cadastre', { cadastre: true });
  assert.equal(s.layers.length, 1, 'pas de doublon');
});

test('un fond inconnu retombe sur le plan IGN', () => {
  for (const mauvais of ['inexistant', '', null, undefined, 42]) {
    const s = styleMapLibre(mauvais);
    assert.ok(s.sources['ign-plan'], `${mauvais} => plan IGN`);
    assert.equal(s.version, 8);
  }
});

test('chaque fond declare un zoom maximal credible', () => {
  for (const [id, f] of Object.entries(FONDS_IGN)) {
    assert.ok(f.zoomMax >= 15 && f.zoomMax <= 22, `${id} zoomMax ${f.zoomMax}`);
    assert.equal(styleMapLibre(id).sources[id].maxzoom, f.zoomMax, `${id} propage son zoomMax`);
  }
});

test('listerFonds alimente le selecteur d interface', () => {
  const l = listerFonds();
  assert.equal(l.length, Object.keys(FONDS_IGN).length);
  assert.ok(l.every((f) => f.id && f.libelle), 'tous nommes en francais');
  assert.ok(l.some((f) => f.libelle.includes('Remonter le temps')), 'archives 1950 proposees');
});
