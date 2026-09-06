// src/data/volVues.test.mjs — vues de caméra du mode vol (POV / VTOL / 3ᵉ personne).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_MAX, SITE_MIN, TPS_DEFAUT, VUES_VOL, ajusterDistance, bornerSite,
  cameraTroisiemePersonne, normaliserCap, orientationCamera, translationVtol,
} from './volVues.js';

const TAU = Math.PI * 2;
const proche = (a, b, m = 1e-6) => Math.abs(a - b) < m;

test('les trois vues sont exposées dans l’ordre POV → VTOL → 3ᵉ personne', () => {
  assert.deepEqual(VUES_VOL.map((v) => v.cle), ['pov', 'vtol', 'tps']);
  for (const v of VUES_VOL) assert.ok(v.ic && v.nom && v.aide);
});

test('le lacet de la nacelle reste dans [0, 2π[ même après plusieurs tours', () => {
  assert.ok(proche(normaliserCap(0), 0));
  assert.ok(proche(normaliserCap(TAU + 1), 1));
  assert.ok(proche(normaliserCap(-1), TAU - 1));
  assert.ok(proche(normaliserCap(-10 * TAU - 0.5), TAU - 0.5));
  assert.equal(normaliserCap(NaN), 0);
});

test('le site de la nacelle est borné (on ne regarde pas à travers le sol)', () => {
  assert.equal(bornerSite(99), SITE_MAX);
  assert.equal(bornerSite(-99), SITE_MIN);
  assert.equal(bornerSite(0.2), 0.2);
  assert.equal(bornerSite(NaN), 0);
  assert.ok(SITE_MIN < 0 && SITE_MAX > 0);
});

test('en POV la nacelle n’altère pas l’orientation', () => {
  const o = orientationCamera({ cap: 1, tangage: -0.2 }, { cap: 0, tangage: 0 });
  assert.ok(proche(o.cap, 1));
  assert.ok(proche(o.tangage, -0.2));
});

test('la nacelle s’ajoute au cap de l’appareil et tourne sur 360°', () => {
  // demi-tour de nacelle : on regarde derrière sans que l'appareil ne pivote
  const o = orientationCamera({ cap: 0.4, tangage: 0 }, { cap: Math.PI, tangage: 0 });
  assert.ok(proche(o.cap, 0.4 + Math.PI));
  // un tour complet revient au point de départ
  assert.ok(proche(orientationCamera({ cap: 0.4 }, { cap: TAU }).cap, 0.4));
});

test('la nacelle peut regarder le sol (site négatif) sans dépasser la borne', () => {
  const o = orientationCamera({ cap: 0, tangage: 0 }, { cap: 0, tangage: -3 });
  assert.equal(o.tangage, SITE_MIN);
});

test('3ᵉ personne : la caméra recule DERRIÈRE l’appareil', () => {
  // appareil plein nord (cap 0) → la caméra doit être au SUD (latitude plus basse)
  const c = cameraTroisiemePersonne({ lon: 3.69, lat: 43.44, alt: 300, cap: 0 }, { distance: 100, hauteur: 10 });
  assert.ok(c.lat < 43.44, 'la caméra doit être au sud de l’appareil');
  assert.ok(proche(c.lon, 3.69, 1e-9), 'pas de décalage en longitude');
  assert.ok(proche(c.alt, 310));
  assert.ok(proche(c.cap, 0));
});

test('3ᵉ personne : cap à l’est → la caméra se met à l’ouest', () => {
  const c = cameraTroisiemePersonne({ lon: 3.69, lat: 43.44, alt: 300, cap: Math.PI / 2 }, { distance: 100, hauteur: 0 });
  assert.ok(c.lon < 3.69);
  assert.ok(proche(c.lat, 43.44, 1e-9));
});

test('3ᵉ personne : la distance est bornée', () => {
  const proche2 = cameraTroisiemePersonne({ lat: 0, lon: 0, alt: 0, cap: 0 }, { distance: 5 });
  const loin = cameraTroisiemePersonne({ lat: 0, lon: 0, alt: 0, cap: 0 }, { distance: 9999 });
  assert.ok(proche2.lat > cameraTroisiemePersonne({ lat: 0, lon: 0, alt: 0, cap: 0 }, { distance: TPS_DEFAUT.min }).lat - 1e-9);
  assert.ok(Math.abs(loin.lat) <= (TPS_DEFAUT.max / 111320) + 1e-9);
});

test('translation VTOL : avant suit le cap de l’appareil, pas celui de la nacelle', () => {
  // cap nord : avancer augmente la latitude quelle que soit la nacelle
  const t = translationVtol({ lat: 43.44, lon: 3.69, cap: 0 }, { avant: 1, cote: 0, pas: 111.32 });
  assert.ok(proche(t.lat, 43.441, 1e-6));
  assert.ok(proche(t.lon, 3.69, 1e-9));
});

test('translation VTOL : latéral droite part à l’est quand on vise le nord', () => {
  const t = translationVtol({ lat: 43.44, lon: 3.69, cap: 0 }, { avant: 0, cote: 1, pas: 111.32 });
  assert.ok(t.lon > 3.69);
  assert.ok(proche(t.lat, 43.44, 1e-6));
});

test('translation VTOL : sans commande, aucun mouvement', () => {
  const t = translationVtol({ lat: 43.44, lon: 3.69, cap: 1.2 }, {});
  assert.ok(proche(t.lat, 43.44) && proche(t.lon, 3.69));
});

test('distance de caméra : [ / ] ajustent sans sortir des bornes', () => {
  assert.equal(ajusterDistance(42, 10), 52);
  assert.equal(ajusterDistance(42, -100), TPS_DEFAUT.min);
  assert.equal(ajusterDistance(200, 999), TPS_DEFAUT.max);
  assert.ok(TPS_DEFAUT.min > 0 && TPS_DEFAUT.max > TPS_DEFAUT.min);
});
