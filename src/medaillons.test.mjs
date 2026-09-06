/**
 * Tests — MÉDAILLONS DE LIEU (hiérarchie, niveaux, voisinage).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIBELLES,
  NIVEAUX,
  hierarchieDeReponse,
  niveauSelonAltitude,
  voisins,
} from './medaillons.js';

test('la hiérarchie va du pays au quartier et chaque niveau a un libellé', () => {
  assert.deepEqual(NIVEAUX, ['pays', 'region', 'departement', 'commune', 'quartier']);
  for (const n of NIVEAUX) assert.ok(LIBELLES[n], `libellé manquant pour ${n}`);
});

test('le niveau se déduit de l’altitude : plus on monte, plus c’est vaste', () => {
  assert.equal(niveauSelonAltitude(20_000_000), 'pays');
  assert.equal(niveauSelonAltitude(400_000), 'region');
  assert.equal(niveauSelonAltitude(60_000), 'departement');
  assert.equal(niveauSelonAltitude(12_000), 'commune');
  assert.equal(niveauSelonAltitude(300), 'quartier');
  assert.equal(niveauSelonAltitude(0), 'quartier');
});

test('une altitude invalide ne casse pas le niveau', () => {
  for (const v of [NaN, undefined, null, -5, 'x']) {
    assert.equal(niveauSelonAltitude(v), 'quartier', `pour ${String(v)}`);
  }
});

test('monter et descendre restent dans la hiérarchie', () => {
  assert.deepEqual(voisins('pays'), { courant: 'pays', monter: null, descendre: 'region' });
  assert.deepEqual(voisins('region').monter, 'pays');
  assert.deepEqual(voisins('region').descendre, 'departement');
  assert.deepEqual(voisins('quartier'), { courant: 'quartier', monter: 'commune', descendre: null });
  assert.deepEqual(voisins('inconnu'), { courant: null, monter: null, descendre: null });
});

test('une adresse Nominatim devient une hiérarchie complète', () => {
  const h = hierarchieDeReponse({
    country: 'France',
    state: 'Occitanie',
    county: 'Hérault',
    city: 'Frontignan',
    suburb: 'La Peyrade',
    display_name: 'La Peyrade, Frontignan, Hérault, Occitanie, France',
  });
  assert.equal(h.pays, 'France');
  assert.equal(h.region, 'Occitanie');
  assert.equal(h.departement, 'Hérault');
  assert.equal(h.commune, 'Frontignan');
  assert.equal(h.quartier, 'La Peyrade');
  assert.match(h.complet, /Frontignan/);
});

test('Nominatim écrit parfois « town » ou « village » à la place de « city »', () => {
  assert.equal(hierarchieDeReponse({ town: 'Sète' }).commune, 'Sète');
  assert.equal(hierarchieDeReponse({ village: 'Balaruc' }).commune, 'Balaruc');
  assert.equal(hierarchieDeReponse({ hamlet: 'Le Mourre' }).commune, 'Le Mourre');
  assert.equal(hierarchieDeReponse({ state_district: 'Hérault' }).departement, 'Hérault');
  assert.equal(hierarchieDeReponse({ neighbourhood: 'Centre' }).quartier, 'Centre');
});

test('une réponse vide ne fabrique rien (traçabilité)', () => {
  const h = hierarchieDeReponse(null);
  assert.equal(h.pays, '');
  assert.equal(h.commune, '');
  assert.equal(h.quartier, '');
  assert.equal(Object.values(h).filter(Boolean).length, 0, 'aucun champ inventé');
});
